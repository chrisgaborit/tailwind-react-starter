// backend/src/routes/storyboardRoute.ts
import express, { Request, Response } from "express";
import { generateStoryboardFromOpenAI, resolveOpenAIModel } from "../services/openaiGateway";
import type { StoryboardFormData } from "../types/storyboardTypesArchive"; // keep if this is your current form type

import {
  saveStoryboard,
  getBestStoryboards,
  setBestExample,
} from "../db/storyboardDb";

const router = express.Router();

/* ------------------------- helpers ------------------------- */

function parseTagsParam(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .flatMap((v) => String(v).split(","))
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return String(raw)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseLevelParam(raw: unknown, fallback = 1): number {
  if (raw == null) return fallback;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : fallback;
  if (Array.isArray(raw)) {
    const first = raw[0];
    const n = parseInt(String(first), 10);
    return Number.isFinite(n) ? n : fallback;
  }
  const n = parseInt(String(raw), 10);
  return Number.isFinite(n) ? n : fallback;
}

function coerceBoolean(raw: unknown): boolean {
  if (typeof raw === "boolean") return raw;
  if (typeof raw === "number") return raw !== 0;
  if (typeof raw === "string") {
    const v = raw.trim().toLowerCase();
    return v === "true" || v === "1" || v === "yes" || v === "on";
  }
  return false;
}

function countInteractiveScenes(sb: any): number {
  const scenes = Array.isArray(sb?.scenes) ? sb.scenes : [];
  return scenes.filter((s: any) => (s?.interactionType || "None") !== "None").length;
}

function normalizeFormData(body: any): { formData: any; ragContext?: string; aiModel?: string } {
  // Accept either a top-level formData object or fields directly on body
  const raw = body?.formData && typeof body.formData === "object" ? body.formData : body || {};
  const {
    moduleName,
    complexityLevel,
    level,
    duration,
    durationMins,
    targetAudience,
    organisationName,
    learningOutcomes,
    instructionalPurpose,
    screenType,
    interactionStyle,
    brandGuidelines,
    colours,
    fonts,
    tone,
    outputLanguage,
    additionalNotes,
    content,
    forceLength,
    minScenes,
  } = raw;

  const formData = {
    moduleName,
    complexityLevel,
    level,
    duration,
    durationMins,
    targetAudience,
    organisationName,
    learningOutcomes,
    instructionalPurpose,
    screenType,
    interactionStyle,
    brandGuidelines,
    colours,
    fonts,
    tone,
    outputLanguage,
    additionalNotes,
    content,
    forceLength,
    minScenes,
  };

  return {
    formData,
    ragContext: body?.ragContext ?? raw?.ragContext, // allow either location
    aiModel: body?.aiModel ?? raw?.aiModel,
  };
}

/* --------------------- AI GENERATION ROUTE --------------------- */
/**
 * Back-compat single endpoint:
 * POST /api/generate
 * Body can be:
 *  - { formData: {...}, ragContext?: string, aiModel?: string }
 *  - or legacy: all fields at top-level
 *
 * Query:
 *  - ?raw=1 to return the raw storyboard object (no envelope)
 */
router.post("/generate", async (req: Request, res: Response) => {
  try {
    const { formData, ragContext, aiModel } = normalizeFormData(req.body);

    if (!formData || !String(formData?.content || "").trim()) {
      return res.status(400).json({
        success: false,
        error: { message: "Provide formData.content (source text) for generation." },
      });
    }

    // Resolve model (for meta only)
    const modelRequested = aiModel ?? formData.aiModel ?? null;
    const modelUsed = resolveOpenAIModel(modelRequested || undefined);

    const storyboard = await attemptGenerateWithRetry(
      async () =>
        await generateStoryboardFromOpenAI(formData, {
          ragContext,
          aiModel: modelRequested || undefined,
        }),
      2 // one retry after first attempt
    );

    const isRaw = String(req.query.raw || "").toLowerCase() === "1";
    const warnings = storyboard?.metadata?.warnings || [];

    if (isRaw) {
      if (warnings.length) {
        res.setHeader("X-Storyboard-Warnings", encodeURIComponent(warnings.join(" | ")));
      }
      return res.status(200).json(storyboard);
    }

    const meta = {
      modelRequested,
      modelUsed,
      interactiveScenes: countInteractiveScenes(storyboard),
      warnings,
    };

    return res.status(200).json({
      success: true,
      data: { storyboardModule: storyboard },
      meta,
    });
  } catch (err: any) {
    console.error("🚨 Generation failed:", err?.message || err);
    return res.status(500).json({
      success: false,
      error: { message: "Failed to generate storyboard. Please try again later." },
    });
  }
});

/* -------------------- MEMORY SYSTEM ROUTES -------------------- */

// Save storyboard
router.post("/storyboards", async (req: Request, res: Response) => {
  try {
    await saveStoryboard(req.body);
    res.status(201).json({ success: true });
  } catch (err) {
    console.error("❌ saveStoryboard error:", err);
    res.status(500).json({ error: "Failed to save storyboard" });
  }
});

// Search best examples by tags/level
router.get("/storyboards/search", async (req: Request, res: Response) => {
  try {
    const tags = parseTagsParam(req.query.tags);
    const level = parseLevelParam(req.query.level, 1); // default to Level 1 if omitted/invalid

    const storyboards = await getBestStoryboards(tags, level);
    res.json(storyboards);
  } catch (err) {
    console.error("❌ getBestStoryboards error:", err);
    res.status(500).json({ error: "Failed to fetch storyboards" });
  }
});

// Mark/unmark storyboard as best example
router.patch("/storyboards/:id/best", async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const isBestExample = coerceBoolean(req.body?.isBestExample);

    await setBestExample(id, isBestExample);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ setBestExample error:", err);
    res.status(500).json({ error: "Failed to update best example flag" });
  }
});

export default router;

/* ---------------------- retry helper ---------------------- */

async function attemptGenerateWithRetry<T>(fn: () => Promise<T>, retries: number): Promise<T> {
  let lastError: any;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔄 Attempt ${attempt}...`);
      return await fn();
    } catch (err: any) {
      console.error(`⚠️ Attempt ${attempt} failed:`, err?.message || err);
      lastError = err;
    }
  }

  throw lastError;
}
