// frontend/src/types/interactionTypes.ts

/**
 * Phase 4: Frontend Interaction Types
 * Type definitions for all interaction component props
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

// Click-to-Reveal Component Props
export interface ClickToRevealProps {
  concepts: Array<{
    id: string;
    title: string;
    content: string;
    revealed?: boolean;
    order: number;
  }>;
  revealAnimation?: string;
  layout?: string;
  columns?: number;
}

// Drag-and-Drop Component Props
export interface DragAndDropProps {
  draggableItems: Array<{
    id: string;
    label: string;
    description?: string;
  }>;
  dropZones: Array<{
    id: string;
    label: string;
    description?: string;
  }>;
  matchPairs: Array<{
    item: string;
    zone: string;
  }>;
  allowMultiple?: boolean;
  showFeedback?: boolean;
  enableHints?: boolean;
}

// Scenario Simulation Component Props
export interface ScenarioSimulationProps {
  scenarioText: string;
  context: string;
  choices: Array<{
    id: string;
    text: string;
    outcome: string;
    rationale: string;
  }>;
  consequences: Record<string, string>;
  coachingTips: Record<string, string>;
  allowRetry?: boolean;
  showConsequences?: boolean;
}

// Multi-Select Quiz Component Props
export interface MultiSelectQuizProps {
  questions: Array<{
    id: string;
    text: string;
    options: Array<{
      id: string;
      text: string;
      correct: boolean;
    }>;
    explanation?: string;
  }>;
  requireAllCorrect?: boolean;
  showPartialCredit?: boolean;
  allowRetry?: boolean;
  maxAttempts?: number;
}

// Single-Select Quiz Component Props
export interface SingleSelectQuizProps {
  questions: Array<{
    id: string;
    text: string;
    options: Array<{
      id: string;
      text: string;
      correct: boolean;
    }>;
    explanation?: string;
  }>;
  allowRetry?: boolean;
  showExplanation?: boolean;
}

// Hotspot Exploration Component Props
export interface HotspotExplorationProps {
  hotspots: Array<{
    id: string;
    label: string;
    description: string;
    content: string;
    position: {
      x: number;
      y: number;
    };
  }>;
  requireAllVisited?: boolean;
  showProgress?: boolean;
}


