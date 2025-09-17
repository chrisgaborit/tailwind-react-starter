// src/library/blueprintPrompt.ts

// Use CommonJS-compatible type import
import type { StoryboardModule, StoryboardScene } from "../types";

export function ensureFirstFour(
  story: StoryboardModule,
  formData: any = {}
): StoryboardModule {
  const moduleName = formData.moduleName || story.moduleName || "Untitled Module";
  const author = formData.author || "Learno Generator";
  const storyboard = story; // Use a consistent name
  let scenes: StoryboardScene[] = Array.isArray(story.scenes) ? [...story.scenes] : [];

  // ✅ FIXED: The code that was stranded at the end of the file has been moved here,
  // inside the function where it can access `formData` and `storyboard`.
  const learningOutcomes = Array.isArray(formData?.learningOutcomes)
    ? formData.learningOutcomes
    : typeof formData?.learningOutcomes === "string"
    ? formData.learningOutcomes.split(/\n|•|-|\*/).map(s => s.trim()).filter(Boolean)
    : [];

  const outcomeText = learningOutcomes.length
    ? `By the end of this module, you'll be able to:\n• ${learningOutcomes.join("\n• ")}`
    : "You'll explore key topics relevant to your role.";

  // Slide 1: TOC (Internal Only)
  const tocSlide: StoryboardScene = {
    internalOnly: true,
    layout: "Internal Table of Contents",
    title: "INTERNAL: Table of Contents",
    narration: "",
    onScreenText: "",
    visuals: "",
    interactionType: "None",
    knowledgeCheck: null,
    metadata: {
      type: "toc",
      internal: true,
      tags: ["internal", "toc", "metadata"],
    },
  };

  // Slide 2: Pronunciation Guide (Internal Only)
  const pronunciationSlide: StoryboardScene = {
    internalOnly: true,
    layout: "Internal Pronunciation Guide",
    title: "INTERNAL: Pronunciation Guide",
    narration: "",
    onScreenText: "",
    visuals: "",
    interactionType: "None",
    knowledgeCheck: null,
    metadata: {
      type: "pronunciation",
      internal: true,
      tags: ["internal", "pronunciation", "voiceover"],
    },
  };

  // Slide 3: Title
  const titleSlide: StoryboardScene = {
    title: moduleName,
    narration: `Welcome to the module titled "${moduleName}".`,
    onScreenText: moduleName,
    visuals: `Branded title image or animation with the text: ${moduleName}`,
    layout: "Title Slide",
    interactionType: "None",
    knowledgeCheck: null,
    metadata: {
      type: "title",
    },
  };

  // Slide 4: Hook
  const hookSlide: StoryboardScene = {
    title: "Why This Matters",
    narration: "Before we begin, let's explore why this topic is relevant to your role.",
    onScreenText: "Why This Matters",
    visuals: "A metaphor or scenario that highlights the relevance of the topic.",
    layout: "Hook Slide",
    interactionType: "None",
    knowledgeCheck: null,
    metadata: {
      type: "hook",
    },
  };

  // Slide 5: Learning Outcomes
  const learningSlide: StoryboardScene = {
    title: "Learning Outcomes",
    narration: "By the end of this module, you will be able to:",
    onScreenText: outcomeText, // Use the generated text
    visuals: "Bullet-point list of outcomes appearing with animation.",
    layout: "Learning Outcomes",
    interactionType: "None",
    knowledgeCheck: null,
    metadata: {
      type: "outcomes",
    },
  };

  // Logic: Insert at beginning ONLY if missing (based on metadata or type)
  const existingTypes = scenes
    .slice(0, 6)
    .map((s) => s?.metadata?.type || s.title?.toLowerCase()?.trim() || "");

  const newScenes: StoryboardScene[] = [];

  if (!existingTypes.includes("toc")) newScenes.push(tocSlide);
  if (!existingTypes.includes("pronunciation")) newScenes.push(pronunciationSlide);
  if (!existingTypes.includes("title")) newScenes.push(titleSlide);
  if (!existingTypes.includes("hook")) newScenes.push(hookSlide);
  if (!existingTypes.includes("outcomes")) newScenes.push(learningSlide);

  scenes = [...newScenes, ...scenes];

  // ✅ FIXED: This logic was also stranded and is now correctly placed here.
  const tocIndex = scenes.findIndex(s => s?.metadata?.type === 'outcomes');
  if (tocIndex !== -1) {
    const scene = scenes[tocIndex];
    if (!scene.narration) scene.narration = outcomeText;
    if (!scene.onScreenText) scene.onScreenText = outcomeText;
  }
  
  // ✅ FIXED: And this metadata logic is now correctly placed.
  storyboard.metadata = {
    ...(storyboard.metadata || {}),
    moduleTiming: `${scenes.length * 1.5} mins (approx.)`,
    performanceSupport: ["Job aids included where applicable"],
  };

  return {
    ...story,
    moduleName,
    author,
    scenes: scenes, // Use the updated scenes array
    metadata: storyboard.metadata, // Include updated metadata
  };
}
/**
 * Text-only blueprint: structural & stylistic standards distilled from your human SBs.
 * Inject into the system prompt; key items are also enforced in code.
 */
const STORYBOARD_BLUEPRINT_V1 = `
<< DO NOT DEVIATE — STORYBOARD BLUEPRINT v1 >>

OPENING (FIRST FOUR, IN ORDER)
1) Title
2) Pronunciation Guide
3) Table of Contents (include a short progress note)
4) Welcome & Learning Objectives (3–5 role-tied, performance-based objectives)

CORE SCENES
- VO: ~75–150 words (~30–60s). Natural, conversational, ~140 WPM.
- OST: 5–30 words; never a verbatim VO copy (hard rule).
- Visuals: Provide an AI Visual Generation Brief (subject, setting, composition, lighting, HEX palette, mood, brand integration, negative space). Alt text is required.
- Interaction mapping:
  • lists → Flip Cards/Tabs/Accordion
  • comparison → Two-column / dual cards
  • process/timeline → Stepper/Timeline
  • components/regions → Hotspots
  • "nice-to-know" → Accordion / Learn More pop-up
- Label each scene with a scaffolding phase where appropriate: Overview / Context / KeyConcepts / Example / Application / KnowledgeCheck / Summary.
- When a targetAudience is provided, include at least one role-specific example per key concept (e.g., “Underwriter”, “Claims Assessor”).

KNOWLEDGE CHECKS
- Place a knowledge check every 3–5 scenes; mix MCQ / Scenario / Drag & Drop.
- Provide option-level feedback + retry (1–2 attempts before reveal).
- For MCQs include distractor rationales (why plausible / why wrong) per incorrect option.

CAPSTONE & CLOSE
- Capstone branching scenario with coaching feedback; allow replay to compare paths.
- xAPI verbs: responded/experienced/answered as appropriate.
- Summary (3–5 bullets); Completion statement with clear criteria; Thank you/Next steps.
- Add an Action Plan / Commitment step (short free text or checklist) when appropriate.

CROSS-CUTTING
- Brand: fonts/colours referenced in OST and visuals where useful (maintain WCAG AA contrast).
- Accessibility: captions ON; keyboard path + focus order; reduced-motion fallback.
- Timing metadata per scene + module roll-up in metadata.moduleTiming.
- Performance support: if policies or timeframes are present, include job-aids/checklists and timeframe tables in metadata.performanceSupport.

GOLDEN RATIOS
- ≥30–40% scenes interactive; ≥5 interaction types in a Level 3 module.
- KC cadence every 3–5 scenes. OST ≤ 70 words (hard cap).

SCHEMA REMINDER
- Always include structured fields (visualGenerationBrief, overlayElements, interactionDetails with xAPI, retry/completion rules) *and* legacy mirrors (narrationScript, aiPrompt, interactionType, interactionDescription, screenLayout string).
`;

/** Inject blueprint into any base system prompt. */
function injectBlueprint(prompt: string): string {
  return `${STORYBOARD_BLUEPRINT_V1.trim()}\n\n${prompt.trim()}`;
}

// ❌ REMOVED: The old, duplicate `ensureFirstFour` function has been removed to prevent errors.

/**
 * Minimal enforcement helpers that complement upstream guarantees.
 * - Ensures a Capstone branching scenario exists within the last 3 scenes.
 * - Optionally ensures an Action Plan / Commitment scene.
 * - Optionally tops up a minimum count of knowledge-check scenes.
 * - Ensures closing metadata blocks exist (summary, completion, thank-you).
 */
export function ensureCapstoneAndClosing(
  story: StoryboardModule,
  opts?: { minKnowledgeChecks?: number; requireActionPlan?: boolean }
): StoryboardModule {
  const scenes = Array.isArray(story.scenes) ? [...story.scenes] : [];
  const moduleName = story.moduleName || "Your Skills";
  const wantKCMin = Math.max(0, Number(opts?.minKnowledgeChecks ?? 0));
  const needActionPlan = !!opts?.requireActionPlan;

  // ✅ FIXED: This block of logic was inside a different function (`ensureFirstFour`) in your original file.
  // I have moved it here as it relates to closing/summary slides.
  const hasRecap = scenes.some((s) =>
    s.title?.toLowerCase().includes("summary") ||
    s.title?.toLowerCase().includes("recap")
  );

  const hasCapstoneOriginal = scenes.some((s) => // Renamed to avoid conflict
    s.title?.toLowerCase().includes("capstone") ||
    (s.knowledgeCheck && s.knowledgeCheck.type !== "None")
  );

  const hasFinalCTA = scenes.some((s) =>
    s.title?.toLowerCase().includes("next steps") ||
    s.title?.toLowerCase().includes("apply what you've learned") ||
    s.title?.toLowerCase().includes("congratulations") ||
    s.title?.toLowerCase().includes("action plan")
  );

  const additions: any[] = [];

  if (!hasRecap) {
    additions.push({
      title: "Summary & Key Takeaways",
      narration: "Let's summarise the key takeaways from this module.",
      onScreenText: "Summary",
      visuals: "Bullet points highlighting the main messages from this module.",
      interactionType: "None",
      knowledgeCheck: null,
    });
  }

  if (!hasCapstoneOriginal && wantKCMin > 0) {
    additions.push({
      title: "Capstone Scenario: Apply Your Knowledge",
      narration: "Here's a final challenge. Based on what you've learned, choose the best response to the following situation.",
      onScreenText: "Capstone Challenge",
      visuals: "Scenario-based visual showing a real-world situation.",
      interactionType: "Scenario Branching",
      knowledgeCheck: {
        type: "SingleSelect",
        question: "What is the most effective way to handle this situation?",
        options: [
          { text: "Option A", correct: true, feedback: "Correct! This shows application of the key principle." },
          { text: "Option B", correct: false, feedback: "This could work, but misses the key element discussed." },
          { text: "Option C", correct: false, feedback: "Not quite. Remember the strategy we covered earlier." },
        ],
      },
    });
  }

  if (!hasFinalCTA) {
    additions.push({
      title: needActionPlan ? "Action Plan: Your Next Steps" : "Next Steps: Put It Into Practice",
      narration: needActionPlan
        ? "Take a moment to write down how you'll apply these skills in your role. What will you do differently starting today?"
        : "Now that you've completed this module, reflect on how you'll apply these insights in your daily work.",
      onScreenText: needActionPlan ? "Create Your Action Plan" : "Next Steps",
      visuals: "A person planning their day, checking a list, or having a conversation.",
      interactionType: needActionPlan ? "OpenText" : "None",
      knowledgeCheck: needActionPlan
        ? { type: "OpenText", question: "Describe one thing you'll do differently as a result of this module." }
        : null,
    });
  }
  
  // Apply additions from the first block
  scenes.push(...additions);

  // ✅ FIXED: All of the code below was "stranded" outside the function. It is now correctly placed inside.
  
  // Helper: simple KC detector
  const isKC = (s: any) => {
    const t = String(s?.interactionType || "").toLowerCase();
    return ["mcq", "scenario", "drag & drop", "drag&drop", "draganddrop", "quiz"].some((k) => t.includes(k));
  };

  // 1) Ensure there is a capstone branching scenario in the final 3 scenes
  const last3 = scenes.slice(-3);
  const hasCapstone =
    last3.some((s) => `${s.pageTitle || ""}`.toLowerCase().includes("capstone")) ||
    last3.some((s) => `${s.interactionType || ""}`.toLowerCase().includes("scenario"));
  if (!hasCapstone) {
    const n = scenes.length + 1;
    scenes.push({
      sceneNumber: n,
      pageTitle: `Capstone Scenario: Apply ${moduleName}`,
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
      scaffoldingPhase: "Application",
    } as any);
  }

  // 2) Optional: top up knowledge checks to meet a minimum count (light-touch)
  if (wantKCMin > 0) {
    const currentKC = scenes.filter(isKC).length;
    const toAdd = Math.max(0, wantKCMin - currentKC);
    for (let i = 0; i < toAdd; i++) {
      const n = scenes.length + 1;
      scenes.splice(Math.max(4, scenes.length - 2), 0, {
        sceneNumber: n,
        pageTitle: `Knowledge Check ${currentKC + i + 1}`,
        pageType: "Interactive",
        aspectRatio: "16:9",
        screenLayout: "Question stem with 3–4 options; feedback panel; retry allowed",
        templateId: "",
        screenId: `S${n}`,
        audio: {
          script: "Let’s check your understanding. Choose the best answer; you can retry once before reveal.",
          voiceParameters: {
            persona: "Warm facilitator",
            pace: "Moderate",
            tone: "Encouraging",
            emphasis: "Key terms",
          },
          aiGenerationDirective:
            "[AI Generate: VO concise; pause before revealing feedback.]",
        },
        narrationScript:
          "Let’s check your understanding. Choose the best answer; you can retry once before reveal.",
        onScreenText: "Answer the questions.",
        visual: {
          mediaType: "Graphic",
          style: "Clean corporate",
          visualGenerationBrief: {
            sceneDescription: "Simple knowledge check layout with clear focus states.",
            style: "Vector / Flat",
            subject: {},
            setting: "Minimal UI",
            composition: "Question top; options in a list; feedback panel slides in",
            lighting: "Neutral UI",
            colorPalette: ["#FFFFFF", "#111111", "#B877D5", "#80D4FF"],
            mood: "Clear, focused",
            brandIntegration: "Use brand accent for selected state.",
            negativeSpace: "25% right for feedback",
            assetId: "",
          },
          overlayElements: [
            {
              elementType: "TitleText",
              content: "Knowledge Check",
              style: {
                fontFamily: "Montserrat",
                fontWeight: "Bold",
                fontSize: "28pt",
                color: "#111111",
                alignment: "Center",
                position: "Top third",
                animation: "FadeIn 0.5s",
              },
              aiGenerationDirective:
                "[AI Generate: Title overlay; WCAG AA contrast.]",
            },
          ],
          aiPrompt: "Minimal, accessible assessment layout with option list and feedback panel, 16:9",
          altText: "Assessment screen with question and options",
          aspectRatio: "16:9",
          composition: "Question then options; feedback panel area",
          environment: "Neutral UI",
        },
        interactionType: "MCQ",
        interactionDescription:
          "2–3 items with option-level feedback and distractor rationales. Retry once before reveal.",
        interactionDetails: {
          interactionType: "MCQ",
          aiActions: ["Render question + 3–4 options", "On select, show feedback", "Allow retry once"],
          aiDecisionLogic: [],
          retryLogic: "Allow 1 retry, then reveal.",
          completionRule: "All items answered.",
          aiGenerationDirective:
            "[AI Generate: Radio-button MCQ; ARIA roles; visible focus; high contrast.]",
          xapiEvents: [{ verb: "answered", object: `KnowledgeCheck_${currentKC + i + 1}` }],
          distractorRationale: [],
        },
        developerNotes:
          "Include realistic distractors. Provide option-level feedback and a short rationale for each incorrect option.",
        accessibilityNotes:
          "Captions ON; Keyboard path Tab/Shift+Tab; Enter/Space selects; visible focus order preserved.",
        timing: { estimatedSeconds: 90 },
        scaffoldingPhase: "KnowledgeCheck",
      } as any);
    }
  }

  // 3) Optional: ensure an Action Plan / Commitment scene near the end (before Thank You)
  const hasActionPlan =
    scenes.some((s) => `${s.pageTitle || ""}`.toLowerCase().includes("action plan")) ||
    scenes.some((s) => `${s.pageTitle || ""}`.toLowerCase().includes("commitment"));
  if (needActionPlan && !hasActionPlan) {
    const n = scenes.length + 1;
    scenes.push({
      sceneNumber: n,
      pageTitle: "Action Plan & Commitment",
      pageType: "Interactive",
      aspectRatio: "16:9",
      screenLayout: "Two fields (commitment & first step) + reminder selector; export/print option",
      templateId: "",
      screenId: `S${n}`,
      audio: {
        script:
          "Wrap up by drafting a short commitment. What will you do first, and by when? You can export this as a reminder or job-aid.",
        voiceParameters: {
          persona: "Warm facilitator",
          pace: "Moderate",
          tone: "Supportive",
          emphasis: "Commitment",
        },
        aiGenerationDirective:
          "[AI Generate: Clear, encouraging VO inviting the learner to set a commitment.]",
      },
      narrationScript:
        "Wrap up by drafting a short commitment. What will you do first, and by when? You can export this as a reminder or job-aid.",
      onScreenText: "Commit to one action. Set your first step and timeframe.",
      visual: {
        mediaType: "Graphic",
        style: "Clean corporate",
        visualGenerationBrief: {
          sceneDescription:
            "Checklist and calendar motif representing an action plan; subtle brand accents.",
          style: "Vector / Flat",
          subject: {},
          setting: "Minimal UI",
          composition: "Large checklist card left; calendar chip right",
          lighting: "Neutral",
          colorPalette: ["#FFFFFF", "#111111", "#B877D5", "#80D4FF"],
          mood: "Motivating, supportive",
          brandIntegration: "Accent brand colour on primary button.",
          negativeSpace: "30% top-right",
          assetId: "",
        },
        overlayElements: [
          {
            elementType: "Button",
            content: "Save my plan",
            style: {
              fontFamily: "Montserrat",
              fontWeight: "Bold",
              fontSize: "16pt",
              color: "#FFFFFF",
              alignment: "Center",
              position: "Lower third",
              padding: "10px 20px",
              border: "0",
              animation: "FadeIn 0.5s",
            },
            aiGenerationDirective:
              "[AI Generate: Primary button with accessible contrast and focus state.]",
          },
        ],
        aiPrompt:
          "Action plan UI motif with checklist and calendar, brand-accent button, accessible contrast, 16:9",
        altText: "Checklist and calendar illustrating an action plan",
        aspectRatio: "16:9",
        composition: "Checklist area and action button",
        environment: "Neutral UI",
      },
      interactionType: "Reflection",
      interactionDescription:
        "Short free-text commitment with optional first step and due-by selector. Export or email.",
      interactionDetails: {
        interactionType: "Reflection",
        aiActions: [
          "Render text fields for 'My commitment' and 'First step'",
          "Render a date selector",
          "Offer export/print",
        ],
        aiDecisionLogic: [
          { choice: "save", feedback: "Plan saved. You can export or return to review content." },
        ],
        retryLogic: "Not applicable.",
        completionRule: "Commitment text entered (min 10 characters).",
        aiGenerationDirective:
          "[AI Generate: Accessible form fields with labels; keyboard operable; ARIA attributes.]",
        xapiEvents: [{ verb: "answered", object: "ActionPlanCommitment" }],
      },
      developerNotes:
        "Persist commitment locally or pass to LMS if supported. Provide export-to-PDF and optional email trigger.",
      accessibilityNotes:
        "Captions ON; Keyboard path with visible focus; form fields labelled; error text announced to screen readers.",
      timing: { estimatedSeconds: 120 },
      scaffoldingPhase: "Summary",
    } as any);
  }

  // 4) Ensure Closing metadata blocks exist
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

  // 5) Re-number sceneNumber to reflect any insertions/appends
  (scenes as any[]).forEach((s, i) => (s.sceneNumber = i + 1));
  story.scenes = scenes;
  
  return story;
} // ✅ FIXED: The closing brace for `ensureCapstoneAndClosing` is now here, at the correct end of the function.

// ✅ FIXED: This function definition is now correctly placed.
function ensureTOCAndMetadata(
  story: StoryboardModule,
  formData: any = {}
): StoryboardModule {
  return ensureFirstFour(story, formData);
}


// ✅ Exports block at the very end — OUTSIDE any function
module.exports = {
  injectBlueprint,
  ensureFirstFour,
  ensureTOCAndMetadata,
  ensureCapstoneAndClosing,
};