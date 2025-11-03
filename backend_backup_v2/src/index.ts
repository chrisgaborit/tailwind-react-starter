// --- FINAL, CORRECTED index.ts ---

/// <reference path="./declarations.d.ts" />

/**
 * Genesis Backend – Storyboard Generation + RAG + High-Fidelity PDF
 */

import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
let compressionMw;
try {
  const comp = require("compression");
  compressionMw = comp.default ?? comp;
} catch {
  console.warn("⚠️ 'compression' not installed. Continuing without response compression.");
  compressionMw = undefined;
}
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

console.log("🚀 Boot sequence started. NODE_ENV:", process.env.NODE_ENV);

console.log('🧩 Environment Vars Loaded:', {
  SUPABASE_URL: !!process.env.SUPABASE_URL,
  SUPABASE_KEY: !!process.env.SUPABASE_KEY,
  OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
  PORT: process.env.PORT,
});

const puppeteer = require("puppeteer");
const pdf = require("pdf-parse");
const OpenAI = require("openai");
const { createClient } = require("@supabase/supabase-js");
const multer = require("multer");
const client = require("prom-client");

const adminRouter = require("./routes/admin");
const { summarizeContentIfNeeded } = require("./utils/summarizer");
const { generateStoryboardFromOpenAI, resolveOpenAIModel } = require("./services/openaiService"); // ✅ Re-added resolveOpenAIModel
const { GapAwareOrchestrator } = require("./services/gapAwareOrchestrator"); // 🆕 Gap-aware orchestrator
const { parseDurationMins } = require("./utils/parseDuration");
const { classifyStoryboard } = require("./utils/levelClassifier");
const imageRoute = require("./routes/imageRoute");
// const feedbackRoute = require("./routes/feedbackRoute"); // temporarily disabled
const { generateImageFromPrompt } = require("./services/imageService");
const { renderStoryboardAsHTML } = require("./services/pdfService");
const { htmlToPdfBuffer } = require("./services/pdfRenderer");

// 🆕 Agents v2 routes
import v2Routes from "./index.v2.routes";

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
  voice?: {
    persona?: string;
    pace?: string;
    tone?: string;
    emphasis?: string;
    gender?: string;
  };
  aiDirective?: string;
  media?: { type?: string; style?: string; notes?: string };
  palette?: string[];
  colourPalette?: string;
  mood?: string;
  brandIntegration?: string;
  negativeSpace?: string;
  lighting?: string;
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
  imageUrl?: string;
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

function toBool(v?: string | number | boolean) {
  const s = String(v ?? "").trim().toLowerCase();
  return s === "1" || s === "true" || s === "yes";
}
const forceImages = toBool(process.env.FORCE_GENERATE_IMAGES);

/* ============================ CLIENTS ============================== */
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

/* =========================== EXPRESS APP =========================== */
const app = express();
const IS_PROD = process.env.NODE_ENV === "production";

if (toBool(process.env.USE_HELMET ?? (IS_PROD ? "true" : "false"))) {
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );
}
if (toBool(process.env.USE_COMPRESSION ?? "true") && compressionMw) {
  app.use(compressionMw());
}
if (toBool(process.env.USE_RATE_LIMIT ?? (IS_PROD ? "true" : "false"))) {
  const limiter = rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000),
    max: Number(process.env.RATE_LIMIT_MAX || 120),
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);
}
if (IS_PROD) {
  app.enable("trust proxy");
  app.use((req, res, next) => {
    const proto =
      (req.headers["x-forwarded-proto"] as string) ||
      (req.secure ? "https" : "http");
    if (proto !== "https") {
      return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
    }
    next();
  });
}

function parseAllowedOrigins(): string[] {
  return CORS_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean);
}
const allowedOrigins = parseAllowedOrigins();
const localhostRegex = /^https?:\/\/localhost(?::\d+)?$/i;

const corsDelegate = (req, callback) => {
  const origin = String(req.header("Origin") || "");
  const isAllowed =
    !origin || localhostRegex.test(origin) || allowedOrigins.includes(origin);
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

// 🆕 Agents v2 routes (conditional)
if (process.env.AGENTS_V2 === "1") {
  app.use(v2Routes);
  console.log("✅ Agents v2 routes loaded");
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});
// app.use("/api/feedback", feedbackRoute); // temporarily disabled

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
const MAX_UPLOAD_FILES = Number(process.env.MAX_UPLOAD_FILES || 12);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024, files: MAX_UPLOAD_FILES },
});

const uploadFilesMiddleware = (req, res, next) => {
  upload.array("files")(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_COUNT") {
        return res.status(400).json({
          success: false,
          error: { message: `You can upload up to ${MAX_UPLOAD_FILES} files per request.` },
        });
      }
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          error: { message: "Each file must be 25MB or smaller." },
        });
      }
      if (err.code === "LIMIT_UNEXPECTED_FILE") {
        return res.status(400).json({
          success: false,
          error: { message: "Unexpected upload field." },
        });
      }
      return res.status(400).json({
        success: false,
        error: { message: err.message || "Upload failed." },
      });
    }
    next();
  });
};

/* ============================= HELPERS ============================== */
const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));
const MIN_DURATION = 5;
const MAX_DURATION = 90;

function normaliseDuration(value: unknown): number {
  const minutes = parseDurationMins(value);
  return clamp(Math.round(minutes || 0), MIN_DURATION, MAX_DURATION);
}

const parseCsvParam = (v: unknown): string[] | null =>
  typeof v === "string" ? v.split(",").map((s) => s.trim()).filter(Boolean) : null;

/* =========================== RAG HELPERS =========================== */
const { getRAGConfig, buildRAGQueryWithFilters } = require('./utils/ragConfig');

// Initialize RAG configuration
const ragConfig = getRAGConfig();

async function searchSimilarStoryboards(query: string, topN: number = 3) {
  // ... implementation remains the same
}
async function searchRelevantChunks(query: string, topN: number = 6, preferredInteraction?: string | null): Promise<any[]> {
  if (!openai || !supabase) return [];
  const emb = await openai.embeddings.create({ model: EMBED_MODEL, input: query });
  const v = emb.data[0].embedding;

  // Use the new RAG table with archived filtering
  const { data, error } = await buildRAGQueryWithFilters(supabase, ragConfig, {
    interaction_type: preferredInteraction
  })
    .select('id, content, metadata, storyboard_id, scene_no, pedagogical_metadata, engagement_score')
    .order('engagement_score', { ascending: false })
    .limit(topN);

  if (error) {
    console.error("[RAG] chunk query error:", error);
    return [];
  }
  return data || [];
}
function buildChunkBlueprintContext(rows: any[]): string {
  if (!rows || rows.length === 0) return "";
  
  return rows
    .map((row, idx) => {
      const content = row.content || row.text || "";
      const title = row.title || `Chunk ${idx + 1}`;
      return `--- ${title} ---\n${content}`;
    })
    .join("\n\n");
}

/* ======================= PDF HTML ======================= */
// ... buildStoryboardPdfHtml function remains the same

/* ======================= HEALTH & INFO ROUTES ======================= */
app.get("/health", (_req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));
app.get("/version", (_req, res) => res.json({ version: process.env.npm_package_version || "0.0.0" }));
app.get("/", (_req, res) => res.send("Learno Genesis Backend – Health v1"));

/* ============== GENERATE – FROM FILES ============== */
app.post(
  "/api/v1/generate-from-files",
  uploadFilesMiddleware,
  withTiming("/api/v1/generate-from-files", async (req, res) => {
    try {
      const formData = JSON.parse(req.body.formData || "{}");
      const numericDurationMins = normaliseDuration(formData.durationMins ?? formData.duration ?? 20);
      let extractedContent = "";
      const uploadedFiles = (req.files as Express.Multer.File[]) || [];
      console.log(`📁 Processing ${uploadedFiles.length} uploaded files`);
      
      for (const f of uploadedFiles) {
        if (f.mimetype === "application/pdf") {
          try {
            // Check if buffer has data
            if (!f.buffer || f.buffer.length === 0) {
              console.warn(`Skipping empty PDF file: ${f.originalname}`);
              continue;
            }
            
            const data = await pdf(f.buffer);
            if (data && data.text) {
              extractedContent += `\n\n--- CONTENT FROM FILE: ${f.originalname} ---\n\n${data.text}`;
            } else {
              console.warn(`No text extracted from PDF: ${f.originalname}`);
            }
          } catch (pdfError) {
            console.error(`Error parsing PDF ${f.originalname}:`, pdfError);
            // Continue with other files instead of failing completely
            continue;
          }
        }
      }

      const finalFormData = { ...formData, durationMins: numericDurationMins, content: "" };
      if (!openai) throw new Error("OpenAI client is not initialized.");
      
      // If no content was extracted from files, use form data content as fallback
      if (!extractedContent.trim() && formData.content) {
        extractedContent = formData.content;
      }
      
      const summarizedContent = await summarizeContentIfNeeded(extractedContent, openai);
      if (!summarizedContent.trim()) {
        return res.status(400).json({ 
          success: false, 
          error: { 
            message: "Cannot generate storyboard with no content. Please ensure your PDF files are valid and contain readable text, or provide content in the form." 
          } 
        });
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

      // Internal pages enforcement removed per user request
      let processedStoryboard = storyRaw;

      if ((finalFormData.generateImages || forceImages) && Array.isArray(processedStoryboard.scenes)) {
        for (const s of processedStoryboard.scenes) {
          try {
            const prompt = s.visual?.visualGenerationBrief?.sceneDescription || s.visual?.aiPrompt || s.onScreenText || s.narrationScript || s.pageTitle || "Training visual, photorealistic";
            const { imageUrl, recipe } = await generateImageFromPrompt(prompt, { style: "photorealistic", size: "1280x720" });
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

      const detection = classifyStoryboard(processedStoryboard);
      const storyboard = {
        ...processedStoryboard,
        meta: {
          ...(processedStoryboard.meta || {}),
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
    } catch (e: any) {
      console.error("💥 Generation failed:", e?.response?.data || e.message || e);
      
      // Provide detailed error information
      const errorDetails = {
        message: e?.message || "Server crash during generation",
        type: e?.name || "UnknownError",
        stack: process.env.NODE_ENV === 'development' ? e?.stack : undefined,
        details: e?.response?.data || null
      };
      
      console.error("🔍 Error details:", errorDetails);
      
      res.status(500).json({
        error: true,
        success: false,
        message: errorDetails.message,
        details: errorDetails.details,
        type: errorDetails.type
      });
    }
  }),
);

/* ============== GENERATE – FROM TEXT ONLY ========================= */
app.post(
  "/api/v1/generate-from-text",
  withTiming("/api/v1/generate-from-text", async (req, res) => {
    try {
      const { formData } = req.body || {};
      if (!formData || !String(formData.content || "").trim()) {
        return res.status(400).json({ success: false, error: { message: "Provide formData.content." } });
      }
      formData.durationMins = normaliseDuration(formData.durationMins ?? formData.duration ?? 20);

      const searchQuery = formData.moduleName || String(formData.content).slice(0, 500);
      const chunkMatches = await searchRelevantChunks(searchQuery, 6, formData.interactionType || null);
      const ragContext = `${formData.content}\n\n${buildChunkBlueprintContext(chunkMatches)}`;
      
      // 🧠 PEDAGOGICAL INTELLIGENCE LAYER
      const { PedagogicalOrchestrator } = require('./services/pedagogicalOrchestrator');
      const pedagogicalOrchestrator = new PedagogicalOrchestrator();
      
      const sourceMaterial = {
        summary: formData.content?.slice(0, 500) || '',
        content: formData.content || '',
        metadata: { moduleName: formData.moduleName, audience: formData.targetAudience }
      };
      
      const pedagogicalResult = await pedagogicalOrchestrator.orchestratePedagogicalGeneration(
        formData,
        sourceMaterial,
        ragContext
      );
      
      const storyRaw = pedagogicalResult.storyboard;
      const pedagogicalBlueprint = pedagogicalResult.pedagogicalBlueprint;
      const continuityReport = pedagogicalResult.continuityReport;
      const metrics = pedagogicalResult.metrics;
      
      // Log pedagogical summary for debugging
      console.log(pedagogicalOrchestrator.generateBlueprintSummary(
        pedagogicalBlueprint,
        continuityReport,
        metrics
      ));
      
      const modelUsed = resolveOpenAIModel(formData.aiModel || undefined);

      // Internal pages enforcement removed per user request
      let textProcessedStoryboard = storyRaw;

      if ((formData.generateImages || forceImages) && Array.isArray(textProcessedStoryboard.scenes)) {
        for (const s of textProcessedStoryboard.scenes) {
          try {
            const prompt = s.visual?.visualGenerationBrief?.sceneDescription || s.visual?.aiPrompt || s.onScreenText || s.narrationScript || s.pageTitle || "Training visual, photorealistic";
            const { imageUrl, recipe } = await generateImageFromPrompt(prompt, { style: "photorealistic", size: "1280x720" });
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

      const detection = classifyStoryboard(textProcessedStoryboard);
      const storyboard = {
        ...textProcessedStoryboard,
        meta: {
          ...(textProcessedStoryboard.meta || {}),
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
    } catch (e: any) {
      console.error("💥 Generation failed:", e?.response?.data || e.message || e);
      
      // Provide detailed error information
      const errorDetails = {
        message: e?.message || "Server crash during generation",
        type: e?.name || "UnknownError",
        stack: process.env.NODE_ENV === 'development' ? e?.stack : undefined,
        details: e?.response?.data || null
      };
      
      console.error("🔍 Error details:", errorDetails);
      
      res.status(500).json({
        error: true,
        success: false,
        message: errorDetails.message,
        details: errorDetails.details,
        type: errorDetails.type
      });
    }
  }),
);


/* ======================= PDF & OTHER ROUTES ================== */
app.post(
  "/api/v1/download-pdf",
  withTiming("/api/v1/download-pdf", async (req: any, res: any) => {
    try {
      const { storyboardModule, formData } = req.body;
      if (!storyboardModule || typeof storyboardModule !== "object") {
        return res.status(400).json({ message: "Storyboard module JSON required." });
      }

      const html = renderStoryboardAsHTML(storyboardModule, formData);
      const pdfBuffer = await htmlToPdfBuffer(html);

      const isPdf =
        Buffer.isBuffer(pdfBuffer) &&
        pdfBuffer.length > 5 &&
        pdfBuffer.subarray(0, 5).toString("utf8") === "%PDF-";

      console.log(
        `[pdf] render complete — bytes=${pdfBuffer?.length ?? 0}, valid=${isPdf}`
      );

      if (!isPdf) {
        return res
          .status(500)
          .json({ message: "PDF renderer returned invalid data." });
      }

      // Generate dynamic filename from module title
      const moduleTitle = storyboardModule.moduleName || storyboardModule.title || "Untitled Module";
      const safeTitle = moduleTitle
        .replace(/[^a-zA-Z0-9\s-_]/g, '') // Remove invalid filename characters
        .replace(/\s+/g, ' ') // Keep spaces for readability
        .trim()
        .substring(0, 50); // Limit length
      const fileName = `${safeTitle}.pdf`;

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
      res.end(pdfBuffer);
    } catch (err: any) {
      console.error("[pdf] Failed to render storyboard PDF:", err);
      const message = err?.message || "Failed to render PDF";
      res.status(500).json({ message });
    }
  })
);

app.post(
  "/api/storyboard/pdf",
  withTiming("/api/storyboard/pdf", async (req: any, res: any) => {
    try {
      const storyboard = req.body;
      if (!storyboard || typeof storyboard !== "object") {
        return res.status(400).json({ message: "Storyboard JSON required." });
      }

      const html = renderStoryboardAsHTML(storyboard);
      const pdfBuffer = await htmlToPdfBuffer(html);

      const isPdf =
        Buffer.isBuffer(pdfBuffer) &&
        pdfBuffer.length > 5 &&
        pdfBuffer.subarray(0, 5).toString("utf8") === "%PDF-";

      console.log(
        `[pdf] render complete — bytes=${pdfBuffer?.length ?? 0}, valid=${isPdf}`
      );

      if (!isPdf) {
        return res
          .status(500)
          .json({ message: "PDF renderer returned invalid data." });
      }

      // Generate dynamic filename from module title
      const moduleTitle = storyboard.moduleName || storyboard.title || "Untitled Module";
      const safeTitle = moduleTitle
        .replace(/[^a-zA-Z0-9\s-_]/g, '') // Remove invalid filename characters
        .replace(/\s+/g, ' ') // Keep spaces for readability
        .trim()
        .substring(0, 50); // Limit length
      const fileName = `${safeTitle}.pdf`;

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
      res.end(pdfBuffer);
    } catch (err: any) {
      console.error("[pdf] Failed to render storyboard PDF:", err);
      const message = err?.message || "Failed to render PDF";
      res.status(500).json({ message });
    }
  })
);

/* =============================== GAP-AWARE GENERATION =========================== */

// 🆕 NEW ENDPOINT: Strict Source-Only Storyboard Generation with Gap Analysis
app.post(
  "/api/v1/generate-storyboard-strict",
  uploadFilesMiddleware,
  withTiming("/api/v1/generate-storyboard-strict", async (req, res) => {
    try {
      console.log("🔍 Starting strict source-only storyboard generation...");
      
      // Handle both JSON payloads (from frontend) and form data
      let sourceContent = '';
      let formData: any = {};
      let uploadedFiles: Express.Multer.File[] = [];
      
      // Check if this is a JSON request (from frontend)
      if (req.get('Content-Type')?.includes('application/json')) {
        // JSON payload from frontend - no files
        const learningRequest = req.body;
        console.log('📋 JSON request detected');
        sourceContent = learningRequest.sourceMaterial?.content || '';
        formData = {
          moduleName: learningRequest.moduleName || 'Unknown Module',
          targetAudience: learningRequest.targetAudience || 'General Audience',
          durationMins: learningRequest.durationMins || 20
        };
      } else {
        // Form data with potential files
        const learningRequest = req.body;
        uploadedFiles = (req.files as Express.Multer.File[]) || [];
        
        console.log('📋 Form data request detected');
        console.log(`📁 Processing ${uploadedFiles.length} uploaded files for strict generation`);
        console.log('📋 Request body keys:', Object.keys(learningRequest));
        
        if (uploadedFiles.length > 0) {
          uploadedFiles.forEach((file, index) => {
            console.log(`📄 File ${index + 1}: ${file.originalname} (${file.mimetype}, ${file.size} bytes)`);
          });
        }
        
        // Parse formData if it's a string (from form upload)
        if (typeof learningRequest.formData === 'string') {
          try {
            formData = JSON.parse(learningRequest.formData);
            console.log('📋 Parsed formData:', formData);
          } catch (e) {
            console.warn('Failed to parse formData JSON:', e);
            formData = {};
          }
        } else if (learningRequest.formData) {
          formData = learningRequest.formData;
        }
        
        if (formData.content) {
          sourceContent = formData.content;
          console.log('📋 Source content from formData:', sourceContent.length, 'characters');
        }
      }
      
      // Extract text from uploaded PDFs if source content is empty
      if ((!sourceContent || sourceContent.trim() === '') && uploadedFiles.length > 0) {
        console.log('📄 No source content provided, extracting text from uploaded files...');
        let extractedContent = '';
        
        for (const file of uploadedFiles) {
          // Log file details for debugging
          console.log(`📂 Processing uploaded file: ${file.originalname} (${file.size} bytes, ${file.mimetype})`);
          
          if (file.mimetype === "application/pdf") {
            try {
              console.log(`📄 Extracting text from uploaded PDF: ${file.originalname}`);
              
              // Check if buffer has data
              if (!file.buffer || file.buffer.length === 0) {
                console.warn(`Skipping empty PDF file: ${file.originalname}`);
                continue;
              }
              
              // Use the same PDF extraction method as the regular endpoint
              console.log(`📂 Processing file: ${file.originalname} (${file.size} bytes)`);
              console.log(`📄 File type: ${file.mimetype}`);
              
              const data = await pdf(file.buffer);
              const pdfText = data?.text;
              
              if (pdfText && pdfText.trim()) {
                extractedContent += `\n\n--- CONTENT FROM FILE: ${file.originalname} ---\n\n${pdfText}`;
                console.log(`✅ Extracted ${pdfText.length} characters from PDF: ${file.originalname}`);
                console.log(`📄 PDF content preview (first 200 chars): ${pdfText.substring(0, 200)}...`);
              } else {
                console.warn(`⚠️ No text extracted from PDF: ${file.originalname}`);
              }
            } catch (pdfError) {
              console.error(`❌ PDF extraction failed for ${file.originalname}:`, pdfError);
              // Continue with other files instead of failing completely
              continue;
            }
          } else {
            console.log(`⚠️ Skipping non-PDF file: ${file.originalname} (${file.mimetype})`);
            if (file.mimetype !== 'application/pdf') {
              console.warn(`⚠️ Unexpected MIME type: ${file.mimetype} for file ${file.originalname}`);
            }
          }
        }
        
        if (extractedContent.trim()) {
          sourceContent = extractedContent.trim();
          console.log(`✅ Total extracted content: ${sourceContent.length} characters`);
          console.log(`📋 Source content preview: ${sourceContent.substring(0, 300)}...`);
        }
      }
      
      // Validate required fields after PDF extraction
      if (!sourceContent || sourceContent.trim() === '') {
        return res.status(400).json({
          success: false,
          error: "Missing source material",
          message: "Source material content is required for strict generation. Please provide content in the text box or upload a PDF file."
        });
      }

      // Use StrictOrchestrator for strict source-only generation
      const { StrictOrchestrator } = require('./services/strictOrchestrator');
      const orchestrator = new StrictOrchestrator();
      
      const learningRequest = {
        topic: formData.moduleName || 'Unknown Topic',
        duration: formData.durationMins || 20,
        audience: formData.targetAudience || 'General Audience',
        sourceMaterial: sourceContent,
        moduleName: formData.moduleName || 'Unknown Module',
        moduleType: formData.moduleType || 'Professional Skills',
        complexityLevel: formData.complexityLevel || 'Level 1: Passive',
        tone: formData.tone || 'Professional & Clear',
        targetAudience: formData.targetAudience || 'General Audience'
      };

      const storyboard = await orchestrator.generateStoryboard(learningRequest);

      console.log(`✅ Strict generation complete. Scenes: ${storyboard.scenes.length}`);
      console.log(`📊 Source validation: ${storyboard.metadata?.sourceValidation?.confidenceScore?.toFixed(1)}% confidence`);

      // Return response (matching frontend expectations)
      res.json({
        success: true,
        data: {
          storyboardModule: storyboard
        },
        analysis: {
          gaps_found: 0, // Strict mode doesn't identify gaps, it enforces source compliance
          adequacy_score: storyboard.metadata?.sourceValidation?.confidenceScore || 100,
          recommendations: [`Generated ${storyboard.scenes.length} scenes with ${storyboard.metadata?.sourceValidation?.sourceCoverage?.toFixed(1)}% source coverage`],
          source_fidelity: 'strict'
        },
        meta: {
          modelUsed: 'gpt-4o-mini',
          gapAnalysisPerformed: false,
          strictSourceOnly: true,
          sourceValidationPerformed: true,
          protectedWelcomeScenes: storyboard.metadata?.protectedWelcomeScenes || 0,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('💥 Gap-aware generation failed:', error?.response?.data || error.message || error);

      // Provide detailed error information
      const errorDetails = {
        message: error?.message || "Server crash during gap-aware generation",
        type: error?.name || "UnknownError",
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
        details: error?.response?.data || null
      };

      console.error("🔍 Error details:", errorDetails);

      res.status(500).json({
        error: true,
        success: false,
        message: errorDetails.message,
        details: errorDetails.details,
        type: errorDetails.type,
        note: "Using strict source-only generation. Please check source material completeness."
      });
    }
  })
);

/* ============== NEW STRICT GENERATION ENDPOINT ============== */
app.post(
  "/api/v1/generate-storyboard",
  withTiming("/api/v1/generate-storyboard", async (req, res) => {
    try {
      console.log('🔒 Starting new strict storyboard generation...');
      
      const { StrictOrchestrator } = require('./services/strictOrchestrator');
      const orchestrator = new StrictOrchestrator();
      
      // Validate required fields
      if (!req.body.sourceMaterial) {
        return res.status(400).json({
          success: false,
          error: 'Missing source material',
          message: 'Source material is required for storyboard generation'
        });
      }

      const storyboard = await orchestrator.generateStoryboard(req.body);

      console.log(`✅ Generation complete. Scenes: ${storyboard.scenes.length}`);

      res.json({
        success: true,
        storyboard: storyboard,
        meta: {
          generatedBy: 'strict_orchestrator',
          sceneCount: storyboard.scenes.length,
          protectedWelcomeScenes: storyboard.metadata?.protectedWelcomeScenes || 0,
          sourceValidation: storyboard.metadata?.sourceValidation,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('❌ Generation failed:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Generation failed',
        details: error.stack
      });
    }
  })
);

/* =============================== ERRORS & SERVER =========================== */
app.use((req, res) => res.status(404).json({ error: "Not Found", path: req.originalUrl }));
app.use((err, _req, res, _next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal Server Error", detail: err?.message });
});
console.log('⚙️ Express initialized, starting server...');

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log('🎯 Health check available at: http://localhost:8080/health');
});
module.exports = app;
