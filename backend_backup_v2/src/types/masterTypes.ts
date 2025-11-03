/**
 * ==================================================================
 * MASTER STORYBOARD TYPES - SINGLE SOURCE OF TRUTH
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
 * Generation Options
 * =======================================================*/

export interface GenerationOptions {
  skipAIImages?: boolean; // when true, do NOT call any image agent; keep descriptions only
}

/* =========================================================
 * Core Enums & Constants
 * =======================================================*/

export type ModuleLevel = "Level 1: Passive" | "Level 2: Limited Interactivity" | "Level 3: Complex Interactivity" | "Level 4: Real-time Adaptation";

export type ModuleType = 
  | "Leadership & Management"
  | "Sales & Customer Service"
  | "Technical Skills"
  | "Compliance & Safety"
  | "Onboarding & Culture"
  | "Product Knowledge"
  | "Professional Skills";

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
  | "MCQ"
  | "Scenario"
  | "Drag & Drop"
  | "Hotspot"
  | "Tabbed"
  | "Accordion"
  | "Branching"
  | "Simulation"
  | "Roleplay"
  | "Knowledge Check"
  | "Assessment"
  | "Reflection"
  | "Practice"
  | "None";

/* =========================================================
 * Form Data Types
 * =======================================================*/

export interface CompanyImage {
  name: string;
  url: string;
  alt?: string;
  description?: string;
}

export interface StoryboardFormData {
  moduleName: string;
  moduleType: ModuleType;
  complexityLevel: ModuleLevel;
  durationMins: number;
  tone: Tone;
  targetAudience: string;
  learningObjectives: string;
  content: string;
  businessImpact?: string;
  innovationStrategies?: string[];
  measurementApproaches?: string[];
  selectedFiles?: File[];
  imageFiles?: CompanyImage[];
  aiModel?: string;
  generateImages?: boolean;
  language?: SupportedLanguage;
  
  // Additional properties for backward compatibility
  outputLanguage?: string;
  organisationName?: string;
  duration?: number;
  brandGuidelines?: string;
  fonts?: string;
  colours?: string;
  logoUrl?: string;
  [key: string]: any;
}

/* =========================================================
 * Learning Outcome & Alignment Types
 * =======================================================*/

export interface LearningOutcome {
  id: string;
  verb: string;
  text: string;
  context?: string;
  measure?: string;
  description?: string;
  level?: string;
  category?: string;
  assessmentCriteria?: string[];
}

export interface AlignmentLink {
  outcomeId: string;
  sceneId: string;
  phase: PedagogicalPhaseType;
  evidence?: string;
}

/* =========================================================
 * Storyboard Scene Types
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

  // Content
  visualDescription?: string;
  onScreenText?: string | {
    title?: string;
    body_text?: string[];
    bullet_points?: string[];
    continue_prompt?: string;
  };
  narrationScript?: string;
  narration?: string;

  // Interactions
  interactions?: any[];
  knowledgeCheck?: any;
  interactionType?: InteractionType;
  interactionDescription?: string;
  interactionDetails?: any;

  // New fields for internal pages and learning phases
  scene_id?: string;
  internalPage?: boolean;
  templateType?: TemplateTypeValue;
  phase?: PedagogicalPhaseType | LearningPhaseType;
  learningOutcomeRefs?: string[];
  instructionalPurpose?: "Teach" | "Demonstrate" | "Practice" | "Assess";
  
  // Legacy fields for backward compatibility
  internalOnly?: boolean;
  layout?: string;
  visuals?: string;
  metadata?: {
    type?: string;
    internal?: boolean;
    tags?: string[];
    learningPhase?: string;
    phaseTitle?: string;
    pedagogicalPhase?: string;
    learningOutcome?: string;
    businessRelevance?: string;
    [key: string]: any;
  };
  
  [key: string]: any;
}

/* =========================================================
 * Storyboard Module Types
 * =======================================================*/

export interface StoryboardModule {
  // Core
  moduleName: string;

  // Enhanced project metadata
  project_metadata?: any;

  // Learning outcomes and alignment (new framework)
  learningOutcomes?: LearningOutcome[];
  alignmentMap?: AlignmentLink[];

  // Scenes (primary) + pages (legacy tolerance)
  scenes: StoryboardScene[];
  pages?: StoryboardScene[]; // Legacy compatibility

  // Metadata
  metadata?: {
    moduleTiming?: string;
    performanceSupport?: string[];
    internalPagesCount?: number;
    learnerContentStartsAt?: number;
    pedagogicalFlowApplied?: boolean;
    pedagogicalSequence?: any[];
    outcomeDrivenFlowApplied?: boolean;
    totalOutcomes?: number;
    scenesPerOutcome?: number;
    [key: string]: any;
  };

  [key: string]: any;
}

/* =========================================================
 * Legacy Compatibility Types
 * =======================================================*/

// For backward compatibility with existing code
export type StoryboardModuleV2 = StoryboardModule;
export type Scene = StoryboardScene;

/* =========================================================
 * Additional Types for Backend Services
 * =======================================================*/

export interface InstructionalBlock {
  pages: number[];
  title: string;
  type: string;
  content: string;

  /** Target narration duration in seconds for this scene */
  expectedDurationSeconds?: number;
  /** Whether this block must include a knowledge check */
  requiresKnowledgeCheck?: boolean;
  /** Expected interaction type (e.g., "MCQ", "Tabbed", "Scenario") */
  expectedInteractionType?: string;
  /** Additional interaction guidance for the model */
  interactionExpectation?: string;
  /** Keywords to help map source content to this block */
  keywords?: string[];
  /** Optional learning outcome references to surface in prompts */
  learningOutcomeReferences?: string[];
  /** Additional accessibility requirements to enforce */
  accessibilityMustHaves?: string[];
  /** Optional brand/voice guidance scoped to this block */
  brandVoiceGuidance?: string;
  /** Identifier for multipart pages so we can enforce continuity */
  continuityGroupId?: string;
}

/* =========================================================
 * Export All Types
 * =======================================================*/

// All types are defined above and exported directly
