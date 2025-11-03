/**
 * Pedagogical Quality Agent
 * 
 * Validates content for pedagogical depth and teaching effectiveness.
 * Catches shallow corporate statements and ensures actual teaching occurs.
 */

import { pedagogicalQualityAgent as patterns } from '../services/pedagogicalPatterns';
import type { QualityIssue } from '../services/pedagogicalPatterns';

export interface PedagogicalValidationReport {
  sceneNumber: number;
  segmentType: string;
  issues: QualityIssue[];
  pedagogicalScore: number; // 0-100
  recommendations: string[];
  passed: boolean;
}

export const pedagogicalQualityAgent = {
  /**
   * Validate a complete storyboard for pedagogical depth
   */
  async validateStoryboardPedagogicalDepth(storyboard: any): Promise<{
    overallScore: number;
    sceneReports: PedagogicalValidationReport[];
    criticalIssues: QualityIssue[];
    recommendations: string[];
  }> {
    console.log('🔍 Pedagogical Quality Agent: Analyzing storyboard depth...');
    
    const sceneReports: PedagogicalValidationReport[] = [];
    let totalScore = 0;
    const allIssues: QualityIssue[] = [];

    for (const scene of storyboard.scenes || []) {
      const report = this.validateScene(scene);
      sceneReports.push(report);
      totalScore += report.pedagogicalScore;
      allIssues.push(...report.issues);
    }

    const overallScore = sceneReports.length > 0 ? totalScore / sceneReports.length : 0;
    const criticalIssues = allIssues.filter(issue => issue.severity === 'high');
    
    return {
      overallScore,
      sceneReports,
      criticalIssues,
      recommendations: this.generateRecommendations(allIssues, overallScore)
    };
  },

  /**
   * Validate a single scene for pedagogical depth
   */
  validateScene(scene: any): PedagogicalValidationReport {
    const segmentType = this.determineSegmentType(scene);
    const issues = patterns.validateTeachingDepth(scene);
    const pedagogicalScore = this.calculatePedagogicalScore(scene, issues);
    
    return {
      sceneNumber: scene.sceneNumber || 0,
      segmentType,
      issues,
      pedagogicalScore,
      recommendations: this.generateSceneRecommendations(issues, segmentType),
      passed: issues.filter(issue => issue.severity === 'high').length === 0
    };
  },

  /**
   * Determine the pedagogical segment type from scene content
   */
  private determineSegmentType(scene: any): string {
    const content = (scene.content || '') + ' ' + (scene.narrationScript || '') + ' ' + (scene.audio?.script || '');
    const lowerContent = content.toLowerCase();

    // Check for teaching indicators
    if (lowerContent.includes('think about') || lowerContent.includes('ask yourself') || 
        lowerContent.includes('why this matters') || lowerContent.includes('key principles')) {
      return 'TEACH';
    }

    // Check for example indicators
    if (lowerContent.includes('meet') || lowerContent.includes('consider') || 
        lowerContent.includes('scenario') || lowerContent.includes('faced with')) {
      return 'EXAMPLE';
    }

    // Check for practice indicators
    if (lowerContent.includes('practice') || lowerContent.includes('your turn') || 
        lowerContent.includes('try this') || lowerContent.includes('apply')) {
      return 'PRACTICE';
    }

    // Check for assessment indicators
    if (lowerContent.includes('check your understanding') || lowerContent.includes('demonstrate') || 
        lowerContent.includes('show your knowledge') || lowerContent.includes('assess')) {
      return 'ASSESSMENT';
    }

    return 'UNKNOWN';
  },

  /**
   * Calculate pedagogical score based on content quality
   */
  private calculatePedagogicalScore(scene: any, issues: QualityIssue[]): number {
    let score = 100;
    
    // Deduct points for issues
    issues.forEach(issue => {
      switch (issue.severity) {
        case 'high':
          score -= 25;
          break;
        case 'medium':
          score -= 15;
          break;
        case 'low':
          score -= 5;
          break;
      }
    });

    // Bonus points for good pedagogical elements
    const content = (scene.content || '') + ' ' + (scene.narrationScript || '');
    
    if (this.hasWhyItMatters(content)) score += 10;
    if (this.hasReflectivePrompt(content)) score += 10;
    if (this.hasRealWorldConnection(content)) score += 10;
    if (this.hasConcreteExamples(content)) score += 10;
    if (this.hasConversationalTone(content)) score += 10;

    return Math.max(0, Math.min(100, score));
  },

  /**
   * Generate recommendations for improving pedagogical depth
   */
  private generateRecommendations(allIssues: QualityIssue[], overallScore: number): string[] {
    const recommendations: string[] = [];
    
    if (overallScore < 60) {
      recommendations.push('🚨 CRITICAL: Overall pedagogical depth is insufficient. Content needs major improvement.');
    } else if (overallScore < 80) {
      recommendations.push('⚠️ WARNING: Pedagogical depth could be improved. Consider enhancing teaching elements.');
    }

    const issueTypes = new Set(allIssues.map(issue => issue.type));
    
    if (issueTypes.has('missing_context')) {
      recommendations.push('📝 Add "why it matters" context to teaching scenes');
    }
    
    if (issueTypes.has('missing_engagement')) {
      recommendations.push('🤔 Include reflective prompts: "Think about..." or "Ask yourself..."');
    }
    
    if (issueTypes.has('shallow_content')) {
      recommendations.push('🏢 Add real-world workplace examples and applications');
    }
    
    if (issueTypes.has('pedagogical_depth')) {
      recommendations.push('🎓 Replace declarative statements with engaging explanations and examples');
    }

    return recommendations;
  },

  /**
   * Generate scene-specific recommendations
   */
  private generateSceneRecommendations(issues: QualityIssue[], segmentType: string): string[] {
    const recommendations: string[] = [];
    
    issues.forEach(issue => {
      switch (issue.type) {
        case 'missing_context':
          recommendations.push(`Add relevance: "Why does this matter in your work?"`);
          break;
        case 'missing_engagement':
          recommendations.push(`Add reflection: "Think about how you would apply this..."`);
          break;
        case 'shallow_content':
          recommendations.push(`Add workplace examples and practical applications`);
          break;
        case 'pedagogical_depth':
          recommendations.push(`Replace statements with explanations, examples, and engagement`);
          break;
      }
    });

    // Add segment-specific recommendations
    switch (segmentType) {
      case 'TEACH':
        recommendations.push('Use conversational tone and analogies to explain concepts');
        break;
      case 'EXAMPLE':
        recommendations.push('Include character dialogue and decision-making process');
        break;
      case 'PRACTICE':
        recommendations.push('Provide clear success criteria and guidance');
        break;
      case 'ASSESSMENT':
        recommendations.push('Focus on learning, not testing - include constructive feedback');
        break;
    }

    return recommendations;
  },

  // Helper methods for content analysis
  private hasWhyItMatters(content: string): boolean {
    const whyPatterns = [
      /why.*matters/i,
      /important because/i,
      /critical for/i,
      /essential to/i,
      /helps you/i,
      /enables you/i
    ];
    return whyPatterns.some(pattern => pattern.test(content));
  },

  private hasReflectivePrompt(content: string): boolean {
    const reflectivePatterns = [
      /think about/i,
      /ask yourself/i,
      /consider/i,
      /reflect on/i,
      /imagine/i,
      /what would you/i,
      /how would you/i
    ];
    return reflectivePatterns.some(pattern => pattern.test(content));
  },

  private hasRealWorldConnection(content: string): boolean {
    const realWorldPatterns = [
      /in your role/i,
      /at work/i,
      /in the workplace/i,
      /your team/i,
      /your organization/i,
      /for example/i,
      /such as/i
    ];
    return realWorldPatterns.some(pattern => pattern.test(content));
  },

  private hasConcreteExamples(content: string): boolean {
    const examplePatterns = [
      /for example/i,
      /such as/i,
      /like when/i,
      /imagine/i,
      /picture this/i,
      /consider this/i
    ];
    return examplePatterns.some(pattern => pattern.test(content));
  },

  private hasConversationalTone(content: string): boolean {
    const conversationalPatterns = [
      /\byou\b/g,
      /\byour\b/g,
      /let's/i,
      /we can/i,
      /we'll/i,
      /here's how/i
    ];
    
    const youCount = (content.match(/\byou\b/g) || []).length;
    const yourCount = (content.match(/\byour\b/g) || []).length;
    
    return (youCount + yourCount) >= 3; // Conversational tone uses "you" frequently
  }
};
