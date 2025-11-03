// backend/src/agents/FrameworkSelector.ts

/**
 * Framework Selector - Replaces Rigid TEACH→PRACTICE Loop
 * 
 * Dynamically selects learning framework based on content type:
 * - Narrative: Soft skills, leadership, management
 * - Problem-Solving: Technical, procedural
 * - Scenario-Based: Compliance, safety
 * 
 * NO MORE TRIPLETS - Adaptive scene structure
 */

import { detectContentTypes, ContentDetectionResult } from '../logic/ContentTypeDetector';

export interface Framework {
  name: string;
  structure: string[];
  interactions: string[];
  sceneCount: { min: number; max: number };
  narrativeFocus: boolean;
  characterRequired: boolean;
}

export const FRAMEWORKS = {
  narrative: {
    name: "Narrative Framework",
    structure: ["HOOK", "CHARACTER_INTRO", "CHALLENGE", "BREAKTHROUGH", "MASTERY", "ACTION"],
    interactions: ["branching_scenario", "conversation_simulator", "video_analysis", "reflection_journal"],
    sceneCount: { min: 6, max: 10 },
    narrativeFocus: true,
    characterRequired: true
  },
  
  problem_solving: {
    name: "Problem-Solving Framework",
    structure: ["PROBLEM", "DIAGNOSTIC", "SOLUTION_BUILD", "IMPLEMENT", "VERIFY", "REFLECT"],
    interactions: ["decision_tree", "procedural_demo", "case_study_analysis", "simulation_exercise"],
    sceneCount: { min: 6, max: 9 },
    narrativeFocus: false,
    characterRequired: false
  },
  
  scenario_based: {
    name: "Scenario-Based Framework",
    structure: ["CRITICAL_INCIDENT", "ANALYSIS", "DECISION_POINTS", "CONSEQUENCES", "BEST_PRACTICE", "APPLICATION"],
    interactions: ["branching_scenario", "decision_tree", "case_study_analysis", "timeline_sequencing"],
    sceneCount: { min: 6, max: 8 },
    narrativeFocus: true,
    characterRequired: true
  },
  
  immersive_practice: {
    name: "Immersive Practice Framework",
    structure: ["CONTEXT_SET", "SKILL_DEMO", "GUIDED_PRACTICE", "INDEPENDENT_PRACTICE", "CHALLENGE", "MASTERY"],
    interactions: ["procedural_demo", "simulation_exercise", "conversation_simulator", "branching_scenario"],
    sceneCount: { min: 6, max: 10 },
    narrativeFocus: true,
    characterRequired: true
  }
};

export class FrameworkSelector {
  
  /**
   * Select optimal framework based on content analysis
   */
  selectFramework(
    topic: string, 
    outcomes: string[], 
    audience?: string,
    sourceMaterial?: string
  ): { framework: Framework; reasoning: string; contentAnalysis: ContentDetectionResult } {
    
    console.log('🎯 FrameworkSelector: Analyzing content for framework selection...');
    
    // Detect content type
    const contentAnalysis = detectContentTypes({
      topic,
      learningOutcomes: outcomes,
      context: sourceMaterial,
      audience
    });

    console.log(`   📊 Content Domain: ${contentAnalysis.contentDomain}`);
    console.log(`   🎭 Narrative Tone: ${contentAnalysis.narrativeTone}`);

    // Map domain to framework
    const framework = this.mapDomainToFramework(contentAnalysis.contentDomain);
    
    const reasoning = this.buildReasoning(contentAnalysis, framework);
    
    console.log(`   ✅ Selected Framework: ${framework.name}`);
    console.log(`   📋 Structure: ${framework.structure.join(' → ')}`);
    console.log(`   🎮 Primary Interactions: ${framework.interactions.slice(0, 3).join(', ')}`);
    console.log(`   📏 Scene Range: ${framework.sceneCount.min}-${framework.sceneCount.max} scenes`);

    return {
      framework,
      reasoning,
      contentAnalysis
    };
  }

  /**
   * Map content domain to appropriate framework
   */
  private mapDomainToFramework(domain: string): Framework {
    const frameworkMap: Record<string, Framework> = {
      'emotional': FRAMEWORKS.narrative,
      'leadership': FRAMEWORKS.narrative,
      'procedural': FRAMEWORKS.problem_solving,
      'technical': FRAMEWORKS.problem_solving,
      'compliance': FRAMEWORKS.scenario_based,
      'safety': FRAMEWORKS.scenario_based,
      'product': FRAMEWORKS.immersive_practice
    };

    return frameworkMap[domain] || FRAMEWORKS.narrative; // Default to narrative
  }

  /**
   * Build reasoning for framework selection
   */
  private buildReasoning(contentAnalysis: ContentDetectionResult, framework: Framework): string {
    return `Selected ${framework.name} because content is ${contentAnalysis.contentDomain}-focused with ${contentAnalysis.narrativeTone} tone. ${contentAnalysis.reasoning} This framework uses ${framework.structure.length} core phases with ${framework.characterRequired ? 'character-driven' : 'principle-focused'} learning.`;
  }

  /**
   * Get scene count recommendation
   */
  getRecommendedSceneCount(framework: Framework, outcomesCount: number): number {
    // Dynamic scene count based on framework + outcomes
    const baseScenes = framework.structure.length;
    const outcomeFactor = Math.min(outcomesCount, 3); // Cap at 3 outcomes
    const total = baseScenes + outcomeFactor;
    
    return Math.max(
      framework.sceneCount.min,
      Math.min(total, framework.sceneCount.max)
    );
  }

  /**
   * Check if framework requires characters
   */
  requiresCharacters(framework: Framework): boolean {
    return framework.characterRequired;
  }
}

export default FrameworkSelector;


