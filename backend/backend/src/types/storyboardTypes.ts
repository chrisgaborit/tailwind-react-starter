// backend/src/types/storyboardTypes.ts
export type IDMethod =
  | "ADDIE"
  | "SAM"
  | "MERRILL"
  | "GAGNE"
  | "BACKWARD"
  | "BLOOM";

export type ADDIEPhase = "A" | "D1" | "D2" | "I" | "E"; // D1=Design, D2=Development
export type SAMPhase = "Prepare" | "Iterate" | "Implement";
export type MerrillPhase = "Activation" | "Demonstration" | "Application" | "Integration";
export type GagneEvent =
  | "GainAttention" | "InformObjectives" | "StimulateRecall" | "PresentContent"
  | "ProvideGuidance" | "ElicitPerformance" | "ProvideFeedback"
  | "AssessPerformance" | "EnhanceRetentionTransfer";
export type BackwardStage = "IdentifyResults" | "DetermineEvidence" | "PlanLearning";
export type BloomLevel = "Remember" | "Understand" | "Apply" | "Analyze" | "Evaluate" | "Create";

export interface InstructionalTag {
  method: IDMethod;
  addie?: { phase: ADDIEPhase };
  sam?: { phase: SAMPhase };
  merrill?: { phase: MerrillPhase };
  gagne?: { event: GagneEvent };
  backward?: { stage: BackwardStage };
  bloom?: { level: BloomLevel };
}

export interface StoryboardScene {
  sceneNumber: number;
  pageTitle: string;
  // ... your existing fields ...
  imagePrompt?: string;
  instructionalTag?: InstructionalTag;   // <— NEW
}

export interface StoryboardModule {
  moduleName: string;
  // ... existing fields ...
  idMethod?: IDMethod;                   // <— NEW: selected by user
  frameworkSummary?: Record<string, any>; // <— optional auto summary
}

// ========== TEMPLATE ENFORCEMENT & VALIDATION TYPES ==========

/**
 * Validation result from ValidationEnforcer
 * Used for scene-level validation with retry logic
 */
export interface ValidationResult {
  isValid: boolean;
  content: string;
  attempts: number;
  failures: string[];
  checksum: string;
  timestamp: string;
  validationSchema?: string;
  guidance?: string;
}

/**
 * Template enforcement metadata
 * Tracks template compliance and regeneration attempts
 */
export interface TemplateEnforcement {
  templateVersion?: string;
  checksum?: string;
  validationPassed?: boolean;
  regenerationAttempts?: number;
  lastValidationTimestamp?: string;
  templateType?: "teaching" | "scenario" | "assessment" | "practice";
}

/**
 * Structured error for validation failures
 * Returned when validation fails after max attempts
 */
export interface ValidationError {
  error: string;
  attempts: number;
  lastAttemptContent: string;
  failures: string[];
  validationSchema: string;
  guidance: string;
  checksum: string;
  timestamp: string;
}

// ========== INTERACTIVITY SEQUENCER TYPES ==========

/**
 * Scene metadata for interactivity selection
 * Used by InteractivitySequencer to determine best-fit interaction
 */
export interface SceneMetadata {
  sceneNumber: number;
  bloomLevel?: "remember" | "understand" | "apply" | "analyze" | "evaluate" | "create";
  instructionalPurpose?: "foundation" | "practice" | "reinforcement" | "assessment";
  moduleLevel?: 1 | 2 | 3 | 4;
  previousInteractivities?: string[];
  cognitiveLoad?: "low" | "medium" | "high";
}

/**
 * Interactivity decision result
 * Contains selected interactivity type and justification
 */
export interface InteractivityDecision {
  interactivityType: string;
  justification: string;
  suggestedTemplate: string;
  score?: number;
  alternativeOptions?: Array<{
    type: string;
    score: number;
    reason: string;
  }>;
  checksum?: string;
  timestamp?: string;
}

/**
 * Interactivity type definition
 * Master catalog entry for available interactivity patterns
 */
export interface InteractivityType {
  id: string;
  name: string;
  bloomLevels: Array<"remember" | "understand" | "apply" | "analyze" | "evaluate" | "create">;
  moduleLevels: Array<1 | 2 | 3 | 4>;
  cognitiveLoad: "low" | "medium" | "high";
  instructionalPurposes: Array<"foundation" | "practice" | "reinforcement" | "assessment">;
  templateRef: string;
  description?: string;
}

// ========== PHASE 3: INTERACTIVITY CONTENT GENERATION TYPES ==========

/**
 * Interaction details - standardized output from builder functions
 * Injected into scene.interactionDetails for frontend rendering
 */
export interface InteractionDetails {
  type: string;
  title: string;
  interactionSteps: string[];
  feedbackRules?: {
    correct?: string;
    incorrect?: string;
    neutral?: string;
  };
  accessibilityNotes?: string;
  imagePrompt?: string;
  templateData?: Record<string, any>;
}