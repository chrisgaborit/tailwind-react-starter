/**
 * Instructional Sequence Generator
 * 
 * Generates the complete Learn-See-Do-Apply instructional sequence for each learning outcome.
 * Creates 4 scenes per learning outcome: LEARN → SEE → DO → APPLY
 */

import { v4 as uuidv4 } from 'uuid';
import { LearningOutcome, StoryboardScene, PedagogyPhase } from '../../types';

export interface InstructionalSequenceOptions {
  businessImpact?: string;
  targetAudience?: string;
  tone?: string;
  includeInteractivity?: boolean;
}

export class InstructionalSequenceGenerator {
  private readonly REQUIRED_PHASES: PedagogyPhase[] = ['LEARN', 'SEE', 'DO', 'APPLY'];

  /**
   * Generate complete instructional sequence for all learning outcomes
   */
  public generateInstructionalSequence(
    learningOutcomes: LearningOutcome[],
    options: InstructionalSequenceOptions = {}
  ): StoryboardScene[] {
    const scenes: StoryboardScene[] = [];
    let sceneNumber = 3; // Start after internal pages (TOC + Pronunciations)

    learningOutcomes.forEach((outcome, outcomeIndex) => {
      const outcomeScenes = this.generateScenesForOutcome(outcome, sceneNumber, options);
      scenes.push(...outcomeScenes);
      sceneNumber += outcomeScenes.length;
    });

    return scenes;
  }

  /**
   * Generate 4 scenes for a single learning outcome
   */
  private generateScenesForOutcome(
    outcome: LearningOutcome,
    startSceneNumber: number,
    options: InstructionalSequenceOptions
  ): StoryboardScene[] {
    const scenes: StoryboardScene[] = [];

    this.REQUIRED_PHASES.forEach((phase, phaseIndex) => {
      const sceneNumber = startSceneNumber + phaseIndex;
      const scene = this.createSceneForPhase(outcome, phase, sceneNumber, options);
      scenes.push(scene);
    });

    return scenes;
  }

  /**
   * Create a scene for a specific phase and learning outcome
   */
  private createSceneForPhase(
    outcome: LearningOutcome,
    phase: PedagogyPhase,
    sceneNumber: number,
    options: InstructionalSequenceOptions
  ): StoryboardScene {
    const baseScene = {
      scene_id: uuidv4(),
      sceneNumber,
      phase,
      learningOutcomeRefs: [outcome.id],
      internalPage: false,
      templateType: sceneNumber === 3 ? 'LEARNER_START' : null,
      timing: { estimatedSeconds: 60 }
    };

    switch (phase) {
      case 'LEARN':
        return this.createLearnScene(baseScene, outcome, options);
      case 'SEE':
        return this.createSeeScene(baseScene, outcome, options);
      case 'DO':
        return this.createDoScene(baseScene, outcome, options);
      case 'APPLY':
        return this.createApplyScene(baseScene, outcome, options);
      default:
        throw new Error(`Unknown phase: ${phase}`);
    }
  }

  /**
   * Create LEARN scene - explicit teaching moment
   */
  private createLearnScene(
    baseScene: any,
    outcome: LearningOutcome,
    options: InstructionalSequenceOptions
  ): StoryboardScene {
    const title = `Learning: ${outcome.verb} ${this.extractSkillFromOutcome(outcome.text)}`;
    
    return {
      ...baseScene,
      title,
      pageTitle: title,
      instructionalPurpose: 'Teach',
      screenLayout: {
        description: 'Teaching layout with clear concept presentation',
        elements: []
      },
      audio: {
        script: this.generateLearnScript(outcome, options),
        voiceParameters: {
          persona: 'Professional instructor',
          pace: 'moderate',
          tone: 'clear and authoritative'
        }
      },
      narrationScript: this.generateLearnScript(outcome, options),
      onScreenText: this.generateLearnOnScreenText(outcome),
      visual: {
        mediaType: 'Graphic',
        style: 'professional',
        visualGenerationBrief: {
          sceneDescription: `Teaching scene showing ${outcome.verb} concept with clear visual hierarchy`,
          style: 'corporate',
          mood: 'professional and educational'
        },
        altText: `Learning scene for ${outcome.verb} concept`,
        aspectRatio: '16:9'
      },
      interactionType: 'None',
      developerNotes: `LEARN scene: Explicit teaching of ${outcome.verb} concept. Focus on clear explanation and relevance to business impact.`,
      accessibilityNotes: 'Ensure clear visual hierarchy and sufficient contrast for concept presentation'
    };
  }

  /**
   * Create SEE scene - demonstration through example
   */
  private createSeeScene(
    baseScene: any,
    outcome: LearningOutcome,
    options: InstructionalSequenceOptions
  ): StoryboardScene {
    const title = `Example: ${outcome.verb} in Action`;
    
    return {
      ...baseScene,
      title,
      pageTitle: title,
      instructionalPurpose: 'Demonstrate',
      screenLayout: {
        description: 'Demonstration layout with example scenario',
        elements: []
      },
      audio: {
        script: this.generateSeeScript(outcome, options),
        voiceParameters: {
          persona: 'Professional narrator',
          pace: 'moderate',
          tone: 'engaging and clear'
        }
      },
      narrationScript: this.generateSeeScript(outcome, options),
      onScreenText: this.generateSeeOnScreenText(outcome),
      visual: {
        mediaType: 'Animation',
        style: 'professional',
        visualGenerationBrief: {
          sceneDescription: `Demonstration scene showing ${outcome.verb} in realistic workplace context`,
          style: 'corporate',
          mood: 'professional and engaging'
        },
        altText: `Demonstration of ${outcome.verb} in action`,
        aspectRatio: '16:9'
      },
      interactionType: 'Click & Reveal',
      interactionDescription: 'Click to reveal step-by-step demonstration',
      developerNotes: `SEE scene: Demonstrate ${outcome.verb} through realistic example. Use established characters (Alex, Jordan, Sarah Chen).`,
      accessibilityNotes: 'Provide clear step-by-step narration and visual cues for demonstration'
    };
  }

  /**
   * Create DO scene - guided and independent practice
   */
  private createDoScene(
    baseScene: any,
    outcome: LearningOutcome,
    options: InstructionalSequenceOptions
  ): StoryboardScene {
    const title = `Practice: ${outcome.verb} Skills`;
    
    return {
      ...baseScene,
      title,
      pageTitle: title,
      instructionalPurpose: 'Practice',
      screenLayout: {
        description: 'Practice layout with interactive elements',
        elements: []
      },
      audio: {
        script: this.generateDoScript(outcome, options),
        voiceParameters: {
          persona: 'Supportive coach',
          pace: 'moderate',
          tone: 'encouraging and supportive'
        }
      },
      narrationScript: this.generateDoScript(outcome, options),
      onScreenText: this.generateDoOnScreenText(outcome),
      visual: {
        mediaType: 'Interactive',
        style: 'professional',
        visualGenerationBrief: {
          sceneDescription: `Practice scene with interactive elements for ${outcome.verb} skill development`,
          style: 'corporate',
          mood: 'supportive and engaging'
        },
        altText: `Practice activity for ${outcome.verb} skills`,
        aspectRatio: '16:9'
      },
      interactionType: 'Scenario',
      interactionDescription: 'Guided practice with immediate feedback',
      interactionDetails: {
        interactionType: 'Scenario',
        aiDecisionLogic: this.generatePracticeDecisions(outcome),
        completionRule: 'Complete all practice activities with feedback'
      },
      developerNotes: `DO scene: Provide guided practice for ${outcome.verb}. Include immediate feedback and multiple attempts.`,
      accessibilityNotes: 'Ensure keyboard navigation and screen reader support for practice activities'
    };
  }

  /**
   * Create APPLY scene - capstone scenario
   */
  private createApplyScene(
    baseScene: any,
    outcome: LearningOutcome,
    options: InstructionalSequenceOptions
  ): StoryboardScene {
    const title = `Apply: ${outcome.verb} in Real Scenarios`;
    
    return {
      ...baseScene,
      title,
      pageTitle: title,
      instructionalPurpose: 'Assess',
      screenLayout: {
        description: 'Assessment layout with complex scenario',
        elements: []
      },
      audio: {
        script: this.generateApplyScript(outcome, options),
        voiceParameters: {
          persona: 'Professional assessor',
          pace: 'moderate',
          tone: 'challenging and supportive'
        }
      },
      narrationScript: this.generateApplyScript(outcome, options),
      onScreenText: this.generateApplyOnScreenText(outcome),
      visual: {
        mediaType: 'Interactive',
        style: 'professional',
        visualGenerationBrief: {
          sceneDescription: `Complex scenario scene testing ${outcome.verb} in realistic workplace situation`,
          style: 'corporate',
          mood: 'challenging and realistic'
        },
        altText: `Assessment scenario for ${outcome.verb} application`,
        aspectRatio: '16:9'
      },
      interactionType: 'Scenario',
      interactionDescription: 'Complex branching scenario with comprehensive feedback',
      interactionDetails: {
        interactionType: 'Scenario',
        aiDecisionLogic: this.generateAssessmentDecisions(outcome),
        completionRule: 'Complete scenario with detailed feedback and reflection'
      },
      developerNotes: `APPLY scene: Capstone assessment for ${outcome.verb}. Complex scenario requiring synthesis of learning.`,
      accessibilityNotes: 'Provide comprehensive feedback and reflection opportunities'
    };
  }

  /**
   * Generate script for LEARN scene
   */
  private generateLearnScript(outcome: LearningOutcome, options: InstructionalSequenceOptions): string {
    const businessContext = options.businessImpact ? 
      ` This is important because ${options.businessImpact.toLowerCase()}.` : '';
    
    return `Let's learn about ${outcome.verb.toLowerCase()} ${this.extractSkillFromOutcome(outcome.text)}. 

${outcome.text}${businessContext}

Understanding this concept is essential for your professional development and will help you achieve better outcomes in your role.`;
  }

  /**
   * Generate on-screen text for LEARN scene
   */
  private generateLearnOnScreenText(outcome: LearningOutcome): string {
    return `${outcome.verb.toUpperCase()}: ${this.extractSkillFromOutcome(outcome.text)}

Key Points:
• Clear definition and explanation
• Relevance to your role
• Visual examples and illustrations`;
  }

  /**
   * Generate script for SEE scene
   */
  private generateSeeScript(outcome: LearningOutcome, options: InstructionalSequenceOptions): string {
    return `Now let's see ${outcome.verb.toLowerCase()} ${this.extractSkillFromOutcome(outcome.text)} in action.

Watch as our team demonstrates this concept in a realistic workplace scenario. Notice how they apply the principles we just learned and the positive outcomes that result.`;
  }

  /**
   * Generate on-screen text for SEE scene
   */
  private generateSeeOnScreenText(outcome: LearningOutcome): string {
    return `Example: ${outcome.verb} in Action

Watch the demonstration:
• Realistic workplace scenario
• Step-by-step application
• Positive outcomes shown`;
  }

  /**
   * Generate script for DO scene
   */
  private generateDoScript(outcome: LearningOutcome, options: InstructionalSequenceOptions): string {
    return `Now it's your turn to practice ${outcome.verb.toLowerCase()} ${this.extractSkillFromOutcome(outcome.text)}.

You'll work through guided practice activities that will help you develop this skill. Don't worry if you make mistakes - that's how we learn. You'll receive immediate feedback to help you improve.`;
  }

  /**
   * Generate on-screen text for DO scene
   */
  private generateDoOnScreenText(outcome: LearningOutcome): string {
    return `Practice: ${outcome.verb} Skills

Your turn to practice:
• Guided activities
• Immediate feedback
• Multiple attempts allowed`;
  }

  /**
   * Generate script for APPLY scene
   */
  private generateApplyScript(outcome: LearningOutcome, options: InstructionalSequenceOptions): string {
    return `Now let's apply ${outcome.verb.toLowerCase()} ${this.extractSkillFromOutcome(outcome.text)} in a complex, realistic scenario.

This capstone activity will test your understanding and ability to apply what you've learned. You'll face challenging situations that require you to synthesize all your learning and make thoughtful decisions.`;
  }

  /**
   * Generate on-screen text for APPLY scene
   */
  private generateApplyOnScreenText(outcome: LearningOutcome): string {
    return `Apply: ${outcome.verb} in Real Scenarios

Capstone Assessment:
• Complex workplace scenario
• Multiple decision points
• Comprehensive feedback`;
  }

  /**
   * Generate practice decisions for DO scene
   */
  private generatePracticeDecisions(outcome: LearningOutcome): any[] {
    return [
      {
        choice: 'Correct approach',
        feedback: {
          text: `Excellent! You correctly applied ${outcome.verb.toLowerCase()} principles. This approach will help you achieve better outcomes because it addresses the core requirements effectively.`,
          tone: 'positive'
        }
      },
      {
        choice: 'Partially correct approach',
        feedback: {
          text: `Good start! You're on the right track with ${outcome.verb.toLowerCase()}, but consider how you might strengthen this approach. Think about the specific context and requirements.`,
          tone: 'constructive'
        }
      },
      {
        choice: 'Incorrect approach',
        feedback: {
          text: `Let's try a different approach. Remember that ${outcome.verb.toLowerCase()} requires careful consideration of the specific situation. Review the key principles we learned and try again.`,
          tone: 'supportive'
        }
      }
    ];
  }

  /**
   * Generate assessment decisions for APPLY scene
   */
  private generateAssessmentDecisions(outcome: LearningOutcome): any[] {
    return [
      {
        choice: 'Mastery level response',
        feedback: {
          text: `Outstanding! You've demonstrated mastery of ${outcome.verb.toLowerCase()} by considering multiple factors, anticipating consequences, and applying the principles effectively. This level of application will lead to excellent outcomes.`,
          tone: 'excellent'
        }
      },
      {
        choice: 'Proficient response',
        feedback: {
          text: `Well done! You've shown good understanding of ${outcome.verb.toLowerCase()} and applied the principles appropriately. Consider how you might further refine your approach for even better results.`,
          tone: 'positive'
        }
      },
      {
        choice: 'Developing response',
        feedback: {
          text: `You're developing your skills in ${outcome.verb.toLowerCase()}. This response shows understanding of the basic principles, but consider how you might apply them more effectively in this complex scenario.`,
          tone: 'constructive'
        }
      },
      {
        choice: 'Needs improvement response',
        feedback: {
          text: `This scenario requires careful application of ${outcome.verb.toLowerCase()} principles. Review the key concepts we've covered and consider how they apply to this specific situation. You can try again with a different approach.`,
          tone: 'supportive'
        }
      }
    ];
  }

  /**
   * Extract skill from learning outcome text
   */
  private extractSkillFromOutcome(text: string): string {
    // Simple extraction - in practice, you might use more sophisticated NLP
    const words = text.split(' ');
    if (words.length > 3) {
      return words.slice(1, 4).join(' ');
    }
    return text;
  }
}

// Export singleton instance
export const instructionalSequenceGenerator = new InstructionalSequenceGenerator();




