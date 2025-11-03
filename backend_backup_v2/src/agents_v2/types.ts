// backend/src/agents_v2/types.ts

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
}