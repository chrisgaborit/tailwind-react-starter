// backend/src/agents/specialists/InteractivityAgent.ts

/**
 * InteractivityAgent - Specialist Agent
 * 
 * Generates pedagogically-sound interactions based on scene types
 * Ensures all interactions are accessible, provide feedback, and connect to learning objectives
 * 
 * Key Capabilities:
 * - TEACH scenes: No interaction (pure content delivery)
 * - SHOW scenes: Click-to-Reveal (3-4 trigger items)
 * - APPLY scenes: Drag-and-Drop Matching (4-6 pairs)
 * - CHECK scenes: Mini-Quiz (2 questions)
 * - REFLECT scenes: Reflection Prompt
 */

import { openaiChat } from "../../services/openaiGateway";
import { safeJSONParse } from "../../utils/safeJSONParse";
import { SceneContent } from "./ContentExtractionAgent";
import { SceneDesign } from "./PedagogicalAgent";

/**
 * Interaction specification
 */
export interface InteractionSpec {
  sceneType: "TEACH" | "SHOW" | "APPLY" | "CHECK" | "REFLECT";
  interactionType: "None" | "ClickToReveal" | "DragDrop" | "MCQ" | "Reflection";
  interaction: ClickToRevealInteraction | DragDropInteraction | MCQInteraction | ReflectionInteraction | null;
  learningObjectiveConnection: string;
  accessibilitySupport: AccessibilitySupport;
  instructions: string;
}

/**
 * Click-to-Reveal Interaction (for SHOW scenes)
 */
export interface ClickToRevealInteraction {
  type: "ClickToReveal";
  instruction: string;
  reveals: ClickToRevealItem[];
  accessibility: {
    screenReaderText: string;
    keyboardNavigation: string;
  };
}

export interface ClickToRevealItem {
  id: string;
  triggerLabel: string;
  revealText: string;
  voiceOver?: string;
  visualCue?: string;
}

/**
 * Drag-and-Drop Matching Interaction (for APPLY scenes)
 */
export interface DragDropInteraction {
  type: "DragDrop";
  instruction: string;
  prompt: string;
  pairs: DragDropPair[];
  feedback: {
    correct: string;
    incorrect: string;
    partial?: string;
  };
  accessibility: {
    screenReaderText: string;
    keyboardAlternative: string;
  };
}

export interface DragDropPair {
  statement: string;
  answer: string;
  statementId: string;
  answerId: string;
  explanation?: string;
}

/**
 * Mini-Quiz Interaction (for CHECK scenes)
 */
export interface MCQInteraction {
  type: "MCQ";
  instruction: string;
  questions: MCQQuestion[];
  accessibility: {
    screenReaderText: string;
    keyboardNavigation: string;
  };
}

export interface MCQQuestion {
  id: string;
  stem: string;
  options: MCQOption[];
  feedback: {
    correct: string;
    incorrect: string;
  };
  learningObjectiveConnection: string;
}

export interface MCQOption {
  id: string;
  text: string;
  isCorrect: boolean;
  correctiveFeedback?: string;
}

/**
 * Reflection Prompt Interaction (for REFLECT scenes)
 */
export interface ReflectionInteraction {
  type: "Reflection";
  instruction: string;
  prompt: string;
  bridgeStatement: string;
  guidance?: string;
  accessibility: {
    screenReaderText: string;
    keyboardNavigation: string;
  };
}

/**
 * Accessibility support structure
 */
export interface AccessibilitySupport {
  keyboardNavigation: boolean;
  screenReaderText: string;
  ariaLabels: string[];
  focusManagement: string;
  alternativeFormat?: string;
}

/**
 * Scene context for interaction generation
 */
export interface InteractionContext {
  sceneType: "TEACH" | "SHOW" | "APPLY" | "CHECK" | "REFLECT";
  learningObjective: string;
  sceneContent?: SceneContent;
  sceneDesign?: SceneDesign;
  framework?: any;
  concepts?: string[];
  examples?: string[];
}

export class InteractivityAgent {
  
  /**
   * Design interactions based on scene type
   */
  async designInteractions(context: InteractionContext): Promise<InteractionSpec> {
    console.log(`🎮 InteractivityAgent: Designing interaction for ${context.sceneType} scene`);
    console.log(`   🎯 Learning Objective: ${context.learningObjective.substring(0, 60)}...`);
    
    switch (context.sceneType) {
      case "TEACH":
        return this.designNoInteraction(context);
      
      case "SHOW":
        return await this.designClickToReveal(context);
      
      case "APPLY":
        return await this.designDragDropMatching(context);
      
      case "CHECK":
        return await this.designMiniQuiz(context);
      
      case "REFLECT":
        return await this.designReflectionPrompt(context);
      
      default:
        return this.designNoInteraction(context);
    }
  }
  
  /**
   * TEACH scenes: No interaction (pure content delivery)
   */
  private designNoInteraction(context: InteractionContext): InteractionSpec {
    console.log(`   📝 TEACH scene: No interaction required`);
    
    return {
      sceneType: "TEACH",
      interactionType: "None",
      interaction: null,
      learningObjectiveConnection: `Content delivery focused on ${context.learningObjective}`,
      accessibilitySupport: {
        keyboardNavigation: true,
        screenReaderText: "Content delivery scene with no interactive elements",
        ariaLabels: [],
        focusManagement: "Standard content navigation"
      },
      instructions: "Listen and read to understand the key concepts."
    };
  }
  
  /**
   * SHOW scenes: Click-to-Reveal (3-4 trigger items)
   * Uses extracted instructional content to ensure reveals demonstrate actual LO content
   */
  private async designClickToReveal(context: InteractionContext): Promise<InteractionSpec> {
    console.log(`   🎯 SHOW scene: Designing Click-to-Reveal interaction`);
    
    // Extract instructional content from LO if not provided
    const concepts = context.concepts || context.sceneContent?.relevantConcepts || [];
    const examples = context.examples || context.sceneContent?.examples || [];
    
    // Generate click-to-reveal items
    const generationPrompt = `
GENERATE CLICK-TO-REVEAL INTERACTION

LEARNING OBJECTIVE: ${context.learningObjective}
SCENE TYPE: SHOW (demonstration)

🎯 CRITICAL: Each reveal MUST demonstrate ACTUAL INSTRUCTIONAL CONTENT from the learning objective.

MANDATORY CONTENT REQUIREMENTS:

1. Extract ACTUAL CONTENT from the LO:
   - If LO says "Identify four CAPS types", each reveal must show ONE type with its definition
   - If LO says "Apply communication techniques", each reveal must show ONE technique with steps
   - DO NOT use generic concepts like "Key Concept 1" or "Important Point"

2. Each reveal item MUST include:
   - WHAT: The specific concept, method, or item from the LO
   - DEFINITION: Clear explanation of what it is
   - EXAMPLE: Concrete example showing how it appears/applies
   - CONNECTION: How it relates to the learning objective

EXAMPLE for "Identify the four CAPS behavioral types":
✅ GOOD reveals:
  - "Controller" → "Direct, results-focused individuals who speak quickly, make quick decisions, and want efficiency. Example: 'Get to the point, I'm busy.'"
  - "Analyser" → "Detail-oriented, systematic individuals who ask many questions, want data, and think before acting. Example: 'Can you send me the full report?'"
  
❌ BAD reveals:
  - "Key Concept" → "This is an important concept to understand"
  - "Behavioral Type" → "There are different types of people"

CONCEPTS TO REVEAL: ${concepts.slice(0, 5).join(', ') || 'Extract from the learning objective'}
EXAMPLES AVAILABLE: ${examples.slice(0, 3).join(', ') || 'Create examples that demonstrate the LO'}

Create 3-4 click-to-reveal items that demonstrate ACTUAL INSTRUCTIONAL CONTENT.

Each item must have:
- Trigger label (the ACTUAL concept name from the LO, e.g., "Controller" not "Key Concept")
- Reveal text (detailed explanation with definition, characteristics, and example)
- Optional voice-over (brief narration reinforcing the concept)
- Visual cue (what to show that illustrates this specific concept)

Return JSON:
{
  "instruction": "Click each concept to learn its definition and characteristics",
  "reveals": [
    {
      "id": "reveal-1",
      "triggerLabel": "[ACTUAL concept name from LO]",
      "revealText": "[Detailed explanation with definition, characteristics, and example]",
      "voiceOver": "Brief voice-over reinforcing the concept",
      "visualCue": "Visual description showing this specific concept"
    }
  ]
}

CRITICAL RULES:
- 3-4 items maximum
- Each reveal MUST show actual content from the learning objective
- Use specific definitions, not generic descriptions
- Include concrete examples
- Keep trigger labels short (2-4 words) but use actual concept names
- Reveal text should be 2-3 sentences with definition + example
    `.trim();
    
    try {
      const response = await openaiChat({
        systemKey: "master_blueprint",
        user: generationPrompt
      });
      
      const parsed = safeJSONParse(response);
      
      if (!parsed || !parsed.reveals || !Array.isArray(parsed.reveals)) {
        return this.createFallbackClickToReveal(context);
      }
      
      // Ensure 3-4 items
      const reveals = parsed.reveals.slice(0, 4).map((r: any, i: number) => ({
        id: r.id || `reveal-${i + 1}`,
        triggerLabel: r.triggerLabel || `Concept ${i + 1}`,
        revealText: r.revealText || `Explanation for ${context.learningObjective}`,
        voiceOver: r.voiceOver,
        visualCue: r.visualCue
      }));
      
      // Ensure we have at least 3 items
      while (reveals.length < 3) {
        reveals.push({
          id: `reveal-${reveals.length + 1}`,
          triggerLabel: `Key Concept ${reveals.length + 1}`,
          revealText: `Detailed explanation related to ${context.learningObjective}`,
          visualCue: "Visual representation"
        });
      }
      
      const interaction: ClickToRevealInteraction = {
        type: "ClickToReveal",
        instruction: parsed.instruction || "Click each element to explore the key concepts.",
        reveals: reveals.slice(0, 4) // Max 4 items
      };
      
      const accessibility = this.generateClickToRevealAccessibility(interaction);
      
      return {
        sceneType: "SHOW",
        interactionType: "ClickToReveal",
        interaction: { ...interaction, accessibility },
        learningObjectiveConnection: `Demonstrates ${context.learningObjective} through progressive disclosure`,
        accessibilitySupport: {
          keyboardNavigation: true,
          screenReaderText: `Click-to-reveal interaction with ${reveals.length} items demonstrating ${context.learningObjective}`,
          ariaLabels: reveals.map(r => `Click to reveal ${r.triggerLabel}`),
          focusManagement: "Tab through trigger items, Enter to reveal, Escape to close"
        },
        instructions: interaction.instruction
      };
      
    } catch (error) {
      console.error(`   ❌ Error generating click-to-reveal:`, error);
      return this.createFallbackClickToReveal(context);
    }
  }
  
  /**
   * APPLY scenes: Drag-and-Drop Matching (4-6 pairs)
   */
  private async designDragDropMatching(context: InteractionContext): Promise<InteractionSpec> {
    console.log(`   🎯 APPLY scene: Designing Drag-and-Drop Matching interaction`);
    
    const concepts = context.concepts || context.sceneContent?.relevantConcepts || [];
    const framework = context.framework;
    
    // Generate matching pairs
    const generationPrompt = `
GENERATE DRAG-AND-DROP MATCHING INTERACTION

LEARNING OBJECTIVE: ${context.learningObjective}
SCENE TYPE: APPLY (practice)

🎯 CRITICAL: Each matching pair MUST test ACTUAL INSTRUCTIONAL CONTENT from the learning objective.

MANDATORY CONTENT REQUIREMENTS:

1. Extract ACTUAL CONTENT from the LO:
   - If LO says "Identify four CAPS types", pairs must match behaviors to actual CAPS types (Controller, Analyser, Promoter, Supporter)
   - If LO says "Apply communication techniques", pairs must match scenarios to actual techniques
   - DO NOT use generic matches like "Concept A" → "Answer 1"

2. Each pair MUST include:
   - STATEMENT: Realistic scenario or behavior that demonstrates the concept
   - ANSWER: The ACTUAL concept, method, or type from the LO
   - EXPLANATION: Why this match demonstrates understanding of the actual content

EXAMPLE for "Identify the four CAPS behavioral types":
✅ GOOD pairs:
  - Statement: "Customer says 'Get to the point, I'm busy'" → Answer: "Controller" → Explanation: "Direct, results-focused language indicates Controller behavior"
  - Statement: "Customer asks 'Can you send me the full report with all data?'" → Answer: "Analyser" → Explanation: "Request for detailed information indicates Analyser preference for data"

❌ BAD pairs:
  - Statement: "Customer behavior" → Answer: "Behavioral type" → Explanation: "This matches the concept"

CONCEPTS: ${concepts.slice(0, 6).join(', ')}
${framework ? `FRAMEWORK: ${framework.name}\nCOMPONENTS: ${framework.components.map((c: any) => c.name).join(', ')}` : ''}

Create 4-6 matching pairs that test ACTUAL INSTRUCTIONAL CONTENT.

Return JSON:
{
  "instruction": "Match each scenario to the correct concept from the learning objective",
  "prompt": "What concept from the learning objective does each scenario demonstrate?",
  "pairs": [
    {
      "statement": "[Realistic scenario demonstrating the concept]",
      "answer": "[ACTUAL concept name or method from the LO]",
      "explanation": "[Why this match demonstrates understanding of the actual content]"
    }
  ],
  "feedback": {
    "correct": "Excellent! You correctly identified the concept from the learning objective.",
    "incorrect": "Not quite. Review the definitions from the teaching content and try again."
  }
}

CRITICAL RULES:
- 4-6 pairs minimum
- Each pair MUST test actual content from the learning objective
- Statements must be realistic scenarios that demonstrate the concepts
- Answers must be actual concepts, types, or methods from the LO
- Use specific content, not generic placeholders
    `.trim();
    
    try {
      const response = await openaiChat({
        systemKey: "master_blueprint",
        user: generationPrompt
      });
      
      const parsed = safeJSONParse(response);
      
      if (!parsed || !parsed.pairs || !Array.isArray(parsed.pairs)) {
        return this.createFallbackDragDrop(context);
      }
      
      // Ensure 4-6 pairs
      const pairs = parsed.pairs.slice(0, 6).map((p: any, i: number) => ({
        statement: p.statement || `Statement ${i + 1}`,
        answer: p.answer || `Answer ${i + 1}`,
        statementId: `statement-${i + 1}`,
        answerId: `answer-${i + 1}`,
        explanation: p.explanation
      }));
      
      // Ensure we have at least 4 pairs
      while (pairs.length < 4) {
        pairs.push({
          statement: `Practice scenario ${pairs.length + 1}`,
          answer: `Correct match ${pairs.length + 1}`,
          statementId: `statement-${pairs.length + 1}`,
          answerId: `answer-${pairs.length + 1}`,
          explanation: `This match demonstrates understanding of ${context.learningObjective}`
        });
      }
      
      const interaction: DragDropInteraction = {
        type: "DragDrop",
        instruction: parsed.instruction || "Drag each statement to its matching answer.",
        prompt: parsed.prompt || "Match each scenario to its underlying concept:",
        pairs: pairs.slice(0, 6), // Max 6 pairs
        feedback: parsed.feedback || {
          correct: "Well done! You've correctly matched the items.",
          incorrect: "Not quite. Review the teaching content and try again.",
          partial: "Some matches are correct. Review and try again."
        }
      };
      
      const accessibility = this.generateDragDropAccessibility(interaction);
      
      return {
        sceneType: "APPLY",
        interactionType: "DragDrop",
        interaction: { ...interaction, accessibility },
        learningObjectiveConnection: `Tests application of ${context.learningObjective} through matching scenarios`,
        accessibilitySupport: {
          keyboardNavigation: true,
          screenReaderText: `Drag-and-drop matching with ${pairs.length} pairs to test ${context.learningObjective}`,
          ariaLabels: pairs.map(p => `Match ${p.statement} to ${p.answer}`),
          focusManagement: "Tab through items, Space to select, Arrow keys to move, Enter to drop",
          alternativeFormat: "Keyboard alternative: Use arrow keys to select and match items"
        },
        instructions: interaction.instruction
      };
      
    } catch (error) {
      console.error(`   ❌ Error generating drag-drop:`, error);
      return this.createFallbackDragDrop(context);
    }
  }
  
  /**
   * CHECK scenes: Mini-Quiz (2 questions)
   */
  private async designMiniQuiz(context: InteractionContext): Promise<InteractionSpec> {
    console.log(`   🎯 CHECK scene: Designing Mini-Quiz (2 questions)`);
    
    const concepts = context.concepts || context.sceneContent?.relevantConcepts || [];
    const framework = context.framework;
    
    // Generate quiz questions
    const generationPrompt = `
GENERATE MINI-QUIZ (2 QUESTIONS)

LEARNING OBJECTIVE: ${context.learningObjective}
SCENE TYPE: CHECK (knowledge validation)

🎯 CRITICAL: Each question MUST test ACTUAL INSTRUCTIONAL CONTENT from the learning objective.

MANDATORY CONTENT REQUIREMENTS:

1. Extract ACTUAL CONTENT from the LO:
   - If LO says "Identify four CAPS types", questions must test knowledge of actual types (Controller, Analyser, Promoter, Supporter)
   - If LO says "Apply communication techniques", questions must test knowledge of actual techniques
   - DO NOT use generic questions like "What is the key concept?"

2. Each question MUST:
   - TEST: Specific knowledge from the learning objective
   - OPTIONS: Include actual concepts, types, or methods from the LO
   - FEEDBACK: Explain why answers are correct/incorrect using actual content

EXAMPLE for "Identify the four CAPS behavioral types":
✅ GOOD question:
  Stem: "Which CAPS type prefers detailed data and thinks before acting?"
  Options: 
    - "Controller" (incorrect) → "Controllers want efficiency, not detailed data"
    - "Analyser" (correct) → "Correct! Analysers are detail-oriented and systematic"
    - "Promoter" (incorrect) → "Promoters are relationship-focused, not data-focused"
    - "Supporter" (incorrect) → "Supporters value harmony, not detailed analysis"

❌ BAD question:
  Stem: "What is the key concept?"
  Options: "Concept A", "Concept B", "Concept C" → Generic, no actual content

CONCEPTS TO TEST: ${concepts.slice(0, 5).join(', ')}
${framework ? `FRAMEWORK: ${framework.name}\nCOMPONENTS: ${framework.components.map((c: any) => c.name).join(', ')}` : ''}

Create exactly 2 multiple-choice questions that test ACTUAL INSTRUCTIONAL CONTENT.

Return JSON:
{
  "instruction": "Answer these questions to test your understanding of the learning objective",
  "questions": [
    {
      "stem": "[Question that tests specific knowledge from the LO]",
      "options": [
        {
          "text": "[ACTUAL concept, type, or method from the LO]",
          "isCorrect": true/false,
          "correctiveFeedback": "[Why this is correct/incorrect using actual content]"
        }
      ],
      "feedback": {
        "correct": "Excellent! You correctly identified the concept from the learning objective.",
        "incorrect": "Not quite. Review the definitions from the teaching content."
      }
    }
  ]
}

CRITICAL RULES:
- Exactly 2 questions
- 3-4 options per question
- Only one correct answer per question
- Options must be actual concepts, types, or methods from the LO
- Provide corrective feedback using actual content
- Test understanding of specific content, not generic concepts
    `.trim();
    
    try {
      const response = await openaiChat({
        systemKey: "master_blueprint",
        user: generationPrompt
      });
      
      const parsed = safeJSONParse(response);
      
      if (!parsed || !parsed.questions || !Array.isArray(parsed.questions)) {
        return this.createFallbackQuiz(context);
      }
      
      // Ensure exactly 2 questions
      const questions = parsed.questions.slice(0, 2).map((q: any, i: number) => {
        const options = (q.options || []).slice(0, 4).map((opt: any, j: number) => ({
          id: `q${i + 1}-opt${j + 1}`,
          text: opt.text || `Option ${j + 1}`,
          isCorrect: opt.isCorrect || false,
          correctiveFeedback: opt.correctiveFeedback || (opt.isCorrect ? "Correct!" : "Not quite. Review the teaching content.")
        }));
        
        // Ensure at least one correct answer
        if (!options.some(opt => opt.isCorrect)) {
          options[0].isCorrect = true;
          options[0].correctiveFeedback = "Correct! This demonstrates understanding of the concept.";
        }
        
        return {
          id: `question-${i + 1}`,
          stem: q.stem || `Question ${i + 1} about ${context.learningObjective}`,
          options: options,
          feedback: q.feedback || {
            correct: "Well done! You've demonstrated understanding.",
            incorrect: "Review the teaching content and try again."
          },
          learningObjectiveConnection: context.learningObjective
        };
      });
      
      // Ensure we have exactly 2 questions
      while (questions.length < 2) {
        questions.push({
          id: `question-${questions.length + 1}`,
          stem: `Question ${questions.length + 1}: What best demonstrates understanding of ${context.learningObjective}?`,
          options: [
            { id: `q${questions.length + 1}-opt1`, text: "Option 1", isCorrect: true, correctiveFeedback: "Correct!" },
            { id: `q${questions.length + 1}-opt2`, text: "Option 2", isCorrect: false, correctiveFeedback: "Incorrect. Review the teaching content." },
            { id: `q${questions.length + 1}-opt3`, text: "Option 3", isCorrect: false, correctiveFeedback: "Incorrect. Consider the key concepts." }
          ],
          feedback: {
            correct: "Well done!",
            incorrect: "Review and try again."
          },
          learningObjectiveConnection: context.learningObjective
        });
      }
      
      const interaction: MCQInteraction = {
        type: "MCQ",
        instruction: parsed.instruction || "Answer these questions to check your understanding.",
        questions: questions.slice(0, 2) // Exactly 2 questions
      };
      
      const accessibility = this.generateQuizAccessibility(interaction);
      
      return {
        sceneType: "CHECK",
        interactionType: "MCQ",
        interaction: { ...interaction, accessibility },
        learningObjectiveConnection: `Validates understanding of ${context.learningObjective} through knowledge check`,
        accessibilitySupport: {
          keyboardNavigation: true,
          screenReaderText: `Mini-quiz with ${questions.length} questions testing ${context.learningObjective}`,
          ariaLabels: questions.map(q => `Question: ${q.stem}`),
          focusManagement: "Tab through questions, Arrow keys to select options, Enter to submit"
        },
        instructions: interaction.instruction
      };
      
    } catch (error) {
      console.error(`   ❌ Error generating quiz:`, error);
      return this.createFallbackQuiz(context);
    }
  }
  
  /**
   * REFLECT scenes: Reflection Prompt
   */
  private async designReflectionPrompt(context: InteractionContext): Promise<InteractionSpec> {
    console.log(`   🎯 REFLECT scene: Designing Reflection Prompt`);
    
    const concepts = context.concepts || context.sceneContent?.relevantConcepts || [];
    const examples = context.examples || context.sceneContent?.examples || [];
    
    // Generate reflection prompt
    const generationPrompt = `
GENERATE REFLECTION PROMPT

LEARNING OBJECTIVE: ${context.learningObjective}
SCENE TYPE: REFLECT (metacognition and personalization)

CONCEPTS LEARNED: ${concepts.slice(0, 5).join(', ')}
EXAMPLES: ${examples.slice(0, 2).join(', ')}

Create a reflection prompt that:
1. Asks learners to think about personal application
2. Connects to their own experience
3. Bridges to next section

Return JSON:
{
  "instruction": "Clear instruction",
  "prompt": "Personal application question (e.g., 'Think of your last difficult call. What emotion drove the behavior?')",
  "bridgeStatement": "How this connects to next section",
  "guidance": "Optional guidance for reflection"
}

CRITICAL RULES:
- Make it personal and applicable
- Use real-world examples from context
- Bridge to next learning objective or section
- Encourage metacognition
    `.trim();
    
    try {
      const response = await openaiChat({
        systemKey: "master_blueprint",
        user: generationPrompt
      });
      
      const parsed = safeJSONParse(response);
      
      const interaction: ReflectionInteraction = {
        type: "Reflection",
        instruction: parsed.instruction || "Take a moment to reflect on what you've learned.",
        prompt: parsed.prompt || `Think about how ${context.learningObjective} applies to your own experience.`,
        bridgeStatement: parsed.bridgeStatement || `Now that you understand ${context.learningObjective}, let's explore the next concept.`,
        guidance: parsed.guidance
      };
      
      const accessibility = this.generateReflectionAccessibility(interaction);
      
      return {
        sceneType: "REFLECT",
        interactionType: "Reflection",
        interaction: { ...interaction, accessibility },
        learningObjectiveConnection: `Promotes reflection and personalization of ${context.learningObjective}`,
        accessibilitySupport: {
          keyboardNavigation: true,
          screenReaderText: `Reflection prompt: ${interaction.prompt}`,
          ariaLabels: ["Reflection text area", "Submit reflection button"],
          focusManagement: "Tab to text area, type reflection, Tab to submit"
        },
        instructions: interaction.instruction
      };
      
    } catch (error) {
      console.error(`   ❌ Error generating reflection:`, error);
      return this.createFallbackReflection(context);
    }
  }
  
  // ========== ACCESSIBILITY GENERATORS ==========
  
  private generateClickToRevealAccessibility(interaction: ClickToRevealInteraction): ClickToRevealInteraction["accessibility"] {
    return {
      screenReaderText: `Click-to-reveal interaction with ${interaction.reveals.length} items. Use Tab to navigate, Enter to reveal.`,
      keyboardNavigation: "Tab through trigger items, Enter to reveal content, Escape to close reveal"
    };
  }
  
  private generateDragDropAccessibility(interaction: DragDropInteraction): DragDropInteraction["accessibility"] {
    return {
      screenReaderText: `Drag-and-drop matching with ${interaction.pairs.length} pairs. Use keyboard to select and match items.`,
      keyboardAlternative: "Keyboard alternative: Use arrow keys to navigate, Space to select, Enter to match"
    };
  }
  
  private generateQuizAccessibility(interaction: MCQInteraction): MCQInteraction["accessibility"] {
    return {
      screenReaderText: `Quiz with ${interaction.questions.length} questions. Use Tab to navigate, Arrow keys to select, Enter to submit.`,
      keyboardNavigation: "Tab through questions, Arrow keys to select options, Enter to submit answer"
    };
  }
  
  private generateReflectionAccessibility(interaction: ReflectionInteraction): ReflectionInteraction["accessibility"] {
    return {
      screenReaderText: `Reflection prompt: ${interaction.prompt}. Use Tab to navigate to text area.`,
      keyboardNavigation: "Tab to text area, type reflection, Tab to submit button"
    };
  }
  
  // ========== FALLBACK GENERATORS ==========
  
  private createFallbackClickToReveal(context: InteractionContext): InteractionSpec {
    const reveals: ClickToRevealItem[] = [
      {
        id: "reveal-1",
        triggerLabel: "Key Concept 1",
        revealText: `Explanation of concept related to ${context.learningObjective}`,
        visualCue: "Visual representation"
      },
      {
        id: "reveal-2",
        triggerLabel: "Key Concept 2",
        revealText: `Further explanation related to ${context.learningObjective}`,
        visualCue: "Visual representation"
      },
      {
        id: "reveal-3",
        triggerLabel: "Key Concept 3",
        revealText: `Additional concept related to ${context.learningObjective}`,
        visualCue: "Visual representation"
      }
    ];
    
    const interaction: ClickToRevealInteraction = {
      type: "ClickToReveal",
      instruction: "Click each element to explore the key concepts.",
      reveals,
      accessibility: {
        screenReaderText: "Click-to-reveal interaction with 3 items",
        keyboardNavigation: "Tab through items, Enter to reveal"
      }
    };
    
    return {
      sceneType: "SHOW",
      interactionType: "ClickToReveal",
      interaction,
      learningObjectiveConnection: `Demonstrates ${context.learningObjective}`,
      accessibilitySupport: {
        keyboardNavigation: true,
        screenReaderText: "Click-to-reveal interaction",
        ariaLabels: reveals.map(r => `Click to reveal ${r.triggerLabel}`),
        focusManagement: "Tab, Enter to reveal"
      },
      instructions: interaction.instruction
    };
  }
  
  private createFallbackDragDrop(context: InteractionContext): InteractionSpec {
    const pairs: DragDropPair[] = [
      {
        statement: "Scenario 1",
        answer: "Concept 1",
        statementId: "statement-1",
        answerId: "answer-1"
      },
      {
        statement: "Scenario 2",
        answer: "Concept 2",
        statementId: "statement-2",
        answerId: "answer-2"
      },
      {
        statement: "Scenario 3",
        answer: "Concept 3",
        statementId: "statement-3",
        answerId: "answer-3"
      },
      {
        statement: "Scenario 4",
        answer: "Concept 4",
        statementId: "statement-4",
        answerId: "answer-4"
      }
    ];
    
    const interaction: DragDropInteraction = {
      type: "DragDrop",
      instruction: "Drag each statement to its matching answer.",
      prompt: "Match each scenario to its concept:",
      pairs,
      feedback: {
        correct: "Well done!",
        incorrect: "Not quite. Try again."
      },
      accessibility: {
        screenReaderText: "Drag-and-drop matching with 4 pairs",
        keyboardAlternative: "Use keyboard to match items"
      }
    };
    
    return {
      sceneType: "APPLY",
      interactionType: "DragDrop",
      interaction,
      learningObjectiveConnection: `Tests application of ${context.learningObjective}`,
      accessibilitySupport: {
        keyboardNavigation: true,
        screenReaderText: "Drag-and-drop matching",
        ariaLabels: pairs.map(p => `Match ${p.statement}`),
        focusManagement: "Tab, Space to select, Enter to match"
      },
      instructions: interaction.instruction
    };
  }
  
  private createFallbackQuiz(context: InteractionContext): InteractionSpec {
    const questions: MCQQuestion[] = [
      {
        id: "question-1",
        stem: `What best demonstrates understanding of ${context.learningObjective}?`,
        options: [
          { id: "q1-opt1", text: "Option 1", isCorrect: true, correctiveFeedback: "Correct!" },
          { id: "q1-opt2", text: "Option 2", isCorrect: false, correctiveFeedback: "Incorrect." },
          { id: "q1-opt3", text: "Option 3", isCorrect: false, correctiveFeedback: "Incorrect." }
        ],
        feedback: {
          correct: "Well done!",
          incorrect: "Review and try again."
        },
        learningObjectiveConnection: context.learningObjective
      },
      {
        id: "question-2",
        stem: `Which example best illustrates ${context.learningObjective}?`,
        options: [
          { id: "q2-opt1", text: "Example 1", isCorrect: false, correctiveFeedback: "Incorrect." },
          { id: "q2-opt2", text: "Example 2", isCorrect: true, correctiveFeedback: "Correct!" },
          { id: "q2-opt3", text: "Example 3", isCorrect: false, correctiveFeedback: "Incorrect." }
        ],
        feedback: {
          correct: "Well done!",
          incorrect: "Review and try again."
        },
        learningObjectiveConnection: context.learningObjective
      }
    ];
    
    const interaction: MCQInteraction = {
      type: "MCQ",
      instruction: "Answer these questions to check your understanding.",
      questions,
      accessibility: {
        screenReaderText: "Mini-quiz with 2 questions",
        keyboardNavigation: "Tab, Arrow keys, Enter to submit"
      }
    };
    
    return {
      sceneType: "CHECK",
      interactionType: "MCQ",
      interaction,
      learningObjectiveConnection: `Validates understanding of ${context.learningObjective}`,
      accessibilitySupport: {
        keyboardNavigation: true,
        screenReaderText: "Mini-quiz",
        ariaLabels: questions.map(q => `Question: ${q.stem}`),
        focusManagement: "Tab, Arrow keys, Enter"
      },
      instructions: interaction.instruction
    };
  }
  
  private createFallbackReflection(context: InteractionContext): InteractionSpec {
    const interaction: ReflectionInteraction = {
      type: "Reflection",
      instruction: "Take a moment to reflect on what you've learned.",
      prompt: `Think about how ${context.learningObjective} applies to your own experience.`,
      bridgeStatement: `Now that you understand ${context.learningObjective}, let's explore the next concept.`,
      accessibility: {
        screenReaderText: `Reflection prompt: ${context.learningObjective}`,
        keyboardNavigation: "Tab to text area"
      }
    };
    
    return {
      sceneType: "REFLECT",
      interactionType: "Reflection",
      interaction,
      learningObjectiveConnection: `Promotes reflection on ${context.learningObjective}`,
      accessibilitySupport: {
        keyboardNavigation: true,
        screenReaderText: "Reflection prompt",
        ariaLabels: ["Reflection text area"],
        focusManagement: "Tab to text area"
      },
      instructions: interaction.instruction
    };
  }
}

export default InteractivityAgent;

