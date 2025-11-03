/**
 * Client Context Steward - Enhanced RAG Intelligence
 * 
 * Enhances RAG queries with pedagogical context and client-specific content
 * to ensure retrieved content aligns with learning objectives and client terminology.
 */

import type { 
  EnhancedQuery, 
  LearningRequest, 
  SourceMaterial, 
  PedagogicalBlueprint, 
  CoreContent 
} from '../../../packages/shared/src/types';

export class ClientContextSteward {
  
  /**
   * Enhance RAG query with pedagogical and client context
   */
  async enhanceRAGQuery(
    learningRequest: LearningRequest,
    sourceMaterial: SourceMaterial,
    pedagogicalBlueprint: PedagogicalBlueprint
  ): Promise<EnhancedQuery> {
    
    const coreContent = this.extractCoreContent(sourceMaterial);
    const exclusionPatterns = await this.getOverusedPatterns();
    
    return {
      semanticQuery: this.buildSemanticQuery(learningRequest, pedagogicalBlueprint),
      requiredContent: coreContent,
      exclusionPatterns,
      pedagogicalFilters: {
        mustInclude: pedagogicalBlueprint.learningObjectiveFlow.map(lo => lo.teachingApproach),
        mustAvoid: pedagogicalBlueprint.repetitionGuards
      }
    };
  }

  /**
   * Build enhanced semantic query for RAG retrieval
   */
  private buildSemanticQuery(
    learningRequest: LearningRequest,
    pedagogicalBlueprint: PedagogicalBlueprint
  ): string {
    return `
      Find pedagogical patterns for:
      CONTENT TYPE: ${this.analyzeContentType(learningRequest)}
      AUDIENCE: ${learningRequest.audience}
      STRATEGY: ${pedagogicalBlueprint.strategy}
      ENGAGEMENT LEVEL: ${learningRequest.difficultyLevel}
      TEACHING APPROACHES: ${pedagogicalBlueprint.learningObjectiveFlow.map(lo => lo.teachingApproach).join(', ')}
      EXAMPLE TYPES: ${pedagogicalBlueprint.learningObjectiveFlow.map(lo => lo.exampleType).join(', ')}
      PRACTICE MODALITIES: ${pedagogicalBlueprint.learningObjectiveFlow.map(lo => lo.practiceModality).join(', ')}
    `;
  }

  /**
   * Extract core content from source material
   */
  private extractCoreContent(sourceMaterial: SourceMaterial): CoreContent {
    return {
      keyConcepts: this.extractKeyConcepts(sourceMaterial),
      preferredFrameworks: this.extractFrameworks(sourceMaterial),
      existingExamples: this.extractExamples(sourceMaterial),
      terminology: this.extractTerminology(sourceMaterial)
    };
  }

  /**
   * Extract key concepts from source material
   */
  private extractKeyConcepts(sourceMaterial: SourceMaterial): string[] {
    const content = sourceMaterial.content;
    const concepts: string[] = [];
    
    // Extract concepts from headings, bullet points, and definitions
    const headingMatches = content.match(/^#{1,6}\s+(.+)$/gm) || [];
    const bulletMatches = content.match(/^[-*]\s+(.+)$/gm) || [];
    const definitionMatches = content.match(/(\w+):\s*([^.\n]+)/g) || [];
    
    concepts.push(...headingMatches.map(h => h.replace(/^#{1,6}\s+/, '')));
    concepts.push(...bulletMatches.map(b => b.replace(/^[-*]\s+/, '')));
    concepts.push(...definitionMatches.map(d => d.split(':')[0]));
    
    return [...new Set(concepts)].slice(0, 10); // Limit to top 10 concepts
  }

  /**
   * Extract preferred frameworks from source material
   */
  private extractFrameworks(sourceMaterial: SourceMaterial): string[] {
    const content = sourceMaterial.content;
    const frameworks: string[] = [];
    
    // Look for framework patterns
    const frameworkPatterns = [
      /(\w+\s+Model)/gi,
      /(\w+\s+Framework)/gi,
      /(\w+\s+Process)/gi,
      /(\w+\s+Method)/gi,
      /(\w+\s+Approach)/gi
    ];
    
    frameworkPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        frameworks.push(...matches);
      }
    });
    
    return [...new Set(frameworks)].slice(0, 5); // Limit to top 5 frameworks
  }

  /**
   * Extract existing examples from source material
   */
  private extractExamples(sourceMaterial: SourceMaterial): string[] {
    const content = sourceMaterial.content;
    const examples: string[] = [];
    
    // Look for example patterns
    const examplePatterns = [
      /(?:For example|For instance|Example:|Case study:)\s*([^.\n]+)/gi,
      /(?:Scenario:|Situation:)\s*([^.\n]+)/gi,
      /(?:Consider:|Imagine:)\s*([^.\n]+)/gi
    ];
    
    examplePatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        examples.push(...matches.map(m => m.replace(/^(?:For example|For instance|Example:|Case study:|Scenario:|Situation:|Consider:|Imagine:)\s*/i, '')));
      }
    });
    
    return [...new Set(examples)].slice(0, 8); // Limit to top 8 examples
  }

  /**
   * Extract terminology from source material
   */
  private extractTerminology(sourceMaterial: SourceMaterial): { [key: string]: string } {
    const content = sourceMaterial.content;
    const terminology: { [key: string]: string } = {};
    
    // Extract capitalized terms, acronyms, and framework names
    const capitalizedTerms = content.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
    const acronyms = content.match(/\b[A-Z]{2,}\b/g) || [];
    const quotedTerms = content.match(/"([^"]+)"/g) || [];
    
    [...capitalizedTerms, ...acronyms, ...quotedTerms.map(q => q.replace(/"/g, ''))].forEach(term => {
      if (term.length > 2 && term.length < 50) {
        terminology[term] = term;
      }
    });

    return terminology;
  }

  /**
   * Analyze content type for pedagogical strategy
   */
  private analyzeContentType(learningRequest: LearningRequest): string {
    const topic = learningRequest.topic.toLowerCase();
    
    if (topic.includes('framework') || topic.includes('model') || topic.includes('process')) {
      return 'principle-driven';
    } else if (topic.includes('scenario') || topic.includes('case') || topic.includes('example')) {
      return 'case-based';
    } else if (topic.includes('problem') || topic.includes('challenge') || topic.includes('solve')) {
      return 'problem-centered';
    } else {
      return 'scaffolded-progressive';
    }
  }

  /**
   * Get overused patterns to avoid
   */
  private async getOverusedPatterns(): Promise<string[]> {
    // This would typically query a database or memory store
    // For now, return common patterns to avoid
    return [
      'Multiple choice questions in a row',
      'Same interactivity type repeated',
      'Generic scenarios without client context',
      'Framework re-teaching without application',
      'Assessment before practice'
    ];
  }

  /**
   * Validate retrieved content against pedagogical requirements
   */
  validateRetrievedContent(
    retrievedContent: any[],
    enhancedQuery: EnhancedQuery
  ): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    // Check for required content
    if (enhancedQuery.requiredContent.keyConcepts.length > 0) {
      const hasKeyConcepts = retrievedContent.some(content => 
        enhancedQuery.requiredContent.keyConcepts.some(concept => 
          content.text?.toLowerCase().includes(concept.toLowerCase())
        )
      );
      if (!hasKeyConcepts) {
        issues.push('Missing key concepts from source material');
      }
    }
    
    // Check for excluded patterns
    enhancedQuery.exclusionPatterns.forEach(pattern => {
      const hasExcludedPattern = retrievedContent.some(content => 
        content.text?.toLowerCase().includes(pattern.toLowerCase())
      );
      if (hasExcludedPattern) {
        issues.push(`Contains excluded pattern: ${pattern}`);
      }
    });
    
    return {
      valid: issues.length === 0,
      issues
    };
  }
}
