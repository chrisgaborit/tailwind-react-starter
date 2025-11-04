/**
 * ==================================================================
 * SHARED TYPES FOR STORYBOARD GENERATOR
 * (Upgraded with AI visual briefs, rich interactions, audio directives,
 *  and metadata — while remaining backward-compatible with existing code)
 * ==================================================================
 */

/* ---------------------------------------
   Levels / Module kinds / Tone / Language
----------------------------------------*/

export enum ModuleLevel {
  Level1 = "Level 1",
  Level2 = "Level 2",
  Level3 = "Level 3",
  Level4 = "Level 4",
}

// Matches your MODULE_TYPES array used in the UI
export type ModuleType =
  | "Compliance"
  | "Onboarding & Induction"
  | "Product Training"
  | "Soft Skills & Leadership"
  | "Systems & Process Training"
  | "Customer Service"
  | "Health, Safety & Wellbeing"
  | "Sales & Marketing"
  | "Technical or Systems Training"
  | "Personal Development";

export const MODULE_TYPES: ModuleType[] = [
  "Compliance",
  "Onboarding & Induction",
  "Product Training",
  "Soft Skills & Leadership",
  "Systems & Process Training",
  "Customer Service",
  "Health, Safety & Wellbeing",
  "Sales & Marketing",
  "Technical or Systems Training",
  "Personal Development",
];

export type Tone =
  | "Professional & Clear"
  | "Warm & Supportive"
  | "Confident & Persuasive"
  | "Conversational & Friendly"
  | "Inspirational & Uplifting"
  | "Playful & Engaging";

export type SupportedLanguage =
  | "English (US)"
  | "English (UK)"
  | "Spanish"
  | "French"
  | "German"
  | "Chinese (Simplified)"
  | "Arabic"
  | "Portuguese (Brazil)"
  | "Russian"
  | "Japanese"
  | "Hindi (Devanagari)"
  | "Tamil"
  | "Telugu"
  | "Marathi (Devanagari)";

/* ---------------------------------------
   Form data (used by StoryboardForm)
----------------------------------------*/

export interface StoryboardFormData {
  moduleName: string;
  moduleType: ModuleType;
  complexityLevel: string; // keep as string to match current UI (e.g., "Level 3")
  tone: Tone;
  outputLanguage: SupportedLanguage;
  organisationName: string;
  targetAudience: string;

  /** Either legacy free-text or derived from durationMins in the UI; backend normalises */
  duration: string;

  brandGuidelines: string;
  fonts: string;
  colours: string;
  logoUrl?: string;

  learningOutcomes: string;
  content: string;
  additionalNotes?: string;

  /** Optional advanced selections (used by Instructional Methodology) */
  preferredMethodology?: string;
  primaryLearningMode?: LearningMode;
  instructionalPurpose?: InstructionalPurpose;

  /** New (numeric) duration mins is stored/used in state; kept optional here for compatibility */
  durationMins?: number;

  /** Optional: image metadata passed to backend alongside uploads */
  companyImages?: CompanyImage[];

  /** Optional: which AI model to use */
  aiModel?: string;

  /** Optional: ask backend to generate images now */
  generateImages?: boolean;
}

/* ---------------------------------------
   Auxiliary enums used by UI components
----------------------------------------*/

export enum LearningMode {
  SelfPaced = "Self-paced",
  InstructorLed = "Instructor-led",
  VirtualClass = "Virtual classroom",
  Blended = "Blended",
}

export enum InstructionalPurpose {
  Awareness = "Awareness",
  Knowledge = "Knowledge",
  Skill = "Skill / Practice",
  Behaviour = "Behaviour change",
  Assessment = "Assessment / Certification",
}

/* ---------------------------------------
   Company image metadata (used by uploads)
----------------------------------------*/

export interface CompanyImage {
  /** Optional local ID for UI */
  id?: string;
  /** Original filename (binary is sent separately if uploaded) */
  fileName?: string;
  /** Optional embedded DataURL if captured client-side */
  dataUrl?: string;
  /** Short description of the image (for AI prompt/context) */
  description?: string;
  /** Where the author wants it used (scene/section) */
  intendedUse?: string;
}

/* ---------------------------------------
   Visual / Layout — AI Visual Generation Brief
----------------------------------------*/

/** Optional, structured screen layout (componentised). Can also be a simple string. */
export type ScreenLayoutSpec =
  | string
  | {
      description: string;
      elements: Array<
        | {
            elementType:
              | "Background"
              | "TitleText"
              | "TwoColumnLayout"
              | "ListOfItems"
              | "DynamicTextArea"
              | "VectorIcon"
              | "Hotspots"
              | "CardList"
              | "Button"
              | "Video"
              | "Animation"
              | "Image"
              | "Caption";
            /** Arbitrary attributes per element (kept flexible for growth). */
            [key: string]: any;
          }
      >;
    };

/** New: highly specific AI visual generation brief (supersedes generic "aiPrompt"). */
export interface VisualGenerationBrief {
  sceneDescription: string;
  style:
    | "Photorealistic"
    | "Vector Art"
    | "Flat Design"
    | "Illustration"
    | "3D Render"
    | "Abstract"
    | string;
  subject?: {
    primarySubject?: string;
    action?: string;
    setting?: string;
    lighting?: string;
    /** E.g., “3–5 diverse professionals collaborating around a table” */
    details?: string;
  };
  composition?: string; // e.g., "Medium shot, eye-level, shallow depth of field"
  colorPalette?: string[]; // e.g., ["#FFFFFF","#F0F0F0","#B877D5","#1A1A1A"]
  mood?: string; // e.g., "Inspiring, Professional, Calm"
  brandIntegration?: string; // e.g., "Subtle Brilliant Blue accents; logo on corner card"
  /** For interactions: specify UI states/variants needed in the visual */
  uiStates?: string[];
}

/** Image recipe saved with each generated asset */
export interface ImageParams {
  prompt: string;
  style?: string;        // e.g., "photo-realistic"
  size?: string;         // e.g., "1280x720"
  seed?: number;
  model?: string;        // e.g., "imagen-3-nano"
  safetyFilter?: "on" | "off";
  enhancements?: string[];
  version?: number;
}

/** Backwards-compatible visual object used in scenes. */
export interface VisualSpec {
  mediaType: "Image" | "Graphic" | "Animation" | "Video" | string;
  style: string;
  /** Legacy free-form prompt kept for compatibility */
  aiPrompt?: string;
  altText: string;
  aspectRatio: "16:9" | "1:1" | "4:5" | string;
  composition?: string;
  environment?: string;
  /** Optional colour palette shorthand provided by upstream agents */
  colorPalette?: string[];

  /** New: richly detailed, AI-ready visual brief */
  visualGenerationBrief?: VisualGenerationBrief;

  /** New: where the generated image is stored */
  generatedImageUrl?: string;

  /** New: full recipe used to create the image */
  imageParams?: ImageParams;

  /** Optional: asset identifier used by the build pipeline */
  assetId?: string;
}

/* ---------------------------------------
   Interaction Details & AI decision logic
----------------------------------------*/

export interface InteractionDecision {
  choice: string; // e.g., "A"
  feedback: {
    text: string;
    tone?: string;
    visualCue?: string;
  };
  xapi?: {
    verb: string; // e.g., "responded"
    object: string; // e.g., "SelfEsteem_S7_ChoiceA"
    result?: Record<string, any>;
  };
}

export interface InteractionDetails {
  /** High-level type; mirrors interactionType but is structured */
  interactionType:
    | "MCQ"
    | "Scenario"
    | "Clickable Hotspots"
    | "Drag & Drop"
    | "Reflection"
    | "Interactive Video"
    | string;

  /** Concrete UI/UX actions the AI or developer should implement */
  aiActions?: string[];

  /** Per-choice decision mapping, feedback and xAPI */
  aiDecisionLogic?: InteractionDecision[];

  /** Retry/attempt rules */
  retryLogic?: string;

  /** Completion rule for this scene only (module-level rule can also exist) */
  completionRule?: string;

  /** Optional content payload used by specific interactions (e.g., items for DnD) */
  data?: any;
}

/* ---------------------------------------
   Audio directives (narration/VO)
----------------------------------------*/

export interface AudioVoiceParameters {
  persona: string; // e.g., "Warm, professional, encouraging"
  gender?: string; // optional: "Female" | "Male" | "Neutral"
  pace?: string; // e.g., "Moderate, deliberate (110–140 WPM)"
  tone?: string; // e.g., "Slightly inspirational, reassuring, clear"
  emphasis?: string[]; // e.g., ["Internal Consulting Skills","action","conversations"]
}

export interface AudioDirectives {
  script: string; // full VO script
  voiceParameters?: AudioVoiceParameters;
  backgroundMusic?: string; // brief instruction for BGM, if any
}

/* ---------------------------------------
   Scene (PRIMARY unit used by backend)
----------------------------------------*/

export interface Scene {
  sceneNumber: number;
  pageTitle: string;
  /** Optional legacy variations */
  title?: string;
  pageType?: string;

  /** Can be a plain string OR a structured, componentised layout spec */
  screenLayout: ScreenLayoutSpec;

  /** Template or screen IDs used by your build engine (kept optional) */
  templateId?: string;
  screenId?: string;

  /** Narration script (VO) and OST (≤ ~70 words enforced elsewhere) */
  narrationScript: string;
  onScreenText: string;

  /** Visual (legacy prompt + new visualGenerationBrief) */
  visual: VisualSpec;

  /** Legacy simple interaction fields */
  interactionType: string; // e.g., "MCQ"
  interactionDescription: string;

  /** NEW: full interaction contract (detailed logic + xAPI) */
  interactionDetails?: InteractionDetails;

  /** Dev & accessibility notes */
  developerNotes: string;
  accessibilityNotes: string;

  /** Optional timing to help total module planning */
  timing?: {
    /** Rough time spent on this scene (in seconds) */
    estimatedSeconds?: number;
  };

  /** Optional: AI-ready audio directives (full script + voice params) */
  audio?: AudioDirectives;

  /** Convenience duplicates for image access at scene level */
  imageUrl?: string;          // mirrors visual.generatedImageUrl
  imageParams?: ImageParams;  // mirrors visual.imageParams
}

/* ---------------------------------------
   Legacy “pages/events” (kept for compatibility)
----------------------------------------*/

export interface InteractionObject {
  type: string;
  layout: string;
  elements: { [key: string]: string } | Array<{ [key: string]: string }>;
  userBehavior: string;
}

export interface InternalDevelopmentNotes {
  visualDescription: string;
  layout: string;
  interactions: string | InteractionObject;
  branchingLogic: string;
  developerComments: string;
  imagePrompt: string;
}

export interface Event {
  eventNumber: number;
  onScreenText: string;
  aiProductionBrief: {
    audio: {
      script: string;
      voice: string;
      pacing: string;
    };
    visual: {
      mediaType: string;
      style: string;
      subject: string;
      composition: string;
      environment: string;
      lighting: string;
      colorPalette: {
        primary: string;
        secondary: string;
        accent: string;
      };
      animationSpec?: string;
    };
    interactive: {
      interactionType: string;
      data?: any;
    };
    branchingLogic: string;
  };
  generatedImageUrl?: string;
}

export interface StoryboardPage {
  pageNumber: number;
  pageTitle: string;
  events: Event[];
}

/* ---------------------------------------
   Module metadata (revision, glossary, ToC)
----------------------------------------*/

export interface RevisionHistoryItem {
  dateISO: string; // e.g., "2025-08-21"
  change: string; // e.g., "Initial AI draft"
  author: string; // e.g., "OpenAI"
}

export interface PronunciationGuideItem {
  term: string;
  pronunciation: string;
  note?: string;
}

/** Simple string list ToC used in the new schema */
export type TableOfContents = string[];

/** Legacy ToC entry (kept for compatibility if needed elsewhere) */
export interface TableOfContentsItem {
  pageNumber: number;
  title: string;
}

/* ---------------------------------------
   PRIMARY module shape used across app/backend
   (scenes-first, with legacy “pages” optional)
----------------------------------------*/

export interface StoryboardModule {
  moduleName: string;

  /** Optional high-level learning outcomes (string; UI may also store per-scene OST/VO) */
  learningOutcomes?: string;

  /** Brandon Hall / audit metadata */
  revisionHistory?: RevisionHistoryItem[];

  /** First-four requirement: this should be populated and referenced in early scenes */
  pronunciationGuide?: PronunciationGuideItem[];

  /** Table of contents as a simple array of section/scene titles */
  tableOfContents?: TableOfContents;

  /** The canonical scene array used by the generator and PDF export */
  scenes: Scene[];

  /** Optional legacy structure for backward compatibility */
  pages?: StoryboardPage[];

  /** Optional module-level metadata & completion rule */
  metadata?: {
    completionRule?: string;
    warnings?: string[];
    /** Optional: total planned time in minutes */
    estimatedMinutes?: number;
    /** Optional: brand palette for AI */
    colorPalette?: string[];
  };
}
