// backend/src/services/assetPromptService.ts
import type { StoryboardScene, StoryboardModule } from "@/types";

/**
 * Build JSON prompts for downstream asset generators (images, audio, video, interactions).
 * These are “painfully detailed” to drive consistent AI output.
 */
export function makeImagePrompt(scene: StoryboardScene) {
  const v = scene.visual;
  const b = v.visualGenerationBrief || ({} as any);
  return {
    kind: "image",
    meta: {
      sceneNumber: scene.sceneNumber,
      pageTitle: scene.pageTitle,
      aspectRatio: v.aspectRatio,
      mediaType: v.mediaType,
    },
    brief: {
      sceneDescription: b.sceneDescription,
      style: b.style,
      subject: b.subject,
      setting: b.setting,
      composition: b.composition,
      lighting: b.lighting,
      colorPalette: b.colorPalette,
      mood: b.mood,
      brandIntegration: b.brandIntegration,
      negativeSpace: b.negativeSpace,
      altText: v.altText,
    },
    overlayElements:
      typeof scene.screenLayout === "object" ? (scene.screenLayout as any).elements || [] : [],
  };
}

export function makeAudioPrompt(scene: StoryboardScene) {
  const a = scene.audio;
  return {
    kind: "audio",
    meta: {
      sceneNumber: scene.sceneNumber,
      pageTitle: scene.pageTitle,
    },
    voice: a.voiceParameters,
    backgroundMusic: a.backgroundMusic,
    aiDirective: a.aiGenerationDirective,
    script: a.script,
  };
}

export function makeInteractionPrompt(scene: StoryboardScene) {
  if (!scene.interactionDetails || scene.interactionType === "None") {
    return undefined;
  }
  const d = scene.interactionDetails;
  return {
    kind: "interaction",
    meta: {
      sceneNumber: scene.sceneNumber,
      pageTitle: scene.pageTitle,
      type: scene.interactionType,
    },
    aiDirective: d.aiGenerationDirective,
    actions: d.aiActions || [],
    decisionLogic: d.aiDecisionLogic || [],
    retryLogic: d.retryLogic,
    completionRule: d.completionRule,
    xapi: d.xapiEvents || [],
  };
}

export function makeAllPrompts(module: StoryboardModule) {
  const scenes = module.scenes || [];
  return scenes.map((s) => ({
    scene: s.sceneNumber,
    image: makeImagePrompt(s),
    audio: makeAudioPrompt(s),
    interaction: makeInteractionPrompt(s),
  }));
}