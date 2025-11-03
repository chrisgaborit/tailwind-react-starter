// backend/scripts/convertStoryboards.ts
// Convert storyboards (.pdf, .docx, .pptx, .md, .txt) -> JSON for RAG uploader
// Usage:
//   npx ts-node scripts/convertStoryboards.ts "/Users/chris/Documents/Storyboards Aug 2025"
// Output JSONs are written to: /Users/chris/Documents/JSON Files eLearning

import fs from 'fs';
import path from 'path';
import { globSync } from 'glob';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import pptxExtract from 'office-text-extractor';

type Scene = {
  title?: string;
  objectivesCovered?: string;
  narration?: string;
  onScreenText?: string;
  userInstructions?: string;
  interactions?: string;
  accessibilityNotes?: string;
};
type Storyboard = {
  moduleName: string;
  scenes: Scene[];
};

const SRC_DIR = process.argv[2];
const OUT_DIR = '/Users/chris/Documents/JSON Files eLearning';

if (!SRC_DIR) {
  console.error('Usage: npx ts-node scripts/convertStoryboards.ts "/path/to/folder"');
  process.exit(1);
}
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// ---------- helpers ----------
const clean = (s: string) =>
  s
    .replace(/\uFEFF/g, '')                                 // BOM
    .replace(/\u00A0/g, ' ')                                // nbsp
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ' ')          // control chars
    .replace(/[ \t]+\n/g, '\n')                             // trailing spaces
    .replace(/\n{3,}/g, '\n\n')                             // collapse blanks
    .trim();

const lines = (s: string) => clean(s).split('\n').map(x => x.trim()).filter(Boolean);

function smartTitle(block: string, fallback: string) {
  for (const ln of lines(block)) {
    if (/^[A-Za-z0-9]/.test(ln) && ln.length <= 80) return ln;
  }
  return fallback;
}

function toStoryboard(moduleName: string, chunks: string[]): Storyboard {
  const scenes: Scene[] = [];
  let idx = 1;
  for (const chunk of chunks) {
    const text = clean(chunk);
    if (!text) continue;
    const title = smartTitle(text, `Scene ${idx}`);
    scenes.push({ title, narration: text });
    idx++;
  }
  if (scenes.length === 0) scenes.push({ title: 'Scene 1', narration: moduleName });
  return { moduleName, scenes };
}

function writeJson(outName: string, data: Storyboard) {
  const outPath = path.join(OUT_DIR, outName.replace(/\.(pdf|docx|pptx|md|txt)$/i, '') + '.json');
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf-8');
  return outPath;
}

// ---------- per-format readers ----------
async function readPdfByPages(p: string): Promise<string[]> {
  const buf = fs.readFileSync(p);
  const parsed = await pdfParse(buf);
  const byFF = parsed.text.split('\f').map(clean).filter(Boolean);
  if (byFF.length > 1) return byFF;
  return clean(parsed.text).split(/\n{2,}/g).filter(Boolean);
}

async function readDocxByBlocks(p: string): Promise<string[]> {
  const buf = fs.readFileSync(p);
  const res = await mammoth.extractRawText({ buffer: buf });
  return clean(res.value).split(/\n{2,}/g).filter(Boolean);
}

async function readPptxBySlides(p: string): Promise<string[]> {
  try {
    const res: any = await (pptxExtract as any)(p);

    if (Array.isArray(res)) {
      return res.map(s => (typeof s === 'string' ? s : JSON.stringify(s))).filter(Boolean);
    }

    if (res && typeof res === 'object') {
      const slides = (res.slides || res.pages || res) as any[];
      if (Array.isArray(slides)) {
        return slides
          .map(s => {
            if (typeof s === 'string') return s;
            const title = (s.title ?? '').toString();
            const body = (s.text ?? s.body ?? s.content ?? '').toString();
            const notes = (s.notes ?? '').toString();
            return [title, body, notes].filter(Boolean).join('\n\n');
          })
          .filter(Boolean);
      }
      const text = (res.text ?? '').toString();
      if (text) return text.split(/\n{2,}/g).filter(Boolean);
    }

    if (typeof res === 'string') {
      return res.split(/\n{2,}/g).filter(Boolean);
    }

    return [];
  } catch (e: any) {
    console.warn('⚠️ PPTX extract failed; skipping slides:', e?.message || e);
    return [];
  }
}

async function readTextBlocks(p: string): Promise<string[]> {
  const raw = fs.readFileSync(p, 'utf-8');
  return clean(raw).split(/\n{2,}/g).filter(Boolean);
}

// ---------- main convert ----------
async function convertOne(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  const base = path.basename(filePath);
  const moduleName =
    base.replace(/\.(pdf|docx|pptx|md|txt)$/i, '').replace(/\.(cleaned|repaired)$/i, '');

  let chunks: string[] = [];

  if (ext === '.pdf') {
    chunks = await readPdfByPages(filePath);
  } else if (ext === '.docx') {
    chunks = await readDocxByBlocks(filePath);
  } else if (ext === '.pptx') {
    chunks = await readPptxBySlides(filePath);
  } else if (ext === '.md' || ext === '.txt') {
    chunks = await readTextBlocks(filePath);
  } else {
    return { file: base, status: 'skipped', reason: `Unsupported: ${ext}` as const };
  }

  const storyboard = toStoryboard(moduleName, chunks);
  const outPath = writeJson(base, storyboard);
  return { file: base, status: 'ok' as const, out: path.basename(outPath), scenes: storyboard.scenes.length };
}

async function main() {
  const pattern = path.join(SRC_DIR, '**/*.{pdf,docx,pptx,md,txt}');
  const files = globSync(pattern, { nocase: true });

  if (files.length === 0) {
    console.log('No source files found.');
    return;
  }

  console.log(`Found ${files.length} source file(s). Converting to JSON → ${OUT_DIR}`);
  const results: any[] = [];
  for (const f of files) {
    try {
      const res = await convertOne(f);
      results.push(res);
      if (res.status === 'ok') {
        console.log(`✅ ${res.file} → ${res.out} (${res.scenes} scenes)`);
      } else {
        console.log(`⏭️  ${res.file} — ${res.reason}`);
      }
    } catch (e: any) {
      console.log(`❌ ${path.basename(f)} — ${e?.message || e}`);
    }
  }

  const ok = results.filter(r => r.status === 'ok').length;
  const skipped = results.filter(r => r.status === 'skipped').length;
  console.log(`\n=== SUMMARY ===\n✅ Converted: ${ok}\n⏭️  Skipped : ${skipped}\nOutput dir: ${OUT_DIR}`);
}

main().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
