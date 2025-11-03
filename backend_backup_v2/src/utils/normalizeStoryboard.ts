// backend/src/utils/normalizeStoryboard.ts

import {
  IDMethod,
  InstructionalTag,
  StoryboardModule,
  StoryboardScene
} from "../types/storyboardTypes";

/* ========================= Incoming (pages/events) shapes ========================= */

export type IncomingEvent = {
  eventNumber: number;
  onScreenText?: string;
  aiProductionBrief?: {
    visual?: {
      mediaType?: string;
      style?: string;
      subject?: string;
      composition?: string;
      environment?: string; // aka setting
      lighting?: string;
      mood?: string;
      animationSpec?: string;
      palette?: string[];
    };
    audio?: { script?: string; voice?: string; pacing?: string };
    interactive?: {
      interactionType?: string;
      layoutDescription?: string;
      behaviourExplanation?: string;
      learningPurpose?: string;
    };
  };
  [k: string]: any;
};

export type IncomingPage = {
  pageNumber: number;
  pageTitle?: string;
  events?: IncomingEvent[];
  [k: string]: any;
};

export type IncomingModule = {
  // V1 (pages/events) shape
  moduleName?: string;
  revisionHistory?: any[];
  pronunciationGuide?: any[];
  pages?: IncomingPage[];

  // V2 (scenes) shape (already normalized) – may include events
  scenes?: any[];
  meta?: { moduleName?: string };

  // Caller-selected instructional design method (carried through)
  idMethod?: IDMethod;

  // Optional brand metadata
  metadata?: { brand?: { colours?: string; fonts?: string } };

  [k: string]: any;
};

/* =============================== Photorealism policy =============================== */

const DEFAULT_PALETTE = ["#0387E6", "#E63946", "#BC57CF", "#000000", "#FFFFFF"];
const NEGATIVE_STYLE = [
  "no vector art",
  "no flat illustration",
  "no cartoon",
  "no clip art",
  "no isometric illustration",
  "no 3D render look",
  "no exaggerated proportions",
].join(", ");
const REALISM_CUES = [
  "Photorealistic",
  "high-resolution",
  "natural skin tones",
  "realistic proportions",
  "authentic textures",
  "subtle depth of field",
  "natural lighting",
].join(", ");

/* ================================== Utilities ================================== */

const safeStr = (v: unknown) => (typeof v === "string" ? v : "");
const joinNonEmpty = (parts: Array<string | undefined>) =>
  parts
    .map((p) => (p || "").trim())
    .filter((p) => p.length > 0)
    .join(" | ");

const parsePaletteFromBrand = (s?: string): string[] => {
  if (!s) return [];
  return s
    .split(/[,;|\s]+/)
    .map((x) => x.trim())
    .filter(Boolean)
    .map((x) => (x.startsWith("#") ? x : `#${x}`))
    .filter((x) => /^#[0-9a-f]{3,8}$/i.test(x));
};

function hasScenes(mod: IncomingModule): boolean {
  return Array.isArray((mod as any).scenes);
}

function getModuleName(mod: IncomingModule): string {
  return safeStr(mod.moduleName) || safeStr(mod.meta?.moduleName) || "Untitled Module";
}

/* ========================== Instructional tag normaliser ========================== */

function coerceInstructionalTag(tag: any, idMethod: IDMethod): InstructionalTag {
  switch (idMethod) {
    case "ADDIE": {
      const raw = (tag?.addie?.phase || tag?.phase || tag) as string;
      const norm = String(raw || "D1").toUpperCase();
      const mapped: "A" | "D1" | "D2" | "I" | "E" =
        norm === "A" ? "A" : norm === "I" ? "I" : norm === "E" ? "E" : norm.startsWith("D2") ? "D2" : "D1";
      return { method: "ADDIE", addie: { phase: mapped } };
    }
    case "SAM": {
      const phase = (tag?.sam?.phase || tag?.phase || "Iterate") as string;
      return { method: "SAM", sam: { phase } };
    }
    case "MERRILL": {
      const phase = (tag?.merrill?.phase || tag?.phase || "Application") as string;
      return { method: "MERRILL", merrill: { phase } };
    }
    case "GAGNE": {
      const event = (tag?.gagne?.event || tag?.event || "PresentContent") as string;
      return { method: "GAGNE", gagne: { event } };
    }
    case "BACKWARD": {
      const stage = (tag?.backward?.stage || tag?.stage || "PlanLearning") as string;
      return { method: "BACKWARD", backward: { stage } };
    }
    case "BLOOM": {
      const level = (tag?.bloom?.level || tag?.level || "Apply") as string;
      return { method: "BLOOM", bloom: { level } };
    }
    default:
      return { method: "ADDIE", addie: { phase: "D1" } };
  }
}

/* =============================== Visual enforcement =============================== */

function enforcePhotorealisticVisual(event?: IncomingEvent, brandPalette?: string[]) {
  if (!event) return;

  event.aiProductionBrief ||= {};
  event.aiProductionBrief.visual ||= {};
  const vb = event.aiProductionBrief.visual;

  // Always treat visual as an image
  vb.mediaType = "image";

  // Overwrite any vector/flat/cartoon signals
  const style = String(vb.style || "").toLowerCase();
  if (!style || /(vector|flat|illustration|isometric|cartoon|clip)/i.test(style)) {
    vb.style = "Photorealistic";
  } else if (!/photorealistic/i.test(style)) {
    vb.style = `${vb.style} Photorealistic`.trim();
  }

  // Defaults that bias realism
  vb.subject ||= "diverse professionals collaborating in a modern workplace";
  vb.environment ||= "contemporary office or home office environments";
  vb.composition ||= "16:9, natural candid composition with clear subject focus";
  vb.lighting ||= "soft natural daylight or warm practical lighting";
  vb.mood ||= "professional, inclusive, productive";
  vb.palette ||= brandPalette && brandPalette.length ? brandPalette : DEFAULT_PALETTE;
}

/** Enforce photorealistic cues on top-level scene.visual and fill rich brief */
function upsertSceneVisual(scene: StoryboardScene, brandPalette?: string[]) {
  const s: any = scene;
  s.visual = s.visual || {};
  const v = s.visual;

  // Base style -> Photorealistic
  const styleStr = String(v.style || "").toLowerCase();
  if (!styleStr || /(vector|flat|illustration|isometric|cartoon|clip)/i.test(styleStr)) {
    v.style = "Photorealistic";
  } else if (!/photorealistic/i.test(styleStr)) {
    v.style = `${v.style} Photorealistic`.trim();
  }

  // Media type (prefer Image)
  v.mediaType = v.mediaType || "Image";

  // Colour palette
  if (!Array.isArray(v.colorPalette) || v.colorPalette.length === 0) {
    v.colorPalette = brandPalette && brandPalette.length ? brandPalette : DEFAULT_PALETTE;
  }

  // Visual Generation Brief (rich)
  v.visualGenerationBrief = v.visualGenerationBrief || {};
  const vgb = v.visualGenerationBrief;

  vgb.sceneDescription =
    vgb.sceneDescription || `Photorealistic visual supporting "${scene.pageTitle || "this scene"}".`;
  vgb.style = vgb.style || v.style || "Photorealistic";
  vgb.subject = vgb.subject || { description: "diverse professionals collaborating" };
  vgb.setting = vgb.setting || "modern office or home office";
  vgb.composition = vgb.composition || "16:9, natural candid composition; clear subject focus";
  vgb.lighting = vgb.lighting || "soft natural daylight or warm practical lighting";
  vgb.colorPalette =
    Array.isArray(vgb.colorPalette) && vgb.colorPalette.length ? vgb.colorPalette : v.colorPalette;
  vgb.mood = vgb.mood || "professional, inclusive, productive";
  vgb.brandIntegration =
    vgb.brandIntegration || "Use brand palette subtly (UI chrome, soft accents).";
  vgb.negativeSpace = vgb.negativeSpace || "30% top-right for overlays";
  vgb.assetId = vgb.assetId || "";

  // Overlay elements (ensure a TitleText if missing)
  if (!Array.isArray(v.overlayElements) || v.overlayElements.length === 0) {
    v.overlayElements = [
      {
        elementType: "TitleText",
        content: scene.pageTitle || "",
        style: {
          fontFamily: "Montserrat",
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
  }

  // Legacy mirrors & essentials
  v.aiPrompt =
    v.aiPrompt ||
    `Photorealistic, high-resolution visual; natural lighting; authentic textures; avoid vector/flat/cartoons; ${NEGATIVE_STYLE}; palette: ${(
      v.colorPalette || DEFAULT_PALETTE
    ).join(", ")}.`;

  v.altText = v.altText || `Photorealistic visual supporting "${scene.pageTitle || "this scene"}"`;
  v.aspectRatio = v.aspectRatio || "16:9";
  v.composition = v.composition || "Candid composition; clear subject; negative space for UI";
  v.environment = v.environment || "Modern workplace or home office";

  s.visual = v;
}

/** Try to build an ai image prompt string from best available brief */
function buildImagePromptFromVisual(visual?: {
  subject?: any;
  environment?: string;
  composition?: string;
  lighting?: string;
  mood?: string;
  palette?: string[];
  colorPalette?: string[];
}) {
  if (!visual) return "";
  const parts: string[] = [];
  const subj =
    typeof visual.subject === "string"
      ? visual.subject
      : visual.subject?.description || "";
  if (subj) parts.push(subj);
  if (visual.environment) parts.push(`in ${visual.environment}`);
  if (visual.composition) parts.push(`Composition: ${visual.composition}`);
  if (visual.lighting) parts.push(`Lighting: ${visual.lighting}`);
  if (visual.mood) parts.push(`Mood: ${visual.mood}`);
  parts.push(`Style: ${REALISM_CUES}.`);
  const paletteArr = visual.colorPalette || visual.palette || DEFAULT_PALETTE;
  parts.push(`Brand-aware accents (subtle): ${paletteArr.join(", ")}.`);
  parts.push(`Avoid: ${NEGATIVE_STYLE}.`);
  return parts.join(" ");
}

function buildImagePrompt(visual?: IncomingEvent["aiProductionBrief"]["visual"]) {
  return buildImagePromptFromVisual(visual || undefined);
}

function enforcePageEvents(page?: IncomingPage, brandPalette?: string[]) {
  if (!page?.events?.length) return;
  for (const ev of page.events) enforcePhotorealisticVisual(ev, brandPalette);
}

function enforceScenesArray(scenes: any[], brandPalette?: string[]) {
  for (const s of scenes) {
    // Ensure a rich top-level visual block
    upsertSceneVisual(s as StoryboardScene, brandPalette);

    // Nested events (if any)
    if (Array.isArray(s?.events)) {
      for (const ev of s.events as IncomingEvent[]) enforcePhotorealisticVisual(ev, brandPalette);
    } else if (s?.aiProductionBrief?.visual) {
      enforcePhotorealisticVisual(s as unknown as IncomingEvent, brandPalette);
    }
  }
}

/* ================================== Normaliser ================================== */
/**
 * Normalizes any incoming storyboard (with `pages`/`events` or already `scenes`)
 * into:
 *   { moduleName, revisionHistory, pronunciationGuide, tableOfContents, scenes, idMethod }
 *
 * If `scenes` already exists, we still enforce photorealism (top-level & nested),
 * ensure `instructionalTag` per scene, tidy layout/audio mirrors, and pass through.
 */
export function normalizeToScenes(
  mod: IncomingModule,
  brandPaletteOverride?: string[]
): StoryboardModule {
  const moduleName = getModuleName(mod);
  const idMethod: IDMethod = (mod.idMethod as IDMethod) || "ADDIE";

  // Brand palette preference: param → metadata.brand.colours → default
  const brandPalette =
    brandPaletteOverride && brandPaletteOverride.length
      ? brandPaletteOverride
      : parsePaletteFromBrand(mod?.metadata?.brand?.colours || "") || [];

  // Case A: Already-normalized scenes → enforce + tag + pass-through
  if (hasScenes(mod)) {
    const scenes = ((mod as any).scenes || []) as StoryboardScene[];

    // Enforce photorealism (top-level + nested)
    enforceScenesArray(scenes as any[], brandPalette);

    // Ensure mirrors, imagePrompt and tags
    for (const s of scenes as any[]) {
      // Narration mirror from audio.script if missing
      if (!s.narrationScript && (s as any)?.audio?.script) {
        s.narrationScript = (s as any).audio.script;
      }

      // Flatten screenLayout object to short string
      const layout = (s as any).screenLayout;
      if (layout && typeof layout === "object") {
        (s as any).screenLayout = layout.description || "Standard slide layout";
      }

      // Instructional tag
      s.instructionalTag = coerceInstructionalTag((s as any).instructionalTag, idMethod);

      // Derive imagePrompt if missing
      if (!s.imagePrompt) {
        // Prefer nested event brief if present
        const firstEvent =
          Array.isArray((s as any).events) && (s as any).events.length
            ? ((s as any).events[0] as IncomingEvent)
            : undefined;
        const vb = firstEvent?.aiProductionBrief?.visual;
        if (vb) {
          s.imagePrompt = buildImagePrompt(vb);
        } else if ((s as any)?.visual) {
          const v = (s as any).visual;
          const src =
            v.visualGenerationBrief
              ? {
                  subject: v.visualGenerationBrief.subject,
                  environment: v.visualGenerationBrief.setting,
                  composition: v.visualGenerationBrief.composition,
                  lighting: v.visualGenerationBrief.lighting,
                  mood: v.visualGenerationBrief.mood,
                  colorPalette: v.colorPalette,
                }
              : {
                  subject: undefined,
                  environment: v.environment,
                  composition: v.composition,
                  lighting: undefined,
                  mood: undefined,
                  colorPalette: v.colorPalette,
                };
          s.imagePrompt = buildImagePromptFromVisual(src);
        }
      }

      // Finally, ensure the top-level visual block is rich
      upsertSceneVisual(s, brandPalette);
    }

    const tableOfContents = (scenes as any[]).map(
      (s) =>
        safeStr((s as any).pageTitle) ||
        safeStr((s as any).title) ||
        `Scene ${(s as any).sceneNumber ?? ""}`.trim()
    );

    return {
      moduleName,
      revisionHistory: (mod.revisionHistory || []) as any[],
      pronunciationGuide: (mod.pronunciationGuide || []) as any[],
      tableOfContents,
      scenes,
      idMethod,
    } as StoryboardModule;
  }

  // Case B: Build scenes from pages/events
  const pages: IncomingPage[] = Array.isArray(mod.pages) ? [...mod.pages] : [];

  // Sort by pageNumber if not already
  pages.sort((a, b) => (a.pageNumber || 0) - (b.pageNumber || 0));

  // Enforce photorealism per page events BEFORE deriving summaries/prompts
  for (const p of pages) enforcePageEvents(p, brandPalette);

  const scenes = pages.map<StoryboardScene>((p, idx) => {
    const events: IncomingEvent[] = Array.isArray(p.events) ? p.events : [];

    const onScreenText = events
      .map((e) => safeStr(e.onScreenText).trim())
      .filter(Boolean)
      .join("\n\n");

    const narrationScript = events
      .map((e) => safeStr(e.aiProductionBrief?.audio?.script).trim())
      .filter(Boolean)
      .join("\n\n");

    const first = events[0];
    const vis = first?.aiProductionBrief?.visual || {};
    const intx = first?.aiProductionBrief?.interactive || {};

    const visualDescription = joinNonEmpty([
      vis.mediaType ? `Media: ${vis.mediaType}` : undefined,
      vis.style ? `Style: ${vis.style}` : undefined,
      vis.subject ? `Subject: ${vis.subject}` : undefined,
      vis.composition ? `Composition: ${vis.composition}` : undefined,
      vis.environment ? `Environment: ${vis.environment}` : undefined,
      vis.lighting ? `Lighting: ${vis.lighting}` : undefined,
      vis.mood ? `Mood: ${vis.mood}` : undefined,
      vis.animationSpec ? `Animation: ${vis.animationSpec}` : undefined,
    ]);

    const interactionType = safeStr(intx.interactionType);

    const interactionDescription = joinNonEmpty([
      intx.layoutDescription ? `Layout: ${intx.layoutDescription}` : undefined,
      intx.behaviourExplanation ? `Behaviour: ${intx.behaviourExplanation}` : undefined,
      intx.learningPurpose ? `Purpose: ${intx.learningPurpose}` : undefined,
    ]);

    const scene: StoryboardScene = {
      sceneNumber: p.pageNumber ?? idx + 1,
      pageTitle: p.pageTitle || `Scene ${p.pageNumber ?? idx + 1}`,
      screenLayout: "",
      templateId: "",
      screenId: `scene-${p.pageNumber ?? idx + 1}`,
      narrationScript,
      onScreenText,
      visualDescription,
      interactionType,
      interactionDescription,
      developerNotes: interactionDescription,
      accessibilityNotes: "",
      imagePrompt: buildImagePrompt(vis),
      instructionalTag: coerceInstructionalTag(undefined, idMethod),
    } as any;

    // Preserve original events for downstream use
    (scene as any).events = events;

    // Ensure a rich top-level visual block
    upsertSceneVisual(scene, brandPalette);

    // Mirror audio.script to narration if missing (unlikely here)
    if (!scene.narrationScript && (scene as any)?.audio?.script) {
      scene.narrationScript = (scene as any).audio.script;
    }

    // Flatten screenLayout object if someone sets it upstream later
    const layout = (scene as any).screenLayout;
    if (layout && typeof layout === "object") {
      (scene as any).screenLayout = layout.description || "Standard slide layout";
    }

    return scene;
  });

  return {
    moduleName,
    revisionHistory: (mod.revisionHistory || []) as any[],
    pronunciationGuide: (mod.pronunciationGuide || []) as any[],
    tableOfContents: (scenes as any[]).map((s) => (s as any).pageTitle),
    scenes,
    idMethod,
  } as StoryboardModule;
}

module.exports = normalizeToScenes;