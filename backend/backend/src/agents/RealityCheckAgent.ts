// backend/src/agents/RealityCheckAgent.ts

/**
 * Reality Check Agent
 * 
 * Validates storyboards for narrative quality and realism.
 * Rejects template-filled, academic, or generic content.
 * 
 * Quality Gates:
 * - Named characters present
 * - Emotional stakes identified
 * - Realistic workplace dialogue
 * - Practical application shown
 * - Character growth evident
 */

import { Storyboard, Scene } from '../agents_v2/types';

export interface RealityCheckResult {
  passed: boolean;
  score: number;
  checks: {
    hasNamedCharacters: boolean;
    hasEmotionalStakes: boolean;
    hasRealisticDialogue: boolean;
    hasPracticalApplication: boolean;
    hasCharacterGrowth: boolean;
    hasScenarioBasedInteractions: boolean;
    avoidedAcademicTone: boolean;
  };
  violations: string[];
  recommendations: string[];
}

export class RealityCheckAgent {
  
  /**
   * Validate storyboard against reality/narrative criteria
   */
  validateStoryboard(storyboard: Storyboard): RealityCheckResult {
    console.log('🔍 RealityCheckAgent: Validating narrative quality...');

    const checks = {
      hasNamedCharacters: this.hasNamedCharacters(storyboard),
      hasEmotionalStakes: this.hasEmotionalStakes(storyboard),
      hasRealisticDialogue: this.hasRealisticDialogue(storyboard),
      hasPracticalApplication: this.hasPracticalApplication(storyboard),
      hasCharacterGrowth: this.hasCharacterGrowth(storyboard),
      hasScenarioBasedInteractions: this.hasScenarioBasedInteractions(storyboard),
      avoidedAcademicTone: this.avoidedAcademicTone(storyboard)
    };

    const violations: string[] = [];
    const recommendations: string[] = [];

    // Check each criterion
    if (!checks.hasNamedCharacters) {
      violations.push('No named characters found in storyboard');
      recommendations.push('Add a protagonist with a name, role, and specific challenge');
    }

    if (!checks.hasEmotionalStakes) {
      violations.push('No emotional stakes or hooks identified');
      recommendations.push('Add emotional hooks showing why learning matters and what\'s at risk');
    }

    if (!checks.hasRealisticDialogue) {
      violations.push('No realistic workplace dialogue present');
      recommendations.push('Include authentic conversations and scenarios from real workplace situations');
    }

    if (!checks.hasPracticalApplication) {
      violations.push('Limited practical application scenes');
      recommendations.push('Add scenarios where learners apply skills in realistic workplace contexts');
    }

    if (!checks.hasCharacterGrowth) {
      violations.push('No character growth or transformation arc');
      recommendations.push('Show character\'s journey from struggle to mastery throughout module');
    }

    if (!checks.hasScenarioBasedInteractions) {
      violations.push('Too many academic interactions (quizzes, click-reveal), not enough scenarios');
      recommendations.push('Replace academic interactions with branching scenarios and conversation simulators');
    }

    if (!checks.avoidedAcademicTone) {
      violations.push('Academic or textbook language detected');
      recommendations.push('Use conversational, story-based language that connects emotionally');
    }

    // Calculate score
    const passedChecks = Object.values(checks).filter(Boolean).length;
    const score = Math.round((passedChecks / Object.keys(checks).length) * 100);
    const passed = score >= 70; // 70% threshold (5 of 7 checks)

    console.log(`   📊 Reality Score: ${score}/100`);
    console.log(`   ✅ Passed Checks: ${passedChecks}/${Object.keys(checks).length}`);
    console.log(`   ⚠️ Violations: ${violations.length}`);

    return {
      passed,
      score,
      checks,
      violations,
      recommendations
    };
  }

  /**
   * Check for named characters
   */
  private hasNamedCharacters(storyboard: Storyboard): boolean {
    // Look for character objects or names in narrative
    return storyboard.scenes.some(scene => {
      // Check for character object
      if ((scene as any).character?.name) return true;

      // Check for name patterns in narration
      const narration = scene.narrationScript || '';
      const hasNamePattern = /\b[A-Z][a-z]+ (?:the|is|was|faced|struggled|discovered|learned|realized)\b/.test(narration);
      
      return hasNamePattern;
    });
  }

  /**
   * Check for emotional stakes/hooks
   */
  private hasEmotionalStakes(storyboard: Storyboard): boolean {
    const firstThreeScenes = storyboard.scenes.slice(0, 3);
    
    return firstThreeScenes.some(scene => {
      const content = (scene.narrationScript || '') + (scene.onScreenText || '');
      const lowerContent = content.toLowerCase();

      // Look for emotional hook patterns
      const hookPatterns = [
        /have you ever/i,
        /imagine you/i,
        /picture this/i,
        /what would you do/i,
        /struggled with/i,
        /frustrated by/i,
        /at stake/i,
        /the cost of/i
      ];

      return hookPatterns.some(pattern => pattern.test(content));
    });
  }

  /**
   * Check for realistic workplace dialogue
   */
  private hasRealisticDialogue(storyboard: Storyboard): boolean {
    return storyboard.scenes.some(scene => {
      const content = scene.narrationScript || '';

      // Look for dialogue markers
      const hasQuotes = /"[^"]+"/g.test(content);
      const hasDialogueVerbs = /\b(said|asked|replied|responded|explained|told)\b/i.test(content);
      const hasConversation = hasQuotes && hasDialogueVerbs;

      // Check for conversation interaction type
      const hasConversationInteraction = scene.interactionType === 'Scenario' ||
        scene.interactionDetails?.type === 'conversation_simulator' ||
        scene.interactionDetails?.type === 'branching_scenario';

      return hasConversation || hasConversationInteraction;
    });
  }

  /**
   * Check for practical application
   */
  private hasPracticalApplication(storyboard: Storyboard): boolean {
    const applicationScenes = storyboard.scenes.filter(scene => 
      scene.pedagogicalPhase === 'Apply' ||
      scene.pageType === 'Interactive' ||
      scene.interactionType === 'Scenario' ||
      scene.interactionDetails?.type?.includes('scenario') ||
      scene.interactionDetails?.type?.includes('simulation')
    );

    // At least 30% of scenes should be application/practice
    const applicationRatio = applicationScenes.length / storyboard.scenes.length;
    return applicationRatio >= 0.3;
  }

  /**
   * Check for character growth arc
   */
  private hasCharacterGrowth(storyboard: Storyboard): boolean {
    const characterMentions: { scene: number; context: string }[] = [];

    storyboard.scenes.forEach((scene, index) => {
      const content = scene.narrationScript || '';
      const hasCharacter = /\b[A-Z][a-z]+\b/.test(content) && 
        (content.includes('struggled') || content.includes('learned') || 
         content.includes('discovered') || content.includes('mastered') ||
         content.includes('realized') || content.includes('now'));

      if (hasCharacter) {
        characterMentions.push({ scene: index, context: content.substring(0, 100) });
      }
    });

    // Character should appear in beginning, middle, and end (showing arc)
    const hasBeginning = characterMentions.some(m => m.scene < 3);
    const hasMiddle = characterMentions.some(m => m.scene >= 3 && m.scene < storyboard.scenes.length - 2);
    const hasEnd = characterMentions.some(m => m.scene >= storyboard.scenes.length - 2);

    return hasBeginning && hasMiddle && hasEnd;
  }

  /**
   * Check for scenario-based interactions (not academic)
   */
  private hasScenarioBasedInteractions(storyboard: Storyboard): boolean {
    const scenarioTypes = [
      'branching_scenario',
      'conversation_simulator',
      'scenario_simulation',
      'case_study_analysis',
      'decision_tree',
      'simulation_exercise'
    ];

    const academicTypes = [
      'click_to_reveal',
      'drag_and_drop',
      'single_select_quiz',
      'multi_select_quiz'
    ];

    const scenarioCount = storyboard.scenes.filter(scene => 
      scenarioTypes.includes(scene.interactionDetails?.type || '')
    ).length;

    const academicCount = storyboard.scenes.filter(scene => 
      academicTypes.includes(scene.interactionDetails?.type || '')
    ).length;

    // Scenario interactions should outnumber academic ones
    return scenarioCount >= academicCount;
  }

  /**
   * Check if academic tone avoided
   */
  private avoidedAcademicTone(storyboard: Storyboard): boolean {
    const academicPatterns = [
      /in this module/i,
      /in this lesson/i,
      /the learner will/i,
      /objectives include/i,
      /by the end of this/i,
      /let us now/i,
      /it is important to/i
    ];

    const scenesWithAcademicTone = storyboard.scenes.filter(scene => {
      const content = (scene.narrationScript || '') + (scene.onScreenText || '');
      return academicPatterns.some(pattern => pattern.test(content));
    });

    // Less than 30% of scenes should have academic tone
    const academicRatio = scenesWithAcademicTone.length / storyboard.scenes.length;
    return academicRatio < 0.3;
  }
}

export default RealityCheckAgent;


