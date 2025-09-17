// backend/src/services/geminiService.ts

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { VertexAI } = require('@google-cloud/vertexai');
const { Storage } = require('@google-cloud/storage');
const { v4 as uuidv4 } = require('uuid');
const dotenv = require('dotenv');
const JSON5 = require('json5');
dotenv.config();

const { StoryboardFormData } = require('../types/storyboardTypesArchive');
const { StoryboardModule, StoryboardPage, Event as StoryboardEvent } = require('../types');
const { getLayoutTemplate } = require('../utils/getLayoutTemplate');
const { getBestStoryboards } = require('../db/storyboardDb'); // ✅ Memory system

/* =========================== CONFIG =========================== */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GCP_PROJECT = process.env.GOOGLE_CLOUD_PROJECT || '';
const GCP_LOCATION = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
const GCS_BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'genesis-storyboard-images';

// Toggle server-side image generation regardless of frontend flag (parity with backend index)
const FORCE_GENERATE_IMAGES =
  String(process.env.FORCE_GENERATE_IMAGES || '').trim().toLowerCase() === 'true';

// Constrain pages roughly to duration (1 min ≈ 1 page)
const PAGES_MIN = 8;
const PAGES_MAX = 20;

// Models (easy to swap later)
const GEMINI_TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || 'gemini-1.5-pro';
const VERTEX_IMAGE_MODEL = process.env.VERTEX_IMAGE_MODEL || 'imagegeneration@006';

/* ========================= CLIENTS =========================== */

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const vertexAI = new VertexAI({ project: GCP_PROJECT, location: GCP_LOCATION });
const storage = new Storage();

/* ======================= SMALL HELPERS ======================= */

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function clampInt(n: number, lo: number, hi: number) {
  n = Math.round(Number(n));
  return Math.max(lo, Math.min(hi, n));
}

function parseDurationMins(input?: string | number): number {
  if (input === 0) return 0;
  if (input == null) return 20;
  if (typeof input === 'number' && !Number.isNaN(input)) return input;

  const str = String(input).toLowerCase().trim();

  // pure integer
  const numOnly = str.match(/^(\d+)$/);
  if (numOnly) return parseInt(numOnly[1], 10);

  // ranges like "15-20" or "15–20" → use upper bound
  const range = str.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (range) return parseInt(range[2], 10);

  // minutes variants
  const mins = str.match(/(\d+)\s*(min|mins|minute|minutes)\b/);
  if (mins) return parseInt(mins[1], 10);

  // hours variants
  const hours = str.match(/(\d+)\s*(h|hr|hrs|hour|hours)\b/);
  if (hours) return parseInt(hours[1], 10) * 60;

  const fallback = parseInt(str, 10);
  return Number.isNaN(fallback) ? 20 : fallback;
}

/** Extracts a JSON block even if the model wrapped it in code fences or added prose. */
function extractJsonBlock(text: string): string {
  if (typeof text !== 'string') return text as unknown as string;

  // 1) ```json ... ```
  const fencedJson = text.match(/```json\s*([\s\S]*?)```/i);
  if (fencedJson) return fencedJson[1].trim();

  // 2) ``` ... ```
  const fencedAny = text.match(/```\s*([\s\S]*?)```/);
  if (fencedAny) return fencedAny[1].trim();

  // 3) first { ... last }
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first >= 0 && last > first) return text.slice(first, last + 1).trim();

  return text.trim();
}

/* =================== GCS + VERTEX IMAGES ===================== */

/** Upload a PNG buffer to GCS (and make it public), return public URL. */
async function uploadImageToGCS(imageBuffer: Buffer, prompt: string): Promise<string> {
  const filename = `image_${uuidv4()}.png`;
  const file = storage.bucket(GCS_BUCKET_NAME).file(filename);

  await file.save(imageBuffer, {
    metadata: { contentType: 'image/png', metadata: { prompt } },
    resumable: false,
  });

  // Make publicly readable
  try {
    await file.makePublic();
  } catch (err) {
    console.warn('⚠️ makePublic failed; falling back to signed URL', err);
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
    });
    return url;
  }

  return `https://storage.googleapis.com/${GCS_BUCKET_NAME}/${filename}`;
}

/**
 * Robustly handle Vertex image model responses:
 * - Prefer inlineData.data (base64)
 * - Fallback to fileData.fileUri if it’s a data URL
 * - Otherwise, try to fetch a GCS file if fileUri is gs:// (not implemented here by design)
 */
async function generateImageFromPromptVertex(prompt: string): Promise<string> {
  console.log(`🖼️ Generating image with Vertex (${VERTEX_IMAGE_MODEL}) for prompt: "${prompt}"`);
  try {
    const model = vertexAI.getGenerativeModel({ model: VERTEX_IMAGE_MODEL });

    const resp = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const part = resp?.response?.candidates?.[0]?.content?.parts?.[0];
    if (!part) throw new Error('No parts in Vertex response.');

    // inlineData preferred
    const inlineBase64 = (part as any)?.inlineData?.data as string | undefined;
    if (inlineBase64) {
      const buf = Buffer.from(inlineBase64, 'base64');
      return await uploadImageToGCS(buf, prompt);
    }

    // occasionally returned as a data URL in fileData.fileUri
    const fileUri = (part as any)?.fileData?.fileUri as string | undefined;
    if (fileUri && /^data:image\/png;base64,/i.test(fileUri)) {
      const base64 = fileUri.replace(/^data:image\/png;base64,/i, '');
      const buf = Buffer.from(base64, 'base64');
      return await uploadImageToGCS(buf, prompt);
    }

    // If fileUri is gs:// you could add gs download logic here if desired
    console.error('No usable image payload found in Vertex response:', JSON.stringify(part, null, 2));
    throw new Error('No usable image payload found from Vertex.');
  } catch (err) {
    console.error('❌ Vertex AI Image generation error:', err);
    return '';
  }
}

/* ====================== VISUAL NORMALISERS ===================== */

function buildPhotorealisticPrompt(
  event: any,
  brand?: { colours?: string[]; fonts?: string }
) {
  const vb = event?.aiProductionBrief?.visual ?? {};
  const subject =
    vb.subject || 'diverse professionals collaborating in a modern workplace';
  const setting =
    vb.setting || 'contemporary office or home office environments';
  const composition =
    vb.composition || 'natural candid composition with clear subject focus, 16:9';
  const lighting = vb.lighting || 'soft natural daylight or warm practical lighting';
  const mood = vb.mood || 'professional, inclusive, productive';
  const palette = (brand?.colours || ['#0387E6', '#E63946', '#BC57CF', '#000000', '#FFFFFF']).join(', ');

  const negative = [
    'no vector art',
    'no flat illustration',
    'no cartoon',
    'no clip art',
    'no isometric illustration',
    'no 3D render look',
    'no exaggerated proportions',
  ].join(', ');

  const realismCues = [
    'photorealistic',
    'high-resolution',
    'natural skin tones',
    'realistic proportions',
    'subtle depth of field',
    'authentic textures',
    'clean background bokeh when appropriate',
  ].join(', ');

  return [
    `${subject} in ${setting}.`,
    `Composition: ${composition}. Lighting: ${lighting}. Mood: ${mood}.`,
    `Style: Photorealistic; ${realismCues}.`,
    `Brand-aware accents (subtle): ${palette}.`,
    `Avoid: ${negative}.`,
  ].join(' ');
}

function normalizeVisualBrief(event: any) {
  event.aiProductionBrief ||= {};
  event.aiProductionBrief.visual ||= {};
  const vb = event.aiProductionBrief.visual;

  // Always image
  vb.mediaType = 'image';

  // Guard against non-photo styles
  const style = String(vb.style || '').toLowerCase();
  if (!style || /(vector|flat|illustration|isometric|cartoon)/i.test(style)) {
    vb.style = 'Photorealistic';
  } else if (!/photorealistic/i.test(style)) {
    vb.style = `${vb.style} Photorealistic`.trim();
  }

  return vb;
}

/* ===================== RETRY WRAPPERS ====================== */

async function withRetry<T>(fn: () => Promise<T>, attempts = 3, baseDelayMs = 600): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const backoff = baseDelayMs * Math.pow(2, i) + Math.floor(Math.random() * 150);
      console.warn(`⚠️ Attempt ${i + 1} failed. Retrying in ~${backoff}ms...`);
      await sleep(backoff);
    }
  }
  throw lastErr;
}

/* ================== MAIN GENERATION FUNCTION ================= */

export async function generateStoryboardFromGemini(
  formData: StoryboardFormData
): Promise<StoryboardModule> {
  if (!GEMINI_API_KEY) {
    console.warn('⚠️ GEMINI_API_KEY missing; text generation will likely fail.');
  }

  // Resolve duration to minutes internally (supports string "15 minutes" or numeric)
  const durationMins = clampInt(
    parseDurationMins((formData as any).durationMins ?? (formData as any).duration),
    1,
    90
  );
  const targetPages = clampInt(durationMins, PAGES_MIN, PAGES_MAX);

  const layoutDescription = getLayoutTemplate((formData as any).screenType || '');

  // === Fetch best examples for context injection ===
  const bestExamples = await getBestStoryboards(
    [formData.moduleType], // tags: array of strings
    Number(formData.complexityLevel), // level: number
    2 // limit
  );

  const bestExamplesText = bestExamples.length
    ? bestExamples
        .map(
          (ex, idx) =>
            `\n\n====================\nBEST EXAMPLE #${idx + 1}:\n${JSON.stringify(ex.content, null, 2)}`
        )
        .join('\n')
    : '\n(No prior best examples found for this module type/level.)';

  // === Compose the prompt with best examples injected ===
  const systemPrompt = `
You are a meticulous and thorough "AI Multimedia Producer" and "Senior Prompt Engineer". Your persona is that of a director giving explicit, machine-readable commands to a suite of AI media generation tools. Your primary directive is to be exhaustive and complete.

Below are examples of our best previous eLearning storyboards for this type/level. Study them for structure, depth, style, and instructional design best practice:
${bestExamplesText}

📌 CRITICAL OUTPUT INSTRUCTIONS:
1. Your entire response MUST be a single, valid JSON object.
2. The root object MUST have a single key named "storyboardModule".
3. Your final output's 'pages' array MUST contain a complete page object for EVERY entry listed in the 'tableOfContents'. There must be no missing pages.
4. Do not use placeholders like "// ...remaining content...". Generate every single page.
5. The JSON must be strictly valid. Do not include comments or trailing commas.
6. Do not include references to stock asset IDs (e.g., SS:617698028) — instead, describe every image or video using detailed AI prompt instructions.
7. You MUST include the following FIVE pages at the beginning of the storyboard, regardless of module type or content:
   - Page 1: Title of Module, Duration (${durationMins} minutes), Level
   - Page 2: Pronunciation Guide
   - Page 3: Table of Contents
   - Page 4: Introduction
   - Page 5: Learning Objectives

🎯 DURATION & SCOPE:
- Target duration: ${durationMins} minutes (UK English).
- Aim for ~${targetPages} total pages (±2). Do not exceed ${PAGES_MAX} pages.

📚 CRITICAL PROCESS ALGORITHM:
1. Analyze the USER'S RAW CONTENT from beginning to end.
2. Generate all high-level metadata: 'moduleName', 'learningOutcomes', 'revisionHistory', 'pronunciationGuide'.
3. Generate a COMPLETE 'tableOfContents' array (starting with the 5 mandatory pages above).
4. For EACH AND EVERY tableOfContents entry, generate a corresponding page in the 'pages' array using the schema below.

📦 OUTPUT STRUCTURE:
{
  "storyboardModule": {
    "moduleName": string,
    "learningOutcomes": string,
    "revisionHistory": [{ "version": string, "date": string, "author": string, "description": string }],
    "pronunciationGuide": [{ "term": string, "pronunciation": string }],
    "tableOfContents": [{ "pageNumber": number, "title": string }],
    "pages": [ ... ],
    "durationMins": number
  }
}

🎬 PAGE EVENT FORMAT:
Each page must include at least one instructional "event":
{
  "pageNumber": number,
  "pageTitle": "string",
  "events": [
    {
      "eventNumber": number,
      "onScreenText": "Exact on-screen text",
      "aiProductionBrief": {
        "audio": {
          "script": "Narration script",
          "voice": "e.g., 'female, calm, Australian'",
          "pacing": "e.g., 'medium-paced, conversational'"
        },
        "visual": {
          "mediaType": "image | video | animation",
          "style": "e.g., 'flat design', 'photorealistic'",
          "subject": "Highly detailed visual prompt for AI generation",
          "composition": "e.g., 'medium shot, center frame'",
          "environment": "e.g., 'corporate office with branded decor'",
          "lighting": "e.g., 'natural soft lighting'",
          "colorPalette": { "primary": "#...", "secondary": "#...", "accent": "#..." },
          "animationSpec": "if applicable"
        },
        "interactive": {
          "interactionType": "None | Multiple-Choice-Quiz | Drag-and-Drop | Click-to-Reveal-Tabs",
          "data": "Data model for the interaction"
        },
        "branchingLogic": "e.g., 'On completion go to Page X'"
      }
    }
  ]
}

🧩 LAYOUT CONTEXT (reference): ${layoutDescription || '(none)'}
📝 USER'S RAW CONTENT:
${formData.content}
`;

  let responseText = '';

  try {
    // === Generate JSON with retries
    const textModel = genAI.getGenerativeModel({ model: GEMINI_TEXT_MODEL });
    const result = await withRetry(() =>
      textModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
      })
    );

    responseText = result.response.text();

    const jsonString = extractJsonBlock(responseText);
    const parsed = JSON5.parse(jsonString);

    if (!parsed?.storyboardModule) {
      throw new Error("Parsed JSON did not contain 'storyboardModule'.");
    }

    // Ensure duration on root (downstream consumers rely on this)
    parsed.storyboardModule.durationMins = durationMins;

    // === Enforce & generate images if requested/forced
    const shouldGenerateImages =
      FORCE_GENERATE_IMAGES || Boolean((formData as any).generateImages);

    if (shouldGenerateImages && Array.isArray(parsed.storyboardModule.pages)) {
      for (const page of parsed.storyboardModule.pages as StoryboardPage[]) {
        for (const event of (page.events || []) as StoryboardEvent[]) {
          const vb = normalizeVisualBrief(event);
          const mediaType = String(vb.mediaType || '').toLowerCase();
          if (mediaType !== 'image') continue;

          const finalPrompt = buildPhotorealisticPrompt(event, parsed?.brand);
          try {
            const imageUrl = await generateImageFromPromptVertex(finalPrompt);
            if (imageUrl) {
              (event as any).generatedImageUrl = imageUrl;
              (event as any).generatedImageMeta = {
                styleEnforced: 'Photorealistic',
                promptUsed: finalPrompt,
                mediaType: vb.mediaType,
                timestamp: new Date().toISOString(),
                model: VERTEX_IMAGE_MODEL,
              };
            }
          } catch (imgErr) {
            console.error(`❌ Image gen failed on page ${page.pageNumber}, event ${(event as any)?.eventNumber}:`, imgErr);
          }

          // small pacing delay (avoid hammering)
          await sleep(350);
        }
      }
    }

    return parsed.storyboardModule as StoryboardModule;
  } catch (error: any) {
    console.error('❌ Failed to generate or parse storyboard.');
    console.error('🔍 The raw text received from the AI that caused the crash was:');
    console.error('--- BEGIN AI RESPONSE ---');
    console.error(responseText);
    console.error('--- END AI RESPONSE ---');
    throw new Error(
      'Failed to generate or parse storyboard. The AI response may be malformed or an API failed.'
    );
  }
}