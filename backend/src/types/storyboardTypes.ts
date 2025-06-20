export enum ModuleType {
  Compliance = 'Compliance',
  ProductTraining = 'Product Training',
  Onboarding = 'Onboarding',
  Sales = 'Sales',
  Leadership = 'Leadership',
  SoftSkills = 'Soft Skills'
}

export enum ModuleLevel {
  Level1 = 'Level 1',
  Level2 = 'Level 2',
  Level3 = 'Level 3'
}

export enum Tone {
  Professional = 'Professional',
  Conversational = 'Conversational',
  Playful = 'Playful'
}

export enum SupportedLanguage {
  English = 'English',
  Spanish = 'Spanish',
  French = 'French',
  German = 'German'
}

export interface StoryboardFormData {
  moduleName: string;
  moduleType: ModuleType;
  moduleLevel: ModuleLevel;
  tone: Tone;
  organisationName: string;
  audience: string;
  learningOutcomes: string;
  mainContent: string;
  durationMinutes: number;
  language: SupportedLanguage;
  brandGuidelines: string;  // <-- now required (not optional)
}

export interface StoryboardScene {
  sceneTitle: string;
  visualDescription: string;
  narrationScript: string;
  onScreenText: string;
  interaction?: string;
  knowledgeCheck?: string | {
    question: string;
    options: string[];
    correctAnswer: string;
  };
}
