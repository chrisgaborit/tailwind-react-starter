/**
 * Learning Architect Agent - Enhanced Pedagogical Intelligence Layer
 * 
 * Creates intelligent pedagogical blueprints that guide the entire learning experience
 * by analyzing content type, audience, and learning objectives to determine
 * the optimal teaching strategy and learning flow with real Teach → Example → Practice → Assess cycles.
 */

import { v4 as uuidv4 } from 'uuid';
import { pedagogicalQualityAgent } from '../services/pedagogicalPatterns';
import type { 
  PedagogicalBlueprint, 
  LearningRequest, 
  SourceMaterial, 
  MemoryStore,
  LearningObjective,
  PedagogicalSegment
} from '../../../packages/shared/src/types';

export const learningArchitectAgent = {
  async generateBlueprint(
    learningRequest: LearningRequest
  ): Promise<PedagogicalBlueprint> {
    console.log('🧠 Generating intelligent pedagogical blueprint...');

    // 1️⃣ Analyze content type & duration
    const { contentType, complexity } = this.analyzeLearningRequest(learningRequest);

    // 2️⃣ Generate learning objectives
    const learningObjectives = await this.generateLearningObjectives(learningRequest);

    // 3️⃣ Build segments per LO using Teach → Example → Practice → Assess
    const segments: PedagogicalSegment[] = [];
    for (const lo of learningObjectives) {
      const loSegments = this.createLearningCycle(lo, learningRequest.duration);
      segments.push(...loSegments);
    }

    // 4️⃣ Return structured, teaching-first blueprint
    return this.enforceTeachingFirstStructure({
      id: uuidv4(),
      learning_objectives: learningObjectives,
      segments,
      total_duration: learningRequest.duration,
      pedagogical_strategy: this.selectPedagogicalStrategy(contentType, complexity),
      strategy: this.selectPedagogicalStrategy(contentType, complexity) as any,
      learningObjectiveFlow: learningObjectives.map(lo => ({
        objective: lo.description,
        teachingApproach: 'direct-instruction' as const,
        exampleType: 'scenario' as const,
        practiceModality: 'simulation' as const,
        assessmentMethod: 'decision-tree' as const,
        timeAllocation: { teach: 40, example: 20, practice: 25, assess: 15 }
      })),
      repetitionGuards: ['Avoid repeating same interaction types', 'Ensure progressive complexity'],
      clientTerminology: this.extractClientTerminology(learningRequest)
    });
  },

  createLearningCycle(lo: LearningObjective, totalDuration: number): PedagogicalSegment[] {
    const segments: PedagogicalSegment[] = [];
    const loDuration = totalDuration / 3; // simple allocation

    segments.push(this.createTeachingSegment(lo, loDuration * 0.4));
    segments.push(this.createExampleSegment(lo, loDuration * 0.2));
    segments.push(this.createPracticeSegment(lo, loDuration * 0.25));
    segments.push(this.createAssessmentSegment(lo, loDuration * 0.15));

    return segments;
  },

  createTeachingSegment(learningObjective: LearningObjective, duration: number): PedagogicalSegment {
    const pedagogicalInstructions = pedagogicalQualityAgent.generatePedagogicalInstructions(
      'TEACH', 
      learningObjective.description, 
      'professional learners'
    );

    return {
      id: `teach-${learningObjective.id}`,
      learning_objective: learningObjective.id,
      segment_type: 'teach',
      duration: duration,
      description: `Teach: ${learningObjective.description}`,
      // 🆕 CRITICAL: Add pedagogical instructions for the drafter
      pedagogical_instructions: {
        pattern: 'TEACH',
        required_elements: [
          "Start with WHY this matters to the audience",
          "Define the core concept clearly", 
          "Explain 2-3 key principles",
          "Connect to real workplace situations",
          "Include a reflective question for learners",
          "Use analogies or metaphors where helpful"
        ],
        forbidden_elements: [
          "Don't just state facts without context",
          "Avoid passive voice - use 'you' and 'your'",
          "No standalone statements without explanation"
        ],
        tone_guidance: "Conversational, supportive, and practical - like a coach explaining concepts",
        templates: pedagogicalInstructions.templates
      }
    } as any; // Type assertion for pedagogical_instructions field
  },

  createExampleSegment(learningObjective: LearningObjective, duration: number): PedagogicalSegment {
    const pedagogicalInstructions = pedagogicalQualityAgent.generatePedagogicalInstructions(
      'EXAMPLE', 
      learningObjective.description, 
      'professional learners'
    );

    return {
      id: `example-${learningObjective.id}`,
      learning_objective: learningObjective.id,
      segment_type: 'example',
      duration: duration,
      description: `Real-world example applying ${learningObjective.description}`,
      pedagogical_instructions: {
        pattern: 'EXAMPLE',
        required_elements: [
          "Introduce a realistic character in a workplace situation",
          "Present a clear challenge or opportunity",
          "Show the decision-making process",
          "Demonstrate the outcome and consequences",
          "Highlight the key learning takeaway"
        ],
        forbidden_elements: [
          "Don't make characters perfect - show real struggles",
          "Avoid unrealistic scenarios that don't match audience experience",
          "No generic outcomes without specific details"
        ],
        tone_guidance: "Narrative and engaging - like telling a story that your colleague experienced",
        templates: pedagogicalInstructions.templates
      }
    } as any;
  },

  createPracticeSegment(learningObjective: LearningObjective, duration: number): PedagogicalSegment {
    const pedagogicalInstructions = pedagogicalQualityAgent.generatePedagogicalInstructions(
      'PRACTICE', 
      learningObjective.description, 
      'professional learners'
    );

    return {
      id: `practice-${learningObjective.id}`,
      learning_objective: learningObjective.id,
      segment_type: 'practice',
      duration: duration,
      description: `Interactive practice for ${learningObjective.description}`,
      pedagogical_instructions: {
        pattern: 'PRACTICE',
        required_elements: [
          "Create a realistic practice scenario",
          "Provide clear guidance and support",
          "Include success criteria and feedback",
          "Allow for reflection on the experience",
          "Connect practice to real work applications"
        ],
        forbidden_elements: [
          "Don't create unrealistic practice scenarios",
          "Avoid practice without clear success criteria",
          "No practice without reflection opportunity"
        ],
        tone_guidance: "Supportive and encouraging - like a mentor guiding hands-on learning",
        templates: pedagogicalInstructions.templates
      }
    } as any;
  },

  createAssessmentSegment(learningObjective: LearningObjective, duration: number): PedagogicalSegment {
    const pedagogicalInstructions = pedagogicalQualityAgent.generatePedagogicalInstructions(
      'ASSESSMENT', 
      learningObjective.description, 
      'professional learners'
    );

    return {
      id: `assess-${learningObjective.id}`,
      learning_objective: learningObjective.id,
      segment_type: 'assessment',
      duration: duration,
      description: `Knowledge check for ${learningObjective.description}`,
      pedagogical_instructions: {
        pattern: 'ASSESSMENT',
        required_elements: [
          "Set context and remind of key concepts",
          "Present realistic assessment scenarios",
          "Provide clear success criteria",
          "Offer constructive feedback",
          "Connect assessment to ongoing learning"
        ],
        forbidden_elements: [
          "Don't create trick questions or gotcha moments",
          "Avoid assessments that don't connect to real work",
          "No assessment without clear success criteria"
        ],
        tone_guidance: "Supportive and constructive - like a coach checking progress, not testing",
        templates: pedagogicalInstructions.templates
      }
    } as any;
  },

  async generateLearningObjectives(learningRequest: LearningRequest): Promise<LearningObjective[]> {
    const topics = learningRequest.topics ?? ['Core Concepts'];
    return topics.map((topic, index) => ({
      id: `lo-${index + 1}`,
      description: `Understand and apply key principles of ${topic}`,
    }));
  },

  analyzeLearningRequest(learningRequest: LearningRequest) {
    const content = learningRequest.sourceMaterial?.content?.toLowerCase() || '';
    return {
      contentType: content.includes('procedure')
        ? 'procedural'
        : content.includes('concept')
        ? 'conceptual'
        : 'behavioral',
      complexity: learningRequest.duration > 20 ? 'high' : 'medium',
    };
  },

  enforceTeachingFirstStructure(blueprint: PedagogicalBlueprint): PedagogicalBlueprint {
    // ensure teaching segments come first within each LO
    const newSegments: PedagogicalSegment[] = [];
    blueprint.learning_objectives.forEach(lo => {
      const loSegs = blueprint.segments.filter(s => s.learning_objective === lo.id);
      const teachSeg = loSegs.find(s => s.segment_type === 'teach');
      if (teachSeg) {
        const others = loSegs.filter(s => s.id !== teachSeg.id);
        newSegments.push(teachSeg, ...others);
      } else {
        newSegments.push(...loSegs);
      }
    });
    blueprint.segments = newSegments;
    return blueprint;
  },

  selectPedagogicalStrategy(contentType: string, complexity: string) {
    if (contentType === 'procedural') return 'Guided Practice';
    if (complexity === 'high') return 'Scenario-Based Mastery';
    return 'Conceptual-Application';
  },

  extractClientTerminology(learningRequest: LearningRequest): { [key: string]: string } {
    const terminology: { [key: string]: string } = {};
    
    // Extract key terms from source material if available
    if (learningRequest.sourceMaterial?.content) {
      const content = learningRequest.sourceMaterial.content;
      const capitalizedTerms = content.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
      const acronyms = content.match(/\b[A-Z]{2,}\b/g) || [];
      
      [...capitalizedTerms, ...acronyms].forEach(term => {
        if (term.length > 2) {
          terminology[term] = term;
        }
      });
    }

    return terminology;
  },
};

// Legacy class for backward compatibility
export class LearningArchitectAgent {
  async generatePedagogicalBlueprint(
    learningRequest: LearningRequest,
    sourceMaterial: SourceMaterial,
    memory: MemoryStore
  ): Promise<PedagogicalBlueprint> {
    // Use the new agent implementation
    return await learningArchitectAgent.generateBlueprint(learningRequest);
  }
}
