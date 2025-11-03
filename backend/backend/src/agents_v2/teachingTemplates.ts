// backend/src/agents_v2/teachingTemplates.ts

export interface TeachingScene {
  // 1. Pedagogical Foundation
  learningOutcome: string;
  bloomTaxonomyLevel: 'Remember' | 'Understand' | 'Apply' | 'Analyze' | 'Evaluate' | 'Create';
  teachingMethod: 'Concept Explanation' | 'Demonstration' | 'Case Study' | 'Interactive Discovery';
  contentStructurePattern: string;
  scenePurpose: string;
  cognitiveLoad: 'Low' | 'Medium' | 'High';
  scenePlacement: 'Early' | 'Mid' | 'Late';
  sceneContext: string;
  
  // 2. Content Design
  pageTitle: string;
  onScreenText: string; // ≈70 words
  voiceOverScript: string; // ≈170 words
  visualAIPrompt: string;
  altText: string;
  audioSFX?: string;
  developerNotes?: string;
  
  // 3. Differentiation & Scaffolding
  prerequisiteKnowledge: string;
  scaffoldingStrategy: string[];
  extensionOpportunity?: string;
  
  // 4. Quality Validation
  whyThisWorks: string; // ≈50 words
  assessmentLink: string;
  redFlagChecks: {
    textConcise: boolean;
    noDuplication: boolean;
    visualSupportsConcept: boolean;
  };
  
  // 5. Output Rules
  totalWords: number; // ≈320 words total
  runtimeSeconds: number; // ≈80 seconds
  learnerCentredTone: boolean;
  accessibilityRationale: string;
}

export const teachingScenePrompt = `
You are an expert instructional designer creating pedagogically-sound teaching scenes for corporate learning modules.

Generate a complete teaching scene following this EXACT structure:

1️⃣ PEDAGOGICAL FOUNDATION
- Learning Outcome (LO): Specific, measurable outcome aligned to learning objective
- LO Alignment Evidence: How this builds toward mastery
- Bloom's Taxonomy Level: Remember/Understand/Apply/Analyze/Evaluate/Create
- Teaching Method: Concept Explanation/Demonstration/Case Study/Interactive Discovery
- Content Structure Pattern: Specific pattern (e.g., "Concept → Definition → Examples → Non-examples → Summary")
- Scene Purpose: Clear learning intent
- Cognitive Load: Low/Medium/High
- Scene Placement: Early/Mid/Late in module
- Scene Context: Prerequisites and positioning

2️⃣ CONTENT DESIGN
- Page Title: Clear, descriptive title
- On-Screen Text: ≈70 words, complements voiceover
- Voice-Over Script: ≈170 words, engaging narrative
- Visual AI Prompt: Detailed visual description
- Alt Text: Accessibility description
- Audio/SFX: Optional audio direction
- Developer Notes: Implementation guidance

3️⃣ DIFFERENTIATION & SCAFFOLDING
- Prerequisite Knowledge: What learners need to know
- Scaffolding Strategy: Support mechanisms
- Extension Opportunity: Advanced learning path

4️⃣ QUALITY VALIDATION
- Why This Works: ≈50 words pedagogical rationale
- Assessment Link: Connection to evaluation
- Red Flag Checks: Quality assurance checklist

5️⃣ OUTPUT RULES
- Total Words: ≈320 words
- Runtime: ≈80 seconds
- Learner-Centred Tone: Active, engaging
- Accessibility Rationale: Inclusion considerations

Generate content that is:
- Pedagogically sound and structured
- Engaging and professional
- Accessible and inclusive
- Directly aligned to learning objectives
- Ready for immediate implementation

Return as structured JSON following the TeachingScene interface.
`;

export function getTeachingTemplate(learningObjective: string, topic: string): string {
  return `
TOPIC: ${topic}
LEARNING OBJECTIVE: ${learningObjective}

${teachingScenePrompt}

Generate a complete teaching scene that follows the pedagogical template exactly.
Ensure the content is specific to the learning objective and topic, not generic.
`;
}