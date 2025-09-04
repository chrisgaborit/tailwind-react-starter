// frontend/src/types/index.ts

// -------- Runtime constants (usable at runtime) --------
export const SupportedLanguage = {
  EN_UK: "English (UK)",
  EN_US: "English (US)",
  FR: "French",
  DE: "German",
  ES: "Spanish",
  PT: "Portuguese",
  ZH_CN: "Chinese (Simplified)",
  JA: "Japanese",
  AR: "Arabic",
  HI: "Hindi",
  BN: "Bengali",
  TA: "Tamil",
} as const;

export const ModuleType = {
  ELEARNING: "E-Learning",
  VIDEO: "Video",
  MICRO: "Microlearning",
  WORKSHOP: "Workshop",
} as const;

export const Tone = {
  PROFESSIONAL: "Professional",
  ENCOURAGING: "Encouraging",
  FRIENDLY: "Friendly",
  FORMAL: "Formal",
} as const;

export const ModuleLevel = {
  LEVEL_1: "Level 1",
  LEVEL_2: "Level 2",
  LEVEL_3: "Level 3",
  LEVEL_4: "Level 4",
} as const;

/**
 * @deprecated Replaced by PreferredMethodology. Kept for backwards compatibility.
 */
export const LearningMode = {
  SCENARIO_BASED: "Scenario-Based",
  STORYTELLING: "Storytelling",
  BRANCHING: "Branching",
  PROCEDURAL: "Procedural",
  REFLECTIVE: "Reflective",
} as const;

export const InstructionalPurpose = {
  KNOWLEDGE_TRANSFER: "Knowledge Transfer",
  SKILL_PRACTICE: "Skill Practice",
  COMPLIANCE: "Compliance",
  SOFT_SKILLS: "Soft Skills Development",
  LEADERSHIP: "Leadership Training",
} as const;

/**
 * Preferred Instructional Design Methodology (new)
 */
export const PreferredMethodology = {
  ADDIE: "ADDIE Model",
  SAM: "SAM (Successive Approximation Model)",
  MERRILLS: "Merrill’s First Principles of Instruction",
  GAGNES: "Gagné’s Nine Events of Instruction",
  BLOOMS: "Bloom’s Taxonomy (Applied in eLearning Design)",
} as const;

/**
 * @deprecated Removed from UI (was limiting creativity). Kept optional in types for legacy data.
 */
export const ScreenType = {
  STANDARD: "Standard",
  QUIZ: "Quiz",
  INTERACTIVE: "Interactive",
  VIDEO: "Video",
  BRANCH: "Branching Scenario",
} as const;

/**
 * @deprecated Removed from UI (we encourage varied interactions per scene).
 */
export const InteractionStyle = {
  CLICK_REVEAL: "Click to Reveal",
  DRAG_DROP: "Drag and Drop",
  SIMULATION: "Simulation",
  ROLEPLAY: "Role Play",
  REFLECTION: "Reflection Prompt",
} as const;

// -------- Types --------
export type KnowledgeCheck = {
  id?: string;
  stem?: string;
  /** Some components use "question" instead of "stem" */
  question?: string;
  /** UI sometimes uses raw string options; support both shapes */
  options?: (string | { id?: string; text: string; correct?: boolean; rationale?: string })[];
  /** UI expects answer as string array */
  answer?: (string | number)[];
};

export type MediaPrompt = {
  type?: string;
  style?: string;
  description?: string;
  colorPalette?: string;
};

export type StoryboardEvent = {
  eventNumber?: number;
  audio?: { script?: string };
  /** UI sometimes reads audioScript directly */
  audioScript?: string;
  narrationScript?: string;
  voiceover?: string;
  onScreenText?: string;
  developerNotes?: string;
  interactive?: { behaviourExplanation?: string };
  /** Rich developer/internal notes the printable uses */
  internalDevelopmentNotes?: {
    mediaPrompt?: MediaPrompt;
    layout?: string;
    interactions?: string;
    developerComments?: string;
  };
};

export type VisualBlock = {
  mediaType?: "Image" | "Graphic" | "Animation" | "Video";
  style?: string;
  aiPrompt?: string;
  altText?: string;
  aspectRatio?: string;
  composition?: string;
  environment?: string;
};

export type StoryboardScene = {
  /** Various ids/titles used across the app */
  id?: string | number;
  title?: string;
  sceneTitle?: string;

  sceneNumber?: number;
  pageNumber?: number;

  pageTitle?: string;
  screenLayout?: string;
  templateId?: string;
  screenId?: string;

  /** @deprecated historical; scene-level screen type is no longer chosen in UI */
  screenType?: string;

  narrationScript?: string;
  onScreenText?: string;
  visual?: VisualBlock;
  visualDescription?: string;
  interactionType?: string;
  interactionDescription?: string;
  userInstructions?: string;
  interactions?: string;
  developerNotes?: string;
  accessibilityNotes?: string;
  isIncidentFlow?: boolean;

  /** Both singular and plural are referenced in code */
  knowledgeCheck?: KnowledgeCheck;
  knowledgeChecks?: KnowledgeCheck[];

  /** Rich meta used in the slideshow */
  learningObjectivesCovered?: string;
  imagePrompt?: string;

  /** Make events required to satisfy scene.events.map(...) without ? checks */
  events?: StoryboardEvent[];
  decisions?: any[];
};

export type StoryboardModule = {
  moduleName: string;
  revisionHistory?: Array<{ dateISO: string; change: string; author: string; version?: string; description?: string }>;
  pronunciationGuide?: Array<{ term: string; pronunciation: string; note?: string }>;
  tableOfContents?: string[];
  principles?: string[];
  serviceCommitments?: Array<{ id: string; role: string; item: string; deadline: string; condition?: string }>;
  scenes: StoryboardScene[];
  metadata?: Record<string, any>;
};

/** Company image (uploaded by user) for use in storyboard/module */
export type CompanyImage = {
  id: string;
  fileName: string;
  url?: string;              // filled after upload
  description: string;       // what the image is
  intendedUse?: string;      // where/how it should be used in the module
};

// -------- Form Data gathered by the UI (all optional) --------
export type StoryboardFormData = {
  moduleName?: string;
  moduleType?: keyof typeof ModuleType | string;
  targetAudience?: string;
  organisationName?: string;

  language?: keyof typeof SupportedLanguage | string;
  outputLanguage?: keyof typeof SupportedLanguage | string;
  moduleLevel?: keyof typeof ModuleLevel | string;
  audience?: string;
  tone?: keyof typeof Tone | string;

  /** ✅ Preferred numeric duration in minutes (5–90) */
  durationMins?: number;

  /** ⚠️ Legacy: kept for backwards compatibility only */
  moduleDuration?: string | number;
  duration?: string | number;

  /** e.g., "Level 1/2/3/4" – still used in back end prompts */
  complexityLevel?: string;

  orgBranding?: string;
  brandGuidelines?: string;
  colours?: string;
  fonts?: string;

  /** NEW: Preferred Instructional Design Methodology */
  preferredMethodology?: keyof typeof PreferredMethodology | string;

  /** Optional rationale or purpose */
  instructionalPurpose?: keyof typeof InstructionalPurpose | string;

  /** NEW: Company images to be used in the storyboard/module */
  companyImages?: CompanyImage[];

  /** @deprecated replaced by preferredMethodology */
  primaryLearningMode?: keyof typeof LearningMode | string;
  /** @deprecated */
  secondaryLearningMode?: keyof typeof LearningMode | string;
  /** @deprecated removed from UI */
  screenType?: keyof typeof ScreenType | string;
  /** @deprecated removed from UI */
  interactionStyle?: keyof typeof InteractionStyle | string;

  learningOutcomes?: string | string[];
  mainContent?: string;
  content?: string;

  aiModel?: string;
  additionalNotes?: string;

  projectManager?: string;
  instructionalDesigner?: string;
  sme?: string;
};
