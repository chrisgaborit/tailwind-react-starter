// backend/src/types/storyboard.ts

// The complete and correct form data interface
export interface StoryboardFormData {
  moduleName: string;
  moduleType: string;
  targetAudience: string;
  audience?: string;
  learningOutcomes: string;
  learningObjectives?: string;
  tone: string;
  toneOfVoice?: string;
  duration?: string;
  outputLanguage: string;
  complexityLevel: string;
  screenType?: string;            // ✅ Was missing for openaiService
  interactionStyle?: string;      // ✅ Was missing for openaiService
  instructionalPurpose?: string;  // ✅ Was missing for openaiService
  additionalNotes?: string;       // ✅ Was missing for openaiService
  interactionFrequency?: string;
  organisationName?: string;
  colours?: string;
  fonts?: string;
  learningModes?: string[];
  brandGuidelines?: string;
  logoUrl?: string;
  specificCreativeInstructions?: string;
  secondaryTechniques?: string[];
  primaryLearningMode?: string;
  mainContent?: string;
  content: string;
}

// The corrected interactivity block with the missing property
export interface InteractivityInstructionBlock {
  interactivityType: string;
  type: string;
  description: string;
  layout: string;
  learningPurpose?: string;
  bestForModuleLevels?: number[];
  contentTypes?: string[];
  learningOutcomes: string[]; // ✅ Was missing for interactivityTemplates
}

// Add other necessary types that were in your other files
export interface StoryboardModule {
    // Define the structure your app expects
    moduleName: string;
    revisionHistory: any[];
    pronunciationGuide: any[];
    pages: any[]; // Define 'Page' interface for better typing
}

export interface Event {
    // Define the structure your app expects
    eventNumber: number;
    aiProductionBrief: any;
    onScreenText?: string;
    generatedImageUrl?: string;
}