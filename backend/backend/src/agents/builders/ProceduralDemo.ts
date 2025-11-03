// backend/src/agents/builders/ProceduralDemo.ts
import { Scene } from '../../agents_v2/types';
import { InteractivityDecision, InteractionDetails } from '../../types/storyboardTypes';

/**
 * Procedural Demo Builder
 * Creates step-by-step guided demonstrations with practice opportunities
 */
export class ProceduralDemoBuilder {
  
  build(scene: Scene, decision: InteractivityDecision): InteractionDetails {
    const steps = this.generateDemoSteps(scene);
    
    return {
      type: "procedural_demo",
      title: `Learn: ${scene.pageTitle}`,
      interactionSteps: [
        "Watch each step of the demonstration",
        "Practice each step yourself in the interactive panel",
        "Complete the guided practice exercise",
        "Verify your completion with the checklist"
      ],
      feedbackRules: {
        correct: "Excellent work! You've mastered this procedure and completed all steps correctly.",
        incorrect: "Some steps need adjustment. Review the demonstration and try those steps again.",
        neutral: "Follow along with the demonstration and practice each step."
      },
      accessibilityNotes: "Use Tab to navigate between steps. Press Enter to advance to next step. Press Space to pause/resume demonstration. Arrow keys to move between practice elements.",
      imagePrompt: `Step-by-step procedural demonstration interface for ${scene.pageTitle} showing clear numbered steps with visual guidance`,
      templateData: {
        steps: steps,
        interactive: true,
        allowPractice: true,
        showTips: true,
        requireCompletion: false,
        demonstrationSpeed: 'normal',
        practiceMode: 'guided'
      }
    };
  }
  
  /**
   * Generate demonstration steps from scene content
   */
  private generateDemoSteps(scene: Scene) {
    const learningOutcome = scene.learningOutcome || scene.pageTitle;
    
    return [
      { 
        step: 1, 
        title: "Preparation", 
        description: `Understand the context and requirements for ${learningOutcome}`,
        visual: "Preparation phase illustration showing setup and planning",
        duration: 30,
        practiceTask: "Review the requirements checklist"
      },
      { 
        step: 2, 
        title: "Execution", 
        description: "Follow the procedure step-by-step with attention to detail",
        visual: "Action phase illustration showing the core process",
        duration: 60,
        practiceTask: "Complete the guided practice exercise"
      },
      { 
        step: 3, 
        title: "Verification", 
        description: "Check your work against quality standards and criteria",
        visual: "Verification phase illustration showing quality checks",
        duration: 30,
        practiceTask: "Use the verification checklist"
      },
      {
        step: 4,
        title: "Reflection",
        description: "Consider what worked well and what could be improved",
        visual: "Reflection phase showing continuous improvement cycle",
        duration: 20,
        practiceTask: "Note key learnings and insights"
      }
    ];
  }
}

export default ProceduralDemoBuilder;


