// 📘 Interactivity Engine: Foundation for AI Storyboard Generator
// This file provides a complete Brandon Hall–level interactivity engine for AI storyboards.
// It includes a Decision Matrix, Blueprint Library, and Prompt Compiler components.

/* ==============================================================
   1. INTERACTIVITY DECISION MATRIX (When and Why to Use Which Type)
=================================================================== */

exports.interactivityDecisionMatrix = [
  {
    type: "Click-and-Reveal",
    bestFor: ["linear content", "dense info", "conceptual introductions"],
    level: [1, 2],
    useWhen: "Learners need to explore key points without overwhelming cognitive load."
  },
  {
    type: "Tabs/Accordions",
    bestFor: ["organising policies", "step-by-step instructions"],
    level: [1, 2],
    useWhen: "Information is best chunked by category or phase."
  },
  {
    type: "Hotspots/Labeled Graphics",
    bestFor: ["visual diagrams", "systems", "anatomy", "UIs"],
    level: [2, 3],
    useWhen: "Visual-first content needs contextual callouts."
  },
  {
    type: "Drag and Drop",
    bestFor: ["sorting", "matching", "sequencing"],
    level: [2, 3, 4],
    useWhen: "You want learners to test recall, group items, or build logic flows."
  },
  {
    type: "Multiple Choice / True-False",
    bestFor: ["knowledge checks", "compliance", "assessment"],
    level: [1, 2, 3],
    useWhen: "You need to quickly assess knowledge comprehension."
  },
  {
    type: "Scenario-Based Questions",
    bestFor: ["decision-making", "applying concepts", "seeing consequences"],
    level: [2, 3],
    useWhen: "Learners must make realistic choices and learn from outcomes."
  },
  {
    type: "Branching Scenarios",
    bestFor: ["exploring consequences", "soft skills", "simulations"],
    level: [3, 4],
    useWhen: "You need immersive, narrative-driven learning that adapts."
  },
  {
    type: "Simulations",
    bestFor: ["systems training", "tools", "process walk-throughs"],
    level: [3, 4],
    useWhen: "Learners need hands-on, fail-safe practice with systems/tools."
  },
  {
    type: "Role-Play / Dialogue Trees",
    bestFor: ["empathy", "conflict resolution", "coaching"],
    level: [3, 4],
    useWhen: "You're building conversational or people skills."
  },
  {
    type: "Mini-Games / Game-Based Tasks",
    bestFor: ["recall", "timed response", "fun engagement"],
    level: [4],
    useWhen: "You want to drive motivation, memory or healthy competition."
  },
  {
    type: "Custom Learning Paths",
    bestFor: ["adaptive onboarding", "role-specific flow"],
    level: [3, 4],
    useWhen: "Content should change based on learner's needs or job role."
  },
  {
    type: "Video Interactives",
    bestFor: ["passive learners", "video-heavy modules"],
    level: [2, 3, 4],
    useWhen: "You want to embed engagement directly within videos."
  },
  {
    type: "360° Virtual Tours",
    bestFor: ["immersive orientation", "exploring spaces"],
    level: [4],
    useWhen: "Spatial learning is core to safety, induction, or exploration."
  },
  {
    type: "Drag to Build/Assemble",
    bestFor: ["construction", "engineering", "assembling concepts"],
    level: [3, 4],
    useWhen: "You want learners to construct or replicate a system."
  }
];

/* ==============================================================
   2. INTERACTIVITY BLUEPRINT LIBRARY (How to Write Each Type)
=================================================================== */

exports.interactivityBlueprints = {
  "Click-and-Reveal": {
    purpose: "Unpack dense or conceptual content in digestible parts.",
    structure: ["Intro text", "Click area", "Revealed content block"],
    tone: "Neutral and informative",
    visualLayout: "Icons or buttons reveal content areas",
    developerNotes: "Keep it linear; label clearly"
  },
  "Tabs/Accordions": {
    purpose: "Compare or chunk related categories of information.",
    structure: ["Tab label", "Content area for each"],
    tone: "Neutral, structured",
    visualLayout: "Tabs horizontally or accordion style vertically",
    developerNotes: "Ideal for policies or grouped information"
  },
  "Hotspots/Labeled Graphics": {
    purpose: "Contextualise parts of an image or diagram.",
    structure: ["Background image", "Clickable spots", "Text overlays or popups"],
    tone: "Descriptive and contextual",
    visualLayout: "Labels float on image; click to reveal info",
    developerNotes: "Ensure hotspots are intuitive and large enough"
  },
  "Drag and Drop": {
    purpose: "Test classification, grouping or process ordering.",
    structure: ["Instruction", "Draggable items", "Target zones"],
    tone: "Challenging but clear",
    visualLayout: "Left = options, Right = drop zones or columns",
    developerNotes: "Snapping and feedback required"
  },
  "Multiple Choice / True-False": {
    purpose: "Test foundational knowledge or decision logic.",
    structure: ["Stem question", "Options", "Correct/Incorrect feedback"],
    tone: "Instructional and clear",
    visualLayout: "Question + multiple options",
    developerNotes: "Distractors must be plausible"
  },
  "Scenario-Based Questions": {
    purpose: "Apply knowledge in realistic situations with contextual consequences.",
    structure: ["Scene setup", "3 choices", "Branching feedback"],
    tone: "Conversational and emotionally engaging",
    visualLayout: "Scenario + options on side or below",
    developerNotes: "Use 3 triggers and feedback layers"
  },
  "Branching Scenarios": {
    purpose: "Explore multi-step narrative decisions with feedback loops.",
    structure: ["Intro", "Decision tree", "Feedback", "Paths continue or restart"],
    tone: "Narrative-rich, authentic",
    visualLayout: "Full-screen scenes with pop-up choices",
    developerNotes: "Avoid loops unless designed intentionally"
  },
  "Simulations": {
    purpose: "Allow risk-free, realistic system or tool walkthroughs.",
    structure: ["Task objective", "Interactive tool", "Feedback"],
    tone: "Practical and system-based",
    visualLayout: "Mimic software environment or device",
    developerNotes: "Functional UI fidelity matters"
  },
  "Role-Play / Dialogue Trees": {
    purpose: "Develop empathy and soft skills through guided dialogue.",
    structure: ["Scenario setup", "Dialogue prompt", "Multiple response paths"],
    tone: "Emotional and character-driven",
    visualLayout: "Conversation UI – alternating bubbles or speaker zones",
    developerNotes: "Reinforce with feedback and emotional outcomes"
  },
  "Mini-Games / Game-Based Tasks": {
    purpose: "Motivate memory and challenge engagement.",
    structure: ["Timer", "Scoring logic", "Game loop"],
    tone: "Fun and motivating",
    visualLayout: "Play area with scoreboard",
    developerNotes: "Keep instructions and feedback tight"
  },
  "Custom Learning Paths": {
    purpose: "Tailor module flow to learner profile or decisions.",
    structure: ["Initial question", "Role detection", "Branching sections"],
    tone: "Helpful and adaptive",
    visualLayout: "Progress map or breadcrumbs",
    developerNotes: "Ensure content gates are logical"
  },
  "Video Interactives": {
    purpose: "Embed engagement into passive media.",
    structure: ["Video block", "Timed overlays", "Quizzes / pause prompts"],
    tone: "Conversational and concise",
    visualLayout: "Video with overlay or embedded questions",
    developerNotes: "Time triggers precisely; mobile compatible"
  },
  "360° Virtual Tours": {
    purpose: "Orient or familiarise learners with a space.",
    structure: ["360 image or video", "Hotspots", "Narration or popups"],
    tone: "Immersive and narrative",
    visualLayout: "Drag-to-explore view",
    developerNotes: "Optimise for bandwidth"
  },
  "Drag to Build/Assemble": {
    purpose: "Construct or visually build something in sequence.",
    structure: ["Instructions", "Draggable parts", "Build area"],
    tone: "Task-based and empowering",
    visualLayout: "Work area with parts around it",
    developerNotes: "Use animation/snap effects where possible"
  }
};

/* ==============================================================
   3. PROMPT COMPILER (Inject Full Blueprint into AI Prompt)
=================================================================== */

export function compileInteractivityPrompt(type: string, level: number): string {
  const match = interactivityDecisionMatrix.find((e) => e.type === type);
  const blueprint = interactivityBlueprints[type];
  if (!match || !blueprint) return "";

  return `
Design an interactivity of type: ${type}
• Level: ${level}
• Purpose: ${blueprint?.purpose}
• Use Case: ${match.useWhen}
• Structure: ${blueprint?.structure?.join(" → ")}
• Visual Layout: ${blueprint?.visualLayout}
• Tone: ${blueprint?.tone}
• Developer Notes: ${blueprint?.developerNotes}
• Format: InteractivityScene JSON object
• Avoid: Generic language, unscaffolded logic, vague feedback
`.trim();
}

// To be imported in openaiService.ts and used per scene
