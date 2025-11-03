/**
 * Emergency Teaching Enforcer - Safety Net for Teaching-First Pipeline
 * 
 * Ensures teaching content appears early in storyboards by reordering scenes
 * or generating emergency teaching content when none exists.
 */

import type { StoryboardScene } from '../../../packages/shared/src/types';

export class EmergencyTeachingEnforcer {
  /**
   * Enforces teaching-first principle by reordering scenes or generating emergency teaching
   */
  static enforceTeachingFirst(scenes: StoryboardScene[]): StoryboardScene[] {
    const teachingScenes = scenes.filter(s => s.pedagogical_purpose === 'teach');
    const firstThree = scenes.slice(0, 3);
    const hasEarlyTeaching = firstThree.some(s => s.pedagogical_purpose === 'teach');
    
    if (!hasEarlyTeaching) {
      console.log('🔄 EMERGENCY PATCH: No teaching in first 3 scenes - reordering');
      
      if (teachingScenes.length > 0) {
        const firstTeaching = teachingScenes[0];
        const remaining = scenes.filter(s => s.id !== firstTeaching.id);
        return [firstTeaching, ...remaining];
      } else {
        console.log('🚨 CRITICAL: No teaching scenes found - generating emergency teaching');
        const emergency = this.generateEmergencyTeaching(scenes);
        return [emergency, ...scenes];
      }
    }
    return scenes;
  }

  /**
   * Generates emergency teaching content when none exists
   */
  private static generateEmergencyTeaching(scenes: StoryboardScene[]): StoryboardScene {
    const firstContent = typeof scenes[0]?.onScreenText === 'string' ? scenes[0].onScreenText : scenes[0]?.pageTitle || '';
    const match = firstContent.match(/(?:about|principles of|understanding)\s+(\w+)/i);
    const topic = match ? match[1] : 'the topic';
    
    return {
      sceneNumber: 0,
      pageTitle: `Core Principles of ${topic}`,
      pedagogical_purpose: 'teach',
      onScreenText: `## Core Principles of ${topic}\n\nBefore applying ${topic}, let's explore its foundations.`,
      screenLayout: {
        description: 'single-column layout',
        elements: []
      },
      audio: {
        script: `Let's start with the core principles of ${topic}. Understanding these fundamentals will help you apply them effectively.`,
        voiceParameters: {
          persona: 'professional',
          gender: 'Neutral',
          pace: 'moderate',
          tone: 'engaging',
          emphasis: 'clear'
        }
      },
      narrationScript: `Let's start with the core principles of ${topic}. Understanding these fundamentals will help you apply them effectively.`,
      interaction: {
        type: 'none',
        behavior: 'none'
      },
      duration: 120,
      metadata: { 
        emergency_generated: true,
        content: `## Core Principles of ${topic}\n\nBefore applying ${topic}, let's explore its foundations.`,
        visual_description: 'Concept diagram showing key principles and relationships'
      }
    };
  }
}
