/**
 * Gap-Aware Orchestrator
 * 
 * Generates storyboards using ONLY source material, flagging gaps instead of creating content.
 * Ensures 100% source fidelity and transparent content analysis.
 */

import { ContentGapDetector, ContentGapReport, ContentGap } from '../agents/contentGapDetector';
import { generateStoryboardFromOpenAI } from './openaiService';
import type { 
  LearningRequest, 
  StoryboardModule, 
  StoryboardScene 
} from '../../../packages/shared/src/types';

export interface StoryboardWithGaps extends StoryboardModule {
  content_gaps: ContentGap[];
  source_adequacy_score: number;
  recommendations: string[];
  metadata: {
    source_fidelity: 'strict';
    gap_analysis_performed: boolean;
    generation_constraints: string[];
    gap_count: number;
    adequacy_score: number;
  };
}

export class GapAwareOrchestrator {
  private gapDetector: ContentGapDetector;

  constructor() {
    this.gapDetector = new ContentGapDetector();
  }

  async generateStoryboard(learningRequest: LearningRequest): Promise<StoryboardWithGaps> {
    console.log('🔍 Gap-Aware Orchestrator: Starting source-only storyboard generation...');
    
    // 1. ANALYZE SOURCE MATERIAL FIRST
    console.log('📋 Phase 1: Analyzing source material completeness...');
    const gapReport = await this.gapDetector.analyzeSourceCompleteness(
      learningRequest.sourceMaterial?.content || '', 
      learningRequest
    );
    
    console.log(`📊 Source adequacy score: ${gapReport.source_material_adequacy}/100`);
    console.log(`🚩 Content gaps identified: ${gapReport.content_gaps.length}`);
    
    if (!gapReport.can_generate_storyboard) {
      console.warn('⚠️ Critical gaps detected - storyboard generation may be limited');
    }
    
    // 2. GENERATE STORYBOARD USING ONLY SOURCE MATERIAL
    console.log('📝 Phase 2: Generating storyboard from source material only...');
    const storyboard = await this.generateFromSourceOnly(learningRequest, gapReport);
    
    // 3. INSERT GAP FLAGS INTO STORYBOARD
    console.log('🚩 Phase 3: Inserting gap flags and metadata...');
    return this.insertGapFlags(storyboard, gapReport);
  }

  private async generateFromSourceOnly(
    learningRequest: LearningRequest, 
    gapReport: ContentGapReport
  ): Promise<StoryboardModule> {
    const sourceContent = learningRequest.sourceMaterial?.content || '';
    const topic = learningRequest.topics?.[0] || learningRequest.moduleName || 'Unknown Topic';
    const duration = learningRequest.durationMins || 20;
    const audience = learningRequest.targetAudience || 'General Audience';
    
    const prompt = `
    CREATE STORYBOARD USING ONLY SOURCE MATERIAL:
    
    SOURCE MATERIAL: ${sourceContent}
    TOPIC: ${topic}
    DURATION: ${duration} minutes
    AUDIENCE: ${audience}
    
    CRITICAL CONSTRAINTS:
    - Use ONLY information from the source material above
    - DO NOT create any new examples, scenarios, or content
    - DO NOT invent characters, situations, or outcomes
    - If source material lacks elements, structure around what IS available
    - Convert source content into storyboard format (scenes, voiceover, visuals)
    - Be transparent about limitations in the source material
    
    CONTENT GAPS IDENTIFIED: ${JSON.stringify(gapReport.content_gaps, null, 2)}
    
    GENERATION RULES:
    1. Extract and organize existing content from source material
    2. Create scenes that directly reflect the source content
    3. Use exact quotes, examples, and information from source when available
    4. If gaps exist, structure the storyboard to work with available content
    5. Never fill gaps with invented content
    
    Generate a storyboard that works WITH the available source material.
    `;
    
    try {
      const storyboard = await generateStoryboardFromOpenAI({
        formData: {
          content: sourceContent,
          moduleName: topic,
          targetAudience: audience,
          durationMins: duration,
          topics: learningRequest.topics || [topic],
          __source: 'gap-aware-orchestrator'
        },
        options: {
          ragContext: prompt,
          aiModel: 'gpt-4o',
          strictSourceOnly: true
        }
      });
      
      console.log(`✅ Generated storyboard with ${storyboard.scenes?.length || 0} scenes`);
      return storyboard;
    } catch (error) {
      console.error('❌ Source-only generation failed:', error);
      throw new Error(`Failed to generate storyboard from source material: ${error}`);
    }
  }

  private insertGapFlags(storyboard: StoryboardModule, gapReport: ContentGapReport): StoryboardWithGaps {
    const scenesWithGaps = [...(storyboard.scenes || [])];
    
    // Insert gap flag scenes for high and critical severity gaps
    const significantGaps = gapReport.content_gaps.filter(
      gap => gap.severity === 'high' || gap.severity === 'critical'
    );
    
    significantGaps.forEach((gap, index) => {
      const gapFlagScene = this.createGapFlagScene(gap, index, scenesWithGaps.length + 1);
      scenesWithGaps.push(gapFlagScene);
    });
    
    // Add summary gap scene if there are any gaps
    if (gapReport.content_gaps.length > 0) {
      const summaryScene = this.createGapSummaryScene(gapReport, scenesWithGaps.length + 1);
      scenesWithGaps.push(summaryScene);
    }
    
    return {
      ...storyboard,
      scenes: scenesWithGaps,
      content_gaps: gapReport.content_gaps,
      source_adequacy_score: gapReport.source_material_adequacy,
      recommendations: gapReport.recommendations,
      metadata: {
        ...storyboard.metadata,
        source_fidelity: 'strict' as const,
        gap_analysis_performed: true,
        generation_constraints: [
          'Source-only generation',
          'No invented content',
          'Gap transparency required',
          'Client education about instructional design'
        ],
        gap_count: gapReport.content_gaps.length,
        adequacy_score: gapReport.source_material_adequacy
      }
    };
  }

  private createGapFlagScene(gap: ContentGap, index: number, sceneNumber: number): StoryboardScene {
    const severityEmoji = {
      'critical': '🚨',
      'high': '⚠️',
      'medium': '💡',
      'low': '📝'
    };

    return {
      sceneNumber,
      pageTitle: `${severityEmoji[gap.severity]} CONTENT GAP: ${gap.element.toUpperCase()}`,
      pedagogical_purpose: 'gap_identification',
      screenLayout: { type: 'Full Bleed', variation: 'A' },
      audio: {
        script: `Note: Content gap identified for ${gap.element}. ${gap.recommendation}`
      },
      narrationScript: `
## Content Gap Identified

**Missing Element**: ${gap.element}
**Severity**: ${gap.severity.toUpperCase()}
**Description**: ${gap.description}

**Evidence**: ${gap.evidence}

**Recommendation**: ${gap.recommendation}

**Impact**: This storyboard uses only available source material. Consider adding ${gap.element} content for a more complete learning experience.

*This gap flag helps you understand what additional content could enhance the learning experience.*
      `,
      onScreenText: `
CONTENT GAP: ${gap.element.toUpperCase()}

${gap.description}

Recommendation: ${gap.recommendation}

Severity: ${gap.severity.toUpperCase()}
      `,
      characters: [],
      metadata: {
        is_gap_flag: true,
        gap_type: gap.element,
        severity: gap.severity,
        requires_human_attention: true,
        gap_description: gap.description,
        gap_recommendation: gap.recommendation
      }
    } as any; // Type assertion for gap-specific metadata
  }

  private createGapSummaryScene(gapReport: ContentGapReport, sceneNumber: number): StoryboardScene {
    const gapCounts = gapReport.content_gaps.reduce((counts, gap) => {
      counts[gap.severity] = (counts[gap.severity] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    return {
      sceneNumber,
      pageTitle: '📋 SOURCE MATERIAL ANALYSIS SUMMARY',
      pedagogical_purpose: 'gap_summary',
      screenLayout: { type: 'Full Bleed', variation: 'A' },
      audio: {
        script: `Source material analysis complete. ${gapReport.content_gaps.length} gaps identified with an adequacy score of ${gapReport.source_material_adequacy} out of 100.`
      },
      narrationScript: `
## Source Material Analysis Summary

**Overall Adequacy Score**: ${gapReport.source_material_adequacy}/100

**Content Gaps Identified**: ${gapReport.content_gaps.length}
- Critical: ${gapCounts.critical || 0}
- High: ${gapCounts.high || 0}
- Medium: ${gapCounts.medium || 0}
- Low: ${gapCounts.low || 0}

**Key Recommendations**:
${gapReport.recommendations.map(rec => `• ${rec}`).join('\n')}

**Generation Approach**: This storyboard was created using ONLY the source material provided, with no invented content. Gap flags indicate where additional content could enhance the learning experience.

**Next Steps**: Review the gap flags and consider adding the recommended content types for a more comprehensive learning experience.
      `,
      onScreenText: `
SOURCE ANALYSIS SUMMARY

Adequacy Score: ${gapReport.source_material_adequacy}/100

Gaps Found: ${gapReport.content_gaps.length}
• Critical: ${gapCounts.critical || 0}
• High: ${gapCounts.high || 0}
• Medium: ${gapCounts.medium || 0}
• Low: ${gapCounts.low || 0}

This storyboard uses only your source material.
      `,
      characters: [],
      metadata: {
        is_gap_summary: true,
        total_gaps: gapReport.content_gaps.length,
        adequacy_score: gapReport.source_material_adequacy,
        can_generate_storyboard: gapReport.can_generate_storyboard
      }
    } as any; // Type assertion for summary-specific metadata
  }
}
