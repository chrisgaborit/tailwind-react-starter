"use strict";
/// <reference path="./declarations.d.ts" />
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Genesis Backend – Storyboard Generation + RAG + High-Fidelity PDF
 * - Single master PDF builder that matches the detailed on-screen storyboard
 * - /api/v1/generate-pdf and /api/v1/generate-pdf-full both use the same builder
 * - /api/storyboard/pdf (alias) POSTs a payload and returns the exact PDF
 */
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const puppeteer_1 = __importDefault(require("puppeteer"));
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const openai_1 = __importDefault(require("openai"));
const supabase_js_1 = require("@supabase/supabase-js");
const multer_1 = __importDefault(require("multer"));
const prom_client_1 = __importDefault(require("prom-client"));
// Routes (unchanged app routes you already have)
// TEMP: disabled assetsRouter import
// TEMP: disabled storyboardRoute import
// TEMP: disabled storyboardGenRoute import
// Services / utils
const openaiService_1 = require("./services/openaiService");
const parseDuration_1 = require("./utils/parseDuration");
const levelClassifier_1 = require("./utils/levelClassifier");
const normalizeStoryboard_1 = require("./utils/normalizeStoryboard");
/* ============================== ENV ================================ */
const PORT = Number(process.env.PORT) || 8080;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";
const CORS_ORIGINS = process.env.CORS_ORIGINS || CORS_ORIGIN;
const EMBED_MODEL = process.env.OPENAI_EMBED_MODEL || "text-embedding-3-small";
/* ============================ CLIENTS ============================== */
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseKey ? (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey) : null;
const openai = process.env.OPENAI_API_KEY ? new openai_1.default({ apiKey: process.env.OPENAI_API_KEY }) : null;
/* =========================== EXPRESS APP =========================== */
const app = (0, express_1.default)();
/* CORS */
function parseAllowedOrigins() {
    return CORS_ORIGINS.split(",").map(s => s.trim()).filter(Boolean);
}
const allowedOrigins = parseAllowedOrigins();
const localhostRegex = /^https?:\/\/localhost(?::\d+)?$/i;
const corsDelegate = (req, callback) => {
    const originHeader = req.header?.("Origin") ??
        req.headers?.origin ??
        req.headers?.Origin ??
        "";
    const origin = String(originHeader || "");
    const isAllowed = localhostRegex.test(origin) || allowedOrigins.includes(origin);
    callback(null, {
        origin: isAllowed ? origin : false,
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"],
    });
};
app.use((0, cors_1.default)(corsDelegate));
app.options("*", (0, cors_1.default)(corsDelegate));
app.use(express_1.default.json({ limit: "50mb" }));
app.use((0, morgan_1.default)("dev"));
/* ============================ METRICS ============================== */
const metricsRegistry = new prom_client_1.default.Registry();
metricsRegistry.setDefaultLabels({ service: "genesis-backend" });
prom_client_1.default.collectDefaultMetrics({ register: metricsRegistry });
const httpDuration = new prom_client_1.default.Histogram({
    name: "http_request_duration_seconds",
    help: "Duration of HTTP requests in seconds",
    labelNames: ["method", "route", "code"],
    buckets: [0.1, 0.3, 0.7, 1, 2, 5, 10, 30],
});
metricsRegistry.registerMetric(httpDuration);
function withTiming(route, handler) {
    return async (req, res, next) => {
        const end = httpDuration.startTimer({ method: req.method, route });
        try {
            await handler(req, res, next);
            end({ code: String(res.statusCode) });
        }
        catch (e) {
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
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024, files: 5 },
});
/* ============================= HELPERS ============================== */
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const MIN_DURATION = 5;
const MAX_DURATION = 90;
function normaliseDuration(value) {
    const minutes = (0, parseDuration_1.parseDurationMins)(value);
    return clamp(Math.round(minutes || 0), MIN_DURATION, MAX_DURATION);
}
const parseCsvParam = (v) => typeof v === "string" ? v.split(",").map(s => s.trim()).filter(Boolean) : null;
/* =========================== RAG HELPERS =========================== */
async function searchSimilarStoryboards(query, topN = 3) {
    if (!openai || !supabase)
        return [];
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
/* ======================= PDF HTML (High-Fidelity) ======================= */
const esc = (v) => v === 0 || v === "0"
    ? "0"
    : v
        ? String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        : "—";
const words = (t) => (t || "").trim().split(/\s+/).filter(Boolean).length;
function buildStoryboardPdfHtml(sb) {
    const renderXapi = (events) => {
        const rows = (Array.isArray(events) ? events : [])
            .map(e => `
      <tr>
        <td class="cell">${esc(e?.verb)}</td>
        <td class="cell">${esc(e?.object)}</td>
        <td class="cell">${esc(e?.result)}</td>
      </tr>
    `)
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
    const scene = (s, i) => {
        const evs = Array.isArray(s.events) && s.events.length
            ? s.events
            : [
                {
                    eventNumber: 1,
                    narrationScript: s.narrationScript,
                    onScreenText: s.onScreenText,
                    developerNotes: s.developerNotes || s.interactionDescription,
                },
            ];
        const ostCombined = evs.map(e => e?.onScreenText ?? s.onScreenText ?? "").join(" ");
        const type = s.interactionType && s.interactionType !== "None" ? "Interactive" : "Informative";
        const pageNo = `p${String(i + 1).padStart(2, "0")}`;
        // little header chips: aspect + interaction type
        const chips = [];
        chips.push(esc(s.visual?.aspectRatio || "16:9"));
        chips.push(esc(s.interactionType || "None"));
        const qc = s.quickChecks || {};
        const yes = (b) => (b ? "✓" : "✗");
        const yesClass = (b) => (b ? "ok" : "bad");
        // visual meta (matches on-screen cards)
        const visualPairs = [
            ["Scene", s.visual?.environment],
            ["Style", s.visual?.style],
            ["Subject", s.visual?.subject || "{}"],
            ["Setting", s.visual?.setting],
            ["Composition", s.visual?.composition],
            ["Lighting", s.visual?.lighting || s.lighting],
            ["Colour Palette", Array.isArray(s.palette) ? s.palette.join(", ") : s.colourPalette],
            ["Mood", s.mood],
            ["Brand Integration", s.brandIntegration],
            ["Negative Space", s.negativeSpace],
        ];
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
          </div>
          <div class="col w-1">
            <div class="card"><h4>Alt Text</h4><p>${esc(s.visual?.altText)}</p></div>
            <div class="card"><h4>AI Prompt (legacy)</h4><p>${esc(s.visual?.aiPrompt)}</p></div>
            <div class="card"><h4>Media</h4><p>${esc([s.media?.type, s.media?.style, s.media?.notes].filter(Boolean).join(" • "))}</p></div>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="row">
          <div class="card w-2">
            <h4>Voiceover Script</h4>
            <pre class="mono">${esc(s.narrationScript)}</pre>
          </div>
          <div class="card">
            <h4>Voice Parameters</h4>
            <div class="kv"><span>Persona</span><p>${esc(s.voice?.persona)}</p></div>
            <div class="kv"><span>Pace</span><p>${esc(s.voice?.pace)}</p></div>
            <div class="kv"><span>Tone</span><p>${esc(s.voice?.tone)}</p></div>
            <div class="kv"><span>Emphasis</span><p>${esc(s.voice?.emphasis)}</p></div>
            <div class="kv"><span>Gender</span><p>${esc(s.voice?.gender)}</p></div>
          </div>
          <div class="card">
            <h4>AI Directive</h4>
            <pre class="mono">${esc(s.aiDirective)}</pre>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="title-row">
          <h3>Events</h3>
          <div class="ost-words">OST words: ${words(ostCombined)}</div>
        </div>
        <table class="events">
          <thead><tr><th>Event</th><th>Audio (VO)</th><th>On-Screen Text (OST)</th><th>Dev Notes</th></tr></thead>
          <tbody>
            ${evs
            .map((e, j) => `
              <tr>
                <td class="num">${esc(e?.eventNumber ?? j + 1)}.</td>
                <td><pre class="mono">${esc(e?.audio?.script || e?.narrationScript || e?.voiceover || s.narrationScript || "")}</pre></td>
                <td><pre class="mono">${esc(e?.onScreenText || s.onScreenText || "")}</pre></td>
                <td><pre class="mono">${esc(e?.developerNotes || e?.interactive?.behaviourExplanation || s.developerNotes || s.interactionDescription || "")}</pre></td>
              </tr>
            `)
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
            <div>Estimated: ${esc(s.timing?.estimatedSecs)}s</div>
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
    });
});
app.get("/api/v1/config", (_req, res) => {
    const mask = (v) => (v ? `${v.slice(0, 4)}…${v.slice(-4)}` : "MISSING");
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
/**
 * GET /api/search
 * Query params:
 *   q:              string (required)
 *   k:              number (default 5, 1..50)
 *   min:            number (minimum similarity, default 0.35)
 *   topics:         CSV (optional)
 *   industries:     CSV (optional)
 *   levels:         CSV (optional)
 */
app.get("/api/search", withTiming("/api/search", async (req, res) => {
    try {
        if (!openai || !supabase) {
            return res.status(500).json({ error: "Server missing OpenAI or Supabase client" });
        }
        const q = String(req.query.q ?? "").trim();
        if (!q)
            return res.status(400).json({ error: "Missing q" });
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
            query_embedding: v,
            match_count: k,
            min_similarity: min,
            topics,
            industries,
            levels,
        });
        if (rpc.error && /function rag_match_storyboards_similarity.* does not exist/i.test(rpc.error.message)) {
            // fallback to older function signature
            rpc = await supabase.rpc("rag_match_storyboards", {
                query_embedding: v,
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
    }
    catch (e) {
        console.error("SEARCH ERROR:", e);
        return res.status(500).json({ error: e?.message || "Search failed" });
    }
}));
/* ============== GENERATE – FROM FILES (PDFs optional) ============== */
app.post("/api/v1/generate-from-files", upload.array("files"), withTiming("/api/v1/generate-from-files", async (req, res) => {
    try {
        // ---- parse formData from multipart
        let formData;
        const rawFD = req.body?.formData;
        if (typeof rawFD === "string") {
            try {
                formData = JSON.parse(rawFD);
            }
            catch {
                formData = rawFD;
            }
        }
        else if (rawFD) {
            formData = rawFD;
        }
        else {
            const b = req.body || {};
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
            };
            const allUndef = Object.values(formData).every(v => v === undefined || v === null || v === "");
            if (allUndef)
                formData = undefined;
        }
        if (!formData) {
            return res.status(400).json({ success: false, error: { message: "Missing formData in request body." } });
        }
        const numericDurationMins = normaliseDuration(formData.durationMins ?? formData.duration ?? 20);
        // ---- append PDF text if provided
        let extractedContent = formData.content || "";
        const uploadedFiles = Array.isArray(req.files) ? req.files : [];
        for (const f of uploadedFiles) {
            if (f.mimetype !== "application/pdf")
                continue;
            const data = await (0, pdf_parse_1.default)(f.buffer);
            if (data.text)
                extractedContent += `\n\n--- CONTENT FROM FILE: ${f.originalname} ---\n\n${data.text}`;
        }
        const finalFormData = {
            ...formData,
            content: extractedContent,
            brandGuidelines: formData.brandGuidelines || "",
            logoUrl: formData.logoUrl || "",
            durationMins: numericDurationMins,
        };
        if (!String(finalFormData.content || "").trim()) {
            return res.status(400).json({ success: false, error: { message: "Cannot generate a storyboard with no content." } });
        }
        // ---- RAG
        const searchQuery = finalFormData.moduleName || String(finalFormData.content).slice(0, 500);
        const similarExamples = await searchSimilarStoryboards(searchQuery, 2);
        const ragContext = similarExamples.length
            ? similarExamples
                .map((ex, i) => {
                const content = typeof ex.content === "string" ? ex.content : JSON.stringify(ex.content, null, 2);
                return `--- START OF EXAMPLE ${i + 1} ---\n${content}\n--- END OF EXAMPLE ${i + 1} ---`;
            })
                .join("\n\n")
            : "No similar examples were found in the database.";
        // ---- AI generate
        const modelUsed = (0, openaiService_1.resolveOpenAIModel)(finalFormData.aiModel || undefined);
        const storyRaw = await (0, openaiService_1.generateStoryboardFromOpenAI)(finalFormData, {
            ragContext,
            aiModel: finalFormData.aiModel || undefined,
        });
        const storyboardBase = storyRaw?.scenes
            ? storyRaw
            : (0, normalizeStoryboard_1.normalizeToScenes)(storyRaw);
        const detection = (0, levelClassifier_1.classifyStoryboard)(storyboardBase);
        const storyboard = {
            ...storyboardBase,
            meta: { ...(storyboardBase.meta || {}), levelDetection: detection, modelUsed },
        };
        const payload = {
            success: true,
            data: { storyboardModule: storyboard },
            meta: {
                modelRequested: finalFormData.aiModel || null,
                modelUsed,
                ragUsed: true,
                examples: similarExamples.length,
                requestedLevel: finalFormData?.complexityLevel || null,
                detectedLevel: detection?.detectedLevel || null,
            },
        };
        return res.status(200).json(payload);
    }
    catch (error) {
        console.error("ERROR in /generate-from-files:", error);
        return res.status(502).json({ success: false, error: { message: error?.message || "Generation failed" } });
    }
}));
/* ============== GENERATE – FROM TEXT ONLY ========================= */
app.post("/api/v1/generate-from-text", withTiming("/api/v1/generate-from-text", async (req, res) => {
    try {
        const { formData } = req.body || {};
        if (!formData || !String(formData.content || "").trim()) {
            return res.status(400).json({ success: false, error: { message: "Provide formData.content." } });
        }
        formData.durationMins = normaliseDuration(formData.durationMins ?? formData.duration ?? 20);
        // RAG
        const searchQuery = formData.moduleName || String(formData.content).slice(0, 500);
        const similar = await searchSimilarStoryboards(searchQuery, 2);
        const ragContext = similar.length
            ? similar
                .map((ex, i) => {
                const content = typeof ex.content === "string" ? ex.content : JSON.stringify(ex.content, null, 2);
                return `--- START OF EXAMPLE ${i + 1} ---\n${content}\n--- END OF EXAMPLE ${i + 1} ---`;
            })
                .join("\n\n")
            : "No similar examples were found in the database.";
        // AI generate
        const modelUsed = (0, openaiService_1.resolveOpenAIModel)(formData.aiModel || undefined);
        const storyRaw = await (0, openaiService_1.generateStoryboardFromOpenAI)(formData, {
            ragContext,
            aiModel: formData.aiModel || undefined,
        });
        const storyboardBase = storyRaw?.scenes
            ? storyRaw
            : (0, normalizeStoryboard_1.normalizeToScenes)(storyRaw);
        const detection = (0, levelClassifier_1.classifyStoryboard)(storyboardBase);
        const storyboard = {
            ...storyboardBase,
            meta: { ...(storyboardBase.meta || {}), levelDetection: detection, modelUsed },
        };
        const envelope = {
            success: true,
            data: { storyboardModule: storyboard },
            meta: {
                modelRequested: formData.aiModel || null,
                modelUsed,
                ragUsed: true,
                examples: similar.length,
                requestedLevel: formData?.complexityLevel || null,
                detectedLevel: detection?.detectedLevel || null,
            },
        };
        res.json(envelope);
    }
    catch (e) {
        console.error("ERROR /generate-from-text:", e);
        res.status(502).json({ success: false, error: { message: e?.message || "Failed" } });
    }
}));
/* ============== VALIDATOR (simple) =================== */
function validateStoryboardInline(sb) {
    if (!sb || !Array.isArray(sb.scenes) || sb.scenes.length === 0) {
        throw new Error('Storyboard must contain a non-empty "scenes" array.');
    }
}
/* ======================= PDF – unified builder ================== */
async function renderPdfBufferFromStoryboard(sb) {
    validateStoryboardInline(sb);
    const html = buildStoryboardPdfHtml(sb);
    const browser = await puppeteer_1.default.launch({
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
app.post("/api/v1/generate-pdf", withTiming("/api/v1/generate-pdf", async (req, res) => {
    try {
        const sb = req.body;
        const pdfBuffer = await renderPdfBufferFromStoryboard(sb);
        res.writeHead(200, {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="storyboard_${String(sb.moduleName || "module")
                .replace(/[^a-z0-9]/gi, "_")
                .toLowerCase()}.pdf"`,
            "Content-Length": pdfBuffer.length,
        });
        res.end(pdfBuffer);
    }
    catch (err) {
        console.error("PDF ERROR:", err);
        res.status(500).json({ message: "PDF generation failed", error: err.message });
    }
}));
app.post("/api/v1/generate-pdf-full", withTiming("/api/v1/generate-pdf-full", async (req, res) => {
    try {
        const sb = req.body;
        const pdfBuffer = await renderPdfBufferFromStoryboard(sb);
        res.writeHead(200, {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="storyboard_${String(sb.moduleName || "module")
                .replace(/[^a-z0-9]/gi, "_")
                .toLowerCase()}_full.pdf"`,
            "Content-Length": pdfBuffer.length,
        });
        res.end(pdfBuffer);
    }
    catch (err) {
        console.error("PDF FULL ERROR:", err);
        res.status(500).json({ message: "Full PDF generation failed", error: err.message });
    }
}));
/* ============== ALIAS: /api/storyboard/pdf ===================== */
const SELF_BASE = `http://127.0.0.1:${PORT}`;
app.post("/api/storyboard/pdf", async (req, res) => {
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
        res.setHeader("Content-Disposition", `attachment; filename="storyboard_${String(payload.moduleName || "export")
            .replace(/[^a-z0-9]/gi, "_")
            .toLowerCase()}_exact.pdf"`);
        return res.status(200).send(buf);
    }
    catch (err) {
        console.error("Alias /api/storyboard/pdf failed:", err);
        return res.status(500).json({ message: err?.message || "PDF generation error." });
    }
});
app.get("/api/storyboard/pdf", async (_req, res) => {
    return res.status(501).json({
        message: "GET /api/storyboard/pdf?id=... not wired. The UI posts the live storyboard payload to this endpoint.",
    });
});
/* =============================== ROUTES =========================== */
// TEMP: disabled storyboardGenRoute
// TEMP: disabled storyboardRoute
// TEMP: disabled assetsRouter
// Distinct root banner so we can verify the live revision quickly
app.get("/", (_req, res) => res.send("Learno Genesis Backend – Health v1"));
/* =============================== ERRORS =========================== */
app.use((req, res) => {
    res.status(404).json({ error: "Not Found", path: req.originalUrl });
});
app.use((err, _req, res, _next) => {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal Server Error", detail: err?.message });
});
/* =============================== SERVER =========================== */
app.listen(PORT, () => console.log(`✅ Backend server listening on http://localhost:${PORT}`));
exports.default = app;
//# sourceMappingURL=index.js.map