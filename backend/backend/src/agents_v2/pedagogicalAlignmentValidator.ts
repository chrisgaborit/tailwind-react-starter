// backend/src/agents_v2/pedagogicalAlignmentValidator.ts
import {
  Scene,
  InteractionDecision,
  PedagogicalValidation,
  OutcomeMap,
  DensityProfile
} from "./types";
import { DensityManager } from "./densityManager";
import { CognitiveLoadProtector } from "./cognitiveLoadProtector";

/**
 * Phase 2: Pedagogical Alignment Validator
 * Validates that interactions serve clear learning purposes and align with pedagogy
 */
export class PedagogicalAlignmentValidator {
  private densityManager: DensityManager;
  private loadProtector: CognitiveLoadProtector;
  
  constructor() {
    this.densityManager = new DensityManager();
    this.loadProtector = new CognitiveLoadProtector();
  }
  
  /**
   * Validate pedagogical quality of storyboard with interactions
   */
  validate(
    scenes: Scene[],
    interactionDecisions: InteractionDecision[],
    outcomeMap: OutcomeMap,
    densityProfile: DensityProfile
  ): PedagogicalValidation {
    console.log("\n✅ PedagogicalAlignmentValidator: Validating interaction quality");
    
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // 1. Validate outcome alignment
    const alignmentScore = this.validateOutcomeAlignment(
      scenes,
      interactionDecisions,
      outcomeMap,
      issues,
      recommendations
    );
    
    // 2. Validate purpose clarity
    const purposeClarityScore = this.validatePurposeClarity(
      interactionDecisions,
      issues,
      recommendations
    );
    
    // 3. Validate cognitive load balance
    const cognitiveLoadScore = this.validateCognitiveLoadBalance(
      scenes,
      issues,
      recommendations
    );
    
    // 4. Validate density and spacing
    const densityScore = this.validateDensityAndSpacing(
      scenes,
      densityProfile,
      issues,
      recommendations
    );
    
    // Calculate overall pedagogical score
    const pedagogicalScore = Math.round(
      (alignmentScore * 0.3 +
        purposeClarityScore * 0.25 +
        cognitiveLoadScore * 0.25 +
        densityScore * 0.2) * 100
    ) / 100;
    
    const isValid = pedagogicalScore >= 80 && issues.length === 0;
    
    console.log("   ✅ Pedagogical score:", pedagogicalScore);
    console.log("   ✅ Alignment score:", alignmentScore);
    console.log("   ✅ Purpose clarity:", purposeClarityScore);
    console.log("   ✅ Cognitive load:", cognitiveLoadScore);
    console.log("   ✅ Density:", densityScore);
    
    if (issues.length > 0) {
      console.log("   ⚠️  Issues found:", issues.length);
    }
    
    return {
      isValid,
      pedagogicalScore,
      alignmentScore: Math.round(alignmentScore * 100),
      purposeClarityScore: Math.round(purposeClarityScore * 100),
      cognitiveLoadScore: Math.round(cognitiveLoadScore * 100),
      densityScore: Math.round(densityScore * 100),
      issues,
      recommendations
    };
  }
  
  /**
   * Validate that interactions align with learning outcomes
   */
  private validateOutcomeAlignment(
    scenes: Scene[],
    decisions: InteractionDecision[],
    outcomeMap: OutcomeMap,
    issues: string[],
    recommendations: string[]
  ): number {
    let alignmentCount = 0;
    const interactionsWithPurpose = decisions.filter(d => d.prescription?.needed);
    
    // Check each outcome has at least one supporting interaction
    outcomeMap.outcomes.forEach(outcome => {
      const hasSupport = interactionsWithPurpose.some(decision => {
        // Safely handle sceneId parsing
        if (!decision.sceneId || typeof decision.sceneId !== 'string') {
          return false;
        }
        
        const sceneIndexMatch = decision.sceneId.match(/scene-(\d+)/);
        if (!sceneIndexMatch) {
          return false;
        }
        
        const sceneIndex = parseInt(sceneIndexMatch[1]);
        const scene = scenes[sceneIndex];
        
        if (!scene) {
          return false;
        }
        
        const sceneText = `${scene.pageTitle} ${scene.narrationScript || ''}`.toLowerCase();
        const outcomeTerms = outcome.outcome.toLowerCase().split(/\s+/).filter(w => w.length > 4);
        return outcomeTerms.some(term => sceneText.includes(term));
      });
      
      if (hasSupport) {
        alignmentCount++;
      } else {
        issues.push(`Learning outcome "${outcome.outcome}" lacks interactive practice`);
        recommendations.push(`Add scenario or practice for outcome: ${outcome.outcome}`);
      }
    });
    
    return alignmentCount / outcomeMap.outcomes.length;
  }
  
  /**
   * Validate that interactions have clear learning purposes
   */
  private validatePurposeClarity(
    decisions: InteractionDecision[],
    issues: string[],
    recommendations: string[]
  ): number {
    const interactionsWithPurpose = decisions.filter(d => d.prescription?.needed);
    
    if (interactionsWithPurpose.length === 0) {
      return 1; // No interactions = nothing to validate
    }
    
    let clarityCount = 0;
    
    interactionsWithPurpose.forEach(decision => {
      const prescription = decision.prescription!;
      
      // Check if rationale is clear and specific
      const hasRationale = prescription.pedagogicalRationale && 
                          prescription.pedagogicalRationale.length > 20;
      
      // Check if purpose is appropriate for type
      const purposeAppropriate = this.isPurposeAppropriateForType(
        prescription.type,
        prescription.purpose
      );
      
      if (hasRationale && purposeAppropriate) {
        clarityCount++;
      } else {
        if (!hasRationale) {
          issues.push(`Interaction at ${decision.sceneId} lacks clear pedagogical rationale`);
        }
        if (!purposeAppropriate) {
          issues.push(`Interaction type "${prescription.type}" not well-suited for purpose "${prescription.purpose}"`);
          recommendations.push(`Consider different interaction type for ${prescription.purpose} purpose`);
        }
      }
    });
    
    return clarityCount / interactionsWithPurpose.length;
  }
  
  /**
   * Validate cognitive load balance
   */
  private validateCognitiveLoadBalance(
    scenes: Scene[],
    issues: string[],
    recommendations: string[]
  ): number {
    const assessment = this.loadProtector.assessCumulativeLoad(scenes);
    
    if (assessment.overloadRisk) {
      issues.push("Cognitive overload risk detected");
      recommendations.push(...assessment.recommendations);
      return 0.4; // Low score for overload risk
    }
    
    if (assessment.currentLoad > 8) {
      issues.push("Cognitive load approaching maximum capacity");
      recommendations.push(...assessment.recommendations);
      return 0.6;
    }
    
    if (assessment.currentLoad < 3) {
      recommendations.push("Cognitive load is low - opportunity for more engagement");
      return 0.8;
    }
    
    // Ideal range
    return 1.0;
  }
  
  /**
   * Validate interaction density and spacing
   */
  private validateDensityAndSpacing(
    scenes: Scene[],
    densityProfile: DensityProfile,
    issues: string[],
    recommendations: string[]
  ): number {
    const validation = this.densityManager.validateDensity(scenes, densityProfile);
    
    if (!validation.isValid) {
      issues.push(...validation.issues);
      recommendations.push(...validation.recommendations);
    }
    
    // Score based on how close to target rate
    const rateDifference = Math.abs(validation.currentRate - validation.targetRate);
    const score = Math.max(0, 1 - (rateDifference / 0.2)); // 20% tolerance
    
    return score;
  }
  
  /**
   * Check if purpose is appropriate for interaction type
   */
  private isPurposeAppropriateForType(type: string, purpose: string): boolean {
    const appropriatePairings: Record<string, string[]> = {
      knowledgeCheck: ["attentionReset", "knowledgeReinforcement", "assessment"],
      scenario: ["skillPractice", "application", "engagement"],
      reflection: ["meaningMaking", "engagement"],
      simulation: ["skillPractice", "application", "exploration"],
      dragDrop: ["knowledgeReinforcement", "skillPractice"],
      hotspot: ["exploration", "engagement"],
      branchingScenario: ["application", "skillPractice", "assessment"],
      sortingActivity: ["knowledgeReinforcement"],
      matchingActivity: ["knowledgeReinforcement"],
      slider: ["meaningMaking", "engagement"],
      journal: ["meaningMaking", "application"]
    };
    
    const appropriate = appropriatePairings[type] || [];
    return appropriate.includes(purpose);
  }
}

