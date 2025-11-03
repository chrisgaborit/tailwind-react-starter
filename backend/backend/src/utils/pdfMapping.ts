// backend/src/utils/pdfMapping.ts
import type { StoryboardModule } from "../../types";

const strip = (s?: string) => String(s || "").trim();

function words(text?: string) {
  return strip(text).split(/\s+/).filter(Boolean).length;
}

export function normaliseStoryboardForPdf(m: StoryboardModule) {
  const out = { ...m };
  out.scenes = (m.scenes || []).map((s, idx) => {
    const vgb = s.visual?.visualGenerationBrief || {};
    const overlay = (s.visual?.overlayElements || [])
      .map(e => `${e.elementType}${e.content ? `: ${e.content}` : ""}`)
      .join(" • ");

    // Prefer structured fields, fall back to legacy
    const aiPrompt =
      s.visual?.aiPrompt ||
      [
        vgb.sceneDescription,
        vgb.style && `Style: ${vgb.style}`,
        vgb.setting && `Setting: ${vgb.setting}`,
        vgb.composition && `Composition: ${vgb.composition}`,
        vgb.lighting && `Lighting: ${vgb.lighting}`,
        Array.isArray(vgb.colorPalette) && vgb.colorPalette.length
          ? `Colour Palette: ${vgb.colorPalette.join(", ")}`
          : "",
        vgb.mood && `Mood: ${vgb.mood}`,
        vgb.brandIntegration && `Brand Integration: ${vgb.brandIntegration}`,
        vgb.negativeSpace && `Negative Space: ${vgb.negativeSpace}`,
      ]
        .filter(Boolean)
        .join("\n");

    const interaction =
      s.interactionDetails?.interactionType ||
      s.interactionType ||
      "None";

    const decisionLogic =
      (s.interactionDetails?.aiDecisionLogic || [])
        .map((d: any) =>
          ["choice", "feedback", "branchTo"]
            .map(k => (d[k] ? `${k}: ${d[k]}` : ""))
            .filter(Boolean)
            .join(" | ")
        )
        .filter(Boolean)
        .join("\n");

    const xapi =
      (s.interactionDetails?.xapiEvents || [])
        .map(e => `${e.verb} → ${e.object}`)
        .join("\n");

    return {
      ...s,
      // Fields your current PDF template expects:
      screenLayout:
        typeof s.screenLayout === "string"
          ? s.screenLayout
          : s.screenLayout?.description || "Standard slide layout",
      aiPrompt,
      interactionType: interaction,
      interactionDescription:
        s.interactionDescription ||
        strip(s.developerNotes) ||
        "—",
      // Handy extras for chips/badges in the PDF:
      __pdf: {
        overlaySummary: overlay,
        ostWords: words(s.onScreenText),
        voWords: words(s.audio?.script),
        voiceParams: s.audio?.voiceParameters,
        retry: s.interactionDetails?.retryLogic,
        completion: s.interactionDetails?.completionRule,
        xapi,
        accessibility: s.accessibilityNotes,
      },
      // Guarantee alt text & aspect for template
      visual: {
        ...s.visual,
        altText:
          s.visual?.altText ||
          `Illustration supporting "${s.pageTitle || `Screen ${idx + 1}`}"`,
        aspectRatio: s.visual?.aspectRatio || "16:9",
      },
    };
  });
  return out as StoryboardModule;
}