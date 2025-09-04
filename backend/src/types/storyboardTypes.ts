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