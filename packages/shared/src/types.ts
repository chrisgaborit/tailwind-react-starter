/**
 * ==================================================================
 * MASTER TYPES - SINGLE SOURCE OF TRUTH
 * ==================================================================
 * 
 * This file contains ALL type definitions used across the application.
 * 
 * CONTRACT-FIRST DEVELOPMENT RULES:
 * 1. ALL schema changes must start here
 * 2. Mark new fields as optional (field?: string) until fully wired
 * 3. Once stable, make fields required
 * 4. All imports must come from this file
 * 5. Never redefine types locally
 * 
 * ==================================================================
 */

/* =========================================================
 * Core Enums & Constants
 * =======================================================*/

export enum ModuleLevel {
  Level1 = "Level 1",
  Level2 = "Level 2", 
  Level3 = "Level 3",
  Level4 = "Level 4",
}

export type ModuleType =
  | "Compliance & Ethics"
  | "Leadership & Coaching"
  | "Sales & Customer Service"
  | "Technical & Systems"
  | "Health & Safety"
  | "Onboarding & Culture"
  | "Product Knowledge"
  | "Professional Skills";

export const MODULE_TYPES: ModuleType[] = [
  "Compliance & Ethics",
  "Leadership & Coaching", 
  "Sales & Customer Service",
  "Technical & Systems",
  "Health & Safety",
  "Onboarding & Culture",
  "Product Knowledge",
  "Professional Skills",
];

// Pedagogical phase constants for outcome-driven learning
export const PedagogicalPhase = {
  LEARN: "LEARN",    // Explain the concept and "why it matters"
  SEE: "SEE",        // Show it done right via characters
  DO: "DO",          // Give safe, scaffolded practice with feedback
  APPLY: "APPLY"     // Capstone branching scenario synthesising all outcomes
} as const;

// Template type constants for page classification
export const TemplateType = {
  INTERNAL_PREFACE: "INTERNAL_PREFACE",
  LEARNER_START: "LEARNER_START",
  TABLE_OF_CONTENTS: "table_of_contents",
  PRONUNCIATIONS_ACRONYMS: "pronunciations_acronyms"
} as const;

// Phase type for pedagogical flow
export type PedagogicalPhaseType = "LEARN" | "SEE" | "DO" | "APPLY";

// Legacy learning phase type (for backward compatibility)
export type LearningPhaseType = "experience" | "discover" | "learn" | "practice";

// Template type for page classification
export type TemplateTypeValue = "INTERNAL_PREFACE" | "LEARNER_START" | "table_of_contents" | "pronunciations_acronyms";

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

export type VisualMediaType = "Image" | "Graphic" | "Animation" | "Video";
export type AspectRatio = "16:9" | "1:1" | "4:5" | "9:16" | string;

/* =========================================================
 * Form Data (Frontend Input)
 * =======================================================*/

export interface CompanyImage {
  id?: string;
  url?: string;
  fileName?: string;
  description?: string;
  intendedUse?: string;
  suggestedUse?: string; // Legacy alias
}

export interface StoryboardFormData {
  moduleName: string;
  moduleType: ModuleType;
  complexityLevel: string;
  tone: Tone;
  outputLanguage: SupportedLanguage;
  organisationName: string;
  targetAudience: string;

  // Duration: prefer numeric, keep string for legacy
  durationMins?: number;
  duration?: string;

  brandGuidelines: string;
  fonts: string;
  colours: string;
  logoUrl?: string;

  learningOutcomes: string;
  content: string;
  additionalNotes?: string;

  // Optional advanced selections
  preferredMethodology?: string;
  aiModel?: string;
  companyImages?: CompanyImage[];
}

/* =========================================================
 * Visual Generation & Layout
 * =======================================================*/

export interface VisualGenerationBrief {
  sceneDescription: string;
  style: string;
  subject?: Record<string, any>;
  setting?: string;
  composition?: string;
  lighting?: string;
  colorPalette?: string[];
  mood?: string;
  brandIntegration?: string;
  negativeSpace?: string;
  assetId?: string;
}

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
  fontSize?: string;
  color?: string;
  alignment?: "Left" | "Center" | "Right" | "Top" | "Bottom" | "Bottom-Right" | string;
  position?: string;
  padding?: string;
  border?: string;
  animation?: string;
}

export interface OverlayElement {
  elementType: OverlayElementType;
  content?: string;
  placement?: string;
  style?: ElementStyle;
  aiGenerationDirective?: string;
  [key: string]: any;
}

export interface VisualSpec {
  mediaType: VisualMediaType;
  style: string;
  visualGenerationBrief: VisualGenerationBrief;
  aiPrompt?: string;
  altText: string;
  aspectRatio: AspectRatio;
  composition?: string;
  environment?: string;
  overlayElements?: OverlayElement[];
  previewUrl?: string;
  assetId?: string; // Legacy compatibility
}

export type ScreenLayoutSpec =
  | string
  | {
      description: string;
      elements: Array<OverlayElement | Record<string, any>>;
    };

/* =========================================================
 * Audio & Voice
 * =======================================================*/

export interface VoiceParameters {
  persona: string;
  gender?: "Female" | "Male" | "Neutral" | string;
  pace: string;
  tone: string;
  emphasis?: string;
}

export interface AudioSpec {
  script: string;
  voiceParameters: VoiceParameters;
  backgroundMusic?: string;
  aiGenerationDirective?: string;
}

/* =========================================================
 * Interactions & xAPI
 * =======================================================*/

export interface XapiEvent {
  verb: "responded" | "interacted" | "experienced" | "selected" | string;
  object: string;
  result?: Record<string, any>;
}

export interface DecisionFeedback {
  text: string;
  tone?: string;
  visualCue?: string;
}

export interface DecisionRule {
  choice: string;
  feedback?: DecisionFeedback;
  xapi?: XapiEvent;
  navigateTo?: string;
}

export interface InteractionDetails {
  interactionType: InteractionType;
  aiActions?: string[];
  aiDecisionLogic?: DecisionRule[];
  retryLogic?: string;
  completionRule?: string;
  data?: any;
  xapiEvents?: XapiEvent[];
  aiGenerationDirective?: string;
}

/* =========================================================
 * Knowledge Checks
 * =======================================================*/

export type KnowledgeCheckOption =
  | string
  | {
      text: string;
      correct?: boolean;
      is_correct?: boolean; // Alternative property name
      feedback?: string;
    };

export interface KnowledgeCheck {
  stem?: string;
  question?: string; // Legacy alias
  type?: string; // Type of knowledge check
  instruction?: string; // Instruction text
  options?: KnowledgeCheckOption[];
  answer?: string | string[] | (string | number)[];
}

/* =========================================================
 * Events & Timing
 * =======================================================*/

export interface StoryboardEvent {
  eventNumber: number;
  onScreenText?: string;
  audio?: { script?: string };
  developerNotes?: string;
  interactive?: { behaviourExplanation?: string };
}

export interface TimingSpec {
  estimatedSeconds: number;
  targetSeconds?: number;
}

/* =========================================================
 * Core Scene Interface
 * =======================================================*/

export interface StoryboardScene {
  // Identity
  sceneNumber: number;
  pageTitle: string;
  
  // Legacy compatibility properties
  id?: string | number;
  title?: string;
  sceneTitle?: string;
  pageNumber?: number;
  screenType?: string;

  // Page classification
  pageType?: "Informative" | "Interactive" | "Assessment" | string;
  
  // Pedagogical purpose for teaching-first pipeline
  pedagogical_purpose?: PedagogicalPurpose;

  // Layout
  screenLayout: ScreenLayoutSpec;
  templateId?: string;
  screenId?: string;

  // Audio
  audio: AudioSpec;
  narrationScript: string; // Legacy mirror of audio.script
  narration?: string; // Alternative property name used in some places

  // On-screen text
  onScreenText: string | {
    title?: string;
    body_text?: string[];
    bullet_points?: string[];
    continue_prompt?: string;
  };
  visualDescription?: string; // Legacy compatibility
  imagePrompt?: string; // Legacy compatibility

  // Visuals
  visual: VisualSpec;
  aspectRatio?: AspectRatio; // Convenience mirror

  // Interactivity
  interactionDetails?: InteractionDetails;
  interactionType: InteractionType;
  interactionDescription?: string;
  interactions?: string; // Legacy compatibility
  userInstructions?: string; // Legacy compatibility

  // Developer & Accessibility
  developerNotes?: string;
  accessibilityNotes?: string;

  // Timing
  timing: TimingSpec;

  // Optional enrichments
  events?: StoryboardEvent[];
  generatedImageUrl?: string;
  learningObjectivesCovered?: string; // Legacy compatibility
  isIncidentFlow?: boolean; // Legacy compatibility
  decisions?: any[]; // Legacy compatibility

  // Knowledge checks
  knowledgeCheck?: KnowledgeCheck;
  knowledgeChecks?: KnowledgeCheck[];

  // New fields for internal pages and learning phases
  scene_id?: string;
  internalPage?: boolean;
  templateType?: TemplateTypeValue;
  phase?: LearningPhaseType | PedagogyPhase;  // Support both legacy and new pedagogy phases
  learningOutcomeRefs?: string[]; // array of LO ids this scene supports
  instructionalPurpose?: "Teach" | "Demonstrate" | "Practice" | "Assess";
  
  // Legacy fields for backward compatibility with old ensureFirstFour logic
  internalOnly?: boolean;
  layout?: string;
  visuals?: string;
  metadata?: {
    type?: string;
    internal?: boolean;
    tags?: string[];
    learningPhase?: string;
    phaseTitle?: string;
    [key: string]: any;
  };
}

// Legacy alias for backwards compatibility
export type StoryboardPage = StoryboardScene;

/* =========================================================
 * Module Metadata
 * =======================================================*/

export interface RevisionHistoryItem {
  dateISO: string;
  change: string;
  author: string;
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

// Enhanced project metadata with business impact and categorization
export interface ProjectMetadata {
  title: string;
  businessImpact?: string;   // e.g., "Improve coaching quality; +10% engagement"
  category?: "Leadership" | "Soft Skills" | "Compliance" | "Technical" | "Sales" | "HSE" | "Onboarding" | "Product" | "Professional";
  // Legacy fields for backward compatibility
  moduleName?: string;
  strategicCategory?: string;
  [key: string]: any;
}

export interface StoryboardMetadata {
  moduleTiming?: ModuleTiming;
  completionRule?: string;
  brand?: {
    colours?: string;
    fonts?: string;
    guidelines?: string;
  };
  warnings?: string[];
  colorPalette?: string[];
  company?: string;
  projectCode?: string;
  createdBy?: string;
  globalNotes?: any;
  strategicCategory?: string;
  businessImpact?: {
    metric: string;
    targetImprovement: number;
    timeframe: number;
    successDefinition: string;
  };
  innovationStrategies?: string[];
  measurementApproaches?: string[];
  extras?: Record<string, any>;
  [key: string]: any;
}

/* =========================================================
 * Master Module Interface
 * =======================================================*/

export interface StoryboardModule {
  // Core
  moduleName: string;

  // Enhanced project metadata
  project_metadata?: ProjectMetadata;

  // Learning outcomes and alignment (new framework)
  learningOutcomes?: LearningOutcome[];
  alignmentMap?: AlignmentLink[];

  // Brandon Hall headers
  revisionHistory?: RevisionHistoryItem[];
  pronunciationGuide?: PronunciationGuideItem[];

  // Table of contents
  tableOfContents?: string[] | TableOfContentsItem[];

  // Scenes (primary) + pages (legacy tolerance)
  scenes: StoryboardScene[];
  pages?: StoryboardScene[]; // Legacy compatibility

  // Metadata
  metadata?: StoryboardMetadata;

  // Optional additional fields
  moduleOverview?: string;
  durationMinutes?: number;
  learningLevel?: ModuleLevel | string;
  targetAudience?: string;
  
  // Generation options
  options?: GenerationOptions;
  moduleGoal?: string;
  
  // Brandon Hall export
  brandonHall?: any; // Will be properly typed later
}

/* =========================================================
 * Quality & Validation
 * =======================================================*/

export interface QualityMetrics {
  overallScore: number;
  sceneCount: {
    expected: number;
    actual: number;
    status: "pass" | "fail";
  };
  contentFidelity: {
    score: number;
    issues: string[];
  };
  visualQuality: {
    score: number;
    issues: string[];
  };
  interactionCompleteness: {
    score: number;
    issues: string[];
  };
  accessibilityCompliance: {
    score: number;
    issues: string[];
  };
  brandConsistency: {
    score: number;
    issues: string[];
  };
  recommendations: string[];
}

export interface SceneValidationResult {
  ok: boolean;
  issues: string[];
  warnings: string[];
}

/* =========================================================
 * Learning Framework Types - Outcome-Driven Learn-See-Do-Apply
 * =======================================================*/

// Bloom's Taxonomy verbs for measurable learning outcomes
export type BloomVerb =
  | "remember" | "understand" | "apply" | "analyze" | "evaluate" | "create";

// Pedagogy phases for the Learn-See-Do-Apply framework
export type PedagogyPhase = "LEARN" | "SEE" | "DO" | "APPLY";

// Enhanced Learning Outcome with Bloom's taxonomy integration
export interface LearningOutcome {
  id: string;              // uuid
  verb: BloomVerb;         // e.g., "apply"
  text: string;            // e.g., "apply the four-stage coaching model..."
  context?: string;        // optional context/situation
  measure?: string;        // optional metric/result
  // Legacy fields for backward compatibility
  description?: string;
  level?: string;
  category?: string;
  assessmentCriteria?: string[];
}

// Alignment mapping between learning outcomes and scenes
export interface AlignmentLink {
  outcomeId: string;       // references LearningOutcome.id
  sceneId: string;         // references StoryboardScene.scene_id
  phase: PedagogyPhase;    // learn | see | do | apply
  evidence?: string;       // short note on how the scene serves the LO
}

export interface NarrativeAnchor {
  id: string;
  type: "character" | "scenario" | "concept";
  name: string;
  description: string;
  context: string;
}

export interface PedagogicalApproach {
  method: "SAM" | "MERRILL" | "GAGNE" | "BACKWARD" | "BLOOM";
  phase?: string;
  event?: string;
  stage?: string;
  level?: string;
}

/* =========================================================
 * Pedagogical Intelligence Layer
 * =======================================================*/

export interface LearningObjective {
  id: string;
  description: string;
}

export interface PedagogicalSegment {
  id: string;
  learning_objective: string;
  segment_type: 'teach' | 'example' | 'practice' | 'assessment';
  duration: number;
  description: string;
}

export interface PedagogicalBlueprint {
  id: string;
  learning_objectives: LearningObjective[];
  segments: PedagogicalSegment[];
  total_duration: number;
  pedagogical_strategy: string;
  strategy: 'scaffolded-progressive' | 'case-based' | 'problem-centered' | 'principle-driven';
  learningObjectiveFlow: Array<{
    objective: string;
    teachingApproach: 'metaphor' | 'direct-instruction' | 'discovery' | 'contrast';
    exampleType: 'case-study' | 'scenario' | 'demonstration' | 'analogy';
    practiceModality: 'simulation' | 'drag-drop' | 'branching' | 'reflection';
    assessmentMethod: 'decision-tree' | 'multiple-choice' | 'performance' | 'self-assessment';
    timeAllocation: { teach: number; example: number; practice: number; assess: number };
  }>;
  repetitionGuards: string[];
  clientTerminology: { [key: string]: string };
}

export type PedagogicalPurpose = 'teach' | 'example' | 'scenario' | 'practice' | 'assessment';

export interface ContinuityIssue {
  type: 'repetition' | 'misalignment' | 'complexity-gap' | 'terminology-drift' | 'pedagogical-sequence' | 'character-repetition' | 'abrupt-transition';
  description: string;
  severity: 'high' | 'medium' | 'low';
  scenes: number[];
  recommendation: string;
  evidence?: string;
}

export interface ContinuityReport {
  issues: ContinuityIssue[];
  repairedStoryboard?: StoryboardModule;
  requiresRegeneration: boolean;
  overallScore: number;
  summary: string;
}

export interface EnhancedQuery {
  semanticQuery: string;
  requiredContent: CoreContent;
  exclusionPatterns: string[];
  pedagogicalFilters: {
    mustInclude: string[];
    mustAvoid: string[];
  };
}

export interface CoreContent {
  keyConcepts: string[];
  preferredFrameworks: string[];
  existingExamples: string[];
  terminology: { [key: string]: string };
}

export interface MemoryStore {
  getSimilarPatterns(learningRequest: any): Promise<string>;
  getPedagogicalFailures(): Promise<string>;
  storePattern(pattern: any): Promise<void>;
  storeFailure(failure: any): Promise<void>;
}

export interface LearningRequest {
  topic: string;
  audience: string;
  duration: number;
  objectives: string[];
  difficultyLevel: string;
  topics?: string[];
  sourceMaterial?: SourceMaterial;
}

export interface SourceMaterial {
  summary: string;
  content: string;
  metadata: any;
}

/* =========================================================
 * Generation Options
 * =======================================================*/

export interface GenerationOptions {
  skipAIImages?: boolean; // when true, do NOT call any image agent; keep descriptions only
}

/* =========================================================
 * Type Guards & Utilities
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

export function isValidStoryboardModule(obj: any): obj is StoryboardModule {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.moduleName === "string" &&
    Array.isArray(obj.scenes) &&
    obj.scenes.length > 0
  );
}

/* =========================================================
 * Error Handling
 * =======================================================*/

export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

export interface ValidationError extends AppError {
  field: string;
  value: any;
}

/* =========================================================
 * API Response Types
 * =======================================================*/

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: AppError;
  meta?: {
    modelUsed?: string;
    processingTime?: number;
    timestamp?: string;
  };
}

export interface StoryboardGenerationResponse extends ApiResponse<StoryboardModule> {                                                                           
  meta?: {
    modelUsed: string;
    ragUsed: boolean;
    examples: number;
    requestedLevel: string;
    detectedLevel: string;
    imagesGenerated: boolean;
  };
}

/* =========================================================
 * Content Gap Analysis Types
 * =======================================================*/

export interface ContentGap {
  element: 'teaching' | 'example' | 'scenario' | 'practice' | 'assessment';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: string;
  recommendation: string;
  location: 'specific_scene' | 'throughout_storyboard';
}

export interface ContentGapReport {
  source_material_adequacy: number;
  content_gaps: ContentGap[];
  recommendations: string[];
  can_generate_storyboard: boolean;
}

export interface StoryboardWithGaps extends StoryboardModule {
  content_gaps: ContentGap[];
  source_adequacy_score: number;
  recommendations: string[];
  metadata: {
    source_fidelity: 'strict';
    gap_analysis_performed: boolean;
    generation_constraints: string[];
    gap_count: number;
    adequacy_score: number;
  };
}

export interface GapAnalysisResponse extends ApiResponse<StoryboardWithGaps> {
  analysis: {
    gaps_found: number;
    adequacy_score: number;
    recommendations: string[];
    source_fidelity: 'strict';
  };
}

// All types are exported above as interfaces and types
