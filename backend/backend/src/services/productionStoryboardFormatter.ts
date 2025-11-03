// backend/src/services/productionStoryboardFormatter.ts

import type { StoryboardModule, Scene } from "../types";

type ProductionMetadata = {
  moduleName: string;
  learningOutcomes?: string | string[];
  totalScenes: number;
  generatedAt: string;
  source?: string;
};

type ProductionSubEvent = {
  eventNumber: string;
  title?: string;
  narration?: string;
  onScreenText?: string;
  developerNotes?: string;
};

type ProductionImageSpecs = {
  sceneDescription: string;
  styleRecommendation: string;
  composition: string;
  colorPalette: string[];
  altText: string;
  placeholder: string;
};

type ProductionScene = {
  eventNumber: string;
  pageNumber: string;
  pageTitle: string;
  screenLayout: string;
  audio: string;
  onScreenText: string;
  developerNotes: string;
  imageSpecs: ProductionImageSpecs;
  interactivityInstructions: string;
  accessibility: string;
  subEvents?: ProductionSubEvent[];
};

type ProductionStoryboard = {
  metadata: ProductionMetadata;
  scenes: ProductionScene[];
};

export interface FormatterResult {
  v2Format: StoryboardModule;
  productionFormat: ProductionStoryboard;
}

const ACCESSIBILITY_BASE =
  "Captions enabled; keyboard navigation supported; descriptive alt text; logical focus order; reduced-motion fallback.";

/**
 * Main entry point – accepts a v2 storyboard (DirectorAgent output) and returns
 * the untouched v2 payload plus a production-ready formatting layer.
 */
export function formatProductionStoryboard(storyboard: StoryboardModule): FormatterResult {
  const clonedStoryboard: StoryboardModule = JSON.parse(JSON.stringify(storyboard || {}));
  const production: ProductionStoryboard = {
    metadata: {
      moduleName: clonedStoryboard?.moduleName || "Untitled Module",
      learningOutcomes: collectLearningOutcomes(clonedStoryboard),
      totalScenes: clonedStoryboard?.scenes?.length || 0,
      generatedAt: new Date().toISOString(),
      source: "Genesis Agents v2",
    },
    scenes: buildProductionScenes(clonedStoryboard?.scenes || []),
  };

  return {
    v2Format: clonedStoryboard,
    productionFormat: production,
  };
}

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function collectLearningOutcomes(storyboard: StoryboardModule): string[] | string | undefined {
  if (!storyboard) return undefined;
  if (Array.isArray((storyboard as any).learningOutcomes)) return (storyboard as any).learningOutcomes;
  if (typeof storyboard.learningOutcomes === "string") return storyboard.learningOutcomes;
  return undefined;
}

function buildProductionScenes(scenes: Scene[]): ProductionScene[] {
  return scenes.map((scene, index) => {
    const eventNumber = `${index + 1}.0`;
    const pageNumber = `p${String(index + 1).padStart(2, "0")}`;
    const screenLayout = determineScreenLayout(scene);
    const developerNotes = buildDeveloperNotes(scene, screenLayout);
    const interactivityInstructions = buildInteractivityInstructions(scene);
    const imageSpecs = buildImageSpecs(scene);
    const subEvents = buildSubEvents(scene, index + 1);

    return {
      eventNumber,
      pageNumber,
      pageTitle: scene?.pageTitle || scene?.title || `Scene ${index + 1}`,
      screenLayout,
      audio: scene?.narrationScript || "",
      onScreenText: scene?.onScreenText || "",
      developerNotes,
      imageSpecs,
      interactivityInstructions,
      accessibility: ACCESSIBILITY_BASE,
      ...(subEvents.length ? { subEvents } : {}),
    };
  });
}

function buildSubEvents(scene: Scene, parentIndex: number): ProductionSubEvent[] {
  const events = Array.isArray((scene as any)?.events) ? (scene as any).events : [];
  return events.map((evt: any, idx: number) => ({
    eventNumber: `${parentIndex}.${idx + 1}`,
    title: evt?.title || evt?.name || undefined,
    narration: evt?.narrationScript || evt?.audio?.script || "",
    onScreenText: evt?.onScreenText || "",
    developerNotes: evt?.developerNotes || "",
  }));
}

function determineScreenLayout(scene: Scene): string {
  const pageType = String(scene?.pageType || "").toLowerCase();
  const interaction = String(scene?.interactionType || "").toLowerCase();
  const title = String(scene?.pageTitle || "").toLowerCase();

  if (pageType.includes("interactive") || interaction !== "none") {
    if (interaction.includes("scenario") || title.includes("scenario")) {
      return "Scenario workspace: character panel left, decision options right, feedback zone below.";
    }
    if (interaction.includes("drag") || interaction.includes("drop")) {
      return "Interactive canvas with draggable items and target zones.";
    }
    if (interaction.includes("reveal")) {
      return "Tabbed/accordion layout with reveal cards for each item.";
    }
    if (interaction.includes("quiz") || interaction.includes("mcq")) {
      return "Assessment card with question header, options list, and feedback area.";
    }
    return "Interactive exercise layout with instructions panel above and interaction component below.";
  }

  if (pageType.includes("assessment")) {
    return "Assessment layout: centered question, stacked responses, feedback region.";
  }
  if (pageType.includes("scenario")) {
    return "Scenario layout: character vignette left, narrative top-right, choices beneath.";
  }
  if (pageType.includes("practice") || title.includes("practice")) {
    return "Practice layout: instruction banner, interactive zone, feedback strip.";
  }
  if (pageType.includes("teach") || title.includes("teach") || title.includes("concept")) {
    return "Teaching layout: full-width explanatory content with supporting visual on side.";
  }

  return "Standard instructional layout with heading, narrative block, and supporting visual.";
}

function buildDeveloperNotes(scene: Scene, screenLayout: string): string {
  const notes: string[] = [];

  const prompt = scene?.visual?.aiPrompt || "";
  const normalizedPrompt = prompt.trim();

  if (normalizedPrompt) {
    notes.push(transformPromptToInstruction(normalizedPrompt));
  }

  if (scene?.interactionType && scene.interactionType !== "None") {
    notes.push(`Implement interaction as described: ${buildInteractivityInstructions(scene)}`);
  }

  if (screenLayout) {
    notes.push(`Screen layout: ${screenLayout}`);
  }

  if (scene?.developerNotes) {
    notes.push(`Additional notes: ${scene.developerNotes}`);
  }

  return notes.join(" | ");
}

function transformPromptToInstruction(prompt: string): string {
  const lower = prompt.toLowerCase();

  if (/(two|2)[-\s]?column|split[-\s]?screen/.test(lower)) {
    return "Build a 2-column layout with key text on the left and supporting image on the right.";
  }
  if (/timeline|sequence|progression|steps/.test(lower)) {
    return "Use a horizontal timeline with milestone cards that reveal details sequentially.";
  }
  if (/grid|tiles|cards/.test(lower)) {
    return "Use a responsive grid of cards with equal spacing and hover/focus states.";
  }
  if (/icon|icons/.test(lower)) {
    return "Introduce icons with short labels; animate bullet points to fade in sequentially.";
  }
  if (/dashboard|analytics|data/.test(lower)) {
    return "Lay out key metrics in dashboard cards with supporting microcopy.";
  }

  return `Translate the visual brief into UI elements: ${prompt}`;
}

function buildInteractivityInstructions(scene: Scene): string {
  const interaction = String(scene?.interactionType || "").toLowerCase();
  switch (interaction) {
    case "clicktoreveal":
    case "click-to-reveal":
    case "hotspots":
      return "Present cards or hotspots; learners select each item to reveal detailed content.";
    case "dragdrop":
    case "draganddrop-matching":
    case "draganddrop-sequencing":
    case "drag & drop":
      return "Provide draggable items on the left; learners drag into the correct target areas and receive immediate feedback.";
    case "scenario":
    case "branching":
      return "Display narrative then offer choices; learner selects an option to view consequences and guidance.";
    case "mcq":
    case "quiz":
    case "singlechoice":
      return "Show question with radio options; learner selects an answer, clicks Submit, and reviews tailored feedback.";
    case "multiselect":
    case "multi-select":
      return "Allow multiple selections; learner confirms choices to unlock consolidated feedback.";
    case "reflection":
    case "journal":
      return "Provide prompt with text input; learner records reflection and can download or submit response.";
    case "simulation":
      return "Simulate process flow with step-by-step prompts; learner chooses actions and observes outcomes.";
    default:
      return "No interactive component—render as informative content with smooth transitions.";
  }
}

function buildImageSpecs(scene: Scene): ProductionImageSpecs {
  const prompt = scene?.visual?.aiPrompt || "";
  const brief = (scene?.visual as any)?.visualGenerationBrief || {};
  const style =
    brief?.style ||
    inferStyle(prompt) ||
    "Photorealistic instructional style aligned with brand palette.";

  const composition =
    brief?.composition ||
    inferComposition(prompt) ||
    "Balanced composition with clear focal point supporting the learning objective.";

  const palette: string[] =
    Array.isArray(brief?.colorPalette) && brief.colorPalette.length
      ? brief.colorPalette
      : Array.isArray(scene?.visual?.colorPalette)
      ? (scene?.visual?.colorPalette as string[])
      : ["#0F172A", "#0284C7", "#38BDF8", "#F8FAFC"];

  const altText =
    scene?.visual?.altText ||
    brief?.altText ||
    `Illustration supporting ${scene?.pageTitle || "this scene"}.`;

  return {
    sceneDescription: prompt || "Use scene narration to inform imagery.",
    styleRecommendation: style,
    composition,
    colorPalette: palette,
    altText,
    placeholder: "[Stock Image ID: TBD]",
  };
}

function inferStyle(prompt: string): string {
  const lower = prompt.toLowerCase();
  if (/photorealistic|photo/.test(lower)) return "Photorealistic marketing photography style.";
  if (/illustration|flat|vector/.test(lower)) return "Modern vector illustration with clean lines.";
  if (/3d|render/.test(lower)) return "3D rendered style with soft lighting.";
  if (/hand[- ]?drawn|sketch/.test(lower)) return "Hand-drawn sketch style with subtle shading.";
  return "Professional corporate illustration style with inclusive representation.";
}

function inferComposition(prompt: string): string {
  const lower = prompt.toLowerCase();
  if (/close[- ]?up|portrait/.test(lower)) return "Close-up portrait framing focusing on character expression.";
  if (/wide|landscape|team/.test(lower)) return "Wide shot capturing full team with environment context.";
  if (/workflow|process|steps/.test(lower))
    return "Use sequential panels or numbered steps highlighting process flow.";
  if (/icon|symbol/.test(lower)) return "Use centered iconography with supporting annotation labels.";
  return "Center-weighted composition with ample negative space for headline text.";
}
