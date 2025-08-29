// src/library/blueprintPrompt.ts
import type { StoryboardModule } from "../types";

/**
 * Text-only blueprint: structural & stylistic standards distilled from your human SBs.
 * We inject this into the system prompt and ALSO enforce key items with code.
 */
export const STORYBOARD_BLUEPRINT_V1 = `
<< DO NOT DEVIATE — STORYBOARD BLUEPRINT v1 >>

OPENING (FIRST FOUR, IN ORDER)
1) Title
2) Pronunciation Guide
3) Table of Contents (include progress note)
4) Welcome & Learning Objectives (3–5 objectives)

CORE SCENES
- VO: ~75–150 words (~30–60s). Natural, conversational, ~140 WPM.
- OST: 5–30 words, never a verbatim VO copy.
- Visuals: Provide AI Visual Generation Brief (subject, setting, composition, lighting, HEX palette, mood, brand integration, negative space); alt text required.
- Interaction mapping:
  • lists → Flip Cards/Tabs/Accordion
  • comparison → Two-column / two-sided cards
  • process/timeline → Stepper/Timeline
  • components → Hotspots
  • nice-to-know → Accordion / Learn More pop-up

KNOWLEDGE CHECKS
- Place a KC every 3–5 scenes; mix MCQ / Scenario / Drag & Drop.
- Option-level feedback + retry (1–2 attempts before reveal).

CAPSTONE & CLOSE
- Capstone branching scenario with coaching feedback; xAPI verbs: responded/experienced.
- Summary (3–5 bullets); Completion statement with clear criteria; Thank you/Next steps.

CROSS-CUTTING
- Brand fonts/colours referenced in visuals & OST where relevant.
- Accessibility: captions ON; keyboard path + focus order; WCAG AA contrast; reduced-motion fallback.
- Timing metadata per scene; module roll-up in metadata.moduleTiming.

GOLDEN RATIOS
- ≥30–40% scenes interactive; ≥5 interaction types in a Level 3 module.
- KC cadence every 3–5 scenes. OST ≤ 70 words (hard cap).
`;

/** Inject blueprint into any base system prompt. */
export function injectBlueprint(baseSystemPrompt: string): string {
  return `${baseSystemPrompt}\n\n---\n${STORYBOARD_BLUEPRINT_V1}\n---`;
}

/**
 * Minimal enforcement helpers that complement your existing guarantees.
 * - Ensures a Capstone branching scenario exists as one of the final scenes.
 * - Ensures summary/completion/thank-you blocks in closing metadata if missing.
 */
export function ensureCapstoneAndClosing(
  story: StoryboardModule
): StoryboardModule {
  const scenes = Array.isArray(story.scenes) ? [...story.scenes] : [];

  // 1) Ensure there is a capstone branching scenario in the final 3 scenes
  const last3 = scenes.slice(-3);
  const hasCapstone =
    last3.some(s =>
      `${s.pageTitle || ""}`.toLowerCase().includes("capstone")
    ) ||
    last3.some(s =>
      `${s.interactionType || ""}`.toLowerCase().includes("scenario")
    );

  if (!hasCapstone) {
    const n = scenes.length + 1;
    scenes.push({
      sceneNumber: n,
      pageTitle: `Capstone Scenario: Apply ${story.moduleName || "Your Skills"}`,
      pageType: "Interactive",
      aspectRatio: "16:9",
      screenLayout: "Two-branch scenario with coaching feedback, visible progress",
      templateId: "",
      screenId: `S${n}`,
      audio: {
        script:
          "It’s time to apply what you’ve learned. Choose how you would respond in this realistic situation. We’ll coach you after each decision.",
        voiceParameters: {
          persona: "Warm facilitator",
          pace: "Moderate",
          tone: "Encouraging",
          emphasis: "Decisions & consequences",
        },
        aiGenerationDirective:
          "[AI Generate: VO with supportive tone; clear emphasis on decision-points.]",
      },
      narrationScript:
        "It’s time to apply what you’ve learned. Choose how you would respond in this realistic situation. We’ll coach you after each decision.",
      onScreenText: "Make your decision. Explore both paths to complete.",
      visual: {
        mediaType: "Graphic",
        style: "Clean corporate",
        visualGenerationBrief: {
          sceneDescription:
            "Branching capstone scenario with two visible decision cards A/B, subtle brand accents.",
          style: "Vector / Flat",
          subject: {},
          setting: "Modern workplace",
          composition: "Two equal decision cards; ample negative space top-right",
          lighting: "Soft, diffused",
          colorPalette: ["#FFFFFF", "#111111", "#B877D5", "#80D4FF"],
          mood: "Professional, supportive",
          brandIntegration:
            "Use brand heading font and accent colour for call-to-action.",
          negativeSpace: "30% top-right",
          assetId: "",
        },
        overlayElements: [
          {
            elementType: "TitleText",
            content: "Capstone Scenario",
            style: {
              fontFamily: "Montserrat",
              fontWeight: "Bold",
              fontSize: "36pt",
              color: "#111111",
              alignment: "Center",
              position: "Top third",
              animation: "FadeIn 0.5s",
            },
            aiGenerationDirective:
              "[AI Generate: Clear, accessible title overlay with WCAG AA contrast.]",
          },
        ],
        aiPrompt:
          'Modern, inclusive visual of a branching decision moment, two cards A/B, brand accents, 16:9',
        altText: "Two decision cards representing branching choices in a scenario",
        aspectRatio: "16:9",
        composition: "Split layout with two decision cards",
        environment: "Neutral office background",
      },
      interactionType: "Scenario",
      interactionDescription:
        "Two-branch decision with coaching feedback; allow replay to explore both branches.",
      interactionDetails: {
        interactionType: "Scenario",
        aiActions: [
          "Render two decision options (A/B)",
          "On select, branch to A or B; show feedback panel",
          "Enable Replay to explore alternate branch",
        ],
        aiDecisionLogic: [
          {
            choice: "A",
            feedback:
              "Outcome A: Highlight strengths; coaching tip for improvement.",
          },
          {
            choice: "B",
            feedback:
              "Outcome B: Identify risk; coaching tip to reach best practice.",
          },
        ],
        retryLogic: "Replay allowed until both branches explored.",
        completionRule: "Complete when both branches explored or best outcome achieved.",
        aiGenerationDirective:
          "[AI Generate: Branching UI with clear state; keyboard operable; ARIA roles; visible focus.]",
        xapiEvents: [
          { verb: "responded", object: "CapstoneScenario" },
          { verb: "experienced", object: "CapstoneScenarioBranch" },
        ],
      },
      developerNotes:
        "Track chosen branch; store per-branch outcomes; mark screen complete when both branches explored OR best practice path completed.",
      accessibilityNotes:
        "Captions ON; Keyboard path Tab/Shift+Tab; Enter/Space selects; Esc closes feedback; clear focus order; reduced-motion fallback.",
      timing: { estimatedSeconds: 150 },
    });
  }

  // 2) Ensure Closing metadata blocks exist
  const closing = (story as any).closing || {};
  (story as any).closing = {
    summary:
      Array.isArray(closing.summary) && closing.summary.length
        ? closing.summary
        : [
            "Reinforced key behaviours through scenarios and checks.",
            "Applied decisions in a realistic capstone exercise.",
            "Know where to find support & resources.",
          ],
    completion:
      closing.completion ||
      "Completion when all scenes viewed, all knowledge checks attempted, and capstone branching scenario completed.",
    thankYou:
      closing.thankYou ||
      "Thanks for completing the programme. Put your learning into practice today.",
  };

  // Re-number sceneNumber just in case we appended one
  (scenes as any[]).forEach((s, i) => (s.sceneNumber = i + 1));
  story.scenes = scenes;
  return story;
}