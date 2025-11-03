// backend/src/agents_v2/learningSequenceOptimizer.ts
import { Scene, OutcomeMap, BloomLevel } from "./types";

/**
 * Phase 1: Learning Sequence Optimizer
 * Optimizes scene sequence for optimal learning progression
 */
export class LearningSequenceOptimizer {
  
  /**
   * Create optimal learning sequence from scenes based on outcome map
   */
  optimizeSequence(scenes: Scene[], outcomeMap: OutcomeMap): Scene[] {
    console.log("📊 LearningSequenceOptimizer: Optimizing sequence for", scenes.length, "scenes");
    
    // Step 1: Separate scene types
    const welcomeScenes = scenes.filter(s => this.isWelcomeScene(s));
    const contentScenes = scenes.filter(s => !this.isWelcomeScene(s) && !this.isSummaryScene(s));
    const summaryScenes = scenes.filter(s => this.isSummaryScene(s));
    
    // Step 2: Sequence content scenes by Bloom's progression
    const sequencedContent = this.sequenceByBloomLevel(contentScenes, outcomeMap);
    
    // Step 3: Apply cognitive load balancing
    const balanced = this.balanceCognitiveLoad(sequencedContent);
    
    // Step 4: Add engagement rhythm
    const rhythmic = this.addEngagementRhythm(balanced);
    
    // Step 5: Reassemble in optimal order
    const finalSequence = [
      ...welcomeScenes,
      ...rhythmic,
      ...summaryScenes
    ];
    
    // Renumber scenes
    finalSequence.forEach((scene, index) => {
      scene.sceneNumber = index + 1;
    });
    
    console.log("📊 LearningSequenceOptimizer: Sequence optimized");
    console.log("   - Welcome scenes:", welcomeScenes.length);
    console.log("   - Content scenes:", rhythmic.length);
    console.log("   - Summary scenes:", summaryScenes.length);
    
    return finalSequence;
  }
  
  /**
   * Sequence scenes by Bloom's taxonomy progression
   */
  private sequenceByBloomLevel(scenes: Scene[], outcomeMap: OutcomeMap): Scene[] {
    const bloomOrder: BloomLevel[] = ["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"];
    
    // Map scenes to approximate Bloom levels based on content
    const scenesWithLevels = scenes.map(scene => ({
      scene,
      bloomLevel: this.inferBloomLevel(scene),
      bloomIndex: bloomOrder.indexOf(this.inferBloomLevel(scene))
    }));
    
    // Sort by Bloom level, maintaining relative order within same level
    scenesWithLevels.sort((a, b) => a.bloomIndex - b.bloomIndex);
    
    return scenesWithLevels.map(item => item.scene);
  }
  
  /**
   * Infer Bloom's taxonomy level from scene content
   */
  private inferBloomLevel(scene: Scene): BloomLevel {
    const text = `${scene.pageTitle} ${scene.narrationScript} ${scene.onScreenText}`.toLowerCase();
    
    // Keywords for each Bloom level
    const keywords = {
      "Remember": ["define", "identify", "list", "name", "recall", "recognize", "state"],
      "Understand": ["describe", "explain", "summarize", "interpret", "classify", "compare"],
      "Apply": ["apply", "demonstrate", "use", "implement", "practice", "execute"],
      "Analyze": ["analyze", "examine", "compare", "contrast", "distinguish", "investigate"],
      "Evaluate": ["evaluate", "assess", "judge", "critique", "justify", "recommend"],
      "Create": ["create", "design", "develop", "formulate", "plan", "construct"]
    };
    
    // Check for interaction types that indicate higher levels
    if (scene.interactionType && scene.interactionType !== "None") {
      if (scene.interactionType === "Scenario") return "Apply";
      if (scene.interactionType === "Reflection") return "Analyze";
    }
    
    // Check keywords
    for (const [level, words] of Object.entries(keywords)) {
      if (words.some(word => text.includes(word))) {
        return level as BloomLevel;
      }
    }
    
    // Default to Understand
    return "Understand";
  }
  
  /**
   * Balance cognitive load across scenes
   */
  private balanceCognitiveLoad(scenes: Scene[]): Scene[] {
    // Calculate cognitive load for each scene
    const scenesWithLoad = scenes.map(scene => ({
      scene,
      cognitiveLoad: this.calculateCognitiveLoad(scene)
    }));
    
    // Identify high-load scenes
    const avgLoad = scenesWithLoad.reduce((sum, item) => sum + item.cognitiveLoad, 0) / scenesWithLoad.length;
    
    // Reorder to avoid consecutive high-load scenes
    const reordered: Scene[] = [];
    const remaining = [...scenesWithLoad];
    
    while (remaining.length > 0) {
      // If last scene was high load, pick a low load scene next
      if (reordered.length > 0) {
        const lastLoad = this.calculateCognitiveLoad(reordered[reordered.length - 1]);
        
        if (lastLoad > avgLoad) {
          // Find lowest load scene
          remaining.sort((a, b) => a.cognitiveLoad - b.cognitiveLoad);
        } else {
          // Can pick any scene, prefer maintaining order
          // Already in order, just take first
        }
      }
      
      reordered.push(remaining.shift()!.scene);
    }
    
    return reordered;
  }
  
  /**
   * Calculate cognitive load of a scene (1-10)
   */
  private calculateCognitiveLoad(scene: Scene): number {
    let load = 5; // Base load
    
    // Complex interactions increase load
    if (scene.interactionType && scene.interactionType !== "None") {
      load += 2;
    }
    
    // Long narration increases load
    const wordCount = scene.narrationScript.split(/\s+/).length;
    if (wordCount > 150) load += 2;
    else if (wordCount > 100) load += 1;
    
    // Technical/complex language increases load
    const complexWords = ["analyze", "evaluate", "synthesize", "framework", "methodology", "conceptual"];
    const text = `${scene.narrationScript} ${scene.onScreenText}`.toLowerCase();
    const complexCount = complexWords.filter(word => text.includes(word)).length;
    load += Math.min(2, complexCount);
    
    return Math.min(10, Math.max(1, load));
  }
  
  /**
   * Add engagement rhythm to scenes
   */
  private addEngagementRhythm(scenes: Scene[]): Scene[] {
    // Pattern: High engagement, then lower, then high again
    // Interactive scenes = high engagement
    // Pure content = lower engagement
    
    const scenesWithEngagement = scenes.map(scene => ({
      scene,
      engagement: this.calculateEngagement(scene)
    }));
    
    // Try to alternate engagement levels
    const rhythmic: Scene[] = [];
    const highEngagement = scenesWithEngagement.filter(s => s.engagement >= 7);
    const mediumEngagement = scenesWithEngagement.filter(s => s.engagement >= 4 && s.engagement < 7);
    const lowEngagement = scenesWithEngagement.filter(s => s.engagement < 4);
    
    // Interleave for rhythm: high → medium → high → low → high...
    const pattern = [highEngagement, mediumEngagement, highEngagement, lowEngagement];
    let patternIndex = 0;
    
    while (highEngagement.length + mediumEngagement.length + lowEngagement.length > 0) {
      const pool = pattern[patternIndex % pattern.length];
      
      if (pool.length > 0) {
        rhythmic.push(pool.shift()!.scene);
      }
      
      patternIndex++;
      
      // Safety: if we cycle through pattern and all are empty, break
      if (patternIndex > 100) break;
    }
    
    // If rhythm creation failed, just return original order
    return rhythmic.length > 0 ? rhythmic : scenes;
  }
  
  /**
   * Calculate engagement level of a scene (1-10)
   */
  private calculateEngagement(scene: Scene): number {
    let engagement = 5; // Base engagement
    
    // Interactive scenes are highly engaging
    if (scene.interactionType && scene.interactionType !== "None") {
      engagement += 3;
    }
    
    // Scenarios are engaging
    if (scene.pageTitle.toLowerCase().includes("scenario") || 
        scene.narrationScript.toLowerCase().includes("imagine") ||
        scene.narrationScript.toLowerCase().includes("consider this")) {
      engagement += 2;
    }
    
    // Questions increase engagement
    if (scene.onScreenText.includes("?") || scene.narrationScript.includes("?")) {
      engagement += 1;
    }
    
    // Very long scenes decrease engagement
    const wordCount = scene.narrationScript.split(/\s+/).length;
    if (wordCount > 200) engagement -= 2;
    
    return Math.min(10, Math.max(1, engagement));
  }
  
  /**
   * Check if scene is a welcome/intro scene
   */
  private isWelcomeScene(scene: Scene): boolean {
    const title = scene.pageTitle.toLowerCase();
    return title.includes("welcome") || 
           title.includes("introduction") ||
           title.includes("navigation") ||
           title.includes("learning outcome") ||
           title.includes("objectives");
  }
  
  /**
   * Check if scene is a summary/conclusion scene
   */
  private isSummaryScene(scene: Scene): boolean {
    const title = scene.pageTitle.toLowerCase();
    return title.includes("summary") || 
           title.includes("conclusion") ||
           title.includes("recap") ||
           title.includes("next steps") ||
           title.includes("key takeaway");
  }
}




