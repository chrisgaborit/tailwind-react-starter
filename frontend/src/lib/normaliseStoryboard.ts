// frontend/src/lib/normaliseStoryboard.ts
import type { StoryboardModule, StoryboardScene } from "@/types";

/**
 * Normalise a raw storyboard JSON so the UI and PDF can always render it.
 * - Accepts {scenes} or legacy {pages}
 * - Ensures first 4 header scenes exist
 * - Guarantees consistent audio/visual/interaction shape
 * - Backfills moduleTiming, TOC, metadata
 */
export function normaliseStoryboardForUI(input: any): StoryboardModule {
  if (!input) throw new Error("No storyboard provided");

  const sb: StoryboardModule = {
    moduleName: String(input?.moduleName || "Untitled Module"),
    moduleOverview:
      input?.moduleOverview ||
      "This programme combines short scenarios, interactive checks, and a capstone to help you apply key concepts.",
    learningLevel: input?.learningLevel || input?.complexityLevel || "Level 3",
    targetAudience: input?.targetAudience || "General staff",
    revisionHistory: Array.isArray(input?.revisionHistory) ? input.revisionHistory : [],
    pronunciationGuide: Array.isArray(input?.pronunciationGuide) ? input.pronunciationGuide : [],
    tableOfContents: Array.isArray(input?.tableOfContents) ? input.tableOfContents : [],
    metadata: input?.metadata || {},
    scenes: Array.isArray(input?.scenes)
      ? input.scenes
      : Array.isArray(input?.pages)
      ? input.pages
      : [],
  } as StoryboardModule;

  // Ensure scenes are coerced into detailed shape
  sb.scenes = sb.scenes.map((s: any, i: number) => coerceScene(s, i));

  // Guarantee first 4 header scenes
  sb.scenes = ensureFirstFourScenes(sb.scenes);

  // Back-fill moduleTiming if missing
  const perSceneSecs = sb.scenes.map((s) => Number(s?.timing?.estimatedSeconds || 60));
  const totalMin = Math.max(
    5,
    Math.round(perSceneSecs.reduce((a, b) => a + (isNaN(b) ? 0 : b), 0) / 60)
  );
  sb.metadata = sb.metadata || {};
  sb.metadata.moduleTiming = sb.metadata.moduleTiming || {
    targetMinutes: totalMin,
    totalEstimatedMinutes: totalMin,
    perSceneSeconds: perSceneSecs,
  };

  // Derive TOC if missing
  if (!Array.isArray(sb.tableOfContents) || sb.tableOfContents.length === 0) {
    sb.tableOfContents = sb.scenes.map((s) => s.pageTitle || "Untitled");
  }

  return sb;
}

// ---------- helpers ----------

function firstTruthy<T extends string>(...vals: (T | undefined)[]): T | undefined {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v as T;
  }
  return undefined;
}

function coerceScene(raw: any, idx: number): StoryboardScene {
  const pageTitle = String(raw?.pageTitle || raw?.title || `Scene ${idx + 1}`);

  // Layout
  const layout = raw?.screenLayout;
  const screenLayout =
    typeof layout === "string"
      ? layout
      : layout?.description
      ? String(layout.description)
      : "Standard slide layout";

  // Audio
  const audioScript = String(raw?.audio?.script || raw?.narrationScript || raw?.voiceover || "");

  // Visual
  const visual = raw?.visual || {};
  const vgb = visual.visualGenerationBrief || {};
  const aspectRatio = visual.aspectRatio || raw?.aspectRatio || "16:9";

  // Robust image mirroring
  const imageCandidate = firstTruthy(
    raw?.imageUrl,
    raw?.generatedImageUrl,
    visual?.generatedImageUrl,
    visual?.previewUrl
  );

  const scene: StoryboardScene = {
    sceneNumber: Number(raw?.sceneNumber || idx + 1),
    pageTitle,
    pageType:
      raw?.pageType ||
      ((raw?.interactionType && raw?.interactionType !== "None")
        ? "Interactive"
        : "Informative"),
    screenLayout,
    templateId: raw?.templateId || "",
    screenId: raw?.screenId || `S${idx + 1}`,
    audio: {
      script: audioScript,
      voiceParameters:
        raw?.audio?.voiceParameters || {
          persona: "Warm, professional, encouraging",
          pace: "Moderate (110–130 WPM)",
          tone: "Clear",
          emphasis: "",
        },
      backgroundMusic: raw?.audio?.backgroundMusic || "",
      aiGenerationDirective:
        raw?.audio?.aiGenerationDirective ||
        "[AI Generate: VO with warm, professional tone at ~110–130 WPM.]",
    },
    narrationScript: audioScript,
    onScreenText: clampWords(String(raw?.onScreenText || raw?.textOnScreen?.onScreenTextContent || ""), 70),
    visual: {
      mediaType: visual.mediaType || "Graphic",
      style: visual.style || "Clean corporate",
      visualGenerationBrief: {
        sceneDescription: vgb.sceneDescription || `Visual supporting "${pageTitle}"`,
        style: vgb.style || visual.style || "Vector / Flat",
        subject: vgb.subject || {},
        setting: vgb.setting || "Modern office",
        composition: vgb.composition || "Medium shot; eye-level; negative space top-right",
        lighting: vgb.lighting || "Soft, diffused; neutral white (~4800K)",
        colorPalette:
          Array.isArray(vgb.colorPalette) && vgb.colorPalette.length
            ? vgb.colorPalette
            : ["#FFFFFF", "#111111", "#B877D5", "#80D4FF"],
        mood: vgb.mood || "Professional, calm, optimistic",
        brandIntegration: vgb.brandIntegration || "Subtle accent in Bright Purple (#B877D5).",
        negativeSpace: vgb.negativeSpace || "30% top-right",
        assetId: vgb.assetId || undefined,
      },
      aiPrompt: visual.aiPrompt || `Modern, inclusive visual supporting "${pageTitle}"`,
      altText: visual.altText || `Illustration supporting "${pageTitle}"`,
      aspectRatio,
      composition: visual.composition || "Centered hero subject; negative space",
      environment: visual.environment || "Neutral office background",
      overlayElements: Array.isArray(visual.overlayElements) ? visual.overlayElements : [],
      previewUrl: visual.previewUrl || undefined,
      assetId: visual.assetId || undefined,
      // ensure the visual also holds the generated url
      generatedImageUrl: imageCandidate || visual.generatedImageUrl || undefined,
    },
    aspectRatio,
    // Interaction
    interactionDetails: raw?.interactionDetails || undefined,
    interactionType: raw?.interactionType || "None",
    interactionDescription: raw?.interactionDescription || "",
    developerNotes: raw?.developerNotes || raw?.devNotes || "",
    accessibilityNotes:
      raw?.accessibilityNotes ||
      raw?.a11y ||
      "Captions ON; keyboard path with visible focus; focus order documented; reduced-motion fallback.",
    timing:
      raw?.timing && Number.isFinite(Number(raw.timing.estimatedSeconds))
        ? { estimatedSeconds: Number(raw.timing.estimatedSeconds) }
        : (Number.isFinite(Number(raw?.estimatedSeconds))
            ? { estimatedSeconds: Number(raw.estimatedSeconds) }
            : { estimatedSeconds: 60 }),
    events: Array.isArray(raw?.events) ? raw.events : undefined,
    // legacy / optional
    generatedImageUrl: imageCandidate || raw?.generatedImageUrl || undefined,
    knowledgeCheck: raw?.knowledgeCheck || undefined,
    knowledgeChecks: Array.isArray(raw?.knowledgeChecks) ? raw.knowledgeChecks : undefined,
  };

  // If we’ve inferred an image, also put it on the scene root for max compatibility
  if (imageCandidate) {
    (scene as any).imageUrl = imageCandidate;
  }

  return scene;
}

function ensureFirstFourScenes(scenes: StoryboardScene[]): StoryboardScene[] {
  const need = [
    "Title",
    "Pronunciation Guide",
    "Table of Contents",
    "Welcome & Learning Objectives",
  ];
  const out = [...scenes];

  for (let i = 0; i < 4; i++) {
    const s = out[i];
    if (!s) {
      out[i] = makeHeaderScene(i + 1, need[i]);
      continue;
    }
    out[i] = { ...s, sceneNumber: i + 1, pageTitle: s.pageTitle || need[i] };
  }
  return out.map((s, i) => ({ ...s, sceneNumber: i + 1 }));
}

function makeHeaderScene(n: number, title: string): StoryboardScene {
  return {
    sceneNumber: n,
    pageTitle: title,
    pageType: title === "Pronunciation Guide" ? "Interactive" : "Informative",
    screenLayout: "Standard slide layout",
    templateId: "",
    screenId: `S${n}`,
    audio: {
      script: title === "Title" ? "Welcome to this module." : "",
      voiceParameters: {
        persona: "Warm, professional, encouraging",
        pace: "Moderate (110–130 WPM)",
        tone: "Clear",
        emphasis: "",
      },
      aiGenerationDirective:
        "[AI Generate: VO with warm, professional tone at ~110–130 WPM.]",
    },
    narrationScript: title === "Title" ? "Welcome to this module." : "",
    onScreenText: title,
    visual: {
      mediaType: "Graphic",
      style: "Clean corporate",
      visualGenerationBrief: {
        sceneDescription: `Visual for "${title}"`,
        style: "Vector / Flat",
        subject: {},
        setting: "Modern office",
        composition: "Medium shot; eye-level; negative space top-right",
        lighting: "Soft, diffused; neutral white (~4800K)",
        colorPalette: ["#FFFFFF", "#111111", "#B877D5", "#80D4FF"],
        mood: "Professional, calm, optimistic",
        brandIntegration: "Subtle accent in Bright Purple (#B877D5).",
        negativeSpace: "30% top-right",
      },
      aiPrompt: `Modern visual supporting "${title}"`,
      altText: `Illustration supporting "${title}"`,
      aspectRatio: "16:9",
      composition: "Centered hero subject; negative space",
      environment: "Neutral office background",
      overlayElements: [
        {
          elementType: "TitleText",
          content: title,
          style: {
            fontFamily: "Outfit",
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
      ],
    },
    aspectRatio: "16:9",
    interactionType: title === "Pronunciation Guide" ? "Clickable Hotspots" : "None",
    interactionDescription:
      title === "Pronunciation Guide"
        ? "Clickable list of terms; play audio per term; mark as viewed."
        : "",
    timing: { estimatedSeconds: 60 },
    developerNotes: "",
    accessibilityNotes:
      "Captions ON; keyboard path with visible focus; focus order documented; reduced-motion fallback.",
  };
}

function clampWords(text: string, limit: number): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= limit) return text;
  return words.slice(0, limit).join(" ") + " […]";
}