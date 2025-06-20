export enum ModuleType {
  Compliance = 'Compliance',
  Onboarding = 'Onboarding',
  ProductTraining = 'Product Training',
  SalesTraining = 'Sales Training',
  SoftSkills = 'Soft Skills',
  Leadership = 'Leadership',
  Safety = 'Safety',
  Risk = 'Risk',
  Ethics = 'Ethics',
  ITProcess = 'IT Process',
  Services = 'Services',
  Induction = 'Induction'
}

export enum ModuleLevel {
  Level1 = 'Level 1 - Focus: Foundational knowledge. Style: Direct instruction, simple interactions (e.g., click next, simple MCQs).',
  Level2 = 'Level 2 - Focus: Application and understanding. Style: More interactivity, scenarios, case studies, guided exploration (e.g., tabs, drag & drop).',
  Level3 = 'Level 3 - Focus: Strategic thinking, complex problem-solving. Style: High interactivity, simulations, branching scenarios, deep reflection.',
  Level4 = 'Level 4 - Focus: Immersive and adaptive learning. Style: Gamification, AI-driven personalisation, virtual/augmented reality, advanced simulations.'
}

export enum Tone {
  Professional = 'Professional',
  Conversational = 'Conversational',
  Inspirational = 'Inspirational',
  Authoritative = 'Authoritative'
}

export enum Language {
  English = 'English',
  Spanish = 'Spanish',
  French = 'French',
  ChineseSimplified = 'Chinese (Simplified)',
  Hindi = 'Hindi',
  Arabic = 'Arabic',
  German = 'German',
  Japanese = 'Japanese',
  Indonesian = 'Indonesian',
  Devanagari = 'Devanagari (Script for Hindi, Marathi, etc.)'
}

export interface BrandGuidelines {
  logoUrl?: string;
  fontDetails?: string;
  colorPalette?: string;
  pdfGuidelines?: string;
}

export interface StoryboardFormData {
  clientName: string;
  moduleName: string;
  moduleType: ModuleType;
  moduleLevel: ModuleLevel;
  tone: Tone;
  language: Language;
  learningObjectives: string;
  additionalNotes?: string;
  brandGuidelines?: BrandGuidelines;
}
