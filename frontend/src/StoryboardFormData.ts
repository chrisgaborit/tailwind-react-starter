/**
 * Frontend: Storyboard Form Data (extended)
 * - Adds role/audience, tone, separation rules (OST vs VO), progressive disclosure preference.
 * - Non-breaking: existing fields remain; new ones are optional with sensible defaults.
 */

export type LearningMode =
  | "storytelling"
  | "branching"
  | "procedural"
  | "scenario-led"
  | "demo-practice"
  | "assessment-first";

export type ModuleType =
  | "Compliance"
  | "Onboarding"
  | "Product"
  | "Soft Skills"
  | "Leadership"
  | "Sales"
  | "Service"
  | "Safety"
  | "General";

export interface BrandingPrefs {
  colours?: string; // e.g. "Brilliant Blue #0387E6; Vivid Red #E63946; Bright Purple #BC57CF"
  fonts?: string;   // e.g. "Outfit for headings; Inter for body"
  logos?: string[]; // asset filenames
}

export interface StoryboardFormData {
  /** Required */
  moduleName: string;

  /** Strongly recommended */
  audience?: string; // "Claims staff", "Underwriting", "Leaders", etc.
  roles?: string[];  // Used to force role-based examples
  moduleType?: ModuleType;
  level?: "Level 1" | "Level 2" | "Level 3" | "Level 4" | 1 | 2 | 3 | 4;
  durationMins?: number; // numeric preference; backend clamps if needed
  tone?: string; // e.g. "Professional, supportive, empathetic"
  learningMode?: LearningMode;

  /** OST vs VO behaviour */
  separateVOandOST?: boolean; // default true
  progressiveDisclosurePref?: "hover" | "click" | "none"; // hint for UI patterns

  /** Objectives (performance-based encouraged) */
  learningObjectives?: string[];

  /** Content seeds */
  keyConcepts?: string[];     // LLM will be asked to expand each with at least one role-based example
  scenariosMustInclude?: string[]; // phrases or dilemmas you *must* see in branching
  complianceFocusAreas?: string[]; // triggers timeframe tables (e.g., "Complaints", "Claims")

  /** Branding */
  branding?: BrandingPrefs;

  /** Instructional design method (optional hint) */
  idMethod?: string; // e.g., "Gagné 9 events", "Kolb Experiential", "Empathy-first"

  /** Advanced */
  aiModel?: "gpt-5" | "gpt-4o" | "gpt-4-turbo";
}

/** Reasonable defaults helper (use in frontend before POST if needed) */
export function withStoryboardDefaults<T extends Partial<StoryboardFormData>>(form: T): StoryboardFormData {
  return {
    moduleName: form.moduleName || "Untitled Module",
    audience: form.audience || "General staff",
    roles: form.roles || [],
    moduleType: (form.moduleType as ModuleType) || "General",
    level: (form.level as any) || "Level 2",
    durationMins: form.durationMins ?? 15,
    tone: form.tone || "Professional, supportive, empathetic",
    learningMode: form.learningMode || "scenario-led",
    separateVOandOST: form.separateVOandOST !== false,
    progressiveDisclosurePref: form.progressiveDisclosurePref || "hover",
    learningObjectives: form.learningObjectives || [],
    keyConcepts: form.keyConcepts || [],
    scenariosMustInclude: form.scenariosMustInclude || [],
    complianceFocusAreas: form.complianceFocusAreas || [],
    branding: form.branding || {},
    idMethod: form.idMethod || "Empathy-first",
    aiModel: form.aiModel || "gpt-4o",
  };
}