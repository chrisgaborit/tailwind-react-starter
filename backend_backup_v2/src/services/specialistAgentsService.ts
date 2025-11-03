// Specialist Agents Service
// Contains specialized agents for different types of content generation

import OpenAI from "openai";
import { NarrativeAnchor } from "./narrativeAnchorService";

// Helper function to extract JSON from markdown code blocks
function extractJsonFromMarkdown(content: string): string {
  // Remove markdown code blocks if present
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    return jsonMatch[1].trim();
  }
  return content.trim();
}

export interface DilemmaScene {
  title: string;
  setup: string;
  conflict: string;
  characterDilemma: string;
  choices: Array<{
    text: string;
    isCorrect: boolean;
    consequences: string;
    reasoning: string;
  }>;
  learningPoint: string;
  characterGuidance: string;
}

export interface AssessmentScene {
  title: string;
  stem: string;
  question: string;
  options: Array<{
    text: string;
    isCorrect: boolean;
    feedback: {
      correct: string;
      incorrect: string;
      tryAgain: string;
    };
  }>;
  rationale: string;
  difficulty: 'easy' | 'medium' | 'hard';
  learningObjective: string;
}

export interface ExplainerScene {
  title: string;
  concept: string;
  explanation: string;
  structure: 'click_to_reveal' | 'tabbed' | 'timeline' | 'progressive';
  sections: Array<{
    header: string;
    content: string;
    icon?: string;
  }>;
  keyPoints: string[];
  examples: string[];
  visualGuidance: string;
}

/**
 * Dilemma Writer Agent - Creates rich, character-driven scenarios
 */
export async function generateDilemmaScene(
  learningObjective: string,
  context: string,
  anchor: NarrativeAnchor,
  openai: OpenAI
): Promise<DilemmaScene> {
  const primaryChar = anchor.characterRoster.primary;
  const secondaryChar = anchor.characterRoster.secondary[0];
  
  const dilemmaPrompt = `
You are a specialist scenario writer creating a rich, character-driven dilemma for e-learning.

LEARNING OBJECTIVE: ${learningObjective}
CONTEXT: ${context}

NARRATIVE ANCHOR:
- Primary Character: ${primaryChar.name} (${primaryChar.role}) - ${primaryChar.personality}
- Secondary Character: ${secondaryChar.name} (${secondaryChar.role}) - ${secondaryChar.personality}
- Company: ${anchor.companyContext.name}
- Tone: ${anchor.toneOfVoice.forScenarios}

TASK: Create a compelling workplace dilemma that tests the learning objective.

REQUIREMENTS:
- Use the established characters consistently
- Create a realistic workplace situation
- Present a non-trivial decision with clear stakes
- Include 3-4 choice options with realistic consequences
- Make the "correct" choice require understanding, not just guessing
- Include detailed feedback for each choice

OUTPUT JSON FORMAT:
{
  "title": "Dilemma title",
  "setup": "Background and context for the situation",
  "conflict": "The core conflict or challenge",
  "characterDilemma": "What the character is struggling with",
  "choices": [
    {
      "text": "Choice option text",
      "isCorrect": true,
      "consequences": "What happens if this choice is made",
      "reasoning": "Why this choice is correct/incorrect"
    }
  ],
  "learningPoint": "Key learning takeaway from this dilemma",
  "characterGuidance": "How the character should be portrayed in this scenario"
}

Return ONLY the JSON object, no other text.
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: dilemmaPrompt }],
      temperature: 0.8,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) throw new Error("No response from dilemma writer");

    const jsonContent = extractJsonFromMarkdown(content);
    return JSON.parse(jsonContent) as DilemmaScene;
  } catch (error) {
    console.error("Dilemma writer error:", error);
    
    // Fallback dilemma
    return {
      title: "Workplace Decision",
      setup: `${primaryChar.name} faces a challenging situation at ${anchor.companyContext.name}`,
      conflict: "A decision must be made that tests understanding of company policies",
      characterDilemma: `${primaryChar.name} must choose between competing priorities`,
      choices: [
        {
          text: "Follow established procedures",
          isCorrect: true,
          consequences: "Maintains compliance and professional standards",
          reasoning: "This choice demonstrates understanding of company policies"
        },
        {
          text: "Take a shortcut to save time",
          isCorrect: false,
          consequences: "May lead to compliance issues or quality problems",
          reasoning: "This choice prioritizes speed over proper procedures"
        }
      ],
      learningPoint: "Proper procedures exist for important reasons and should be followed",
      characterGuidance: `${primaryChar.name} should be portrayed as thoughtful and professional`
    };
  }
}

/**
 * Assessment Designer Agent - Creates robust knowledge checks
 */
export async function generateAssessmentScene(
  learningObjective: string,
  context: string,
  anchor: NarrativeAnchor,
  openai: OpenAI
): Promise<AssessmentScene> {
  const assessmentPrompt = `
You are a specialist assessment designer creating a comprehensive knowledge check.

LEARNING OBJECTIVE: ${learningObjective}
CONTEXT: ${context}

NARRATIVE ANCHOR:
- Characters: ${anchor.characterRoster.primary.name}, ${anchor.characterRoster.secondary.map(c => c.name).join(', ')}
- Company: ${anchor.companyContext.name}
- Tone: ${anchor.toneOfVoice.forAssessments}

TASK: Create a challenging but fair assessment that tests understanding, not just recall.

REQUIREMENTS:
- Create a realistic scenario-based question
- Include 4 options with 1 correct answer
- Make distractors plausible but clearly wrong
- Provide detailed feedback for each option
- Test application of knowledge, not memorization
- Use company-specific context when possible

OUTPUT JSON FORMAT:
{
  "title": "Assessment title",
  "stem": "Scenario description that sets up the question",
  "question": "The specific question being asked",
  "options": [
    {
      "text": "Option text",
      "isCorrect": true,
      "feedback": {
        "correct": "Why this is the right answer",
        "incorrect": "Why this is wrong",
        "tryAgain": "Hint for improvement"
      }
    }
  ],
  "rationale": "Detailed explanation of the correct answer and why other options are wrong",
  "difficulty": "easy|medium|hard",
  "learningObjective": "Which learning objective this assessment tests"
}

Return ONLY the JSON object, no other text.
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: assessmentPrompt }],
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) throw new Error("No response from assessment designer");

    const jsonContent = extractJsonFromMarkdown(content);
    return JSON.parse(jsonContent) as AssessmentScene;
  } catch (error) {
    console.error("Assessment designer error:", error);
    
    // Fallback assessment
    return {
      title: "Knowledge Check",
      stem: `At ${anchor.companyContext.name}, ${anchor.characterRoster.primary.name} encounters a situation requiring policy knowledge`,
      question: "What should be done in this situation?",
      options: [
        {
          text: "Follow company policy exactly",
          isCorrect: true,
          feedback: {
            correct: "Correct! Following established policies ensures compliance and consistency",
            incorrect: "This is the right approach - policies exist for important reasons",
            tryAgain: "Consider what the company's established procedures would require"
          }
        },
        {
          text: "Make an exception this time",
          isCorrect: false,
          feedback: {
            correct: "This could set a dangerous precedent",
            incorrect: "Making exceptions can lead to compliance issues and inconsistency",
            tryAgain: "Think about the long-term consequences of bending the rules"
          }
        }
      ],
      rationale: "Company policies should be followed consistently to maintain standards and compliance",
      difficulty: "medium",
      learningObjective: learningObjective
    };
  }
}

/**
 * Explainer Agent - Creates engaging explanatory content
 */
export async function generateExplainerScene(
  concept: string,
  context: string,
  structure: 'click_to_reveal' | 'tabbed' | 'timeline' | 'progressive',
  anchor: NarrativeAnchor,
  openai: OpenAI
): Promise<ExplainerScene> {
  const explainerPrompt = `
You are a specialist content explainer creating engaging educational content.

CONCEPT: ${concept}
CONTEXT: ${context}
STRUCTURE: ${structure}

NARRATIVE ANCHOR:
- Characters: ${anchor.characterRoster.primary.name}, ${anchor.characterRoster.secondary.map(c => c.name).join(', ')}
- Company: ${anchor.companyContext.name}
- Tone: ${anchor.toneOfVoice.forAudience}
- Visual Style: ${anchor.visualStyleRules.imageStyle}

TASK: Create engaging, well-structured explanatory content.

REQUIREMENTS:
- Break down complex concepts into digestible sections
- Use the specified structure type effectively
- Include practical examples relevant to the company
- Make content accessible to the target audience
- Provide clear visual guidance for developers

OUTPUT JSON FORMAT:
{
  "title": "Explainer title",
  "concept": "The main concept being explained",
  "explanation": "Overall explanation of the concept",
  "structure": "${structure}",
  "sections": [
    {
      "header": "Section title",
      "content": "Section content",
      "icon": "icon_name"
    }
  ],
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
  "examples": ["Example 1", "Example 2"],
  "visualGuidance": "Specific guidance for visual design and layout"
}

Return ONLY the JSON object, no other text.
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: explainerPrompt }],
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) throw new Error("No response from explainer agent");

    const jsonContent = extractJsonFromMarkdown(content);
    return JSON.parse(jsonContent) as ExplainerScene;
  } catch (error) {
    console.error("Explainer agent error:", error);
    
    // Fallback explainer
    return {
      title: "Understanding the Concept",
      concept: concept,
      explanation: `This concept is important for success at ${anchor.companyContext.name}`,
      structure: structure,
      sections: [
        {
          header: "What it means",
          content: "A clear definition of the concept",
          icon: "book"
        },
        {
          header: "Why it matters",
          content: "The importance and relevance of this concept",
          icon: "lightbulb"
        }
      ],
      keyPoints: ["Key point 1", "Key point 2"],
      examples: ["Example from company context"],
      visualGuidance: "Use clean, professional design with clear hierarchy"
    };
  }
}

/**
 * Determine which specialist agent to use based on scene type
 */
export function determineSpecialistAgent(sceneType: string, blueprintContent: string): 'dilemma' | 'assessment' | 'explainer' | 'none' {
  const content = blueprintContent.toLowerCase();
  
  if (content.includes('dilemma') || content.includes('scenario') || content.includes('decision')) {
    return 'dilemma';
  }
  
  if (content.includes('knowledge check') || content.includes('assessment') || content.includes('quiz')) {
    return 'assessment';
  }
  
  if (content.includes('explain') || content.includes('concept') || content.includes('understand') || 
      content.includes('click') || content.includes('tab') || content.includes('timeline')) {
    return 'explainer';
  }
  
  return 'none';
}

/**
 * Enrich a scene using the appropriate specialist agent
 */
export async function enrichSceneWithSpecialist(
  sceneType: string,
  blueprintContent: string,
  learningObjective: string,
  context: string,
  anchor: NarrativeAnchor,
  openai: OpenAI
): Promise<any> {
  const agentType = determineSpecialistAgent(sceneType, blueprintContent);
  
  switch (agentType) {
    case 'dilemma':
      return await generateDilemmaScene(learningObjective, context, anchor, openai);
    case 'assessment':
      return await generateAssessmentScene(learningObjective, context, anchor, openai);
    case 'explainer':
      const structure = blueprintContent.toLowerCase().includes('click') ? 'click_to_reveal' :
                       blueprintContent.toLowerCase().includes('tab') ? 'tabbed' :
                       blueprintContent.toLowerCase().includes('timeline') ? 'timeline' : 'progressive';
      return await generateExplainerScene(learningObjective, context, structure, anchor, openai);
    default:
      return null;
  }
}





