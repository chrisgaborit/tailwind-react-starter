// backend/src/utils/quality.ts
import type { StoryboardModule } from "../types";

export interface QualityIssue {
  sceneIndex?: number;
  kind: string;
  message: string;
  severity: "info" | "warn" | "error";
}

export interface QualityReport {
  score: number; // 0..100
  issues: QualityIssue[];
  byScene: Array<{
    sceneIndex: number;
    title: string;
    ostWords: number;
    hasVisualBrief: boolean;
    hasOverlayElements: boolean;
    hasAudioDirective: boolean;
    hasInteractionDetails: boolean;
    interactive: boolean;
  }>;
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const wc = (s?: string) => (s ? String(s).trim().split(/\s+/).filter(Boolean).length : 0);

export function evaluateStoryboardQuality(m: StoryboardModule): QualityReport {
  const issues: QualityIssue[] = [];
  const byScene = (m.scenes || []).map((s, i) => {
    const ostWords = wc(s.onScreenText);
    if (ostWords > 70) {
      issues.push({
        sceneIndex: i,
        kind: "ost-limit",
        message: `On-screen text is ${ostWords} words (limit 70).`,
        severity: "warn",
      });
    }
    const hasVisualBrief = !!s.visual?.visualGenerationBrief?.sceneDescription;
    if (!hasVisualBrief) {
      issues.push({
        sceneIndex: i,
        kind: "visual-brief-missing",
        message: "Visual generation brief is missing key fields.",
        severity: "warn",
      });
    }
    const hasOverlayElements = typeof s.screenLayout === "object" && Array.isArray((s.screenLayout as any).elements);
    if (!hasOverlayElements) {
      issues.push({
        sceneIndex: i,
        kind: "layout-not-componentised",
        message: "Screen layout is not componentised (no overlay elements).",
        severity: "info",
      });
    }
    const hasAudioDirective = !!s.audio?.aiGenerationDirective || !!s.audio?.voiceParameters?.persona;
    if (!hasAudioDirective) {
      issues.push({
        sceneIndex: i,
        kind: "audio-directive-missing",
        message: "Audio generation directive/persona missing.",
        severity: "info",
      });
    }
    const hasInteractionDetails = !!s.interactionDetails?.interactionType && s.interactionType !== "None";
    if (s.interactionType !== "None" && !hasInteractionDetails) {
      issues.push({
        sceneIndex: i,
        kind: "interaction-details-missing",
        message: "Interactive scene without detailed interaction logic.",
        severity: "warn",
      });
    }
    return {
      sceneIndex: i,
      title: s.pageTitle,
      ostWords,
      hasVisualBrief,
      hasOverlayElements,
      hasAudioDirective,
      hasInteractionDetails,
      interactive: s.interactionType !== "None",
    };
  });

  // crude scoring: start 100, penalize issues
  let score = 100;
  issues.forEach((it) => {
    if (it.severity === "error") score -= 10;
    else if (it.severity === "warn") score -= 5;
    else score -= 2;
  });
  score = clamp(score, 0, 100);

  return { score, issues, byScene };
}