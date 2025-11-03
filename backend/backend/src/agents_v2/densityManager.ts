// backend/src/agents_v2/densityManager.ts
import { 
  DensityProfile, 
  ModuleType, 
  Scene,
  InteractionIntensity,
  LearningRequest 
} from "./types";

/**
 * Phase 2: Density Manager
 * Balances interaction frequency based on module type and learning goals
 */
export class DensityManager {
  
  /**
   * Get appropriate density profile for module
   */
  getDensityProfile(moduleType: ModuleType): DensityProfile {
    const profiles: Record<ModuleType, DensityProfile> = {
      awareness: {
        moduleType: "awareness",
        intervalScenes: 5,           // One interaction every 5-6 scenes
        intensity: "light",
        targetInteractionRate: 0.20, // 20% of scenes have interaction
        minSpacing: 3                // At least 3 scenes between interactions
      },
      
      skillBuilding: {
        moduleType: "skillBuilding",
        intervalScenes: 3,           // One interaction every 3-4 scenes
        intensity: "moderate",
        targetInteractionRate: 0.35, // 35% of scenes have interaction
        minSpacing: 2                // At least 2 scenes between interactions
      },
      
      application: {
        moduleType: "application",
        intervalScenes: 2,           // One interaction every 2-3 scenes
        intensity: "high",
        targetInteractionRate: 0.50, // 50% of scenes have interaction
        minSpacing: 1                // At least 1 scene between interactions
      },
      
      immersive: {
        moduleType: "immersive",
        intervalScenes: 1,           // Nearly every scene
        intensity: "continuous",
        targetInteractionRate: 0.75, // 75% of scenes have interaction
        minSpacing: 0                // Can have consecutive interactions
      }
    };
    
    return profiles[moduleType];
  }
  
  /**
   * Infer module type from learning request and outcomes
   */
  inferModuleType(request: LearningRequest, outcomes?: string[]): ModuleType {
    const topic = request.topic.toLowerCase();
    const audience = (request.audience || "").toLowerCase();
    const sourceMaterial = request.sourceMaterial.toLowerCase();
    const duration = request.duration;
    
    // Check for awareness indicators
    const awarenessKeywords = ["awareness", "introduction to", "overview", "understanding", "recognize"];
    if (awarenessKeywords.some(kw => topic.includes(kw) || sourceMaterial.includes(kw))) {
      return "awareness";
    }
    
    // Check for immersive indicators
    const immersiveKeywords = ["simulation", "immersive", "hands-on", "practice lab", "workshop"];
    if (immersiveKeywords.some(kw => topic.includes(kw))) {
      return "immersive";
    }
    
    // Check for skill building indicators
    const skillKeywords = ["skill", "technique", "method", "how to", "training"];
    if (skillKeywords.some(kw => topic.includes(kw))) {
      return "skillBuilding";
    }
    
    // Check outcomes for application level
    if (outcomes && outcomes.length > 0) {
      const outcomesText = outcomes.join(" ").toLowerCase();
      const applicationKeywords = ["apply", "implement", "use", "execute", "practice"];
      if (applicationKeywords.some(kw => outcomesText.includes(kw))) {
        return "application";
      }
    }
    
    // Check duration (longer = more likely to be skill/application)
    if (duration >= 30) {
      return "application";
    } else if (duration >= 15) {
      return "skillBuilding";
    }
    
    // Default to skill building (most common)
    return "skillBuilding";
  }
  
  /**
   * Calculate optimal interaction placements
   */
  calculateOptimalPlacements(
    scenes: Scene[],
    profile: DensityProfile,
    existingInteractionIndices: number[]
  ): number[] {
    const optimalIndices: number[] = [];
    const totalScenes = scenes.length;
    const targetCount = Math.ceil(totalScenes * profile.targetInteractionRate);
    
    // Start with existing interactions
    const placedIndices = new Set(existingInteractionIndices);
    
    // Calculate ideal spacing
    const idealSpacing = Math.floor(totalScenes / targetCount);
    
    // Place interactions at regular intervals
    let nextIndex = Math.floor(idealSpacing / 2); // Start offset from beginning
    
    while (optimalIndices.length + placedIndices.size < targetCount && nextIndex < totalScenes) {
      // Check if this index is already used or too close to existing
      if (!placedIndices.has(nextIndex) && this.isValidPlacement(nextIndex, placedIndices, profile)) {
        optimalIndices.push(nextIndex);
        placedIndices.add(nextIndex);
      }
      
      nextIndex += idealSpacing;
    }
    
    // Fill in any gaps if we haven't reached target
    if (optimalIndices.length + existingInteractionIndices.length < targetCount) {
      const gaps = this.findLargestGaps(Array.from(placedIndices).sort((a, b) => a - b), totalScenes);
      
      for (const gapIndex of gaps) {
        if (optimalIndices.length + existingInteractionIndices.length >= targetCount) break;
        if (!placedIndices.has(gapIndex) && this.isValidPlacement(gapIndex, placedIndices, profile)) {
          optimalIndices.push(gapIndex);
          placedIndices.add(gapIndex);
        }
      }
    }
    
    return optimalIndices.sort((a, b) => a - b);
  }
  
  /**
   * Validate density of current interactions
   */
  validateDensity(
    scenes: Scene[],
    profile: DensityProfile
  ): {
    isValid: boolean;
    currentRate: number;
    targetRate: number;
    issues: string[];
    recommendations: string[];
  } {
    const interactionIndices = scenes
      .map((s, i) => s.interactionType && s.interactionType !== "None" ? i : -1)
      .filter(i => i !== -1);
    
    const currentRate = interactionIndices.length / scenes.length;
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Check overall rate
    const rateDifference = Math.abs(currentRate - profile.targetInteractionRate);
    if (rateDifference > 0.15) { // More than 15% off target
      if (currentRate < profile.targetInteractionRate) {
        issues.push(`Interaction rate (${Math.round(currentRate * 100)}%) below target (${Math.round(profile.targetInteractionRate * 100)}%)`);
        recommendations.push(`Add ${Math.ceil((profile.targetInteractionRate - currentRate) * scenes.length)} more interactions`);
      } else {
        issues.push(`Interaction rate (${Math.round(currentRate * 100)}%) above target (${Math.round(profile.targetInteractionRate * 100)}%)`);
        recommendations.push(`Remove ${Math.ceil((currentRate - profile.targetInteractionRate) * scenes.length)} interactions`);
      }
    }
    
    // Check spacing
    const spacingViolations = this.findSpacingViolations(interactionIndices, profile.minSpacing);
    if (spacingViolations.length > 0) {
      issues.push(`${spacingViolations.length} spacing violations (interactions too close)`);
      recommendations.push(`Ensure at least ${profile.minSpacing} scenes between interactions`);
    }
    
    // Check distribution (clustering vs spread)
    const clusterScore = this.calculateClusterScore(interactionIndices, scenes.length);
    if (clusterScore > 0.3) { // 30% clustering
      issues.push("Interactions are clustered unevenly");
      recommendations.push("Distribute interactions more evenly throughout module");
    }
    
    return {
      isValid: issues.length === 0,
      currentRate,
      targetRate: profile.targetInteractionRate,
      issues,
      recommendations
    };
  }
  
  /**
   * Adjust intensity based on learner performance or context
   */
  adjustIntensity(
    currentProfile: DensityProfile,
    context: {
      learnerEngagement?: number;  // 0-10
      completionRate?: number;     // 0-1
      timeAvailable?: number;      // minutes
    }
  ): DensityProfile {
    const adjusted = { ...currentProfile };
    
    // Reduce intensity if engagement is low
    if (context.learnerEngagement !== undefined && context.learnerEngagement < 5) {
      adjusted.targetInteractionRate = Math.max(0.15, adjusted.targetInteractionRate - 0.1);
      adjusted.intervalScenes += 1;
    }
    
    // Increase intensity if completion rate is high
    if (context.completionRate !== undefined && context.completionRate > 0.8) {
      adjusted.targetInteractionRate = Math.min(0.8, adjusted.targetInteractionRate + 0.1);
      adjusted.intervalScenes = Math.max(1, adjusted.intervalScenes - 1);
    }
    
    // Adjust for time constraints
    if (context.timeAvailable !== undefined && context.timeAvailable < 15) {
      // Less time = lighter interactions
      adjusted.targetInteractionRate = Math.max(0.15, adjusted.targetInteractionRate - 0.05);
    }
    
    return adjusted;
  }
  
  // ========== PRIVATE HELPER METHODS ==========
  
  /**
   * Check if placement is valid given spacing constraints
   */
  private isValidPlacement(
    index: number,
    existingIndices: Set<number>,
    profile: DensityProfile
  ): boolean {
    for (const existing of existingIndices) {
      if (Math.abs(index - existing) < profile.minSpacing) {
        return false;
      }
    }
    return true;
  }
  
  /**
   * Find largest gaps between interactions
   */
  private findLargestGaps(
    sortedIndices: number[],
    totalScenes: number
  ): number[] {
    const gaps: { start: number; end: number; size: number; midpoint: number }[] = [];
    
    for (let i = 0; i < sortedIndices.length - 1; i++) {
      const start = sortedIndices[i];
      const end = sortedIndices[i + 1];
      const size = end - start;
      
      if (size > 2) { // Only consider gaps larger than 2
        gaps.push({
          start,
          end,
          size,
          midpoint: Math.floor((start + end) / 2)
        });
      }
    }
    
    // Sort by size (largest first)
    gaps.sort((a, b) => b.size - a.size);
    
    return gaps.map(g => g.midpoint);
  }
  
  /**
   * Find spacing violations
   */
  private findSpacingViolations(
    indices: number[],
    minSpacing: number
  ): number[] {
    const violations: number[] = [];
    const sorted = [...indices].sort((a, b) => a - b);
    
    for (let i = 0; i < sorted.length - 1; i++) {
      const spacing = sorted[i + 1] - sorted[i];
      if (spacing < minSpacing) {
        violations.push(sorted[i + 1]);
      }
    }
    
    return violations;
  }
  
  /**
   * Calculate clustering score (0-1, where 1 = completely clustered)
   */
  private calculateClusterScore(
    indices: number[],
    totalScenes: number
  ): number {
    if (indices.length < 2) return 0;
    
    const sorted = [...indices].sort((a, b) => a - b);
    const idealSpacing = totalScenes / indices.length;
    
    let deviationSum = 0;
    for (let i = 0; i < sorted.length - 1; i++) {
      const actualSpacing = sorted[i + 1] - sorted[i];
      const deviation = Math.abs(actualSpacing - idealSpacing);
      deviationSum += deviation;
    }
    
    const avgDeviation = deviationSum / (sorted.length - 1);
    const clusterScore = Math.min(1, avgDeviation / idealSpacing);
    
    return clusterScore;
  }
}




