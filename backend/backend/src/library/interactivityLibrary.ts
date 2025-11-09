/**
 * Interactivity Library
 * - Canonical patterns for scenarios, hotspots, reveal, knowledge checks, etc.
 * - enforceInteractiveDensity() applies level/profile rules to any storyboard.
 */

import { pickProfile, GENERIC_DISTRACTOR_SEEDS, COMPLIANCE_CONFUSABLES } from "./interactivityProfiles";

/** --------- Minimal “shape” types (lenient to avoid coupling) ---------- */
type Scene = {
  id?: string;
  title?: string;
  narration?: string;
  onScreenText?: string[] | string;
  visuals?: string;
  interactivity?: any;
  knowledgeChecks?: KnowledgeCheck[];
  metadata?: Record<string, any>;
};

type StoryboardModule = {
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

export const INTERACTIVITY_LIBRARY = {
  branchingDilemma: (opts?: Partial<BranchingOpts>) => ({
    type: "branching",
    purpose: "Decision-making in realistic context",
    layout: "Two-to-three choice dilemma with immediate feedback",
    behaviour:
      "Learner picks a path; each branch provides consequence, coaching tip, and optional retry",
    progressiveDisclosure: true,
    branches: [
      {
        choice: opts?.choiceA || "Schedule a private check-in",
        outcomeOST: "Builds trust; clarifies blockers",
        feedbackVO:
          "Great choice. Start with a supportive 1:1 to understand context and co-create a recovery plan.",
      },
      {
        choice: opts?.choiceB || "Escalate immediately",
        outcomeOST: "May damage psychological safety",
        feedbackVO:
          "Escalation can be necessary, but use it after you’ve explored root causes and support options.",
      },
      ...(opts?.choiceC
        ? [
            {
              choice: opts.choiceC,
              outcomeOST: opts.outcomeC || "Inconsistent follow-up",
              feedbackVO:
                opts.feedbackC ||
                "Mixed signals reduce accountability. Be explicit about expectations and timeframes.",
            },
          ]
        : []),
    ],
  }),
  hotspotsTour: (items: string[]) => ({
    type: "hotspots",
    purpose: "Interface or process familiarisation",
    behaviour: "Click each hotspot to reveal concise explanations",
    progressiveDisclosure: true,
    items: items.map((label, i) => ({
      id: `hs-${i + 1}`,
      label,
      ost: `${label} — click to reveal details`,
      vo: `This hotspot explains ${label} and when to use it effectively.`,
    })),
  }),
  revealPrinciples: (title: string, pairs: Array<{ term: string; definition: string }>) => ({
    type: "reveal",
    title,
    purpose: "Progressive disclosure of dense concepts",
    behaviour: "Hover or click to reveal explanations",
    items: pairs.map((p, i) => ({
      id: `rev-${i + 1}`,
      label: p.term,
      definition: p.definition,
    })),
    progressiveDisclosure: true,
  }),
  timelineSteps: (title: string, steps: string[]) => ({
    type: "timeline",
    title,
    purpose: "Show ordered steps/timeframes",
    behaviour: "Navigate steps to reveal guidance",
    steps: steps.map((s, i) => ({ index: i + 1, label: s })),
  }),
};

/** --------- KC builders ---------- */

export function buildSingleSelectKC(
  question: string,
  correct: string,
  domainHints: string[] = []
): KnowledgeCheck {
  const distractors = composeDistractors(correct, domainHints, 3);
  return {
    type: "single",
    question,
    options: shuffle([{ text: correct, correct: true }, ...distractors.map((t) => ({ text: t, correct: false }))]),
    feedbackCorrect: "Correct — that aligns with best practice.",
    feedbackIncorrect: "Not quite. Review the concept and try again.",
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
    feedbackCorrect: "Nice — you selected all that apply.",
    feedbackIncorrect: "Some selections aren’t quite right. Consider what the definition excludes.",
  };
}

/** --------- Enforcement: make any storyboard meet the profile ---------- */

export function enforceInteractiveDensity(storyboard: StoryboardModule, formData: any): StoryboardModule {
  console.log("📚 Interactivity templates loaded:", Object.keys(INTERACTIVITY_LIBRARY).length);
  const profile = pickProfile(formData?.level, formData?.moduleType);

  if (!storyboard || !Array.isArray(storyboard.scenes)) {
    return storyboard;
  }

  const scenes = storyboard.scenes;

  // 1) Ensure at least one branching dilemma exists (scenario fidelity)
  let hasBranching = scenes.some((s) => s.interactivity?.type === "branching");
  if (!hasBranching) {
    const injectAt = Math.min( Math.max(2, Math.floor(scenes.length / 2)), Math.max(0, scenes.length - 1) );
    scenes.splice(injectAt, 0, {
      title: "Scenario: Handling a Difficult Decision",
      onScreenText: ["Choose how to respond", "Consider impact on trust and outcomes"],
      narration:
        "Here is a realistic dilemma. Choose a response that balances empathy, accountability, and performance.",
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
        s.interactivity = s.interactivity || {};
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

  // 5) Ensure at least one role-specific example per concept-heavy scene (light heuristic)
  if (profile.requireRoleExamples) {
    for (const s of scenes) {
      if (looksLikeConceptScene(s) && !hasExampleCue(s)) {
        s.narration = (s.narration || "") + " For example, in your role, apply this by adapting the steps to your context.";
        s.metadata = { ...(s.metadata || {}), roleExampleInjected: true };
      }
    }
  }

  // 6) Compliance/performance tables for compliance-like modules
  if (profile.requireComplianceTables) {
    const hasTable = scenes.some((s) => s.metadata?.complianceTable === true);
    if (!hasTable) {
      scenes.push({
        title: "Performance & Timeframes",
        onScreenText: ["Key timeframes at a glance", "Use this as your quick-reference"],
        narration:
          "This table summarises critical timeframes and performance standards. Keep it handy and align your actions to these benchmarks.",
        visuals:
          "Table: Activity | Standard/Timeframe | Notes. Include typical examples for Claims, Underwriting, Complaints.",
        interactivity: INTERACTIVITY_LIBRARY.timelineSteps("Key Activities", [
          "Acknowledge claim receipt — within 10 business days",
          "Update claim progress — every 20 business days",
          "Urgent financial need — within 5 business days",
          "Final response on complaint — 45 or 90 days depending on policy owner",
        ]),
        knowledgeChecks: [
          buildSingleSelectKC(
            "What is the maximum timeframe for final response when a policy is owned by a superannuation trustee?",
            "90 days",
            ["45 days", "60 days", "20 business days"]
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
      const domain = /compliance|policy|code|licop/i.test(moduleType || "") ? COMPLIANCE_CONFUSABLES : GENERIC_DISTRACTOR_SEEDS;
      const kc = buildSingleSelectKC(
        "Which option best reflects the principle described in this section?",
        "Honesty, transparency, and fairness",
        domain
      );
      s.knowledgeChecks = [...(s.knowledgeChecks || []), kc];
      toAdd--;
    }
    i++;
  }

  // If we still have some to add, append to the end in a cluster
  while (toAdd > 0) {
    scenes.push({
      title: "Knowledge Check",
      onScreenText: ["Check your understanding"],
      narration: "Answer the question to confirm your understanding before proceeding.",
      knowledgeChecks: [
        buildSingleSelectKC(
          "Which action aligns most closely with the guidance provided?",
          "Provide clear updates within the defined timeframes",
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
  if (words.length <= maxWords) return line;
  return words.slice(0, maxWords).join(" ") + " …";
}

function looksLikeConceptScene(s: Scene): boolean {
  const t = (s.title || "").toLowerCase();
  return /key concept|principle|overview|background|purpose|framework|definition/.test(t);
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
  const seeds = [...domain, ...GENERIC_DISTRACTOR_SEEDS].filter((t) => !lower.includes(t.toLowerCase()));
  const pool = seeds.slice(0, Math.max(n * 2, 8));
  return shuffle(pool).slice(0, n);
}

/** Optional typing for branching options */
type BranchingOpts = {
  choiceA?: string;
  choiceB?: string;
  choiceC?: string;
  outcomeC?: string;
  feedbackC?: string;
};