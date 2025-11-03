// backend/scripts/ingestStoryboards.ts
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';            // .docx -> text
import pdfParse from 'pdf-parse';         // .pdf  -> text

// ✅ Globby compatibility (works across v11–v14)
import * as globbyMod from 'globby';
const globby =
  // ESM named export (v13+)
  (globbyMod as any).globby ||
  // default export (older)
  (globbyMod as any).default ||
  // fallback
  (globbyMod as any);

import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

/* -----------------------------------------------------------------------------
   ENV / CONFIG
 ----------------------------------------------------------------------------- */
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const EMBED_MODEL = process.env.OPENAI_EMBED_MODEL || 'text-embedding-3-small'; // 1536 dims
const TABLE = process.env.RAG_TABLE || 'storyboards';
const MAX_CHARS = Number(process.env.INGEST_MAX_CHARS || 8000); // safety cap per doc

if (!SUPABASE_URL) {
  console.error('❌ SUPABASE_URL (or VITE_SUPABASE_URL) is not set.');
  process.exit(1);
}
if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not set.');
  process.exit(1);
}
if (!OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY is not set.');
  process.exit(1);
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/* -----------------------------------------------------------------------------
   EXPECTED TABLE (matches your current schema)
     id               uuid              default gen_random_uuid()
     content          jsonb             -- we will store { filename, text }
     embedding        vector(1536)
     tags             text[]            (optional)
     level            integer           (optional)
     is_best_example  boolean           (optional)
     created_by       text              (optional)
 ----------------------------------------------------------------------------- */

/* -----------------------------------------------------------------------------
   HELPERS
 ----------------------------------------------------------------------------- */
function trunc(s: string, max = MAX_CHARS) {
  return s.length > max ? s.slice(0, max) : s;
}

async function extractText(file: string): Promise<string> {
  const ext = path.extname(file).toLowerCase();
  try {
    if (ext === '.docx') {
      const buf = fs.readFileSync(file);
      const res = await mammoth.extractRawText({ buffer: buf });
      return (res.value || '').trim();
    }
    if (ext === '.pdf') {
      const buf = fs.readFileSync(file);
      const res = await pdfParse(buf);
      return (res.text || '').trim();
    }
    // Fallback: treat as plain text/markdown
    return fs.readFileSync(file, 'utf8');
  } catch (e) {
    console.error(`   ❌ Failed to read ${path.basename(file)} — ${String((e as any)?.message || e)}`);
    return '';
  }
}

async function embed(text: string): Promise<number[]> {
  // Basic backoff for transient errors
  const attempts = 3;
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      const resp = await openai.embeddings.create({ model: EMBED_MODEL, input: text });
      return resp.data[0].embedding as unknown as number[];
    } catch (e) {
      lastErr = e;
      const wait = 500 * (i + 1);
      console.warn(`   ⚠️ Embedding attempt ${i + 1} failed, retrying in ${wait}ms…`);
      await new Promise(r => setTimeout(r, wait));
    }
  }
  throw lastErr;
}

/* -----------------------------------------------------------------------------
   UPSERT ONE FILE
 ----------------------------------------------------------------------------- */
async function upsertOne(file: string) {
  const name = path.basename(file);
  console.log(`→ Processing: ${name}`);

  const raw = await extractText(file);
  const cleaned = (raw || '')
    .replace(/\s+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (!cleaned) {
    console.warn(`   ⚠️  Skipping: ${name} — no extractable text.`);
    return { ok: false as const, reason: 'empty' as const };
  }

  const snippet = trunc(cleaned, MAX_CHARS); // keep token/cost sane
  let vec: number[];
  try {
    vec = await embed(snippet);
  } catch (e) {
    console.error(`   ❌ Embedding error: ${(e as any)?.message || e}`);
    return { ok: false as const, reason: 'embed' as const };
  }

  // Safety check: ensure 1536 dims (matches text-embedding-3-small)
  if (!Array.isArray(vec) || vec.length !== 1536) {
    console.error(`   ❌ Embedding dims ${vec?.length} — expected 1536`);
    return { ok: false as const, reason: 'dims' as const };
  }

  // 🔸 Insert JSONB into `content`, no `title` column in your table
  const payload = {
    content: { filename: name, text: snippet },  // jsonb
    embedding: vec as unknown as any,            // pgvector(1536)
    tags: ['legacy', 'storyboard'] as string[],  // optional
  };

  const { error } = await supabase.from(TABLE).insert(payload);
  if (error) {
    console.error(`Supabase insert error: ${error.message}`);
    return { ok: false as const, reason: 'supabase' as const };
  }

  console.log(`   ✅ Ingested: ${name}`);
  return { ok: true as const };
}

/* -----------------------------------------------------------------------------
   MAIN
 ----------------------------------------------------------------------------- */
async function main() {
  const dir = process.argv[2];
  if (!dir) {
    console.error('Usage:\n  DOTENV_CONFIG_PATH=backend/.env npx ts-node -r dotenv/config backend/scripts/ingestStoryboards.ts "/path/to/folder"');
    process.exit(1);
  }

  // Find files (docx, pdf, txt, md)
  const patterns = [
    path.join(dir, '**/*.docx'),
    path.join(dir, '**/*.pdf'),
    path.join(dir, '**/*.txt'),
    path.join(dir, '**/*.md'),
  ];
  const files: string[] = await globby(patterns, { absolute: true });
  console.log(`Found ${files.length} files. Starting ingestion...\n`);

  let ok = 0, fail = 0;
  for (const f of files) {
    const res = await upsertOne(f);
    if (res.ok) ok++; else fail++;
  }

  console.log('\n========================');
  console.log(`✅ Done. Success: ${ok} | Failed: ${fail}`);
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});