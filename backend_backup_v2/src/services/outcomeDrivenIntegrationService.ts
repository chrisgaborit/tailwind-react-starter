/**
 * Outcome-Driven Integration Service
 * 
 * Comprehensive service that orchestrates the Learn-See-Do-Apply framework:
 * - Integrates all framework components (pedagogy enforcer, alignment builder, quality validator, etc.)
 * - Provides a single entry point for framework application
 * - Handles the complete workflow from storyboard generation to PDF export
 * - Ensures consistency across all framework components
 */

import { StoryboardModule, LearningOutcome, ProjectMetadata, PedagogyPhase } from '../../types';
import { pedagogyEnforcer } from './pedagogyEnforcer';
import { alignmentBuilder } from './alignmentBuilder';
import { outcomeDrivenQualityValidator } from './outcomeDrivenQualityValidator';
import { outcomeDrivenPromptService } from './outcomeDrivenPromptService';
import { redundancyCleanupService } from './redundancyCleanupService';
import { instructionalSequenceGenerator } from './instructionalSequenceGenerator';
import { renderOutcomeDrivenStoryboardAsHTML, generatePdfFileName } from './outcomeDrivenPdfService';

export interface FrameworkApplicationResult {
  success: boolean;
  storyboard: StoryboardModule;
  qualityReport: any;
  changes: string[];
  warnings: string[];
  fileName?: string;
  htmlContent?: string;
}

export interface FrameworkApplicationOptions {
  applyPedagogyEnforcement?: boolean;
  buildAlignmentMap?: boolean;
  runQualityValidation?: boolean;
  cleanupRedundancy?: boolean;
  generateInstructionalSequence?: boolean;
  generatePdf?: boolean;
  includeBusinessImpact?: boolean;
  includeLearningOutcomes?: boolean;
  includeAlignmentMap?: boolean;
}

export class OutcomeDrivenIntegrationService {
  private readonly LEADERSHIP_CATEGORIES = ['Leadership', 'Soft Skills'];

  /**
   * Main entry point: applies the complete Learn-See-Do-Apply framework
   */
  public async applyFramework(
    storyboard: StoryboardModule,
    options: FrameworkApplicationOptions = {}
  ): Promise<FrameworkApplicationResult> {
    const {
      applyPedagogyEnforcement = true,
      buildAlignmentMap = true,
      runQualityValidation = true,
      cleanupRedundancy = true,
      generateInstructionalSequence = false,
      generatePdf = false,
      includeBusinessImpact = true,
      includeLearningOutcomes = true,
      includeAlignmentMap = true
    } = options;

    const changes: string[] = [];
    const warnings: string[] = [];
    let processedStoryboard = { ...storyboard };

    try {
      // Check if this is a Leadership/Soft Skills module
      const category = this.getModuleCategory(processedStoryboard);
      const isLeadershipModule = this.LEADERSHIP_CATEGORIES.includes(category);

      if (!isLeadershipModule) {
        return {
          success: true,
          storyboard: processedStoryboard,
          qualityReport: { message: 'Framework not applicable to non-leadership modules' },
          changes: ['Framework not applied - module category does not require Learn-See-Do-Apply framework'],
          warnings: []
        };
      }

      // Step 1: Generate Instructional Sequence (if requested)
      if (generateInstructionalSequence && processedStoryboard.learningOutcomes) {
        const instructionalScenes = instructionalSequenceGenerator.generateInstructionalSequence(
          processedStoryboard.learningOutcomes,
          {
            businessImpact: processedStoryboard.project_metadata?.businessImpact,
            targetAudience: processedStoryboard.targetAudience,
            tone: 'Professional'
          }
        );
        
        // Replace existing scenes with instructional sequence
        processedStoryboard.scenes = [
          ...processedStoryboard.scenes.filter(scene => scene.internalPage), // Keep internal pages
          ...instructionalScenes
        ];
        
        changes.push(`Generated ${instructionalScenes.length} instructional scenes for ${processedStoryboard.learningOutcomes.length} learning outcomes`);
      }

      // Step 2: Apply Pedagogy Enforcement
      if (applyPedagogyEnforcement) {
        const pedagogyResult = pedagogyEnforcer.ensureLearnSeeDoApply(processedStoryboard);
        if (pedagogyResult.success) {
          processedStoryboard = pedagogyResult.modifiedStoryboard;
          changes.push(...pedagogyResult.changes);
          warnings.push(...pedagogyResult.warnings);
        } else {
          warnings.push('Pedagogy enforcement failed');
        }
      }

      // Step 3: Build Alignment Map
      if (buildAlignmentMap) {
        const alignmentResult = alignmentBuilder.buildAlignmentMap(processedStoryboard);
        if (alignmentResult.success) {
          processedStoryboard.alignmentMap = alignmentResult.alignmentMap;
          changes.push(...alignmentResult.changes);
        } else {
          warnings.push('Alignment map building failed');
        }
      }

      // Step 4: Clean up Redundancy
      if (cleanupRedundancy) {
        const cleanupResult = redundancyCleanupService.cleanupRedundancy(processedStoryboard);
        if (cleanupResult.success) {
          processedStoryboard = cleanupResult.modifiedStoryboard;
          changes.push(...cleanupResult.changes);
          warnings.push(...cleanupResult.warnings);
        } else {
          warnings.push('Redundancy cleanup failed');
        }
      }

      // Step 5: Run Quality Validation
      let qualityReport = null;
      if (runQualityValidation) {
        qualityReport = outcomeDrivenQualityValidator.validateOutcomeDrivenQuality(processedStoryboard);
        if (qualityReport.issues.length > 0) {
          warnings.push(`${qualityReport.issues.length} quality issues found`);
        }
      }

      // Step 6: Generate PDF (if requested)
      let fileName: string | undefined;
      let htmlContent: string | undefined;
      if (generatePdf) {
        fileName = generatePdfFileName(processedStoryboard);
        htmlContent = renderOutcomeDrivenStoryboardAsHTML(
          processedStoryboard,
          undefined,
          {
            includeAlignmentMap,
            includeBusinessImpact,
            includeLearningOutcomes,
            includeFrameworkSummary: true
          }
        );
      }

      return {
        success: true,
        storyboard: processedStoryboard,
        qualityReport,
        changes,
        warnings,
        fileName,
        htmlContent
      };

    } catch (error) {
      return {
        success: false,
        storyboard: processedStoryboard,
        qualityReport: null,
        changes,
        warnings: [...warnings, `Framework application failed: ${error.message}`]
      };
    }
  }

  /**
   * Generate learning outcomes from form data
   */
  public generateLearningOutcomes(
    formData: any,
    projectMetadata?: ProjectMetadata
  ): LearningOutcome[] {
    const learningOutcomesText = formData.learningOutcomes || '';
    const outcomes: LearningOutcome[] = [];

    if (learningOutcomesText.trim()) {
      const lines = learningOutcomesText.split('\n').map(line => line.trim()).filter(Boolean);
      
      lines.forEach((line, index) => {
        // Try to extract Bloom's verb and text
        const bloomVerbs = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'];
        const verbMatch = bloomVerbs.find(verb => 
          line.toLowerCase().includes(verb)
        );
        
        if (verbMatch) {
          outcomes.push({
            id: `lo-${index + 1}`,
            verb: verbMatch as any,
            text: line,
            context: projectMetadata?.businessImpact ? 'Business context' : undefined
          });
        } else {
          // Default to 'apply' if no verb found
          outcomes.push({
            id: `lo-${index + 1}`,
            verb: 'apply',
            text: line,
            context: projectMetadata?.businessImpact ? 'Business context' : undefined
          });
        }
      });
    }

    // Ensure we have 3-5 outcomes
    if (outcomes.length < 3) {
      // Generate additional outcomes based on module type
      const additionalOutcomes = this.generateAdditionalOutcomes(
        formData.moduleType || 'Leadership',
        projectMetadata,
        outcomes.length
      );
      outcomes.push(...additionalOutcomes);
    } else if (outcomes.length > 5) {
      // Trim to 5 outcomes
      outcomes.splice(5);
    }

    return outcomes;
  }

  /**
   * Generate additional learning outcomes if needed
   */
  private generateAdditionalOutcomes(
    moduleType: string,
    projectMetadata?: ProjectMetadata,
    currentCount: number = 0
  ): LearningOutcome[] {
    const additionalOutcomes: LearningOutcome[] = [];
    const needed = Math.max(0, 3 - currentCount);

    const outcomeTemplates = {
      'Leadership': [
        { verb: 'apply', text: 'apply leadership principles in team management situations' },
        { verb: 'analyze', text: 'analyze team dynamics and identify improvement opportunities' },
        { verb: 'evaluate', text: 'evaluate leadership effectiveness and adjust approach accordingly' }
      ],
      'Soft Skills': [
        { verb: 'apply', text: 'apply communication techniques in professional interactions' },
        { verb: 'analyze', text: 'analyze interpersonal situations and choose appropriate responses' },
        { verb: 'evaluate', text: 'evaluate communication effectiveness and adapt style as needed' }
      ]
    };

    const templates = outcomeTemplates[moduleType as keyof typeof outcomeTemplates] || outcomeTemplates['Leadership'];
    
    for (let i = 0; i < needed && i < templates.length; i++) {
      const template = templates[i];
      additionalOutcomes.push({
        id: `lo-generated-${currentCount + i + 1}`,
        verb: template.verb as any,
        text: template.text,
        context: projectMetadata?.businessImpact ? 'Business context' : undefined
      });
    }

    return additionalOutcomes;
  }

  /**
   * Create project metadata from form data
   */
  public createProjectMetadata(formData: any): ProjectMetadata {
    const title = formData.moduleName || 'Untitled Module';
    const category = this.mapModuleTypeToCategory(formData.moduleType);
    const businessImpact = this.generateBusinessImpact(formData, category);

    return {
      title,
      category,
      businessImpact,
      moduleName: formData.moduleName
    };
  }

  /**
   * Map module type to framework category
   */
  private mapModuleTypeToCategory(moduleType: string): ProjectMetadata['category'] {
    const mapping: Record<string, ProjectMetadata['category']> = {
      'Leadership & Coaching': 'Leadership',
      'Professional Skills': 'Soft Skills',
      'Sales & Customer Service': 'Sales',
      'Compliance & Ethics': 'Compliance',
      'Technical & Systems': 'Technical',
      'Health & Safety': 'HSE',
      'Onboarding & Culture': 'Onboarding',
      'Product Knowledge': 'Product'
    };

    return mapping[moduleType] || 'Professional';
  }

  /**
   * Generate business impact statement
   */
  private generateBusinessImpact(formData: any, category: ProjectMetadata['category']): string {
    const baseImpact = {
      'Leadership': 'Improve leadership effectiveness and team performance',
      'Soft Skills': 'Enhance professional communication and interpersonal skills',
      'Sales': 'Increase sales performance and customer satisfaction',
      'Compliance': 'Ensure regulatory compliance and reduce risk',
      'Technical': 'Improve technical competency and system efficiency',
      'HSE': 'Enhance safety awareness and reduce workplace incidents',
      'Onboarding': 'Accelerate new employee integration and productivity',
      'Product': 'Improve product knowledge and customer service quality'
    };

    const categoryImpact = baseImpact[category] || 'Improve professional performance';
    const targetAudience = formData.targetAudience || 'employees';
    
    return `${categoryImpact} for ${targetAudience}; expected improvement in key performance metrics`;
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
   * Build enhanced prompts for storyboard generation
   */
  public buildEnhancedPrompts(
    formData: any,
    learningOutcomes: LearningOutcome[],
    projectMetadata: ProjectMetadata,
    currentPhase?: PedagogyPhase,
    targetedOutcomes?: string[]
  ) {
    return outcomeDrivenPromptService.buildOutcomeDrivenPrompts({
      formData,
      learningOutcomes,
      projectMetadata,
      currentPhase,
      targetedOutcomes,
      options: {
        aiModel: formData.aiModel,
        idMethod: 'Learn-See-Do-Apply Framework',
        ragContext: formData.ragContext,
        durationMins: formData.durationMins
      }
    });
  }

  /**
   * Validate framework compliance
   */
  public validateFrameworkCompliance(storyboard: StoryboardModule): {
    isCompliant: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const qualityReport = outcomeDrivenQualityValidator.validateOutcomeDrivenQuality(storyboard);
    
    const isCompliant = qualityReport.overallScore >= 80 && 
                       qualityReport.frameworkCompliance.outcomeCount >= 80 &&
                       qualityReport.frameworkCompliance.alignmentCoverage >= 80;

    const issues = qualityReport.issues
      .filter(issue => issue.severity === 'error')
      .map(issue => issue.message);

    return {
      isCompliant,
      issues,
      recommendations: qualityReport.recommendations
    };
  }
}

// Export singleton instance
export const outcomeDrivenIntegrationService = new OutcomeDrivenIntegrationService();

