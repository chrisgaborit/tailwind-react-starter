// backend/src/services/imageService.ts

import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { ENABLE_IMAGE_GENERATION } from "../config/featureFlags";

/**
 * Google AI Studio – Gemini 2.5 Flash Image (a.k.a. Nano Banana)
 * Endpoint:
 *   POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent
 * Auth:
 *   x-goog-api-key: <GEMINI_API_KEY>
 *
 * Generates one inline image, uploads to Supabase Storage,
 * returns { imageUrl, recipe }. Enforces PHOTOREALISTIC imagery.
 */

/* ----------------------------- ENV / CONSTANTS ----------------------------- */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const SUPABASE_IMAGE_BUCKET =
  process.env.SUPABASE_IMAGE_BUCKET || "storyboard-images";

// allow overriding model/endpoint if needed later
const GEMINI_IMAGE_MODEL =
  process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image-preview";
const GEMINI_BASE =
  process.env.GEMINI_BASE_URL ||
  "https://generativelanguage.googleapis.com/v1beta";
const GEMINI_ENDPOINT = `${GEMINI_BASE}/models/${GEMINI_IMAGE_MODEL}:generateContent`;

// Logging hints to prevent silent misconfig (only when feature enabled)
if (ENABLE_IMAGE_GENERATION) {
  if (!GEMINI_API_KEY)
    console.warn("⚠️  GEMINI_API_KEY not set — image generation will fail.");
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.warn(
      "⚠️  Supabase URL or SERVICE_ROLE_KEY missing — uploads will fail."
    );
  }
} else {
  console.log(
    "🛑 ENABLE_IMAGE_GENERATION is false – skipping Gemini image requests."
  );
}

/* -------------------------------- Clients ---------------------------------- */

const supabase =
  ENABLE_IMAGE_GENERATION && SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    : null;

/* --------------------------------- Types ----------------------------------- */

export type GenOpts = {
  /** Style request from upstream. Ignored if non-photorealistic. */
  style?: string; // e.g., "photorealistic", "vector", "3D render"
  /** Informational only; Gemini picks native size. */
  size?: string; // e.g., "1280x720"
  /** Aspect-ratio hint to steer composition. */
  aspectRatio?: string; // "16:9" | "1:1" | "9:16" ...
  lighting?: string; // e.g., "soft daylight", "warm practical"
  mood?: string; // e.g., "optimistic, professional"
  composition?: string; // e.g., "medium shot; eye-level; negative space top-right"
  setting?: string; // e.g., "modern office", "home office"
  /** Comma-separated or array of hex colours; used subtly. */
  brandPalette?: string | string[];
  seed?: number | string;
  guidance?: number;
};

type InlineData =
  | { inlineData?: { data: string; mimeType?: string } } // camelCase
  | { inline_data?: { data: string; mimeType?: string } } // snake_case
  | any;

/* -------------------------- Photorealism Enforcement ------------------------ */

/** Hard guard: terms we do NOT want in resulting style */
const NEGATIVE_STYLE = [
  "no vector art",
  "no flat illustration",
  "no cartoon",
  "no clip art",
  "no isometric illustration",
  "no 3D render look",
  "no exaggerated proportions",
].join(", ");

const REALISM_CUES = [
  "Photorealistic",
  "high-resolution",
  "natural skin tones",
  "realistic proportions",
  "authentic textures",
  "subtle depth of field",
  "natural lighting",
].join(", ");

const DEFAULT_PALETTE = [
  "#0387E6",
  "#E63946",
  "#BC57CF",
  "#000000",
  "#FFFFFF",
];

/** Strip/neutralise vector-ish instructions from user prompt */
function sanitizeForPhotorealism(s: string): string {
  if (!s) return s;
  // Remove common vector/flat signals while retaining semantic subject text
  return s
    .replace(/\b(vector|flat|cartoon|isometric|clip[- ]?art|illustration|low-poly)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function normalizePalette(p?: string | string[]): string[] {
  if (!p) return DEFAULT_PALETTE;
  if (Array.isArray(p)) return p.length ? p : DEFAULT_PALETTE;
  // comma-separated string
  const arr = p
    .split(/[,\s]+/)
    .map((x) => x.trim())
    .filter(Boolean);
  return arr.length ? arr : DEFAULT_PALETTE;
}

/* ---------------------------- Prompt Construction -------------------------- */

function buildImagePrompt(rawPrompt: string, opts: GenOpts): string {
  // Always enforce photorealism, regardless of incoming style.
  const sanitized = sanitizeForPhotorealism(rawPrompt);
  const palette = normalizePalette(opts.brandPalette).join(", ");

  const parts = [
    sanitized,
    `Style: ${REALISM_CUES}.`,
    opts.mood && `Mood: ${opts.mood}.`,
    opts.lighting && `Lighting: ${opts.lighting}.`,
    opts.composition && `Composition: ${opts.composition}.`,
    opts.setting && `Setting: ${opts.setting}.`,
    opts.aspectRatio && `Aspect ratio target: ${opts.aspectRatio}.`,
    `Brand-aware accents (subtle): ${palette}.`,
    `Avoid: ${NEGATIVE_STYLE}.`,
    "Ultra-detailed, high quality, professional. No text overlays.",
  ].filter(Boolean);

  return parts.join(" ");
}

/* ------------------------------- Main Export -------------------------------- */

/**
 * Generate an image using Gemini 2.5 Flash Image and upload to Supabase Storage.
 * Returns: { imageUrl, recipe }
 */
export async function generateImageFromPrompt(
  rawPrompt: string,
  {
    // we accept style but always enforce photorealistic in buildImagePrompt
    style = "photorealistic",
    size = "1280x720", // informational only
    aspectRatio = "16:9",
    lighting,
    mood,
    composition,
    setting,
    brandPalette,
    seed,
    guidance,
  }: GenOpts = {}
): Promise<{ imageUrl: string | null; recipe: Record<string, any> }> {
  const prompt = buildImagePrompt(rawPrompt, {
    style,
    mood,
    lighting,
    composition,
    setting,
    brandPalette,
    aspectRatio,
    seed,
    guidance,
  });

  if (!ENABLE_IMAGE_GENERATION) {
    return {
      imageUrl: null,
      recipe: {
        provider: "disabled",
        reason: "Image generation disabled via ENABLE_IMAGE_GENERATION=false",
        prompt,
        originalPrompt: rawPrompt,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not set");
  if (!supabase)
    throw new Error(
      "Supabase client not initialised (check SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)"
    );

  // Request body for Google AI Studio
  const reqBody: Record<string, any> = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    // generationConfig: { temperature: 0.6, topP: 0.9 } // (optional; model-dependent)
    // safetySettings: [...] // (optional; if you choose to manage)
  };

  // Timeout/abort (40s)
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 40_000);

  console.log(
    `🎨 Gemini request → model="${GEMINI_IMAGE_MODEL}" | prompt="${rawPrompt.slice(
      0,
      160
    )}${rawPrompt.length > 160 ? "…" : ""}"`
  );

  let json: any;
  try {
    const resp = await fetch(GEMINI_ENDPOINT, {
      method: "POST",
      headers: {
        "x-goog-api-key": GEMINI_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reqBody),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!resp.ok) {
      const text = await safeReadText(resp);
      throw new Error(
        `Gemini image API failed: ${resp.status} ${resp.statusText} :: ${text}`
      );
    }
    json = await resp.json();
  } catch (err: any) {
    clearTimeout(timeout);
    console.error("[imageService] Gemini request failed:", err?.message || err);
    return {
      imageUrl: null,
      recipe: {
        provider: "google-ai-studio",
        model: GEMINI_IMAGE_MODEL,
        error: String(err?.message || err),
        prompt,
        originalPrompt: rawPrompt,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  // Extract base64 image from candidates[].content.parts[].inlineData / inline_data
  const base64 = extractFirstInlineImageBase64(json);
  if (!base64) {
    console.error("[imageService] Gemini returned no inline image data.");
    return {
      imageUrl: null,
      recipe: {
        provider: "google-ai-studio",
        model: GEMINI_IMAGE_MODEL,
        prompt,
        originalPrompt: rawPrompt,
        warning: "No inline image in response",
        rawKeys: Object.keys(json || {}),
        generatedAt: new Date().toISOString(),
      },
    };
  }

  const mimeType = detectMimeType(json) || "image/png";
  const bytes = Buffer.from(base64, "base64");

  // Prepare upload path
  const ext = mimeType.includes("png")
    ? "png"
    : mimeType.includes("jpeg") || mimeType.includes("jpg")
    ? "jpg"
    : "png";
  const fileName = `${Date.now()}_${crypto.randomBytes(4).toString("hex")}.${ext}`;
  const path = `ai/${fileName}`;

  try {
    const { error: upErr } = await supabase!.storage
      .from(SUPABASE_IMAGE_BUCKET)
      .upload(path, bytes, { contentType: mimeType, upsert: false });

    if (upErr) throw upErr;

    const { data: pub } = supabase!.storage
      .from(SUPABASE_IMAGE_BUCKET)
      .getPublicUrl(path);
    const publicUrl = pub?.publicUrl;
    if (!publicUrl) throw new Error("Could not resolve Supabase public URL");

    const recipe = {
      provider: "google-ai-studio",
      model: GEMINI_IMAGE_MODEL,
      prompt,
      originalPrompt: rawPrompt,
      style: "Photorealistic (enforced)",
      size, // informational; not enforced by Gemini native
      aspectRatio, // informational; guided in prompt
      lighting,
      mood,
      composition,
      setting,
      brandPalette: normalizePalette(brandPalette),
      seed,
      guidance,
      mimeType,
      generatedAt: new Date().toISOString(),
    };

    console.log("🖼️  Uploaded image URL:", publicUrl);
    return { imageUrl: publicUrl, recipe };
  } catch (err: any) {
    console.error("[imageService] Supabase upload failed:", err?.message || err);
    return {
      imageUrl: null,
      recipe: {
        provider: "google-ai-studio",
        model: GEMINI_IMAGE_MODEL,
        prompt,
        originalPrompt: rawPrompt,
        error: String(err?.message || err),
        generatedAt: new Date().toISOString(),
      },
    };
  }
}

/* ------------------------------ Helpers ----------------------------------- */

function extractFirstInlineImageBase64(respJson: any): string | null {
  // Expected path: candidates[0].content.parts[*].inlineData.data (camelCase)
  // Some responses (rare) may use inline_data snake_case.
  const candidates = respJson?.candidates || [];
  for (const c of candidates) {
    const parts: InlineData[] = c?.content?.parts || [];
    for (const p of parts) {
      const camel = (p as any)?.inlineData;
      if (camel?.data) return camel.data as string;

      const snake = (p as any)?.inline_data;
      if (snake?.data) return snake.data as string;
    }
  }
  return null;
}

function detectMimeType(respJson: any): string | null {
  const candidates = respJson?.candidates || [];
  for (const c of candidates) {
    const parts: InlineData[] = c?.content?.parts || [];
    for (const p of parts) {
      const camel = (p as any)?.inlineData;
      if (camel?.mimeType) return camel.mimeType as string;
      const snake = (p as any)?.inline_data;
      if (snake?.mimeType) return snake.mimeType as string;
    }
  }
  return null;
}

async function safeReadText(resp: Response): Promise<string> {
  try {
    return await resp.text();
  } catch {
    return "<no-body>";
  }
}
