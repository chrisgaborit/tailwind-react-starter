/**
 * Outcome-Driven Quality Validator
 * 
 * Extends the existing quality validation with Learn-See-Do-Apply framework checks:
 * - Outcome Count: 3–5 Bloom-based outcomes present
 * - Alignment Coverage: Each LO appears in all four phases (learn/see/do/apply)
 * - Sequence Validity: No APPLY scenes before DO; no quizzes inside LEARN/SEE
 * - Business Relevance Early: Scenes 3–4 reference businessImpact
 * - No Redundant Framework Repeats: detect and remove repeated framework re-teach screens
 * - Feedback Quality: practice scenes must include explanatory feedback
 */

import { StoryboardModule, StoryboardScene, PedagogyPhase, LearningOutcome } from '../../types';
import { alignmentBuilder } from './alignmentBuilder';

export interface OutcomeDrivenQualityIssue {
  code: string;
  severity: "error" | "warning" | "info";
  message: string;
  scene?: number;
  field?: string;
  suggestion?: string;
  outcomeId?: string;
  phase?: PedagogyPhase;
}

export interface OutcomeDrivenQualityReport {
  overallScore: number; // 0-100
  issues: OutcomeDrivenQualityIssue[];
  frameworkCompliance: {
    outcomeCount: number;
    alignmentCoverage: number;
    sequenceValidity: number;
    businessRelevance: number;
    redundancyElimination: number;
    feedbackQuality: number;
  };
  recommendations: string[];
  alignmentAnalysis?: {
    coverage: Record<string, Record<PedagogyPhase, boolean>>;
    gaps: Array<{ outcomeId: string; missingPhases: PedagogyPhase[] }>;
  };
}

export class OutcomeDrivenQualityValidator {
  private readonly REQUIRED_PHASES: PedagogyPhase[] = ['LEARN', 'SEE', 'DO', 'APPLY'];
  private readonly LEADERSHIP_CATEGORIES = ['Leadership', 'Soft Skills'];

  /**
   * Main entry point: validates storyboard against Learn-See-Do-Apply framework
   */
  public validateOutcomeDrivenQuality(storyboard: StoryboardModule): OutcomeDrivenQualityReport {
    const issues: OutcomeDrivenQualityIssue[] = [];
    const frameworkCompliance = {
      outcomeCount: 0,
      alignmentCoverage: 0,
      sequenceValidity: 0,
      businessRelevance: 0,
      redundancyElimination: 0,
      feedbackQuality: 0
    };

    try {
      // Check if this is a Leadership/Soft Skills module
      const category = this.getModuleCategory(storyboard);
      const isLeadershipModule = this.LEADERSHIP_CATEGORIES.includes(category);

      if (isLeadershipModule) {
        // 1. Outcome Count Check
        frameworkCompliance.outcomeCount = this.checkOutcomeCount(storyboard, issues);

        // 2. Alignment Coverage Check
        frameworkCompliance.alignmentCoverage = this.checkAlignmentCoverage(storyboard, issues);

        // 3. Sequence Validity Check
        frameworkCompliance.sequenceValidity = this.checkSequenceValidity(storyboard, issues);

        // 4. Business Relevance Check
        frameworkCompliance.businessRelevance = this.checkBusinessRelevance(storyboard, issues);

        // 5. Redundancy Elimination Check
        frameworkCompliance.redundancyElimination = this.checkRedundancyElimination(storyboard, issues);

        // 6. Feedback Quality Check
        frameworkCompliance.feedbackQuality = this.checkFeedbackQuality(storyboard, issues);
      } else {
        // For non-leadership modules, mark all as passing
        Object.keys(frameworkCompliance).forEach(key => {
          frameworkCompliance[key as keyof typeof frameworkCompliance] = 100;
        });
        issues.push({
          code: "NON_LEADERSHIP_MODULE",
          severity: "info",
          message: "Module category does not require Learn-See-Do-Apply framework validation",
          suggestion: "Framework validation skipped for non-leadership modules"
        });
      }

      // Calculate overall score
      const overallScore = this.calculateOverallScore(frameworkCompliance, issues);

      // Generate recommendations
      const recommendations = this.generateRecommendations(frameworkCompliance, issues, isLeadershipModule);

      // Get alignment analysis
      const alignmentAnalysis = isLeadershipModule ? this.getAlignmentAnalysis(storyboard) : undefined;

      return {
        overallScore,
        issues,
        frameworkCompliance,
        recommendations,
        alignmentAnalysis
      };

    } catch (error) {
      return {
        overallScore: 0,
        issues: [...issues, {
          code: "VALIDATION_ERROR",
          severity: "error",
          message: `Quality validation failed: ${error.message}`
        }],
        frameworkCompliance,
        recommendations: ["Fix validation errors before proceeding"]
      };
    }
  }

  /**
   * Check if learning outcomes are present and properly formatted (3-5 Bloom-based outcomes)
   */
  private checkOutcomeCount(storyboard: StoryboardModule, issues: OutcomeDrivenQualityIssue[]): number {
    const outcomes = storyboard.learningOutcomes || [];
    
    if (outcomes.length === 0) {
      issues.push({
        code: "NO_LEARNING_OUTCOMES",
        severity: "error",
        message: "No learning outcomes defined",
        suggestion: "Define 3-5 measurable learning outcomes using Bloom's taxonomy verbs"
      });
      return 0;
    }

    if (outcomes.length < 3) {
      issues.push({
        code: "INSUFFICIENT_OUTCOMES",
        severity: "error",
        message: `Only ${outcomes.length} learning outcomes defined (minimum 3 required)`,
        suggestion: "Add more learning outcomes to reach the minimum of 3"
      });
      return 50;
    }

    if (outcomes.length > 5) {
      issues.push({
        code: "TOO_MANY_OUTCOMES",
        severity: "warning",
        message: `${outcomes.length} learning outcomes defined (recommended maximum 5)`,
        suggestion: "Consider consolidating or removing some learning outcomes"
      });
      return 80;
    }

    // Check Bloom's taxonomy usage
    const bloomVerbs = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'];
    const validOutcomes = outcomes.filter(outcome => 
      outcome.verb && bloomVerbs.includes(outcome.verb)
    );

    if (validOutcomes.length < outcomes.length) {
      issues.push({
        code: "NON_BLOOM_OUTCOMES",
        severity: "warning",
        message: `${outcomes.length - validOutcomes.length} learning outcomes don't use Bloom's taxonomy verbs`,
        suggestion: "Use Bloom's taxonomy verbs (remember, understand, apply, analyze, evaluate, create)"
      });
      return 70;
    }

    return 100;
  }

  /**
   * Check alignment coverage - each LO should appear in all four phases
   */
  private checkAlignmentCoverage(storyboard: StoryboardModule, issues: OutcomeDrivenQualityIssue[]): number {
    const validation = alignmentBuilder.validateAlignmentMap(storyboard);
    
    if (!validation.isValid) {
      validation.issues.forEach(issue => {
        issues.push({
          code: "ALIGNMENT_COVERAGE_GAP",
          severity: "error",
          message: issue,
          suggestion: "Ensure each learning outcome appears in all four phases (learn, see, do, apply)"
        });
      });
      return 0;
    }

    // Check coverage completeness
    const outcomes = storyboard.learningOutcomes || [];
    const totalRequiredLinks = outcomes.length * 4; // 4 phases per outcome
    const actualLinks = storyboard.alignmentMap?.length || 0;
    
    if (actualLinks < totalRequiredLinks) {
      const coveragePercentage = Math.round((actualLinks / totalRequiredLinks) * 100);
      issues.push({
        code: "INCOMPLETE_ALIGNMENT",
        severity: "warning",
        message: `Alignment coverage is ${coveragePercentage}% (${actualLinks}/${totalRequiredLinks} required links)`,
        suggestion: "Complete the alignment map to ensure all learning outcomes are covered in all phases"
      });
      return coveragePercentage;
    }

    return 100;
  }

  /**
   * Check sequence validity - no APPLY before DO, no quizzes in LEARN/SEE
   */
  private checkSequenceValidity(storyboard: StoryboardModule, issues: OutcomeDrivenQualityIssue[]): number {
    const scenes = storyboard.scenes.filter(scene => !scene.internalPage);
    let score = 100;
    let foundDo = false;
    let foundApply = false;

    for (const scene of scenes) {
      if (scene.phase === 'DO') {
        foundDo = true;
      } else if (scene.phase === 'APPLY') {
        if (!foundDo) {
          issues.push({
            code: "APPLY_BEFORE_DO",
            severity: "error",
            message: `Scene ${scene.sceneNumber}: APPLY phase appears before DO phase`,
            scene: scene.sceneNumber,
            suggestion: "Ensure DO phase comes before APPLY phase"
          });
          score = 0;
        }
        foundApply = true;
      }

      // Check for premature assessments
      if ((scene.phase === 'LEARN' || scene.phase === 'SEE') && 
          (scene.knowledgeCheck || scene.knowledgeChecks)) {
        issues.push({
          code: "PREMATURE_ASSESSMENT",
          severity: "warning",
          message: `Scene ${scene.sceneNumber}: Assessment found in ${scene.phase} phase`,
          scene: scene.sceneNumber,
          suggestion: "Move assessments to DO or APPLY phases only"
        });
        score -= 20;
      }
    }

    return Math.max(0, score);
  }

  /**
   * Check business relevance - Scenes 3-4 should reference business impact
   */
  private checkBusinessRelevance(storyboard: StoryboardModule, issues: OutcomeDrivenQualityIssue[]): number {
    const businessImpact = storyboard.project_metadata?.businessImpact || 
                          storyboard.metadata?.businessImpact?.successDefinition;
    
    if (!businessImpact) {
      issues.push({
        code: "NO_BUSINESS_IMPACT",
        severity: "error",
        message: "No business impact defined",
        suggestion: "Define business impact in project metadata"
      });
      return 0;
    }

    const learnerScenes = storyboard.scenes.filter(scene => !scene.internalPage);
    const earlyScenes = learnerScenes.slice(0, 2); // Scenes 3-4 overall (after internal pages)
    
    let businessRelevanceFound = false;
    const businessKeywords = this.extractBusinessKeywords(businessImpact);

    earlyScenes.forEach((scene, index) => {
      const sceneContent = `${scene.narrationScript || ''} ${scene.onScreenText || ''}`.toLowerCase();
      const hasBusinessRelevance = businessKeywords.some(keyword => 
        sceneContent.includes(keyword.toLowerCase())
      );

      if (hasBusinessRelevance) {
        businessRelevanceFound = true;
      } else if (index === 0) {
        issues.push({
          code: "EARLY_BUSINESS_RELEVANCE",
          severity: "warning",
          message: `Scene ${scene.sceneNumber}: First learner scene doesn't reference business impact`,
          scene: scene.sceneNumber,
          suggestion: "Reference business impact in the first learner scene"
        });
      }
    });

    return businessRelevanceFound ? 100 : 50;
  }

  /**
   * Check for redundant framework re-listing
   */
  private checkRedundancyElimination(storyboard: StoryboardModule, issues: OutcomeDrivenQualityIssue[]): number {
    const scenes = storyboard.scenes.filter(scene => !scene.internalPage);
    const frameworkTitles: string[] = [];
    const redundantScenes: number[] = [];

    scenes.forEach(scene => {
      const title = scene.pageTitle.toLowerCase();
      
      // Check for framework re-teaching patterns
      const frameworkPatterns = [
        /framework.*part\s*\d+/i,
        /key\s+processes.*part\s*\d+/i,
        /stages.*part\s*\d+/i,
        /steps.*part\s*\d+/i,
        /model.*part\s*\d+/i
      ];

      const isFrameworkRepeat = frameworkPatterns.some(pattern => pattern.test(title));
      
      if (isFrameworkRepeat) {
        // Check if we've seen similar titles
        const baseTitle = title.replace(/\s+part\s*\d+.*$/i, '');
        if (frameworkTitles.includes(baseTitle)) {
          redundantScenes.push(scene.sceneNumber);
        } else {
          frameworkTitles.push(baseTitle);
        }
      }
    });

    if (redundantScenes.length > 0) {
      issues.push({
        code: "REDUNDANT_FRAMEWORK_REPEATS",
        severity: "warning",
        message: `Found ${redundantScenes.length} redundant framework re-teaching scenes`,
        suggestion: "Remove redundant framework re-listing and focus on application"
      });
      return Math.max(0, 100 - (redundantScenes.length * 25));
    }

    return 100;
  }

  /**
   * Check feedback quality in practice scenes
   */
  private checkFeedbackQuality(storyboard: StoryboardModule, issues: OutcomeDrivenQualityIssue[]): number {
    const practiceScenes = storyboard.scenes.filter(scene => 
      (scene.phase === 'DO' || scene.phase === 'APPLY') && 
      scene.interactionType !== 'None'
    );

    if (practiceScenes.length === 0) {
      issues.push({
        code: "NO_PRACTICE_SCENES",
        severity: "warning",
        message: "No practice scenes found in DO/APPLY phases",
        suggestion: "Add interactive practice scenes in DO and APPLY phases"
      });
      return 50;
    }

    let totalScore = 0;
    practiceScenes.forEach(scene => {
      const hasDetailedFeedback = this.checkSceneFeedbackQuality(scene);
      totalScore += hasDetailedFeedback ? 100 : 50;
      
      if (!hasDetailedFeedback) {
        issues.push({
          code: "WEAK_FEEDBACK",
          severity: "warning",
          message: `Scene ${scene.sceneNumber}: Practice scene lacks detailed explanatory feedback`,
          scene: scene.sceneNumber,
          suggestion: "Provide 'why' explanations, not just correct/incorrect feedback"
        });
      }
    });

    return Math.round(totalScore / practiceScenes.length);
  }

  /**
   * Check if a scene has detailed explanatory feedback
   */
  private checkSceneFeedbackQuality(scene: StoryboardScene): boolean {
    // Check knowledge check feedback
    if (scene.knowledgeCheck?.options) {
      const hasExplanatoryFeedback = scene.knowledgeCheck.options.some((option: any) => {
        const feedback = option.feedback || option.is_correct;
        return feedback && String(feedback).length > 20 && 
               (String(feedback).includes('because') || String(feedback).includes('why'));
      });
      if (hasExplanatoryFeedback) return true;
    }

    // Check interaction details feedback
    if (scene.interactionDetails?.aiDecisionLogic) {
      const hasExplanatoryFeedback = scene.interactionDetails.aiDecisionLogic.some(rule => {
        const feedback = rule.feedback?.text;
        return feedback && feedback.length > 20 && 
               (feedback.includes('because') || feedback.includes('why'));
      });
      if (hasExplanatoryFeedback) return true;
    }

    return false;
  }

  /**
   * Get module category
   */
  private getModuleCategory(storyboard: StoryboardModule): string {
    return storyboard.project_metadata?.category || 
           storyboard.metadata?.strategicCategory || 
           'Unknown';
  }

  /**
   * Extract business keywords from business impact text
   */
  private extractBusinessKeywords(businessImpact: string): string[] {
    return businessImpact
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['this', 'that', 'with', 'from', 'they', 'have', 'been', 'were', 'said'].includes(word));
  }

  /**
   * Calculate overall score from framework compliance metrics
   */
  private calculateOverallScore(frameworkCompliance: any, issues: OutcomeDrivenQualityIssue[]): number {
    const weights = {
      outcomeCount: 0.2,
      alignmentCoverage: 0.25,
      sequenceValidity: 0.2,
      businessRelevance: 0.15,
      redundancyElimination: 0.1,
      feedbackQuality: 0.1
    };

    let weightedScore = 0;
    Object.entries(weights).forEach(([metric, weight]) => {
      weightedScore += (frameworkCompliance[metric] || 0) * weight;
    });

    // Apply penalty for errors
    const errorCount = issues.filter(issue => issue.severity === 'error').length;
    const warningCount = issues.filter(issue => issue.severity === 'warning').length;
    
    const penalty = (errorCount * 10) + (warningCount * 5);
    
    return Math.max(0, Math.round(weightedScore - penalty));
  }

  /**
   * Generate recommendations based on validation results
   */
  private generateRecommendations(
    frameworkCompliance: any, 
    issues: OutcomeDrivenQualityIssue[], 
    isLeadershipModule: boolean
  ): string[] {
    const recommendations: string[] = [];

    if (!isLeadershipModule) {
      return recommendations;
    }

    if (frameworkCompliance.outcomeCount < 100) {
      recommendations.push("Define 3-5 measurable learning outcomes using Bloom's taxonomy verbs");
    }

    if (frameworkCompliance.alignmentCoverage < 100) {
      recommendations.push("Ensure each learning outcome appears in all four phases (learn, see, do, apply)");
    }

    if (frameworkCompliance.sequenceValidity < 100) {
      recommendations.push("Fix phase sequence: ensure DO comes before APPLY, move assessments out of LEARN/SEE phases");
    }

    if (frameworkCompliance.businessRelevance < 100) {
      recommendations.push("Reference business impact in the first two learner scenes");
    }

    if (frameworkCompliance.redundancyElimination < 100) {
      recommendations.push("Remove redundant framework re-listing and focus on application");
    }

    if (frameworkCompliance.feedbackQuality < 100) {
      recommendations.push("Enhance practice scene feedback with explanatory 'why' statements");
    }

    return recommendations;
  }

  /**
   * Get alignment analysis for detailed reporting
   */
  private getAlignmentAnalysis(storyboard: StoryboardModule) {
    const result = alignmentBuilder.buildAlignmentMap(storyboard);
    return result.analysis;
  }
}

// Export singleton instance
export const outcomeDrivenQualityValidator = new OutcomeDrivenQualityValidator();

