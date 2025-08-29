// backend/scripts/askRag.ts
import 'dotenv/config';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// ============================================================
// Config
// ============================================================
const OPENAI_EMBED_MODEL = process.env.OPENAI_EMBED_MODEL || 'text-embedding-3-small';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!OPENAI_API_KEY) throw new Error("❌ Missing OPENAI_API_KEY in environment");
if (!SUPABASE_URL) throw new Error("❌ Missing SUPABASE_URL or VITE_SUPABASE_URL in environment");
if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error("❌ Missing SUPABASE_SERVICE_ROLE_KEY in environment");

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ============================================================
// Helpers
// ============================================================
function asPlainText(x: any): string {
  if (x == null) return '';
  if (typeof x === 'string') return x;
  if (Array.isArray(x)) return x.map(asPlainText).filter(Boolean).join(' ');
  if (typeof x === 'object') {
    for (const k of ['text', 'label', 'content', 'value', 'title']) {
      if (typeof (x as any)[k] === 'string') return (x as any)[k];
    }
    try {
      return JSON.stringify(x);
    } catch {
      return String(x);
    }
  }
  return String(x);
}

function tryParseJson<T = any>(s: string): T | null {
  try {
    const t = s.trim();
    if (!t) return null;
    if (!/^[\[\{]/.test(t)) return null;
    return JSON.parse(t) as T;
  } catch {
    return null;
  }
}

function normaliseTitle(row: any): string {
  if (row?.title && String(row.title).trim()) return row.title;
  const c = row?.content;

  let obj: any = null;
  if (typeof c === 'object' && c) obj = c;
  else if (typeof c === 'string') obj = tryParseJson(c);

  if (obj && typeof obj === 'object') {
    return (
      obj.moduleName ||
      obj.title ||
      obj.name ||
      obj?.meta?.moduleName ||
      '(untitled)'
    );
  }
  return '(untitled)';
}

function excerptFromContent(row: any, max = 600): string {
  const c = row?.content;

  if (typeof c === 'string') {
    const maybeJson = tryParseJson(c);
    if (maybeJson) return excerptFromJson(maybeJson, max);
    return c.replace(/\s+/g, ' ').slice(0, max);
  }

  if (c && typeof c === 'object') {
    return excerptFromJson(c, max);
  }

  return '';
}

function excerptFromJson(c: any, max = 600): string {
  const bits: string[] = [];

  if (c.learningOutcomes) bits.push(`LO: ${asPlainText(c.learningOutcomes)}`);

  if (Array.isArray(c.tableOfContents) && c.tableOfContents.length) {
    bits.push(`TOC: ${c.tableOfContents.slice(0, 5).join(' · ')}`);
  }

  if (Array.isArray(c.scenes) && c.scenes.length) {
    const s0 = c.scenes[0];
    const title = s0?.pageTitle || s0?.title || 'Scene 1';
    const ost = asPlainText(s0?.onScreenText);
    const vo = asPlainText(s0?.narrationScript || s0?.voiceover);
    bits.push(`Scene 1: ${title}`);
    if (ost) bits.push(`OST: ${ost}`);
    if (vo) bits.push(`VO: ${vo}`);
  } else if (Array.isArray(c.pages) && c.pages.length) {
    const p0 = c.pages[0];
    const title = p0?.pageTitle || 'Page 1';
    bits.push(`Page 1: ${title}`);
  }

  const out = bits.join(' | ').replace(/\s+/g, ' ').trim();
  if (out) return out.slice(0, max);

  try {
    return JSON.stringify(c).slice(0, max);
  } catch {
    return String(c).slice(0, max);
  }
}

// ============================================================
// Main
// ============================================================
async function main() {
  const q = process.argv[2];
  if (!q) {
    console.error(
      'Usage:\n' +
        '  npx ts-node -r dotenv/config backend/scripts/askRag.ts "<question>" [--k 8] [--like "module title contains"] [--json]\n' +
        'Examples:\n' +
        '  npx ts-node -r dotenv/config backend/scripts/askRag.ts "What does NSW_M1_Peer Support Network cover in Module 1?" --like "NSW_M1_Peer Support Network"\n' +
        '  npx ts-node -r dotenv/config backend/scripts/askRag.ts "key takeaways for bribery" --k 5 --json'
    );
    process.exit(1);
  }

  const kIdx = process.argv.indexOf('--k');
  const k = kIdx > -1 ? Number(process.argv[kIdx + 1]) : 8;

  const likeIdx = process.argv.indexOf('--like');
  const titleLike = likeIdx > -1 ? (process.argv[likeIdx + 1] || '').toLowerCase() : '';

  const jsonOut = process.argv.includes('--json');

  // Create query embedding
  const emb = await openai.embeddings.create({
    model: OPENAI_EMBED_MODEL,
    input: q,
  });
  const vec = emb.data[0].embedding as number[];

  // Query Supabase RPC
  const { data, error } = await supabase.rpc('rag_match_storyboards', {
    query_embedding: vec,
    match_count: k * 3,
  });

  if (error) {
    console.error('❌ RPC error:', error);
    process.exit(1);
  }

  let rows = (data as any[]) ?? [];
  if (titleLike) {
    rows = rows.filter((r) => {
      const t = normaliseTitle(r).toLowerCase();
      return t.includes(titleLike);
    });
  }
  rows = rows.slice(0, k);

  if (jsonOut) {
    const shaped = rows.map((r) => ({
      similarity: Number(r.similarity ?? r.score ?? 0),
      title: normaliseTitle(r),
      excerpt: excerptFromContent(r, 1000),
      id: r.id ?? null,
    }));
    console.log(JSON.stringify({ query: q, k: rows.length, results: shaped }, null, 2));
    return;
  }

  console.log(`\nTop ${rows.length} matches for: "${q}"${titleLike ? ` (title contains "${titleLike}")` : ''}\n`);
  for (const r of rows) {
    const sim = Number(r.similarity ?? r.score ?? 0).toFixed(3);
    const title = normaliseTitle(r);
    const snippet = excerptFromContent(r, 600);
    console.log(`— [${sim}] ${title}\n${snippet}\n`);
  }
}

// ------------------------------------------------------------
// Guard: only execute when invoked directly from CLI
// ------------------------------------------------------------
const isDirectRun =
  (typeof require !== 'undefined' && (require as any).main === module) ||
  (typeof process !== 'undefined' &&
    Array.isArray(process.argv) &&
    (process.argv[1]?.endsWith('askRag.ts') || process.argv[1]?.endsWith('askRag.js')));

if (isDirectRun) {
  main().catch((err) => {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  });
}

export { main };