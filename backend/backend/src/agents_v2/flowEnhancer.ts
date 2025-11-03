// backend/src/agents_v2/flowEnhancer.ts
import { Scene, FlowValidation, SceneFlowMetrics } from "./types";

/**
 * Phase 1: Flow Enhancer
 * Adds transitions and ensures natural flow between scenes
 */
export class FlowEnhancer {
  
  /**
   * Enhance flow by adding transitions and adjusting content
   */
  enhanceFlow(scenes: Scene[]): Scene[] {
    console.log("🌊 FlowEnhancer: Enhancing flow for", scenes.length, "scenes");
    
    const enhanced = scenes.map((scene, index) => {
      // Add transition context to narration if needed
      const enhancedScene = { ...scene };
      
      // Add forward-looking statement at end of scene (except last)
      if (index < scenes.length - 1) {
        enhancedScene.narrationScript = this.addForwardTransition(
          scene.narrationScript,
          scenes[index + 1]
        );
      }
      
      // Add backward-looking statement at start of scene (except first few)
      if (index > 2) { // Skip welcome scenes
        enhancedScene.narrationScript = this.addBackwardTransition(
          scene.narrationScript,
          scenes[index - 1]
        );
      }
      
      return enhancedScene;
    });
    
    console.log("🌊 FlowEnhancer: Flow enhanced with transitions");
    
    return enhanced;
  }
  
  /**
   * Validate overall storyboard flow
   */
  validateFlow(scenes: Scene[]): FlowValidation {
    console.log("🌊 FlowEnhancer: Validating flow...");
    
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Check for duplicate scene numbers
    const numbers = scenes.map(s => s.sceneNumber);
    const duplicates = numbers.filter((num, index) => numbers.indexOf(num) !== index);
    if (duplicates.length > 0) {
      issues.push(`Duplicate scene numbers found: ${duplicates.join(", ")}`);
      recommendations.push("Ensure each scene has a unique, sequential number");
    }
    
    // Check for text duplication between OST and VO
    let duplicationCount = 0;
    scenes.forEach(scene => {
      if (this.isDuplicated(scene.onScreenText, scene.narrationScript)) {
        duplicationCount++;
      }
    });
    if (duplicationCount > scenes.length * 0.3) { // More than 30% duplicated
      issues.push(`${duplicationCount} scenes have identical OST and VO text`);
      recommendations.push("Vary on-screen text to complement narration, not duplicate it");
    }
    
    // Check engagement rhythm
    const engagementScores = scenes.map(s => this.calculateSceneEngagement(s));
    const lowEngagementStreak = this.findLongestStreak(engagementScores, score => score < 4);
    if (lowEngagementStreak > 3) {
      issues.push(`Found ${lowEngagementStreak} consecutive low-engagement scenes`);
      recommendations.push("Add interactive elements or scenarios to maintain engagement");
    }
    
    // Check cognitive load balance
    const cognitiveLoads = scenes.map(s => this.calculateSceneCognitiveLoad(s));
    const highLoadStreak = this.findLongestStreak(cognitiveLoads, load => load > 7);
    if (highLoadStreak > 2) {
      issues.push(`Found ${highLoadStreak} consecutive high cognitive load scenes`);
      recommendations.push("Balance complex content with simpler reinforcement scenes");
    }
    
    // Calculate metrics
    const metrics = this.calculateFlowMetrics(scenes);
    
    // Calculate overall score
    const flowScore = this.calculateFlowScore(metrics, issues.length);
    
    const validation: FlowValidation = {
      isValid: issues.length === 0,
      flowScore,
      issues,
      recommendations,
      metrics
    };
    
    console.log("🌊 FlowEnhancer: Flow validation complete. Score:", flowScore);
    
    return validation;
  }
  
  /**
   * Add forward-looking transition
   */
  private addForwardTransition(currentNarration: string, nextScene: Scene): string {
    // Don't add if narration is very short or already has transition
    if (currentNarration.length < 100) return currentNarration;
    if (this.hasTransitionLanguage(currentNarration)) return currentNarration;
    
    const nextTopic = this.extractMainTopic(nextScene);
    if (!nextTopic) return currentNarration;
    
    const transitions = [
      ` Next, we'll explore ${nextTopic}.`,
      ` In the next section, we'll look at ${nextTopic}.`,
      ` Now let's move on to ${nextTopic}.`,
      ` Let's now turn our attention to ${nextTopic}.`
    ];
    
    const randomTransition = transitions[Math.floor(Math.random() * transitions.length)];
    
    return currentNarration.trim() + randomTransition;
  }
  
  /**
   * Add backward-looking transition
   */
  private addBackwardTransition(currentNarration: string, previousScene: Scene): string {
    // Don't add if already has backward reference
    if (this.hasBackwardReference(currentNarration)) return currentNarration;
    
    const previousTopic = this.extractMainTopic(previousScene);
    if (!previousTopic) return currentNarration;
    
    const transitions = [
      `Building on ${previousTopic}, `,
      `Now that we've covered ${previousTopic}, `,
      `Following from ${previousTopic}, `
    ];
    
    const randomTransition = transitions[Math.floor(Math.random() * transitions.length)];
    
    return randomTransition + currentNarration;
  }
  
  /**
   * Extract main topic from scene
   */
  private extractMainTopic(scene: Scene): string | null {
    const title = scene.pageTitle.toLowerCase();
    
    // Remove common prefixes
    const cleaned = title
      .replace(/^(scene|step|part|section)\s+\d+:?\s*/i, '')
      .replace(/^(introduction to|understanding|learning about)\s+/i, '')
      .trim();
    
    return cleaned || null;
  }
  
  /**
   * Check if narration already has transition language
   */
  private hasTransitionLanguage(text: string): boolean {
    const transitionWords = ['next', 'now', 'following', 'moving on', 'let\'s explore', 'we\'ll look at'];
    const lowerText = text.toLowerCase();
    return transitionWords.some(word => lowerText.includes(word));
  }
  
  /**
   * Check if narration has backward reference
   */
  private hasBackwardReference(text: string): boolean {
    const references = ['building on', 'as we discussed', 'following from', 'now that we\'ve', 'earlier we'];
    const lowerText = text.toLowerCase();
    return references.some(ref => lowerText.includes(ref));
  }
  
  /**
   * Check if OST and VO are duplicated
   */
  private isDuplicated(ost: string, vo: string): boolean {
    if (!ost || !vo) return false;
    
    // Normalize text
    const normalizedOst = ost.toLowerCase().replace(/[^\w\s]/g, '').trim();
    const normalizedVo = vo.toLowerCase().replace(/[^\w\s]/g, '').trim();
    
    // Check if OST is contained in VO or vice versa (allowing for small differences)
    const similarity = this.calculateSimilarity(normalizedOst, normalizedVo);
    return similarity > 0.8; // 80% similarity threshold
  }
  
  /**
   * Calculate text similarity (0-1)
   */
  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.split(/\s+/));
    const words2 = new Set(text2.split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }
  
  /**
   * Calculate scene engagement (1-10)
   */
  private calculateSceneEngagement(scene: Scene): number {
    let engagement = 5;
    
    if (scene.interactionType && scene.interactionType !== "None") engagement += 3;
    if (scene.pageTitle.toLowerCase().includes("scenario")) engagement += 2;
    if (scene.narrationScript.includes("?")) engagement += 1;
    
    const wordCount = scene.narrationScript.split(/\s+/).length;
    if (wordCount > 200) engagement -= 2;
    
    return Math.min(10, Math.max(1, engagement));
  }
  
  /**
   * Calculate scene cognitive load (1-10)
   */
  private calculateSceneCognitiveLoad(scene: Scene): number {
    let load = 5;
    
    if (scene.interactionType && scene.interactionType !== "None") load += 2;
    
    const wordCount = scene.narrationScript.split(/\s+/).length;
    if (wordCount > 150) load += 2;
    else if (wordCount > 100) load += 1;
    
    const complexWords = ["analyze", "evaluate", "framework", "methodology"];
    const text = scene.narrationScript.toLowerCase();
    const complexCount = complexWords.filter(word => text.includes(word)).length;
    load += Math.min(2, complexCount);
    
    return Math.min(10, Math.max(1, load));
  }
  
  /**
   * Find longest streak matching condition
   */
  private findLongestStreak(values: number[], condition: (val: number) => boolean): number {
    let maxStreak = 0;
    let currentStreak = 0;
    
    values.forEach(val => {
      if (condition(val)) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    });
    
    return maxStreak;
  }
  
  /**
   * Calculate flow metrics
   */
  private calculateFlowMetrics(scenes: Scene[]): SceneFlowMetrics {
    const cognitiveLoads = scenes.map(s => this.calculateSceneCognitiveLoad(s));
    const engagementLevels = scenes.map(s => this.calculateSceneEngagement(s));
    
    const avgCognitiveLoad = cognitiveLoads.reduce((a, b) => a + b, 0) / cognitiveLoads.length;
    const avgEngagement = engagementLevels.reduce((a, b) => a + b, 0) / engagementLevels.length;
    
    // Calculate transition quality (presence of connecting language)
    let transitionCount = 0;
    scenes.forEach(scene => {
      if (this.hasTransitionLanguage(scene.narrationScript)) {
        transitionCount++;
      }
    });
    const transitionQuality = (transitionCount / Math.max(1, scenes.length - 2)) * 10;
    
    // Outcome alignment - placeholder (would need outcome map)
    const outcomeAlignment = 85; // Default estimate
    
    return {
      cognitiveLoad: Math.round(avgCognitiveLoad * 10) / 10,
      engagementLevel: Math.round(avgEngagement * 10) / 10,
      transitionQuality: Math.round(transitionQuality * 10) / 10,
      outcomeAlignment
    };
  }
  
  /**
   * Calculate overall flow score (0-100)
   */
  private calculateFlowScore(metrics: SceneFlowMetrics, issueCount: number): number {
    // Start at 100, deduct for issues
    let score = 100;
    
    // Deduct for issues
    score -= issueCount * 5;
    
    // Adjust based on metrics
    if (metrics.cognitiveLoad > 8) score -= 5; // Too high
    if (metrics.cognitiveLoad < 3) score -= 5; // Too low
    if (metrics.engagementLevel < 5) score -= 10;
    if (metrics.transitionQuality < 5) score -= 10;
    if (metrics.outcomeAlignment < 80) score -= 5;
    
    return Math.max(0, Math.min(100, score));
  }
}




