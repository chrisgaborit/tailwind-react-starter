/**
 * Frontend: Storyboard Form Data (extended)
 * - Adds role/audience, tone, separation rules (OST vs VO), progressive disclosure preference.
 * - Non-breaking: existing fields remain; new ones are optional with sensible defaults.
 */

import type { GenerationOptions } from '@/types';

// NEW STRATEGIC CATEGORIES
export type StrategicCategory =
  | "Compliance & Risk Management"
  | "Leadership & Management Development"
  | "Sales & Customer Excellence"
  | "Technical & Systems Mastery"
  | "Onboarding & Culture Integration"
  | "Professional Skills Development"
  | "Health, Safety & Wellbeing"
  | "Diversity, Equity & Inclusion"
  | "Innovation & Future Readiness"
  | "Product & Service Excellence"
  | "Custom Strategic Initiative";

// NEW BUSINESS IMPACT METRICS
export type BusinessImpactMetric =
  | "Risk mitigation"
  | "Cost reduction"
  | "Revenue growth"
  | "Productivity"
  | "Quality"
  | "Engagement"
  | "Safety"
  | "Compliance"
  | "Retention";

// NEW INNOVATION STRATEGIES
export type InnovationStrategy =
  | "AI-Powered Simulation"
  | "Branching Scenarios with Consequences"
  | "Real-Work Application"
  | "Social Learning Community"
  | "VR/AR Immersive Experience"
  | "Microlearning Performance Support"
  | "Adaptive Learning Paths"
  | "Gamified Progression"
  | "Peer-to-Peer Coaching";

// NEW MEASUREMENT APPROACHES
export type MeasurementApproach =
  | "Level 1: Satisfaction surveys"
  | "Level 2: Knowledge assessment"
  | "Level 3: Behavior observation"
  | "Level 4: Business impact tracking"
  | "Level 5: ROI calculation";

// LEGACY TYPES (keeping for backward compatibility)
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

  /** NEW STRATEGIC FIELDS - REQUIRED */
  strategicCategory?: StrategicCategory;
  businessImpact?: {
    metric: BusinessImpactMetric;
    targetImprovement: number; // percentage
    timeframe: 30 | 60 | 90 | 180; // days
    successDefinition: string;
  };
  innovationStrategies?: InnovationStrategy[];
  measurementApproaches?: MeasurementApproach[];

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
  
  /** Generation options */
  options?: GenerationOptions;

  /** Content seeds */
  keyConcepts?: string[];     // LLM will be asked to expand each with at least one role-based example
  scenariosMustInclude?: string[]; // phrases or dilemmas you *must* see in branching
  complianceFocusAreas?: string[]; // triggers timeframe tables (e.g., "Complaints", "Claims")

  /** Branding */
  branding?: BrandingPrefs;

  /** Instructional design method (optional hint) */
  idMethod?: string; // e.g., "Gagné 9 events", "Kolb Experiential", "Empathy-first"

  /** Advanced */
  aiModel?: "gpt-4o" | "gpt-4o" | "gpt-4-turbo";
}

/** Reasonable defaults helper (use in frontend before POST if needed) */
export function withStoryboardDefaults<T extends Partial<StoryboardFormData>>(form: T): StoryboardFormData {
  return {
    moduleName: form.moduleName || "Untitled Module",
    
    // NEW STRATEGIC DEFAULTS
    strategicCategory: form.strategicCategory || "Professional Skills Development",
    businessImpact: form.businessImpact || {
      metric: "Productivity",
      targetImprovement: 15,
      timeframe: 90,
      successDefinition: "Measurable improvement in key performance indicators"
    },
    innovationStrategies: form.innovationStrategies || ["Branching Scenarios with Consequences"],
    measurementApproaches: form.measurementApproaches || ["Level 2: Knowledge assessment", "Level 3: Behavior observation"],
    
    // EXISTING DEFAULTS
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