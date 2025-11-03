// backend/src/prompts/agentPrompts.ts

/**
 * PHASE 5: Enhanced Agent Prompts
 * 
 * Award-winning instructional design prompts that enforce:
 * - Narrative structure with emotional hooks
 * - Character-driven learning
 * - Real-world context and stakes
 * - Plain JSON only (NO markdown)
 * - Brandon Hall award-level quality
 * 
 * All prompts use directive-style phrasing and strict JSON requirements.
 */

type AgentName = "welcomeAgent" | "teachAgent" | "applyAgent" | "summaryAgent" | "qaAgent";

interface AgentPromptParams {
  welcomeAgent: {
    topic: string;
    audience: string;
    outcomes: string[];
  };
  teachAgent: {
    topic: string;
    outcome: string;
    audience: string;
    extractedContentSummary?: string;
    availableCharacters?: string[];
  };
  applyAgent: {
    topic: string;
    audience?: string;
    learningOutcome?: string;
    outcomeContext?: string;
    sourceMaterialExcerpt?: string;
    extractedCharacters?: Array<string | { name: string; role?: string; detail?: string }>;
  };
  summaryAgent: {
    topic: string;
    outcomes: string[];
    characterName?: string;
  };
  qaAgent: {
    storyboardContent: string;
  };
}

const formatCharacterLine = (character: string | { name: string; role?: string; detail?: string }): string => {
  if (typeof character === "string") {
    return `- ${character}`;
  }
  const roleSegment = character.role ? ` (${character.role})` : "";
  const detailSegment = character.detail ? ` – ${character.detail}` : "";
  return `- ${character.name}${roleSegment}${detailSegment}`;
};

export const ENHANCED_PROMPTS: { [K in AgentName]: (params: AgentPromptParams[K]) => string } = {
  
  /**
   * Welcome Agent - Emotional Hook & Journey Preview
   */
  welcomeAgent: ({ topic, audience, outcomes }) => `
YOU ARE: An award-winning instructional designer creating an eLearning experience that wins Brandon Hall awards.

TOPIC: ${topic}
AUDIENCE: ${audience}
LEARNING OUTCOMES:
${outcomes.map((o, i) => `${i + 1}. ${o}`).join('\n')}

CREATE EXACTLY 2 WELCOME SCENES THAT HOOK THE LEARNER EMOTIONALLY:

SCENE 1 - EMOTIONAL HOOK (The Challenge):
✅ MUST start with a relatable problem or challenge the audience faces daily
✅ Create emotional connection: "Have you ever struggled with..."
✅ Show STAKES: What happens if they don't master this?
✅ Use SECOND PERSON: "You will..." not "Learners will..."
✅ Create CURIOSITY about the transformation ahead

❌ FORBIDDEN:
- Generic "Welcome to this module" openings
- Dry bullet-point objectives only
- Academic or textbook language
- Talking about the course itself

SCENE 2 - BENEFITS & JOURNEY (The Promise):
✅ Show the TRANSFORMATION they'll experience
✅ Highlight SPECIFIC, TANGIBLE benefits (not vague)
✅ Create a VISION of success
✅ Navigation instructions: arrows, play/pause, headphones
✅ On-screen text ≤ 70 words

STRICT OUTPUT RULES:
❌ DO NOT wrap output in markdown code blocks
❌ DO NOT use \`\`\`json formatting
❌ DO NOT include any text before or after JSON
✅ Return ONLY valid JSON, nothing else
✅ Use UK English spelling
✅ Professional but warm, conversational tone

JSON STRUCTURE (EXACT FORMAT REQUIRED):
{
  "scenes": [
    {
      "scene_number": 1,
      "title": "[Problem-focused title - NOT 'Welcome']",
      "on_screen_text": "[Hook question or challenge statement - 40-60 words]",
      "narration_script": "[Engaging story about the problem - 150-200 words]",
      "visual_ai_prompt": "[Specific visual showing the challenge or frustrated person]",
      "alt_text": "[Descriptive alt text]",
      "emotional_tone": "empathetic"
    },
    {
      "scene_number": 2,
      "title": "[Transformation or benefit title]",
      "on_screen_text": "[Benefits and navigation - ≤70 words]",
      "narration_script": "[Vision of success and journey ahead - 150-200 words]",
      "visual_ai_prompt": "[Specific visual showing success or confident person]",
      "alt_text": "[Descriptive alt text]",
      "emotional_tone": "inspirational"
    }
  ]
}
`.trim(),

  /**
   * Teach Agent - Story-Based Teaching
   */
  teachAgent: ({ topic, outcome, audience, extractedContentSummary, availableCharacters }) => `
YOU ARE: A master educator creating story-based learning content that engages emotionally.

TOPIC: ${topic}
LEARNING OUTCOME: ${outcome}
AUDIENCE: ${audience}

TRAINING MATERIAL DETAILS (USE THEM EXACTLY):
${(extractedContentSummary?.trim().length ?? 0) > 0
  ? extractedContentSummary
  : '- No extracted models or techniques supplied. Ground the story in realistic workplace practices tied to this outcome.'}

CHARACTERS FROM MATERIAL (PREFER THESE NAMES):
${availableCharacters && availableCharacters.length > 0
  ? availableCharacters.map(formatCharacterLine).join('\n')
  : '- Invent one believable colleague with a realistic name that matches the audience profile.'}

CREATE A TEACHING SCENE USING NARRATIVE + CHARACTER:

MANDATORY NARRATIVE ELEMENTS:

1. CHARACTER/PERSONA:
✅ Create a RELATABLE character similar to the audience
✅ Give them a NAME and ROLE
✅ Show their STRUGGLE with this exact topic
✅ Make learners think "That's just like me!"

2. TEACHING THROUGH STORY:
✅ Present the key concept through the character's journey
✅ Show BEFORE/AFTER contrast
✅ Demonstrate the "aha moment" when character gets it
✅ Ground it in REAL workplace context

3. PRINCIPLE + EXAMPLE:
✅ Explain the core concept clearly
✅ Show practical application immediately
✅ Use specific details, not generalities
✅ Connect to learner's daily work

4. EMOTIONAL RESONANCE:
✅ Address the learner's frustration or pain point
✅ Show the relief or confidence that comes with understanding
✅ Build learner's belief that "I can do this too"

❌ FORBIDDEN:
- Dry lectures or textbook explanations
- Generic examples with no character
- Bullet-point lists only
- Abstract concepts without grounding

STRICT OUTPUT RULES:
❌ NO markdown code blocks
❌ NO \`\`\`json formatting  
❌ NO text before/after JSON
✅ Return ONLY valid JSON
✅ Story-first approach with character
✅ 150-200 word narration minimum

JSON STRUCTURE (EXACT FORMAT REQUIRED):
{
  "scene_number": 1,
  "title": "[Character-driven title: e.g. 'How Sarah Mastered Active Listening']",
  "on_screen_text": "[Key teaching points - 40-60 words]",
  "narration_script": "[Story-based teaching with character - 150-200 words]",
  "visual_ai_prompt": "[Specific visual showing character in situation]",
  "alt_text": "[Descriptive alt text]",
  "character": {
    "name": "[Realistic name]",
    "role": "[Similar to audience role]",
    "challenge": "[Specific struggle with this topic]",
    "transformation": "[How they overcame it]"
  },
  "teaching_principle": "[Core concept being taught]",
  "real_world_example": "[Specific workplace application]"
}
`.trim(),

  /**
   * Apply Agent - Realistic Application Scenarios
   */
  applyAgent: ({ topic, audience, learningOutcome, outcomeContext, sourceMaterialExcerpt, extractedCharacters }) => `
YOU ARE: Creating a realistic workplace scenario for skill application.

TOPIC: ${topic}
AUDIENCE: ${audience || "General staff"}
APPLICATION FOCUS: ${learningOutcome || `Apply ${topic} in context`}
OUTCOME CONTEXT FROM DIRECTOR:
${(outcomeContext?.trim().length ?? 0) > 0
  ? outcomeContext
  : '- Spotlight a consequential moment where the learner must make a decision that affects people, performance, or compliance.'}

SOURCE MATERIAL INSIGHTS TO APPLY:
${(sourceMaterialExcerpt?.trim().length ?? 0) > 0
  ? sourceMaterialExcerpt
  : '- Draw on authentic workplace knowledge related to this topic. No generic placeholders.'}

NAMED CHARACTERS AVAILABLE:
${extractedCharacters && extractedCharacters.length > 0
  ? extractedCharacters.map(formatCharacterLine).join('\n')
  : '- Invent two credible colleagues with UK names and roles aligned to the audience. They must feel like real co-workers.'}

CREATE AN APPLICATION SCENE WITH HIGH REALISM:

SCENARIO REQUIREMENTS:

1. REALISTIC CONTEXT:
✅ Workplace situation the learner WILL ACTUALLY FACE
✅ Specific details that make it BELIEVABLE
✅ Real constraints (time, budget, people, politics)
✅ Named people with roles and perspectives

2. DILEMMA (Not obvious):
✅ Present a CHOICE with no clear "right" answer
✅ Multiple reasonable options with trade-offs
✅ Real consequences for decisions
✅ Show what's at stake

3. STAKES & IMPACT:
✅ Clear consequences for good/poor choices
✅ Impact on team, project, relationships
✅ Connect to real outcomes (not just "try again")
✅ Show ripple effects

4. COACHING (Not answers):
✅ Guide THINKING without giving away the answer
✅ Provide decision-making criteria
✅ Build confidence in application
✅ Support transfer to their own context

❌ FORBIDDEN:
- Obvious "correct" answers
- Unrealistic scenarios
- Generic situations
- Academic case studies

STRICT OUTPUT RULES:
❌ NO markdown formatting
❌ NO code blocks
❌ NO text before/after JSON
✅ Return ONLY valid JSON
✅ Realistic scenario with named people
✅ 150-200 word narration

JSON STRUCTURE (EXACT FORMAT REQUIRED):
{
  "scene_number": 1,
  "title": "[Scenario title with context]",
  "on_screen_text": "[Scenario setup - 40-60 words]",
  "narration_script": "[Detailed realistic scenario - 150-200 words]",
  "visual_ai_prompt": "[Realistic workplace visual with people]",
  "alt_text": "[Descriptive alt text]",
  "scenario": {
    "context": "[Specific workplace situation]",
    "characters": [
      {"name": "[Name]", "role": "[Role]", "perspective": "[Their view]"}
    ],
    "challenge": "[The dilemma requiring decision]",
    "stakes": "[Why this matters and what's at risk]",
    "constraints": ["[Time constraint]", "[Resource constraint]", "[Political constraint]"]
  }
}
`.trim(),

  /**
   * Summary Agent - Transformation Celebration & Call to Action
   */
  summaryAgent: ({ topic, outcomes, characterName }) => `
YOU ARE: Creating a powerful summary that celebrates transformation and inspires immediate action.

TOPIC: ${topic}
LEARNING OUTCOMES MASTERED:
${outcomes.map((o, i) => `${i + 1}. ${o}`).join('\n')}
${characterName ? `CHARACTER FROM MODULE: ${characterName}` : ''}

CREATE 2 SUMMARY SCENES THAT INSPIRE ACTION:

SCENE 1 - TRANSFORMATION CELEBRATION:
✅ Show the JOURNEY from struggle to mastery
✅ Highlight specific "aha moments" from the module
${characterName ? `✅ Reference ${characterName}'s success story` : ''}
✅ Celebrate the learner's progress
✅ Connect learning to REAL application opportunities
✅ Build confidence: "You now have the skills to..."

SCENE 2 - IMMEDIATE CALL TO ACTION:
✅ SPECIFIC next steps (not generic)
✅ Challenge to use skills THIS WEEK
✅ Concrete application ideas
✅ Resources or support available
✅ Inspirational closing that motivates

❌ FORBIDDEN:
- Generic "you learned about..." summaries
- Bullet-point recaps only
- Vague "apply this at work" statements
- Passive closing

STRICT OUTPUT RULES:
❌ NO markdown code blocks
❌ NO \`\`\`json formatting
❌ NO text before/after JSON
✅ Return ONLY valid JSON
✅ Inspirational and action-oriented tone
✅ Specific, actionable next steps

JSON STRUCTURE (EXACT FORMAT REQUIRED):
{
  "scenes": [
    {
      "scene_number": 1,
      "title": "[Transformation celebration title]",
      "on_screen_text": "[Journey highlights - 40-60 words]",
      "narration_script": "[Celebrate growth and mastery - 150-200 words]",
      "visual_ai_prompt": "[Success journey visual or confident person]",
      "alt_text": "[Descriptive alt text]",
      "emotional_tone": "celebratory"
    },
    {
      "scene_number": 2,
      "title": "[Action-oriented title with urgency]",
      "on_screen_text": "[Specific next steps - 40-60 words]",
      "narration_script": "[Call to action with specific application ideas - 150-200 words]",
      "visual_ai_prompt": "[Forward-looking visual showing application]",
      "alt_text": "[Descriptive alt text]",
      "call_to_action": "[Specific action to take this week]",
      "emotional_tone": "inspirational"
    }
  ]
}
`.trim(),

  /**
   * QA Agent - Quality Assessment
   */
  qaAgent: ({ storyboardContent }) => `
YOU ARE: A quality assurance expert reviewing eLearning storyboards for award-level quality.

REVIEW THIS STORYBOARD:
${storyboardContent.substring(0, 2000)}...

ASSESS QUALITY ON THESE DIMENSIONS:

1. NARRATIVE QUALITY (0-100):
- Does it have emotional hooks?
- Are there characters or personas?
- Is there a clear story arc?
- Does it engage emotionally?

2. INSTRUCTIONAL DESIGN (0-100):
- Clear learning progression?
- Outcomes properly addressed?
- Good practice opportunities?
- Effective assessments?

3. ENGAGEMENT (0-100):
- Varied interactions?
- Realistic scenarios?
- Relatable content?
- Maintains interest?

4. ACCESSIBILITY (0-100):
- Clear alt text?
- Keyboard navigation supported?
- Screen reader friendly?
- Multiple modalities?

STRICT OUTPUT RULES:
❌ NO markdown formatting
❌ NO code blocks
✅ Return ONLY valid JSON

JSON STRUCTURE:
{
  "score": [0-100],
  "narrative_quality": [0-100],
  "instructional_design": [0-100],
  "engagement": [0-100],
  "accessibility": [0-100],
  "issues": ["[Specific issue 1]", "[Issue 2]"],
  "recommendations": ["[Specific improvement 1]", "[Improvement 2]"],
  "award_potential": "high" | "medium" | "low",
  "strengths": ["[Strength 1]", "[Strength 2]"]
}
`.trim()

};

/**
 * Get enhanced prompt for specific agent
 */
export function getEnhancedPrompt<K extends AgentName>(
  agentName: K,
  params: AgentPromptParams[K]
): string {
  const promptGenerator = ENHANCED_PROMPTS[agentName];
  
  if (!promptGenerator) {
    throw new Error(`No enhanced prompt found for agent: ${agentName}`);
  }
  
  return promptGenerator(params);
}

/**
 * Validation helper: ensure prompt enforces JSON-only output
 */
export function validatePromptEnforcesJSON(prompt: string): boolean {
  const hasJSONInstruction = prompt.includes('Return ONLY valid JSON') || 
                             prompt.includes('JSON ONLY') ||
                             prompt.includes('valid JSON');
  
  const forbidsMarkdown = prompt.includes('NO markdown') ||
                         prompt.includes('NO code blocks') ||
                         prompt.includes('DO NOT wrap');
  
  return hasJSONInstruction && forbidsMarkdown;
}

export default ENHANCED_PROMPTS;
