// backend/src/types/storyboardTypesV2.ts
// Executable storyboard schema (V2). Shared by backend validator & frontend UI.

export type VersionTag = "2.0";

/** Root module type */
export interface StoryboardModuleV2 {
  version: VersionTag; // "2.0"
  meta: ModuleMeta;
  structure: ModuleStructure;
  assets: ModuleAssets;
  scenes: SceneV2[]; // includes branch hub scene(s) and any branch scenelets
}

/** ---------- Meta & global specs ---------- */

export interface ModuleMeta {
  moduleName: string;
  moduleType:
    | "Compliance"
    | "Onboarding"
    | "Soft Skills"
    | "Product"
    | "Leadership"
    | string;
  level: "Level1" | "Level2" | "Level3" | "Level4";
  targetDurationMin: number; // e.g., 20
  audiencePersona: string; // e.g., "Claims Assessors"
  brand: BrandSpec;
  voiceover: VoiceoverSpec; // global default, scenes can override
  accessibility: AccessibilitySpec;
  xapi: XapiSpec;
  learningOutcomes?: string[]; // optional, for reference
}

export interface BrandSpec {
  colours: {
    primary: string; // e.g., "#001E41"
    accents: string[]; // e.g., ["#5BCBF5","#31B2E7"]
    bg?: string;
    text?: string;
  };
  fonts: {
    heading: string; // e.g., "Outfit"
    body: string; // e.g., "Inter"
    code?: string;
  };
  typography: {
    H1: TextStyle;
    H2: TextStyle;
    H3?: TextStyle;
    Body: TextStyle;
    Caption?: TextStyle;
  };
  layout: {
    grid: "AMP-16x9" | string;
    gutterPx: number;
    safeMarginPx: number;
  };
}

export interface TextStyle {
  family: string;
  weight: number; // 100..900
  sizePt: number;
  colour: string; // hex or rgb/rgba
  letterSpacing?: number;
  lineHeight?: number;
}

export interface VoiceoverSpec {
  language: string; // e.g., "en-AU"
  accent: string; // e.g., "Australian"
  persona: {
    gender?: "Female" | "Male" | "Non-binary" | string;
    ageRange?: string; // e.g., "35-45"
    tone: string; // e.g., "Professional, warm, confident"
  };
  wpmApprox: number; // e.g., 110
}

export interface AccessibilitySpec {
  captionsDefaultOn: boolean;
  audioDescriptionPolicy: "none" | "key-visuals" | "full";
  colourContrastRatioMin: "WCAG2.1-AA" | "AAA";
  keyboardOnlySupport: boolean;
  altTextPolicy: "required-all" | "required-media" | "optional";
}

export interface XapiSpec {
  activityIdBase: string; // e.g., "https://learno.ai/xapi/licop"
  verbs: string[]; // e.g., ["launched","experienced","answered","completed","passed","failed","branched","interacted"]
}

/** ---------- Structure & planning ---------- */

export interface ModuleStructure {
  firstFourEnforced: boolean; // must include Title, Pronunciation Guide, Table of Contents, Welcome & LOs
  durationPlan: DurationPlan;
  branchingGraph?: BranchGraph; // optional unless Level3/Level4 rules require it
}

export interface DurationPlan {
  targetScenes: number; // computed to hit targetDurationMin
  sceneTimingStrategy: "heuristic" | "fixed-per-type";
  minKC: number; // minimum knowledge checks from level profile
}

export interface BranchGraph {
  nodes: BranchNode[];
  edges: BranchEdge[];
  startNodeId: string;
}

export interface BranchNode {
  id: string; // graph node id
  label: string; // human-friendly label
  sceneIdRef: string; // the SceneV2.id rendered for this node
}

export interface BranchEdge {
  from: string; // node id
  to: string; // node id
  condition: BranchCondition;
}

export type BranchCondition = {
  equals?: string;
  in?: string[];
  scoreGte?: number;
};

/** ---------- Assets & styling ---------- */

export interface ModuleAssets {
  globalImageStyle: ImageStyleSpec;
  mediaLicencesNote?: string;
}

export interface ImageStyleSpec {
  artDirection: "photo-real" | "illustration" | "flat-ui" | "isometric" | string;
  lens?: "16mm" | "24mm" | "35mm" | "50mm" | "85mm" | string;
  lighting?: "high-key" | "soft daylight" | "studio" | string;
  colourGrade?: "cool corporate" | "warm natural" | string;
  brandTreatment: "subtle" | "strong" | string;
  aspect: "16:9" | string;
}

/** ---------- Scenes & interactions ---------- */

export type SceneType =
  | "Informative"
  | "Interactive"
  | "Assessment"
  | "BranchHub"
  | "InteractiveVideo";

export type SceneLayout =
  | "Standard"
  | "Hero"
  | "Cards3"
  | "DragDrop2Stage"
  | "MCQ"
  | "VideoPlayer"
  | string;

export interface SceneV2 {
  id: string; // unique within module
  ordinal: number; // 1..n
  title: string;
  type: SceneType;
  layout: SceneLayout;

  /** Content */
  ost: string; // On-Screen Text (≤70 words; validated by linter)
  narration: string; // Voiceover script (can be >70 words)

  /** Optional per-scene override */
  voiceoverOverride?: Partial<VoiceoverSpec>;

  /** Visuals */
  image?: {
    prompt: string; // AI prompt for generation
    altText: string; // required if image present (per AccessibilitySpec)
    style?: Partial<ImageStyleSpec>;
    generatedImageUrl?: string; // populated by image generation pipeline
    attribution?: string; // optional, if using licensed stock
  };

  /** Interaction contract (None if not interactive) */
  interaction?: InteractionSpec;

  /** Developer & telemetry notes */
  dev: DevNotes;

  /** Estimated dwell time; generator computes and normaliser can adjust */
  timingSec?: number;
}

export interface DevNotes {
  variables?: Record<string, string | number | boolean>;
  states?: string[]; // e.g., ["idle","dragging","correct","incorrect","completed"]
  accessibilityNotes?: string;
  xapiEvents?: Array<{
    event: string; // e.g., "launched","answered","interacted"
    when: string; // description or state transition
    props?: Record<string, any>;
  }>;
}

/** ---------- Interaction DSL ---------- */

export type InteractionSpec =
  | { kind: "None" }
  | DragDropSpec
  | MCQSpec
  | InteractiveVideoSpec
  | BranchHubSpec;

export interface DragDropSpec {
  kind: "DragDrop";
  stages: Array<{
    id: string;
    prompt: string;
    draggables: string[]; // visible labels
    targets: string[]; // bin labels
    correctMap: Record<string, string>; // draggable -> target
    feedback: { correct: string; incorrect: string };
    ui: { allowReset: boolean; checkButtonLabel: string };
  }>;
}

export interface MCQOption {
  id: string;
  text: string;
  isCorrect: boolean;
  coaching: string; // shown after answer
}

export interface MCQItem {
  id: string;
  stem: string;
  options: MCQOption[];
  singleSelect: boolean; // true = radio; false = multi-select
}

export interface MCQSpec {
  kind: "MCQ";
