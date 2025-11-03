/**
 * ==================================================================
 * BACKEND TYPES - RE-EXPORTS FROM MASTER TYPES
 * ==================================================================
 * 
 * This file re-exports all types from the master types file to maintain
 * backward compatibility while ensuring a single source of truth.
 * 
 * All new types should be added to /types/storyboardTypes.ts
 * ==================================================================
 */

// Re-export all types from master types file
export * from './types/masterTypes';

/* ---------------------------------------
   Backend-specific types (not in master types)
----------------------------------------*/

// InstructionalBlock is now defined in master types

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

export interface BrandonHallAsset {
  type: string;
  source?: string;
  description?: string;
}

export interface BrandonHallReviewFeedback {
  type: string;
  author?: string;
  timestamp?: string;
  text: string;
}

export interface BrandonHallQuestionOption {
  text: string;
  is_correct: boolean;
}

export interface BrandonHallQuestionFeedback {
  correct?: string;
  incorrect?: string;
  try_again?: string;
  visual?: string;
}

export interface BrandonHallQuestion {
  stem: string;
  instruction?: string;
  options?: BrandonHallQuestionOption[];
  feedback?: BrandonHallQuestionFeedback;
}

export interface BrandonHallOnScreenText {
  title?: string;
  body_text?: string[];
  bullet_points?: string[];
  continue_prompt?: string;
}

export interface BrandonHallEvent {
  event_number: number;
  audio_script?: string;
  on_screen_text?: BrandonHallOnScreenText;
  internal_development_notes?: string;
  screen_media_treatment?: string;
  assets?: BrandonHallAsset[];
  review_feedback?: BrandonHallReviewFeedback[];
  question?: BrandonHallQuestion;
}

export interface BrandonHallSlide {
  slide_number: string;
  slide_title: string;
  page_number_in_document?: string;
  type?: string;
  events: BrandonHallEvent[];
}

export interface BrandonHallRevisionHistory {
  date: string;
  task: string;
  by: string;
  version?: string;
}

export interface BrandonHallTOCItem {
  item_number: string;
  title: string;
  page_number?: string;
}

export interface BrandonHallGlobalNotes {
  notes?: string[];
  deleted_notes_for_tracking?: string[];
}

export interface BrandonHallStoryboard {
  document_title: string;
  project_code?: string;
  company?: string;
  created_by?: string;
  revision_history?: BrandonHallRevisionHistory[];
  table_of_contents?: BrandonHallTOCItem[];
  global_notes?: BrandonHallGlobalNotes;
  slides: BrandonHallSlide[];
}

export interface SceneDraftResult {
  aiScene: any;
  attempts: number;
  residualIssues: string[];
}

// Legacy aliases are now defined in master types