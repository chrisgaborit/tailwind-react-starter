// backend/src/agents_v2/types.ts
import { TeachingScene } from "./teachingTemplates";

export type Role = "Welcome" | "Teach" | "Apply" | "Assess" | "Summary";

export interface Scene {
  sceneNumber: number;
  pageTitle: string;
  pageType: "Informative" | "Interactive";
  narrationScript: string;
  onScreenText: string; // ≤70 words, summarised version of VO
  visual: {
    aiPrompt: string;
    altText: string;
    aspectRatio?: "16:9" | "1:1" | "4:5";
  };
  interactionType?: "None" | "MCQ" | "Scenario" | "Hotspots" | "DragDrop" | "Reflection";
  interactionDetails?: Record<string, any>;
  timing: { estimatedSeconds: number };
  
  // NEW: Teaching scene structure for enhanced pedagogical content
  teachingScene?: TeachingScene;
  
  // Universal Pedagogical Framework fields
  pedagogicalPhase?: "Welcome" | "LearningOutcomes" | "Teach" | "Practice" | "Apply" | "Assess" | "Summary" | "NextSteps";
  learningOutcomeIndex?: number;
  learningOutcome?: string;
  frameworkCompliant?: boolean;
  
  // Phase 2a: Interactivity Sequencer Decision
  interactivityDecision?: {
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
  };
  
  // Phase 3: Generated Interaction Content
  interactionDetails?: {
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
  };
}

export interface QAReport {
  score: number;
  issues: string[];
  recommendations: string[];
  sourceValidation?: {
    valid: boolean;
    issues: string[];
  };
}

export interface Storyboard {
  moduleName: string;
  targetMinutes: number;
  tableOfContents: string[];
  scenes: Scene[];
  metadata: {
    brand?: { colours?: string; fonts?: string };
    completionRule: string;
  };
  qaReport?: QAReport;
}

export interface LearningRequest {
  topic: string;
  duration: number; // in minutes
  audience?: string;
  sourceMaterial: string; // REQUIRED
  learningOutcomes?: string[];
  brand?: { colours?: string; fonts?: string };
  
  // Phase 2: Interaction Intelligence
  phase2Config?: Phase2Config;
  moduleType?: ModuleType;
}

// ========== PHASE 1: OUTCOME-DRIVEN TYPES ==========

export type BloomLevel = "Remember" | "Understand" | "Apply" | "Analyze" | "Evaluate" | "Create";

export interface OutcomeAnalysis {
  outcome: string;
  bloomLevel: BloomLevel;
  complexityScore: number; // 1-10
  prerequisites: string[];
  requiredSceneTypes: SceneTypeRequirement[];
  assessmentMethod: string;
  estimatedSceneCount: number;
}

export interface SceneTypeRequirement {
  type: "definition" | "example" | "demonstration" | "practice" | "scenario" | "case_study" | "reflection" | "assessment";
  priority: "required" | "recommended" | "optional";
  count: number;
}

export interface OutcomeMap {
  outcomes: OutcomeAnalysis[];
  totalEstimatedScenes: number;
  learningProgression: BloomLevel[];
  prerequisites: Record<string, string[]>; // outcome -> prerequisite outcomes
}

export interface SceneFlowMetrics {
  cognitiveLoad: number; // 1-10
  engagementLevel: number; // 1-10
  transitionQuality: number; // 1-10
  outcomeAlignment: number; // 0-100%
}

export interface FlowValidation {
  isValid: boolean;
  flowScore: number; // 0-100
  issues: string[];
  recommendations: string[];
  metrics: SceneFlowMetrics;
}

// ========== PHASE 2: PEDAGOGICAL INTERACTIVITY TYPES ==========

export type InteractionType = 
  | "knowledgeCheck" 
  | "scenario" 
  | "reflection" 
  | "simulation"
  | "dragDrop"
  | "hotspot"
  | "branchingScenario"
  | "sortingActivity"
  | "matchingActivity"
  | "slider"
  | "journal"
  | "DragAndDrop-Matching"
  | "DragAndDrop-Sequencing"
  | "none";

export type InteractionPurpose = 
  | "attentionReset"        // Re-engage attention after passive content
  | "skillPractice"         // Practice applying concepts
  | "knowledgeReinforcement" // Check understanding
  | "meaningMaking"          // Deepen understanding through reflection
  | "application"            // Apply to real scenarios
  | "assessment"             // Measure mastery
  | "exploration"            // Discover patterns/relationships
  | "engagement";            // Maintain interest

export type InteractionTiming = "immediate" | "delayed" | "spaced";

export type InteractionIntensity = "light" | "moderate" | "high" | "continuous";

export type ModuleType = "awareness" | "skillBuilding" | "application" | "immersive";

export interface InteractionPrescription {
  needed: boolean;
  type: InteractionType;
  purpose: InteractionPurpose;
  pedagogicalRationale: string;
  timing: InteractionTiming;
  cognitiveLoadImpact: number; // 1-10
  estimatedDuration: number; // seconds
  priority: "required" | "recommended" | "optional";
}

export interface DensityProfile {
  moduleType: ModuleType;
  intervalScenes: number; // How many scenes between interactions
  intensity: InteractionIntensity;
  targetInteractionRate: number; // Percentage of scenes with interaction
  minSpacing: number; // Minimum scenes between interactions
}

export interface CognitiveLoadAssessment {
  currentLoad: number; // 1-10
  capacity: number; // 1-10
  overloadRisk: boolean;
  safetyMargin: number; // Capacity - Load
  recommendations: string[];
}

export interface PedagogicalRule {
  id: string;
  name: string;
  trigger: {
    condition: string;
    threshold?: number;
  };
  action: {
    interactionType: InteractionType;
    purpose: InteractionPurpose;
  };
  rationale: string;
  priority: number; // 1-10, higher = more important
}

export interface InteractionDecision {
  sceneId: string;
  prescription: InteractionPrescription | null;
  appliedRules: string[]; // Rule IDs that influenced decision
  alternativesConsidered: InteractionType[];
  confidence: number; // 0-100
}

export interface PedagogicalValidation {
  isValid: boolean;
  pedagogicalScore: number; // 0-100
  alignmentScore: number; // How well interactions align with outcomes
  purposeClarityScore: number; // How clear the learning purpose is
  cognitiveLoadScore: number; // How well balanced the load is
  densityScore: number; // How well spaced the interactions are
  issues: string[];
  recommendations: string[];
}

export interface CrossPhaseScene extends Scene {
  // Phase 2 enhancements
  interactionPrescription?: InteractionPrescription;
  cognitiveLoadScore?: number;
  pedagogicalPurpose?: string;
  interactionDecision?: InteractionDecision;
  cumulativeCognitiveLoad?: number; // Total load up to this scene
}

export interface Phase2Config {
  enabled: boolean;
  maxInteractions?: number; // Limit the total number of interactions (e.g., 2-3)
  interactionDistribution?: {
    clickToReveal?: number;      // Number of Click-to-Reveal interactions
    dragDropMatching?: number;   // Number of Drag-and-Drop Matching interactions
    dragDropSequencing?: number; // Number of Drag-and-Drop Sequencing interactions
  };
  densityProfile?: DensityProfile;
  maxCognitiveLoad?: number;
  allowHighIntensity?: boolean;
  customRules?: PedagogicalRule[];
}