
export interface StoryboardScene {
  sceneNumber: number;
  title: string;
  learningObjectivesCovered: string; // New: e.g., "LO1: Define X, LO2: Explain Y (Bloom: Understanding)"
  visualDescription: string; // Existing: Emphasize media assets, brand guidelines
  narrationScript: string; // Existing: Sample copy reflecting tone
  onScreenText: string; // Existing: Sample copy
  userInstructions: string; // New: Specific instructions for learner, e.g., "Click tabs to explore"
  interactions: string; // Existing: Type of interaction
  accessibilityNotes: string; // New: e.g., "Ensure alt text for all images", "Video to include captions"
  knowledgeCheck: string; // New: Optional - "Q: What is the primary benefit? A/B/C" or "Reflection: How would you apply this?"
}

export type Storyboard = StoryboardScene[];

export interface StoryboardResponse {
  storyboard: StoryboardScene[];
}

export enum AppState {
  Idle,
  Loading,
  Success,
  Error,
  FormInput,
}

export enum ModuleLevel {
  Level1 = "Level 1", // Foundational, direct instruction, simple interactions
  Level2 = "Level 2", // Application-focused, moderate interactivity (scenarios, case studies)
  Level3 = "Level 3", // Strategic/complex, high interactivity (simulations, branching)
}

export enum ModuleType {
  Compliance = "Compliance",
  Onboarding = "Onboarding",
  ProductTraining = "Product Training",
  SystemTraining = "Systems or Technical Training",
  SoftSkills = "Soft Skills or Behavioural",
  Leadership = "Leadership",
}

export enum Tone {
  Formal = "Formal",
  Friendly = "Friendly",
  Inspiring = "Inspiring",
  Conversational = "Conversational",
  ConfidentPersuasive = "Confident & Persuasive", // for Product Training
  DirectInstructional = "Direct & Instructional", // for System Training
  ReflectiveStoryDriven = "Reflective & Story-Driven", // for Soft Skills
  EmpoweringStrategic = "Empowering & Strategic", // for Leadership
}

export enum SupportedLanguage {
  English = "English",
  Spanish = "Spanish",
  French = "French",
  ChineseSimplified = "Chinese (Simplified)",
  Hindi = "Hindi",
  Arabic = "Arabic",
  German = "German",
  Japanese = "Japanese",
  Indonesian = "Indonesian",
  Devanagari = "Devanagari (Script for Hindi, Marathi, etc.)",
}

export interface StoryboardFormData {
  moduleName: string;
  moduleType: ModuleType | "";
  audience: string;
  tone: Tone | "";
  organisationName: string; // Client name
  orgBranding: string; // Brand Guidelines: Fonts, Color Palette, Logo URL placeholder
  moduleDuration: string; // Duration Target: e.g., "10-15 minutes" or "approx 15 screens"
  learningOutcomes: string;
  moduleLevel: ModuleLevel | "";
  language: SupportedLanguage | ""; // New field for language selection
  mainContent: string;
}
