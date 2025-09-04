/**
 * ==================================================================
 * STORYBOARD TYPES — Brandon Hall Enriched (Global, Required)
 * ==================================================================
 * Purpose:
 * - Provide a single source of truth for schema used across
 *   frontend + backend.
 * - Enforce high-fidelity, AI-ready structure for visuals, audio,
 *   interactions, xAPI and timing while preserving legacy shape.
 * - Backward compatible with existing components (Display, PDF).
 * ==================================================================
 */

/* =========================================================
 * Core enums & unions
 * =======================================================*/

export enum ModuleLevel {
  Level1 = "Level 1",
  Level2 = "Level 2",
  Level3 = "Level 3",
  Level4 = "Level 4",
}

// Matches your product taxonomy
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

/* =========================================================
 * Authoring form data (frontend)
 * =======================================================*/

export interface CompanyImage {
  id?: string;            // local ID if created client-side
  url?: string;           // URL if stored remotely
  fileName?: string;      // original filename (for upload)
  description?: string;   // what is it, brand guidance
  intendedUse?: string;   // e.g., "Welcome scene background"
  suggestedUse?: string;  // older alias
}

export interface StoryboardFormData {
  moduleName: string;
  moduleType: ModuleType;
  complexityLevel: string;            // e.g., "Level 3"
  tone: Tone;
  outputLanguage: SupportedLanguage;
  organisationName: string;
  targetAudience: string;

  // Duration: both numeric and legacy string (we prefer numeric)
  durationMins?: number;              // drives target scenes and timing
  duration?: string;                  // legacy free text (optional)

  brandGuidelines: string;
  fonts: string;
  colours: string;
  logoUrl?: string;

  learningOutcomes: string;           // author-entered; system will normalise
  content: string;                    // source/RAG text
  additionalNotes?: string;

  // Instructional methodology + model choice
  preferredMethodology?: string;      // e.g., "ADDIE", "Gagné"
  aiModel?: string;

  // Optional brand assets
  companyImages?: CompanyImage[];
}

/* =========================================================
 * Brandon Hall — structured visual brief
 * =======================================================*/

export interface VisualGenerationBrief {
  sceneDescription: string;
  style: string;           // e.g., "Photorealistic", "3D Render", "Vector Art"
  subject?: Record<string, any>; // who/what + action/context
  setting?: string;        // environment details
  composition?: string;    // shot type, angle, DoF
  lighting?: string;       // soft/direct, warm/cool, etc.
  colorPalette?: string[]; // precise HEX list
  mood?: string;           // e.g., "Inspiring", "Calm"
  brandIntegration?: string; // how to integrate brand
  negativeSpace?: string;  // e.g., "30% top-right"
  assetId?: string;        // when a visual is generated, ID can be stored here
}

export type AspectRatio = "16:9" | "1:1" | "4:5" | "9:16" | string;
export type VisualMediaType = "Image" | "Graphic" | "Animation" | "Video";

/**
 * Componentised overlay elements that sit on top of the background visual.
 * These are also usable inside ScreenLayout specs.
 */
export type OverlayElementType =
  | "Background"
  | "TitleText"
  | "BodyText"
  | "Logo"
  | "Button"
  | "DynamicText"
  | "VectorIcon"
  | "TwoColumnLayout"
  | "HotspotCanvas"
  | "Media";

export interface ElementStyle {
  fontFamily?: string;
  fontWeight?: "Light" | "Regular" | "Medium" | "SemiBold" | "Bold" | string;
  fontSize?: string;               // "48pt" | "24px"
  color?: string;                  // HEX
  alignment?: "Left" | "Center" | "Right" | "Top" | "Bottom" | "Bottom-Right" | string;
  position?: string;               // "Top third", "Centered", coordinates if needed
  padding?: string;                // "15px 0"
  border?: string;                 // "1px dashed #B877D5"
  animation?: string;              // "FadeIn 0.5s"
}

export interface OverlayElement {
  elementType: OverlayElementType;
  content?: string;                // text; or semantic label for logos/icons
  placement?: string;              // e.g., "Adjacent to pronunciation text"
  style?: ElementStyle;
  aiGenerationDirective?: string;  // explicit micro-brief for AI
  // Flexible payload for complex elements (e.g., columns, hotspots)
  [key: string]: any;
}

export interface VisualSpec {
  mediaType: VisualMediaType;
  style: string;
  visualGenerationBrief: VisualGenerationBrief; // hyper-specific AI brief
  aiPrompt?: string;        // short legacy summary (for compatibility)
  altText: string;          // ≤ 125 chars for a11y
  aspectRatio: AspectRatio;
  composition?: string;
  environment?: string;
  overlayElements?: OverlayElement[]; // NEW: foreground layers (title, icons, etc.)
  previewUrl?: string;      // optional preview for UI
}

/* =========================================================
 * Overlay / Layout componentisation (screen layout)
 * =======================================================*/

export type ScreenLayoutSpec =
  | string
  | {
      description: string;         // short summary
      elements: Array<OverlayElement | Record<string, any>>;
    };

/* =========================================================
 * Audio (Voiceover) directives
 * =======================================================*/

export interface VoiceParameters {
  persona: string;                 // "Warm, professional, encouraging"
  gender?: "Female" | "Male" | "Neutral" | string;
  pace: string;                    // "Moderate (110–130 WPM)"
  tone: string;                    // "Reassuring", "Authoritative"
  emphasis?: string;               // phrases/keywords to stress
}

export interface AudioSpec {
  script: string;                  // complete voiceover script
  voiceParameters: VoiceParameters;
  backgroundMusic?: string;        // e.g., "Subtle ambient instrumental"
  aiGenerationDirective?: string;  // e.g., "[AI Generate: VO at 150 WPM...]"
}

/* =========================================================
 * Interaction details + xAPI
 * =======================================================*/

export type InteractionType =
  | "None"
  | "MCQ"
  | "Drag & Drop"
  | "Scenario"
  | "Clickable Hotspots"
  | "Reflection"
  | "Interactive Video"
  | "Simulation"
  | string;

export interface XapiEvent {
  verb: "responded" | "interacted" | "experienced" | "selected" | string;
  object: string;                  // unique ID (e.g., "ICS_S2", "Scenario3_ChoiceA")
  result?: Record<string, any>;    // {"score":1} | {"choices":["A"],"outcome":"Neutral"} …
}

export interface DecisionFeedback {
  text: string;
  tone?: string;
  visualCue?: string;              // e.g., "green border", "shake animation"
}

export interface DecisionRule {
  choice: string;                  // "A" | "B" | "C" | a label
  feedback?: DecisionFeedback;
  xapi?: XapiEvent;
  navigateTo?: string;             // e.g., "p10A" for branching
}

export interface InteractionDetails {
  interactionType: InteractionType;
  aiActions?: string[];            // granular steps for AI UI behaviour
  aiDecisionLogic?: DecisionRule[]; // branching or per-option feedback
  retryLogic?: string;             // e.g., "Allow 2 retries; reveal after second"
  completionRule?: string;         // e.g., "All hotspots clicked"
  data?: any;                      // flexible payload
  xapiEvents?: XapiEvent[];        // optional, pre-declared statements
  aiGenerationDirective?: string;  // micro-brief for building the interaction
}

/* =========================================================
 * Knowledge checks (optional, used by UI)
 * =======================================================*/

export type KnowledgeCheckOption =
  | string
  | {
      text: string;
      correct?: boolean;
      feedback?: string;
    };

export interface KnowledgeCheck {
  stem?: string;                   // preferred
  question?: string;               // legacy alias
  options?: KnowledgeCheckOption[];
  answer?: string | string[];      // if explicit
}

/* =========================================================
 * Event (optional per scene)
 * =======================================================*/

export interface StoryboardEvent {
  eventNumber: number;
  onScreenText?: string;
  audio?: { script?: string };
  developerNotes?: string;
  interactive?: { behaviourExplanation?: string }; // legacy tolerance
}

/* =========================================================
 * Scene / Page
 * =======================================================*/

export interface TimingSpec {
  estimatedSeconds: number;
}

export interface StoryboardScene {
  // Identity
  sceneNumber: number;
  pageTitle: string;

  // Optional page kind for analytics / filters
  pageType?: "Informative" | "Interactive" | "Assessment" | string;

  // Layout (new structured, legacy string tolerated)
  screenLayout: ScreenLayoutSpec;
  templateId?: string;
  screenId?: string;

  // Audio (structured) + legacy mirror
  audio: AudioSpec;
  narrationScript: string;         // legacy mirror of audio.script

  // OST (≤ 70 words, not a VO duplicate)
  onScreenText: string;

  // Visuals (aspectRatio can also be reflected here if needed by renderers)
  visual: VisualSpec;
  aspectRatio?: AspectRatio;       // convenience mirror of visual.aspectRatio

  // Interactivity (structured) + legacy mirrors
  interactionDetails?: InteractionDetails;  // detailed directives
  interactionType: InteractionType;         // legacy summary string
  interactionDescription?: string;          // legacy free text

  // Developer + Accessibility
  developerNotes?: string;                  // include option-level feedback, xAPI hints
  accessibilityNotes?: string;              // captions, keyboard path, focus order

  // Timing for module rollup
  timing: TimingSpec;

  // Optional enrichments used by UI/legacy
  events?: StoryboardEvent[];
  generatedImageUrl?: string;               // preview image if already generated

  // Knowledge check (legacy tolerance used by UI)
  knowledgeCheck?: KnowledgeCheck;
  knowledgeChecks?: KnowledgeCheck[];
}

/** Legacy alias for backwards compatibility */
export type StoryboardPage = StoryboardScene;

/* =========================================================
 * Module-level metadata
 * =======================================================*/

export interface RevisionHistoryItem {
  dateISO: string;                 // YYYY-MM-DD
  change: string;                  // "Initial AI draft"
  author: string;                  // "OpenAI" | human name
}

export interface PronunciationGuideItem {
  term: string;
  pronunciation: string;
  note?: string;
}

export interface TableOfContentsItem {
  pageNumber: number;
  title: string;
}

export interface ModuleTiming {
  targetMinutes: number;
  totalEstimatedMinutes: number;
  perSceneSeconds: number[];
}

export interface StoryboardMetadata {
  moduleTiming?: ModuleTiming;
  completionRule?: string;
  brand?: {                        // NEW: matches system prompt’s brand block
    colours?: string;
    fonts?: string;
    guidelines?: string;
  };
  warnings?: string[];
  [key: string]: any;
}

/* =========================================================
 * Master module object
 * =======================================================*/

export interface StoryboardModule {
  // Core
  moduleName: string;

  // Brandon Hall headers
  revisionHistory?: RevisionHistoryItem[];
  pronunciationGuide?: PronunciationGuideItem[];

  // TOC (string[] or structured)
  tableOfContents?: string[] | TableOfContentsItem[];

  // Scenes (primary) + pages (legacy tolerance)
  scenes: StoryboardScene[];
  pages?: StoryboardScene[]; // some older flows still use "pages"

  // Enriched metadata
  metadata?: StoryboardMetadata;

  // Optional additional fields for Phase 1 structure (non-breaking)
  moduleOverview?: string;
  durationMinutes?: number;
  learningLevel?: ModuleLevel | string; // keep string for compatibility
  targetAudience?: string;
  moduleGoal?: string;
}

/* =========================================================
 * Helper: minimal type guards (optional)
 * =======================================================*/

export function isScreenLayoutObject(
  layout: ScreenLayoutSpec
): layout is Exclude<ScreenLayoutSpec, string> {
  return !!layout && typeof layout === "object" && "description" in layout;
}

export function isTableOfContentsItemArray(
  toc: StoryboardModule["tableOfContents"]
): toc is TableOfContentsItem[] {
  return Array.isArray(toc) && toc.length > 0 && typeof (toc as any)[0]?.pageNumber === "number";
}