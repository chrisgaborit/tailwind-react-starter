// backend/src/services/geminiService.ts

import { GoogleGenerativeAI } from '@google/generative-ai';
import { VertexAI } from '@google-cloud/vertexai';
import { Storage } from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import JSON5 from 'json5';
dotenv.config();

import { StoryboardFormData } from '../types/storyboardTypesArchive';
import { StoryboardModule, StoryboardPage, Event as StoryboardEvent } from '../types';
import { getLayoutTemplate } from '../utils/getLayoutTemplate';
import { getBestStoryboards } from '../db/storyboardDb'; // ✅ Memory system
import { ENABLE_IMAGE_GENERATION } from '../config/featureFlags';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const vertexAI = ENABLE_IMAGE_GENERATION
  ? new VertexAI({
      project: process.env.GOOGLE_CLOUD_PROJECT || '',
      location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
    })
  : null;

const storage = ENABLE_IMAGE_GENERATION ? new Storage() : null;
const bucketName = process.env.GCS_BUCKET_NAME || 'genesis-storyboard-images';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/* -------------------------------------------
   Duration helpers (accept string or number)
-------------------------------------------- */
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

function clampInt(n: number, lo: number, hi: number) {
  n = Math.round(n);
  return Math.max(lo, Math.min(hi, n));
}

/* -------------------------------------------
   JSON extraction (tolerant of fences)
-------------------------------------------- */
function extractJsonBlock(text: string): string {
  if (typeof text !== 'string') return text as unknown as string;
  const fenced = text.match(/```json\s*([\s\S]*?)```/i) || text.match(/```\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();

  // try to slice from first '{' to last '}'
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first >= 0 && last > first) return text.slice(first, last + 1);

  return text.trim();
}

/* -------------------------------------------
   GCS image upload + Vertex generation
-------------------------------------------- */
async function uploadImageToGCS(imageBuffer: Buffer, prompt: string): Promise<string> {
  if (!ENABLE_IMAGE_GENERATION) {
    return '';
  }
  if (!storage) {
    throw new Error('Storage client not initialised');
  }
  const filename = `image_${uuidv4()}.png`;
  const file = storage.bucket(bucketName).file(filename);

  await file.save(imageBuffer, {
    metadata: { contentType: 'image/png', metadata: { prompt } },
    public: true,
  });

  return `https://storage.googleapis.com/${bucketName}/${filename}`;
}

async function generateImageFromPrompt(prompt: string): Promise<string> {
  if (!ENABLE_IMAGE_GENERATION) {
    return '';
  }
  console.log(`🖼️ Generating image for prompt: "${prompt}"`);
  try {
    if (!vertexAI) {
      throw new Error('Vertex AI client not initialised');
    }
    const generativeModel = vertexAI.getGenerativeModel({ model: 'imagegeneration@006' });

    const resp = await generativeModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const base64Image =
      // some transports return a data: URL; trim it if present
      resp.response.candidates?.[0]?.content?.parts?.[0]?.fileData?.fileUri?.replace(
        /^data:image\/png;base64,/i,
        ''
      );

    if (!base64Image) {
      console.error('No image data found in Vertex AI response:', resp.response);
      throw new Error('No image data returned from Imagen.');
    }

    const imageBuffer = Buffer.from(base64Image, 'base64');
    return await uploadImageToGCS(imageBuffer, prompt);
  } catch (error) {
    console.error('❌ Vertex AI Image generation error:', error);
    return '';
  }
}

// ===============================
// 🎯 MEMORY-INTEGRATED GENERATION
// ===============================

export async function generateStoryboardFromGemini(
  formData: StoryboardFormData
): Promise<StoryboardModule> {
  // ✅ Resolve duration to minutes internally (supports string "15 minutes" or numeric)
  const durationMins = clampInt(
  parseDurationMins((formData as any).durationMins ?? (formData as any).duration),
  1, 90
);
  const targetPages = clampInt(durationMins, 8, 20); // aim for ~1 min/page, bounded [8,20]

  const layoutDescription = getLayoutTemplate(formData.screenType || '');

  // === Fetch best examples for context injection ===
  const bestExamples = await getBestStoryboards(
    [formData.moduleType],                     // tags: array of strings
    Number(formData.complexityLevel),          // level: number
    2                                          // limit
  );

  const bestExamplesText = bestExamples.length
    ? bestExamples
        .map(
          (ex, idx) =>
            `\n\n====================\nBEST EXAMPLE #${idx + 1}:\n${JSON.stringify(ex.content, null, 2)}`
        )
        .join('\n')
    : '\n(No prior best examples found for this module type/level.)';

  // === Compose the system prompt with best examples injected ===
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
- Aim for ~${targetPages} total pages (±2). Do not exceed 20 pages.

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
    const textModel = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    const result = await textModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
    });

    responseText = result.response.text();

    // Tolerant extraction: fenced or raw JSON
    const jsonString = extractJsonBlock(responseText);
    const parsed = JSON5.parse(jsonString);

    if (!parsed.storyboardModule) {
      throw new Error("Parsed JSON did not contain 'storyboardModule'.");
    }

    // ✅ Ensure durationMins is present for downstream consumers
    parsed.storyboardModule.durationMins = durationMins;

    // --- Helper: hard-enforce photorealistic visuals and build a rich prompt ---
function buildPhotorealisticPrompt(event: any, brand?: { colours?: string[]; fonts?: string }) {
  const vb = event?.aiProductionBrief?.visual ?? {};
  const subject = vb.subject || "diverse professionals collaborating in a modern workplace";
  const setting = vb.setting || "contemporary office or home office environments";
  const composition = vb.composition || "natural candid composition with clear subject focus, 16:9";
  const lighting = vb.lighting || "soft natural daylight or warm practical lighting";
  const mood = vb.mood || "professional, inclusive, productive";
  const palette = (brand?.colours || ["#0387E6", "#E63946", "#BC57CF", "#000000", "#FFFFFF"]).join(", ");

  // Style guardrails (overwrite any vector/flat)
  const style = "Photorealistic";
  const negative = [
    "no vector art",
    "no flat illustration",
    "no cartoon",
    "no clip art",
    "no isometric illustration",
    "no 3D render look",
    "no exaggerated proportions",
  ].join(", ");

  // Camera/realism cues (kept tasteful/generic so any model can use them)
  const realismCues = [
    "photorealistic",
    "high-resolution",
    "natural skin tones",
    "realistic proportions",
    "subtle depth of field",
    "authentic textures",
    "clean background bokeh when appropriate",
  ].join(", ");

  // Build final prompt
  return [
    `${subject} in ${setting}.`,
    `Composition: ${composition}. Lighting: ${lighting}. Mood: ${mood}.`,
    `Style: ${style}; ${realismCues}.`,
    `Brand-aware accents (subtle): ${palette}.`,
    `Avoid: ${negative}.`,
  ].join(" ");
}

// --- Helper: normalize brief in-place (enforce mediaType=image and style=Photorealistic) ---
function normalizeVisualBrief(event: any) {
  event.aiProductionBrief ||= {};
  event.aiProductionBrief.visual ||= {};
  const vb = event.aiProductionBrief.visual;

  // Default/force mediaType
  if (!vb.mediaType) vb.mediaType = "image";
  if (String(vb.mediaType).toLowerCase() !== "image") vb.mediaType = "image";

  // Overwrite any vector/flat signals
  const style = String(vb.style || "").toLowerCase();
  if (!style || /(vector|flat|illustration|isometric|cartoon)/i.test(style)) {
    vb.style = "Photorealistic";
  } else {
    // Even if something else is present (e.g., "cinematic"), append Photorealistic
    if (!/photorealistic/i.test(style)) vb.style = `${vb.style} Photorealistic`.trim();
  }

  return vb;
}

// ✅ Generate images for any image-type events (photorealism enforced)
for (const page of parsed.storyboardModule.pages as StoryboardPage[]) {
  for (const event of (page.events || []) as StoryboardEvent[]) {
    // Normalise the brief and enforce photorealistic defaults
    const vb = normalizeVisualBrief(event);

    // Build an enriched, photorealistic prompt (optionally pass brand from module if you have it)
    const finalPrompt = buildPhotorealisticPrompt(event, parsed?.brand);

    const mediaType = String(vb.mediaType || "").toLowerCase();
    if (finalPrompt && mediaType === "image") {
      console.log("✅ Photorealistic image generation enforced");
      if (ENABLE_IMAGE_GENERATION) {
        const imageUrl = await generateImageFromPrompt(finalPrompt /*, { size: "2048x1152" }*/);
        (event as any).generatedImageUrl = imageUrl || null;
      }
      // Save metadata for traceability/debugging
      (event as any).generatedImageMeta = {
        styleEnforced: "Photorealistic",
        promptUsed: finalPrompt,
        mediaType: vb.mediaType,
        timestamp: new Date().toISOString(),
      };
      await sleep(2000);
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
