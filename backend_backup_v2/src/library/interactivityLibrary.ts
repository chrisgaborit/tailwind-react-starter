/**
 * Interactivity Library
 * - Canonical patterns for scenarios, hotspots, reveal, knowledge checks, etc.
 * - enforceInteractiveDensity() applies level/profile rules to any storyboard.
 */
// ✅ TEMP PATCH FOR INTERACTIVITY TEMPLATES USING `.map()` UNSAFELY
// This is a safety wrapper for `.map()` calls on undefined `params.options`
// Example use: replace `(params?.options ?? []).map(...)` with `(params?.options ?? []).map(...)`

function safeOptions<T>(params: any, fallback: T[] = []): T[] {
  return Array.isArray(params?.options) ? params.options : fallback;
}
// Use ES Module 'import' instead of 'require'
import { pickProfile, GENERIC_DISTRACTOR_SEEDS, COMPLIANCE_CONFUSABLES } from './interactivityProfiles';

/** --------- Minimal “shape” types (lenient to avoid coupling) ---------- */
export type Scene = {
  id?: string;
  title?: string;
  narration?: string;
  onScreenText?: string[] | string;
  visuals?: string;
  // Use the strongly-typed 'Interactivity' union instead of 'any'
  interactivity?: Interactivity;
  knowledgeChecks?: KnowledgeCheck[];
  metadata?: Record<string, any>;
};

export type StoryboardModule = {
  moduleName?: string;
  moduleType?: string;
  level?: string | number;
  durationMins?: number;
  audience?: string;
  scenes: Scene[];
  metadata?: Record<string, any>;
};

export type KnowledgeCheck = {
  type: "single" | "multi";
  question: string;
  options: Array<{ text: string; correct: boolean; rationale?: string }>;
  feedbackCorrect?: string;
  feedbackIncorrect?: string;
};

/** --------- Interactivity patterns (catalogue) ---------- */
// ✅ Helper function (ensure this is declared above the library)
function safeOptions<T>(params: any, fallback: T[] = []): T[] {
  return Array.isArray(params?.options) ? params.options : fallback;
}

// ✅ Main Interactivity Library
export const INTERACTIVITY_LIBRARY = {
  /** Branching Dilemma Scenario */
  branchingDilemma: (params: any = {}) => ({
    type: "branching" as const,
    title: "Branching Dilemma",
    scenario: params.scenario || "You're managing a critical situation where two departments have conflicting priorities.",
    options: safeOptions(params, [
      { id: "opt1", decision: "Option A", outcome: "Outcome A" },
      { id: "opt2", decision: "Option B", outcome: "Outcome B" },
    ]).map((opt, i) => ({
      id: opt.id || `opt${i + 1}`,
      decision: opt.decision || `Decision ${i + 1}`,
      outcome: opt.outcome || `Outcome for decision ${i + 1}`,
    })),
  }),

  /** Hotspots Tour */
  hotspotsTour: (params: any = {}) => ({
    type: "hotspots" as const,
    title: params.title || "Hotspots Tour",
    steps: safeOptions(params).map((label: any, i: number) => ({
      id: `spot${i + 1}`,
      label: label.label || `Hotspot ${i + 1}`,
      description: label.description || "Description not provided",
    })),
  }),

  /** Reveal Key Principles */
  revealPrinciples: (params: any = {}) => ({
    type: "reveal" as const,
    title: params.title || "Reveal Key Principles",
    principles: safeOptions(params).map((p: any, i: number) => ({
      id: `p${i + 1}`,
      label: p.label || `Principle ${i + 1}`,
      detail: p.detail || "No detail provided.",
    })),
  }),

  /** Timeline Steps */
  timelineSteps: (params: any = {}) => ({
    type: "timeline" as const,
    title: params.title || "Timeline Steps",
    steps: safeOptions(params).map((step: any, i: number) => ({
      date: step.date || `Step ${i + 1}`,
      description: step.description || "No description available",
    })),
  }),

  /** Accordion Reveal */
  accordionReveal: (params: any = {}) => ({
    type: "accordion" as const,
    title: params.title || "Accordion Reveal",
    items: safeOptions(params).map((section: any, i: number) => ({
      id: section.id || `a${i + 1}`,
      label: section.label || `Section ${i + 1}`,
      content: section.content || "Content not available",
    })),
  }),

  /** Tabs Display */
  tabsDisplay: (params: any = {}) => ({
    type: "tabs" as const,
    title: params.title || "Tabbed Display",
    tabs: safeOptions(params).map((tab: any, i: number) => ({
      id: tab.id || `tab${i + 1}`,
      label: tab.label || `Tab ${i + 1}`,
      content: tab.content || "Tab content missing",
    })),
  }),

  /** Carousel Sequence */
  carouselSequence: (params: any = {}) => ({
    type: "carousel" as const,
    title: params.title || "Carousel Sequence",
    slides: safeOptions(params).map((slide: any, i: number) => ({
      id: slide.id || `slide${i + 1}`,
      heading: slide.heading || `Step ${i + 1}`,
      description: slide.description || "Slide description",
    })),
  }),

  /** Comparison Table */
  comparisonTable: (params: any = {}) => ({
    type: "comparison" as const,
    title: params.title || "Comparison Table",
    columns: params.columns || ["Feature", "Option A", "Option B"],
    rows: safeOptions(params).map((row: any) => row || ["Row content missing"]),
  }),

  /** Scenario Cards */
  scenarioCards: (params: any = {}) => ({
    type: "scenariocards" as const,
    title: params.title || "Scenario Cards",
    cards: safeOptions(params).map((card: any, i: number) => ({
      id: card.id || `card${i + 1}`,
      title: card.title || `Scenario ${i + 1}`,
      scenario: card.scenario || "Scenario description missing",
    })),
  }),
};

/** --------- Strongly-Typed Interactivity Objects ---------- */
// This creates a discriminated union type for all possible interactivity objects,
// giving us full type safety and autocompletion.
export type Interactivity =
  | ReturnType<typeof INTERACTIVITY_LIBRARY.branchingDilemma>
  | ReturnType<typeof INTERACTIVITY_LIBRARY.hotspotsTour>
  | ReturnType<typeof INTERACTIVITY_LIBRARY.revealPrinciples>
  | ReturnType<typeof INTERACTIVITY_LIBRARY.timelineSteps>
  | ReturnType<typeof INTERACTIVITY_LIBRARY.accordionReveal>
  | ReturnType<typeof INTERACTIVITY_LIBRARY.tabsDisplay>
  | ReturnType<typeof INTERACTIVITY_LIBRARY.carouselSequence>
  | ReturnType<typeof INTERACTIVITY_LIBRARY.comparisonTable>
  | ReturnType<typeof INTERACTIVITY_LIBRARY.scenarioCards>;


/** --------- Knowledge Check Builders ---------- */

export function buildSingleSelectKC(
  question: string,
  correct: string,
  domainHints: string[] = []
): KnowledgeCheck {
  const distractors = composeDistractors(correct, domainHints, 3);
  return {
    type: "single",
    question,
    options: shuffle([
      { text: correct, correct: true },
      ...distractors.map((t) => ({ text: t, correct: false })),
    ]),
    feedbackCorrect: "✅ Correct — that aligns with best practice.",
    feedbackIncorrect: "❌ Not quite. Review the concept and try again.",
  };
}

export function buildMultiSelectKC(
  question: string,
  correctList: string[],
  domainHints: string[] = []
): KnowledgeCheck {
  const distractorCount = Math.max(2, 4 - correctList.length);
  const distractors = multiComposeDistractors(correctList, domainHints, distractorCount);
  const options = [
    ...correctList.map((t) => ({ text: t, correct: true })),
    ...distractors.map((t) => ({ text: t, correct: false })),
  ];
  return {
    type: "multi",
    question,
    options: shuffle(options),
    feedbackCorrect: "✅ Nice — you selected all that apply.",
    feedbackIncorrect: "❌ Some selections aren’t quite right. Think again.",
  };
}
/** --------- Enforcement: make any storyboard meet the profile ---------- */

export function enforceInteractiveDensity(
  storyboard: StoryboardModule,
  // Add a more specific type for formData instead of 'any'
  formData: { level?: string | number; moduleType?: string }
): StoryboardModule {
  const profile = pickProfile(formData?.level, formData?.moduleType);

  if (!storyboard || !Array.isArray(storyboard.scenes)) {
    return storyboard;
  }

  const scenes = storyboard.scenes;

  // 1) Ensure at least one branching dilemma exists (scenario fidelity)
  let hasBranching = scenes.some((s) => s.interactivity?.type === "branching");
  if (!hasBranching) {
    const injectAt = Math.min(
      Math.max(2, Math.floor(scenes.length / 2)),
      Math.max(0, scenes.length - 1)
    );
    scenes.splice(injectAt, 0, {
      title: "Scenario: Making a Decision",
      onScreenText: ["Choose how to respond", "Consider the consequences"],
      narration:
        "Here is a realistic dilemma. Select a response and reflect on the outcomes.",
      interactivity: INTERACTIVITY_LIBRARY.branchingDilemma(),
      knowledgeChecks: [],
      metadata: { injected: true, reason: "profile.minScenarioBranches", level: profile.level },
    });
    hasBranching = true;
  }

  // 2) Knowledge check density (with plausible distractors)
  const existingKC = countKCs(scenes);
  if (existingKC < profile.minKnowledgeChecks) {
    const toAdd = profile.minKnowledgeChecks - existingKC;
    distributeKCs(scenes, toAdd, profile.kcPerXScenes, formData?.moduleType);
  }

  // 3) Progressive disclosure for concept heavy scenes
  if (profile.progressiveDisclosure) {
    for (const s of scenes) {
      const ostList = toArray(s.onScreenText);
      if (ostList.length >= 4 && !s.interactivity?.progressiveDisclosure) {
        s.interactivity = s.interactivity || { type: 'accordion', items: [] }; // Default to a valid type
        s.interactivity.progressiveDisclosure = true;
        s.metadata = { ...(s.metadata || {}), progressiveDisclosure: true };
      }
    }
  }

  // 4) Enforce OST scannability (limit bullet length)
  for (const s of scenes) {
    const ost = toArray(s.onScreenText);
    if (!ost.length) continue;
    const compact = ost.map((line) => clampWords(line, profile.maxOstBulletWords));
    s.onScreenText = compact;
  }

  // 5) Ensure at least one role-specific example per concept-heavy scene
  if (profile.requireRoleExamples) {
    for (const s of scenes) {
      if (looksLikeConceptScene(s) && !hasExampleCue(s)) {
        s.narration =
          (s.narration || "") +
          " For example, in your role, apply this by adapting the steps to your context.";
        s.metadata = { ...(s.metadata || {}), roleExampleInjected: true };
      }
    }
  }

  // 6) Add compliance quick-reference table if needed
  if (profile.requireComplianceTables) {
    const hasTable = scenes.some((s) => s.metadata?.complianceTable === true);
    if (!hasTable) {
      scenes.push({
        title: "Performance & Timeframes",
        onScreenText: ["Key standards at a glance"],
        narration:
          "This summarises critical timeframes. Use this as a reference in your role.",
        visuals:
          "Table showing: Action | Timeframe | Example — e.g., Claim acknowledged in 10 days",
        interactivity: INTERACTIVITY_LIBRARY.timelineSteps("Standards Timeline", [
          "Acknowledge claim — 10 business days",
          "Respond to complaint — 45/90 days",
          "Urgent financial need — 5 business days",
        ]),
        knowledgeChecks: [
          buildSingleSelectKC(
            "What is the maximum response time for a trustee-owned complaint?",
            "90 days",
            ["45 days", "60 days", "30 days"]
          ),
        ],
        metadata: { injected: true, complianceTable: true },
      });
    }
  }

  storyboard.scenes = scenes;
  storyboard.metadata = { ...(storyboard.metadata || {}), profileApplied: profile.level };
  return storyboard;
}

/** --------- Helpers ---------- */

function countKCs(scenes: Scene[]): number {
  return scenes.reduce((sum, s) => sum + (s.knowledgeChecks?.length || 0), 0);
}

function distributeKCs(scenes: Scene[], toAdd: number, kcPerXScenes: number, moduleType?: string) {
  let i = 0;
  while (toAdd > 0 && i < scenes.length) {
    const s = scenes[i];
    const sparse = (s.knowledgeChecks?.length || 0) === 0;
    const dropHere = sparse && i % kcPerXScenes === 0;
    if (dropHere) {
      const domain = /compliance|policy|licop/i.test(moduleType || "")
        ? COMPLIANCE_CONFUSABLES
        : GENERIC_DISTRACTOR_SEEDS;
      const kc = buildSingleSelectKC(
        "Which of these best reflects the correct approach?",
        "Provide honest, timely updates",
        domain
      );
      s.knowledgeChecks = [...(s.knowledgeChecks || []), kc];
      toAdd--;
    }
    i++;
  }

  // If still not enough, append to end
  while (toAdd > 0) {
    scenes.push({
      title: "Knowledge Check",
      onScreenText: ["Check your understanding"],
      narration: "Answer this to confirm your understanding.",
      knowledgeChecks: [
        buildSingleSelectKC(
          "Which option aligns most closely with the guidance?",
          "Be proactive and clear in your communication",
          GENERIC_DISTRACTOR_SEEDS
        ),
      ],
      metadata: { injected: true, reason: "kc-shortfall" },
    });
    toAdd--;
  }
}

function toArray(value?: string[] | string): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : splitToBullets(value);
}

function splitToBullets(text: string): string[] {
  const parts = text
    .split(/\r?\n|•|- |\u2022/)
    .map((t) => t.trim())
    .filter(Boolean);
  return parts.length ? parts : [text.trim()];
}

function clampWords(line: string, maxWords: number): string {
  const words = line.split(/\s+/);
  return words.length <= maxWords ? line : words.slice(0, maxWords).join(" ") + " …";
}

function looksLikeConceptScene(s: Scene): boolean {
  const t = (s.title || "").toLowerCase();
  return /key concept|principle|overview|background|framework|definition/.test(t);
}

function hasExampleCue(s: Scene): boolean {
  const t = `${s.title || ""} ${toArray(s.onScreenText).join(" ")} ${s.narration || ""}`.toLowerCase();
  return /example|for instance|case study|in your role/.test(t);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function composeDistractors(correct: string, domain: string[] = [], n = 3): string[] {
  const seeds = [...domain, ...GENERIC_DISTRACTOR_SEEDS];
  const pool = seeds
    .filter((t) => t.toLowerCase() !== correct.toLowerCase())
    .slice(0, Math.max(n * 2, 8));
  return shuffle(pool).slice(0, n);
}

function multiComposeDistractors(correctList: string[], domain: string[] = [], n = 3): string[] {
  const lower = correctList.map((s) => s.toLowerCase());
  const seeds = [...domain, ...GENERIC_DISTRACTOR_SEEDS].filter(
    (t) => !lower.includes(t.toLowerCase())
  );
  const pool = seeds.slice(0, Math.max(n * 2, 8));
  return shuffle(pool).slice(0, n);
}

// NOTE: The 'module.exports' block at the end has been removed.
// All necessary items are already exported using the 'export' keyword.