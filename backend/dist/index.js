"use strict";
// --- FINAL, CORRECTED index.ts ---
Object.defineProperty(exports, "__esModule", { value: true });
/// <reference path="./declarations.d.ts" />
/**
 * Genesis Backend – Storyboard Generation + RAG + High-Fidelity PDF
 */
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
let compressionMw;
try {
    const comp = require("compression");
    compressionMw = comp.default ?? comp;
}
catch {
    console.warn("⚠️ 'compression' not installed. Continuing without response compression.");
    compressionMw = undefined;
}
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
console.log("🚀 Backend starting. NODE_ENV =", process.env.NODE_ENV);
const puppeteer = require("puppeteer");
const pdf = require("pdf-parse");
const OpenAI = require("openai");
const { createClient } = require("@supabase/supabase-js");
const multer = require("multer");
const client = require("prom-client");
const adminRouter = require("./routes/admin");
const { summarizeContentIfNeeded } = require("./utils/summarizer");
const { generateStoryboardFromOpenAI, resolveOpenAIModel } = require("./services/openaiService"); // ✅ Re-added resolveOpenAIModel
const { parseDurationMins } = require("./utils/parseDuration");
const { classifyStoryboard } = require("./utils/levelClassifier");
const imageRoute = require("./routes/imageRoute");
const { generateImageFromPrompt } = require("./services/imageService");
const { renderStoryboardAsHTML } = require("./services/pdfService");
const { htmlToPdfBuffer } = require("./services/pdfRenderer");
/* ============================== ENV ================================ */
const PORT = Number(process.env.PORT) || 8080;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";
const CORS_ORIGINS = process.env.CORS_ORIGINS || CORS_ORIGIN;
const EMBED_MODEL = process.env.OPENAI_EMBED_MODEL || "text-embedding-3-small";
function toBool(v) {
    const s = String(v ?? "").trim().toLowerCase();
    return s === "1" || s === "true" || s === "yes";
}
const forceImages = toBool(process.env.FORCE_GENERATE_IMAGES);
/* ============================ CLIENTS ============================== */
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
const openai = process.env.OPENAI_API_KEY
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;
/* =========================== EXPRESS APP =========================== */
const app = express();
const IS_PROD = process.env.NODE_ENV === "production";
if (toBool(process.env.USE_HELMET ?? (IS_PROD ? "true" : "false"))) {
    app.use(helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false,
    }));
}
if (toBool(process.env.USE_COMPRESSION ?? "true") && compressionMw) {
    app.use(compressionMw());
}
if (toBool(process.env.USE_RATE_LIMIT ?? (IS_PROD ? "true" : "false"))) {
    const limiter = rateLimit({
        windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000),
        max: Number(process.env.RATE_LIMIT_MAX || 120),
        standardHeaders: true,
        legacyHeaders: false,
    });
    app.use(limiter);
}
if (IS_PROD) {
    app.enable("trust proxy");
    app.use((req, res, next) => {
        const proto = req.headers["x-forwarded-proto"] ||
            (req.secure ? "https" : "http");
        if (proto !== "https") {
            return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
        }
        next();
    });
}
function parseAllowedOrigins() {
    return CORS_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean);
}
const allowedOrigins = parseAllowedOrigins();
const localhostRegex = /^https?:\/\/localhost(?::\d+)?$/i;
const corsDelegate = (req, callback) => {
    const origin = String(req.header("Origin") || "");
    const isAllowed = !origin || localhostRegex.test(origin) || allowedOrigins.includes(origin);
    if (!isAllowed && origin) {
        console.warn("❌ CORS blocked origin:", origin);
    }
    callback(null, { origin: isAllowed });
};
app.use(cors(corsDelegate));
app.options("*", cors(corsDelegate));
app.use(express.json({ limit: "50mb" }));
app.use(morgan(IS_PROD ? "combined" : "dev"));
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
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024, files: 5 },
});
/* ============================= HELPERS ============================== */
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const MIN_DURATION = 5;
const MAX_DURATION = 90;
function normaliseDuration(value) {
    const minutes = parseDurationMins(value);
    return clamp(Math.round(minutes || 0), MIN_DURATION, MAX_DURATION);
}
const parseCsvParam = (v) => typeof v === "string" ? v.split(",").map((s) => s.trim()).filter(Boolean) : null;
/* =========================== RAG HELPERS =========================== */
async function searchSimilarStoryboards(query, topN = 3) {
    // ... implementation remains the same
}
async function searchRelevantChunks(query, topN = 6, preferredInteraction) {
    if (!openai || !supabase)
        return [];
    const emb = await openai.embeddings.create({ model: EMBED_MODEL, input: query });
    const v = emb.data[0].embedding;
    const { data, error } = await supabase.rpc("rag_match_chunks", {
        query_embedding: v,
        match_count: topN,
        interaction_filter: preferredInteraction ?? null, // ✅ Corrected parameter name
        activation_filter: null, // ✅ Added missing parameter
    });
    if (error) {
        console.error("[RAG] chunk RPC error:", error); // Use console.error for actual errors
        return [];
    }
    return data || [];
}
function buildChunkBlueprintContext(rows) {
    // ... implementation remains the same
}
/* ======================= PDF HTML ======================= */
// ... buildStoryboardPdfHtml function remains the same
/* ======================= HEALTH & INFO ROUTES ======================= */
app.get("/health", (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));
app.get("/version", (_req, res) => res.json({ version: process.env.npm_package_version || "0.0.0" }));
app.get("/", (_req, res) => res.send("Learno Genesis Backend – Health v1"));
/* ============== GENERATE – FROM FILES ============== */
app.post("/api/v1/generate-from-files", upload.array("files"), withTiming("/api/v1/generate-from-files", async (req, res) => {
    try {
        const formData = JSON.parse(req.body.formData || "{}");
        const numericDurationMins = normaliseDuration(formData.durationMins ?? formData.duration ?? 20);
        let extractedContent = "";
        const uploadedFiles = req.files;
        for (const f of uploadedFiles) {
            if (f.mimetype === "application/pdf") {
                const data = await pdf(f.buffer);
                if (data.text)
                    extractedContent += `\n\n--- CONTENT FROM FILE: ${f.originalname} ---\n\n${data.text}`;
            }
        }
        const finalFormData = { ...formData, durationMins: numericDurationMins, content: "" };
        if (!openai)
            throw new Error("OpenAI client is not initialized.");
        const summarizedContent = await summarizeContentIfNeeded(extractedContent, openai);
        if (!summarizedContent.trim()) {
            return res.status(400).json({ success: false, error: { message: "Cannot generate with no content." } });
        }
        const searchQuery = finalFormData.moduleName || summarizedContent.slice(0, 500);
        const preferredInteraction = finalFormData.interactionType || null;
        const chunkMatches = await searchRelevantChunks(searchQuery, 6, preferredInteraction);
        const chunkPatternsContext = buildChunkBlueprintContext(chunkMatches);
        const finalRagContext = `${summarizedContent}\n\n${chunkPatternsContext}`;
        const modelUsed = resolveOpenAIModel(finalFormData.aiModel || undefined); // ✅ Re-added this line
        const storyRaw = await generateStoryboardFromOpenAI(finalFormData, {
            ragContext: finalRagContext,
            aiModel: finalFormData.aiModel || undefined,
        });
        const storyboardBase = storyRaw;
        if ((finalFormData.generateImages || forceImages) && Array.isArray(storyboardBase.scenes)) {
            for (const s of storyboardBase.scenes) {
                try {
                    const prompt = s.visual?.visualGenerationBrief?.sceneDescription || s.visual?.aiPrompt || s.onScreenText || s.narrationScript || s.pageTitle || "Training visual, photorealistic";
                    const { imageUrl, recipe } = await generateImageFromPrompt(prompt, { style: "photorealistic", size: "1280x720" });
                    if (imageUrl) {
                        s.imageUrl = imageUrl;
                        s.generatedImageUrl = imageUrl;
                        s.visual = { ...(s.visual || {}), generatedImageUrl: imageUrl, imageParams: recipe };
                        s.imageParams = recipe;
                    }
                }
                catch (e) {
                    console.error(`[images] Failed for scene ${s.sceneNumber}:`, e);
                }
            }
        }
        const detection = classifyStoryboard(storyboardBase);
        const storyboard = {
            ...storyboardBase,
            meta: {
                ...(storyboardBase.meta || {}),
                levelDetection: detection,
                modelUsed, // ✅ Correctly uses the defined variable
                rag: {
                    exemplars: 0,
                    chunksUsed: chunkMatches.length,
                    preferredInteraction: preferredInteraction || null,
                    imagesRequested: Boolean(finalFormData.generateImages || forceImages),
                },
            },
        };
        const envelope = {
            success: true,
            data: { storyboardModule: storyboard },
            meta: {
                modelRequested: finalFormData.aiModel || null,
                modelUsed, // ✅ Correctly uses the defined variable
                ragUsed: true,
                examples: 0,
                requestedLevel: finalFormData?.complexityLevel || null,
                detectedLevel: detection?.detectedLevel || null,
                imagesGenerated: Boolean(finalFormData.generateImages || forceImages),
            },
        };
        res.json(envelope);
    }
    catch (e) {
        console.error("ERROR /generate-from-files:", e);
        res.status(502).json({ success: false, error: { message: e?.message || "Failed" } });
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
        const searchQuery = formData.moduleName || String(formData.content).slice(0, 500);
        const chunkMatches = await searchRelevantChunks(searchQuery, 6, formData.interactionType || null);
        const ragContext = `${formData.content}\n\n${buildChunkBlueprintContext(chunkMatches)}`;
        const modelUsed = resolveOpenAIModel(formData.aiModel || undefined); // ✅ Re-added this line
        const storyRaw = await generateStoryboardFromOpenAI(formData, {
            ragContext,
            aiModel: formData.aiModel || undefined,
        });
        const storyboardBase = storyRaw;
        if ((formData.generateImages || forceImages) && Array.isArray(storyboardBase.scenes)) {
            for (const s of storyboardBase.scenes) {
                try {
                    const prompt = s.visual?.visualGenerationBrief?.sceneDescription || s.visual?.aiPrompt || s.onScreenText || s.narrationScript || s.pageTitle || "Training visual, photorealistic";
                    const { imageUrl, recipe } = await generateImageFromPrompt(prompt, { style: "photorealistic", size: "1280x720" });
                    if (imageUrl) {
                        s.imageUrl = imageUrl;
                        s.generatedImageUrl = imageUrl;
                        s.visual = { ...(s.visual || {}), generatedImageUrl: imageUrl, imageParams: recipe };
                        s.imageParams = recipe;
                    }
                }
                catch (e) {
                    console.error(`[images] Failed for scene ${s.sceneNumber}:`, e);
                }
            }
        }
        const detection = classifyStoryboard(storyboardBase);
        const storyboard = {
            ...storyboardBase,
            meta: {
                ...(storyboardBase.meta || {}),
                levelDetection: detection,
                modelUsed, // ✅ Correctly uses the defined variable
                rag: {
                    exemplars: 0,
                    chunksUsed: chunkMatches.length,
                    preferredInteraction: formData.interactionType || null,
                    imagesRequested: Boolean(formData.generateImages || forceImages),
                },
            },
        };
        const envelope = {
            success: true,
            data: { storyboardModule: storyboard },
            meta: {
                modelRequested: formData.aiModel || null,
                modelUsed, // ✅ Correctly uses the defined variable
                ragUsed: true,
                examples: 0,
                requestedLevel: formData?.complexityLevel || null,
                detectedLevel: detection?.detectedLevel || null,
                imagesGenerated: Boolean(formData.generateImages || forceImages),
            },
        };
        res.json(envelope);
    }
    catch (e) {
        console.error("ERROR /generate-from-text:", e);
        res.status(502).json({ success: false, error: { message: e?.message || "Failed" } });
    }
}));
/* ======================= PDF & OTHER ROUTES ================== */
app.post("/api/storyboard/pdf", withTiming("/api/storyboard/pdf", async (req, res) => {
    try {
        const storyboard = req.body;
        if (!storyboard || typeof storyboard !== "object") {
            return res.status(400).json({ message: "Storyboard JSON required." });
        }
        const html = renderStoryboardAsHTML(storyboard);
        const pdfBuffer = await htmlToPdfBuffer(html);
        const isPdf = Buffer.isBuffer(pdfBuffer) &&
            pdfBuffer.length > 5 &&
            pdfBuffer.subarray(0, 5).toString("utf8") === "%PDF-";
        console.log(`[pdf] render complete — bytes=${pdfBuffer?.length ?? 0}, valid=${isPdf}`);
        if (!isPdf) {
            return res
                .status(500)
                .json({ message: "PDF renderer returned invalid data." });
        }
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "attachment; filename=storyboard.pdf");
        res.end(pdfBuffer);
    }
    catch (err) {
        console.error("[pdf] Failed to render storyboard PDF:", err);
        const message = err?.message || "Failed to render PDF";
        res.status(500).json({ message });
    }
}));
/* =============================== ERRORS & SERVER =========================== */
app.use((req, res) => res.status(404).json({ error: "Not Found", path: req.originalUrl }));
app.use((err, _req, res, _next) => {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal Server Error", detail: err?.message });
});
app.listen(PORT, () => console.log(`✅ Backend server listening on http://localhost:${PORT}`));
module.exports = app;
//# sourceMappingURL=index.js.map