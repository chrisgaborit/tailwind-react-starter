/**
 * Content Gap Detector
 * 
 * Analyzes source material for completeness and identifies gaps in instructional content.
 * Ensures 100% source fidelity by flagging missing elements instead of creating content.
 */

import OpenAI from 'openai';
import type { 
  LearningRequest, 
  SourceMaterial 
} from '../../../packages/shared/src/types';

export interface ContentGap {
  element: 'teaching' | 'example' | 'scenario' | 'practice' | 'assessment';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: string;
  recommendation: string;
  location: 'specific_scene' | 'throughout_storyboard';
}

export interface ContentGapReport {
  source_material_adequacy: number;
  content_gaps: ContentGap[];
  recommendations: string[];
  can_generate_storyboard: boolean;
}

export class ContentGapDetector {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async analyzeSourceCompleteness(
    sourceMaterial: string, 
    learningRequest: LearningRequest
  ): Promise<ContentGapReport> {
    console.log('🔍 Content Gap Detector: Analyzing source material completeness...');
    
    const gaps: ContentGap[] = [];
    
    // Check for essential instructional elements
    await this.checkForTeachingGaps(sourceMaterial, learningRequest, gaps);
    await this.checkForExampleGaps(sourceMaterial, learningRequest, gaps);
    await this.checkForScenarioGaps(sourceMaterial, learningRequest, gaps);
    await this.checkForPracticeGaps(sourceMaterial, learningRequest, gaps);
    await this.checkForAssessmentGaps(sourceMaterial, learningRequest, gaps);
    
    const adequacyScore = this.calculateAdequacyScore(gaps);
    const canGenerate = gaps.every(gap => gap.severity !== 'critical');
    
    return {
      source_material_adequacy: adequacyScore,
      content_gaps: gaps,
      recommendations: this.generateGapRecommendations(gaps),
      can_generate_storyboard: canGenerate
    };
  }

  private async checkForTeachingGaps(sourceMaterial: string, learningRequest: LearningRequest, gaps: ContentGap[]) {
    const prompt = `
    ANALYZE SOURCE MATERIAL FOR TEACHING CONTENT:
    
    SOURCE: ${sourceMaterial.substring(0, 3000)}
    TOPIC: ${learningRequest.topics?.[0] || learningRequest.moduleName || 'Unknown'}
    AUDIENCE: ${learningRequest.targetAudience || 'General'}
    
    QUESTIONS:
    1. Does the source contain clear explanations of key concepts?
    2. Are there definitions, principles, or core knowledge clearly stated?
    3. How comprehensive is the theoretical foundation (0-10)?
    4. Are there any teaching gaps that would prevent understanding?
    
    Output JSON: {
      "hasClearExplanations": boolean,
      "hasDefinitions": boolean,
      "teachingCompleteness": number,
      "missingElements": string[],
      "recommendation": string
    }
    `;
    
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        response_format: { type: "json_object" }
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      
      if (!analysis.hasClearExplanations || analysis.teachingCompleteness < 6) {
        gaps.push({
          element: 'teaching',
          severity: analysis.teachingCompleteness < 4 ? 'critical' : 'high',
          description: 'Source material lacks clear explanations of key concepts',
          evidence: `Teaching completeness: ${analysis.teachingCompleteness}/10`,
          recommendation: 'Add clear definitions, principles, and conceptual explanations',
          location: 'throughout_storyboard'
        });
      }
    } catch (error) {
      console.warn('⚠️ Teaching gap analysis failed:', error);
    }
  }

  private async checkForExampleGaps(sourceMaterial: string, learningRequest: LearningRequest, gaps: ContentGap[]) {
    const prompt = `
    ANALYZE SOURCE MATERIAL FOR EXAMPLE CONTENT:
    
    SOURCE: ${sourceMaterial.substring(0, 3000)}
    TOPIC: ${learningRequest.topics?.[0] || learningRequest.moduleName || 'Unknown'}
    
    QUESTIONS:
    1. Does the source contain concrete examples or case studies?
    2. Are there specific instances that illustrate the concepts?
    3. How well do examples support understanding (0-10)?
    4. Are examples relevant to the target audience?
    
    Output JSON: {
      "hasConcreteExamples": boolean,
      "hasCaseStudies": boolean,
      "exampleQuality": number,
      "missingElements": string[],
      "recommendation": string
    }
    `;
    
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        response_format: { type: "json_object" }
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      
      if (!analysis.hasConcreteExamples && analysis.exampleQuality < 5) {
        gaps.push({
          element: 'example',
          severity: 'medium',
          description: 'Source material lacks concrete examples to illustrate concepts',
          evidence: `Example quality: ${analysis.exampleQuality}/10`,
          recommendation: 'Add specific examples, case studies, or real-world instances',
          location: 'throughout_storyboard'
        });
      }
    } catch (error) {
      console.warn('⚠️ Example gap analysis failed:', error);
    }
  }

  private async checkForScenarioGaps(sourceMaterial: string, learningRequest: LearningRequest, gaps: ContentGap[]) {
    const prompt = `
    ANALYZE SOURCE MATERIAL FOR SCENARIO CONTENT:
    
    SOURCE: ${sourceMaterial.substring(0, 3000)}
    TOPIC: ${learningRequest.topics?.[0] || learningRequest.moduleName || 'Unknown'}
    AUDIENCE: ${learningRequest.targetAudience || 'General'}
    
    QUESTIONS:
    1. Does the source contain READY-TO-USE workplace scenarios or case studies?
    2. Are there specific examples that could be turned into scenarios?
    3. How strong is the case for having scenarios (0-10)?
    4. Would scenarios significantly enhance learning for this topic?
    
    Output JSON: {
      "hasReadyScenarios": boolean,
      "hasScenarioPotential": boolean, 
      "scenarioCaseStrength": number,
      "missingElements": string[],
      "recommendation": string
    }
    `;
    
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        response_format: { type: "json_object" }
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      
      if (!analysis.hasReadyScenarios && analysis.scenarioCaseStrength >= 7) {
        gaps.push({
          element: 'scenario',
          severity: 'high',
          description: 'Source material lacks ready-to-use scenarios, but topic strongly benefits from them',
          evidence: `Scenario case strength: ${analysis.scenarioCaseStrength}/10`,
          recommendation: 'Consider adding workplace scenarios to illustrate practical application',
          location: 'throughout_storyboard'
        });
      }
    } catch (error) {
      console.warn('⚠️ Scenario gap analysis failed:', error);
    }
  }

  private async checkForPracticeGaps(sourceMaterial: string, learningRequest: LearningRequest, gaps: ContentGap[]) {
    const prompt = `
    ANALYZE SOURCE MATERIAL FOR PRACTICE CONTENT:
    
    SOURCE: ${sourceMaterial.substring(0, 3000)}
    TOPIC: ${learningRequest.topics?.[0] || learningRequest.moduleName || 'Unknown'}
    
    QUESTIONS:
    1. Does the source contain exercises, activities, or practice opportunities?
    2. Are there step-by-step procedures or processes to practice?
    3. How important is hands-on practice for this topic (0-10)?
    4. Could learners benefit from practice activities?
    
    Output JSON: {
      "hasPracticeActivities": boolean,
      "hasProcedures": boolean,
      "practiceImportance": number,
      "missingElements": string[],
      "recommendation": string
    }
    `;
    
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        response_format: { type: "json_object" }
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      
      if (!analysis.hasPracticeActivities && analysis.practiceImportance >= 6) {
        gaps.push({
          element: 'practice',
          severity: analysis.practiceImportance >= 8 ? 'high' : 'medium',
          description: 'Source material lacks practice activities for skill development',
          evidence: `Practice importance: ${analysis.practiceImportance}/10`,
          recommendation: 'Add exercises, activities, or hands-on practice opportunities',
          location: 'throughout_storyboard'
        });
      }
    } catch (error) {
      console.warn('⚠️ Practice gap analysis failed:', error);
    }
  }

  private async checkForAssessmentGaps(sourceMaterial: string, learningRequest: LearningRequest, gaps: ContentGap[]) {
    const prompt = `
    ANALYZE SOURCE MATERIAL FOR ASSESSMENT CONTENT:
    
    SOURCE: ${sourceMaterial.substring(0, 3000)}
    TOPIC: ${learningRequest.topics?.[0] || learningRequest.moduleName || 'Unknown'}
    
    QUESTIONS:
    1. Does the source contain questions, quizzes, or assessment criteria?
    2. Are there clear success metrics or performance indicators?
    3. How important is assessment for this learning objective (0-10)?
    4. Could learners benefit from knowledge checks?
    
    Output JSON: {
      "hasAssessmentQuestions": boolean,
      "hasSuccessCriteria": boolean,
      "assessmentImportance": number,
      "missingElements": string[],
      "recommendation": string
    }
    `;
    
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        response_format: { type: "json_object" }
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      
      if (!analysis.hasAssessmentQuestions && analysis.assessmentImportance >= 6) {
        gaps.push({
          element: 'assessment',
          severity: analysis.assessmentImportance >= 8 ? 'medium' : 'low',
          description: 'Source material lacks assessment questions or success criteria',
          evidence: `Assessment importance: ${analysis.assessmentImportance}/10`,
          recommendation: 'Add questions, quizzes, or clear success criteria',
          location: 'specific_scene'
        });
      }
    } catch (error) {
      console.warn('⚠️ Assessment gap analysis failed:', error);
    }
  }

  private calculateAdequacyScore(gaps: ContentGap[]): number {
    let score = 100;
    
    gaps.forEach(gap => {
      switch (gap.severity) {
        case 'critical':
          score -= 25;
          break;
        case 'high':
          score -= 15;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    });
    
    return Math.max(0, score);
  }

  private generateGapRecommendations(gaps: ContentGap[]): string[] {
    const recommendations: string[] = [];
    
    if (gaps.length === 0) {
      recommendations.push('✅ Source material is comprehensive and ready for storyboard generation');
      return recommendations;
    }

    const criticalGaps = gaps.filter(gap => gap.severity === 'critical');
    const highGaps = gaps.filter(gap => gap.severity === 'high');
    
    if (criticalGaps.length > 0) {
      recommendations.push('🚨 CRITICAL: Source material has critical gaps that will limit storyboard effectiveness');
      criticalGaps.forEach(gap => {
        recommendations.push(`• Add ${gap.element} content: ${gap.recommendation}`);
      });
    }
    
    if (highGaps.length > 0) {
      recommendations.push('⚠️ HIGH PRIORITY: Consider adding these elements for better learning experience');
      highGaps.forEach(gap => {
        recommendations.push(`• Add ${gap.element} content: ${gap.recommendation}`);
      });
    }
    
    const mediumGaps = gaps.filter(gap => gap.severity === 'medium');
    if (mediumGaps.length > 0) {
      recommendations.push('💡 SUGGESTED: These additions would enhance the learning experience');
      mediumGaps.forEach(gap => {
        recommendations.push(`• Consider adding ${gap.element}: ${gap.recommendation}`);
      });
    }

    recommendations.push('📋 Generate storyboard with available content and flag gaps for client review');
    
    return recommendations;
  }
}
