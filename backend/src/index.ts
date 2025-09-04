/// <reference path="./declarations.d.ts" />

/**
 * Genesis Backend – Storyboard Generation + RAG + High-Fidelity PDF
 * - Single master PDF builder that matches the detailed on-screen storyboard
 * - /api/v1/generate-pdf and /api/v1/generate-pdf-full both use the same builder
 * - /api/storyboard/pdf (alias) POSTs a payload and returns the exact PDF
 * - Image generation (optional) via Gemini/Imagen when formData.generateImages = true
 */

import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors, { CorsOptionsDelegate } from "cors";
import morgan from "morgan";
console.log("🚀 Backend starting. NODE_ENV =", process.env.NODE_ENV);
import puppeteer from "puppeteer";
import pdf from "pdf-parse";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import multer from "multer";
import client from "prom-client";
import adminRouter from "./routes/admin";

// Services / utils
import { generateStoryboardFromOpenAI, resolveOpenAIModel } from "./services/openaiService";
import { parseDurationMins } from "./utils/parseDuration";
import { classifyStoryboard } from "./utils/levelClassifier";
import { normalizeToScenes } from "./utils/normalizeStoryboard";
import { imageRoute } from "./routes/imageRoute";
import { generateImageFromPrompt } from "./services/imageService";

/* ============================ Local Types ============================ */
type VisualBlock = {
  mediaType?: "Image" | "Graphic" | "Animation" | "Video";
  style?: string;
  aiPrompt?: string;
  altText?: string;
  aspectRatio?: string;
  composition?: string;
  environment?: string;
  subject?: string;
  setting?: string;
  lighting?: string;
  /** New: generated image + recipe mirrors */
  generatedImageUrl?: string;
  imageParams?: {
    prompt: string;
    style?: string;
    size?: string;
    seed?: number;
    model?: string;
    safetyFilter?: "on" | "off";
    enhancements?: string[];
    version?: number;
    generatedAt?: string;
  };
};

type SceneV2 = {
  sceneNumber?: number;
  pageTitle?: string;
  screenLayout?: string;
  templateId?: string;
  screenId?: string;

  narrationScript?: string;
  onScreenText?: string;

  visual?: VisualBlock & {
    visualGenerationBrief?: {
      sceneDescription?: string;
      style?: string;
      subject?: Record<string, any>;
      setting?: string;
      composition?: string;
      lighting?: string;
      colorPalette?: string[];
      mood?: string;
      brandIntegration?: string;
      negativeSpace?: string;
      assetId?: string;
    };
    overlayElements?: Array<{
      elementType?: string;
      content?: string;
      style?: Record<string, any>;
      aiGenerationDirective?: string;
    }>;
  };

  interactionType?: string;
  interactionDescription?: string;
  interaction?: {
    aiDirective?: string;
    retry?: string;
    completion?: string;
  };

  developerNotes?: string;
  accessibilityNotes?: string;

  quickChecks?: {
    captionsOn?: boolean;
    keyboardPath?: boolean;
    focusOrder?: boolean;
  };

  timing?: { estimatedSecs?: number; estimatedSeconds?: number };

  // Structured audio (new schema)
  audio?: {
    script?: string;
    voiceParameters?: {
      persona?: string;
      pace?: string;
      tone?: string;
      emphasis?: string;
      gender?: string;
    };
    backgroundMusic?: string;
    aiGenerationDirective?: string;
  };

  // Legacy mirrors kept for compatibility
  voice?: {
    persona?: string;
    pace?: string;
    tone?: string;
    emphasis?: string;
    gender?: string;
  };

  aiDirective?: string;
  media?: { type?: string; style?: string; notes?: string };

  // Visual meta shown in your on-screen grid
  palette?: string[];
  colourPalette?: string;
  mood?: string;
  brandIntegration?: string;
  negativeSpace?: string;
  lighting?: string; // legacy duplication

  decisionLogic?: string;
  xapiEvents?: Array<{ verb?: string; object?: string; result?: string | Record<string, any> }>;

  events?: Array<{
    eventNumber?: number;
    audio?: { script?: string };
    narrationScript?: string;
    voiceover?: string;
    onScreenText?: string;
    developerNotes?: string;
    interactive?: { behaviourExplanation?: string };
  }>;

  /** Scene-level mirrors for ease-of-use in UI & PDF */
  imageUrl?: string;
  /** Extra mirror to be absolutely unambiguous for the UI */
  generatedImageUrl?: string;
  imageParams?: VisualBlock["imageParams"];
};

export type StoryboardModuleV2 = {
  id?: string;
  moduleName: string;
  tableOfContents?: string[];
  scenes: SceneV2[];
  meta?: Record<string, any>;
};

export type StoryboardEnvelope =
  | { success: true; data: { storyboardModule: StoryboardModuleV2 }; meta?: Record<string, any> }
  | { success: false; data: { storyboardModule?: undefined }; meta?: Record<string, any> };

/* ============================== ENV ================================ */
const PORT = Number(process.env.PORT) || 8080;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";
const CORS_ORIGINS = process.env.CORS_ORIGINS || CORS_ORIGIN;
const EMBED_MODEL = process.env.OPENAI_EMBED_MODEL || "text-embedding-3-small";

/** NEW: force images without relying on front-end flag */
const forceImages =
  String(process.env.FORCE_GENERATE_IMAGES || "").trim().toLowerCase() === "true";

/* ============================ CLIENTS ============================== */
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

/* =========================== EXPRESS APP =========================== */
const app = express();

import cors from "cors";

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174", // vite may switch ports
    "https://app.learno.com.au" // production
  ],
  credentials: true
}));

const IS_PROD = process.env.NODE_ENV === "production";

if (IS_PROD) {
  app.enable("trust proxy"); // so x-forwarded-proto is respected
  app.use((req, res, next) => {
    const proto = (req.headers["x-forwarded-proto"] as string) || (req.secure ? "https" : "http");
    if (proto !== "https") {
      return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
    }
    next();
  });
}

/* CORS */
function parseAllowedOrigins(): string[] {
  return CORS_ORIGINS.split(",").map(s => s.trim()).filter(Boolean);
}
const allowedOrigins = parseAllowedOrigins();
const localhostRegex = /^https?:\/\/localhost(?::\d+)?$/i;

const corsDelegate: CorsOptionsDelegate = (req, callback) => {
  const originHeader =
    (req as any).header?.("Origin") ??
    (req.headers as any)?.origin ??
    (req.headers as any)?.Origin ??
    "";
  const origin = String(originHeader || "");
  const isAllowed = !origin || localhostRegex.test(origin) || allowedOrigins.includes(origin);

  callback(null, {
    origin: isAllowed ? origin : false,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"],
  });
};

app.use(cors(corsDelegate));
app.options("*", cors(corsDelegate));

app.use(express.json({ limit: "50mb" }));
app.use(morgan("dev"));
app.use("/api/images", imageRoute);
app.use("/api/admin", adminRouter);

/* ============================ METRICS ============================== */
const metricsRegistry = new client.Registry();
metricsRegistry.setDefaultLabels({ service: "genesis-backend" });
client.collectDefaultMetrics({ register: metricsRegistry });

const httpDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "code"],
  buckets: [0.1, 0.3, 0.7, 1, 2, 5, 10, 30],
});
metricsRegistry.registerMetric(httpDuration);

function withTiming(route: string, handler: any) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const end = (httpDuration as any).startTimer({ method: req.method, route });
    try {
      await handler(req, res, next);
      end({ code: String(res.statusCode) });
    } catch (e) {
      end({ code: "500" });
      next(e);
    }
  };
}

app.get("/metrics", async (_req, res) => {
  res.set("Content-Type", metricsRegistry.contentType);
  res.end(await metricsRegistry.metrics());
});

/* ============================ MULTER =============================== */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024, files: 5 },
});

/* ============================= HELPERS ============================== */
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const MIN_DURATION = 5;
const MAX_DURATION = 90;

function normaliseDuration(value: unknown): number {
  const minutes = parseDurationMins(value as any);
  return clamp(Math.round(minutes || 0), MIN_DURATION, MAX_DURATION);
}

const parseCsvParam = (v: unknown): string[] | null =>
  typeof v === "string" ? v.split(",").map(s => s.trim()).filter(Boolean) : null;

/* =========================== RAG HELPERS =========================== */
async function searchSimilarStoryboards(query: string, topN: number = 3) {
  if (!openai || !supabase) return [];
  const embeddingResp = await openai.embeddings.create({ model: EMBED_MODEL, input: query });
  const queryEmbedding = embeddingResp.data[0].embedding;

  const { data, error } = await supabase.rpc("rag_match_storyboards", {
    query_embedding: queryEmbedding,
    match_count: topN,
  });

  if (error) {
    console.warn("[RAG] Supabase RPC error:", error);
    return [];
  }
  return data || [];
}

type ChunkMatch = {
  storyboard_id: string;
  scene_index: number;
  event_index: number;
  labels: any | null;
  blueprint: any | null;
  similarity: number;
};

async function searchRelevantChunks(
  query: string,
  topN: number = 6,
  preferredInteraction?: string | null
): Promise<ChunkMatch[]> {
  if (!openai || !supabase) return [];
  const emb = await openai.embeddings.create({ model: EMBED_MODEL, input: query });
  const v = emb.data[0].embedding;

  // Try facet-aware chunks function (with optional interaction), then fall back if needed
  let rpc = await supabase.rpc("rag_match_chunks", {
    query_embedding: v as any,
    match_count: topN,
    interaction: preferredInteraction ?? null,
  });
  if (rpc.error && /does not exist|rag_match_chunks/i.test(rpc.error.message)) {
    rpc = await supabase.rpc("rag_match_chunks", {
      query_embedding: v as any,
      match_count: topN,
    });
  }
  if (rpc.error) {
    console.warn("[RAG] chunk RPC error:", rpc.error);
    return [];
  }
  return (rpc.data || []) as ChunkMatch[];
}

function buildChunkBlueprintContext(rows: ChunkMatch[]): string {
  if (!rows?.length) return "No chunk blueprints found.";
  const lines = rows.map((r, i) => {
    const L = r.labels || {};
    const B = r.blueprint || {};
    const interaction = L.interactionType || "Informative";
    const activation = L.activationCategory || "Knowledge Activation";
    const assess = L.assessmentType || "";
    const acc = Array.isArray(L.accessibility) ? L.accessibility.join(", ") : "";
    const xapi = Array.isArray(L.xapiVerbs) ? L.xapiVerbs.join(", ") : "";
    const style = [L.mediaStyle, L.animationStyle].filter(Boolean).join(" • ");

    return [
      `### CHUNK ${i + 1} • ${interaction} (${activation})  sim=${(r.similarity ?? 0).toFixed(3)}`,
      assess ? `Assessment: ${assess}` : "",
      acc ? `Accessibility: ${acc}` : "",
      xapi ? `xAPI: ${xapi}` : "",
      style ? `Style: ${style}` : "",
      B.pedagogicalIntent ? `Pedagogical intent: ${B.pedagogicalIntent}` : "",
      B.behaviour?.mechanics ? `Mechanics: ${B.behaviour.mechanics}` : "",
      B.behaviour?.retryLogic ? `Retry: ${B.behaviour.retryLogic}` : "",
      B.behaviour?.completionRule ? `Completion: ${B.behaviour.completionRule}` : "",
      B.copy?.instructions ? `Instructions: ${B.copy.instructions}` : "",
      B.copy?.successFeedback ? `Success FB: ${B.copy.successFeedback}` : "",
      B.copy?.errorFeedback ? `Error FB: ${B.copy.errorFeedback}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  });
  return `## HIGH-VALUE INTERACTION BLUEPRINTS (use as patterns, not verbatim)\n\n${lines.join("\n\n")}`;
}

/* ======================= PDF HTML (High-Fidelity) ======================= */
const esc = (v?: any) =>
  v === 0 || v === "0"
    ? "0"
    : v
    ? String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    : "—";

const words = (t?: string) => (t || "").trim().split(/\s+/).filter(Boolean).length;

function buildStoryboardPdfHtml(sb: StoryboardModuleV2): string {
  const renderXapi = (events?: any[]) => {
    const rows = (Array.isArray(events) ? events : [])
      .map(
        e => `
      <tr>
        <td class="cell">${esc(e?.verb)}</td>
        <td class="cell">${esc(e?.object)}</td>
        <td class="cell">${esc(
          typeof e?.result === "string" ? e?.result : e?.result ? JSON.stringify(e?.result) : ""
        )}</td>
      </tr>
    `,
      )
      .join("");
    return `
      <table class="kv">
        <thead>
          <tr><th class="th">Verb</th><th class="th">Object</th><th class="th">Result</th></tr>
        </thead>
        <tbody>${rows || `<tr><td class="cell" colspan="3">—</td></tr>`}</tbody>
      </table>
    `;
  };

  const scene = (s: SceneV2, i: number) => {
    const evs =
      Array.isArray(s.events) && s.events.length
        ? s.events
        : [
            {
              eventNumber: 1,
              narrationScript: s.narrationScript ?? s.audio?.script,
              onScreenText: s.onScreenText,
              developerNotes: s.developerNotes || s.interactionDescription,
            },
          ];

    const type = s.interactionType && s.interactionType !== "None" ? "Interactive" : "Informative";
    const pageNo = `p${String(i + 1).padStart(2, "0")}`;

    // header chips: aspect + interaction type
    const chips: string[] = [];
    chips.push(esc(s.visual?.aspectRatio || "16:9"));
    chips.push(esc(s.interactionType || "None"));

    const qc = s.quickChecks || {};
    const yes = (b?: boolean) => (b ? "✓" : "✗");
    const yesClass = (b?: boolean) => (b ? "ok" : "bad");

    // visual meta (matches on-screen cards)
    const vgb = s.visual?.visualGenerationBrief || {};
    const palette =
      Array.isArray(vgb.colorPalette) ? vgb.colorPalette.join(", ") :
      Array.isArray(s.palette) ? s.palette.join(", ") :
      s.colourPalette;

    const visualPairs: Array<[string, any]> = [
      ["Scene Description", vgb.sceneDescription],
      ["Style", vgb.style ?? s.visual?.style],
      ["Subject", vgb.subject ? JSON.stringify(vgb.subject) : s.visual?.subject || "{}"],
      ["Setting", vgb.setting ?? s.visual?.setting],
      ["Composition", vgb.composition ?? s.visual?.composition],
      ["Lighting", vgb.lighting ?? s.visual?.lighting ?? s.lighting],
      ["Colour Palette", palette],
      ["Mood", vgb.mood ?? s.mood],
      ["Brand Integration", vgb.brandIntegration ?? s.brandIntegration],
      ["Negative Space", vgb.negativeSpace ?? s.negativeSpace],
      ["Asset ID", vgb.assetId],
    ];

    // Robust image selection (any mirror)
    const imgSrc = (s.imageUrl || s.generatedImageUrl || s.visual?.generatedImageUrl || "").trim();

    // Light-touch recipe render (prompt + model)
    const recipe = s.imageParams || s.visual?.imageParams;

    return `
    <article class="page">
      <header class="page-h">
        <div class="grid3">
          <div><div class="label">Page Title</div><div class="value">${esc(s.pageTitle || `Screen ${i + 1}`)}</div></div>
          <div><div class="label">Type</div><div class="value">${esc(type)}</div></div>
          <div><div class="label">Number</div><div class="value">${esc(pageNo)}</div></div>
        </div>
        <div class="chips">${chips.map(c => `<span class="chip">${c}</span>`).join("")}</div>
      </header>

      <section class="section">
        <div class="title-row">
          <h3>Screen Layout & Visuals</h3>
          <div class="layout">${esc([s.screenLayout, s.visual?.style, s.visual?.composition, s.visual?.environment].filter(Boolean).join(" • "))}</div>
        </div>

        <div class="row">
          <div class="card w-2">
            <h4>AI Visual Generation Brief</h4>
            ${visualPairs.map(([k, v]) => `<div class="kv"><span>${esc(k)}</span><p>${esc(v)}</p></div>`).join("")}
            ${
              imgSrc
                ? `<div class="imgwrap" style="margin-top:8px;">
                     <img src="${imgSrc}" alt="${esc(s.visual?.altText || s.pageTitle || "Scene Image")}" style="width:100%; height:auto; border-radius:6px; border:1px solid var(--b);" />
                   </div>`
                : ""
            }
          </div>
          <div class="col w-1">
            <div class="card"><h4>Alt Text</h4><p>${esc(s.visual?.altText)}</p></div>
            <div class="card"><h4>Overlay Elements</h4><p>${
              Array.isArray(s.visual?.overlayElements) && s.visual?.overlayElements?.length
                ? s.visual!.overlayElements!.map((el, idx) =>
                    `#${idx + 1} ${esc(el.elementType)} – ${esc(el.content)}`
                  ).join("<br/>")
                : "—"
            }</p></div>
            <div class="card"><h4>AI Prompt (legacy)</h4><p>${esc(s.visual?.aiPrompt)}</p></div>
            ${
              recipe
                ? `<div class="card">
                     <h4>Image Recipe</h4>
                     <div class="kv"><span>Prompt</span><p>${esc(recipe.prompt)}</p></div>
                     <div class="kv"><span>Model</span><p>${esc(recipe.model || "imagen-3.0")}</p></div>
                     <div class="kv"><span>Size</span><p>${esc(recipe.size || "1280x720")}</p></div>
                     <div class="kv"><span>Style</span><p>${esc(recipe.style || "photorealistic")}</p></div>
                   </div>`
                : ""
            }
            <div class="card"><h4>Media</h4><p>${esc([s.media?.type, s.media?.style, s.media?.notes].filter(Boolean).join(" • "))}</p></div>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="row">
          <div class="card w-2">
            <h4>Voiceover Script</h4>
            <pre class="mono">${esc(s.audio?.script ?? s.narrationScript)}</pre>
          </div>
          <div class="card">
            <h4>Voice Parameters</h4>
            <div class="kv"><span>Persona</span><p>${esc(s.audio?.voiceParameters?.persona ?? s.voice?.persona)}</p></div>
            <div class="kv"><span>Pace</span><p>${esc(s.audio?.voiceParameters?.pace ?? s.voice?.pace)}</p></div>
            <div class="kv"><span>Tone</span><p>${esc(s.audio?.voiceParameters?.tone ?? s.voice?.tone)}</p></div>
            <div class="kv"><span>Emphasis</span><p>${esc(s.audio?.voiceParameters?.emphasis ?? s.voice?.emphasis)}</p></div>
            <div class="kv"><span>Gender</span><p>${esc(s.audio?.voiceParameters?.gender ?? s.voice?.gender)}</p></div>
          </div>
          <div class="card">
            <h4>AI Directive</h4>
            <pre class="mono">${esc(s.audio?.aiGenerationDirective ?? s.aiDirective)}</pre>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="title-row">
          <h3>Events</h3>
          <div class="ost-words">OST words: ${words(evs.map(e => e?.onScreenText ?? "").join(" "))}</div>
        </div>
        <table class="events">
          <thead><tr><th>Event</th><th>Audio (VO)</th><th>On-Screen Text (OST)</th><th>Dev Notes</th></tr></thead>
          <tbody>
            ${evs
              .map(
                (e, j) => `
              <tr>
                <td class="num">${esc(e?.eventNumber ?? j + 1)}.</td>
                <td><pre class="mono">${esc(e?.audio?.script || e?.narrationScript || e?.voiceover || s.audio?.script || s.narrationScript || "")}</pre></td>
                <td><pre class="mono">${esc(e?.onScreenText || s.onScreenText || "")}</pre></td>
                <td><pre class="mono">${esc(e?.developerNotes || e?.interactive?.behaviourExplanation || s.developerNotes || s.interactionDescription || "")}</pre></td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      </section>

      <section class="section">
        <div class="row">
          <div class="card w-2">
            <h4>Scene Developer Notes</h4>
            <pre class="mono">${esc(s.developerNotes || s.interactionDescription)}</pre>
          </div>
          <div class="card">
            <h4>Accessibility</h4>
            <pre class="mono">${esc(s.accessibilityNotes)}</pre>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="grid-3">
          <div class="card">
            <h4>Interaction</h4>
            <div class="kv"><span>Type</span><p>${esc(s.interactionType || "None")}</p></div>
            <div class="subhead">AI Directive</div>
            <pre class="mono">${esc(s.interaction?.aiDirective || s.interactionDescription)}</pre>
            <div class="kv"><span>Retry Logic</span><p>${esc(s.interaction?.retry)}</p></div>
            <div class="kv"><span>Completion Rule</span><p>${esc(s.interaction?.completion)}</p></div>
          </div>

          <div class="card">
            <h4>Decision Logic</h4>
            <pre class="mono">${esc(s.decisionLogic)}</pre>
          </div>

          <div class="card">
            <h4>xAPI Events</h4>
            ${renderXapi(s.xapiEvents)}
          </div>

            <div class="card">
              <h4>Quick Checks</h4>
              <ul class="checks">
                <li><span class="${yesClass(qc.captionsOn)}">${yes(qc.captionsOn)}</span> Captions ON by default</li>
                <li><span class="${yesClass(qc.keyboardPath)}">${yes(qc.keyboardPath)}</span> Keyboard path provided</li>
                <li><span class="${yesClass(qc.focusOrder)}">${yes(qc.focusOrder)}</span> Focus order guidance</li>
              </ul>
            </div>

            <div class="card">
              <h4>Timing</h4>
              <div>Estimated: ${esc(s.timing?.estimatedSecs ?? s.timing?.estimatedSeconds)}s</div>
            </div>
        </div>
      </section>

      <footer class="page-f">Page ${i + 1} of ${sb.scenes.length}</footer>
    </article>`;
  };

  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${esc(sb.moduleName || "Storyboard")}</title>
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    :root {
      --bg:#ffffff; --bg-alt:#F8F9FA; --ink:#0f172a; --muted:#6b7280;
      --b:#E5E7EB; --th:#EEF2F7; --chip:#E9ECEF; --ok:#28A745; --bad:#DC3545;
    }
    *{box-sizing:border-box}
    body{margin:0; font:9.5pt/1.45 Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; color:var(--ink); -webkit-print-color-adjust: exact; print-color-adjust: exact;}
    pre.mono{margin:0; white-space:pre-wrap; word-break:break-word; font:inherit}

    .page{break-inside:avoid; border:1px solid var(--b); border-radius:8px; overflow:hidden; margin:10mm 0; background:var(--bg)}
    .page-h{background:var(--bg-alt); border-bottom:1px solid var(--b); padding:10px 12px}
    .grid3{display:grid; grid-template-columns: 1fr 140px 110px; gap:10px}
    .label{font-size:8pt; color:var(--muted); margin-bottom:2px; font-weight:600}
    .value{font-size:10.5pt}
    .chips{margin-top:8px; display:flex; gap:6px; flex-wrap:wrap}
    .chip{background:var(--chip); border:1px solid var(--b); padding:2px 8px; border-radius:999px; font-size:8.5pt}

    .section{padding:12px; border-bottom:1px solid var(--b)}
    .section:last-child{border-bottom:0}
    .title-row{display:flex; justify-content:space-between; align-items:center; margin-bottom:8px}
    h3{margin:0; font-size:11pt; font-weight:700}
    .layout{color:#334155}

    .row{display:flex; gap:10px}
    .col{display:flex; flex-direction:column; gap:10px}
    .w-2{flex:2}
    .w-1{flex:1}
    .card{background:var(--bg-alt); border:1px solid var(--b); border-radius:6px; padding:8px; flex:1}
    .card h4{margin:0 0 6px 0; font-size:9.5pt; font-weight:700}
    .kv{display:grid; grid-template-columns: 130px 1fr; gap:8px; margin:4px 0}
    .kv span{color:var(--muted); font-weight:600}
    .subhead{margin-top:6px; color:var(--muted); font-weight:600; font-size:8.8pt}

    table.events, table.kv{width:100%; border-collapse:collapse; table-layout:fixed}
    table.events th, table.events td, .kv .cell, .kv .th{border:1px solid var(--b); padding:6px; vertical-align:top; text-align:left}
    table.events th{background:var(--th); font-weight:700; font-size:8.8pt}
    td.num{width:36px}

    .ost-words{font-size:8.5pt; color:var(--ok)}

    .grid-3{display:grid; gap:10px; grid-template-columns: 1fr 1fr 1fr}

    ul.checks{list-style:none; margin:0; padding:0}
    ul.checks li{display:flex; gap:8px; align-items:center; margin:4px 0}
    .ok{color:var(--ok); font-weight:700}
    .bad{color:var(--bad); font-weight:700}

    .page-f{background:var(--bg-alt); border-top:1px solid var(--b); padding:6px 10px; font-size:8.5pt; text-align:right; color:var(--muted)}
  </style>
</head>
<body>
  ${Array.isArray(sb.scenes) ? sb.scenes.map(scene).join("") : "<p>No scenes.</p>"}
</body>
</html>`;
}

/* ============================= HEALTH ============================== */
app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "genesis-backend", time: new Date().toISOString() });
});

app.get("/healthz", (_req, res) => {
  res.status(200).send("ok");
});

app.get("/version", (_req, res) => {
  res.status(200).json({
    name: "genesis-backend",
    version: process.env.npm_package_version || "0.0.0",
    node: process.version,
    time: new Date().toISOString(),
  });
});

app.get("/api/v1/config", (_req, res) => {
  const mask = (v?: string) => (v ? `${v.slice(0, 4)}…${v.slice(-4)}` : "MISSING");
  res.json({
    success: true,
    data: {
      port: PORT,
      corsOrigin: CORS_ORIGIN,
      supabaseUrl: supabaseUrl || "MISSING",
      supabaseServiceKey: mask(supabaseKey),
      openaiModel: process.env.OPENAI_MODEL || "resolver default",
      openaiEmbedModel: EMBED_MODEL,
      openaiKey: mask(process.env.OPENAI_API_KEY),
      nodeEnv: process.env.NODE_ENV || "development",
      forceGenerateImages: forceImages,
    },
  });
});

/* ======================= WHOAMI (fingerprint) ======================= */
app.get("/whoami", (_req, res) => {
  res.json({
    pkg: process.env.npm_package_name,
    ver: process.env.npm_package_version,
    entry: "index.ts -> dist/index.js",
    node: process.version,
    time: new Date().toISOString(),
  });
});

/* ======================= SEMANTIC SEARCH API ======================= */
app.get(
  "/api/search",
  withTiming("/api/search", async (req: Request, res: Response) => {
    try {
      if (!openai || !supabase) {
        return res.status(500).json({ error: "Server missing OpenAI or Supabase client" });
      }

      const q = String(req.query.q ?? "").trim();
      if (!q) return res.status(400).json({ error: "Missing q" });

      const k = Math.min(Math.max(parseInt(String(req.query.k ?? "5"), 10) || 5, 1), 50);
      const min = Number(req.query.min ?? "0.35");

      const topics = parseCsvParam(req.query.topics);
      const industries = parseCsvParam(req.query.industries);
      const levels = parseCsvParam(req.query.levels);

      // 1) Embed query
      const emb = await openai.embeddings.create({
        model: EMBED_MODEL,
        input: q,
      });
      const v = emb.data[0].embedding;

      // 2) Call RPC (facet-aware version if present, else fallback to basic)
      let rpc = await supabase.rpc("rag_match_storyboards_similarity", {
        query_embedding: v as any,
        match_count: k,
        min_similarity: min,
        topics,
        industries,
        levels,
      });

      if (rpc.error && /function rag_match_storyboards_similarity.* does not exist/i.test(rpc.error.message)) {
        rpc = await supabase.rpc("rag_match_storyboards", {
          query_embedding: v as any,
          match_count: k,
        });
      }

      if (rpc.error) {
        return res.status(500).json({ error: rpc.error.message });
      }

      return res.json({
        query: q,
        count: rpc.data?.length ?? 0,
        results: rpc.data ?? [],
      });
    } catch (e: any) {
      console.error("SEARCH ERROR:", e);
      return res.status(500).json({ error: e?.message || "Search failed" });
    }
  }),
);

/* ============== GENERATE – FROM FILES (PDFs optional) ============== */
app.post(
  "/api/v1/generate-from-files",
  upload.array("files"),
  withTiming("/api/v1/generate-from-files", async (req: Request, res: Response) => {
    try {
      // ---- parse formData from multipart
      let formData: any | undefined;
      const rawFD = (req.body as any)?.formData;
      if (typeof rawFD === "string") {
        try {
          formData = JSON.parse(rawFD);
        } catch {
          formData = rawFD;
        }
      } else if (rawFD) {
        formData = rawFD;
      } else {
        const b: any = req.body || {};
        formData = {
          moduleName: b["formData.moduleName"] ?? b.moduleName,
          complexityLevel: b["formData.complexityLevel"] ?? b.complexityLevel,
          durationMins: b["formData.durationMins"] ?? b.durationMins ?? b.duration,
          targetAudience: b["formData.targetAudience"] ?? b.targetAudience,
          tone: b["formData.tone"] ?? b.tone,
          content: b["formData.content"] ?? b.content,
          aiModel: b["formData.aiModel"] ?? b.aiModel,
          brandGuidelines: b["formData.brandGuidelines"] ?? b.brandGuidelines,
          colours: b["formData.colours"] ?? b.colours,
          fonts: b["formData.fonts"] ?? b.fonts,
          interactionType: b["formData.interactionType"] ?? b.interactionType,
          generateImages: b["formData.generateImages"] ?? b.generateImages,
        };
        const allUndef = Object.values(formData).every(v => v === undefined || v === null || v === "");
        if (allUndef) formData = undefined;
      }

      if (!formData) {
        return res.status(400).json({ success: false, error: { message: "Missing formData in request body." } });
      }

      const numericDurationMins = normaliseDuration(formData.durationMins ?? formData.duration ?? 20);

      // ---- append PDF text if provided
      let extractedContent = formData.content || "";
      const uploadedFiles = Array.isArray(req.files) ? (req.files as Express.Multer.File[]) : [];
      for (const f of uploadedFiles) {
        if (f.mimetype !== "application/pdf") continue;
        const data = await pdf(f.buffer);
        if (data.text) extractedContent += `\n\n--- CONTENT FROM FILE: ${f.originalname} ---\n\n${data.text}`;
      }

      const finalFormData: Record<string, any> = {
        ...formData,
        content: extractedContent,
        brandGuidelines: formData.brandGuidelines || "",
        logoUrl: formData.logoUrl || "",
        durationMins: numericDurationMins,
      };

      if (!String(finalFormData.content || "").trim()) {
        return res.status(400).json({ success: false, error: { message: "Cannot generate a storyboard with no content." } });
      }

      // ---- RAG contexts
      const searchQuery = finalFormData.moduleName || String(finalFormData.content).slice(0, 500);
      const similarExamples = await searchSimilarStoryboards(searchQuery, 2);
      const ragContext =
        similarExamples.length
          ? similarExamples
              .map((ex: any, i: number) => {
                const content =
                  typeof ex.content === "string" ? ex.content : JSON.stringify(ex.content, null, 2);
                return `--- START OF EXAMPLE ${i + 1} ---\n${content}\n--- END OF EXAMPLE ${i + 1} ---`;
              })
              .join("\n\n")
          : "No similar examples were found in the database.";

      const preferredInteraction =
        finalFormData.interactionType || finalFormData.targetInteraction || null;
      const chunkMatches = await searchRelevantChunks(searchQuery, 6, preferredInteraction);
      const ragChunkContext = buildChunkBlueprintContext(chunkMatches);
      const combinedContext = [ragContext, ragChunkContext].join("\n\n");

      // ---- AI generate
      const modelUsed = resolveOpenAIModel(finalFormData.aiModel || undefined);
      const storyRaw = await generateStoryboardFromOpenAI(finalFormData, {
        ragContext: combinedContext,
        aiModel: finalFormData.aiModel || undefined,
      });

      const storyboardBase: StoryboardModuleV2 = (storyRaw as any)?.scenes
        ? (storyRaw as StoryboardModuleV2)
        : ((normalizeToScenes(storyRaw) as unknown) as StoryboardModuleV2);

      // ---- Optional: generate images per scene (respects env override)
      if ((finalFormData.generateImages || forceImages) && Array.isArray(storyboardBase.scenes)) {
        for (const s of storyboardBase.scenes) {
          try {
            const prompt =
              s.visual?.visualGenerationBrief?.sceneDescription ||
              s.visual?.aiPrompt ||
              s.onScreenText ||
              s.narrationScript ||
              s.pageTitle ||
              "Training visual, photorealistic, professional, high-quality";

            const { imageUrl, recipe } = await generateImageFromPrompt(prompt, {
              style: s.visual?.visualGenerationBrief?.style || "photorealistic",
              size: "1280x720",
            });

            if (imageUrl) {
              // set ALL mirrors for maximum compatibility
              s.imageUrl = imageUrl;
              s.generatedImageUrl = imageUrl;
              s.visual = { ...(s.visual || {}), generatedImageUrl: imageUrl, imageParams: recipe };
              s.imageParams = recipe;
            }
          } catch (e) {
            console.error(`[images] Failed for scene ${s.sceneNumber}:`, e);
          }
        }
      }

      const detection = classifyStoryboard(storyboardBase as any);
      const storyboard: StoryboardModuleV2 = {
        ...storyboardBase,
        meta: {
          ...(storyboardBase.meta || {}),
          levelDetection: detection,
          modelUsed,
          rag: {
            exemplars: similarExamples.length,
            chunksUsed: chunkMatches.length,
            preferredInteraction: preferredInteraction || null,
            imagesRequested: Boolean(finalFormData.generateImages || forceImages),
          },
        },
      };

      const payload: StoryboardEnvelope = {
        success: true,
        data: { storyboardModule: storyboard },
        meta: {
          modelRequested: finalFormData.aiModel || null,
          modelUsed,
          ragUsed: true,
          examples: similarExamples.length,
          requestedLevel: finalFormData?.complexityLevel || null,
          detectedLevel: detection?.detectedLevel || null,
          imagesGenerated: Boolean(finalFormData.generateImages || forceImages),
        },
      };
      return res.status(200).json(payload);
    } catch (error: any) {
      console.error("ERROR in /generate-from-files:", error);
      return res.status(502).json({ success: false, error: { message: error?.message || "Generation failed" } });
    }
  }),
);

/* ============== GENERATE – FROM TEXT ONLY ========================= */
app.post(
  "/api/v1/generate-from-text",
  withTiming("/api/v1/generate-from-text", async (req: Request, res: Response) => {
    try {
      const { formData } = req.body || {};
      if (!formData || !String(formData.content || "").trim()) {
        return res.status(400).json({ success: false, error: { message: "Provide formData.content." } });
      }

      formData.durationMins = normaliseDuration(formData.durationMins ?? formData.duration ?? 20);

      // RAG (examples + blueprints)
      const searchQuery = formData.moduleName || String(formData.content).slice(0, 500);
      const similar = await searchSimilarStoryboards(searchQuery, 2);
      const preferredInteraction = formData.interactionType || formData.targetInteraction || null;
      const chunkMatches = await searchRelevantChunks(searchQuery, 6, preferredInteraction);
      const ragChunkContext = buildChunkBlueprintContext(chunkMatches);

      const ragContext =
        similar.length
          ? similar
              .map((ex: any, i: number) => {
                const content =
                  typeof ex.content === "string" ? ex.content : JSON.stringify(ex.content, null, 2);
                return `--- START OF EXAMPLE ${i + 1} ---\n${content}\n--- END OF EXAMPLE ${i + 1} ---`;
              })
              .join("\n\n")
          : "No similar examples were found in the database.";

      // AI generate (use combined context)
      const modelUsed = resolveOpenAIModel(formData.aiModel || undefined);
      const storyRaw = await generateStoryboardFromOpenAI(formData, {
        ragContext: [ragContext, ragChunkContext].join("\n\n"),
        aiModel: formData.aiModel || undefined,
      });

      const storyboardBase: StoryboardModuleV2 = (storyRaw as any)?.scenes
        ? (storyRaw as StoryboardModuleV2)
        : ((normalizeToScenes(storyRaw) as unknown) as StoryboardModuleV2);

      // Optional: generate images (respects env override)
      if ((formData.generateImages || forceImages) && Array.isArray(storyboardBase.scenes)) {
        for (const s of storyboardBase.scenes) {
          try {
            const prompt =
              s.visual?.visualGenerationBrief?.sceneDescription ||
              s.visual?.aiPrompt ||
              s.onScreenText ||
              s.narrationScript ||
              s.pageTitle ||
              "Training visual, photorealistic, professional, high-quality";

            const { imageUrl, recipe } = await generateImageFromPrompt(prompt, {
              style: s.visual?.visualGenerationBrief?.style || "photorealistic",
              size: "1280x720",
            });

            if (imageUrl) {
              s.imageUrl = imageUrl;
              s.generatedImageUrl = imageUrl;
              s.visual = { ...(s.visual || {}), generatedImageUrl: imageUrl, imageParams: recipe };
              s.imageParams = recipe;
            }
          } catch (e) {
            console.error(`[images] Failed for scene ${s.sceneNumber}:`, e);
          }
        }
      }

      const detection = classifyStoryboard(storyboardBase as any);
      const storyboard: StoryboardModuleV2 = {
        ...storyboardBase,
        meta: {
          ...(storyboardBase.meta || {}),
          levelDetection: detection,
          modelUsed,
          rag: {
            exemplars: similar.length,
            chunksUsed: chunkMatches.length,
            preferredInteraction: preferredInteraction || null,
            imagesRequested: Boolean(formData.generateImages || forceImages),
          },
        },
      };

      const envelope: StoryboardEnvelope = {
        success: true,
        data: { storyboardModule: storyboard },
        meta: {
          modelRequested: formData.aiModel || null,
          modelUsed,
          ragUsed: true,
          examples: similar.length,
          requestedLevel: formData?.complexityLevel || null,
          detectedLevel: detection?.detectedLevel || null,
          imagesGenerated: Boolean(formData.generateImages || forceImages),
        },
      };
      res.json(envelope);
    } catch (e: any) {
      console.error("ERROR /generate-from-text:", e);
      res.status(502).json({ success: false, error: { message: e?.message || "Failed" } });
    }
  }),
);

// --- image smoke test ---
app.post("/api/v1/image-smoke", async (req: Request, res: Response) => {
  try {
    const { prompt = "Photorealistic office team on a video call, natural light" } = req.body || {};
    const { imageUrl, recipe } = await generateImageFromPrompt(prompt, {
      style: "photorealistic",
      size: "1280x720",
      aspectRatio: "16:9",
    });
    if (!imageUrl) return res.status(500).json({ ok: false, error: "No imageUrl returned" });
    return res.json({ ok: true, imageUrl, recipe });
  } catch (e: any) {
    console.error("image-smoke error:", e);
    return res.status(500).json({ ok: false, error: e?.message || "Image test failed" });
  }
});

/* ============== VALIDATOR (simple) =================== */
function validateStoryboardInline(sb: StoryboardModuleV2) {
  if (!sb || !Array.isArray(sb.scenes) || sb.scenes.length === 0) {
    throw new Error('Storyboard must contain a non-empty "scenes" array.');
  }
}

/* ======================= PDF – unified builder ================== */
async function renderPdfBufferFromStoryboard(sb: StoryboardModuleV2) {
  validateStoryboardInline(sb);
  const html = buildStoryboardPdfHtml(sb);
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  await page.emulateMediaType("screen");
  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: "10mm", right: "8mm", bottom: "10mm", left: "8mm" },
  });
  await browser.close();
  return pdfBuffer;
}

app.post(
  "/api/v1/generate-pdf",
  withTiming("/api/v1/generate-pdf", async (req: Request, res: Response) => {
    try {
      const sb = req.body as StoryboardModuleV2;
      const pdfBuffer = await renderPdfBufferFromStoryboard(sb);
      res.writeHead(200, {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="storyboard_${String(sb.moduleName || "module")
          .replace(/[^a-z0-9]/gi, "_")
          .toLowerCase()}.pdf"`,
        "Content-Length": pdfBuffer.length,
      });
      res.end(pdfBuffer);
    } catch (err: any) {
      console.error("PDF ERROR:", err);
      res.status(500).json({ message: "PDF generation failed", error: err.message });
    }
  }),
);

app.post(
  "/api/v1/generate-pdf-full",
  withTiming("/api/v1/generate-pdf-full", async (req: Request, res: Response) => {
    try {
      const sb = req.body as StoryboardModuleV2;
      const pdfBuffer = await renderPdfBufferFromStoryboard(sb);
      res.writeHead(200, {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="storyboard_${String(sb.moduleName || "module")
          .replace(/[^a-z0-9]/gi, "_")
          .toLowerCase()}_full.pdf"`,
        "Content-Length": pdfBuffer.length,
      });
      res.end(pdfBuffer);
    } catch (err: any) {
      console.error("PDF FULL ERROR:", err);
      res.status(500).json({ message: "Full PDF generation failed", error: err.message });
    }
  }),
);

/* ============== ALIAS: /api/storyboard/pdf ===================== */
const SELF_BASE = `http://127.0.0.1:${PORT}`;

app.post("/api/storyboard/pdf", async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    if (!payload || !payload.scenes) {
      return res.status(400).json({ message: "Storyboard payload missing or invalid." });
    }
    let upstream = await fetch(`${SELF_BASE}/api/v1/generate-pdf-full`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (upstream.status === 404) {
      upstream = await fetch(`${SELF_BASE}/api/v1/generate-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    if (!upstream.ok) {
      const text = await upstream.text();
      return res.status(upstream.status).json({ message: text || "Upstream PDF generator failed." });
    }
    const arrayBuf = await upstream.arrayBuffer();
    const buf = Buffer.from(arrayBuf);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="storyboard_${String((payload as any).moduleName || "export")
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase()}_exact.pdf"`,
    );
    return res.status(200).send(buf);
  } catch (err: any) {
    console.error("Alias /api/storyboard/pdf failed:", err);
    return res.status(500).json({ message: err?.message || "PDF generation error." });
  }
});

app.get("/api/storyboard/pdf", async (_req: Request, res: Response) => {
  return res.status(501).json({
    message:
      "GET /api/storyboard/pdf?id=... not wired. The UI posts the live storyboard payload to this endpoint.",
  });
});

/* =============================== ROUTES =========================== */
// (Other routers temporarily disabled)

/* =============================== ROOT ============================= */
app.get("/", (_req, res) => res.send("Learno Genesis Backend – Health v1"));

/* =============================== ERRORS =========================== */
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Not Found", path: req.originalUrl });
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal Server Error", detail: err?.message });
});

/* =============================== SERVER =========================== */
app.listen(PORT, () => console.log(`✅ Backend server listening on http://localhost:${PORT}`));
export default app;