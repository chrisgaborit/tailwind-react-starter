// backend/src/server.ts
import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import morgan from "morgan";
import multer from "multer";
import pdf from "pdf-parse";
import puppeteer from "puppeteer";
import fs from "fs";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

// Our services & helpers already in your repo
import {
  generateStoryboardFromOpenAI,
  resolveOpenAIModel,
} from "./services/openaiGateway";
import { normalizeToScenes } from "./utils/normalizeStoryboard";
import { summarizeContentIfNeeded, truncateContent } from "./utils/summarizer";

/* -----------------------------------------------------------
   Basic, local minimal types (keeps this file self‑contained)
----------------------------------------------------------- */
type VisualBlock = {
  mediaType?: "Image" | "Graphic" | "Animation" | "Video";
  style?: string;
  aiPrompt?: string;
  altText?: string;
  aspectRatio?: string;
  composition?: string;
  environment?: string;
};
type SceneV2 = {
  sceneNumber?: number;
  pageTitle?: string;
  screenLayout?: string;
  templateId?: string;
  screenId?: string;
  narrationScript?: string;
  onScreenText?: string;
  visual?: VisualBlock;
  interactionType?: string;
  interactionDescription?: string;
  developerNotes?: string;
  accessibilityNotes?: string;
  events?: Array<{
    eventNumber?: number;
    audio?: { script?: string };
    narrationScript?: string;
    voiceover?: string;
    onScreenText?: string;
    developerNotes?: string;
    interactive?: { behaviourExplanation?: string };
  }>;
};
type StoryboardModuleV2 = {
  moduleName: string;
  revisionHistory?: Array<{ dateISO: string; change: string; author: string }>;
  pronunciationGuide?: Array<{ term: string; pronunciation: string; note?: string }>;
  tableOfContents?: string[];
  scenes: SceneV2[];
  meta?: Record<string, any>;
};
type StoryboardEnvelope =
  | { success: true; data: { storyboardModule: StoryboardModuleV2 }; meta?: Record<string, any> }
  | { success: false; data: { storyboardModule?: undefined }; meta?: Record<string, any> };

/* -----------------------------------------------------------
   ENV / clients
----------------------------------------------------------- */
const PORT = Number(process.env.PORT || 8080);
const EMBED_MODEL = process.env.OPENAI_EMBED_MODEL || "text-embedding-3-small";
const FRONTEND_ORIGINS = (process.env.FRONTEND_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const ALLOWED_ORIGINS = FRONTEND_ORIGINS.length
  ? FRONTEND_ORIGINS
  : ["http://localhost:5173", "https://ai-e-learning-app.web.app"];

const supabase = createClient(
  (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL)!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

/* -----------------------------------------------------------
   App + CORS (single‑origin)
----------------------------------------------------------- */
const app = express();

app.use((req, res, next) => {
  const origin = req.headers.origin as string | undefined;
  res.removeHeader("Access-Control-Allow-Origin");
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }
  if (req.method === "OPTIONS") return res.status(204).end();
  next();
});

app.use(express.json({ limit: "50mb" }));
app.use(morgan("dev"));

/* -----------------------------------------------------------
   Multer: PDF uploads for /generate-from-files
----------------------------------------------------------- */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024, files: 5 }, // 25MB/file, up to 5 files
});

/* -----------------------------------------------------------
   Small helpers
----------------------------------------------------------- */
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
function parseDurationMins(value: unknown): number {
  if (typeof value === "number" && isFinite(value)) return value;
  if (typeof value !== "string") return 0;
  const m = value.match(/(\d+(\.\d+)?)/);
  return m ? Number(m[1]) : 0;
}
function normaliseDuration(value: unknown, def = 20) {
  const n = parseDurationMins(value || def);
  return clamp(Math.round(n || def), 5, 120);
}
async function searchSimilarStoryboards(query: string, topN: number = 2) {
  try {
    const embedding = await openai.embeddings.create({ model: EMBED_MODEL, input: query });
    const vec = embedding.data[0].embedding;
    const { data, error } = await supabase.rpc("rag_match_storyboards", {
      query_embedding: vec,
      match_count: topN,
    });
    if (error) {
      console.warn("[RAG] RPC error:", error);
      return [];
    }
    return data || [];
  } catch (e) {
    console.warn("[RAG] Skipping vector search:", (e as any)?.message || e);
    return [];
  }
}
const pdfEscapeHtml = (unsafe?: string | null) =>
  !unsafe
    ? ""
    : String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

function pdfNormalizeEvents(scene: any) {
  const evs = Array.isArray(scene?.events) ? scene.events : [];
  if (evs.length) {
    return evs.map((e: any, i: number) => ({
      num: e.eventNumber ?? i + 1,
      audio: e.audio?.script ?? e.narrationScript ?? e.voiceover ?? scene.narrationScript ?? "",
      ost: e.onScreenText ?? scene.onScreenText ?? "",
      dev:
        e.developerNotes ??
        e.interactive?.behaviourExplanation ??
        e.interactionDescription ??
        scene.developerNotes ??
        "",
    }));
  }
  return [
    {
      num: 1,
      audio: scene.narrationScript ?? scene.voiceover ?? "",
      ost: scene.onScreenText ?? "",
      dev: scene.developerNotes ?? scene.interactionDescription ?? "",
    },
  ];
}

function pdfHtmlForScene(scene: any, idx: number, total: number): string {
  const type = scene?.interactionType && scene.interactionType !== "None" ? "Interactive" : "Informative";
  const visual = scene.visual || {};
  const rows = pdfNormalizeEvents(scene)
    .map(
      (r: any) => `
        <tr class="align-top">
          <td class="cell cell--num">${String(r.num)}.</td>
          <td class="cell"><pre>${pdfEscapeHtml(r.audio)}</pre></td>
          <td class="cell">${pdfEscapeHtml(r.ost)}</td>
          <td class="cell"><pre>${pdfEscapeHtml(r.dev)}</pre></td>
        </tr>`
    )
    .join("");

  const layoutSummary = [
    scene.screenLayout,
    visual.style || scene.visualDescription,
    visual.composition,
    visual.environment,
    scene.interactionType && scene.interactionType !== "None" ? `Interaction: ${scene.interactionType}` : "",
  ]
    .filter(Boolean)
    .join(" • ");

  return `
  <article class="page">
    <div class="bar">
      <div class="cell">
        <div class="label">Page Title</div>
        <div class="value">${pdfEscapeHtml(scene.pageTitle || scene.title || "")}</div>
      </div>
      <div class="cell">
        <div class="label">Type</div>
        <div class="value">${pdfEscapeHtml(type)}</div>
      </div>
      <div class="cell">
        <div class="label">Number</div>
        <div class="value">p${String(idx + 1).padStart(2, "0")}</div>
      </div>
    </div>

    <div class="screenblock">
      <h4>Screen Layout</h4>
      <div class="summary">${pdfEscapeHtml(layoutSummary || "—")}</div>

      <div class="mini-cards">
        <div class="mini">
          <div class="mini__label">AI Image Prompt</div>
          <div class="mini__value">${pdfEscapeHtml(visual.aiPrompt || "") || "—"}</div>
        </div>
        <div class="mini">
          <div class="mini__label">Alt Text</div>
          <div class="mini__value">${pdfEscapeHtml(visual.altText || "") || "—"}</div>
        </div>
        <div class="mini">
          <div class="mini__label">Aspect / Env</div>
          <div class="mini__value">${pdfEscapeHtml([visual.aspectRatio, visual.environment].filter(Boolean).join(" • ")) || "—"}</div>
        </div>
      </div>
    </div>

    <div class="tablewrap">
      <table class="events">
        <thead>
          <tr>
            <th class="th th--num">Event</th>
            <th class="th">Audio</th>
            <th class="th">On-Screen Text (OST)</th>
            <th class="th">Internal Development Notes</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>

    <div class="footer"><span>Page ${idx + 1} of ${total}</span></div>
  </article>`;
}

function buildPdfHtml(moduleTitle: string, scenes: any[]): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${moduleTitle}</title>
  <style>
    @page { size: A4 landscape; margin: 12mm; }
    :root {
      --sb-card-bg: #ffffff; --sb-bar-bg: #f5f7fb; --sb-bar-title: #1f2a44;
      --sb-bar-value: #0f172a; --sb-border: #e5e7eb; --sb-th-bg: #f5f7fb;
      --sb-th-text: #1f2a44; --sb-text: #111827; --sb-muted: #6b7280; --sb-accent: #0ea5e9;
    }
    body { font-family: Arial, Helvetica, sans-serif; color: var(--sb-text); margin: 0; background: #fff; font-size: 12px; line-height: 1.35; }
    h1 { margin: 0 0 6px; font-size: 20px; color: var(--sb-accent); }
    .muted { color: var(--sb-muted); font-size: 11px; margin-bottom: 10px; }
    .page { break-inside: avoid; border: 1px solid var(--sb-border); border-radius: 8px; background: var(--sb-card-bg); margin: 10px 0; box-shadow: 0 1px 0 rgba(0,0,0,0.02); }
    .bar { display: grid; grid-template-columns: 1fr 140px 120px; gap: 8px; border-bottom: 1px solid var(--sb-border); background: var(--sb-bar-bg); border-top-left-radius: 8px; border-top-right-radius: 8px; padding: 10px; }
    .bar .label { font-weight: 600; color: var(--sb-bar-title); font-size: 11px; margin-bottom: 2px; }
    .bar .value { color: var(--sb-bar-value); font-size: 12px; word-break: break-word; }
    .screenblock { border-bottom: 1px solid var(--sb-border); background: #fafafa; padding: 10px 12px; }
    .screenblock h4 { margin: 0 0 6px; font-size: 13px; color: var(--sb-text); }
    .summary { color: #334155; }
    .mini-cards { margin-top: 8px; display: grid; gap: 8px; grid-template-columns: 1fr 1fr 1fr; }
    .mini { background: #fff; border: 1px solid var(--sb-border); border-radius: 6px; padding: 8px; min-height: 44px; }
    .mini__label { color: #64748b; font-weight: 600; font-size: 10px; margin-bottom: 2px; }
    .mini__value { font-size: 12px; color: #0f172a; white-space: pre-wrap; word-break: break-word; }
    .tablewrap { padding: 10px 12px 6px; }
    table.events { width: 100%; border-collapse: collapse; table-layout: fixed; }
    .th { text-align: left; background: var(--sb-th-bg); color: var(--sb-th-text); font-weight: 600; padding: 8px; border: 1px solid var(--sb-border); font-size: 12px; }
    .th--num { width: 40px; }
    .cell { border: 1px solid var(--sb-border); padding: 8px; vertical-align: top; overflow-wrap: anywhere; }
    .cell pre { margin: 0; white-space: pre-wrap; word-break: break-word; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", "Courier New", monospace; font-size: 11px; line-height: 1.45; color: #0f172a; }
    .footer { border-top: 1px solid var(--sb-border); background: #fff; color: var(--sb-muted); font-size: 10px; padding: 6px 10px; text-align: right; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; }
    .wrapper { padding: 10mm 8mm 8mm; }
  </style>
</head>
<body>
  <div class="wrapper">
    <h1>${moduleTitle}</h1>
    <div class="muted">Generated ${pdfEscapeHtml(new Date().toLocaleString())}</div>
    ${scenes.map((s, i) => pdfHtmlForScene(s, i, scenes.length)).join("")}
  </div>
</body>
</html>`;
}

/* -----------------------------------------------------------
   Health / config
----------------------------------------------------------- */
app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "genesis-backend", time: new Date().toISOString() });
});

app.get("/api/v1/config", (_req, res) => {
  const mask = (v?: string) => (v ? `${v.slice(0, 4)}…${v.slice(-4)}` : "MISSING");
  res.json({
    success: true,
    data: {
      port: PORT,
      supabaseUrl: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "MISSING",
      openaiModel: process.env.OPENAI_MODEL || "(resolver default)",
      openaiEmbedModel: EMBED_MODEL,
      openaiKey: mask(process.env.OPENAI_API_KEY),
      nodeEnv: process.env.NODE_ENV || "development",
      allowedOrigins: ALLOWED_ORIGINS,
    },
  });
});

/* -----------------------------------------------------------
   POST /api/v1/generate-from-text
----------------------------------------------------------- */
app.post("/api/v1/generate-from-text", async (req: Request, res: Response) => {
  try {
    const { formData } = req.body || {};
    if (!formData || !String(formData.content || "").trim()) {
      return res.status(400).json({ success: false, error: { message: "Provide formData.content." } });
    }

    formData.durationMins = normaliseDuration(formData.durationMins ?? formData.duration ?? 20);

    // Summarize content if it's too large to prevent context window issues
    const summarizedContent = await summarizeContentIfNeeded(formData.content, openai);
    if (!summarizedContent.trim()) {
      return res.status(400).json({ 
        success: false, 
        error: { 
          message: "Cannot generate storyboard with no content." 
        } 
      });
    }

    const modelRequested: string | null = (formData as any)?.aiModel || null;
    const modelUsed: string = resolveOpenAIModel(modelRequested || undefined);

    const searchQuery = formData.moduleName || String(summarizedContent).slice(0, 500);
    const similar = await searchSimilarStoryboards(searchQuery, 2);
    const ragContext =
      similar.length > 0
        ? similar
            .map((ex: any, i: number) => {
              const content = typeof ex.content === "string" ? ex.content : JSON.stringify(ex.content, null, 2);
              return `--- START OF EXAMPLE ${i + 1} ---\n${content}\n--- END OF EXAMPLE ${i + 1} ---`;
            })
            .join("\n\n")
        : "No similar examples were found in the database.";

    const storyRaw = await generateStoryboardFromOpenAI(
      { ...formData, content: summarizedContent }, 
      {
        ragContext,
        aiModel: modelRequested || undefined,
      }
    );

    const storyboard: StoryboardModuleV2 =
      (storyRaw as any)?.scenes
        ? (storyRaw as StoryboardModuleV2)
        : ((normalizeToScenes(storyRaw) as unknown) as StoryboardModuleV2);

    // RAW compat
    const rawMode = String(req.query.raw || "").toLowerCase();
    if (rawMode === "1" || rawMode === "true") return res.json(storyboard);

    const envelope: StoryboardEnvelope = {
      success: true,
      data: { storyboardModule: storyboard },
      meta: { modelRequested, modelUsed, ragUsed: true, examples: similar.length },
    };
    res.json(envelope);
  } catch (e: any) {
    res.status(502).json({ success: false, error: { message: e?.message || "Failed" } });
  }
});

/* -----------------------------------------------------------
   POST /api/v1/generate-from-files  (multipart PDFs)
   - Field name for PDFs: "files"
   - Optional body field "formData": JSON string or object
----------------------------------------------------------- */
app.post(
  "/api/v1/generate-from-files",
  upload.array("files"),
  async (req: Request, res: Response) => {
    try {
      // formData may be JSON string (from formData.append) or an object
      const rawFD = (req.body as any)?.formData ?? req.body;
      let formData: any;
      if (typeof rawFD === "string") {
        try { formData = JSON.parse(rawFD); } catch { formData = {}; }
      } else {
        formData = rawFD || {};
      }

      formData.durationMins = normaliseDuration(formData.durationMins ?? formData.duration ?? 20);

      // Parse PDFs
      let extractedContent = formData.content || "";
      const uploaded = Array.isArray(req.files) ? (req.files as Express.Multer.File[]) : [];
      if (uploaded.length > 0) {
        for (const f of uploaded) {
          if (f.mimetype !== "application/pdf") continue;
          const data = await pdf(f.buffer);
          if (data.text) extractedContent += `\n\n--- CONTENT FROM FILE: ${f.originalname} ---\n\n${data.text}`;
        }
      }
      if (!extractedContent.trim()) {
        return res.status(400).json({ success: false, error: { message: "Cannot generate a storyboard with no content." } });
      }

      // Summarize content if it's too large to prevent context window issues
      const summarizedContent = await summarizeContentIfNeeded(extractedContent, openai);
      if (!summarizedContent.trim()) {
        return res.status(400).json({ 
          success: false, 
          error: { 
            message: "Cannot generate storyboard with no content. Please ensure your PDF files are valid and contain readable text, or provide content in the form." 
          } 
        });
      }

      // RAG
      const searchQuery = formData.moduleName || summarizedContent.slice(0, 500);
      const similar = await searchSimilarStoryboards(searchQuery, 2);
      const ragContext =
        similar.length > 0
          ? similar
              .map((ex: any, i: number) => {
                const content = typeof ex.content === "string" ? ex.content : JSON.stringify(ex.content, null, 2);
                return `--- START OF EXAMPLE ${i + 1} ---\n${content}\n--- END OF EXAMPLE ${i + 1} ---`;
              })
              .join("\n\n")
          : "No similar examples were found in the database.";

      const modelRequested: string | null = (formData as any)?.aiModel || null;
      const storyRaw = await generateStoryboardFromOpenAI(
        { ...formData, content: summarizedContent },
        { ragContext, aiModel: modelRequested || undefined }
      );

      const storyboard: StoryboardModuleV2 =
        (storyRaw as any)?.scenes
          ? (storyRaw as StoryboardModuleV2)
          : ((normalizeToScenes(storyRaw) as unknown) as StoryboardModuleV2);

      const rawMode = String(req.query.raw || "").toLowerCase();
      if (rawMode === "1" || rawMode === "true") return res.json(storyboard);

      const envelope: StoryboardEnvelope = {
        success: true,
        data: { storyboardModule: storyboard },
        meta: { modelRequested, modelUsed: resolveOpenAIModel(modelRequested || undefined), ragUsed: true, examples: similar.length },
      };
      res.json(envelope);
    } catch (e: any) {
      console.error("💥 ERROR in /generate-from-files:", e);
      res.status(502).json({ success: false, error: { message: e?.message || "Failed" } });
    }
  }
);

/* -----------------------------------------------------------
   POST /api/v1/generate-pdf
----------------------------------------------------------- */
app.post("/api/v1/generate-pdf", async (req: Request, res: Response) => {
  try {
    const storyboardModule = req.body as StoryboardModuleV2;
    if (!storyboardModule || !Array.isArray(storyboardModule.scenes) || storyboardModule.scenes.length === 0) {
      return res.status(400).json({ message: 'Invalid storyboard data: expected non-empty "scenes" array.' });
    }

    const moduleTitle = pdfEscapeHtml(storyboardModule.moduleName || "Storyboard");
    const html = buildPdfHtml(moduleTitle, storyboardModule.scenes);

    try { fs.writeFileSync("./debug.html", html); } catch {}

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.emulateMediaType("screen");

    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
      margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
    });

    await browser.close();

    res.writeHead(200, {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="storyboard_${String(
        storyboardModule.moduleName || "module"
      )
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase()}.pdf"`,
      "Content-Length": pdfBuffer.length,
    });
    res.end(pdfBuffer);
  } catch (err: any) {
    console.error("💥 PDF ERROR:", err);
    res.status(500).json({ message: "PDF generation failed", error: err.message });
  }
});

/* -----------------------------------------------------------
   404 + error handler
----------------------------------------------------------- */
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Not Found", path: req.originalUrl });
});
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("❌ Server error:", err);
  res.status(500).json({ error: "Internal Server Error", detail: err?.message });
});

/* -----------------------------------------------------------
   Start server
----------------------------------------------------------- */
app.listen(PORT, () => {
  console.log(`✅ Backend server is listening on http://localhost:${PORT}`);
  console.log("   Allowed CORS origins:", ALLOWED_ORIGINS.join(", "));
});