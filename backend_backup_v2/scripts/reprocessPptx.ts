// backend/scripts/reprocessPptx.ts
// Reprocess only PPTX files: extract per-slide text, chunk, embed, and replace chunks in Supabase
// Usage:
//   npx ts-node scripts/reprocessPptx.ts "/Users/chris/Documents/Storyboards - Aug 2025" [--dryRun]

import "dotenv/config";
import fs from "fs";
import path from "path";
import { globSync } from "glob";
import JSZip from "jszip";
import { XMLParser } from "fast-xml-parser";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const MODEL = "text-embedding-3-small"; // 1536 dims
const CHUNK_CHAR_TARGET = 1800; // ~1k–1.2k tokens
const MAX_RETRIES = 4;
const RETRY_BASE_MS = 400;

const { getRAGConfig } = require('../src/utils/ragConfig');

const TABLE_STORYBOARDS = "storyboards";
const COLUMN_JSON = "content";

// Get RAG configuration
const ragConfig = getRAGConfig();
const TABLE_CHUNKS = ragConfig.targetTable;

const root = process.argv[2];
const DRY_RUN = process.argv.includes("--dryRun");

if (!root) {
  console.error(
    '❌ Provide a folder path.\n  npx ts-node scripts/reprocessPptx.ts "/path/to/pptx/folder" [--dryRun]'
  );
  process.exit(1);
}

const supabase: SupabaseClient = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ---------- Retry helper (accepts any thenable; typed return) ----------
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

// ---------- Utilities ----------
const clean = (s: string) =>
  (s || "")
    .replace(/\uFEFF/g, "")
    .replace(/\u00A0/g, " ")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

function smartTitle(block: string, fallback: string) {
  for (const raw of block.split("\n")) {
    const t = raw.trim();
    if (/^[A-Za-z0-9]/.test(t) && t.length <= 80) return t;
  }
  return fallback;
}

function chunkSlides(slideBlocks: string[]): string[] {
  const pieces: string[] = [];
  for (let i = 0; i < slideBlocks.length; i++) {
    const raw = clean(slideBlocks[i]);
    if (!raw) continue;
    const title = smartTitle(raw, `Slide ${i + 1}`);
    const merged = `${title}\n\n${raw}`;
    pieces.push(merged);
  }

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
  return chunks;
}

async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const res = await withRetry(
    () => openai.embeddings.create({ model: MODEL, input: texts }),
    `openai.embeddings (${texts.length})`
  );
  return res.data.map((d) => d.embedding as unknown as number[]);
}

// Extract all text (<a:t> runs) from a slide/notes XML object
function extractTextFromXmlObject(obj: any): string[] {
  const out: string[] = [];
  const stack = [obj];
  while (stack.length) {
    const cur = stack.pop();
    if (!cur) continue;
    if (typeof cur === "object") {
      for (const k of Object.keys(cur)) {
        const v = (cur as any)[k];
        // 'a:t' or 't' depending on namespace handling
        if (k === "a:t" || k === "t") {
          if (typeof v === "string") out.push(v);
          else if (v && typeof v === "object" && typeof v["#text"] === "string") out.push(v["#text"]);
        } else if (typeof v === "object") {
          stack.push(v);
        }
      }
    }
  }
  return out;
}

async function extractSlidesFromPptx(filePath: string): Promise<string[]> {
  const buf = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(buf);
  const parser = new XMLParser({
    ignoreAttributes: false,
    removeNSPrefix: true, // turns 'a:t' into 't'
    parseTagValue: true,
    parseAttributeValue: false,
    trimValues: false,
  });

  // Collect slide files
  const slideFiles = Object.keys(zip.files)
    .filter((p) => p.startsWith("ppt/slides/slide") && p.endsWith(".xml"))
    .sort((a, b) => {
      const ai = parseInt(a.match(/slide(\d+)\.xml$/i)?.[1] || "0", 10);
      const bi = parseInt(b.match(/slide(\d+)\.xml$/i)?.[1] || "0", 10);
      return ai - bi;
    });

  // Optional notes
  const notesMap: Record<number, string> = {};
  const notesFiles = Object.keys(zip.files).filter(
    (p) => p.startsWith("ppt/notesSlides/notesSlide") && p.endsWith(".xml")
  );
  for (const nf of notesFiles) {
    const idx = parseInt(nf.match(/notesSlide(\d+)\.xml$/i)?.[1] || "0", 10);
    try {
      const xml = await zip.files[nf].async("string");
      const obj = parser.parse(xml);
      const textRuns = extractTextFromXmlObject(obj);
      if (textRuns.length) notesMap[idx] = clean(textRuns.join("\n"));
    } catch {
      // ignore
    }
  }

  const slidesOut: string[] = [];
  for (const sf of slideFiles) {
    try {
      const xml = await zip.files[sf].async("string");
      const obj = parser.parse(xml);
      const textRuns = extractTextFromXmlObject(obj);
      const slideIdx = parseInt(sf.match(/slide(\d+)\.xml$/i)?.[1] || "0", 10);
      const body = clean(textRuns.join("\n"));
      const notes = notesMap[slideIdx] ? `\n\n[Notes]\n${notesMap[slideIdx]}` : "";
      const merged = clean(`${body}${notes}`);
      if (merged) slidesOut.push(merged);
    } catch (e) {
      console.warn(`⚠️ Failed to parse ${sf}:`, (e as any)?.message || e);
    }
  }

  return slidesOut;
}

// Helper type to strongly type Supabase results when we care
type SupabaseResult<T> = { data: T | null; error: any };

async function findStoryboardIdByModule(moduleName: string): Promise<string | null> {
  const { data, error } = await withRetry<SupabaseResult<{ id: string }[]>>(
    () =>
      supabase
        .from(TABLE_STORYBOARDS)
        .select("id")
        .contains(COLUMN_JSON, { moduleName })
        .limit(1),
    `supabase.select ${TABLE_STORYBOARDS} contains(moduleName=${moduleName})`
  );
  if (error) throw error;
  return data && data[0]?.id ? (data[0].id as string) : null;
}

async function replaceChunks(
  storyboardId: string,
  chunks: string[],
  embeddings: number[][],
  fileName: string
) {
  if (DRY_RUN) {
    console.log(`🟡 [dry-run] Would replace ${chunks.length} chunks for ${storyboardId}`);
    return;
  }
  await withRetry(
    () => supabase.from(TABLE_CHUNKS).delete().eq("storyboard_id", storyboardId),
    `supabase.delete ${TABLE_CHUNKS} storyboard_id=${storyboardId}`
  );

  const batchSize = 50;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const slice = chunks.slice(i, i + batchSize).map((content, idx) => ({
      storyboard_id: storyboardId,
      scene_no: i + idx + 1,
      content,
      embedding: embeddings[i + idx],
      metadata: { fileName, source: "pptx-reprocess" },
    }));
    await withRetry(
      () => supabase.from(TABLE_CHUNKS).insert(slice),
      `supabase.insert ${TABLE_CHUNKS} batch ${i / batchSize + 1}`
    );
  }
}

async function processPptx(filePath: string) {
  const fileName = path.basename(filePath);
  const moduleName = fileName.replace(/\.pptx$/i, "");

  console.log(`\n📑 ${fileName} → moduleName="${moduleName}"`);

  const storyboardId = await findStoryboardIdByModule(moduleName);
  if (!storyboardId) {
    console.log(
      `⏭️  No storyboard row found with content.moduleName="${moduleName}" — skipping.`
    );
    return { file: fileName, status: "skipped" as const, reason: "no matching storyboard" };
  }

  const slides = await extractSlidesFromPptx(filePath);
  if (slides.length === 0) {
    console.log("⏭️  No slide text extracted — skipping.");
    return { file: fileName, status: "skipped" as const, reason: "no text" };
  }

  const chunks = chunkSlides(slides);
  const embeddings = await embedBatch(chunks);
  await replaceChunks(storyboardId, chunks, embeddings, fileName);

  console.log(`✅ Updated: ${fileName} (${chunks.length} chunk(s))`);
  return { file: fileName, status: "ok" as const, chunks: chunks.length };
}

async function main() {
  console.log("=== PPTX Re-processor (Node-safe) ===");
  console.log("Folder:", root, "| Dry-run:", DRY_RUN);

  const files = globSync(path.join(root, "**/*.pptx"), { nocase: true });
  if (files.length === 0) {
    console.log("No PPTX files found.");
    return;
  }
  console.log(`Found ${files.length} PPTX file(s).`);

  const results: any[] = [];
  for (const f of files) {
    try {
      const res = await processPptx(f);
      results.push(res);
    } catch (e: any) {
      console.error(`❌ ${path.basename(f)} — ${e?.message || e}`);
      results.push({
        file: path.basename(f),
        status: "failed",
        reason: e?.message || String(e),
      });
    }
  }

  const ok = results.filter((r) => r?.status === "ok").length;
  const skipped = results.filter((r) => r?.status === "skipped").length;
  const failed = results.filter((r) => r?.status === "failed").length;

  console.log("\n=== SUMMARY ===");
  console.log(`✅ Updated: ${ok}`);
  console.log(`⏭️  Skipped : ${skipped}`);
  console.log(`❌ Failed  : ${failed}`);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
