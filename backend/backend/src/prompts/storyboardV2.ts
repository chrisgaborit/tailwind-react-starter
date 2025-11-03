// backend/src/prompts/storyboardV2.ts
import type { Request } from "express";

/**
 * Builds the system + user prompts and a strict response schema for AI-driven storyboard generation.
 * Produces the V2 JSON structure (see types) with:
 *  - granular layout/visuals
 *  - detailed VO (tone, pacing, persona)
 *  - interactivity logic (branching, scoring, completion rules)
 *  - xAPI tracking hints
 *  - accessibility notes
 *  - media prompts ready for image/video generation
 */

export interface BuildPromptArgs {
  formData: Record<string, any>;
  options?: {
    aiModel?: string;
    idMethod?: string;
    ragContext?: string;
    durationMins?: number; // 5–90 (already normalized by middleware)
  };
}

export const DEFAULT_SCENE_TARGET_BY_LEVEL: Record<string, { min: number; max: number }> = {
  "Level 1": { min: 8,  max: 12 },
  "Level 2": { min: 12, max: 18 },
  "Level 3": { min: 18, max: 26 },
  "Level 4": { min: 20, max: 34 },
};

function sceneTarget(level?: string, durationMins?: number) {
  // Duration nudges count slightly; we keep it simple + deterministic.
  const band = DEFAULT_SCENE_TARGET_BY_LEVEL[level || "Level 2"] || DEFAULT_SCENE_TARGET_BY_LEVEL["Level 2"];
  const d = typeof durationMins === "number" ? durationMins : 20;
  const bias = d >= 30 ? 2 : d <= 12 ? -2 : 0;
  return {
    min: Math.max(6, band.min + bias),
    max: band.max + bias,
  };
}

export function buildStoryboardSystemPrompt() {
  return [
    "You are a senior Learning Experience Designer producing professional eLearning storyboards.",
    "Output MUST be valid JSON matching the provided schema. Do NOT include markdown fences or commentary.",
    "Optimise for AI production: extreme specificity, semantic labels, exact copy, interactivity logic, xAPI hints, accessibility, timing, style, media prompts.",
  ].join(" ");
}

export function buildStoryboardUserPrompt(args: BuildPromptArgs) {
  const { formData, options } = args;
  const {
    moduleName,
    moduleType,
    complexityLevel,
    tone,
    outputLanguage,
    organisationName,
    targetAudience,
    fonts,
    colours,
    logoUrl,
    learningOutcomes,
    content,
    brandGuidelines,
  } = formData;

  const idMethod = options?.idMethod || "ADDIE (Analyze–Design–Develop–Implement–Evaluate)";
  const duration = options?.durationMins ?? 20;
  const rag = options?.ragContext?.trim();
  const scenes = sceneTarget(String(complexityLevel || "Level 2"), duration);

  const brand = {
    name: organisationName || "Client",
    colours: (colours || "").split(",").map((s: string) => s.trim()).filter(Boolean),
    fonts: (fonts || "").split(",").map((s: string) => s.trim()).filter(Boolean),
    logoUrl: logoUrl || undefined,
    tone: tone || "Professional & Clear",
  };

  const LO = (learningOutcomes || "").split("\n").map((s: string) => s.trim()).filter(Boolean);

  return {
    instruction: [
      "Create a complete storyboard module using the V2 schema.",
      "Follow the chosen instructional design process:",
      `• ID Method: ${idMethod}`,
      "Respect the requested complexity level; include realistic interactivities and knowledge checks.",
      "VOICEOVER must be full, natural, and paced for narration—not bullet summaries.",
      "For interactivities: provide user flows, scoring, completion logic, and xAPI logging hints.",
      "For visuals: provide media prompts + visual composition + alt text.",
      "Accessibility: include captioning, focus order, and contrast notes.",
      "Timing: add estimatedTimeSec per scene; total should align with requested duration.",
      "Style: align with brand colours/fonts; call out CTAs and highlighted elements.",
    ].join("\n"),
    metadata: {
      moduleName,
      moduleType,
      level: complexityLevel,
      tone,
      language: outputLanguage || "English (UK)",
      targetAudience,
      durationMins: duration,
      brand,
      sceneTarget: scenes,
    },
    inputs: {
      learningOutcomes: LO,
      sourceContent: content || "",
      brandGuidelines: brandGuidelines || "",
      ragContext: rag || null,
    },
  };
}

export function jsonResponseSchema() {
  // A concise, strict schema the model should follow (not JSONSchema—just structural guidance).
  return {
    type: "object",
    required: ["storyboardModule"],
    properties: {
      storyboardModule: {
        type: "object",
        required: ["meta", "scenes"],
        properties: {
          meta: {
            type: "object",
            required: ["moduleName", "moduleType", "targetAudience", "learningOutcomes", "level", "tone", "language", "brand"],
            properties: {
              moduleName: { type: "string" },
              moduleType: { type: "string" },
              targetAudience: { type: "string" },
              learningOutcomes: { type: "array", items: { type: "string" } },
              level: { type: "string" },
              tone: { type: "string" },
              language: { type: "string" },
              brand: {
                type: "object",
                required: ["name", "colours", "fonts"],
                properties: {
                  name: { type: "string" },
                  colours: { type: "array", items: { type: "string" } },
                  fonts: { type: "array", items: { type: "string" } },
                  logoUrl: { type: "string" },
                  voiceoverAccent: { type: "string" },
                  tone: { type: "string" },
                },
              },
            },
          },
          scenes: {
            type: "array",
            items: {
              type: "object",
              required: ["sceneNumber", "title", "onScreenText", "voiceover", "visuals"],
              properties: {
                sceneNumber: { type: "number" },
                title: { type: "string" },
                objectivesCovered: { type: "string" },
                onScreenText: { type: "string" },
                voiceover: { type: "string" },
                visuals: { type: "string" },
                mediaPrompts: {
                  type: "array",
                  items: {
                    type: "object",
                    required: ["kind", "prompt"],
                    properties: {
                      kind: { type: "string", enum: ["image", "video", "animation"] },
                      prompt: { type: "string" },
                      altText: { type: "string" },
                      durationSec: { type: "number" },
                    },
                  },
                },
                interactivity: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    type: { type: "string" },
                    level: { type: "string" },
                    purpose: { type: "string" },
                    layout: { type: "string" },
                    userFlow: { type: "string" },
                    scoring: { type: "string" },
                  },
                },
                accessibilityNotes: { type: "string" },
                developerNotes: { type: "string" },
                estimatedTimeSec: { type: "number" },
                assessmentLogic: { type: "string" },
                assets: { type: "array", items: { type: "string" } },
              },
            },
          },
          totalDurationMin: { type: "number" },
          notesForClient: { type: "string" },
        },
      },
    },
  };
}

export function buildFinalPrompt(args: BuildPromptArgs) {
  const system = buildStoryboardSystemPrompt();
  const user = buildStoryboardUserPrompt(args);
  const schema = jsonResponseSchema();

  // One merged “user content” object to reduce model confusion
  const userContent = {
    role: "user",
    content: [
      { type: "text", text: "Generate a V2 storyboard JSON following this schema:" },
      { type: "text", text: JSON.stringify(schema) },
      { type: "text", text: "Here are the inputs and constraints:" },
      { type: "text", text: JSON.stringify(user) },
      { type: "text", text: "Return ONLY JSON. No markdown fences, no commentary." },
    ],
  } as const;

  return { system, user: userContent };
}