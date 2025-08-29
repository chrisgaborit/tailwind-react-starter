// frontend/src/constants.ts

// =====================
// App Metadata
// =====================
export const APP_TITLE = "Learno Storyboard Generator";
export const APP_TAGLINE =
  "Craft Brandon Hall–calibre storyboards with consistent structure and accessibility.";

// =====================
// Error / Status Copy
// =====================
export const GENERIC_ERROR_MESSAGE =
  "Sorry—something went wrong. Please try again in a moment.";
export const FORM_ERROR_MESSAGE =
  "Please check the form fields and try again.";
export const NETWORK_ERROR_MESSAGE =
  "We couldn’t reach the server. Check your connection and try again.";
export const LOADING_MESSAGE = "Generating your storyboard…";

// =====================
// UI Hints / Help Text
// =====================
// (Broader hint so users aren’t constrained to 10–30)
export const DURATION_HINT =
  "Choose a duration between 1–90 minutes. The scene target scales with duration and level.";
export const LEVEL_HINT =
  "Higher levels include richer interactivity and more scenes.";
export const TONE_HINT =
  "Choose a tone that suits your audience. You can refine later.";

// Optional global duration bounds (used by numeric input guards)
export const DURATION_MIN = 1;
export const DURATION_MAX = 90;
export const DEFAULT_DURATION_MIN = 20;

// =====================
// Complexity Levels
// =====================
export const COMPLEXITY_LEVEL_OPTIONS = ["Level 1", "Level 2", "Level 3", "Level 4"];

export const LEVEL_DESCRIPTIONS: Record<string, string> = {
  "Level 1": "Foundational: read-and-recall, light checks.",
  "Level 2": "Applied: moderate interactions, scenario seeds.",
  "Level 3": "Branching: complex interactions, realistic practice.",
  "Level 4": "Immersive: simulations, gamification, rich media.",
};

// A gentle target band per level (for UI copy/hints)
export const LEVEL_TO_SCENE_TARGET: Record<string, { min: number; max: number }> = {
  "Level 1": { min: 8,  max: 12 },
  "Level 2": { min: 12, max: 18 },
  "Level 3": { min: 18, max: 26 },
  "Level 4": { min: 20, max: 34 },
};

// =====================
// Tone Options (UI)
// =====================
export const TONES = [
  "Professional & Clear",
  "Supportive & Encouraging",
  "Conversational & Friendly",
  "Authoritative & Concise",
  "Playful & Light",
  "Formal & Academic",
] as const;

// =====================
// Module Types (UI)
// =====================
export const MODULE_TYPES = [
  "Compliance",
  "Onboarding",
  "Sales Enablement",
  "Product Training",
  "Leadership",
  "Health & Safety",
] as const;

// =====================
// Languages (12 total)
// =====================
// Top languages + key Indian languages
export const OUTPUT_LANGUAGES = [
  "English (UK)",
  "English (US)",
  "French",
  "German",
  "Spanish",
  "Portuguese",
  "Chinese (Simplified)",
  "Japanese",
  "Arabic",
  "Hindi",
  "Bengali",
  "Tamil",
] as const;

// Legacy aliases used by some components
export const SUPPORTED_LANGUAGES = OUTPUT_LANGUAGES;
export const LANGUAGES = OUTPUT_LANGUAGES;

// Ready-to-render select options
export const LANGUAGE_OPTIONS = OUTPUT_LANGUAGES.map((lang) => ({
  value: lang,
  label: lang,
}));

// =====================
// Interaction Frequency
// =====================
export const INTERACTION_FREQUENCY_OPTIONS = [
  "Let AI Decide",
  "Low",
  "Medium",
  "High",
] as const;

// =====================
// Duration helpers
// =====================
// Allow *every* minute from 1 to 90 so users can start with 1, 2, 3, etc.
export const DURATION_OPTIONS = Array.from({ length: DURATION_MAX }, (_, i) => `${i + 1} minutes`) as const;

export const minutesFromDurationLabel = (label?: string): number | null => {
  if (!label) return null;
  const m = label.match(/\d+/)?.[0];
  return m ? Number(m) : null;
};

// =====================
// AI Model options (shared)
// =====================
export const AI_MODEL_OPTIONS = ["gpt-5", "gpt-4o", "gpt-4-turbo"] as const;

// =====================
// Instructional Design methods (shared)
// =====================
export const ID_METHOD_OPTIONS = [
  "ADDIE (Analyze–Design–Develop–Implement–Evaluate)",
  "SAM (Successive Approximation Model)",
  "Merrill’s First Principles",
  "Gagné’s Nine Events",
  "Backward Design",
  "Bloom-aligned Planning",
] as const;

// =====================
// Backend URL (optional convenience export)
// =====================
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;