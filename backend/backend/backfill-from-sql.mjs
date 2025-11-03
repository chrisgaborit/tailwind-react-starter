// backfill-from-sql.mjs
import 'dotenv/config';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !OPENAI_API_KEY) {
  console.error('Missing env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

async function embed(text) {
  const input = (text || '').slice(0, 8000);
  const resp = await openai.embeddings.create({ model: 'text-embedding-3-small', input });
  return resp.data[0].embedding;
}

function parseMaybeJson(v) {
  if (v == null) return null;
  if (typeof v === 'string') { try { return JSON.parse(v); } catch { return null; } }
  return v; // already an object (jsonb from Supabase SDK comes back as object)
}

async function run() {
  console.log('🔎 Reading storyboards to backfill…');

  const PAGE = 200;
  let offset = 0;
  let total = 0;

  while (true) {
    // pull ALL likely columns so we can adapt to your schema
    const { data, error } = await supabase
      .from('storyboards')
      .select('id, title, content, json, json_raw')
      .order('created_at', { ascending: true })
      .range(offset, offset + PAGE - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    for (const row of data) {
      const payloadObj =
        parseMaybeJson(row.content) ??
        parseMaybeJson(row.json) ??
        parseMaybeJson(row.json_raw);

      if (!payloadObj) {
        console.warn(`⚠️  Skipping ${row.id} (no JSON in content/json/json_raw)`);
        continue;
      }

      const textForEmbedding = JSON.stringify(payloadObj);
      const vector = await embed(textForEmbedding);

      const { error: upErr } = await supabase
        .from('rag_storyboards')
        .upsert(
          {
            id: row.id,                       // keep same UUID for joins
            title: row.title ?? 'Untitled',
            tags: [],
            level: null,
            content: payloadObj,              // jsonb
            embedding: vector,                // vector(1536)
          },
          { onConflict: 'id' }
        );

      if (upErr) {
        console.error('❌ Insert failed for', row.id, upErr);
      } else {
        total += 1;
      }
    }

    offset += data.length;
    if (data.length < PAGE) break;
  }

  console.log(`✅ Backfill complete. Upserted/updated ${total} rows in rag_storyboards.`);
}

run().catch((e) => { console.error('Backfill error:', e); process.exit(1); });