export enum ModuleType {
  Compliance = 'Compliance',
  ProductTraining = 'Product Training',
  Onboarding = 'Onboarding',
  Sales = 'Sales',
  Leadership = 'Leadership',
  SoftSkills = 'Soft Skills',
  Systems = 'Systems or Technical Training',
  Behavioural = 'Soft Skills or Behavioural'
}

export enum ModuleLevel {
  Level1 = 'Level 1',
  Level2 = 'Level 2',
  Level3 = 'Level 3',
  Level4 = 'Level 4'
}

export enum Tone {
  Formal = 'Formal',
  Friendly = 'Friendly',
  Inspiring = 'Inspiring',
  Conversational = 'Conversational',
  Confident = 'Confident & Persuasive',
  Instructional = 'Direct & Instructional',
  Reflective = 'Reflective & Story-Driven',
  Strategic = 'Empowering & Strategic'
}

export enum SupportedLanguage {
  English = 'English',
  Spanish = 'Spanish',
  French = 'French',
  German = 'German',
  Arabic = 'Arabic',
  Hindi = 'Hindi',
  Japanese = 'Japanese',
  Indonesian = 'Indonesian',
  ChineseSimplified = 'Chinese (Simplified)'
}

export interface StoryboardFormData {
  moduleName: string;
  moduleType: ModuleType;
  complexityLevel: string; // Changed from enum to allow frontend string binding
  tone: string;
  outputLanguage: string;
  organisationName: string;
  targetAudience: string;
  duration: string;
  brandGuidelines: string;
  fonts: string;
  colours: string;
  logoUrl: string;
  learningOutcomes: string;
  content: string;
}

export interface StoryboardScene {
  sceneNumber: string;
  title?: string;
  objectivesCovered?: string;
  visual?: string;
  narration?: string;
  onScreenText?: string;
  userInstructions?: string;
  interactions?: string;
  accessibilityNotes?: string;
}
