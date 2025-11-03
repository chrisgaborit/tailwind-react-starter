/**
 * Human-Centric Storyboard Service
 * 
 * Orchestrates the complete Learn-See-Do-Apply framework with human-centric design principles.
 * This service ensures that Leadership and Soft Skills modules are transformed into engaging,
 * pedagogically sound learning experiences that match the quality of human-created storyboards.
 */

import { StoryboardModule, LearningOutcome, ProjectMetadata, PedagogyPhase } from '../types';
import { outcomeDrivenIntegrationService } from './outcomeDrivenIntegrationService';
import { instructionalSequenceGenerator } from './instructionalSequenceGenerator';
import { generateHumanCentricSceneContent, generateHumanCentricInternalPages } from '../library/humanCentricBlueprintPrompt';
import { generateHumanCentricPrompt } from '../prompts/humanCentricSystemPrompt';

export interface HumanCentricStoryboardResult {
  success: boolean;
  storyboard: StoryboardModule;
  qualityReport: any;
  changes: string[];
  warnings: string[];
  fileName?: string;
  htmlContent?: string;
}

export interface HumanCentricOptions {
  generateLearningOutcomes?: boolean;
  applyFramework?: boolean;
  generatePdf?: boolean;
  includeBusinessImpact?: boolean;
  includeAlignmentMap?: boolean;
  targetAudience?: string;
  tone?: string;
}

export class HumanCentricStoryboardService {
  private readonly LEADERSHIP_CATEGORIES = ['Leadership', 'Soft Skills'];
  private readonly NARRATOR_NAME = 'Alex';

  /**
   * Main entry point: Transform storyboard into human-centric Learn-See-Do-Apply experience
   */
  public async transformToHumanCentric(
    storyboard: StoryboardModule,
    formData: any = {},
    options: HumanCentricOptions = {}
  ): Promise<HumanCentricStoryboardResult> {
    const {
      generateLearningOutcomes = true,
      applyFramework = true,
      generatePdf = false,
      includeBusinessImpact = true,
      includeAlignmentMap = true,
      targetAudience = 'Learners',
      tone = 'Professional'
    } = options;

    const changes: string[] = [];
    const warnings: string[] = [];
    let processedStoryboard = { ...storyboard };

    try {
      // Step 1: Determine if this is a Leadership/Soft Skills module
      const category = this.determineCategory(processedStoryboard, formData);
      const isLeadershipModule = this.LEADERSHIP_CATEGORIES.includes(category);

      if (!isLeadershipModule) {
        return {
          success: true,
          storyboard: processedStoryboard,
          qualityReport: { message: 'Not a Leadership/Soft Skills module - framework not applied' },
          changes: ['Framework not applied - module category does not require Learn-See-Do-Apply framework'],
          warnings: []
        };
      }

      // Step 2: Generate learning outcomes if needed
      if (generateLearningOutcomes && (!processedStoryboard.learningOutcomes || processedStoryboard.learningOutcomes.length === 0)) {
        processedStoryboard.learningOutcomes = this.generateLearningOutcomes(formData, processedStoryboard.project_metadata);
        changes.push(`Generated ${processedStoryboard.learningOutcomes.length} learning outcomes`);
      }

      // Step 3: Create project metadata if needed
      if (!processedStoryboard.project_metadata) {
        processedStoryboard.project_metadata = this.createProjectMetadata(formData);
        changes.push('Created project metadata with business impact');
      }

      // Step 4: Generate human-centric internal pages
      const internalPages = generateHumanCentricInternalPages(processedStoryboard, formData);
      processedStoryboard.scenes = [
        ...internalPages,
        ...processedStoryboard.scenes.filter(scene => !scene.internalPage)
      ];
      changes.push(`Generated ${internalPages.length} human-centric internal pages`);

      // Step 5: Apply Learn-See-Do-Apply framework
      if (applyFramework) {
        const frameworkResult = await outcomeDrivenIntegrationService.applyFramework(processedStoryboard, {
          generateInstructionalSequence: true,
          applyPedagogyEnforcement: true,
          buildAlignmentMap: includeAlignmentMap,
          runQualityValidation: true,
          cleanupRedundancy: true,
          generatePdf: generatePdf,
          includeBusinessImpact: includeBusinessImpact,
          includeLearningOutcomes: true,
          includeAlignmentMap: includeAlignmentMap
        });

        if (frameworkResult.success) {
          processedStoryboard = frameworkResult.storyboard;
          changes.push(...frameworkResult.changes);
          warnings.push(...frameworkResult.warnings);
        } else {
          warnings.push('Framework application failed');
        }
      }

      // Step 6: Enhance scenes with human-centric content
      processedStoryboard = this.enhanceScenesWithHumanCentricContent(
        processedStoryboard,
        targetAudience,
        tone
      );
      changes.push('Enhanced scenes with human-centric content and narrative voice');

      // Step 7: Generate PDF if requested
      let fileName: string | undefined;
      let htmlContent: string | undefined;
      if (generatePdf) {
        const pdfResult = await this.generateHumanCentricPdf(processedStoryboard);
        fileName = pdfResult.fileName;
        htmlContent = pdfResult.htmlContent;
        changes.push(`Generated human-centric PDF: ${fileName}`);
      }

      return {
        success: true,
        storyboard: processedStoryboard,
        qualityReport: { message: 'Human-centric transformation completed successfully' },
        changes,
        warnings,
        fileName,
        htmlContent
      };

    } catch (error) {
      console.error('Error in human-centric transformation:', error);
      return {
        success: false,
        storyboard: processedStoryboard,
        qualityReport: { error: error.message },
        changes,
        warnings: [...warnings, `Transformation failed: ${error.message}`]
      };
    }
  }

  /**
   * Determine module category from various sources
   */
  private determineCategory(storyboard: StoryboardModule, formData: any): string {
    return storyboard.project_metadata?.category || 
           storyboard.metadata?.strategicCategory || 
           formData.moduleType || 
           formData.category || 
           'Unknown';
  }

  /**
   * Generate learning outcomes for the module
   */
  private generateLearningOutcomes(formData: any, projectMetadata?: ProjectMetadata): LearningOutcome[] {
    // This would typically use AI to generate outcomes based on the module content
    // For now, return a template structure
    const outcomes: LearningOutcome[] = [
      {
        id: 'outcome-1',
        verb: 'apply',
        text: 'Apply effective communication principles in team interactions',
        context: 'When leading team meetings and providing feedback',
        measure: 'Improved team engagement and reduced misunderstandings'
      },
      {
        id: 'outcome-2',
        verb: 'analyze',
        text: 'Analyze team dynamics and identify improvement opportunities',
        context: 'In diverse team environments with varying skill levels',
        measure: 'Enhanced team performance and collaboration'
      },
      {
        id: 'outcome-3',
        verb: 'evaluate',
        text: 'Evaluate leadership approaches and adapt to different situations',
        context: 'When facing challenging team situations or conflicts',
        measure: 'More effective leadership outcomes and team satisfaction'
      }
    ];

    return outcomes;
  }

  /**
   * Create project metadata with business impact
   */
  private createProjectMetadata(formData: any): ProjectMetadata {
    return {
      title: formData.moduleName || formData.title || 'Leadership Development Module',
      businessImpact: formData.businessImpact || 'Improve team performance and leadership effectiveness; +15% engagement',
      category: formData.category || 'Leadership'
    };
  }

  /**
   * Enhance scenes with human-centric content and narrative voice
   */
  private enhanceScenesWithHumanCentricContent(
    storyboard: StoryboardModule,
    targetAudience: string,
    tone: string
  ): StoryboardModule {
    const enhancedScenes = storyboard.scenes.map(scene => {
      // Skip internal pages
      if (scene.internalPage) {
        return scene;
      }

      // Enhance learner-facing scenes
      if (scene.phase && ['LEARN', 'SEE', 'DO', 'APPLY'].includes(scene.phase)) {
        return this.enhanceSceneWithHumanCentricContent(scene, targetAudience, tone);
      }

      return scene;
    });

    return {
      ...storyboard,
      scenes: enhancedScenes
    };
  }

  /**
   * Enhance individual scene with human-centric content
   */
  private enhanceSceneWithHumanCentricContent(
    scene: any,
    targetAudience: string,
    tone: string
  ): any {
    // Add human-centric elements
    const enhancedScene = { ...scene };

    // Enhance voiceover with narrative voice
    if (enhancedScene.narrationScript) {
      enhancedScene.narrationScript = this.addNarrativeVoice(enhancedScene.narrationScript, tone);
    }

    // Enhance on-screen text with human-centric formatting
    if (enhancedScene.onScreenText) {
      enhancedScene.onScreenText = this.enhanceOnScreenText(enhancedScene.onScreenText);
    }

    // Add developer notes for human-centric approach
    enhancedScene.developerNotes = this.generateDeveloperNotes(enhancedScene, targetAudience);

    return enhancedScene;
  }

  /**
   * Add narrative voice to content
   */
  private addNarrativeVoice(content: string, tone: string): string {
    // Add narrator introduction if not present
    if (!content.includes(this.NARRATOR_NAME)) {
      const introduction = `Hi, I'm ${this.NARRATOR_NAME}, your learning coach. `;
      content = introduction + content;
    }

    // Add micro-reflections
    if (!content.includes('Pause and consider')) {
      content += '\n\nPause and consider: How might this apply to your current situation?';
    }

    return content;
  }

  /**
   * Enhance on-screen text with human-centric formatting
   */
  private enhanceOnScreenText(text: string): string {
    // Ensure it's not a verbatim copy of voiceover
    if (text.length > 30) {
      // Truncate and add key points
      const words = text.split(' ');
      if (words.length > 6) {
        text = words.slice(0, 6).join(' ') + '...';
      }
    }

    return text;
  }

  /**
   * Generate developer notes for human-centric approach
   */
  private generateDeveloperNotes(scene: any, targetAudience: string): string {
    const phase = scene.phase || 'Unknown';
    const notes = [
      `Human-Centric ${phase} Phase Scene`,
      `Target Audience: ${targetAudience}`,
      `Narrator: ${this.NARRATOR_NAME}`,
      `Focus: Engaging, pedagogically sound content with emotional connection`,
      `Business Impact: Connect to organizational values and real-world application`
    ];

    return notes.join('\n');
  }

  /**
   * Generate human-centric PDF
   */
  private async generateHumanCentricPdf(storyboard: StoryboardModule): Promise<{ fileName: string; htmlContent: string }> {
    // Use the existing PDF service with human-centric enhancements
    const { renderOutcomeDrivenStoryboardAsHTML, generatePdfFileName } = require('./outcomeDrivenPdfService');
    
    const fileName = generatePdfFileName(storyboard);
    const htmlContent = renderOutcomeDrivenStoryboardAsHTML(storyboard, {
      humanCentric: true,
      narrator: this.NARRATOR_NAME
    });

    return { fileName, htmlContent };
  }
}

// Export singleton instance
export const humanCentricStoryboardService = new HumanCentricStoryboardService();




