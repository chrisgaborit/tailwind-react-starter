// backend/src/types/storyboardTypesArchive.ts

export enum ModuleLevel {
  Level1 = 'Level1',
  Level2 = 'Level2',
  Level3 = 'Level3',
  Level4 = 'Level4',
}

export interface InteractivityInstructionBlock {
  interactivityType: string;
  type: string;
  description: string;
  layout: string;
  learningPurpose?: string;
  bestForModuleLevels?: number[];
  contentTypes?: string[];
  learningOutcomes?: string[];
  layoutDescription?: string;
  userBehaviour?: string;
  visualElementBreakdown?: string[];
  developerNotes?: string;
  exampleAssets?: string[];
}

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
  screenType?: string;
  interactionStyle?: string;
  interactionFrequency?: string;
  instructionalPurpose?: string;
  organisationName?: string;
  colours?: string;
  fonts?: string;
  additionalNotes?: string;
  learningModes?: string[];
  brandGuidelines?: string;
  logoUrl?: string;
  specificCreativeInstructions?: string;
  secondaryTechniques?: string[];
  primaryLearningMode?: string;
  mainContent?: string;
  content: string;
}
// Add this at the bottom or with your other interfaces

export interface StoryboardModule {
  // Example structure—update as per your needs
  storyboard: any[]; // Or your actual storyboard scene type
  [key: string]: any; // Allow additional properties as needed
}
