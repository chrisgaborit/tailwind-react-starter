// frontend/src/validation/storyboardSchema.ts
import { z } from "zod";
import type { StoryboardModule } from "@/types";

const OverlayElementSchema = z.object({
  elementType: z.string(),
  content: z.string().optional(),
  placement: z.string().optional(),
  style: z.record(z.any()).optional(),
  aiGenerationDirective: z.string().optional(),
}).passthrough();

const ScreenLayoutSchema = z.union([
  z.string(),
  z.object({
    description: z.string(),
    elements: z.array(OverlayElementSchema),
  }),
]);

const AudioSchema = z.object({
  script: z.string().default(""),
  voiceParameters: z.object({
    persona: z.string().default("Warm, professional, encouraging"),
    gender: z.string().optional(),
    pace: z.string().default("Moderate (110–130 WPM)"),
    tone: z.string().default("Clear"),
    emphasis: z.string().optional(),
  }),
  backgroundMusic: z.string().optional(),
  aiGenerationDirective: z.string().optional(),
}).strict();

const VisualBriefSchema = z.object({
  sceneDescription: z.string(),
  style: z.string(),
  subject: z.record(z.any()).optional(),
  setting: z.string().optional(),
  composition: z.string().optional(),
  lighting: z.string().optional(),
  colorPalette: z.array(z.string()).optional(),
  mood: z.string().optional(),
  brandIntegration: z.string().optional(),
  negativeSpace: z.string().optional(),
});

const VisualSchema = z.object({
  mediaType: z.string(),
  style: z.string(),
  visualGenerationBrief: VisualBriefSchema,
  aiPrompt: z.string().optional(),
  altText: z.string(),
  aspectRatio: z.string(),
  composition: z.string().optional(),
  environment: z.string().optional(),
  assetId: z.string().optional(),
});

const InteractionSchema = z.object({
  interactionType: z.string(),
  aiActions: z.array(z.string()).optional(),
  aiDecisionLogic: z.array(z.object({
    choice: z.string(),
    feedback: z.object({
      text: z.string(),
      tone: z.string().optional(),
      visualCue: z.string().optional(),
    }).optional(),
    xapi: z.object({
      verb: z.string(),
      object: z.string(),
      result: z.record(z.any()).optional(),
    }).optional(),
    navigateTo: z.string().optional(),
  })).optional(),
  retryLogic: z.string().optional(),
  completionRule: z.string().optional(),
  data: z.any().optional(),
  xapiEvents: z.array(z.object({
    verb: z.string(),
    object: z.string(),
    result: z.record(z.any()).optional(),
  })).optional(),
  aiGenerationDirective: z.string().optional(),
});

const SceneSchema = z.object({
  sceneNumber: z.number(),
  pageTitle: z.string(),
  screenLayout: ScreenLayoutSchema,
  templateId: z.string().optional(),
  screenId: z.string().optional(),
  audio: AudioSchema,
  narrationScript: z.string().default(""),
  onScreenText: z.string().default(""),
  visual: VisualSchema,
  interactionDetails: InteractionSchema.optional(),
  interactionType: z.string().default("None"),
  interactionDescription: z.string().optional(),
  developerNotes: z.string().optional(),
  accessibilityNotes: z.string().optional(),
  timing: z.object({ estimatedSeconds: z.number().default(60) }),
  events: z.array(z.any()).optional(),
  generatedImageUrl: z.string().optional(),
  knowledgeCheck: z.any().optional(),
  knowledgeChecks: z.array(z.any()).optional(),
});

export const StoryboardSchema = z.object({
  moduleName: z.string(),
  revisionHistory: z.array(z.object({
    dateISO: z.string(),
    change: z.string(),
    author: z.string(),
  })).optional(),
  pronunciationGuide: z.array(z.object({
    term: z.string(),
    pronunciation: z.string(),
    note: z.string().optional(),
  })).optional(),
  tableOfContents: z.any().optional(),
  scenes: z.array(SceneSchema),
  pages: z.array(SceneSchema).optional(),
  metadata: z.record(z.any()).optional(),
  moduleOverview: z.string().optional(),
  durationMinutes: z.number().optional(),
  learningLevel: z.string().optional(),
  targetAudience: z.string().optional(),
  moduleGoal: z.string().optional(),
});

export type ValidationOutcome = {
  ok: boolean;
  errors: string[];
  fixed: StoryboardModule;
};

const clampOST = (s: string, limit = 70) => {
  const words = (s || "").trim().split(/\s+/).filter(Boolean);
  if (words.length <= limit) return s || "";
  return words.slice(0, limit).join(" ") + " […]";
};

export function validateAndAutofix(input: StoryboardModule): ValidationOutcome {
  const cloned: StoryboardModule = JSON.parse(JSON.stringify(input));

  // Autofixers:
  cloned.scenes = (cloned.scenes || []).map((scene) => {
    // OST clamp
    scene.onScreenText = clampOST(scene.onScreenText || "", 70);
    // Legacy mirror
    if (scene.audio?.script && !scene.narrationScript) {
      scene.narrationScript = scene.audio.script;
    }
    // Seed audio directive if missing
    if (!scene.audio.aiGenerationDirective) {
      const vp = scene.audio.voiceParameters || ({} as any);
      scene.audio.aiGenerationDirective = `[AI Generate: Voiceover with persona "${vp.persona || "Warm, professional"}", pace "${vp.pace || "Moderate"}", tone "${vp.tone || "Clear"}".]`;
    }
    // Seed interaction retry/completion
    if (scene.interactionType !== "None") {
      scene.interactionDetails = scene.interactionDetails || ({ interactionType: scene.interactionType } as any);
      if (!scene.interactionDetails!.retryLogic) scene.interactionDetails!.retryLogic = "Allow up to 2 retries; reveal after second incorrect.";
      if (!scene.interactionDetails!.completionRule) scene.interactionDetails!.completionRule = "User must complete the interaction at least once.";
    }
    return scene;
  });

  const parsed = StoryboardSchema.safeParse(cloned);
  if (!parsed.success) {
    const errors = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
    return { ok: false, errors, fixed: cloned };
    }
  return { ok: true, errors: [], fixed: parsed.data as StoryboardModule };
}