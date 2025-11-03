/**
 * Pedagogy Enforcer Service
 * 
 * Ensures the Learn-See-Do-Apply framework is properly implemented for
 * Leadership and Soft Skills modules. This service enforces:
 * 1. Non-negotiable sequence: Learn → See → Do → Apply
 * 2. Internal pages (TOC + Pronunciations) before learner content
 * 3. Scene 3 gets templateType: "LEARNER_START"
 * 4. Progressive complexity within DO/APPLY clusters
 * 5. No assessment items in LEARN/SEE phases
 */

import { v4 as uuidv4 } from 'uuid';
import { StoryboardModule, StoryboardScene, PedagogyPhase, LearningOutcome } from '../../types';

export interface PedagogyEnforcementResult {
  success: boolean;
  modifiedStoryboard: StoryboardModule;
  changes: string[];
  warnings: string[];
}

export class PedagogyEnforcer {
  private readonly LEADERSHIP_CATEGORIES = ['Leadership', 'Soft Skills'];
  private readonly REQUIRED_PHASES: PedagogyPhase[] = ['LEARN', 'SEE', 'DO', 'APPLY'];
  private readonly INTERNAL_PAGE_TYPES = ['table_of_contents', 'pronunciations_acronyms'];

  /**
   * Main entry point: ensures Learn-See-Do-Apply framework is properly implemented
   */
  public ensureLearnSeeDoApply(storyboard: StoryboardModule): PedagogyEnforcementResult {
    const changes: string[] = [];
    const warnings: string[] = [];
    let modifiedStoryboard = { ...storyboard };

    // Check if this is a Leadership/Soft Skills module
    const category = this.getModuleCategory(storyboard);
    if (!this.LEADERSHIP_CATEGORIES.includes(category)) {
      return {
        success: true,
        modifiedStoryboard,
        changes: ['Module category does not require Learn-See-Do-Apply framework'],
        warnings: []
      };
    }

    try {
      // Step 1: Ensure internal pages exist
      modifiedStoryboard = this.ensureInternalPages(modifiedStoryboard, changes);

      // Step 2: Partition learner scenes into four clusters
      const learnerScenes = this.getLearnerScenes(modifiedStoryboard.scenes);
      const phaseClusters = this.partitionIntoPhases(learnerScenes);

      // Step 3: Ensure all four phases are present
      const completeClusters = this.ensureAllPhasesPresent(phaseClusters, changes);

      // Step 4: Assign phase tags and ensure proper sequence
      modifiedStoryboard.scenes = this.assignPhaseTags(modifiedStoryboard.scenes, completeClusters, changes);

      // Step 5: Ensure Scene 3 (first learner scene) has LEARNER_START template
      modifiedStoryboard.scenes = this.ensureLearnerStartTemplate(modifiedStoryboard.scenes, changes);

      // Step 6: Enforce progressive complexity
      modifiedStoryboard.scenes = this.enforceProgressiveComplexity(modifiedStoryboard.scenes, changes);

      // Step 7: Remove assessment items from LEARN/SEE phases
      modifiedStoryboard.scenes = this.removePrematureAssessments(modifiedStoryboard.scenes, changes);

      return {
        success: true,
        modifiedStoryboard,
        changes,
        warnings
      };

    } catch (error) {
      return {
        success: false,
        modifiedStoryboard,
        changes,
        warnings: [...warnings, `Pedagogy enforcement failed: ${error.message}`]
      };
    }
  }

  /**
   * Get module category from project metadata or fallback to metadata
   */
  private getModuleCategory(storyboard: StoryboardModule): string {
    return storyboard.project_metadata?.category || 
           storyboard.metadata?.strategicCategory || 
           'Unknown';
  }

  /**
   * Ensure internal pages (TOC + Pronunciations) exist before learner content
   */
  private ensureInternalPages(storyboard: StoryboardModule, changes: string[]): StoryboardModule {
    const scenes = [...storyboard.scenes];
    let hasTOC = false;
    let hasPronunciations = false;

    // Check existing internal pages
    for (let i = 0; i < Math.min(2, scenes.length); i++) {
      const scene = scenes[i];
      if (scene.templateType === 'table_of_contents') {
        hasTOC = true;
      } else if (scene.templateType === 'pronunciations_acronyms') {
        hasPronunciations = true;
      }
    }

    // TOC and Pronunciation pages removed per user request
    // if (!hasTOC) {
    //   const tocScene = this.createInternalPage('table_of_contents', 1);
    //   scenes.unshift(tocScene);
    //   changes.push('Added Table of Contents page');
    // }

    // if (!hasPronunciations) {
    //   const pronunciationScene = this.createInternalPage('pronunciations_acronyms', 2);
    //   scenes.unshift(pronunciationScene);
    //   changes.push('Added Pronunciations & Acronyms page');
    // }

    // Renumber all scenes
    scenes.forEach((scene, index) => {
      scene.sceneNumber = index + 1;
    });

    return { ...storyboard, scenes };
  }

  /**
   * Create an internal page with the specified template type
   */
  private createInternalPage(templateType: string, sceneNumber: number): StoryboardScene {
    return {
      sceneNumber,
      pageTitle: templateType === 'table_of_contents' ? 'Table of Contents' : 'Pronunciations & Acronyms',
      scene_id: uuidv4(),
      internalPage: true,
      templateType: templateType as any,
      screenLayout: {
        description: `${templateType} page layout`,
        elements: []
      },
      audio: {
        script: `Welcome to this learning module.`,
        voiceParameters: {
          persona: 'Professional narrator',
          pace: 'moderate',
          tone: 'clear and engaging'
        }
      },
      narrationScript: `Welcome to this learning module.`,
      onScreenText: templateType === 'table_of_contents' ? 'Table of Contents' : 'Pronunciations & Acronyms',
      visual: {
        mediaType: 'Graphic',
        style: 'professional',
        visualGenerationBrief: {
          sceneDescription: `${templateType} page with clean, professional design`,
          style: 'corporate',
          mood: 'professional'
        },
        altText: `${templateType} page`,
        aspectRatio: '16:9'
      },
      interactionType: 'None',
      timing: { estimatedSeconds: 30 }
    };
  }

  /**
   * Get learner scenes (non-internal pages)
   */
  private getLearnerScenes(scenes: StoryboardScene[]): StoryboardScene[] {
    return scenes.filter(scene => !scene.internalPage);
  }

  /**
   * Partition learner scenes into the four pedagogy phases
   */
  private partitionIntoPhases(learnerScenes: StoryboardScene[]): Record<PedagogyPhase, StoryboardScene[]> {
    const clusters: Record<PedagogyPhase, StoryboardScene[]> = {
      learn: [],
      see: [],
      do: [],
      apply: []
    };

    // If scenes already have phase tags, use them
    learnerScenes.forEach(scene => {
      if (scene.phase && this.REQUIRED_PHASES.includes(scene.phase as PedagogyPhase)) {
        clusters[scene.phase as PedagogyPhase].push(scene);
      }
    });

    // If no phases are assigned, distribute scenes evenly
    if (Object.values(clusters).every(cluster => cluster.length === 0)) {
      const scenesPerPhase = Math.ceil(learnerScenes.length / 4);
      this.REQUIRED_PHASES.forEach((phase, index) => {
        const start = index * scenesPerPhase;
        const end = Math.min(start + scenesPerPhase, learnerScenes.length);
        clusters[phase] = learnerScenes.slice(start, end);
      });
    }

    return clusters;
  }

  /**
   * Ensure all four phases are present, creating minimal scenes if needed
   */
  private ensureAllPhasesPresent(
    clusters: Record<PedagogyPhase, StoryboardScene[]>, 
    changes: string[]
  ): Record<PedagogyPhase, StoryboardScene[]> {
    const completeClusters = { ...clusters };

    this.REQUIRED_PHASES.forEach(phase => {
      if (completeClusters[phase].length === 0) {
        const minimalScene = this.createMinimalPhaseScene(phase);
        completeClusters[phase].push(minimalScene);
        changes.push(`Created minimal ${phase} phase scene`);
      }
    });

    return completeClusters;
  }

  /**
   * Create a minimal scene for a specific pedagogy phase
   */
  private createMinimalPhaseScene(phase: PedagogyPhase): StoryboardScene {
    const phaseTitles = {
      LEARN: 'Learning the Framework',
      SEE: 'Seeing It in Action',
      DO: 'Practicing the Skills',
      APPLY: 'Applying in Real Scenarios'
    };

    const phaseDescriptions = {
      LEARN: 'Understanding the core concepts and principles',
      SEE: 'Observing examples and demonstrations',
      DO: 'Guided practice with feedback',
      APPLY: 'Independent application in complex scenarios'
    };

    return {
      sceneNumber: 0, // Will be renumbered later
      pageTitle: phaseTitles[phase],
      scene_id: uuidv4(),
      phase,
      screenLayout: {
        description: `${phase} phase layout`,
        elements: []
      },
      audio: {
        script: phaseDescriptions[phase],
        voiceParameters: {
          persona: 'Professional narrator',
          pace: 'moderate',
          tone: 'clear and engaging'
        }
      },
      narrationScript: phaseDescriptions[phase],
      onScreenText: phaseTitles[phase],
      visual: {
        mediaType: 'Graphic',
        style: 'professional',
        visualGenerationBrief: {
          sceneDescription: `${phase} phase with appropriate visual elements`,
          style: 'corporate',
          mood: 'professional'
        },
        altText: `${phase} phase scene`,
        aspectRatio: '16:9'
      },
      interactionType: phase === 'DO' || phase === 'APPLY' ? 'Scenario' : 'None',
      timing: { estimatedSeconds: 60 }
    };
  }

  /**
   * Assign phase tags to scenes and ensure proper sequence
   */
  private assignPhaseTags(
    scenes: StoryboardScene[], 
    clusters: Record<PedagogyPhase, StoryboardScene[]>,
    changes: string[]
  ): StoryboardScene[] {
    const result: StoryboardScene[] = [];
    let sceneNumber = 1;

    // Add internal pages first
    const internalPages = scenes.filter(scene => scene.internalPage);
    internalPages.forEach(scene => {
      scene.sceneNumber = sceneNumber++;
      result.push(scene);
    });

    // Add learner scenes in phase order
    this.REQUIRED_PHASES.forEach(phase => {
      clusters[phase].forEach(scene => {
        scene.phase = phase;
        scene.sceneNumber = sceneNumber++;
        result.push(scene);
      });
    });

    changes.push('Assigned phase tags and ensured proper sequence');
    return result;
  }

  /**
   * Ensure Scene 3 (first learner scene) has LEARNER_START template
   */
  private ensureLearnerStartTemplate(scenes: StoryboardScene[], changes: string[]): StoryboardScene[] {
    const learnerScenes = scenes.filter(scene => !scene.internalPage);
    if (learnerScenes.length > 0) {
      const firstLearnerScene = learnerScenes[0];
      if (!firstLearnerScene.templateType || firstLearnerScene.templateType !== 'LEARNER_START') {
        firstLearnerScene.templateType = 'LEARNER_START';
        changes.push('Set first learner scene template to LEARNER_START');
      }
    }
    return scenes;
  }

  /**
   * Enforce progressive complexity within DO/APPLY clusters
   */
  private enforceProgressiveComplexity(scenes: StoryboardScene[], changes: string[]): StoryboardScene[] {
    const doScenes = scenes.filter(scene => scene.phase === 'do');
    const applyScenes = scenes.filter(scene => scene.phase === 'apply');

    // Ensure DO scenes progress from guided to independent
    doScenes.forEach((scene, index) => {
      if (index === 0 && scene.interactionType === 'None') {
        scene.interactionType = 'Scenario';
        scene.interactionDescription = 'Guided practice with immediate feedback';
        changes.push('Enhanced first DO scene with guided practice');
      } else if (index > 0 && scene.interactionType === 'None') {
        scene.interactionType = 'Scenario';
        scene.interactionDescription = 'Independent practice with comprehensive feedback';
        changes.push('Enhanced later DO scene with independent practice');
      }
    });

    // Ensure APPLY scenes are complex branching scenarios
    applyScenes.forEach((scene, index) => {
      if (scene.interactionType !== 'Scenario') {
        scene.interactionType = 'Scenario';
        scene.interactionDescription = 'Complex branching scenario synthesizing all learning outcomes';
        changes.push('Enhanced APPLY scene with complex branching scenario');
      }
    });

    return scenes;
  }

  /**
   * Remove assessment items from LEARN/SEE phases
   */
  private removePrematureAssessments(scenes: StoryboardScene[], changes: string[]): StoryboardScene[] {
    scenes.forEach(scene => {
      if ((scene.phase === 'LEARN' || scene.phase === 'SEE') && 
          (scene.knowledgeCheck || scene.knowledgeChecks)) {
        scene.knowledgeCheck = undefined;
        scene.knowledgeChecks = undefined;
        changes.push(`Removed assessment from ${scene.phase} phase scene: ${scene.pageTitle}`);
      }
    });
    return scenes;
  }
}

// Export singleton instance
export const pedagogyEnforcer = new PedagogyEnforcer();

