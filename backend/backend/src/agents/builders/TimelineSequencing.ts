// backend/src/agents/builders/TimelineSequencing.ts
import { Scene } from '../../agents_v2/types';
import { InteractivityDecision, InteractionDetails } from '../../types/storyboardTypes';

/**
 * Timeline Sequencing Builder
 * Creates step-by-step process learning interactions where learners sequence events in correct order
 */
export class TimelineSequencingBuilder {
  
  build(scene: Scene, decision: InteractivityDecision): InteractionDetails {
    const steps = this.extractSteps(scene.onScreenText || scene.learningOutcome || scene.pageTitle);
    
    return {
      type: "timeline_sequencing",
      title: `Sequence: ${scene.pageTitle}`,
      interactionSteps: [
        "Review all the steps presented",
        "Drag the steps into the correct chronological order",
        "Click 'Check Sequence' to verify your answer",
        "Review feedback and adjust if needed"
      ],
      feedbackRules: {
        correct: "Excellent! You've sequenced the steps correctly. This shows you understand the logical flow of the process.",
        incorrect: "Not quite. Review the natural progression and dependencies between steps, then try again.",
        neutral: "Arrange all steps before checking your sequence."
      },
      accessibilityNotes: "Use Tab to navigate steps. Press Space to select a step. Use Arrow keys to reorder selected step. Press Enter to confirm placement.",
      imagePrompt: `Timeline interface showing sequential steps for ${scene.pageTitle} with drag-drop functionality and clear visual indicators`,
      templateData: {
        steps: steps.map((step, index) => ({
          id: `step-${index + 1}`,
          correctOrder: index + 1,
          label: step,
          description: `Step ${index + 1} in the process`,
          currentPosition: Math.floor(Math.random() * steps.length) + 1 // Randomize initial positions
        })),
        requireCorrectOrder: true,
        showHints: true,
        allowPartialCredit: false,
        timelineOrientation: 'vertical'
      }
    };
  }
  
  /**
   * Extract steps from scene content
   */
  private extractSteps(text: string): string[] {
    // Ensure text is defined and is a string
    if (!text || typeof text !== 'string') {
      console.log("   ⚠️  TimelineSequencing: No text provided, using default steps");
      return [
        "Identify the situation or trigger",
        "Analyze the context and requirements",
        "Select the appropriate approach",
        "Implement the chosen strategy"
      ];
    }
    
    // Try to find numbered steps
    const numberedMatches = text.match(/\d+[.)]\s*([^\n.!?]+)/g);
    if (numberedMatches && numberedMatches.length >= 3) {
      return numberedMatches.map(m => m.replace(/^\d+[.)]\s*/, '').trim()).slice(0, 6);
    }
    
    // Try bullet points
    const bulletMatches = text.match(/[-•]\s*([^\n]+)/g);
    if (bulletMatches && bulletMatches.length >= 3) {
      return bulletMatches.map(m => m.replace(/^[-•]\s*/, '').trim()).slice(0, 6);
    }
    
    // Default steps if no structure found
    return [
      "Identify the situation or trigger",
      "Analyze the context and requirements",
      "Select the appropriate approach",
      "Implement the chosen strategy",
      "Monitor the results and outcomes",
      "Reflect and adjust as needed"
    ].slice(0, 4); // Return 4 default steps
  }
}

export default TimelineSequencingBuilder;

