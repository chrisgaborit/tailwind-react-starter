/**
 * ==================================================================
 * STRICT ORCHESTRATOR - ENFORCES SOURCE-ONLY GENERATION
 * ==================================================================
 * 
 * This orchestrator ensures that:
 * 1. Welcome Agent scenes are protected and always appear first
 * 2. All content strictly adheres to source material
 * 3. No hallucinations or generic content are generated
 * 4. Source validation is performed on all outputs
 * ==================================================================
 */

import { WelcomeAgent } from '../agents/welcomeAgent';
import { SourceValidator, ValidationResult } from './sourceValidator';
import { generateStoryboardFromOpenAI } from './openaiService';
import type { StoryboardModule, StoryboardScene } from '../types';

// Define LearningRequest interface
interface LearningRequest {
  topic: string;
  duration: number;
  audience?: string;
  sourceMaterial?: string;
  learningOutcomes?: string[];
  learningObjectives?: string;
  moduleName?: string;
  moduleType?: string;
  complexityLevel?: string;
  tone?: string;
  targetAudience?: string;
  [key: string]: any;
}

export class StrictOrchestrator {
  private readonly maxRetries = 3;
  private readonly minSourceCoverage = 60; // Minimum 60% source coverage required

  /**
   * Generate storyboard with strict source material enforcement
   */
  async generateStoryboard(learningRequest: LearningRequest): Promise<StoryboardModule> {
    console.log('🔒 STRICT MODE: Enforcing source-only generation');
    
    // Validate source exists
    if (!learningRequest.sourceMaterial || learningRequest.sourceMaterial.trim().length === 0) {
      throw new Error('No source material provided - strict mode requires source material');
    }

    console.log(`📄 Source material length: ${learningRequest.sourceMaterial.length} characters`);
    console.log(`🎯 Topic: ${learningRequest.topic}`);

    const scenes: StoryboardScene[] = [];
    
    // 🚨 WELCOME AGENT FIRST (PROTECTED - cannot be overwritten)
    console.log('👋 Generating protected welcome pages...');
    const welcomeAgent = new WelcomeAgent();
    const welcomeScenes = await welcomeAgent.generateWelcomePages(learningRequest);
    scenes.push(...welcomeScenes);
    console.log(`✅ Generated ${welcomeScenes.length} protected welcome scenes`);

    // 🚨 MAIN CONTENT WITH STRICT SOURCE ENFORCEMENT
    console.log('🔒 Generating main content with strict source enforcement...');
    const mainContent = await this.generateStrictContent(learningRequest);
    scenes.push(...mainContent);
    console.log(`✅ Generated ${mainContent.length} main content scenes`);

    // 🚨 VALIDATE NO HALLUCINATIONS (but skip validation for welcome scenes)
    console.log('🔍 Validating source compliance...');
    const mainContentOnly = scenes.slice(welcomeScenes.length);
    const validation = await this.validateContent(mainContentOnly, learningRequest.sourceMaterial);
    
    if (!validation.isValid) {
      console.error('❌ Source validation failed:', validation.issues);
      throw new Error(`Source validation failed: ${validation.issues.join(', ')}`);
    }

    console.log(`✅ Source validation passed (confidence: ${validation.confidenceScore.toFixed(1)}%, coverage: ${validation.sourceCoverage.toFixed(1)}%)`);

    // Build final storyboard
    const storyboard: StoryboardModule = {
      moduleName: learningRequest.moduleName || learningRequest.topic || 'Untitled Module',
      scenes: scenes,
      metadata: {
        generatedBy: 'strict_orchestrator',
        sourceValidation: {
          confidenceScore: validation.confidenceScore,
          sourceCoverage: validation.sourceCoverage,
          validatedAt: new Date().toISOString()
        },
        protectedWelcomeScenes: welcomeScenes.length,
        totalScenes: scenes.length
      }
    };

    return storyboard;
  }

  /**
   * Generate main content with strict source enforcement
   */
  private async generateStrictContent(learningRequest: LearningRequest): Promise<StoryboardScene[]> {
    let attempts = 0;
    let lastError: Error | null = null;

    while (attempts < this.maxRetries) {
      attempts++;
      console.log(`🔄 Attempt ${attempts}/${this.maxRetries} - Generating strict content...`);

      try {
        const prompt = this.buildStrictPrompt(learningRequest);
        
        // Create formData for the OpenAI service
        const formData = {
          topic: learningRequest.topic,
          learningObjectives: prompt,
          duration: learningRequest.duration,
          moduleName: learningRequest.moduleName || learningRequest.topic,
          moduleType: learningRequest.moduleType || 'Professional Skills',
          complexityLevel: learningRequest.complexityLevel || 'Level 1: Passive',
          tone: learningRequest.tone || 'Professional & Clear',
          targetAudience: learningRequest.audience || learningRequest.targetAudience || 'Corporate employees',
          sourceMaterial: learningRequest.sourceMaterial
        };

        const result = await generateStoryboardFromOpenAI(formData, {
          ragContext: learningRequest.sourceMaterial,
          aiModel: 'gpt-4o-mini', // Use cheaper model for strict generation
          strictMode: true
        });

        if (!result || !result.scenes || result.scenes.length === 0) {
          throw new Error('No scenes generated from OpenAI service');
        }

        // Validate the generated content
        const validation = SourceValidator.validateSourceUsage(
          JSON.stringify(result.scenes), 
          learningRequest.sourceMaterial
        );

        if (validation.confidenceScore >= 70 && validation.sourceCoverage >= this.minSourceCoverage) {
          console.log(`✅ Content validation passed on attempt ${attempts}`);
          return result.scenes;
        } else {
          console.warn(`⚠️ Content validation failed on attempt ${attempts}:`, validation.issues);
          lastError = new Error(`Validation failed: ${validation.issues.join(', ')}`);
          
          if (attempts === this.maxRetries) {
            throw lastError;
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error) {
        console.error(`❌ Attempt ${attempts} failed:`, error);
        lastError = error as Error;
        
        if (attempts === this.maxRetries) {
          break;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // If all attempts failed, generate fallback content
    console.log('🔄 All attempts failed, generating fallback content...');
    return this.generateFallbackContent(learningRequest);
  }

  /**
   * Build strict prompt that enforces source-only generation
   */
  private buildStrictPrompt(learningRequest: LearningRequest): string {
    const sourceText = learningRequest.sourceMaterial.substring(0, 8000); // Limit for token efficiency
    
    return `
🚨 STRICT SOURCE-ONLY GENERATION - CRITICAL INSTRUCTIONS:

TOPIC: ${learningRequest.topic}
DURATION: ${learningRequest.duration} minutes
AUDIENCE: ${learningRequest.audience || learningRequest.targetAudience || 'Corporate employees'}

SOURCE MATERIAL (USE ONLY THIS CONTENT):
${sourceText}

CRITICAL REQUIREMENTS:
1. DO NOT ADD coaching, mentoring, or leadership content unless explicitly mentioned in the source material
2. DO NOT CREATE character names (Alex, Jordan, Sarah, etc.) unless they appear in the source
3. DO NOT ADD generic business concepts not present in the source material
4. USE ONLY the terminology, concepts, and examples provided in the source material
5. If the source material is about time management, focus ONLY on time management concepts from the source
6. If the source material is about safety, focus ONLY on safety concepts from the source
7. DO NOT GENERATE SCENARIOS OR CHARACTERS - focus on the factual content from the source

OUTPUT REQUIREMENTS:
- Generate 8-12 scenes that directly teach concepts from the source material
- Each scene should reference specific information from the source
- Use the exact terminology and phrases from the source material
- Include knowledge checks that test understanding of source concepts
- NO WELCOME OR OUTCOME SCENES (these are handled separately)

VALIDATION CHECKLIST:
✓ Content directly references source material
✓ No hallucinated coaching scenarios
✓ No generic character names
✓ Terminology matches source material
✓ Concepts are grounded in provided source

Generate scenes that strictly adhere to the source material provided above.
    `;
  }

  /**
   * Validate generated content against source material
   */
  private async validateContent(scenes: StoryboardScene[], sourceMaterial: string): Promise<ValidationResult> {
    const contentString = JSON.stringify(scenes);
    const validation = SourceValidator.validateSourceUsage(contentString, sourceMaterial);
    
    console.log(`📊 Validation Results:`);
    console.log(`   Confidence Score: ${validation.confidenceScore.toFixed(1)}%`);
    console.log(`   Source Coverage: ${validation.sourceCoverage.toFixed(1)}%`);
    console.log(`   Issues Found: ${validation.issues.length}`);
    
    if (validation.issues.length > 0) {
      console.log(`   Issues: ${validation.issues.join('; ')}`);
    }
    
    return validation;
  }

  /**
   * Generate fallback content when strict generation fails
   */
  private generateFallbackContent(learningRequest: LearningRequest): StoryboardScene[] {
    console.log('🔄 Generating fallback content from source material...');
    
    const sourceText = learningRequest.sourceMaterial;
    const sentences = sourceText.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    const fallbackScenes: StoryboardScene[] = [];
    
    // Create scenes directly from source sentences
    for (let i = 0; i < Math.min(8, sentences.length); i++) {
      const sentence = sentences[i].trim();
      if (sentence.length > 0) {
        fallbackScenes.push({
          sceneNumber: i + 1,
          pageTitle: `Key Concept ${i + 1}`,
          title: `Key Concept ${i + 1}`,
          sceneTitle: `Key Concept ${i + 1}`,
          content: sentence,
          visual_description: `Clean slide with text: "${sentence.substring(0, 100)}..."`,
          voiceover_script: sentence,
          onScreenText: sentence.substring(0, 50) + '...',
          narrationScript: sentence,
          metadata: {
            generated_by: 'strict_orchestrator_fallback',
            source_direct: true,
            scene_number: i + 1
          }
        });
      }
    }
    
    console.log(`✅ Generated ${fallbackScenes.length} fallback scenes directly from source`);
    return fallbackScenes;
  }

  /**
   * Get validation summary for debugging
   */
  async getValidationSummary(storyboard: StoryboardModule, sourceMaterial: string): Promise<any> {
    const validation = SourceValidator.validateStoryboard(storyboard, sourceMaterial);
    
    return {
      overall: validation.overall,
      sceneCount: storyboard.scenes.length,
      protectedWelcomeScenes: storyboard.metadata?.protectedWelcomeScenes || 0,
      mainContentScenes: storyboard.scenes.length - (storyboard.metadata?.protectedWelcomeScenes || 0),
      recommendations: validation.recommendations,
      timestamp: new Date().toISOString()
    };
  }
}

export default StrictOrchestrator;
