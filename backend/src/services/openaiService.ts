import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { pickProfile } from "../library/interactivityProfiles";
import { enforceInteractiveDensity } from "../library/interactivityLibrary";
import type { StoryboardModule } from "../types";
import { createClient } from "@supabase/supabase-js";
import { injectBlueprint, ensureCapstoneAndClosing } from "../library/blueprintPrompt";

/* =========================================================
   OpenAI client
   ========================================================= */
if (!process.env.OPENAI_API_KEY) {
  console.warn("⚠️ OPENAI_API_KEY is not set. The service will fail on first call.");
}
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

/* =========================================================
   Supabase client (for saving storyboards)
   ========================================================= */
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase: ReturnType<typeof createClient> | null = null;
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  console.log("✅ Supabase client initialised for storyboards.");
} else {
  console.warn("⚠️ Supabase env not configured — storyboards will NOT be saved.");
}

async function saveStoryboardToSupabase(
  storyboard: any,
  meta?: { source?: "text" | "files"; aiModel?: string | null; org?: string | null }
) {
  if (!supabase) return;
  const row = {
    module_name: storyboard?.moduleName || "Untitled Module",
    content: storyboard, // JSON column recommended in Supabase
    organisation: meta?.org || null,
    ai_model: meta?.aiModel || null,
    source: meta?.source || null,
    created_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from("storyboards").insert(row).select("id");
  if (error) {
    console.error("💥 Failed to save storyboard to Supabase:", error);
  } else {
    console.log("💾 Saved storyboard id:", data?.[0]?.id);
  }
}

/* =========================================================
   Types (local helpers only)
   ========================================================= */
export type AugmentedFormData = Record<string, any> & {
  ragContext?: string;
  ragChunkContext?: string;
  aiModel?: string;
  moduleName?: string;
  complexityLevel?: string;
  level?: string;
  duration?: string | number;
  durationMins?: number;
  targetAudience?: string;           // e.g., "Underwriters; Claims staff"
  organisationName?: string;
  learningOutcomes?: string | string[];
  instructionalPurpose?: string;

  /** Preferred ID method switch, e.g., "ADDIE", "SAM", "MERRILL", "GAGNE", "BACKWARD", "BLOOM" */
  idMethod?: string;
  preferredMethodology?: string;

  companyImages?: Array<{
    url?: string;
    fileName?: string;
    description?: string;
    intendedUse?: string;
    suggestedUse?: string;
  }>;

  brandGuidelines?: string;
  colours?: string;
  fonts?: string;
  tone?: string;
  outputLanguage?: string;
  additionalNotes?: string;
  content?: string; // extra plain text extracted from PDF (RAG)
  forceLength?: boolean;
  minScenes?: number;

  __source?: "text" | "files";
};

export type GenerateOptions = {
  ragContext?: string;
  ragChunkContext?: string;
  aiModel?: string;
};

/* =========================================================
   Model selection (allowlist + mapping)
   ========================================================= */
const OPENAI_DEFAULT = (process.env.OPENAI_MODEL || "gpt-4o").trim();
const OPENAI_FALLBACK = (process.env.OPENAI_FALLBACK_MODEL || "gpt-4o").trim();
const OPENAI_TIMEOUT_MS = Number(process.env.OPENAI_TIMEOUT_MS || 120000);
const ALLOWED_MODELS = (process.env.OPENAI_ALLOWED_MODELS || "gpt-5,gpt-4o,gpt-4-turbo")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function normaliseProfile(raw: any, fallbackLevel: string = "Level 3") {
  const safeArray = (arr: any, fallback: string[]) =>
    Array.isArray(arr) && arr.length ? arr : fallback;

  return {
    minKnowledgeChecks: Number(raw?.minKnowledgeChecks ?? 3),
    preferredInteractionTypes: safeArray(
      raw?.preferredInteractionTypes,
      ["Scenario", "MCQ", "Clickable Hotspots", "Drag & Drop", "Reflection"]
    ),
    maxSameTypeInRow: Number(raw?.maxSameTypeInRow ?? 2),
    branchingRequired: Boolean(raw?.branchingRequired ?? true),
    level: raw?.level ?? fallbackLevel,
  };
}

function genericAIPrompt(title: string) {
  // Photorealistic default with vector avoidance baked in
  return [
    `Photorealistic workplace photograph supporting "${title}"`,
    "natural lighting; shallow depth of field; authentic textures; inclusive; modern office/home office; 16:9.",
    "Avoid: vector art, flat illustration, cartoon, isometric, clip art, 3D render look."
  ].join("; ");
}

console.log("🔧 Using OpenAI default model from env:", OPENAI_DEFAULT);
console.log("🔒 Allowed models:", ALLOWED_MODELS.join(", "));

export function resolveOpenAIModel(requested?: string): string {
  const norm = (requested || OPENAI_DEFAULT).toLowerCase().trim();
  const map: Record<string, string> = {
    gpt5: "gpt-5",
    "chat-5": "gpt-5",
    "gpt-5": "gpt-5",
    gpt4o: "gpt-4o",
    "gpt-4o": "gpt-4o",
    "gpt-4-turbo": "gpt-4-turbo",
    "gpt-4-turbo-latest": "gpt-4-turbo",
  };
  const resolved = map[norm] || OPENAI_DEFAULT;
  if (!ALLOWED_MODELS.includes(resolved)) {
    console.warn(`⚠️ Model "${resolved}" not in OPENAI_ALLOWED_MODELS; falling back to ${OPENAI_DEFAULT}`);
    return OPENAI_DEFAULT;
  }
  return resolved;
}

/* =========================================================
   Duration helper
   ========================================================= */
function parseDurationMins(input: string | number | undefined): number {
  if (input === 0) return 0;
  if (!input && input !== 0) return 20;
  if (typeof input === "number") return input;

  const str = String(input).toLowerCase().trim();

  const numOnly = str.match(/^(\d+)$/);
  if (numOnly) return parseInt(numOnly[1], 10);

  const range = str.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (range) return parseInt(range[2], 10);

  const mins = str.match(/(\d+)\s*(min|mins|minute|minutes)\b/);
  if (mins) return parseInt(mins[1], 10);

  const hours = str.match(/(\d+)\s*(h|hr|hrs|hour|hours)\b/);
  if (hours) return parseInt(hours[1], 10) * 60;

  const fallback = parseInt(str, 10);
  return isNaN(fallback) ? 20 : fallback;
}

/* =========================================================
   Debug helpers
   ========================================================= */
const DEBUG_DIR = process.env.DEBUG_PROMPTS_DIR || "";
function maybeWriteDebug(name: string, content: string) {
  if (!DEBUG_DIR) return;
  try {
    if (!fs.existsSync(DEBUG_DIR)) fs.mkdirSync(DEBUG_DIR, { recursive: true });
    fs.writeFileSync(path.join(DEBUG_DIR, name), content, "utf8");
  } catch {
    /* ignore */
  }
}

/* =========================================================
   Sanitisation
   ========================================================= */
function sanitise(text?: string, max = 8000): string {
  const s = String(text || "");
  const cleaned = s
    .replace(/©.*?(\n|$)/gim, "")
    .replace(/(^|\n)\s*(T:|W:|E:).*/gim, "")
    .replace(/Level\s*\d+.*?v\.\d+/gim, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return cleaned.length > max ? cleaned.slice(0, max) + "\n\n[…truncated…]" : cleaned;
}

function tidyModuleName(name?: string) {
  return String(name || "Untitled Module").replace(/\)+$/g, "").trim();
}

/* small helpers for brand propagation */
function parseHexListFromString(s?: string): string[] {
  if (!s) return [];
  const hex = s
    .split(/[,;|\n]/)
    .map((x) => x.trim())
    .filter(Boolean)
    .map((x) => (x.startsWith("#") ? x : `#${x}`))
    .filter((x) => /^#[0-9a-f]{3,8}$/i.test(x));
  return Array.from(new Set(hex));
}
function firstFontFromString(s?: string): string | undefined {
  if (!s) return;
  return s.split(/[,;|\n]/)[0]?.trim();
}

/* =========================================================
   System Prompt (Brandon Hall + strict schema + ID method)
   ========================================================= */
export const getSystemPrompt = () => `
You are an award-winning eLearning design director and platform architect. Produce **build-ready storyboards** in **UK English** that meet **Brandon Hall** standards and act as **AI asset blueprints** for images, animations, videos and audio.

NON-NEGOTIABLES
- Output MUST be a single valid **JSON object** (no markdown fences; no extra prose).
- Use **UK spellings** (behaviour, organisation, programme).
- Voiceover ~110 wpm; On-Screen Text (OST) ≤ **70 words** and NOT duplicated verbatim from VO.
- Accessibility: meaningful **alt text** for every visual; **captions ON** by default; include **keyboard path & focus order** hints.
- Interactivity: explicit decision/feedback logic, **retry rules**, **xAPI events**, and a **completionRule** per interactive screen.

FRONT MATTER (NOT PART OF MODULE FLOW)
- Return a top-level **frontMatter[]** with exactly 3 items, in order:
  1) { "type": "Cover", "companyName": string, "logoNote"?: string }
  2) { "type": "Pronunciation", "items": [{ "term": string, "pronunciation": string, "note"?: string }] }
  3) { "type": "TableOfContents", "items": string[] }
- **Scenes** begin at the Welcome & Learning Objectives page (module flow starts after front matter).

GLOBAL VISUAL STANDARD
- Use **PHOTOREALISTIC**, high-resolution, human-centric imagery for ~97% of visuals.
- Vector/flat/cartoon/isometric art is NOT allowed as a main scene style.
- Minimal vector ICONS allowed only as micro UI hints (≤3% of visuals).
- For every visual brief, include composition, lighting, HEX palette, mood, brand integration, and negative space.

INSTRUCTIONAL DESIGN METHOD (TAG EVERY SCENE)
- The caller will pass idMethod ∈ {"ADDIE","SAM","MERRILL","GAGNE","BACKWARD","BLOOM"}.
- You MUST set scene.instructionalTag based on the chosen method:

If ADDIE:
  instructionalTag = { "method": "ADDIE", "addie": { "phase": "A"|"D1"|"D2"|"I"|"E" } }
  Guidance: A=Analysis (audience/context/gap); D1=Design (objectives/blueprint); D2=Development (assets/accessibility); I=Implementation (rollout); E=Evaluation (checks, post-test, confidence, follow-up).

If SAM:
  instructionalTag = { "method": "SAM", "sam": { "phase": "Prepare"|"Iterate"|"Implement" } }

If MERRILL:
  instructionalTag = { "method": "MERRILL", "merrill": { "phase": "Activation"|"Demonstration"|"Application"|"Integration" } }

If GAGNE:
  instructionalTag = { "method": "GAGNE", "gagne": { "event": "GainAttention"|"InformObjectives"|"StimulateRecall"|"PresentContent"|"ProvideGuidance"|"ElicitPerformance"|"ProvideFeedback"|"AssessPerformance"|"EnhanceRetentionTransfer" } }

If BACKWARD:
  instructionalTag = { "method": "BACKWARD", "backward": { "stage": "IdentifyResults"|"DetermineEvidence"|"PlanLearning" } }

If BLOOM:
  instructionalTag = { "method": "BLOOM", "bloom": { "level": "Remember"|"Understand"|"Apply"|"Analyze"|"Evaluate"|"Create" } }

RETURN EXACTLY THIS SHAPE:
{
  "moduleName": string,
  "moduleOverview": string,
  "learningLevel": "Level 1" | "Level 2" | "Level 3" | "Level 4",
  "targetAudience": string,
  "idMethod": "ADDIE" | "SAM" | "MERRILL" | "GAGNE" | "BACKWARD" | "BLOOM",
  "frontMatter": Array<{
    "type": "Cover" | "Pronunciation" | "TableOfContents",
    "companyName"?: string,
    "logoNote"?: string,
    "items"?: any[]
  }>,
  "metadata": {
    "moduleTiming": {
      "targetMinutes": number,
      "totalEstimatedMinutes": number,
      "perSceneSeconds": number[]
    },
    "brand": { "colours"?: string, "fonts"?: string, "guidelines"?: string },
    "performanceSupport"?: { "jobAids"?: string[], "timeframeTables"?: string[] }
  },
  "revisionHistory": [{ "dateISO": string, "change": string, "author": string }],
  "pronunciationGuide": [{ "term": string, "pronunciation": string, "note"?: string }],
  "tableOfContents": string[],
  "learningObjectiveMap": Array<{ "objective": string, "teachScenes": number[], "practiceScenes": number[], "assessScenes": number[], "masteryCriteria": string }>,
  "evaluationPlan": { "postTestItems": number, "passMarkPercent": number, "confidenceSlider": boolean, "followUpDays": number, "kirkpatrickLevels": string[] },
  "scenes": Scene[]
}

Scene = {
  "sceneNumber": number,
  "pageTitle": string,
  "pageType": "Informative" | "Interactive",
  "aspectRatio": "16:9" | "1:1" | "4:5" | string,
  "screenLayout": string | { "description": string, "elements": Array<Record<string, any>> },
  "templateId": string,
  "screenId": string,
  "audio": {
    "script": string,
    "voiceParameters": { "persona": string, "gender"?: "Female" | "Male" | "Neutral" | string, "pace": string, "tone": string, "emphasis": string },
    "backgroundMusic"?: string,
    "aiGenerationDirective"?: string
  },
  "narrationScript": string,
  "onScreenText": string,
  "textOnScreen"?: { "onScreenTextContent": string, "style"?: Record<string, string> },
  "visual": {
    "mediaType": "Image" | "Graphic" | "Animation" | "Video",
    "style": string,
    "visualGenerationBrief": {
      "sceneDescription": string,
      "style": string,
      "subject"?: Record<string, any>,
      "setting"?: string,
      "composition"?: string,
      "lighting"?: string,
      "colorPalette"?: string[],
      "mood"?: string,
      "brandIntegration"?: string,
      "negativeSpace"?: string,
      "assetId"?: string
    },
    "overlayElements"?: Array<Record<string, any>>,
    "aiPrompt": string,
    "altText": string,
    "aspectRatio": "16:9" | "1:1" | "4:5" | string,
    "composition": string,
    "environment": string
  },
  "interactionDetails"?: {
    "interactionType": "None" | "MCQ" | "DragAndDrop" | "Scenario" | "ClickableHotspots" | "Reflection" | "InteractiveVideo" | string,
    "aiActions"?: string[],
    "aiDecisionLogic"?: Array<Record<string, any>>,
    "retryLogic"?: string,
    "completionRule"?: string,
    "aiGenerationDirective"?: string,
    "xapiEvents"?: Array<{ "verb": string, "object": string, "result"?: Record<string, any> }>,
    "distractorRationale"?: Array<{ "option": string, "whyPlausible": string, "whyWrong": string }>
  },
  "interactionType": string,
  "interactionDescription": string,
  "scaffoldingPhase"?: "Overview" | "Context" | "KeyConcepts" | "Example" | "Application" | "KnowledgeCheck" | "Summary",
  "roleFocus"?: string,
  "instructionalTag": any, // per method (see above)
  "developerNotes": string,
  "accessibilityNotes": string,
  "timing": { "estimatedSeconds": number }
}

Brandon Hall Enforcement:
- Ensure **≥5 interaction types** across the module; **knowledge check every 3–5 scenes**.
- Provide **≥3 branching decision points** with consequences + coaching feedback.
- End with **capstone branching** + **action plan/commitment**.
- Accessibility: captions ON, alt text, keyboard path & focus order, reduced-motion fallback.
`.trim();

/* =========================================================
   User Prompt (RAG-augmented + level-aware interactivity)
   ========================================================= */
export const getAugmentedUserPrompt = (
  formData: AugmentedFormData,
  opts: { duration: number; targetScenes: number; minInteractive: number },
  ragContext?: string,
  ragChunkContext?: string
) => {
  // ID method (explicit)
  const idMethod = String(formData.idMethod || formData.preferredMethodology || "ADDIE")
    .toUpperCase()
    .replace(/\s+/g, "") as "ADDIE"|"SAM"|"MERRILL"|"GAGNE"|"BACKWARD"|"BLOOM";

  const profileRaw = pickProfile(formData.complexityLevel || formData.level || "Level 3");
  const profile = {
    minKnowledgeChecks: Number(profileRaw?.minKnowledgeChecks ?? 3),
    preferredInteractionTypes:
      Array.isArray(profileRaw?.preferredInteractionTypes) && profileRaw.preferredInteractionTypes.length
        ? profileRaw.preferredInteractionTypes
        : ["Scenario", "MCQ", "Clickable Hotspots", "Drag & Drop", "Reflection"],
    maxSameTypeInRow: Number(profileRaw?.maxSameTypeInRow ?? 2),
    branchingRequired: Boolean(profileRaw?.branchingRequired ?? true),
    level: profileRaw?.level ?? (formData.complexityLevel || formData.level || "Level 3"),
  };

  const ragSB = safeSlice(String(ragContext ?? formData.ragContext ?? ""), 8000);
  const ragChunks = safeSlice(String(ragChunkContext ?? formData.ragChunkContext ?? ""), 8000);

  const interactivityRules = `
INTERACTIVITY PROFILE (adhere strictly)
- Level: ${formData.complexityLevel || formData.level || "Level 3"}
- Target scenes: ~${opts.targetScenes} (±2)
- Minimum interactive scenes: ${opts.minInteractive}
- Min knowledge check items total: ${profile.minKnowledgeChecks}
- Preferred types: ${profile.preferredInteractionTypes.join(", ")}
- Max same type in a row: ${profile.maxSameTypeInRow}
- Branching required: ${profile.branchingRequired ? "Yes" : "No"}

HARD CONSTRAINTS
- Mix knowledge check formats (single, multi, scenario, drag-drop). Place a KC every **3–5 scenes**.
- Provide **option-level feedback** in developer notes for knowledge checks.
- Maintain variety; do not repeat the same interaction type > ${profile.maxSameTypeInRow} times in a row.
`.trim();

  const quality = `
QUALITY MANDATES (apply to ALL modules)
- **Front matter** is NOT part of module flow. Provide it under "frontMatter" (Cover, Pronunciation, TOC) then start scenes at "Welcome & Learning Objectives".
- Provide **3–5 Learning Outcomes** aligned to the brief and duration (~${opts.duration} min). Make them **role-tied and performance-based**.
- For every **key concept**, generate at least one **role-specific example** drawn from targetAudience. Label scenes with "scaffoldingPhase".
- Each scene: structured audio directives, OST ≤ 70w, **AI Visual Generation Brief** (composition + lighting + HEX palette + mood + brand integration + negativeSpace), **overlayElements** with styles + AI directives, interaction details (logic/xAPI), and **timing**.
- Progressive disclosure: use tabs/accordions/hotspots for definitions and details; keep OST scannable.
- Tone: Professional, supportive, empathetic, aligned to organisation values.
- Knowledge checks: include **distractorRationale[]** explaining plausibility and error for each wrong option.
- Performance & compliance: If relevant, include timeframe tables + job aids in metadata.performanceSupport.
- Use **UK English**; captions ON; keyboard path & focus order documented.
`.trim();

  const moduleName = tidyModuleName(formData.moduleName);
  const additionalNotes = sanitise(formData.additionalNotes, 4000);
  const content = sanitise(formData.content, 16000);
  const brandGuidelines = sanitise(formData.brandGuidelines, 2000);
  const colours = sanitise(formData.colours, 500);
  const fonts = sanitise(formData.fonts, 500);
  const lo = normaliseLO(formData.learningOutcomes);

  if (typeof formData.learningOutcomes === "string" && formData.learningOutcomes.length > 2000) {
    formData.learningOutcomes = formData.learningOutcomes.slice(0, 2000);
  }

  const forceClause = formData.forceLength
    ? `\nHARD REQUIREMENT: Ensure the storyboard includes **at least ${opts.targetScenes} scenes** suitable for ${formData.complexityLevel || formData.level || "Level 3"}.\n`
    : "";

  const imagesBlock =
    Array.isArray(formData.companyImages) && formData.companyImages.length
      ? formData.companyImages
          .map(
            (img, i) =>
              `- Asset ${i + 1}: ${img.fileName || img.url || "unlabelled"}\n  Description: ${img.description || "—"}\n  Intended/Suggested use: ${img.intendedUse || img.suggestedUse || "—"}`
          )
          .join("\n")
      : "None provided";

  return `
You are designing a Brandon-Hall quality storyboard. Use any source content faithfully, but enforce the interactivity profile and quality mandates **exactly**.

--- CONTEXT EXAMPLES (RAG – Storyboards) ---
${ragSB || "No storyboard-level RAG examples available."}
--- END CONTEXT ---

--- INTERACTION BLUEPRINTS (RAG – Chunks) ---
${ragChunks || "No chunk-level RAG available."}
--- END BLUEPRINTS ---

${interactivityRules}${forceClause}

--- USER BRIEF ---
Module Name: ${moduleName || "Untitled"}
Module Type: ${formData.moduleType || "eLearning"}
Complexity Level: ${formData.complexityLevel || formData.level || "Level 3"}
Target Duration (mins): ${opts.duration}
Audience: ${formData.targetAudience || "General staff"}
Tone: ${formData.tone || "Professional, supportive, empathetic"}
Output Language: ${formData.outputLanguage || "English (UK)"}
Organisation: ${formData.organisationName || "Not specified"}
Learning Outcomes (desired): ${lo.length ? lo.join(" | ") : "Author to propose 3–5 outcomes aligned to the brief (role-tied)."}
Instructional Purpose: ${formData.instructionalPurpose || "Not specified"}
ID_METHOD: ${idMethod}
REQUIRE: Annotate every scene with instructionalTag for ${idMethod}.
Brand Guidelines: ${brandGuidelines || "None provided"}
Colours: ${colours || "Default"}
Fonts: ${fonts || "Default"}
Company Images (binary uploaded or URLs):
${imagesBlock}
Additional Notes: ${additionalNotes || "None"}
--- SOURCE CONTENT (sanitised) ---
${content}
--- END USER BRIEF ---

${quality}

OUTPUT RULES
- Return a single **JSON object only** (no markdown fences, no commentary).
- Use the exact schema in the SYSTEM prompt.
- **frontMatter** must include Cover, Pronunciation, TableOfContents (in that order).
- **Scenes** begin with "Welcome & Learning Objectives" and continue the module flow.
- Populate the new structured fields and legacy mirrors (narrationScript, aiPrompt, interactionType, interactionDescription, screenLayout short string).
`.trim();
};

/* =========================================================
   Expansion Prompt (second pass if thin)
   ========================================================= */
function getExpansionPrompt(
  current: StoryboardModule,
  opts: { duration: number; targetScenes: number; minInteractive: number }
) {
  return `
The storyboard JSON is **too short or incomplete** for a ${opts.duration}-minute module.
Expand/enhance to roughly **${opts.targetScenes} scenes** ensuring at least **${opts.minInteractive} interactive scenes**.
Place a knowledge check every **3–5 scenes** with varied formats and coaching feedback.
Preserve **frontMatter** (Cover, Pronunciation, TOC) separate from module scenes.
Return **JSON ONLY** with the SAME SCHEMA.

CURRENT_JSON_START
${JSON.stringify(current)}
CURRENT_JSON_END
`.trim();
}

/* =========================================================
   JSON extraction & parse
   ========================================================= */
function extractJson(text: string): string {
  if (typeof text !== "string") return text as any;
  const fenced = text.match(/```json\s*([\s\S]*?)```/i) || text.match(/```\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first >= 0 && last > first) return text.slice(first, last + 1);
  return text.trim();
}
function safeParseJson(maybe: string): any {
  const raw = extractJson(maybe);
  try {
    return JSON.parse(raw);
  } catch {
    const repaired = raw
      .replace(/,\s*([}\]])/g, "$1")
      .replace(/(\w):\s*"(.*)"\s*"(.*)"/g, '$1: "$2$3"')
      .replace(/```/g, "");
    try {
      return JSON.parse(repaired);
    } catch {
      throw new Error("Failed to parse JSON from model output.");
    }
  }
}

/* =========================================================
   Front matter + guarantees
   ========================================================= */
function mkFrontMatter(company?: string) {
  return [
    { type: "Cover", companyName: company || "Your Company", logoNote: "Place logo top-left; maintain clear space." },
    { type: "Pronunciation", items: [] as Array<{ term: string; pronunciation: string; note?: string }> },
    { type: "TableOfContents", items: [] as string[] },
  ];
}

function mkScene(num: number, title: string, opts: Partial<any> = {}) {
  const audioScript = (opts as any)?.audio?.script || opts.narrationScript || "";
  const shortLayout =
    typeof opts.screenLayout === "string"
      ? opts.screenLayout
      : opts.screenLayout?.description || "Standard slide layout";

  return {
    sceneNumber: num,
    pageTitle: title,
    pageType: (opts as any).pageType || (/(welcome|objective)/i.test(title) ? "Informative" : "Interactive"),
    aspectRatio: (opts as any).aspectRatio || "16:9",

    screenLayout: opts.screenLayout || shortLayout,
    templateId: opts.templateId || "",
    screenId: opts.screenId || `S${num}`,

    audio: {
      script: audioScript,
      voiceParameters:
        (opts as any)?.audio?.voiceParameters || {
          persona: "Warm, professional, encouraging",
          pace: "Moderate (110–130 WPM)",
          tone: "Clear, reassuring",
          emphasis: "",
        },
      backgroundMusic: (opts as any)?.audio?.backgroundMusic || "",
      aiGenerationDirective:
        (opts as any)?.audio?.aiGenerationDirective ||
        "[AI Generate: Voiceover ~110–130 WPM; warm, professional; emphasise key terms.]",
    },
    narrationScript: audioScript,

    onScreenText: clampOnScreenText(opts.onScreenText || ""),
    textOnScreen: (opts as any).textOnScreen || {
      onScreenTextContent: clampOnScreenText(opts.onScreenText || ""),
      style: { fontFamily: "Montserrat", fontWeight: "SemiBold", fontSize: "20pt", color: "#111111", alignment: "Left" },
    },

    visual: {
      mediaType: (opts as any)?.visual?.mediaType || "Image",
      style: (opts as any)?.visual?.style || "Photorealistic",
      visualGenerationBrief:
        (opts as any)?.visual?.visualGenerationBrief || {
          sceneDescription: `Photorealistic workplace visual supporting "${title}".`,
          style: "Photorealistic",
          subject: {},
          setting: "Modern office or home office; inclusive",
          composition: "Natural candid composition; clear subject focus; 16:9",
          lighting: "Soft natural daylight or warm practical",
          colorPalette: ["#FFFFFF", "#111111", "#0387E6", "#E63946", "#BC57CF"],
          mood: "Professional, calm, optimistic",
          brandIntegration: "Subtle brand accents only; never on skin tones.",
          negativeSpace: "30% top-right",
          assetId: "",
        },
      overlayElements:
        (opts as any)?.visual?.overlayElements || [
          {
            elementType: "TitleText",
            content: title,
            style: { fontFamily: "Montserrat", fontWeight: "Bold", fontSize: "40pt", color: "#111111", alignment: "Center", position: "Top third", animation: "FadeIn 0.5s" },
            aiGenerationDirective: "[AI Generate: Title overlay; crisp kerning; subtle shadow; WCAG AA contrast.]",
          },
        ],
      aiPrompt:
        (opts as any)?.visual?.aiPrompt || genericAIPrompt(title),
      altText: (opts as any)?.visual?.altText || `Photograph supporting "${title}"`,
      aspectRatio: (opts as any)?.visual?.aspectRatio || "16:9",
      composition: (opts as any)?.visual?.composition || "Natural candid composition; negative space for UI",
      environment: (opts as any)?.visual?.environment || "Neutral, light-filled workspace",
      ...(opts.visual || {}),
    },

    interactionDetails: (opts as any).interactionDetails || undefined,
    interactionType: opts.interactionType || "None",
    interactionDescription: opts.interactionDescription || "",

    developerNotes: (opts as any).developerNotes || "",
    accessibilityNotes:
      (opts as any).accessibilityNotes ||
      "Captions ON by default; Keyboard path: Tab/Shift+Tab; Enter/Space to activate; visible focus outline; reduced-motion alternative.",

    timing: (opts as any).timing || { estimatedSeconds: 60 },
  };
}

/**
 * Ensure we have frontMatter (Cover, Pronunciation, TOC).
 * If the model returned them as the first 3 scenes, extract them into frontMatter
 * and start module scenes at "Welcome & Learning Objectives".
 */
function ensureFrontMatterAndWelcome(parsed: any, formData: AugmentedFormData): any {
  const out = { ...parsed } as StoryboardModule & { frontMatter?: any[]; tableOfContents?: string[] };
  const scenes: any[] = Array.isArray(out.scenes) ? [...out.scenes] : [];

  // Ensure frontMatter array exists
  if (!Array.isArray(out.frontMatter) || out.frontMatter.length < 3) {
    out.frontMatter = mkFrontMatter(formData.organisationName);
  }

  const norm = (s?: string) => String(s || "").toLowerCase().replace(/\s+/g, " ").trim();

  // Attempt to pull the first 3 header-like scenes into frontMatter if present
  const headerCandidates = scenes.slice(0, 3);
  const flags = headerCandidates.map((s) => norm((s as any)?.pageTitle || (s as any)?.title));
  const looksLikeHeader =
    flags.length >= 2 &&
    (flags[0]?.includes("title") || flags[0]?.includes("cover")) &&
    flags[1]?.includes("pronunciation") &&
    (flags[2]?.includes("table of contents") || flags[2]?.includes("contents"));

  if (looksLikeHeader) {
    // Move any pronunciation terms and TOC into frontMatter
    const pron = (headerCandidates[1] as any)?.pronunciationGuide || [];
    if (Array.isArray(pron) && pron.length) {
      const fm = out.frontMatter.find((f: any) => f.type === "Pronunciation");
      if (fm) fm.items = pron;
    }
    const tocFromScenes = (scenes as any[]).map((s, i) => s.pageTitle || s.title || `Section ${i + 1}`);
    const fmTOC = out.frontMatter.find((f: any) => f.type === "TableOfContents");
    if (fmTOC) fmTOC.items = tocFromScenes.slice(3); // module-only items

    // Drop the first 3 from scenes
    scenes.splice(0, 3);
  }

  // Ensure the first module scene is Welcome & LOs
  if (!scenes.length || !/welcome|objective/i.test(norm(scenes[0]?.pageTitle || scenes[0]?.title))) {
    const lo = normaliseLO(formData.learningOutcomes);
    const sWelcome = mkScene(1, "Welcome & Learning Objectives", {
      pageType: "Informative",
      onScreenText: clampOnScreenText(
        lo.length ? `Learning Objectives:\n- ${lo.join("\n- ")}` : "By the end, you'll be able to…"
      ),
      audio: {
        script: lo.length ? `By the end of this module, you will be able to ${lo.join("; ")}.` : "Let's set expectations for this module.",
        voiceParameters: { persona: "Warm facilitator", pace: "Moderate", tone: "Encouraging", emphasis: "Outcomes" },
      },
      developerNotes: "Welcome + LOs. Keep OST under 70 words. Make outcomes role-tied.",
    });
    scenes.unshift(sWelcome);
  }

  // Renumber module scenes from 1
  out.scenes = scenes.map((s, i) => ({ ...s, sceneNumber: i + 1 }));
  return out;
}

/* =========================================================
   Module-level enrichment (TOC/brand/eval)
   ========================================================= */
function ensureTOCAndOutcomes(
  m: StoryboardModule & {
    tableOfContents?: string[];
    metadata?: any;
    moduleOverview?: string;
    targetAudience?: string;
    learningLevel?: string;
  }
) {
  if (!Array.isArray(m.tableOfContents) || m.tableOfContents.length === 0) {
    m.tableOfContents = (m.scenes || []).map((s: any, i) => s.pageTitle || s.title || `Section ${i + 1}`);
  }

  // Also push module TOC into frontMatter item if present
  const fmTOC = Array.isArray((m as any).frontMatter)
    ? (m as any).frontMatter.find((f: any) => f.type === "TableOfContents")
    : null;
  if (fmTOC && (!Array.isArray(fmTOC.items) || fmTOC.items.length === 0)) {
    fmTOC.items = [...m.tableOfContents];
  }

  m.moduleOverview =
    m.moduleOverview ||
    "This programme combines short scenarios, interactive checks, and a capstone to help you apply key concepts in context.";
  m.learningLevel = m.learningLevel || "Level 3";
  m.targetAudience = m.targetAudience || "General staff";

  const per = (m.scenes || []).map((s: any) => Number(s?.timing?.estimatedSeconds || 60));
  const totalSec = per.reduce((a, b) => a + (isNaN(b) ? 0 : b), 0);
  const targetMin = Math.max(5, Math.round(totalSec / 60));
  m.metadata = m.metadata || {};
  m.metadata.moduleTiming = {
    targetMinutes: targetMin,
    totalEstimatedMinutes: Math.round(totalSec / 60),
    perSceneSeconds: per,
  };

  // brand thread-through
  const colours = parseHexListFromString(m?.metadata?.brand?.colours || (m as any)?.colours);
  const fonts = firstFontFromString(m?.metadata?.brand?.fonts || (m as any)?.fonts);
  m.metadata.brand = {
    ...(m.metadata.brand || {}),
    colours: colours?.join(", ") || m?.metadata?.brand?.colours || "",
    fonts: fonts || m?.metadata?.brand?.fonts || "",
    guidelines: m?.metadata?.brand?.guidelines || "",
  };

  // initialise performance support container so the model can fill it
  m.metadata.performanceSupport = m.metadata.performanceSupport || { jobAids: [], timeframeTables: [] };

  // Ensure evaluationPlan exists (soft default if model omitted)
  (m as any).evaluationPlan = (m as any).evaluationPlan || {
    postTestItems: 8,
    passMarkPercent: 80,
    confidenceSlider: true,
    followUpDays: 30,
    kirkpatrickLevels: ["L1", "L2", "L3"],
  };

  return m;
}

/* =========================================================
   Interactivity helpers
   ========================================================= */
function countInteractiveScenes(m: StoryboardModule) {
  return (m.scenes || []).filter((s: any) => (s.interactionType || "None") !== "None").length;
}
function minInteractiveCountFor(totalScenes: number) {
  if (totalScenes <= 10) return 3;
  if (totalScenes <= 16) return 4;
  if (totalScenes <= 22) return 6;
  return 7;
}
function injectInteractions(scenes: any[], needed: number) {
  const types = ["Scenario", "MCQ", "Clickable Hotspots", "Drag & Drop", "Reflection"];
  const out = [...scenes];
  let i = 0; // module scenes start at index 0 (Welcome)
  while (needed > 0 && i < out.length) {
    const s = out[i];
    if (s && (!s.interactionType || s.interactionType === "None")) {
      const t = types[(i + needed) % types.length];
      s.interactionType = t;
      s.interactionDescription =
        s.interactionDescription || describeInteraction(t, s.pageTitle || s.title || `Screen ${i + 1}`);
      s.developerNotes =
        s.developerNotes ||
        (t === "MCQ"
          ? "Add 2–3 MCQs for this topic. Provide option-level feedback and allow retry. Include distractorRationale."
          : "Include completion rule and xAPI verb in developer notes.");
      s.interactionDetails = s.interactionDetails || {
        interactionType: t,
        aiActions: ["Render interaction", "Handle selection", "Show feedback"],
        aiDecisionLogic: [],
        retryLogic: t === "MCQ" ? "Allow retry once before reveal." : "Allow retry.",
        completionRule: "User must interact at least once.",
        aiGenerationDirective: "[AI Generate: Accessible interaction with visible focus and keyboard operation.]",
        xapiEvents: [{ verb: "interacted", object: `Screen_${i + 1}` }],
        distractorRationale: [],
      };
      needed--;
    }
    i++;
  }
  return out;
}
function enforceKCCadence(scenes: any[]) {
  const kcTypes = new Set(["MCQ", "Scenario", "Drag & Drop"]);
  let lastKC = -4;
  for (let i = 0; i < scenes.length; i++) {
    const isKC = kcTypes.has((scenes[i].interactionType || "None") as string);
    if (isKC) lastKC = i;
    const gap = i - lastKC;
    if (gap >= 5) {
      scenes[i].interactionType = scenes[i].interactionType === "None" ? "MCQ" : scenes[i].interactionType;
      if (scenes[i].interactionType === "MCQ" && !scenes[i].interactionDescription) {
        scenes[i].interactionDescription = describeInteraction("MCQ", scenes[i].pageTitle || `Screen ${i + 1}`);
      }
      if (!/feedback/i.test(String(scenes[i].developerNotes || ""))) {
        scenes[i].developerNotes = `${scenes[i].developerNotes || ""}\nProvide option-level feedback. Allow retry. Include distractorRationale per option.`.trim();
      }
      scenes[i].interactionDetails = scenes[i].interactionDetails || {
        interactionType: "MCQ",
        aiActions: ["On select, open feedback panel", "Highlight selected option", "Enable Retry"],
        aiDecisionLogic: [],
        retryLogic: "Allow up to 2 retries; reveal correct after second incorrect.",
        completionRule: "User must answer all items.",
        aiGenerationDirective: "[AI Generate: MCQ with stateful buttons; keyboard operable; ARIA roles.]",
        xapiEvents: [{ verb: "answered", object: `Screen_${i + 1}_MCQ` }],
        distractorRationale: [],
      };
      lastKC = i;
    }
  }
  return scenes;
}

/* =========================================================
   Photorealistic visual blueprint enforcement
   ========================================================= */
function ensureVisualBlueprint(scene: any, brand?: { colours?: string; fonts?: string }) {
  const v = (scene.visual = scene.visual || {});
  const vgb = (v.visualGenerationBrief = v.visualGenerationBrief || {});
  const brandPalette = parseHexListFromString(brand?.colours);
  const primaryFont = firstFontFromString(brand?.fonts);

  // Photorealistic defaults
  v.mediaType = v.mediaType || "Image";
  v.style = /photo|real/i.test(String(v.style || "")) ? v.style : "Photorealistic";

  vgb.sceneDescription = vgb.sceneDescription || `Photorealistic workplace visual supporting "${scene.pageTitle || "this scene"}".`;
  vgb.style = /photo|real/i.test(String(vgb.style || "")) ? vgb.style : "Photorealistic";
  vgb.setting = vgb.setting || "Modern, uncluttered office or home office";
  vgb.composition = vgb.composition || "Natural candid composition; clear subject focus; 16:9";
  vgb.lighting = vgb.lighting || "Soft natural daylight or warm practical";
  vgb.colorPalette =
    Array.isArray(vgb.colorPalette) && vgb.colorPalette.length
      ? vgb.colorPalette
      : (brandPalette.length ? brandPalette : ["#FFFFFF", "#111111", "#0387E6", "#E63946", "#BC57CF"]);
  vgb.mood = vgb.mood || "Professional, calm, optimistic";
  vgb.brandIntegration =
    vgb.brandIntegration || (brandPalette.length ? `Use brand palette: ${brandPalette.join(", ")}.` : "Subtle brand accents; never on skin tones.");
  vgb.negativeSpace = vgb.negativeSpace || "30% top-right";
  vgb.assetId = vgb.assetId || "";

  if (!Array.isArray(v.overlayElements) || !v.overlayElements.length) {
    v.overlayElements = [
      {
        elementType: "TitleText",
        content: scene.pageTitle || "",
        style: {
          fontFamily: primaryFont || "Montserrat",
          fontWeight: "Bold",
          fontSize: "36pt",
          color: "#111111",
          alignment: "Center",
          position: "Top third",
          animation: "FadeIn 0.5s",
        },
        aiGenerationDirective:
          "[AI Generate: Title overlay; crisp kerning; subtle shadow; WCAG AA contrast.]",
      },
    ];
  } else if (primaryFont) {
    v.overlayElements = v.overlayElements.map((el: any) => ({
      ...el,
      style: { ...(el.style || {}), fontFamily: (el.style?.fontFamily || primaryFont) },
    }));
  }

  if (!v.aiPrompt) v.aiPrompt = genericAIPrompt(scene.pageTitle || "This scene");
  if (!v.altText) v.altText = `Photograph supporting "${scene.pageTitle || "this scene"}"`;
  if (!v.aspectRatio) v.aspectRatio = "16:9";
  if (!v.composition) v.composition = "Natural candid composition; negative space";
  if (!v.environment) v.environment = "Neutral, light-filled workspace";
  return scene;
}

/* =========================================================
   Auto-pad helper (photorealistic shells)
   ========================================================= */
function autoPadToTarget(scenes: any[], target: number, moduleName: string) {
  const shells = [
    (i: number) => ({
      pageTitle: `Scenario ${i}: Apply ${moduleName}`,
      pageType: "Interactive",
      interactionType: "Scenario",
      interactionDescription: "Two-branch scenario; coaching feedback; retry allowed.",
      developerNotes: "Track choices; xAPI Verb: responded; completion when both branches explored.",
      interactionDetails: {
        interactionType: "Scenario",
        aiActions: [
          "Render two decision options",
          "On selection, animate feedback and branch to A/B",
          "Enable Retry to explore alternate branch",
        ],
        aiDecisionLogic: [
          { choice: "A", feedback: "Outcome A; coaching tip.", xapi: { verb: "responded", object: `Scenario_${i}_A` } },
          { choice: "B", feedback: "Outcome B; coaching tip.", xapi: { verb: "responded", object: `Scenario_${i}_B` } },
        ],
        retryLogic: "Allow user to replay to explore both branches.",
        completionRule: "Both branches explored OR best outcome achieved.",
        aiGenerationDirective: "[AI Generate: Branching UI with A/B cards; animated feedback panel.]",
        xapiEvents: [{ verb: "responded", object: `Scenario_${i}` }],
      },
      audio: { script: "Apply the concept in a realistic situation." },
      onScreenText: "Make your choice.",
      timing: { estimatedSeconds: 120 },
    }),
    (i: number) => ({
      pageTitle: `Knowledge Check ${i}`,
      pageType: "Interactive",
      interactionType: "MCQ",
      interactionDescription: "2–3 items with option-level feedback.",
      developerNotes: "Allow retry; randomise order; xAPI Verb: answered. Include distractorRationale.",
      interactionDetails: {
        interactionType: "MCQ",
        aiActions: ["Render question + options", "On select, show feedback", "Allow retry once"],
        aiDecisionLogic: [],
        retryLogic: "Allow 1 retry, then reveal.",
        completionRule: "All items answered.",
        aiGenerationDirective: "[AI Generate: MCQ with accessible radio buttons; visual correct/incorrect states.]",
        xapiEvents: [{ verb: "answered", object: `KnowledgeCheck_${i}` }],
        distractorRationale: [],
      },
      audio: { script: "Check your understanding." },
      onScreenText: "Answer the questions.",
      timing: { estimatedSeconds: 90 },
    }),
    (i: number) => ({
      pageTitle: `Hotspots ${i}: Key Elements`,
      pageType: "Interactive",
      interactionType: "Clickable Hotspots",
      interactionDescription: "Reveal hotspots to explain key elements.",
      developerNotes: "All hotspots required; xAPI Verb: experienced.",
      interactionDetails: {
        interactionType: "ClickableHotspots",
        aiActions: ["Render 3–5 hotspot targets", "On click, reveal tooltip", "Track revealed count"],
        aiDecisionLogic: [],
        completionRule: "All hotspots revealed.",
        aiGenerationDirective: "[AI Generate: Image map with keyboard focus rings; aria-describedby for tooltips.]",
        xapiEvents: [{ verb: "experienced", object: `Hotspots_${i}` }],
      },
      audio: { script: "Explore the interface." },
      onScreenText: "Click each hotspot.",
      timing: { estimatedSeconds: 75 },
    }),
  ];
  let i = 1;
  const out = [...scenes];
  while (out.length < target) {
    const make = shells[(out.length + i) % shells.length];
    out.push({
      sceneNumber: out.length + 1,
      pageType: "Interactive",
      aspectRatio: "16:9",
      screenLayout: "Standard slide layout",
      templateId: "",
      screenId: `S${out.length + 1}`,
      visual: {
        mediaType: "Image",
        style: "Photorealistic",
        visualGenerationBrief: {
          sceneDescription: `Photorealistic workplace visual supporting "${moduleName}"`,
          style: "Photorealistic",
          subject: {},
          setting: "Modern office or home office",
          composition: "Natural candid composition; negative space",
          lighting: "Soft natural daylight",
          colorPalette: ["#FFFFFF", "#111111", "#0387E6", "#E63946", "#BC57CF"],
          mood: "Professional",
          brandIntegration: "Subtle brand accents; avoid skin tones",
          negativeSpace: "30% top-right",
          assetId: "",
        },
        overlayElements: [
          {
            elementType: "TitleText",
            content: `Activity`,
            style: { fontFamily: "Montserrat", fontWeight: "Bold", fontSize: "28pt", color: "#111111", alignment: "Center", position: "Top third" },
            aiGenerationDirective: "[AI Generate: Title overlay]",
          },
        ],
        aiPrompt: genericAIPrompt(moduleName),
        altText: `Photograph supporting "${moduleName}"`,
        aspectRatio: "16:9",
        composition: "Natural candid composition; negative space",
        environment: "Neutral workspace",
      },
      accessibilityNotes: "Captions ON; keyboard path.",
      ...make(i++),
    });
  }
  return out;
}

/* =========================================================
   Instructional method tags (soft enforcement)
   ========================================================= */
function ensureInstructionalTags(story: any, idMethod: string) {
  const method = (idMethod || "ADDIE").toUpperCase();
  for (const s of story.scenes || []) {
    s.instructionalTag = s.instructionalTag || { method };
    if (method === "ADDIE" && !s.instructionalTag.addie) {
      // Heuristic: welcome/objectives → D1, interactions → D2, knowledge check → E (or D2), capstone/summary → I/E
      const title = String(s.pageTitle || "").toLowerCase();
      const isKC = /knowledge|quiz|check|assessment/i.test(s.pageTitle || "") || /mcq|drag|scenario/i.test(s.interactionType || "");
      const isImpl = /action plan|commit|rollout|implementation|capstone/i.test(title);
      s.instructionalTag.addie = {
        phase: isKC ? "E" : isImpl ? "I" : /welcome|objective|design|plan/i.test(title) ? "D1" : "D2",
      };
    }
    // Other methods could have more heuristics here if needed.
  }
  story.idMethod = method;
  return story;
}

/* =========================================================
   Global Brandon Hall enforcements
   ========================================================= */
function clampOnScreenText(text?: string, limit = 70): string {
  const raw = String(text || "").trim();
  const words = raw.split(/\s+/).filter(Boolean);
  if (words.length <= limit) return raw;
  return words.slice(0, limit).join(" ") + " […]";
}

function isKCScene(s: any): boolean {
  const t = String(s?.interactionType || "").toLowerCase();
  return ["mcq", "scenario", "drag & drop", "draganddrop", "drag&drop", "drag-drop", "multi-select", "quiz"].some((k) =>
    t.includes(k)
  );
}

function ensureKCFeedback(scene: any) {
  const notes = String(scene.developerNotes || "");
  if (!/option-level feedback/i.test(notes)) {
    scene.developerNotes = (notes + "\nProvide option-level feedback for each response. Allow retry.").trim();
  }
  if (scene.interactionDetails && !scene.interactionDetails.retryLogic) {
    scene.interactionDetails.retryLogic = "Allow up to 2 retries; reveal correct after second incorrect.";
  }
  if (scene.interactionDetails && !scene.interactionDetails.completionRule) {
    scene.interactionDetails.completionRule = "User must answer all items.";
  }
  if (
    scene.interactionDetails &&
    (!Array.isArray(scene.interactionDetails.xapiEvents) || !scene.interactionDetails.xapiEvents.length)
  ) {
    scene.interactionDetails.xapiEvents = [{ verb: "answered", object: `Screen_${scene.sceneNumber || ""}_MCQ` }];
  }
  if (scene.interactionDetails && scene.interactionType?.toLowerCase() === "mcq" && !scene.interactionDetails.distractorRationale) {
    scene.interactionDetails.distractorRationale = [];
  }
  return scene;
}

function ensureAccessibility(scene: any) {
  const a11y = String(scene.accessibilityNotes || "");
  const isMedia =
    /video|animation/i.test(scene?.visual?.mediaType || "") || /video/i.test(scene?.screenLayout || "");
  const inserts: string[] = [];

  if (isMedia && !/captions on/i.test(a11y)) {
    inserts.push("Captions ON by default for all media.");
  }
  if (!/keyboard path/i.test(a11y)) {
    inserts.push(
      "Keyboard path: Tab to focus; Enter/Space to activate; Shift+Tab to reverse; Esc closes dialogs. Provide visible focus outline."
    );
  }
  if (!/focus order/i.test(a11y)) {
    inserts.push("Focus order: header → content area → primary control(s) → Next/Continue.");
  }
  if (!/WCAG/i.test(a11y)) {
    inserts.push("Confirm WCAG AA contrast for palette and text.");
  }
  if (!/reduced motion/i.test(a11y)) {
    inserts.push("Offer reduced-motion alternative for animations/transitions.");
  }

  if (inserts.length) {
    scene.accessibilityNotes = (a11y + (a11y ? "\n" : "") + inserts.join("\n")).trim();
  }
  return scene;
}

function ensureTOCProgressNote(scene: any) {
  const title = String(scene?.pageTitle || "").toLowerCase();
  if (title.includes("contents") || title.includes("table of contents")) {
    const ost = String(scene.onScreenText || "");
    if (!/progress/i.test(ost)) {
      scene.onScreenText = (ost + (ost ? "\n\n" : "") + "Your progress is saved as you go.").trim();
    }
  }
  return scene;
}

function applyGlobalEnforcements(story: any) {
  if (!Array.isArray(story?.scenes)) return story;

  const brand = story?.metadata?.brand || {};

  story.scenes = story.scenes.map((s: any) => {
    s.onScreenText = clampOnScreenText(s.onScreenText, 70);
    s = ensureVisualBlueprint(s, brand);
    s = ensureAccessibility(s);
    if (isKCScene(s)) s = ensureKCFeedback(s);
    if (s.audio?.script && !s.narrationScript) s.narrationScript = s.audio.script;
    if (typeof s.screenLayout === "object") {
      s.screenLayout = s.screenLayout?.description || "Standard slide layout";
    }
    if (!s.timing) s.timing = { estimatedSeconds: 60 };
    return s;
  });

  // Front matter note (if a TOC page exists there, add progress note) — handled earlier via frontMatter

  const meta = (story.metadata = story.metadata || {});
  const hasCompletion =
    /completion/i.test(String(meta.completionRule || "")) ||
    story.scenes.some((s: any) => /completion/i.test(String(s.developerNotes || ""))) ||
    story.scenes.some((s: any) => /completionRule/i.test(JSON.stringify(s.interactionDetails || {})));
  if (!hasCompletion) {
    meta.completionRule =
      "Completion when all scenes visited, all knowledge checks attempted (with feedback), and capstone branching scenario completed.";
  }

  const per = (story.scenes || []).map((s: any) => Number(s?.timing?.estimatedSeconds || 60));
  const totalSec = per.reduce((a, b) => a + (isNaN(b) ? 0 : b), 0);
  meta.moduleTiming = {
    targetMinutes: Math.max(5, Math.round(totalSec / 60)),
    totalEstimatedMinutes: Math.round(totalSec / 60),
    perSceneSeconds: per,
  };

  return story;
}

/* =========================================================
   Main generation
   ========================================================= */
export const generateStoryboardFromOpenAI = async (
  formData: AugmentedFormData,
  options: GenerateOptions = {}
): Promise<StoryboardModule> => {
  const lvl = levelFrom(formData);

  const duration = clampInt(parseDurationMins(formData.durationMins ?? formData.duration), 1, 90);
  const estimated = estimateTargetScenes(duration, lvl);
  const callerMin = clampInt(Number((formData as any).minScenes ?? 0), 0, 99);
  const targetScenes = Math.max(estimated, callerMin || 0);
  const minInteractive = minInteractiveCountFor(targetScenes);

  const systemPrompt = injectBlueprint(getSystemPrompt());
  const userPromptCore = getAugmentedUserPrompt(
    formData,
    { duration, targetScenes, minInteractive },
    options.ragContext,
    options.ragChunkContext
  );
  const finalUserPrompt = injectBlueprint(userPromptCore);

  const model = resolveOpenAIModel(options.aiModel ?? formData.aiModel);

  maybeWriteDebug(
    `prompt_${Date.now()}.txt`,
    `MODEL: ${model}\n\nSYSTEM:\n${systemPrompt}\n\nUSER:\n${finalUserPrompt}`
  );

  console.log(`✅ Sending augmented prompt to OpenAI with model "${model}"...`);

  try {
    const basePayload: any = {
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: finalUserPrompt },
      ],
      response_format: { type: "json_object" },
    };
    if (modelSupportsTuning(model)) {
      basePayload.temperature = 0.35;
      basePayload.top_p = 0.2;
    }

    let resp;
    try {
      resp = await withTimeout(openai.chat.completions.create(basePayload), OPENAI_TIMEOUT_MS, "OpenAI chat");
    } catch (err: any) {
      const msg = String(err?.message || err);
      const shouldFallback =
        /timed out|model_not_found|not found|invalid model|insufficient_quota|403|404|429/i.test(msg);
      if (shouldFallback && model !== OPENAI_FALLBACK) {
        console.warn(`⚠️ Primary model "${model}" failed ("${msg}"). Falling back to "${OPENAI_FALLBACK}"…`);
        resp = await withTimeout(
          openai.chat.completions.create({ ...basePayload, model: OPENAI_FALLBACK }),
          OPENAI_TIMEOUT_MS,
          "OpenAI chat (fallback)"
        );
      } else {
        throw err;
      }
    }

    const jsonString = resp.choices?.[0]?.message?.content || "";
    console.log("✅ Raw AI Response received.");
    const parsedRaw = safeParseJson(jsonString);

    let storyboard: StoryboardModule & {
      frontMatter?: any[];
      tableOfContents?: string[];
      metadata?: any;
      moduleOverview?: string;
      targetAudience?: string;
      learningLevel?: string;
      idMethod?: string;
    } = {
      moduleName: parsedRaw?.moduleName || tidyModuleName(formData.moduleName) || "Untitled Module",
      moduleOverview: parsedRaw?.moduleOverview || "",
      learningLevel: parsedRaw?.learningLevel || lvl,
      targetAudience: parsedRaw?.targetAudience || formData.targetAudience || "",
      idMethod: parsedRaw?.idMethod || String(formData.idMethod || formData.preferredMethodology || "ADDIE").toUpperCase(),
      revisionHistory: parsedRaw?.revisionHistory ?? [
        { dateISO: new Date().toISOString().slice(0, 10), change: "Initial AI draft", author: "OpenAI" },
      ],
      frontMatter: Array.isArray(parsedRaw?.frontMatter) ? parsedRaw.frontMatter : mkFrontMatter(formData.organisationName),
      pronunciationGuide: parsedRaw?.pronunciationGuide ?? [],
      tableOfContents: parsedRaw?.tableOfContents ?? [],
      learningObjectiveMap: parsedRaw?.learningObjectiveMap ?? [],
      evaluationPlan: parsedRaw?.evaluationPlan ?? undefined,
      scenes: Array.isArray(parsedRaw?.scenes) ? parsedRaw.scenes : [],
      metadata: parsedRaw?.metadata ?? {},
    } as any;

    // Front matter & welcome
    storyboard = ensureFrontMatterAndWelcome(storyboard, formData);
    storyboard = ensureTOCAndOutcomes(storyboard);
    storyboard = ensureCapstoneAndClosing(storyboard);
    storyboard = ensureInstructionalTags(storyboard, storyboard.idMethod || "ADDIE");

    // Density / interactivity distribution
    const levelKeyGen = String(formData.complexityLevel || formData.level || "Level 3").replace(/\s+/g, "");
    const profileForDensity = normaliseProfile(
      pickProfile(formData.complexityLevel || formData.level || "Level 3"),
      (formData.complexityLevel || formData.level || "Level 3")
    );
    const levelRatio =
      /Level4/i.test(levelKeyGen) ? 0.65 : /Level3/i.test(levelKeyGen) ? 0.5 : /Level2/i.test(levelKeyGen) ? 0.35 : 0.2;

    storyboard.scenes = enforceInteractiveDensity(
      storyboard.scenes as any[],
      (profileForDensity.level as any) || (levelKeyGen as any),
      levelRatio,
      profileForDensity.maxSameTypeInRow || 2,
      profileForDensity.preferredInteractionTypes
    );

    const haveInteractive = countInteractiveScenes(storyboard);
    if (haveInteractive < minInteractive) {
      storyboard.scenes = injectInteractions(storyboard.scenes as any[], minInteractive - haveInteractive);
    }
    storyboard.scenes = enforceKCCadence(storyboard.scenes as any[]);

    const needsExpansion =
      (storyboard.scenes?.length || 0) < targetScenes ||
      (storyboard.tableOfContents?.length || 0) === 0 ||
      countInteractiveScenes(storyboard) < minInteractive;

    if (!needsExpansion) {
      if ((storyboard.scenes?.length || 0) < targetScenes) {
        storyboard.scenes = autoPadToTarget(storyboard.scenes as any[], targetScenes, storyboard.moduleName);
      }
      storyboard.scenes = enforceKCCadence(storyboard.scenes as any[]);
      storyboard = ensureCapstoneAndClosing(storyboard);
      storyboard = applyGlobalEnforcements(storyboard);

      // 💾 Save to Supabase on non-expansion path
      await saveStoryboardToSupabase(storyboard, {
        source: formData.__source || "text",
        aiModel: options?.aiModel ?? formData?.aiModel ?? null,
        org: formData?.organisationName ?? null,
      });

      console.log(
        `[RETURN] ${storyboard.moduleName} — scenes=${storyboard.scenes.length}, interactive=${countInteractiveScenes(
          storyboard
        )}, target=${targetScenes}`
      );
      return storyboard as StoryboardModule;
    }

    // Expansion pass
    const expandPrompt = getExpansionPrompt(storyboard as StoryboardModule, {
      duration,
      targetScenes,
      minInteractive,
    });
    const expandPayload: any = {
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: expandPrompt },
      ],
      response_format: { type: "json_object" },
    };
    if (modelSupportsTuning(model)) {
      expandPayload.temperature = 0.35;
      expandPayload.top_p = 0.2;
    }

    let resp2;
    try {
      resp2 = await withTimeout(openai.chat.completions.create(expandPayload), OPENAI_TIMEOUT_MS, "OpenAI expand");
    } catch (err2: any) {
      console.warn("⚠️ Expansion pass failed, returning first draft. Reason:", err2?.message || err2);

      if ((storyboard.scenes?.length || 0) < targetScenes) {
        storyboard.scenes = autoPadToTarget(storyboard.scenes as any[], targetScenes, storyboard.moduleName);
      }
      storyboard.scenes = enforceKCCadence(storyboard.scenes as any[]);

      storyboard = applyGlobalEnforcements(storyboard);

      // 💾 Save to Supabase even when expansion fails
      await saveStoryboardToSupabase(storyboard, {
        source: formData.__source || "text",
        aiModel: options?.aiModel ?? formData?.aiModel ?? null,
        org: formData?.organisationName ?? null,
      });

      console.log(
        `[RETURN] ${storyboard.moduleName} — scenes=${storyboard.scenes.length}, interactive=${countInteractiveScenes(
          storyboard
        )}, target=${targetScenes}`
      );
      return storyboard as StoryboardModule;
    }

    const json2 = resp2.choices?.[0]?.message?.content || "";
    const parsed2 = safeParseJson(json2);

    let storyboard2: StoryboardModule & {
      frontMatter?: any[];
      tableOfContents?: string[];
      metadata?: any;
      moduleOverview?: string;
      targetAudience?: string;
      learningLevel?: string;
      idMethod?: string;
    } = {
      moduleName: parsed2?.moduleName || storyboard.moduleName,
      moduleOverview: parsed2?.moduleOverview || storyboard.moduleOverview,
      learningLevel: parsed2?.learningLevel || storyboard.learningLevel,
      targetAudience: parsed2?.targetAudience || storyboard.targetAudience,
      idMethod: parsed2?.idMethod || storyboard.idMethod,
      revisionHistory: parsed2?.revisionHistory ?? storyboard.revisionHistory ?? [],
      frontMatter: Array.isArray(parsed2?.frontMatter) ? parsed2.frontMatter : storyboard.frontMatter,
      pronunciationGuide: parsed2?.pronunciationGuide ?? storyboard.pronunciationGuide ?? [],
      tableOfContents: parsed2?.tableOfContents ?? storyboard.tableOfContents ?? [],
      learningObjectiveMap: parsed2?.learningObjectiveMap ?? (storyboard as any).learningObjectiveMap ?? [],
      evaluationPlan: parsed2?.evaluationPlan ?? (storyboard as any).evaluationPlan ?? undefined,
      scenes: Array.isArray(parsed2?.scenes) ? parsed2.scenes : storyboard.scenes,
      metadata: parsed2?.metadata ?? storyboard.metadata ?? {},
    } as any;

    storyboard2 = ensureFrontMatterAndWelcome(storyboard2, formData);
    storyboard2 = ensureTOCAndOutcomes(storyboard2);
    storyboard2 = ensureCapstoneAndClosing(storyboard2);
    storyboard2 = ensureInstructionalTags(storyboard2, storyboard2.idMethod || "ADDIE");

    const profileForDensity2 = normaliseProfile(
      pickProfile(formData.complexityLevel || formData.level || "Level 3"),
      (formData.complexityLevel || formData.level || "Level 3")
    );
    const levelKeyExpand = String(formData.complexityLevel || formData.level || "Level 3").replace(/\s+/g, "");
    const levelRatio2 =
      /Level4/i.test(levelKeyExpand) ? 0.65 : /Level3/i.test(levelKeyExpand) ? 0.5 : /Level2/i.test(levelKeyExpand) ? 0.35 : 0.2;

    storyboard2.scenes = enforceInteractiveDensity(
      storyboard2.scenes as any[],
      (profileForDensity2.level as any) || (levelKeyExpand as any),
      levelRatio2,
      profileForDensity2.maxSameTypeInRow || 2,
      profileForDensity2.preferredInteractionTypes
    );

    const haveInteractive2 = countInteractiveScenes(storyboard2);
    if (haveInteractive2 < minInteractive) {
      storyboard2.scenes = injectInteractions(storyboard2.scenes as any[], minInteractive - haveInteractive2);
    }
    storyboard2.scenes = enforceKCCadence(storyboard2.scenes as any[]);

    if ((storyboard2.scenes?.length || 0) < targetScenes) {
      storyboard2.scenes = autoPadToTarget(storyboard2.scenes as any[], targetScenes, storyboard2.moduleName);
    }
    storyboard2.scenes = enforceKCCadence(storyboard2.scenes as any[]);
    storyboard2 = ensureCapstoneAndClosing(storyboard2);
    storyboard2 = applyGlobalEnforcements(storyboard2);

    // 💾 Save to Supabase after successful expansion
    await saveStoryboardToSupabase(storyboard2, {
      source: formData.__source || "text",
      aiModel: options?.aiModel ?? formData?.aiModel ?? null,
      org: formData?.organisationName ?? null,
    });

    console.log(
      `[RETURN] ${storyboard2.moduleName} — scenes=${storyboard2.scenes.length}, interactive=${countInteractiveScenes(
        storyboard2
      )}, target=${targetScenes}`
    );
    return storyboard2 as StoryboardModule;
  } catch (error: any) {
    console.error("💥 OpenAI Service Error:", error?.response?.data || error);
    throw new Error(error?.message || "Failed to generate storyboard from OpenAI.");
  }
};

export default {
  generateStoryboardFromOpenAI,
  getAugmentedUserPrompt,
  getSystemPrompt,
  resolveOpenAIModel,
};

/* =========================================================
   Helper: level/targets + describe interaction
   ========================================================= */
function clampInt(n: number, lo: number, hi: number) {
  n = Math.round(n);
  return Math.max(lo, Math.min(hi, n));
}
function levelFrom(formData: AugmentedFormData): "Level 1" | "Level 2" | "Level 3" | "Level 4" {
  const raw = String(formData.complexityLevel || formData.level || "Level 3").replace(/level\s*/i, "");
  if (/^4/.test(raw)) return "Level 4";
  if (/^3/.test(raw)) return "Level 3";
  if (/^2/.test(raw)) return "Level 2";
  return "Level 1";
}
function estimateTargetScenes(durationMins: number, lvl: string) {
  if (lvl === "Level 4") return clampInt(Math.round(durationMins * 1.2), 20, 34);
  if (lvl === "Level 3") return clampInt(Math.round(durationMins * 1.0), 18, 34);
  if (lvl === "Level 2") return clampInt(Math.round(durationMins * 0.8), 12, 22);
  return clampInt(Math.round(durationMins * 0.6), 8, 16);
}
function safeSlice(s: string, max: number) {
  if (!s) return "";
  if (s.length <= max) return s;
  return s.slice(0, max) + "\n\n[…truncated…]";
}
function modelSupportsTuning(model: string): boolean {
  return !/gpt-5/i.test(model); // safeguard
}
async function withTimeout<T>(p: Promise<T>, ms: number, tag = "OpenAI"): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error(`${tag} timed out after ${ms}ms`)), ms)),
  ]);
}
function normaliseLO(lo?: string | string[]): string[] {
  if (!lo) return [];
  if (Array.isArray(lo)) return lo.filter(Boolean);
  return String(lo)
    .split(/\n|;|\.|\||,/)
    .map((s) => s.trim())
    .filter(Boolean);
}
function describeInteraction(t: string, topic: string) {
  switch (t) {
    case "MCQ":
      return `2–3 question knowledge check on: ${topic}. Immediate feedback per option.`;
    case "Scenario":
      return `Branching decision with 2–3 paths for: ${topic}. Show consequences and debrief.`;
    case "Clickable Hotspots":
      return `Reveal hotspots to explain key elements of: ${topic}.`;
    case "Drag & Drop":
      return `Sort/match items related to: ${topic}. Allow partial credit + retry.`;
    case "Reflection":
      return `Prompt the learner to write a brief reflection on: ${topic}.`;
    default:
      return `Interactive element aligned to: ${topic}.`;
  }
}