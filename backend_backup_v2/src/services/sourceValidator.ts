/**
 * ==================================================================
 * SOURCE VALIDATOR - PREVENTS AI HALLUCINATIONS
 * ==================================================================
 * 
 * This service validates that generated content strictly adheres to 
 * the provided source material and prevents common hallucinations:
 * 
 * - Coaching content when source doesn't mention coaching
 * - Character names not in source material
 * - Concepts not present in the original source
 * - Generic content that ignores source specifics
 * ==================================================================
 */

export interface ValidationResult {
  isValid: boolean;
  issues: string[];
  requiresRegeneration: boolean;
  confidenceScore: number; // 0-100, higher = more source-compliant
  sourceCoverage: number; // Percentage of source concepts used
}

export class SourceValidator {
  /**
   * Validate that generated content strictly uses only source material
   */
  static validateSourceUsage(generatedContent: string, sourceMaterial: string): ValidationResult {
    const issues: string[] = [];
    let confidenceScore = 100;
    
    if (!sourceMaterial || sourceMaterial.trim().length === 0) {
      return {
        isValid: false,
        issues: ['No source material provided for validation'],
        requiresRegeneration: true,
        confidenceScore: 0,
        sourceCoverage: 0
      };
    }

    const sourceLower = sourceMaterial.toLowerCase();
    const generatedLower = generatedContent.toLowerCase();
    
    // Extract key concepts from source material
    const sourceConcepts = this.extractKeyConcepts(sourceMaterial);
    const generatedConcepts = this.extractKeyConcepts(generatedContent);
    
    // Calculate source coverage
    const usedConcepts = generatedConcepts.filter(concept => 
      sourceConcepts.some(sourceConcept => 
        sourceConcept.toLowerCase().includes(concept.toLowerCase()) ||
        concept.toLowerCase().includes(sourceConcept.toLowerCase())
      )
    );
    const sourceCoverage = sourceConcepts.length > 0 ? (usedConcepts.length / sourceConcepts.length) * 100 : 0;
    
    // CRITICAL VALIDATION: Detect coaching hallucinations
    if (!sourceLower.includes('coach') && !sourceLower.includes('coaching') && generatedLower.includes('coach')) {
      issues.push('HALLUCINATION: Generated coaching content not in source material');
      confidenceScore -= 30;
    }
    
    // CRITICAL VALIDATION: Detect character hallucinations
    const commonNames = ['alex', 'jordan', 'sarah', 'david', 'emma', 'mike', 'lisa', 'tom', 'jamie'];
    const hallucinatedNames = commonNames.filter(name => 
      generatedLower.includes(name) && !sourceLower.includes(name)
    );
    if (hallucinatedNames.length > 0) {
      issues.push(`HALLUCINATION: Generated character names not in source: ${hallucinatedNames.join(', ')}`);
      confidenceScore -= 20;
    }
    
    // CRITICAL VALIDATION: Detect generic content that ignores source specifics
    const sourceSpecificTerms = this.extractSpecificTerms(sourceMaterial);
    const hasSpecificContent = sourceSpecificTerms.some(term => 
      generatedLower.includes(term.toLowerCase())
    );
    if (!hasSpecificContent && sourceSpecificTerms.length > 0) {
      issues.push('WARNING: Generated content lacks source-specific terminology');
      confidenceScore -= 15;
    }
    
    // VALIDATION: Check for topic mismatch
    const topicMismatch = this.detectTopicMismatch(sourceMaterial, generatedContent);
    if (topicMismatch) {
      issues.push(`TOPIC MISMATCH: ${topicMismatch}`);
      confidenceScore -= 25;
    }
    
    // VALIDATION: Check source coverage
    if (sourceCoverage < 30) {
      issues.push(`LOW SOURCE COVERAGE: Only ${sourceCoverage.toFixed(1)}% of source concepts used`);
      confidenceScore -= 20;
    }
    
    // VALIDATION: Detect completely generic content
    const genericPatterns = [
      'effective communication',
      'team building',
      'leadership skills',
      'time management',
      'professional development'
    ];
    const hasGenericContent = genericPatterns.some(pattern => 
      generatedLower.includes(pattern) && !sourceLower.includes(pattern)
    );
    if (hasGenericContent) {
      issues.push('WARNING: Generated generic content not grounded in source material');
      confidenceScore -= 10;
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      requiresRegeneration: issues.some(issue => issue.includes('HALLUCINATION') || issue.includes('TOPIC MISMATCH')),
      confidenceScore: Math.max(0, confidenceScore),
      sourceCoverage
    };
  }

  /**
   * Extract key concepts from text
   */
  private static extractKeyConcepts(text: string): string[] {
    // Remove common words and extract meaningful terms
    const stopWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'a', 'an']);
    
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word))
      .filter((word, index, arr) => arr.indexOf(word) === index) // Remove duplicates
      .slice(0, 20); // Limit to top 20 concepts
  }

  /**
   * Extract specific terminology from source material
   */
  private static extractSpecificTerms(text: string): string[] {
    // Look for capitalized terms, technical terms, and specific phrases
    const specificTerms: string[] = [];
    
    // Extract capitalized words (potential proper nouns/technical terms)
    const capitalized = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
    specificTerms.push(...capitalized.map(term => term.toLowerCase()));
    
    // Extract quoted terms
    const quoted = text.match(/"([^"]+)"/g) || [];
    specificTerms.push(...quoted.map(term => term.replace(/"/g, '').toLowerCase()));
    
    // Extract technical/specific phrases (3+ words)
    const phrases = text.match(/\b\w+\s+\w+\s+\w+(?:\s+\w+)*\b/g) || [];
    specificTerms.push(...phrases.map(phrase => phrase.toLowerCase()));
    
    return [...new Set(specificTerms)].slice(0, 15); // Remove duplicates and limit
  }

  /**
   * Detect topic mismatch between source and generated content
   */
  private static detectTopicMismatch(source: string, generated: string): string | null {
    const sourceLower = source.toLowerCase();
    const generatedLower = generated.toLowerCase();
    
    // Define topic categories and their indicators
    const topicCategories = {
      'safety': ['safety', 'hazard', 'ppe', 'incident', 'emergency', 'protocol'],
      'compliance': ['compliance', 'policy', 'regulation', 'legal', 'violation'],
      'technical': ['software', 'system', 'technical', 'programming', 'code'],
      'leadership': ['leadership', 'management', 'supervisor', 'team lead'],
      'communication': ['communication', 'presentation', 'meeting', 'discussion'],
      'sales': ['sales', 'customer', 'client', 'revenue', 'deal'],
      'coaching': ['coaching', 'mentoring', 'development', 'feedback']
    };
    
    // Find dominant topics in source
    const sourceTopics = Object.entries(topicCategories)
      .filter(([_, indicators]) => 
        indicators.some(indicator => sourceLower.includes(indicator))
      )
      .map(([topic]) => topic);
    
    // Find dominant topics in generated content
    const generatedTopics = Object.entries(topicCategories)
      .filter(([_, indicators]) => 
        indicators.some(indicator => generatedLower.includes(indicator))
      )
      .map(([topic]) => topic);
    
    // Check for major mismatches
    if (sourceTopics.length > 0 && generatedTopics.length > 0) {
      const hasOverlap = sourceTopics.some(topic => generatedTopics.includes(topic));
      if (!hasOverlap) {
        return `Source focuses on ${sourceTopics.join(', ')} but generated content focuses on ${generatedTopics.join(', ')}`;
      }
    }
    
    return null;
  }

  /**
   * Validate individual scene against source material
   */
  static validateScene(scene: any, sourceMaterial: string): ValidationResult {
    const sceneContent = [
      scene.content || '',
      scene.visual_description || '',
      scene.voiceover_script || '',
      scene.narrationScript || '',
      scene.onScreenText || ''
    ].join(' ');
    
    return this.validateSourceUsage(sceneContent, sourceMaterial);
  }

  /**
   * Get validation summary for multiple scenes
   */
  static validateStoryboard(storyboard: any, sourceMaterial: string): {
    overall: ValidationResult;
    sceneResults: ValidationResult[];
    recommendations: string[];
  } {
    const sceneResults = storyboard.scenes?.map((scene: any) => 
      this.validateScene(scene, sourceMaterial)
    ) || [];
    
    const allIssues = sceneResults.flatMap(result => result.issues);
    const avgConfidence = sceneResults.length > 0 
      ? sceneResults.reduce((sum, result) => sum + result.confidenceScore, 0) / sceneResults.length
      : 0;
    const avgCoverage = sceneResults.length > 0
      ? sceneResults.reduce((sum, result) => sum + result.sourceCoverage, 0) / sceneResults.length
      : 0;
    
    const overall = {
      isValid: sceneResults.every(result => result.isValid),
      issues: allIssues,
      requiresRegeneration: sceneResults.some(result => result.requiresRegeneration),
      confidenceScore: avgConfidence,
      sourceCoverage: avgCoverage
    };
    
    const recommendations = this.generateRecommendations(overall, sceneResults);
    
    return {
      overall,
      sceneResults,
      recommendations
    };
  }

  /**
   * Generate recommendations based on validation results
   */
  private static generateRecommendations(overall: ValidationResult, sceneResults: ValidationResult[]): string[] {
    const recommendations: string[] = [];
    
    if (overall.confidenceScore < 70) {
      recommendations.push('Regenerate content with stricter source material adherence');
    }
    
    if (overall.sourceCoverage < 40) {
      recommendations.push('Include more specific terminology from source material');
    }
    
    const hallucinationCount = sceneResults.filter(result => 
      result.issues.some(issue => issue.includes('HALLUCINATION'))
    ).length;
    
    if (hallucinationCount > 0) {
      recommendations.push(`Remove ${hallucinationCount} scene(s) with hallucinated content`);
    }
    
    return recommendations;
  }
}

export default SourceValidator;
