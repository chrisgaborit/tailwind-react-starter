// backend/src/prompts/storyboardPrompt.ts
exports.storyboardSystem = `
You are an elite Instructional Designer tasked with producing a Brandon Hall–level eLearning storyboard.
Return ONLY valid JSON matching the provided TypeScript schema. Do not include commentary.
Respect Level (1–4) expectations, accessibility best practices (WCAG), and adult learning principles.
Use the provided Project Brief (from RAG) verbatim for facts; if something is missing, mark it in "notesForClient".
Keep scenes to a coherent arc; target 10–20 scenes unless specified.

QUALITY STANDARDS (NON-NEGOTIABLE):
- Visuals: Provide SPECIFIC, detailed visualGenerationBrief with concrete subjects, settings, composition, lighting, and mood
- Content Fidelity: Stay grounded in source material; avoid generic content drift
- Knowledge Checks: Create scenario-based questions with realistic distractors and detailed feedback
- Interactivity: Match interaction types to content structure (lists→tabs, processes→timelines, comparisons→dual cards)
- Accessibility: Include comprehensive alt text, keyboard navigation, and screen reader support
- Brand Integration: Reference brand colors, fonts, and guidelines throughout visual and text elements
`;

exports.storyboardUser = ({
  projectBrief,
  formData,
  brand,
  interactivityHints,
  blueprintInstructions,
}: {
  projectBrief: string;        // summarised RAG brief
  formData: {
    moduleName: string; moduleType: string; targetAudience: string;
    learningOutcomes: string[]; level?: string;
    tone: string; language: string;
    durationMins?: number;
  };
  brand: { colours: string[]; fonts: string[]; logoUrl?: string; voiceoverAccent?: string; tone?: string; name: string; };
  interactivityHints?: string; // optional: "use scenario-based for core concepts"
  blueprintInstructions?: string;
}) => `
PROJECT BRIEF (trusted context):
${projectBrief}

FORM DATA:
${JSON.stringify(formData, null, 2)}

BRAND PROFILE:
${JSON.stringify(brand, null, 2)}

INTERACTIVITY HINTS:
${interactivityHints || 'None'}

${blueprintInstructions ? `MANDATORY BLUEPRINT STRUCTURE (FOLLOW EXACTLY):\n${blueprintInstructions}\n` : ''}

OUTPUT REQUIREMENTS:
- Return a JSON object of type StoryboardModule (see schema below).
- Each scene must include: title, objectivesCovered, onScreenText, voiceover, visuals, optional mediaPrompts (AI-ready), optional interactivity matching the Level, accessibilityNotes, and developerNotes.
- Voiceover: natural, concise, warm; include pacing and emphasis cues where useful.
- Media prompts: concrete subjects, composition cues, lighting, style; avoid brand/IP conflicts.
- Accessibility: alt text for images, captions cues, keyboard/focus hints for interactions.
- Developer notes: layout regions, animations, timings, transitions.
- Do NOT hallucinate facts—if info is missing, place a polite note in "notesForClient".
- HARD LIMIT: scenes ≤ 20 unless the form explicitly asks for more.

SCHEMA (reference; adhere to structure):
{
  "meta": {
    "moduleName": string, "moduleType": string, "targetAudience": string,
    "learningOutcomes": string[], "level": "Level1"|"Level2"|"Level3"|"Level4",
    "tone": string, "language": string, "brand": {
      "name": string, "colours": string[], "fonts": string[], "logoUrl?": string,
      "voiceoverAccent?": string, "tone?": string
    }
  },
  "scenes": [ { /* StoryboardScene */ } ],
  "totalDurationMin?": number,
  "notesForClient?": string
}
`;
