/**
 * Redundancy Cleanup Service
 * 
 * Removes redundant framework re-listing and ensures proper scene ordering:
 * - Detects and removes repeated framework re-teach screens
 * - Consolidates similar content across scenes
 * - Ensures proper phase progression
 * - Removes duplicate learning outcome references
 * - Optimizes content flow and reduces redundancy
 */

import { StoryboardModule, StoryboardScene, PedagogyPhase } from '../../types';

export interface RedundancyCleanupResult {
  success: boolean;
  modifiedStoryboard: StoryboardModule;
  changes: string[];
  removedScenes: number[];
  consolidatedScenes: Array<{
    originalScenes: number[];
    consolidatedScene: number;
  }>;
  warnings: string[];
}

export class RedundancyCleanupService {
  private readonly FRAMEWORK_PATTERNS = [
    /framework.*part\s*\d+/i,
    /key\s+processes.*part\s*\d+/i,
    /stages.*part\s*\d+/i,
    /steps.*part\s*\d+/i,
    /model.*part\s*\d+/i,
    /principles.*part\s*\d+/i,
    /elements.*part\s*\d+/i,
    /components.*part\s*\d+/i
  ];

  private readonly SIMILARITY_THRESHOLD = 0.7; // 70% similarity threshold for consolidation

  /**
   * Main entry point: cleans up redundant content and ensures proper ordering
   */
  public cleanupRedundancy(storyboard: StoryboardModule): RedundancyCleanupResult {
    const changes: string[] = [];
    const removedScenes: number[] = [];
    const consolidatedScenes: Array<{ originalScenes: number[]; consolidatedScene: number }> = [];
    const warnings: string[] = [];

    try {
      let modifiedStoryboard = { ...storyboard };

      // Step 1: Remove redundant framework re-listing
      const frameworkCleanup = this.removeFrameworkRedundancy(modifiedStoryboard, changes, removedScenes);
      modifiedStoryboard = frameworkCleanup.storyboard;

      // Step 2: Consolidate similar scenes
      const consolidationResult = this.consolidateSimilarScenes(modifiedStoryboard, changes, consolidatedScenes);
      modifiedStoryboard = consolidationResult.storyboard;

      // Step 3: Remove duplicate learning outcome references
      modifiedStoryboard = this.removeDuplicateOutcomeReferences(modifiedStoryboard, changes);

      // Step 4: Optimize content flow
      modifiedStoryboard = this.optimizeContentFlow(modifiedStoryboard, changes);

      // Step 5: Ensure proper phase progression
      modifiedStoryboard = this.ensurePhaseProgression(modifiedStoryboard, changes, warnings);

      // Step 6: Renumber scenes
      modifiedStoryboard = this.renumberScenes(modifiedStoryboard);

      return {
        success: true,
        modifiedStoryboard,
        changes,
        removedScenes,
        consolidatedScenes,
        warnings
      };

    } catch (error) {
      return {
        success: false,
        modifiedStoryboard: storyboard,
        changes,
        removedScenes,
        consolidatedScenes,
        warnings: [...warnings, `Redundancy cleanup failed: ${error.message}`]
      };
    }
  }

  /**
   * Remove redundant framework re-listing scenes
   */
  private removeFrameworkRedundancy(
    storyboard: StoryboardModule,
    changes: string[],
    removedScenes: number[]
  ): { storyboard: StoryboardModule } {
    const scenes = [...storyboard.scenes];
    const scenesToRemove: number[] = [];
    const frameworkGroups: Record<string, number[]> = {};

    // Group scenes by framework pattern
    scenes.forEach((scene, index) => {
      const title = scene.pageTitle || scene.title || '';
      
      this.FRAMEWORK_PATTERNS.forEach(pattern => {
        if (pattern.test(title)) {
          const baseTitle = title.replace(/\s+part\s*\d+.*$/i, '').toLowerCase();
          if (!frameworkGroups[baseTitle]) {
            frameworkGroups[baseTitle] = [];
          }
          frameworkGroups[baseTitle].push(index);
        }
      });
    });

    // Remove redundant framework scenes (keep only the first one)
    Object.entries(frameworkGroups).forEach(([baseTitle, sceneIndices]) => {
      if (sceneIndices.length > 1) {
        // Keep the first scene, remove the rest
        const scenesToRemoveFromGroup = sceneIndices.slice(1);
        scenesToRemoveFromGroup.forEach(sceneIndex => {
          scenesToRemove.push(sceneIndex);
          removedScenes.push(scenes[sceneIndex].sceneNumber || sceneIndex + 1);
        });
        
        changes.push(`Removed ${scenesToRemoveFromGroup.length} redundant framework scenes for "${baseTitle}"`);
      }
    });

    // Remove scenes in reverse order to maintain indices
    scenesToRemove.sort((a, b) => b - a).forEach(index => {
      scenes.splice(index, 1);
    });

    return { storyboard: { ...storyboard, scenes } };
  }

  /**
   * Consolidate similar scenes based on content similarity
   */
  private consolidateSimilarScenes(
    storyboard: StoryboardModule,
    changes: string[],
    consolidatedScenes: Array<{ originalScenes: number[]; consolidatedScene: number }>
  ): { storyboard: StoryboardModule } {
    const scenes = [...storyboard.scenes];
    const scenesToRemove: number[] = [];
    const consolidationMap: Array<{ originalScenes: number[]; consolidatedScene: number }> = [];

    // Find similar scenes
    for (let i = 0; i < scenes.length; i++) {
      if (scenesToRemove.includes(i)) continue;

      const currentScene = scenes[i];
      const similarScenes: number[] = [];

      for (let j = i + 1; j < scenes.length; j++) {
        if (scenesToRemove.includes(j)) continue;

        const otherScene = scenes[j];
        const similarity = this.calculateSceneSimilarity(currentScene, otherScene);

        if (similarity > this.SIMILARITY_THRESHOLD) {
          similarScenes.push(j);
        }
      }

      if (similarScenes.length > 0) {
        // Consolidate similar scenes
        const allSimilarScenes = [i, ...similarScenes];
        const consolidatedScene = this.consolidateScenes(scenes, allSimilarScenes);
        
        // Replace the first scene with the consolidated version
        scenes[i] = consolidatedScene;
        
        // Mark other similar scenes for removal
        similarScenes.forEach(sceneIndex => {
          scenesToRemove.push(sceneIndex);
        });

        consolidationMap.push({
          originalScenes: allSimilarScenes.map(idx => scenes[idx].sceneNumber || idx + 1),
          consolidatedScene: consolidatedScene.sceneNumber || i + 1
        });

        changes.push(`Consolidated ${allSimilarScenes.length} similar scenes into scene ${consolidatedScene.sceneNumber || i + 1}`);
      }
    }

    // Remove consolidated scenes in reverse order
    scenesToRemove.sort((a, b) => b - a).forEach(index => {
      scenes.splice(index, 1);
    });

    consolidatedScenes.push(...consolidationMap);

    return { storyboard: { ...storyboard, scenes } };
  }

  /**
   * Calculate similarity between two scenes
   */
  private calculateSceneSimilarity(scene1: StoryboardScene, scene2: StoryboardScene): number {
    const title1 = (scene1.pageTitle || scene1.title || '').toLowerCase();
    const title2 = (scene2.pageTitle || scene2.title || '').toLowerCase();
    
    const content1 = `${scene1.narrationScript || ''} ${scene1.onScreenText || ''}`.toLowerCase();
    const content2 = `${scene2.narrationScript || ''} ${scene2.onScreenText || ''}`.toLowerCase();

    // Calculate title similarity
    const titleSimilarity = this.calculateTextSimilarity(title1, title2);
    
    // Calculate content similarity
    const contentSimilarity = this.calculateTextSimilarity(content1, content2);
    
    // Weighted average (title similarity is more important)
    return (titleSimilarity * 0.6) + (contentSimilarity * 0.4);
  }

  /**
   * Calculate text similarity using Jaccard similarity
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.split(/\s+/).filter(word => word.length > 2));
    const words2 = new Set(text2.split(/\s+/).filter(word => word.length > 2));
    
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  /**
   * Consolidate multiple scenes into one
   */
  private consolidateScenes(scenes: StoryboardScene[], indices: number[]): StoryboardScene {
    const scenesToConsolidate = indices.map(idx => scenes[idx]);
    const firstScene = scenesToConsolidate[0];
    
    // Combine titles
    const titles = scenesToConsolidate.map(s => s.pageTitle || s.title).filter(Boolean);
    const consolidatedTitle = titles.length > 1 ? 
      `${titles[0]} (Consolidated)` : 
      titles[0] || `Scene ${firstScene.sceneNumber}`;

    // Combine content
    const narrationScripts = scenesToConsolidate.map(s => s.narrationScript).filter(Boolean);
    const onScreenTexts = scenesToConsolidate.map(s => s.onScreenText).filter(Boolean);
    
    const consolidatedNarration = narrationScripts.join('\n\n');
    const consolidatedOnScreenText = onScreenTexts.join('\n\n');

    // Combine learning outcome references
    const allOutcomeRefs = scenesToConsolidate
      .flatMap(s => s.learningOutcomeRefs || [])
      .filter((ref, index, arr) => arr.indexOf(ref) === index); // Remove duplicates

    // Combine developer notes
    const developerNotes = scenesToConsolidate
      .map(s => s.developerNotes)
      .filter(Boolean)
      .join('\n\n');

    return {
      ...firstScene,
      pageTitle: consolidatedTitle,
      narrationScript: consolidatedNarration,
      onScreenText: consolidatedOnScreenText,
      learningOutcomeRefs: allOutcomeRefs,
      developerNotes: developerNotes
    };
  }

  /**
   * Remove duplicate learning outcome references within scenes
   */
  private removeDuplicateOutcomeReferences(
    storyboard: StoryboardModule,
    changes: string[]
  ): StoryboardModule {
    const scenes = storyboard.scenes.map(scene => {
      if (scene.learningOutcomeRefs && scene.learningOutcomeRefs.length > 0) {
        const originalLength = scene.learningOutcomeRefs.length;
        const uniqueRefs = [...new Set(scene.learningOutcomeRefs)];
        
        if (uniqueRefs.length < originalLength) {
          changes.push(`Removed ${originalLength - uniqueRefs.length} duplicate learning outcome references from scene ${scene.sceneNumber}`);
        }
        
        return {
          ...scene,
          learningOutcomeRefs: uniqueRefs
        };
      }
      return scene;
    });

    return { ...storyboard, scenes };
  }

  /**
   * Optimize content flow by removing redundant transitions and introductions
   */
  private optimizeContentFlow(
    storyboard: StoryboardModule,
    changes: string[]
  ): StoryboardModule {
    const scenes = storyboard.scenes.map((scene, index) => {
      let optimizedScene = { ...scene };
      
      // Remove redundant "welcome" or "introduction" text in middle scenes
      if (index > 2) { // Skip first few scenes
        const narration = scene.narrationScript || '';
        const onScreenText = scene.onScreenText || '';
        
        const redundantPhrases = [
          'welcome to this section',
          'let\'s begin',
          'in this section we will',
          'now we will learn',
          'let\'s start with'
        ];
        
        let hasRedundancy = false;
        redundantPhrases.forEach(phrase => {
          if (narration.toLowerCase().includes(phrase) || onScreenText.toLowerCase().includes(phrase)) {
            hasRedundancy = true;
          }
        });
        
        if (hasRedundancy) {
          changes.push(`Removed redundant introduction text from scene ${scene.sceneNumber}`);
          // Remove redundant phrases (simplified - in practice, you'd use more sophisticated text processing)
          optimizedScene.narrationScript = narration.replace(
            new RegExp(redundantPhrases.join('|'), 'gi'),
            ''
          ).trim();
        }
      }
      
      return optimizedScene;
    });

    return { ...storyboard, scenes };
  }

  /**
   * Ensure proper phase progression
   */
  private ensurePhaseProgression(
    storyboard: StoryboardModule,
    changes: string[],
    warnings: string[]
  ): StoryboardModule {
    const scenes = [...storyboard.scenes];
    const learnerScenes = scenes.filter(scene => !scene.internalPage);
    
    let lastPhase: PedagogyPhase | null = null;
    const phaseOrder: PedagogyPhase[] = ['learn', 'see', 'do', 'apply'];
    
    learnerScenes.forEach((scene, index) => {
      if (scene.phase) {
        const currentPhase = scene.phase as PedagogyPhase;
        
        if (lastPhase) {
          const lastPhaseIndex = phaseOrder.indexOf(lastPhase);
          const currentPhaseIndex = phaseOrder.indexOf(currentPhase);
          
          if (currentPhaseIndex < lastPhaseIndex) {
            warnings.push(`Scene ${scene.sceneNumber}: Phase regression from ${lastPhase} to ${currentPhase}`);
          }
        }
        
        lastPhase = currentPhase;
      }
    });

    return { ...storyboard, scenes };
  }

  /**
   * Renumber scenes after cleanup
   */
  private renumberScenes(storyboard: StoryboardModule): StoryboardModule {
    const scenes = storyboard.scenes.map((scene, index) => ({
      ...scene,
      sceneNumber: index + 1
    }));

    return { ...storyboard, scenes };
  }
}

// Export singleton instance
export const redundancyCleanupService = new RedundancyCleanupService();





