import 'dotenv/config';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// ---- env --------------------------------------------------------
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const EMBED_MODEL = process.env.OPENAI_EMBED_MODEL || 'text-embedding-3-small'; // 1536 dims
const TABLE = process.env.RAG_TABLE || 'storyboards';
const BATCH = Number(process.env.BACKFILL_BATCH || 25);

// ---- guards -----------------------------------------------------
if (!SUPABASE_URL) throw new Error('SUPABASE_URL/VITE_SUPABASE_URL not set');
if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY not set');
if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set');

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Convert any JSON-ish content into a single text blob
function normalizeContentToText(content: any): string {
  if (content == null) return '';
  if (typeof content === 'string') return content;
  try {
    // prefer common fields if present
    if (content.moduleName || content.pages || content.scenes) {
      return JSON.stringify(content, null, 2);
    }
    return JSON.stringify(content);
  } catch {
    return String(content);
  }
}

async function fetchNullEmbeddingBatch(limit: number) {
  // Pull a small batch with no embeddings yet
  const { data, error } = await supabase
    .from(TABLE)
    .select('id, content')
    .is('embedding', null)
    .limit(limit);

  if (error) throw error;
  return data as Array<{ id: string; content: any }>;
}

async function embedText(text: string): Promise<number[]> {
  // cap size (token/cost safety)
  const snippet = text.length > 8000 ? text.slice(0, 8000) : text;

  // simple retry
  let last: any;
  for (let i = 0; i < 3; i++) {
    try {
      const resp = await openai.embeddings.create({ model: EMBED_MODEL, input: snippet });
      const vec = resp.data[0].embedding as unknown as number[];
      if (!Array.isArray(vec) || vec.length !== 1536) {
        throw new Error(`Embedding dims ${vec?.length} — expected 1536`);
      }
      return vec;
    } catch (e) {
      last = e;
      const wait = 400 * (i + 1);
      console.warn(`⚠️  Embed attempt ${i + 1} failed; retrying in ${wait}ms…`);
      await new Promise(r => setTimeout(r, wait));
    }
  }
  throw last;
}

async function updateRow(id: string, embedding: number[]) {
  const { error } = await supabase
    .from(TABLE)
    .update({ embedding })
    .eq('id', id);
  if (error) throw error;
}

async function main() {
  console.log('▶ Backfill missing embeddings…');
  let totalDone = 0, totalErr = 0;

  while (true) {
    const rows = await fetchNullEmbeddingBatch(BATCH);
    if (!rows || rows.length === 0) break;

    console.log(`\nBatch (${rows.length})…`);
    for (const r of rows) {
      try {
        const text = normalizeContentToText(r.content);
        if (!text.trim()) {
          console.warn(` • ${r.id}: skipped (no text)`);
          totalErr++; continue;
        }
        const vec = await embedText(text);
        await updateRow(r.id, vec);
        console.log(` • ${r.id}: ✅ updated`);
        totalDone++;
      } catch (e: any) {
        console.error(` • ${r.id}: ❌ ${e?.message || e}`);
        totalErr++;
      }
      // tiny pause to be polite
      await new Promise(r => setTimeout(r, 80));
    }
  }

  console.log('\n========================');
  console.log(`Backfill complete. Updated: ${totalDone} | Errors: ${totalErr}`);
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});