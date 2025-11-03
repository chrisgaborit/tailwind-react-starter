/**
 * Learning Architect Agent - Pedagogical Intelligence Layer
 * 
 * Creates pedagogical blueprints that guide the entire learning experience
 * by analyzing content type, audience, and learning objectives to determine
 * the optimal teaching strategy and learning flow.
 */

import { OpenAI } from 'openai';
import type { 
  PedagogicalBlueprint, 
  LearningRequest, 
  SourceMaterial, 
  MemoryStore 
} from '../../../packages/shared/src/types';

export class LearningArchitectAgent {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Generate a comprehensive pedagogical blueprint for the learning experience
   */
  async generatePedagogicalBlueprint(
    learningRequest: LearningRequest,
    sourceMaterial: SourceMaterial,
    memory: MemoryStore
  ): Promise<PedagogicalBlueprint> {
    
    const similarPatterns = await memory.getSimilarPatterns(learningRequest);
    const pastFailures = await memory.getPedagogicalFailures();

    const prompt = `
You are the Lead Learning Architect. Create a pedagogical strategy for:

TOPIC: ${learningRequest.topic}
AUDIENCE: ${learningRequest.audience}
DURATION: ${learningRequest.duration} minutes
LEARNING OBJECTIVES: ${JSON.stringify(learningRequest.objectives)}
DIFFICULTY LEVEL: ${learningRequest.difficultyLevel}
CLIENT SOURCE MATERIAL: ${sourceMaterial.summary}

ANALYZE FROM MEMORY:
${similarPatterns}

PAST FAILURES TO AVOID:
${pastFailures}

OUTPUT JSON with:
1. "strategy": Choose pedagogical approach based on content type:
   - "scaffolded-progressive": For complex skills that build on each other
   - "case-based": For real-world application scenarios
   - "problem-centered": For analytical thinking and problem-solving
   - "principle-driven": For conceptual understanding and frameworks

2. "learningObjectiveFlow": Array with complete learning cycle per objective:
   - "objective": The learning objective text
   - "teachingApproach": How to teach it (metaphor, direct-instruction, discovery, contrast)
   - "exampleType": What kind of example (case-study, scenario, demonstration, analogy)
   - "practiceModality": How to practice (simulation, drag-drop, branching, reflection)
   - "assessmentMethod": How to assess (decision-tree, multiple-choice, performance, self-assessment)
   - "timeAllocation": Time distribution across teach/example/practice/assess

3. "repetitionGuards": Specific patterns to avoid based on past failures
4. "clientTerminology": Key terms that MUST be used from source material

CRITICAL: Ensure each LO gets complete learning cycle with varied modalities.
Avoid repetition of interactivity types or scenario patterns.
Use client's exact terminology and frameworks from source material.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const blueprint = JSON.parse(response.choices[0].message.content || '{}') as PedagogicalBlueprint;
      
      // Store successful pattern for future reference
      await memory.storePattern({
        learningRequest,
        blueprint,
        timestamp: new Date().toISOString()
      });

      return blueprint;
    } catch (error) {
      console.error('Learning Architect Agent error:', error);
      throw new Error('Failed to generate pedagogical blueprint');
    }
  }

  /**
   * Analyze content type to determine optimal pedagogical strategy
   */
  private analyzeContentType(sourceMaterial: SourceMaterial): string {
    const content = sourceMaterial.content.toLowerCase();
    
    if (content.includes('framework') || content.includes('model') || content.includes('process')) {
      return 'principle-driven';
    } else if (content.includes('scenario') || content.includes('case') || content.includes('example')) {
      return 'case-based';
    } else if (content.includes('problem') || content.includes('challenge') || content.includes('solve')) {
      return 'problem-centered';
    } else {
      return 'scaffolded-progressive';
    }
  }

  /**
   * Extract key terminology from source material
   */
  private extractClientTerminology(sourceMaterial: SourceMaterial): { [key: string]: string } {
    const terminology: { [key: string]: string } = {};
    
    // Extract capitalized terms, acronyms, and framework names
    const content = sourceMaterial.content;
    const capitalizedTerms = content.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
    const acronyms = content.match(/\b[A-Z]{2,}\b/g) || [];
    
    [...capitalizedTerms, ...acronyms].forEach(term => {
      if (term.length > 2) {
        terminology[term] = term;
      }
    });

    return terminology;
  }
}
