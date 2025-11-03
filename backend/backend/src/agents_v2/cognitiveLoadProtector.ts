// backend/src/agents_v2/cognitiveLoadProtector.ts
import { Scene, CognitiveLoadAssessment, CrossPhaseScene } from "./types";

/**
 * Phase 2: Cognitive Load Protector
 * Prevents cognitive overload by monitoring and managing cognitive demand
 */
export class CognitiveLoadProtector {
  private readonly MAX_SAFE_LOAD = 8; // Out of 10
  private readonly OVERLOAD_THRESHOLD = 9;
  private readonly IDEAL_LOAD_RANGE = { min: 4, max: 7 };
  
  /**
   * Assess cognitive load for a single scene
   */
  assessSceneLoad(scene: Scene): number {
    let load = 3; // Base load
    
    // Content complexity
    load += this.assessContentComplexity(scene);
    
    // Interaction complexity
    load += this.assessInteractionComplexity(scene);
    
    // Information density
    load += this.assessInformationDensity(scene);
    
    // Visual complexity
    load += this.assessVisualComplexity(scene);
    
    return Math.min(10, Math.max(1, load));
  }
  
  /**
   * Assess cumulative cognitive load across scenes
   */
  assessCumulativeLoad(scenes: Scene[]): CognitiveLoadAssessment {
    const loads = scenes.map(s => this.assessSceneLoad(s));
    const currentLoad = this.calculateMovingAverage(loads, 3); // Average of last 3 scenes
    const capacity = 10; // Maximum theoretical capacity
    
    const overloadRisk = currentLoad > this.OVERLOAD_THRESHOLD;
    const safetyMargin = capacity - currentLoad;
    
    const recommendations: string[] = [];
    
    if (overloadRisk) {
      recommendations.push("CRITICAL: Reduce cognitive load immediately");
      recommendations.push("Remove complex interactions from next 2-3 scenes");
      recommendations.push("Consider adding a low-load review or break scene");
    } else if (currentLoad > this.MAX_SAFE_LOAD) {
      recommendations.push("WARNING: Approaching cognitive overload");
      recommendations.push("Simplify upcoming content or reduce interaction complexity");
    } else if (currentLoad < this.IDEAL_LOAD_RANGE.min) {
      recommendations.push("Load is low - opportunity to add engagement");
      recommendations.push("Consider adding light interactive element");
    }
    
    return {
      currentLoad,
      capacity,
      overloadRisk,
      safetyMargin,
      recommendations
    };
  }
  
  /**
   * Validate if adding an interaction would cause overload
   */
  validateInteractionAddition(
    scene: Scene,
    interactionLoadImpact: number,
    previousScenes: Scene[]
  ): {
    safe: boolean;
    projectedLoad: number;
    recommendation: string;
  } {
    const currentSceneLoad = this.assessSceneLoad(scene);
    const projectedLoad = currentSceneLoad + interactionLoadImpact;
    
    // Check recent cumulative load
    const recentScenes = previousScenes.slice(-3);
    const cumulativeAssessment = this.assessCumulativeLoad([...recentScenes, scene]);
    
    const safe = 
      projectedLoad <= this.MAX_SAFE_LOAD && 
      !cumulativeAssessment.overloadRisk;
    
    let recommendation = "";
    if (!safe) {
      if (projectedLoad > this.OVERLOAD_THRESHOLD) {
        recommendation = "Do not add interaction - scene already at capacity";
      } else if (cumulativeAssessment.overloadRisk) {
        recommendation = "Do not add interaction - cumulative load too high";
      } else {
        recommendation = "Consider simpler interaction type to stay within safe range";
      }
    } else if (projectedLoad >= this.IDEAL_LOAD_RANGE.min && projectedLoad <= this.IDEAL_LOAD_RANGE.max) {
      recommendation = "Ideal load - interaction enhances without overloading";
    } else {
      recommendation = "Safe to add interaction";
    }
    
    return {
      safe,
      projectedLoad,
      recommendation
    };
  }
  
  /**
   * Suggest load reduction strategies for overloaded scenes
   */
  suggestLoadReductions(scenes: Scene[]): {
    sceneIndex: number;
    currentLoad: number;
    suggestions: string[];
  }[] {
    const overloaded: {
      sceneIndex: number;
      currentLoad: number;
      suggestions: string[];
    }[] = [];
    
    scenes.forEach((scene, index) => {
      const load = this.assessSceneLoad(scene);
      
      if (load > this.MAX_SAFE_LOAD) {
        const suggestions: string[] = [];
        
        // Analyze what's contributing to high load
        if (this.assessContentComplexity(scene) > 3) {
          suggestions.push("Simplify content: Break complex concepts into smaller chunks");
          suggestions.push("Use analogies or examples to clarify abstract concepts");
        }
        
        if (this.assessInteractionComplexity(scene) > 2) {
          suggestions.push("Simplify interaction: Choose less complex interaction type");
          suggestions.push("Move complex interaction to separate scene");
        }
        
        if (this.assessInformationDensity(scene) > 2) {
          suggestions.push("Reduce information density: Spread content across 2 scenes");
          suggestions.push("Remove non-essential details");
        }
        
        if (this.assessVisualComplexity(scene) > 2) {
          suggestions.push("Simplify visuals: Use simpler diagrams or step-by-step reveal");
        }
        
        overloaded.push({
          sceneIndex: index,
          currentLoad: load,
          suggestions
        });
      }
    });
    
    return overloaded;
  }
  
  /**
   * Identify safe zones for adding interactions
   */
  identifySafeZones(scenes: Scene[]): number[] {
    const safeIndices: number[] = [];
    
    scenes.forEach((scene, index) => {
      const load = this.assessSceneLoad(scene);
      const previousScenes = scenes.slice(0, index);
      const cumulativeAssessment = this.assessCumulativeLoad([...previousScenes, scene]);
      
      // Safe zone if:
      // 1. Current scene load is moderate
      // 2. No cumulative overload risk
      // 3. Within ideal load range
      if (
        load <= this.IDEAL_LOAD_RANGE.max &&
        !cumulativeAssessment.overloadRisk &&
        cumulativeAssessment.safetyMargin >= 2
      ) {
        safeIndices.push(index);
      }
    });
    
    return safeIndices;
  }
  
  /**
   * Add cumulative load tracking to scenes
   */
  trackCumulativeLoad(scenes: Scene[]): CrossPhaseScene[] {
    let cumulativeLoad = 0;
    
    return scenes.map(scene => {
      const sceneLoad = this.assessSceneLoad(scene);
      
      // Decay previous load (people recover between scenes)
      cumulativeLoad = cumulativeLoad * 0.7 + sceneLoad;
      
      return {
        ...scene,
        cognitiveLoadScore: sceneLoad,
        cumulativeCognitiveLoad: cumulativeLoad
      };
    });
  }
  
  // ========== PRIVATE ASSESSMENT METHODS ==========
  
  /**
   * Assess content complexity (0-4 points)
   */
  private assessContentComplexity(scene: Scene): number {
    let complexity = 0;
    const text = `${scene.narrationScript} ${scene.onScreenText}`.toLowerCase();
    
    // Complex vocabulary
    const complexWords = [
      "framework", "methodology", "paradigm", "conceptual", "theoretical",
      "synthesize", "analyze", "evaluate", "differentiate"
    ];
    const complexCount = complexWords.filter(word => text.includes(word)).length;
    complexity += Math.min(2, complexCount * 0.5);
    
    // Abstract concepts
    if (text.match(/abstract|intangible|philosophical|theoretical/)) {
      complexity += 1;
    }
    
    // Multiple interconnected concepts
    const conceptDensity = (text.match(/\b(concept|principle|theory|model|approach)\b/g) || []).length;
    if (conceptDensity > 3) {
      complexity += 1;
    }
    
    return Math.min(4, complexity);
  }
  
  /**
   * Assess interaction complexity (0-3 points)
   */
  private assessInteractionComplexity(scene: Scene): number {
    const interactionType = scene.interactionType || "None";
    
    const complexityMap: Record<string, number> = {
      "None": 0,
      "MCQ": 1,
      "Reflection": 1,
      "Hotspots": 1,
      "DragDrop": 2,
      "Scenario": 2,
      "Matching": 2,
      "Simulation": 3,
      "BranchingScenario": 3
    };
    
    return complexityMap[interactionType] || 0;
  }
  
  /**
   * Assess information density (0-2 points)
   */
  private assessInformationDensity(scene: Scene): number {
    const voWordCount = (scene.narrationScript || "").split(/\s+/).length;
    const ostWordCount = (scene.onScreenText || "").split(/\s+/).length;
    
    let density = 0;
    
    // High word count
    if (voWordCount > 150) density += 1;
    if (ostWordCount > 70) density += 0.5;
    
    // Dense OST
    if (ostWordCount > 50 && voWordCount > 100) density += 0.5;
    
    return Math.min(2, density);
  }
  
  /**
   * Assess visual complexity (0-2 points)
   */
  private assessVisualComplexity(scene: Scene): number {
    const visualPrompt = (scene.visual?.aiPrompt || "").toLowerCase();
    
    let complexity = 0;
    
    // Complex visual types
    const complexVisuals = ["diagram", "flowchart", "infographic", "chart", "graph", "detailed"];
    if (complexVisuals.some(v => visualPrompt.includes(v))) {
      complexity += 1;
    }
    
    // Multiple elements
    if (visualPrompt.match(/multiple|many|several|various/)) {
      complexity += 0.5;
    }
    
    // Labeled elements
    if (visualPrompt.includes("label")) {
      complexity += 0.5;
    }
    
    return Math.min(2, complexity);
  }
  
  /**
   * Calculate moving average of recent loads
   */
  private calculateMovingAverage(loads: number[], window: number): number {
    if (loads.length === 0) return 0;
    
    const recentLoads = loads.slice(-window);
    const sum = recentLoads.reduce((acc, load) => acc + load, 0);
    return sum / recentLoads.length;
  }
}




