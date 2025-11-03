/**
 * Pedagogical Orchestrator - Main Integration Service
 * 
 * Orchestrates the pedagogical intelligence layer by coordinating
 * Learning Architect, Client Context Steward, and Continuity Agent
 * to create pedagogically sound learning experiences.
 */

import { LearningArchitectAgent } from '../agents/learningArchitectAgent';
import { PedagogicalContinuityAgent } from '../agents/pedagogicalContinuityAgent';
import { ClientContextSteward } from '../agents/clientContextSteward';
import { SupabaseMemoryStore } from '../agents/memoryStore';
import { PedagogicalMetricsService } from './pedagogicalMetrics';
import { EmergencyTeachingEnforcer } from '../agents/EmergencyTeachingEnforcer';
import { CharacterManager } from './CharacterManager';
import { generateStoryboardFromOpenAI } from './openaiService';
import { ENABLE_CONTINUITY_AGENT } from '../config';
import type { 
  PedagogicalBlueprint, 
  ContinuityReport, 
  StoryboardModule,
  LearningRequest,
  SourceMaterial
} from '../../../packages/shared/src/types';

// Placeholder classes for the new pipeline - these would be implemented separately
class RAGOrchestrator {
  async retrieveForBlueprint(blueprint: PedagogicalBlueprint): Promise<string> {
    console.log('🔍 RAG Orchestrator retrieving context for blueprint...');
    return 'RAG context placeholder';
  }
}

class DrafterAgent {
  async generateWithConstraints(blueprint: PedagogicalBlueprint, ragContext: string): Promise<StoryboardModule> {
    console.log('📝 Drafter generating with constraints...');
    // This would call the existing storyboard generation logic
    return {} as StoryboardModule;
  }
}

class EditorAgent {
  async enhance(storyboard: StoryboardModule): Promise<StoryboardModule> {
    console.log('✨ Editor enhancing storyboard...');
    return storyboard;
  }
}

export class PedagogicalOrchestrator {
  private learningArchitect: LearningArchitectAgent;
  private continuityAgent: PedagogicalContinuityAgent;
  private clientSteward: ClientContextSteward;
  private memory: SupabaseMemoryStore;
  private metricsService: PedagogicalMetricsService;

  constructor() {
    this.learningArchitect = new LearningArchitectAgent();
    this.continuityAgent = new PedagogicalContinuityAgent();
    this.clientSteward = new ClientContextSteward();
    this.memory = new SupabaseMemoryStore();
    this.metricsService = new PedagogicalMetricsService();
  }

  /**
   * Main orchestration method - replaces simple blueprint generation
   */
  async orchestratePedagogicalGeneration(
    formData: any,
    sourceMaterial: SourceMaterial,
    existingRAGContext: string
  ): Promise<{
    storyboard: StoryboardModule;
    pedagogicalBlueprint: PedagogicalBlueprint;
    continuityReport: ContinuityReport;
    metrics: any;
  }> {
    
    console.log('🧠 Starting Pedagogical Orchestration...');
    
    // Step 1: Create Learning Request from form data
    const learningRequest: LearningRequest = {
      topic: formData.moduleName || formData.content?.slice(0, 100) || 'Learning Module',
      audience: formData.targetAudience || formData.audience || 'General Audience',
      duration: formData.durationMins || 20,
      objectives: formData.learningObjectives || [],
      difficultyLevel: formData.complexityLevel || 'intermediate'
    };

    // Step 2: Generate Pedagogical Blueprint
    console.log('📋 Generating Pedagogical Blueprint...');
    const pedagogicalBlueprint = await this.learningArchitect.generatePedagogicalBlueprint(
      learningRequest,
      sourceMaterial,
      this.memory
    );

    // Step 3: Enhance RAG with Client Context
    console.log('🔍 Enhancing RAG with Client Context...');
    const enhancedQuery = await this.clientSteward.enhanceRAGQuery(
      learningRequest,
      sourceMaterial,
      pedagogicalBlueprint
    );

    // Step 4: Generate storyboard with pedagogical guidance
    console.log('📝 Generating Storyboard with Pedagogical Guidance...');
    const storyboard = await this.generateStoryboardWithPedagogicalGuidance(
      formData,
      enhancedQuery,
      pedagogicalBlueprint,
      existingRAGContext
    );

    // Step 5: Validate and Repair Continuity
    console.log('🔧 Validating Pedagogical Continuity...');
    const continuityReport = await this.continuityAgent.validate(
      storyboard,
      pedagogicalBlueprint
    );
    console.log('🧩 Continuity validation complete. Assessment fallback ensured.');

    // Step 6: Calculate Comprehensive Metrics
    const metrics = this.metricsService.calculateMetrics(
      continuityReport.repairedStoryboard || storyboard,
      pedagogicalBlueprint,
      continuityReport
    );

    console.log('✅ Pedagogical Orchestration Complete');
    console.log(`📊 Metrics: Repetition: ${metrics.repetitionScore}, Alignment: ${metrics.alignmentScore}`);
    
    // Log detailed metrics report
    console.log(this.metricsService.generateMetricsReport(metrics, continuityReport));

    return {
      storyboard: continuityReport.repairedStoryboard || storyboard,
      pedagogicalBlueprint,
      continuityReport,
      metrics
    };
  }

  /**
   * Generate storyboard with pedagogical guidance
   */
  private async generateStoryboardWithPedagogicalGuidance(
    formData: any,
    enhancedQuery: any,
    pedagogicalBlueprint: PedagogicalBlueprint,
    existingRAGContext: string
  ): Promise<StoryboardModule> {
    
    // Import the existing OpenAI service
    const { generateStoryboardFromOpenAI } = require('./openaiService');
    
    // Enhance the RAG context with pedagogical guidance
    const pedagogicalContext = `
PEDAGOGICAL GUIDANCE:
Strategy: ${pedagogicalBlueprint.strategy}
Learning Flow: ${JSON.stringify(pedagogicalBlueprint.learningObjectiveFlow)}
Client Terminology: ${JSON.stringify(pedagogicalBlueprint.clientTerminology)}
Repetition Guards: ${pedagogicalBlueprint.repetitionGuards.join(', ')}

ENHANCED RAG CONTEXT:
${existingRAGContext}

PEDAGOGICAL REQUIREMENTS:
- Each learning objective must have complete teach→example→practice→assess cycle
- Use client terminology: ${Object.keys(pedagogicalBlueprint.clientTerminology).join(', ')}
- Avoid repetition: ${pedagogicalBlueprint.repetitionGuards.join(', ')}
- Ensure progressive complexity
- Align teaching with practice activities
`;

    // Generate with enhanced context
    const storyboard = await generateStoryboardFromOpenAI(formData, {
      ragContext: pedagogicalContext,
      aiModel: formData.aiModel || undefined,
    });

    return storyboard;
  }

  /**
   * NEW PEDAGOGICAL-FIRST PIPELINE - Main generation method
   */
  async generateStoryboard(learningRequest: LearningRequest): Promise<StoryboardModule> {
    console.log('🎯 Starting PEDAGOGICAL-FIRST generation pipeline');
    
    try {
      // PHASE 1: ARCHITECT FIRST – Design before building
      console.log('🧠 PHASE 1: Learning Architect generating blueprint...');
      const architect = new LearningArchitectAgent();
      const pedagogicalBlueprint = await architect.generatePedagogicalBlueprint(
        learningRequest,
        { summary: '', content: '', metadata: {} },
        this.memory
      );
      
      // HARD ENFORCEMENT: Teaching must come first
      const enforcedBlueprint = this.enforceTeachingFirst(pedagogicalBlueprint);
      
      // PHASE 2: RAG RETRIEVAL with pedagogical context
      console.log('🔍 PHASE 2: RAG retrieval with pedagogical context...');
      const ragOrchestrator = new RAGOrchestrator();
      const ragContext = await ragOrchestrator.retrieveForBlueprint(enforcedBlueprint);
      
      // PHASE 3: DRAFTING with constraints
      console.log('📝 PHASE 3: Drafting with constraints...');
      const drafter = new DrafterAgent();
      let storyboard = await drafter.generateWithConstraints(enforcedBlueprint, ragContext);
      
      // PHASE 4: CONTINUITY VALIDATION
      if (ENABLE_CONTINUITY_AGENT) {
        console.log('🔍 PHASE 4: Continuity validation...');
        const continuityAgent = new PedagogicalContinuityAgent();
        const continuityReport = await continuityAgent.validate(storyboard, enforcedBlueprint);
        console.log('🧩 Continuity validation complete. Assessment fallback ensured.');
        
        if (continuityReport.requiresRegeneration) {
          console.log('🔄 Continuity issues detected - attempting regeneration...');
          try {
            storyboard = await this.regenerateWithFixes(storyboard, continuityReport, enforcedBlueprint);
            console.log('✅ Regeneration completed successfully');
          } catch (regenerationError) {
            console.warn('⚠️ Regeneration failed, proceeding with original storyboard:', regenerationError);
          }
        } else {
          console.log(`✅ Continuity validation passed (score: ${continuityReport.overallScore}/100)`);
        }
      } else {
        console.log('⚠️ Continuity agent disabled, skipping validation');
      }
      
      // PHASE 5: EMERGENCY TEACHING ENFORCER (Safety net)
      console.log('🛡️ PHASE 5: Emergency teaching enforcer...');
      storyboard.scenes = EmergencyTeachingEnforcer.enforceTeachingFirst(storyboard.scenes);
      
      // PHASE 6: CHARACTER DIVERSITY
      console.log('👥 PHASE 6: Character diversity management...');
      storyboard.scenes = CharacterManager.assignCharacters(storyboard.scenes);
      
      // PHASE 7: FINAL POLISH
      console.log('✨ PHASE 7: Final polish...');
      const editor = new EditorAgent();
      storyboard = await editor.enhance(storyboard);
      
      console.log('✅ Pedagogical generation complete');
      return storyboard;
      
    } catch (error) {
      console.error('💥 Error in pedagogical-first pipeline:', error);
      console.log('🔄 Falling back to emergency generation...');
      return await this.emergencyFallbackGeneration(learningRequest);
    }
  }

  /**
   * Helper method to enforce teaching-first principle in blueprint
   */
  private enforceTeachingFirst(blueprint: PedagogicalBlueprint): PedagogicalBlueprint {
    // Note: PedagogicalBlueprint doesn't have segments property in current schema
    // This is a placeholder for future implementation
    console.log('🔄 Enforcing teaching-first principle in blueprint');
    return blueprint;
  }

  /**
   * Regenerate storyboard with continuity fixes
   */
  private async regenerateWithFixes(
    storyboard: StoryboardModule,
    continuityReport: ContinuityReport,
    blueprint: PedagogicalBlueprint
  ): Promise<StoryboardModule> {
    console.log('🔄 Regenerating with continuity fixes...');
    
    try {
      // Extract repair recommendations
      const repairs = continuityReport.issues.map(issue => issue.recommendation);
      const fixesText = repairs.join('\n- ');
      
      // Create enhanced prompt with continuity fixes
      const enhancedPrompt = `
CONTINUITY FIXES REQUIRED:
${fixesText}

ORIGINAL STORYBOARD:
${JSON.stringify(storyboard, null, 2)}

PEDAGOGICAL BLUEPRINT:
${JSON.stringify(blueprint, null, 2)}

Please regenerate the storyboard addressing the continuity issues while maintaining the pedagogical blueprint structure.
`;
      
      // Use the OpenAI service for regeneration
      const regeneratedStoryboard = await generateStoryboardFromOpenAI({
        moduleName: (storyboard as any).title || 'Regenerated Module',
        targetAudience: 'General Audience',
        durationMins: 20,
        learningObjectives: ['Apply continuity fixes'],
        complexityLevel: 'intermediate'
      }, {
        ragContext: enhancedPrompt,
        aiModel: 'gpt-4o'
      });
      
      console.log('✅ Storyboard regenerated with continuity fixes');
      return regeneratedStoryboard as any; // Type assertion for compatibility
      
    } catch (error) {
      console.error('❌ Regeneration failed:', error);
      throw error;
    }
  }

  /**
   * Generate human-readable blueprint summary for debugging
   */
  generateBlueprintSummary(
    pedagogicalBlueprint: PedagogicalBlueprint,
    continuityReport: ContinuityReport,
    metrics: any
  ): string {
    return `
🧠 PEDAGOGICAL BLUEPRINT SUMMARY
================================

STRATEGY: ${pedagogicalBlueprint.strategy}
LEARNING OBJECTIVES: ${pedagogicalBlueprint.learningObjectiveFlow.length}

LEARNING FLOW:
${pedagogicalBlueprint.learningObjectiveFlow.map((lo, i) => `
${i + 1}. ${lo.objective}
   Teaching: ${lo.teachingApproach}
   Example: ${lo.exampleType}
   Practice: ${lo.practiceModality}
   Assessment: ${lo.assessmentMethod}
   Time: ${JSON.stringify(lo.timeAllocation)}
`).join('')}

CLIENT TERMINOLOGY:
${Object.entries(pedagogicalBlueprint.clientTerminology).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

REPETITION GUARDS:
${pedagogicalBlueprint.repetitionGuards.map(guard => `- ${guard}`).join('\n')}

CONTINUITY ISSUES: ${continuityReport.issues.length}
${continuityReport.issues.map(issue => `- ${issue.type}: ${issue.description} (${issue.severity})`).join('\n')}

METRICS:
- Repetition Score: ${metrics.repetitionScore}
- Alignment Score: ${metrics.alignmentScore}
- Terminology Adherence: ${metrics.terminologyAdherence}
- Progressive Complexity: ${metrics.progressiveComplexity}
`;
  }

  /**
   * Emergency fallback generation method
   */
  private async emergencyFallbackGeneration(
    learningRequest: LearningRequest
  ): Promise<StoryboardModule> {
    console.log('🔄 Using emergency fallback to existing openAIService');
    try {
      // Direct call to proven generation logic
      return await generateStoryboardFromOpenAI({
        moduleName: learningRequest.topic,
        targetAudience: learningRequest.audience,
        durationMins: learningRequest.duration,
        learningObjectives: learningRequest.objectives,
        complexityLevel: learningRequest.difficultyLevel
      }, {
        ragContext: `Emergency fallback generation for: ${learningRequest.topic}`,
        aiModel: 'gpt-4o'
      }) as any; // Type assertion to handle type conflicts
    } catch (err) {
      console.error('❌ Emergency fallback failed:', err);
      throw err;
    }
  }
}
