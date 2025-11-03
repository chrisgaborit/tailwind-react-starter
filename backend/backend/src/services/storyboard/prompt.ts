import { StoryboardFormData } from "@/types";

export function buildStoryboardPrompt(form: StoryboardFormData) {
  const {
    moduleName,
    moduleType,
    complexityLevel,
    tone,
    outputLanguage,
    durationMins,
    idMethod,
    learningOutcomes,
    content,
    primaryLearningMode,
    instructionalPurpose,
    organisationName,
    targetAudience,
    colours,
    fonts,
    quality,
    developerNotes,
    pronunciationGuide,
  } = form as any;

  const q = quality || {};

  const mustHaves = [
    "- Use clear page numbering (p01, p02…) with **Page Title**, **Type**, **Screen Layout**.",
    "- For each screen include: **Event**, **Audio (VoiceOver)**, **On‑Screen Text (OST)**, **Internal Development Notes**.",
    q.explicitFeedback
      ? "- For every KC/quiz interaction add **Correct Answer Feedback** and **Incorrect Answer Feedback** with concrete copy."
      : null,
    q.timingPlan
      ? "- Provide an **Estimated Timing** per screen (sum ~ " + (durationMins || 30) + " mins)."
      : null,
    q.xapiAndCompletion
      ? "- Add **xAPI** verbs and a brief **Completion Rule** (e.g., pass all KCs)."
      : null,
    q.accessibilityNotes
      ? "- Add **Accessibility Notes** (focus order, alt text, contrast, keyboard paths)."
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  const idLine = idMethod ? `Preferred ID method: **${idMethod}**.` : "";
  const voDetail = q.detailedVoiceover
    ? "Write VoiceOver as full, conversational paragraphs (not bullets)."
    : "VoiceOver can be concise but complete.";

  const devNotes = developerNotes ? `\nDeveloper notes from SME:\n${developerNotes}\n` : "";
  const pron = pronunciationGuide ? `\nPronunciation guide:\n${pronunciationGuide}\n` : "";

  const brand =
    organisationName || targetAudience || colours || fonts
      ? `Brand/Context:
- Organisation: ${organisationName || "N/A"}
- Audience: ${targetAudience || "N/A"}
- Colours: ${colours || "N/A"}
- Fonts: ${fonts || "N/A"}`
      : "";

  const learning =
    learningOutcomes && learningOutcomes.trim()
      ? `\nLearning Outcomes:\n${learningOutcomes}\n`
      : "";

  const source =
    content && content.trim()
      ? `\nSource Content (for grounding, may be summarised/adapted):\n${content}\n`
      : "";

  const modePurpose =
    primaryLearningMode || instructionalPurpose
      ? `\nLearning Mode/Purpose:
- Primary Learning Mode: ${primaryLearningMode || "N/A"}
- Instructional Purpose: ${instructionalPurpose || "N/A"}`
      : "";

  return `
You are an instructional designer. Produce a **professional storyboard** in English (${outputLanguage} locale) for the module **${moduleName}** (${moduleType}, complexity ${complexityLevel}, tone ${tone}). Target duration ~${durationMins || 30} minutes.
${idLine}
${brand}
${modePurpose}
${learning}
${source}
${devNotes}
${pron}

Requirements:
${mustHaves}

Formatting model (follow exactly like LICOP style):
- Start with **Storyboard Revision History** (table with Date/Task/By/Version).
- If a **Pronunciation Guide** is provided, add a section listing words and pronunciations.
- Add a concise **Table of Contents**.
- Then list screens sequentially with: **Page Title**, **Type**, **Number (pXX)**, **Screen Layout**, then a table with **Event / Audio / On‑Screen Text / Internal Development Notes**. ${voDetail}
- Use realistic interactivity (MCQ/MRQ, Drag‑and‑Drop, Scenario with branching, Click‑to‑Reveal), and include hints where relevant.
- Where imagery is referenced, include an **Alt Text** suggestion in Dev Notes.

End with: **Summary**, and if appropriate, an **Action Plan** page.
`;
}