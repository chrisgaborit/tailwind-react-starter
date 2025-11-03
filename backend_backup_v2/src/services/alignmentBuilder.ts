/**
 * Alignment Map Builder Service
 * 
 * Creates and maintains alignment maps between learning outcomes and scenes
 * across the Learn-See-Do-Apply framework. This service ensures:
 * 1. Every learning outcome appears in all four phases (learn/see/do/apply)
 * 2. Coverage gaps are identified and filled with minimal support
 * 3. Evidence is provided for how each scene serves the learning outcome
 */

import { v4 as uuidv4 } from 'uuid';
import { StoryboardModule, StoryboardScene, AlignmentLink, LearningOutcome, PedagogyPhase } from '../../types';

export interface AlignmentAnalysis {
  coverage: Record<string, Record<PedagogyPhase, boolean>>; // outcomeId -> phase -> covered
  gaps: Array<{
    outcomeId: string;
    missingPhases: PedagogyPhase[];
  }>;
  recommendations: string[];
}

export interface AlignmentBuildResult {
  success: boolean;
  alignmentMap: AlignmentLink[];
  analysis: AlignmentAnalysis;
  changes: string[];
}

export class AlignmentBuilder {
  private readonly REQUIRED_PHASES: PedagogyPhase[] = ['LEARN', 'SEE', 'DO', 'APPLY'];

  /**
   * Main entry point: builds comprehensive alignment map
   */
  public buildAlignmentMap(storyboard: StoryboardModule): AlignmentBuildResult {
    const changes: string[] = [];
    
    try {
      // Step 1: Analyze current alignment coverage
      const analysis = this.analyzeAlignmentCoverage(storyboard);
      
      // Step 2: Build initial alignment map from existing scene references
      let alignmentMap = this.buildInitialAlignmentMap(storyboard);
      
      // Step 3: Fill coverage gaps
      alignmentMap = this.fillCoverageGaps(storyboard, alignmentMap, analysis, changes);
      
      // Step 4: Enhance evidence descriptions
      alignmentMap = this.enhanceEvidenceDescriptions(storyboard, alignmentMap, changes);
      
      return {
        success: true,
        alignmentMap,
        analysis,
        changes
      };
      
    } catch (error) {
      return {
        success: false,
        alignmentMap: [],
        analysis: { coverage: {}, gaps: [], recommendations: [] },
        changes: [...changes, `Alignment building failed: ${error.message}`]
      };
    }
  }

  /**
   * Analyze current alignment coverage across all learning outcomes and phases
   */
  private analyzeAlignmentCoverage(storyboard: StoryboardModule): AlignmentAnalysis {
    const coverage: Record<string, Record<PedagogyPhase, boolean>> = {};
    const gaps: Array<{ outcomeId: string; missingPhases: PedagogyPhase[] }> = [];
    const recommendations: string[] = [];

    // Initialize coverage tracking for each learning outcome
    if (storyboard.learningOutcomes) {
      storyboard.learningOutcomes.forEach(outcome => {
        coverage[outcome.id] = {
          LEARN: false,
          SEE: false,
          DO: false,
          APPLY: false
        };
      });
    }

    // Check existing alignment map
    if (storyboard.alignmentMap) {
      storyboard.alignmentMap.forEach(link => {
        if (coverage[link.outcomeId] && this.REQUIRED_PHASES.includes(link.phase)) {
          coverage[link.outcomeId][link.phase] = true;
        }
      });
    }

    // Check scene-level learning outcome references
    storyboard.scenes.forEach(scene => {
      if (scene.learningOutcomeRefs && scene.phase && this.REQUIRED_PHASES.includes(scene.phase as PedagogyPhase)) {
        scene.learningOutcomeRefs.forEach(outcomeId => {
          if (coverage[outcomeId]) {
            coverage[outcomeId][scene.phase as PedagogyPhase] = true;
          }
        });
      }
    });

    // Identify gaps
    Object.entries(coverage).forEach(([outcomeId, phaseCoverage]) => {
      const missingPhases = this.REQUIRED_PHASES.filter(phase => !phaseCoverage[phase]);
      if (missingPhases.length > 0) {
        gaps.push({ outcomeId, missingPhases });
      }
    });

    // Generate recommendations
    if (gaps.length > 0) {
      recommendations.push(`${gaps.length} learning outcomes have incomplete phase coverage`);
    }

    const totalOutcomes = Object.keys(coverage).length;
    const fullyCoveredOutcomes = totalOutcomes - gaps.length;
    if (totalOutcomes > 0) {
      recommendations.push(`${fullyCoveredOutcomes}/${totalOutcomes} learning outcomes have complete phase coverage`);
    }

    return { coverage, gaps, recommendations };
  }

  /**
   * Build initial alignment map from existing scene references
   */
  private buildInitialAlignmentMap(storyboard: StoryboardModule): AlignmentLink[] {
    const alignmentMap: AlignmentLink[] = [];

    // Add existing alignment links
    if (storyboard.alignmentMap) {
      alignmentMap.push(...storyboard.alignmentMap);
    }

    // Add alignment links from scene-level references
    storyboard.scenes.forEach(scene => {
      if (scene.learningOutcomeRefs && scene.phase && scene.scene_id) {
        scene.learningOutcomeRefs.forEach(outcomeId => {
          // Check if this alignment already exists
          const exists = alignmentMap.some(link => 
            link.outcomeId === outcomeId && 
            link.sceneId === scene.scene_id && 
            link.phase === scene.phase
          );

          if (!exists && this.REQUIRED_PHASES.includes(scene.phase as PedagogyPhase)) {
            alignmentMap.push({
              outcomeId,
              sceneId: scene.scene_id,
              phase: scene.phase as PedagogyPhase,
              evidence: this.generateEvidenceDescription(scene, outcomeId)
            });
          }
        });
      }
    });

    return alignmentMap;
  }

  /**
   * Fill coverage gaps by creating minimal support scenes or enhancing existing ones
   */
  private fillCoverageGaps(
    storyboard: StoryboardModule,
    alignmentMap: AlignmentLink[],
    analysis: AlignmentAnalysis,
    changes: string[]
  ): AlignmentLink[] {
    const enhancedAlignmentMap = [...alignmentMap];

    analysis.gaps.forEach(gap => {
      const outcome = storyboard.learningOutcomes?.find(lo => lo.id === gap.outcomeId);
      if (!outcome) return;

      gap.missingPhases.forEach(phase => {
        // Try to find an existing scene in this phase that could support this outcome
        const existingScene = this.findSceneForPhase(storyboard, phase);
        
        if (existingScene) {
          // Add this outcome to the existing scene
          if (!existingScene.learningOutcomeRefs) {
            existingScene.learningOutcomeRefs = [];
          }
          if (!existingScene.learningOutcomeRefs.includes(outcome.id)) {
            existingScene.learningOutcomeRefs.push(outcome.id);
          }

          // Add alignment link
          enhancedAlignmentMap.push({
            outcomeId: outcome.id,
            sceneId: existingScene.scene_id || `scene-${existingScene.sceneNumber}`,
            phase,
            evidence: this.generateEvidenceDescription(existingScene, outcome.id)
          });

          changes.push(`Added ${outcome.verb} outcome to existing ${phase} scene: ${existingScene.pageTitle}`);
        } else {
          // Create a minimal support scene for this phase and outcome
          const minimalScene = this.createMinimalSupportScene(phase, outcome);
          storyboard.scenes.push(minimalScene);

          // Add alignment link
          enhancedAlignmentMap.push({
            outcomeId: outcome.id,
            sceneId: minimalScene.scene_id!,
            phase,
            evidence: this.generateEvidenceDescription(minimalScene, outcome.id)
          });

          changes.push(`Created minimal ${phase} scene to support ${outcome.verb} outcome`);
        }
      });
    });

    return enhancedAlignmentMap;
  }

  /**
   * Find an existing scene in the specified phase
   */
  private findSceneForPhase(storyboard: StoryboardModule, phase: PedagogyPhase): StoryboardScene | null {
    return storyboard.scenes.find(scene => 
      scene.phase === phase && !scene.internalPage
    ) || null;
  }

  /**
   * Create a minimal support scene for a specific phase and outcome
   */
  private createMinimalSupportScene(phase: PedagogyPhase, outcome: LearningOutcome): StoryboardScene {
    const phaseTitles = {
      LEARN: `Learning: ${outcome.verb} ${outcome.text.split(' ').slice(1, 4).join(' ')}`,
      SEE: `Example: ${outcome.verb} ${outcome.text.split(' ').slice(1, 4).join(' ')}`,
      DO: `Practice: ${outcome.verb} ${outcome.text.split(' ').slice(1, 4).join(' ')}`,
      APPLY: `Apply: ${outcome.verb} ${outcome.text.split(' ').slice(1, 4).join(' ')}`
    };

    const phaseDescriptions = {
      LEARN: `Understanding how to ${outcome.verb} ${outcome.text.toLowerCase()}`,
      SEE: `Observing examples of ${outcome.verb} ${outcome.text.toLowerCase()}`,
      DO: `Practicing ${outcome.verb} ${outcome.text.toLowerCase()}`,
      APPLY: `Applying ${outcome.verb} ${outcome.text.toLowerCase()} in complex scenarios`
    };

    return {
      sceneNumber: 0, // Will be renumbered later
      pageTitle: phaseTitles[phase],
      scene_id: uuidv4(),
      phase,
      learningOutcomeRefs: [outcome.id],
      screenLayout: {
        description: `${phase} phase layout for ${outcome.verb} outcome`,
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
          sceneDescription: `${phase} phase scene supporting ${outcome.verb} outcome`,
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
   * Enhance evidence descriptions for alignment links
   */
  private enhanceEvidenceDescriptions(
    storyboard: StoryboardModule,
    alignmentMap: AlignmentLink[],
    changes: string[]
  ): AlignmentLink[] {
    return alignmentMap.map(link => {
      const scene = storyboard.scenes.find(s => s.scene_id === link.sceneId);
      const outcome = storyboard.learningOutcomes?.find(lo => lo.id === link.outcomeId);
      
      if (scene && outcome && !link.evidence) {
        link.evidence = this.generateEvidenceDescription(scene, outcome.id);
        changes.push(`Enhanced evidence for ${outcome.verb} outcome in ${scene.pageTitle}`);
      }
      
      return link;
    });
  }

  /**
   * Generate evidence description for how a scene serves a learning outcome
   */
  private generateEvidenceDescription(scene: StoryboardScene, outcomeId: string): string {
    const phase = scene.phase;
    const sceneTitle = scene.pageTitle;
    
    const evidenceTemplates = {
      LEARN: `This scene teaches the concepts needed to ${outcomeId} through ${sceneTitle}`,
      SEE: `This scene demonstrates ${outcomeId} in action through ${sceneTitle}`,
      DO: `This scene provides practice opportunities for ${outcomeId} through ${sceneTitle}`,
      APPLY: `This scene challenges learners to apply ${outcomeId} in complex scenarios through ${sceneTitle}`
    };

    return evidenceTemplates[phase as PedagogyPhase] || `This scene supports ${outcomeId} through ${sceneTitle}`;
  }

  /**
   * Validate alignment map completeness
   */
  public validateAlignmentMap(storyboard: StoryboardModule): {
    isValid: boolean;
    issues: string[];
    coverage: Record<string, Record<PedagogyPhase, boolean>>;
  } {
    const issues: string[] = [];
    const analysis = this.analyzeAlignmentCoverage(storyboard);

    // Check if all learning outcomes have complete phase coverage
    analysis.gaps.forEach(gap => {
      const outcome = storyboard.learningOutcomes?.find(lo => lo.id === gap.outcomeId);
      if (outcome) {
        issues.push(`Learning outcome "${outcome.verb} ${outcome.text}" missing coverage in phases: ${gap.missingPhases.join(', ')}`);
      }
    });

    // Check if alignment map exists and has entries
    if (!storyboard.alignmentMap || storyboard.alignmentMap.length === 0) {
      issues.push('No alignment map found');
    }

    return {
      isValid: issues.length === 0,
      issues,
      coverage: analysis.coverage
    };
  }
}

// Export singleton instance
export const alignmentBuilder = new AlignmentBuilder();

