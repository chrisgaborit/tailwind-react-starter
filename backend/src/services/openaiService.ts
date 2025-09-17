// ✅ System & FS
import fs from "fs";
import path from "path";

// ✅ OpenAI + Supabase
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

// ✅ Interactivity and Blueprint Logic
import { enforceInteractiveDensity } from "../library/interactivityLibrary";
import { pickProfile } from "../library/interactivityProfiles";
import {
  injectBlueprint,
  ensureFirstFour,
  ensureTOCAndMetadata,
  ensureCapstoneAndClosing,
} from "../library/blueprintPrompt";
import { compileInteractivityPrompt } from "../library/interactivityEngine";

// ✅ Prompt Fragments and Utilities
import * as promptFragments from "../library/promptFragments";
import { saveStoryboardToSupabase } from "../library/supabaseSaver";

// ✅ NEW: RAG Interactivity Retrieval
import { fetchMatchingInteractivities } from "../library/ragInteractivity";

// ✅ NEW: Level-aware Interaction Rules
import { getInteractiveSettings } from "../library/interactionRules";
import { getInteractiveSettings } from "../library/interactionRules";

import { StoryboardModule } from "../types";

// ✅ Editor Prompt Generator
function getEditorPrompt(storyboard: StoryboardModule, formData: any): string {
  const moduleName = storyboard.moduleName || "Untitled Module";
  const tone = formData?.tone || "Professional and friendly";

  return `
<< ROLE: SENIOR STORYBOARD EDITOR >>
You are a Senior eLearning Storyboard Editor working on a draft module titled "${moduleName}".

Your task is to REVIEW and REFINE the draft storyboard with the following goals:

✅ Improve clarity, consistency, and quality of narration and on-screen text  
✅ Enforce correct tone: "${tone}"  
✅ Tighten and improve voiceover language to be natural, learner-friendly, and ~140 WPM  
✅ Align scenes with best-practice instructional design: clear hooks, logical progression, varied interactions, and clear visuals  
✅ Ensure each Knowledge Check is well-written, plausible, and includes specific feedback per option  
✅ Preserve metadata and structural integrity of all scenes

Edits should reflect expert-level instructional writing. You do not need to change scene structure unless necessary, but you may:
- Reword awkward narration
- Suggest visual improvements
- Fix broken Knowledge Checks or bland feedback
- Adjust pacing, examples, or scene titles for clarity

Return the ENTIRE storyboard as a valid JSON object with the updated scenes.
`;
}

// ─── Environment Config ─────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_DEFAULT = (process.env.OPENAI_MODEL || "gpt-4o").trim();
const OPENAI_FALLBACK = (process.env.OPENAI_FALLBACK_MODEL || "gpt-4o").trim();
const OPENAI_TIMEOUT_MS = Number(process.env.OPENAI_TIMEOUT_MS || 120000);
const ALLOWED_MODELS = (process.env.OPENAI_ALLOWED_MODELS || "gpt-5,gpt-4o,gpt-4-turbo")
  .split(",").map((s) => s.trim()).filter(Boolean);

// ─── Initialise Supabase ────────────────────────────────────────────────────────
let supabase = null;
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  console.log("✅ Supabase client initialised for storyboards.");
} else {
  console.warn("⚠️ Supabase env not configured — storyboards will NOT be saved.");
}

// ─── Initialise OpenAI ──────────────────────────────────────────────────────────
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
console.log("🔧 Using OpenAI default model from env:", OPENAI_DEFAULT);
console.log("🔒 Allowed models:", ALLOWED_MODELS.join(", "));

// ────────────────────────────────────────────────────────────────────────────────
// ─── Helper Functions ───────────────────────────────────────────────────────────
// ────────────────────────────────────────────────────────────────────────────────

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

function parseDurationMins(input: any): number {
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

const DEBUG_DIR = process.env.DEBUG_PROMPTS_DIR || "";
function maybeWriteDebug(name: string, content: string) {
  if (!DEBUG_DIR) return;
  try {
    if (!fs.existsSync(DEBUG_DIR)) fs.mkdirSync(DEBUG_DIR, { recursive: true });
    fs.writeFileSync(path.join(DEBUG_DIR, name), content, "utf8");
  } catch (e) {
    console.warn(`Could not write debug file: ${name}`, e);
  }
}

function clampInt(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

// ✅ FIX: Re-added the missing helper function that caused the crash.
function modelSupportsTuning(model: string): boolean {
  // Models like the upcoming GPT-5 might not support tuning parameters like temperature.
  // This function prevents sending those parameters for specific models.
  return !/gpt-5/i.test(model);
}

function estimateTargetScenes(durationMins: number, lvl: string): number {
  if (lvl === "Level 4") return clampInt(Math.round(durationMins * 1.2), 20, 34);
  if (lvl === "Level 3") return clampInt(Math.round(durationMins * 1.0), 18, 34);
  if (lvl === "Level 2") return clampInt(Math.round(durationMins * 0.8), 12, 22);
  return clampInt(Math.round(durationMins * 0.6), 8, 16);
}

async function withTimeout<T>(p: Promise<T>, ms: number, tag = "Operation"): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) =>
      setTimeout(() => rej(new Error(`${tag} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

function extractJson(text?: string): string {
  if (typeof text !== "string") return "";
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first >= 0 && last > first) return text.slice(first, last + 1);
  return text.trim();
}

function safeParseJson(maybe?: string): any {
  const raw = extractJson(maybe);
  try {
    return JSON.parse(raw);
  } catch (e) {
    const repaired = raw.replace(/,\s*([}\]])/g, "$1");
    try {
      return JSON.parse(repaired);
    } catch (e2) {
      throw new Error("Failed to parse JSON from model output.");
    }
  }
}

function levelFrom(formData: any): string {
  const raw = String(formData.complexityLevel || formData.level || "Level 3").replace(/level\s*/i, "");
  if (/^4/.test(raw)) return "Level 4";
  if (/^3/.test(raw)) return "Level 3";
  if (/^2/.test(raw)) return "Level 2";
  return "Level 1";
}

// ─── Internal-Only Scene Generation ─────────────────────────────────────────────
function addInternalOnlyScenes(storyboard: any, formData: any): any {
  const createInternalScene = (title: string, notes: string) => ({
    sceneName: title,
    onScreenText: "",
    narration: "",
    visuals: {
      scene: "INTERNAL USE ONLY. NO VISUALS REQUIRED.",
      description: "This is a non-visual slide for internal team reference.",
    },
    interactionType: "None",
    interactionDetails: {},
    developerNotes: notes,
  });

  const pronunciationTerms = formData.pronunciations || 
    "No pronunciation terms provided. Add a 'pronunciations' field to your form data.\n\nExample:\n- GTM: Go-To-Market\n- Supabase: SOO-pah-bays\n- Learno: LER-no";
  
  const pronunciationScene = createInternalScene(
    "INTERNAL TEAM ONLY: Pronunciation Guide",
    `This guide is for the voiceover artist and production team.\n\n${pronunciationTerms}`
  );

  const tocList = (storyboard.scenes || [])
    .map((scene: any, index: number) => `Scene ${index + 3}: ${scene.sceneName || 'Untitled Scene'}`)
    .join('\n');

  const tocScene = createInternalScene(
    "INTERNAL TEAM ONLY: Table of Contents",
    `This storyboard was auto-generated and edited. The following is the scene list for production reference.\n\n${tocList}`
  );
  
  storyboard.scenes.unshift(pronunciationScene);
  storyboard.scenes.unshift(tocScene);
  
  return storyboard;
}

// ─── Prompt Generators ───────────────────────────────────────
export function getSystemPrompt(): string {
  return `You are a fast and efficient Instructional Design Drafter.
Your goal is to generate a complete storyboard based on the user's content and instructions.

CRITICAL REQUIREMENTS:
1. **JSON FORMATTING:** Your output must be a single, valid JSON object.
2. **COMPLETENESS:** You MUST generate the full number of requested scenes.
3. **STRUCTURE:** Your storyboard must follow the 8-Point Learning Design Framework:
   - [INTERNAL] Table of Contents slide (for developers only)
   - [INTERNAL] Pronunciation Guide slide (for VO artists)
   - Title slide (includes module title only)
   - Hook slide (why this matters to the learner)
   - Learning Outcomes slide (what they will learn)
   - Recap / Summary slide (at the end)
   - Capstone Knowledge Check or Scenario (critical thinking-based)
   - Final Call-To-Action or Action Plan

4. **SCENE INTEGRITY:** Fill in all fields per scene (narration, OST, visuals, interactivity) unless marked [INTERNAL].
5. **INTERACTIVITY:** Include rich, instructionally sound interactivity throughout — aligned to the topic.
6. **FOCUS:** Prioritise accuracy, structure, and instructional intent. Don’t over-polish — a senior editor will refine the language later.

Generate the entire storyboard in one single response.`;
}

export function getAugmentedUserPrompt(formData: any, opts: any, ragContext: any, ragChunkContext: any): string {
  return `Please generate a storyboard for the following module:
- Title: ${formData.moduleName}
- Audience: ${formData.audience}
- Target Duration: ${opts.duration} minutes.
- Complexity: ${levelFrom(formData)}
Based on this source content:
${ragContext}`;
}

// ────────────────────────────────────────────────────────────────────────────────
// ─── Main Generation Function ────────────────────────────────────────────────────
// ────────────────────────────────────────────────────────────────────────────────
export const generateStoryboardFromOpenAI = async (formData: any, options: any = {}) => {
  const model = resolveOpenAIModel(options.aiModel ?? formData.aiModel);
  const lvl = levelFrom(formData);
  const duration = clampInt(parseDurationMins(formData.durationMins ?? formData.duration), 1, 90);
  const targetScenes = estimateTargetScenes(duration, lvl);
  const agentTimeout = Number(process.env.OPENAI_AGENT_TIMEOUT_MS || 300000);

  try {
    // AGENT 1: THE DRAFTER
    console.log(`[AGENT 1/2] Calling Drafter Agent with model ${model}...`);
    const baseSystemPrompt = getSystemPrompt();
   const systemPromptDrafter =
  injectBlueprint(baseSystemPrompt) +
  promptFragments.openingSlideRule +
  promptFragments.whyThisMattersSlideRule +
  promptFragments.learningOutcomesSlideRule;
    let rPrompt: string = "";
    try {
      rPrompt = await fetchMatchingInteractivities(formData.moduleType || "", 6);
      if (!rPrompt || rPrompt.length < 10) {
        console.warn("⚠️ RAG interactivity result was empty. Using fallback prompt.");
        rPrompt = promptFragments.defaultInteractivityPrompt;
      } else {
        console.log("✅ Injected RAG-based interactivity prompt.");
      }
    } catch (err: any) {
      console.error("RAG Interactivity fetch error:", err);
      rPrompt = promptFragments.defaultInteractivityPrompt;
    }

    const enrichedSystemPrompt = `${systemPromptDrafter}\n\n---\n📚 Suggested Interactivity Types for this Module:\n${rPrompt}`;
    const userPromptCore = getAugmentedUserPrompt(formData, { duration, targetScenes }, options.ragContext, options.ragChunkContext);
    const userPromptFull = `${userPromptCore}\n\n${rPrompt}`;

    const drafterPayload: any = {
      model,
      messages: [
        { role: "system", content: enrichedSystemPrompt },
        { role: "user", content: userPromptFull },
      ],
      response_format: { type: "json_object" },
    };

    if (modelSupportsTuning(model)) {
      drafterPayload.temperature = 0.5;
    }

    const draftResp = await withTimeout(
      openai.chat.completions.create(drafterPayload),
      agentTimeout,
      "OpenAI Drafter Agent"
    );

    let draftStoryboard = safeParseJson(draftResp.choices?.[0]?.message?.content || "{}");
    console.log(`[AGENT 1/2] Drafter Agent finished. Generated ${draftStoryboard.scenes?.length || 0} scenes.`);
    draftStoryboard.scenes = Array.isArray(draftStoryboard.scenes) ? draftStoryboard.scenes : [];

    // Prepend internal-only scenes
    

    // Structural fixes
// 🛠️ Structural + Instructional Integrity Enforcement
draftStoryboard = ensureTOCAndMetadata(draftStoryboard, formData);
draftStoryboard = ensureCapstoneAndClosing(draftStoryboard, {
  minKnowledgeChecks: Math.max(1, Math.floor(targetScenes / 5)), // Ensure sufficient KCs
  requireActionPlan: true, // CTA enforcement
});

// 📌 NEW: Level-aware interactivity enforcement
const { interactiveRatio, maxSameTypeInRow, preferredTypes } = getInteractiveSettings(formData?.level || "Level 2");

draftStoryboard.scenes = enforceInteractiveDensity(
  draftStoryboard.scenes || [],
  formData?.level || "Level 2",
  interactiveRatio,
  maxSameTypeInRow,
  preferredTypes
);

    // AGENT 2: THE SENIOR EDITOR (with graceful timeout fallback)
console.log(`[AGENT 2/2] Calling Senior Editor Agent to refine the draft...`);

let finalStoryboard: StoryboardModule;

try {
  const systemPromptEditor = getEditorPrompt(draftStoryboard, formData);
  const editorPayload: any = {
    model,
    messages: [
      { role: "system", content: systemPromptEditor },
      { role: "user", content: JSON.stringify(draftStoryboard, null, 2) },
    ],
    response_format: { type: "json_object" },
    ...(modelSupportsTuning(model) ? { temperature: 0.2 } : {}),
  };

  const editorResp = await withTimeout(
    openai.chat.completions.create(editorPayload),
    agentTimeout,
    "OpenAI Editor Agent"
  );

  finalStoryboard = safeParseJson(editorResp.choices?.[0]?.message?.content || "{}");
  console.log(`[AGENT 2/2] Senior Editor Agent finished. Scenes: ${finalStoryboard.scenes?.length}`);
} catch (err) {
  console.warn("⚠️ Agent 2 failed or timed out. Falling back to Agent 1 draft.");
  console.warn(err instanceof Error ? err.message : err);
  finalStoryboard = draftStoryboard;
}
    // Final Save + Return
    if (supabase) {
      await saveStoryboardToSupabase(finalStoryboard, {
        source: formData.__source || "text",
        aiModel: `${model}-edited`,
        org: formData?.organisationName ?? null,
      });
    }

    console.log(`[RETURN] Final storyboard: ${finalStoryboard.moduleName} — scenes=${finalStoryboard.scenes?.length}`);
    return finalStoryboard;

  } catch (error: any) {
    const errorMessage = error.response?.data?.error?.message || error.message || "Failed to generate storyboard.";
    console.error("💥 AI Pipeline Error:", errorMessage, error.stack);
    throw new Error(errorMessage);
  }
};