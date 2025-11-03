// scripts/bulkUploadHardened.ts
// Hardened bulk uploader for storyboard JSON -> Supabase (+ embeddings)
// Usage:
//   npx ts-node scripts/bulkUploadHardened.ts "/Users/chris/Documents/JSON Files eLearning" --concurrency=3 --dryRun
// Env: uses backend/.env (OPENAI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

import "dotenv/config";
import fs from "fs";
import path from "path";
import pkg from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
const { createClient } = pkg;
import OpenAI from "openai";

type AnyJson = Record<string, any>;

/* ---------------- Types to help TS narrowing ---------------- */
type ParseResult =
  | { ok: true; data: AnyJson }
  | { ok: false; error: string };

type ValidateResult =
  | { ok: true }
  | { ok: false; error: string };

type SupabaseResult<T> = { data: T | null; error: any };

/* Discriminant guards */
function isParseError(r: ParseResult): r is { ok: false; error: string } {
  return r.ok === false;
}
function isInvalid(v: ValidateResult): v is { ok: false; error: string } {
  return v.ok === false;
}

/* ---------------- Config ---------------- */
const MODEL = "text-embedding-3-small"; // 1536 dims
const CHUNK_CHAR_TARGET = 1800; // ~1k–1.2k tokens rough
const MAX_RETRIES = 4;
const RETRY_BASE_MS = 400;

// 🔧 your schema
const COLUMN_JSON = "content"; // jsonb column in `storyboards`
const TABLE_STORYBOARDS = "storyboards";
const TABLE_CHUNKS = "storyboard_chunks";

const argPath = process.argv[2];
if (!argPath) {
  console.error(
    '❌ Provide a folder path. Example:\n  npx ts-node scripts/bulkUploadHardened.ts "/path/to/jsons"'
  );
  process.exit(1);
}
const concurrencyArg = Number(
  (process.argv.find((a) => a.startsWith("--concurrency=")) || "").split("=")[1] || "3"
);
const DRY_RUN = process.argv.includes("--dryRun");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase: SupabaseClient = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

/* ---------------- Retry helper (accepts any thenable) ---------------- */
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
async function withRetry<T = any>(
  fn: () => any, // accept Promise, PromiseLike, or Supabase thenables
  label: string,
  retries = MAX_RETRIES,
  baseDelayMs = RETRY_BASE_MS
): Promise<T> {
  let attempt = 0;
  let lastErr: unknown;
  while (attempt <= retries) {
    try {
      const res = await fn(); // awaiting handles thenables
      return res as T;
    } catch (e: any) {
      lastErr = e;
      const delay = baseDelayMs * Math.pow(2, attempt) + Math.random() * 200;
      console.warn(
        `⚠️ ${label} failed (attempt ${attempt + 1}/${retries + 1}). Retrying in ${Math.round(
          delay
        )}ms…`,
        e?.message || e
      );
      await sleep(delay);
      attempt++;
    }
  }
  throw new Error(`${label} failed after ${retries + 1} attempts: ${String(lastErr)}`);
}

/* ---------------- File discovery ---------------- */
function discoverJsonFiles(root: string): string[] {
  const out: string[] = [];
  const stack = [root];
  while (stack.length) {
    const cur = stack.pop()!;
    const stat = fs.statSync(cur);
    if (stat.isDirectory()) {
      for (const name of fs.readdirSync(cur)) stack.push(path.join(cur, name));
    } else if (stat.isFile() && cur.toLowerCase().endsWith(".json")) {
      out.push(cur);
    }
  }
  // Prefer .repaired.json over the original when both exist
  const seenBase = new Set<string>();
  const filtered: string[] = [];
  for (const f of out.sort()) {
    if (f.toLowerCase().endsWith(".repaired.json")) {
      const base = f.slice(0, -".repaired.json".length) + ".json";
      seenBase.add(base.toLowerCase());
      filtered.push(f);
    } else {
      if (!seenBase.has(f.toLowerCase())) filtered.push(f);
    }
  }
  return filtered;
}

/* ---------------- JSON parsing & validation ---------------- */
function safeParseJson(filePath: string): ParseResult {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const trimmed = raw.trim();
    if (!trimmed) return { ok: false as const, error: "Empty file" };
    const data = JSON.parse(trimmed);
    return { ok: true as const, data };
  } catch (e: any) {
    return { ok: false as const, error: e?.message || String(e) };
  }
}

function validateStoryboard(obj: AnyJson): ValidateResult {
  if (typeof obj !== "object" || obj === null)
    return { ok: false as const, error: "Root is not an object" };
  if (!obj.moduleName || typeof obj.moduleName !== "string")
    return { ok: false as const, error: "Missing/invalid moduleName" };
  if (!Array.isArray(obj.scenes))
    return { ok: false as const, error: "Missing/invalid scenes[]" };
  return { ok: true as const };
}

/* ---------------- Chunking ---------------- */
function chunkTextFromStoryboard(json: AnyJson): string[] {
  const pieces: string[] = [];
  for (const [i, s] of (json.scenes || []).entries()) {
    const text = [
      `Scene ${i + 1}: ${s.title ?? ""}`,
      s.objectivesCovered ?? "",
      s.narration ?? "",
      s.onScreenText ?? "",
      s.userInstructions ?? "",
      s.interactions ?? "",
      s.accessibilityNotes ?? "",
    ]
      .filter(Boolean)
      .join("\n");
    if (text.trim()) pieces.push(text);
  }

  // Pack pieces to ~CHUNK_CHAR_TARGET
  const chunks: string[] = [];
  let buf = "";
  for (const p of pieces) {
    if ((buf + "\n\n" + p).length > CHUNK_CHAR_TARGET) {
      if (buf) chunks.push(buf);
      buf = p;
    } else {
      buf = buf ? `${buf}\n\n${p}` : p;
    }
  }
  if (buf) chunks.push(buf);

  // Fallback: if no scenes produced text, chunk whole JSON
  if (chunks.length === 0) {
    const fallback = JSON.stringify(json);
    for (let i = 0; i < fallback.length; i += CHUNK_CHAR_TARGET) {
      chunks.push(fallback.slice(i, i + CHUNK_CHAR_TARGET));
    }
  }
  return chunks;
}

/* ---------------- Embeddings ---------------- */
async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const res = await withRetry(
    () =>
      openai.embeddings.create({
        model: MODEL,
        input: texts,
      }),
    `openai.embeddings (${texts.length})`
  );
  return res.data.map((d) => d.embedding as unknown as number[]);
}

/* ---------------- Supabase helpers ---------------- */

// Upsert using JSON field (content->>'moduleName')
async function upsertStoryboard(json: AnyJson, sourcePath: string): Promise<string> {
  const moduleName: string = json.moduleName || path.basename(sourcePath);

  if (DRY_RUN) {
    console.log(`🟡 [dry-run] Would upsert by JSON moduleName: ${moduleName}`);
    return "00000000-0000-0000-0000-000000000000";
  }

  // Try to find existing row: content contains moduleName=<value>
  const { data: existingRows, error: findErr } = await withRetry<
    SupabaseResult<{ id: string }[]>
  >(
    () =>
      supabase
        .from(TABLE_STORYBOARDS)
        .select("id")
        .contains(COLUMN_JSON, { moduleName })
        .limit(1),
    `supabase.select ${TABLE_STORYBOARDS} contains(moduleName)`
  );
  if (findErr) throw findErr;

  const existing = existingRows && existingRows[0];

  if (existing?.id) {
    const { data, error } = await withRetry<SupabaseResult<{ id: string }>>(
      () =>
        supabase
          .from(TABLE_STORYBOARDS)
          .update({ [COLUMN_JSON]: json, tags: [] }) // ensure NOT NULL tags
          .eq("id", existing.id)
          .select("id")
          .single(),
      `supabase.update ${TABLE_STORYBOARDS} id=${existing.id}`
    );
    if (error) throw error;
    return (data as any).id as string;
  } else {
    const { data, error } = await withRetry<SupabaseResult<{ id: string }>>(
      () =>
        supabase
          .from(TABLE_STORYBOARDS)
          .insert({ [COLUMN_JSON]: json, tags: [] }) // ensure NOT NULL tags
          .select("id")
          .single(),
      `supabase.insert ${TABLE_STORYBOARDS}`
    );
    if (error) throw error;
    return (data as any).id as string;
  }
}

async function replaceChunks(
  storyboardId: string,
  chunks: string[],
  embeddings: number[][],
  fileName: string
) {
  if (DRY_RUN) {
    console.log(`🟡 [dry-run] Would write ${chunks.length} chunks for storyboard ${storyboardId}`);
    return;
  }

  // Delete existing chunks for this storyboard
  await withRetry(
    () => supabase.from(TABLE_CHUNKS).delete().eq("storyboard_id", storyboardId),
    `supabase.delete ${TABLE_CHUNKS} (storyboard_id=${storyboardId})`
  );

  // Insert in batches to avoid payload limits
  const batchSize = 50;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const slice = chunks.slice(i, i + batchSize).map((content, idx) => ({
      storyboard_id: storyboardId,
      scene_no: i + idx + 1, // your schema uses scene_no
      content,
      embedding: embeddings[i + idx],
      metadata: { fileName },
    }));
    await withRetry(
      () => supabase.from(TABLE_CHUNKS).insert(slice),
      `supabase.insert ${TABLE_CHUNKS} batch ${i / batchSize + 1}`
    );
  }
}

/* ---------------- Pipeline ---------------- */
async function processFile(filePath: string) {
  const fileName = path.basename(filePath);

  // 1) Parse (explicit guard)
  const parsed = safeParseJson(filePath);
  if (isParseError(parsed)) {
    return {
      file: fileName,
      status: "skipped" as const,
      reason: `JSON parse error: ${parsed.error}` as const,
    };
  }

  // 2) Validate (explicit guard)
  const valid = validateStoryboard(parsed.data);
  if (isInvalid(valid)) {
    return {
      file: fileName,
      status: "skipped" as const,
      reason: `Schema invalid: ${valid.error}` as const,
    };
  }

  // 3) Upsert + chunk + embed + write
  try {
    const storyboardId = await upsertStoryboard(parsed.data, filePath);
    const chunks = chunkTextFromStoryboard(parsed.data);
    const embeddings = await embedBatch(chunks);
    await replaceChunks(storyboardId, chunks, embeddings, fileName);
    return { file: fileName, status: "ok" as const, chunks: chunks.length };
  } catch (e: any) {
    return {
      file: fileName,
      status: "failed" as const,
      reason: e?.message || String(e),
    };
  }
}

/* ---------------- Main ---------------- */
async function main() {
  console.log("==============================================");
  console.log("Hardened RAG Uploader – Storyboards -> Supabase");
  console.log("Folder:", argPath);
  console.log("Model :", MODEL, "| Concurrency:", concurrencyArg, "| Dry-run:", DRY_RUN);
  console.log("==============================================");

  if (!process.env.OPENAI_API_KEY) console.warn("⚠️ OPENAI_API_KEY not found.");
  if (!process.env.SUPABASE_URL) console.warn("⚠️ SUPABASE_URL not found.");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) console.warn("⚠️ SUPABASE_SERVICE_ROLE_KEY not found.");

  const files = discoverJsonFiles(argPath);
  if (files.length === 0) {
    console.log("No JSON files found. Exiting.");
    return;
  }
  console.log(`Found ${files.length} JSON file(s).`);

  const results: any[] = [];
  let idx = 0;

  async function worker() {
    while (idx < files.length) {
      const myIndex = idx++;
      const f = files[myIndex];
      const res = await processFile(f);
      if (res.status === "ok") {
        console.log(`✅ ${res.file} (${res.chunks} chunk(s))`);
      } else if (res.status === "skipped") {
        console.log(`⏭️  ${res.file} — skipped: ${res.reason}`);
      } else {
        console.log(`❌ ${res.file} — failed: ${res.reason}`);
      }
      results.push(res);
    }
  }

  const workers = Array.from({ length: concurrencyArg }, () => worker());
  await Promise.all(workers);

  const ok = results.filter((r) => r.status === "ok").length;
  const skipped = results.filter((r) => r.status === "skipped");
  const failed = results.filter((r) => r.status === "failed");
  console.log("\n=========== SUMMARY ===========");
  console.log(`✅ Uploaded: ${ok}`);
  console.log(`⏭️  Skipped : ${skipped.length}`);
  skipped.slice(0, 10).forEach((s) => console.log(`   - ${s.file}: ${s.reason}`));
  console.log(`❌ Failed  : ${failed.length}`);
  failed.slice(0, 10).forEach((s) => console.log(`   - ${s.file}: ${s.reason}`));
  console.log("===============================");
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
