// frontend/src/types/StoryboardFormData.ts

export interface StoryboardFormData {
  moduleName: string;
  moduleType: string;
  complexityLevel: string;
  tone: string;
  outputLanguage: string;
  duration?: string;
  learningModes?: string[];
  organisationName?: string;
  targetAudience?: string;
  colours?: string;
  fonts?: string;
  learningOutcomes: string;
  content: string;
  screenType?: string;
  interactionStyle?: string;
  instructionalPurpose?: string;
}
