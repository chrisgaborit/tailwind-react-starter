// frontend/src/types/storyboardTypes.ts

export interface StoryboardFormData {
  moduleName: string;
  moduleType: string;
  organisationName: string;
  outputLanguage: string;
  brandGuidelines: string;
  logoUrl: string;
  colours: string;
  fonts: string;
  learningOutcomes: string;
  targetAudience: string;
  knowledgeCheck: string;
  complexityLevel: string;
  duration: string;
  tone: string;
  moduleComplexity: string;
}

export interface StoryboardScene {
  sceneNumber: number;
  title: string;
  script: string;
  visuals: string;
  voiceover: string;
  knowledgeCheck?: string | object;
}
