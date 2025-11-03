/**
 * Pedagogical Metrics Monitoring Service
 * 
 * Tracks and monitors pedagogical quality metrics to ensure
 * continuous improvement of learning experiences.
 */

import type { StoryboardModule, PedagogicalBlueprint, ContinuityReport } from '../../../packages/shared/src/types';

export interface PedagogicalMetrics {
  repetitionScore: number;
  alignmentScore: number;
  terminologyAdherence: number;
  progressiveComplexity: number;
  overallQuality: number;
  timestamp: string;
}

export class PedagogicalMetricsService {
  
  /**
   * Calculate comprehensive pedagogical metrics
   */
  calculateMetrics(
    storyboard: StoryboardModule,
    pedagogicalBlueprint: PedagogicalBlueprint,
    continuityReport: ContinuityReport
  ): PedagogicalMetrics {
    
    const scenes = storyboard.scenes || [];
    
    const repetitionScore = this.calculateRepetitionScore(scenes);
    const alignmentScore = this.calculateAlignmentScore(scenes, pedagogicalBlueprint);
    const terminologyAdherence = this.calculateTerminologyAdherence(scenes, pedagogicalBlueprint);
    const progressiveComplexity = this.calculateProgressiveComplexity(scenes);
    
    const overallQuality = this.calculateOverallQuality(
      repetitionScore,
      alignmentScore,
      terminologyAdherence,
      progressiveComplexity,
      continuityReport
    );

    return {
      repetitionScore,
      alignmentScore,
      terminologyAdherence,
      progressiveComplexity,
      overallQuality,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Calculate repetition score (0-1, higher is better)
   */
  private calculateRepetitionScore(scenes: any[]): number {
    if (scenes.length === 0) return 0;
    
    const interactivityTypes = scenes
      .map(s => s.interactionType)
      .filter(Boolean);
    
    if (interactivityTypes.length === 0) return 1;
    
    const uniqueTypes = new Set(interactivityTypes);
    const repetitionRatio = uniqueTypes.size / interactivityTypes.length;
    
    // Check for consecutive repetition
    let consecutiveRepetition = 0;
    for (let i = 1; i < interactivityTypes.length; i++) {
      if (interactivityTypes[i] === interactivityTypes[i - 1]) {
        consecutiveRepetition++;
      }
    }
    
    const consecutivePenalty = Math.min(consecutiveRepetition * 0.1, 0.5);
    return Math.max(0, repetitionRatio - consecutivePenalty);
  }

  /**
   * Calculate alignment score between teaching and practice
   */
  private calculateAlignmentScore(scenes: any[], blueprint: PedagogicalBlueprint): number {
    if (scenes.length === 0) return 0;
    
    const teachingScenes = scenes.filter(s => 
      s.phase === 'LEARN' || s.phase === 'SEE' || s.instructionalPurpose === 'Teach'
    );
    const practiceScenes = scenes.filter(s => 
      s.phase === 'DO' || s.phase === 'APPLY' || s.instructionalPurpose === 'Practice'
    );
    
    // Check if we have both teaching and practice
    if (teachingScenes.length === 0 || practiceScenes.length === 0) {
      return 0.3; // Partial credit for having some content
    }
    
    // Check alignment with blueprint objectives
    const objectiveAlignment = this.checkObjectiveAlignment(scenes, blueprint);
    
    // Check teaching→practice flow
    const flowAlignment = this.checkTeachingPracticeFlow(scenes);
    
    return (objectiveAlignment + flowAlignment) / 2;
  }

  /**
   * Calculate terminology adherence score
   */
  private calculateTerminologyAdherence(scenes: any[], blueprint: PedagogicalBlueprint): number {
    const clientTerms = Object.keys(blueprint.clientTerminology);
    if (clientTerms.length === 0) return 1; // No terms to check
    
    let totalTermUsage = 0;
    const sceneTexts = scenes.map(s => 
      `${s.onScreenText || ''} ${s.voiceoverScript || ''} ${s.narrationScript || ''}`
    ).join(' ').toLowerCase();
    
    clientTerms.forEach(term => {
      if (sceneTexts.includes(term.toLowerCase())) {
        totalTermUsage++;
      }
    });
    
    return totalTermUsage / clientTerms.length;
  }

  /**
   * Calculate progressive complexity score
   */
  private calculateProgressiveComplexity(scenes: any[]): number {
    if (scenes.length < 3) return 0.5; // Not enough scenes to assess
    
    // Analyze complexity progression through scenes
    const complexityIndicators = scenes.map((scene, index) => {
      const text = `${scene.onScreenText || ''} ${scene.voiceoverScript || ''}`;
      const wordCount = text.split(' ').length;
      const hasInteraction = scene.interactionType && scene.interactionType !== 'None';
      const hasAssessment = scene.knowledgeCheck || scene.knowledgeChecks;
      
      return {
        index,
        wordCount,
        hasInteraction,
        hasAssessment,
        complexity: wordCount * 0.3 + (hasInteraction ? 1 : 0) * 0.4 + (hasAssessment ? 1 : 0) * 0.3
      };
    });
    
    // Check if complexity generally increases
    let increasingCount = 0;
    for (let i = 1; i < complexityIndicators.length; i++) {
      if (complexityIndicators[i].complexity > complexityIndicators[i - 1].complexity) {
        increasingCount++;
      }
    }
    
    return increasingCount / (complexityIndicators.length - 1);
  }

  /**
   * Calculate overall quality score
   */
  private calculateOverallQuality(
    repetitionScore: number,
    alignmentScore: number,
    terminologyAdherence: number,
    progressiveComplexity: number,
    continuityReport: ContinuityReport
  ): number {
    const baseScore = (
      repetitionScore * 0.25 +
      alignmentScore * 0.30 +
      terminologyAdherence * 0.20 +
      progressiveComplexity * 0.25
    );
    
    // Apply continuity penalty
    const continuityPenalty = continuityReport.issues
      .filter(issue => issue.severity === 'high')
      .length * 0.1;
    
    const mediumPenalty = continuityReport.issues
      .filter(issue => issue.severity === 'medium')
      .length * 0.05;
    
    return Math.max(0, Math.min(1, baseScore - continuityPenalty - mediumPenalty));
  }

  /**
   * Check alignment with blueprint objectives
   */
  private checkObjectiveAlignment(scenes: any[], blueprint: PedagogicalBlueprint): number {
    const objectives = blueprint.learningObjectiveFlow.map(lo => lo.objective);
    let alignedObjectives = 0;
    
    objectives.forEach(objective => {
      const objectiveKeywords = objective.toLowerCase().split(' ');
      const hasAlignment = scenes.some(scene => {
        const sceneText = `${scene.onScreenText || ''} ${scene.voiceoverScript || ''}`.toLowerCase();
        return objectiveKeywords.some(keyword => sceneText.includes(keyword));
      });
      
      if (hasAlignment) alignedObjectives++;
    });
    
    return objectives.length > 0 ? alignedObjectives / objectives.length : 1;
  }

  /**
   * Check teaching→practice flow
   */
  private checkTeachingPracticeFlow(scenes: any[]): number {
    let teachingIndex = -1;
    let practiceIndex = -1;
    
    scenes.forEach((scene, index) => {
      if (scene.phase === 'LEARN' || scene.phase === 'SEE') {
        teachingIndex = index;
      }
      if (scene.phase === 'DO' || scene.phase === 'APPLY') {
        if (practiceIndex === -1) practiceIndex = index;
      }
    });
    
    // Teaching should come before practice
    if (teachingIndex === -1 || practiceIndex === -1) return 0.5;
    return teachingIndex < practiceIndex ? 1.0 : 0.3;
  }

  /**
   * Generate metrics report for debugging
   */
  generateMetricsReport(metrics: PedagogicalMetrics, continuityReport: ContinuityReport): string {
    return `
📊 PEDAGOGICAL METRICS REPORT
============================

OVERALL QUALITY: ${(metrics.overallQuality * 100).toFixed(1)}%

DETAILED SCORES:
- Repetition Score: ${(metrics.repetitionScore * 100).toFixed(1)}% (higher = less repetitive)
- Alignment Score: ${(metrics.alignmentScore * 100).toFixed(1)}% (teaching→practice alignment)
- Terminology Adherence: ${(metrics.terminologyAdherence * 100).toFixed(1)}% (client terms used)
- Progressive Complexity: ${(metrics.progressiveComplexity * 100).toFixed(1)}% (complexity builds)

CONTINUITY ISSUES: ${continuityReport.issues.length}
${continuityReport.issues.map(issue => 
  `- ${issue.type.toUpperCase()}: ${issue.description} (${issue.severity})`
).join('\n')}

RECOMMENDATIONS:
${this.generateRecommendations(metrics, continuityReport)}
`;
  }

  /**
   * Generate improvement recommendations
   */
  private generateRecommendations(metrics: PedagogicalMetrics, continuityReport: ContinuityReport): string {
    const recommendations: string[] = [];
    
    if (metrics.repetitionScore < 0.7) {
      recommendations.push('• Vary interactivity types to reduce repetition');
    }
    
    if (metrics.alignmentScore < 0.7) {
      recommendations.push('• Ensure teaching content aligns with practice activities');
    }
    
    if (metrics.terminologyAdherence < 0.8) {
      recommendations.push('• Use more client-specific terminology');
    }
    
    if (metrics.progressiveComplexity < 0.6) {
      recommendations.push('• Build complexity more gradually through scenes');
    }
    
    if (continuityReport.issues.some(issue => issue.severity === 'high')) {
      recommendations.push('• Address high-severity continuity issues');
    }
    
    return recommendations.length > 0 ? recommendations.join('\n') : '• No specific recommendations - quality looks good!';
  }
}
