/**
 * ==================================================================
 * SHARED TYPES FOR STORYBOARD GENERATOR (UPGRADED W/ METADATA & RICH INTERACTIONS)
 * ==================================================================
 */

export enum ModuleLevel {
  Level1 = 'Level 1',
  Level2 = 'Level 2',
  Level3 = 'Level 3',
  Level4 = 'Level 4'
}

export type ModuleType = 
  | 'Compliance'
  | 'Onboarding & Induction'
  | 'Product Training'
  | 'Soft Skills & Leadership'
  | 'Systems & Process Training'
  | 'Customer Service'
  | 'Health, Safety & Wellbeing'
  | 'Sales & Marketing'
  | 'Technical or Systems Training'
  | 'Personal Development';

export type Tone = 
  | 'Professional & Clear'
  | 'Warm & Supportive'
  | 'Confident & Persuasive'
  | 'Conversational & Friendly'
  | 'Inspirational & Uplifting'
  | 'Playful & Engaging';

export type SupportedLanguage = 
  | 'English (US)'
  | 'English (UK)'
  | 'Spanish'
  | 'French'
  | 'German'
  | 'Chinese (Simplified)'
  | 'Arabic'
  | 'Portuguese (Brazil)'
  | 'Russian'
  | 'Japanese'
  | 'Hindi (Devanagari)'
  | 'Tamil'
  | 'Telugu'
  | 'Marathi (Devanagari)';

export interface StoryboardFormData {
  moduleName: string;
  moduleType: ModuleType;
  complexityLevel: string; 
  tone: Tone;
  outputLanguage: SupportedLanguage;
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

// --- Detailed Storyboard Structure ---

export interface InteractionObject {
  type: string;
  layout: string;
  elements: { [key: string]: string } | Array<{ [key:string]: string }>;
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
  audioScript: string;
  internalDevelopmentNotes: InternalDevelopmentNotes;
}

export interface StoryboardPage {
  pageNumber: number;
  pageTitle: string;
  events: Event[];
}

// ✅ NEW: Added interfaces for optional metadata fields.
export interface RevisionHistoryItem {
  version: string;
  date: string;
  author: string;
  description: string;
}

export interface PronunciationGuideItem {
  term: string;
  pronunciation: string;
}

export interface TableOfContentsItem {
  pageNumber: number;
  title: string;
}

// ✅ UPDATED: The main StoryboardModule now includes the optional metadata fields.
export interface StoryboardModule {
  moduleName: string;
  learningOutcomes: string;
  revisionHistory?: RevisionHistoryItem[];
  pronunciationGuide?: PronunciationGuideItem[];
  tableOfContents?: TableOfContentsItem[];
  pages: StoryboardPage[];
}