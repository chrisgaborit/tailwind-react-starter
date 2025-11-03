/**
 * Interactivity Profiles by Level (L1–L4)
 * - Central “governor” for scenario density, knowledge checks, progressive disclosure, etc.
 * - Used by enforceInteractiveDensity() to tune the storyboard after LLM generation.
 */

export type LevelString = "Level 1" | "Level 2" | "Level 3" | "Level 4";

export interface InteractivityProfile {
  level: LevelString;
  /** Minimum number of *branching* dilemmas across the module */
  minScenarioBranches: number;
  /** Minimum total knowledge checks (single or multi) */
  minKnowledgeChecks: number;
  /** Insert a KC every X scenes if the LLM output is sparse */
  kcPerXScenes: number;
  /** Allow guided interface tours (hotspots, reveal-on-hover) */
  allowHotspots: boolean;
  /** Force progressive disclosure for concept-heavy scenes */
  progressiveDisclosure: boolean;
  /** Encourage advanced patterns like drag-drop, matching, timeline */
  advancedPatterns: boolean;
  /** Preferred max bullet length for scannable OST (approx words) */
  maxOstBulletWords: number;
  /** Ensure at least one role-specific example per concept section */
  requireRoleExamples: boolean;
  /** Ensure compliance/performance tables if module type hints compliance */
  requireComplianceTables: boolean;
}

/** Module-type hints (lightweight), used to adjust profile expectations. */
export type ModuleTypeHint =
  | "Compliance"
  | "Onboarding"
  | "Product"
  | "Soft Skills"
  | "Leadership"
  | "Sales"
  | "Service"
  | "Safety"
  | "General";

/** Base defaults by level */
const BASE_BY_LEVEL: Record<LevelString, InteractivityProfile> = {
  "Level 1": {
    level: "Level 1",
    minScenarioBranches: 1,
    minKnowledgeChecks: 3,
    kcPerXScenes: 3,
    allowHotspots: true,
    progressiveDisclosure: true,
    advancedPatterns: false,
    maxOstBulletWords: 10,
    requireRoleExamples: true,
    requireComplianceTables: false,
  },
  "Level 2": {
    level: "Level 2",
    minScenarioBranches: 2,
    minKnowledgeChecks: 4,
    kcPerXScenes: 3,
    allowHotspots: true,
    progressiveDisclosure: true,
    advancedPatterns: true,
    maxOstBulletWords: 10,
    requireRoleExamples: true,
    requireComplianceTables: false,
  },
  "Level 3": {
    level: "Level 3",
    minScenarioBranches: 3,
    minKnowledgeChecks: 5,
    kcPerXScenes: 2,
    allowHotspots: true,
    progressiveDisclosure: true,
    advancedPatterns: true,
    maxOstBulletWords: 9,
    requireRoleExamples: true,
    requireComplianceTables: true,
  },
  "Level 4": {
    level: "Level 4",
    minScenarioBranches: 4,
    minKnowledgeChecks: 6,
    kcPerXScenes: 2,
    allowHotspots: true,
    progressiveDisclosure: true,
    advancedPatterns: true,
    maxOstBulletWords: 8,
    requireRoleExamples: true,
    requireComplianceTables: true,
  },
};

/** Light module-type modifiers */
const TYPE_MODIFIERS: Partial<Record<ModuleTypeHint, Partial<InteractivityProfile>>> = {
  Compliance: { requireComplianceTables: true, minKnowledgeChecks: 5 },
  Onboarding: { minScenarioBranches: 2 },
  Product: { advancedPatterns: true },
  "Soft Skills": { minScenarioBranches: 2 },
  Leadership: { minScenarioBranches: 3 },
  Sales: { minScenarioBranches: 2 },
  Service: { minScenarioBranches: 2 },
  Safety: { requireComplianceTables: true, minKnowledgeChecks: 5 },
  General: {},
};

/**
 * pickProfile
 * - Returns an InteractivityProfile tuned for level + module type.
 */
export function pickProfile(
  level?: string | number | null,
  moduleType?: string | null
): InteractivityProfile {
  // Normalise level
  let lvl: LevelString = "Level 2";
  const lv = String(level ?? "").trim();
  if (lv === "1" || /level\s*1/i.test(lv)) lvl = "Level 1";
  else if (lv === "3" || /level\s*3/i.test(lv)) lvl = "Level 3";
  else if (lv === "4" || /level\s*4/i.test(lv)) lvl = "Level 4";

  // Base
  const base = { ...BASE_BY_LEVEL[lvl] };

  // Apply module-type hint
  const hint = normaliseTypeHint(moduleType);
  const mod = TYPE_MODIFIERS[hint] || {};
  return { ...base, ...mod };
}

function normaliseTypeHint(moduleType?: string | null): ModuleTypeHint {
  const mt = (moduleType || "").toLowerCase();
  if (/compliance|licop|code|policy|regulat/.test(mt)) return "Compliance";
  if (/onboard/.test(mt)) return "Onboarding";
  if (/product|feature|release/.test(mt)) return "Product";
  if (/soft|behavio|interperson|eq|emotional/.test(mt)) return "Soft Skills";
  if (/leader|manager|leadership/.test(mt)) return "Leadership";
  if (/sale|prospect|pipeline/.test(mt)) return "Sales";
  if (/service|support|cx|customer/.test(mt)) return "Service";
  if (/safety|hse|ohs/.test(mt)) return "Safety";
  return "General";
}

/** Common distractor seeds used by the KC builder */
export const GENERIC_DISTRACTOR_SEEDS = [
  "Accountability",
  "Accessibility",
  "Accuracy",
  "Ownership",
  "Collaboration",
  "Independence",
  "Autonomy",
  "Innovation",
  "Engagement",
  "Sustainability",
  "Governance",
  "Quality Assurance",
];

/** Terms often confused with compliance/service principles */
export const COMPLIANCE_CONFUSABLES = [
  "Expediency",
  "Persuasion",
  "Acquisition",
  "Conversion",
  "Customer Delight",
  "Personalisation",
  "Brand Voice",
  "Audit Readiness",
  "Operational Efficiency",
];