/**
 * Pedagogical Continuity Agent
 * 
 * Ensures logical flow between scenes and enforces learning progression consistency.
 * Detects issues like examples without preceding teaching, consecutive scenarios,
 * character repetition, and abrupt transitions.
 */

import type { 
  StoryboardModule, 
  StoryboardScene, 
  PedagogicalBlueprint, 
  ContinuityReport, 
  ContinuityIssue,
  PedagogicalPurpose
} from '../../../packages/shared/src/types';
import { validateContinuityReport } from '../schemas/pedagogy';

export class PedagogicalContinuityAgent {
  
  /**
   * Main validation method - analyzes storyboard for continuity issues
   */
  async validate(
    storyboard: StoryboardModule, 
    blueprint: PedagogicalBlueprint
  ): Promise<ContinuityReport> {
    console.log('🔍 Pedagogical Continuity Agent: Analyzing storyboard...');
    
    const issues: ContinuityIssue[] = [];
    const scenes = storyboard.scenes || [];
    
    // Run all validation checks
    issues.push(...this.checkPedagogicalSequence(scenes));
    issues.push(...this.checkConsecutiveScenarios(scenes));
    issues.push(...this.checkCharacterRepetition(scenes));
    issues.push(...this.checkAbruptTransitions(scenes));
    issues.push(...this.checkTeachingFirst(scenes));
    
    // After continuity validation - ensure assessment scene exists
    if (!scenes.some(s => s.pedagogical_purpose === 'assessment')) {
      console.warn('⚠️ No knowledge check detected — auto-generating fallback assessment scene');
      const assessmentScene = {
        id: `auto-assessment-${Date.now()}`,
        scene_no: scenes.length + 1,
        pedagogical_purpose: 'assessment',
        content: 'Let\'s review what you\'ve learned. Please answer the following question based on the key principles covered.',
        visual_description: 'Simple quiz interface showing 3 multiple-choice options.',
        voiceover_script: 'Now, take a quick knowledge check to confirm your understanding.',
        metadata: { auto_generated: true },
      };
      scenes.push(assessmentScene);
    }
    
    // Calculate overall score
    const overallScore = this.calculateOverallScore(scenes, issues);
    
    // Determine if regeneration is required
    const requiresRegeneration = issues.some(issue => issue.severity === 'high');
    
    // Generate summary
    const summary = this.generateSummary(issues, overallScore);
    
    const report: ContinuityReport = {
      issues,
      requiresRegeneration,
      overallScore,
      summary
    };
    
    // Validate the report structure
    const validatedReport = validateContinuityReport(report);
    
    console.log(`✅ Continuity validation complete: ${issues.length} issues found, score: ${overallScore}/100`);
    
    return validatedReport;
  }
  
  /**
   * Check for pedagogical sequence violations (example without preceding teach)
   */
  private checkPedagogicalSequence(scenes: StoryboardScene[]): ContinuityIssue[] {
    const issues: ContinuityIssue[] = [];
    
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const purpose = scene.pedagogical_purpose;
      
      // Check if example/scenario appears without preceding teaching
      if (purpose === 'example' || purpose === 'scenario') {
        // Look back for teaching content
        let hasPrecedingTeach = false;
        for (let j = Math.max(0, i - 3); j < i; j++) {
          if (scenes[j].pedagogical_purpose === 'teach') {
            hasPrecedingTeach = true;
            break;
          }
        }
        
        if (!hasPrecedingTeach) {
          issues.push({
            type: 'pedagogical-sequence',
            description: `Scene ${i + 1} is an example/scenario without preceding teaching content`,
            severity: 'high',
            scenes: [i + 1],
            recommendation: 'Add teaching content before this example/scenario or move it after a teaching scene',
            evidence: `Scene purpose: ${purpose}, no teaching found in previous 3 scenes`
          });
        }
      }
    }
    
    return issues;
  }
  
  /**
   * Check for consecutive scenarios (max 2 allowed)
   */
  private checkConsecutiveScenarios(scenes: StoryboardScene[]): ContinuityIssue[] {
    const issues: ContinuityIssue[] = [];
    let consecutiveScenarios = 0;
    let startIndex = -1;
    
    for (let i = 0; i < scenes.length; i++) {
      const purpose = scenes[i].pedagogical_purpose;
      
      if (purpose === 'scenario') {
        if (consecutiveScenarios === 0) {
          startIndex = i + 1;
        }
        consecutiveScenarios++;
      } else {
        if (consecutiveScenarios > 2) {
          issues.push({
            type: 'repetition',
            description: `${consecutiveScenarios} consecutive scenario scenes found`,
            severity: 'medium',
            scenes: Array.from({ length: consecutiveScenarios }, (_, idx) => startIndex + idx),
            recommendation: 'Break up consecutive scenarios with teaching, examples, or practice content',
            evidence: `Scenes ${startIndex}-${startIndex + consecutiveScenarios - 1} are all scenarios`
          });
        }
        consecutiveScenarios = 0;
      }
    }
    
    // Check if the last sequence is too long
    if (consecutiveScenarios > 2) {
      issues.push({
        type: 'repetition',
        description: `${consecutiveScenarios} consecutive scenario scenes found at end`,
        severity: 'medium',
        scenes: Array.from({ length: consecutiveScenarios }, (_, idx) => startIndex + idx),
        recommendation: 'Break up consecutive scenarios with teaching, examples, or practice content',
        evidence: `Scenes ${startIndex}-${startIndex + consecutiveScenarios - 1} are all scenarios`
      });
    }
    
    return issues;
  }
  
  /**
   * Check for character repetition between scenes
   */
  private checkCharacterRepetition(scenes: StoryboardScene[]): ContinuityIssue[] {
    const issues: ContinuityIssue[] = [];
    const characterMap = new Map<string, number[]>();
    
    scenes.forEach((scene, index) => {
      // Extract character names from various text fields
      const textContent = this.extractTextContent(scene);
      const characters = this.extractCharacterNames(textContent);
      
      characters.forEach(character => {
        if (!characterMap.has(character)) {
          characterMap.set(character, []);
        }
        characterMap.get(character)!.push(index + 1);
      });
    });
    
    // Check for excessive character repetition
    characterMap.forEach((sceneNumbers, character) => {
      if (sceneNumbers.length > 3) {
        issues.push({
          type: 'character-repetition',
          description: `Character "${character}" appears in ${sceneNumbers.length} scenes`,
          severity: 'medium',
          scenes: sceneNumbers,
          recommendation: 'Introduce character variety or reduce overuse of this character',
          evidence: `Character "${character}" appears in scenes: ${sceneNumbers.join(', ')}`
        });
      }
    });
    
    return issues;
  }
  
  /**
   * Check for abrupt transitions between scenes
   */
  private checkAbruptTransitions(scenes: StoryboardScene[]): ContinuityIssue[] {
    const issues: ContinuityIssue[] = [];
    
    for (let i = 1; i < scenes.length; i++) {
      const prevScene = scenes[i - 1];
      const currentScene = scenes[i];
      
      const prevPurpose = prevScene.pedagogical_purpose;
      const currentPurpose = currentScene.pedagogical_purpose;
      
      // Check for problematic transitions
      const problematicTransitions = [
        ['assessment', 'teach'], // Assessment followed by teaching
        ['practice', 'teach'],   // Practice followed by teaching (should be example)
        ['scenario', 'teach']    // Scenario followed by teaching (should be example)
      ];
      
      const isProblematic = problematicTransitions.some(
        ([from, to]) => prevPurpose === from && currentPurpose === to
      );
      
      if (isProblematic) {
        issues.push({
          type: 'abrupt-transition',
          description: `Abrupt transition from ${prevPurpose} to ${currentPurpose} between scenes ${i} and ${i + 1}`,
          severity: 'low',
          scenes: [i, i + 1],
          recommendation: `Consider adding intermediate content between ${prevPurpose} and ${currentPurpose}`,
          evidence: `Scene ${i}: ${prevPurpose} → Scene ${i + 1}: ${currentPurpose}`
        });
      }
    }
    
    return issues;
  }
  
  /**
   * Check that teaching content appears in the first 3 scenes
   */
  private checkTeachingFirst(scenes: StoryboardScene[]): ContinuityIssue[] {
    const issues: ContinuityIssue[] = [];
    
    // Check first 3 scenes for teaching content
    const firstThreeScenes = scenes.slice(0, 3);
    const hasTeachingInFirstThree = firstThreeScenes.some(
      scene => scene.pedagogical_purpose === 'teach'
    );
    
    if (!hasTeachingInFirstThree && firstThreeScenes.length > 0) {
      issues.push({
        type: 'pedagogical-sequence',
        description: 'No teaching content found in the first 3 scenes',
        severity: 'high',
        scenes: [1, 2, 3],
        recommendation: 'Add teaching content to one of the first 3 scenes to establish learning foundation',
        evidence: 'Teaching-first principle requires explicit teaching early in the module'
      });
    }
    
    return issues;
  }
  
  /**
   * Extract text content from a scene for character analysis
   */
  private extractTextContent(scene: StoryboardScene): string {
    const textParts: string[] = [];
    
    // Add narration script
    if (scene.narrationScript) {
      textParts.push(scene.narrationScript);
    }
    
    // Add on-screen text
    if (scene.onScreenText) {
      if (typeof scene.onScreenText === 'string') {
        textParts.push(scene.onScreenText);
      } else {
        textParts.push(scene.onScreenText.title || '');
        textParts.push(...(scene.onScreenText.body_text || []));
        textParts.push(...(scene.onScreenText.bullet_points || []));
      }
    }
    
    // Add visual brief
    if (scene.visualBrief) {
      textParts.push(scene.visualBrief);
    }
    
    return textParts.join(' ').toLowerCase();
  }
  
  /**
   * Extract character names from text content
   */
  private extractCharacterNames(text: string): string[] {
    const characters: string[] = [];
    
    // Common character names to look for
    const commonNames = ['alex', 'jordan', 'sarah', 'mike', 'emma', 'david', 'lisa', 'chris'];
    
    commonNames.forEach(name => {
      const regex = new RegExp(`\\b${name}\\b`, 'gi');
      if (regex.test(text)) {
        characters.push(name);
      }
    });
    
    // Also look for capitalized names (potential characters)
    const capitalizedNames = text.match(/\b[A-Z][a-z]+\b/g) || [];
    capitalizedNames.forEach(name => {
      if (name.length > 2 && !characters.includes(name.toLowerCase())) {
        characters.push(name.toLowerCase());
      }
    });
    
    return [...new Set(characters)]; // Remove duplicates
  }
  
  /**
   * Calculate overall continuity score (0-100)
   */
  private calculateOverallScore(scenes: StoryboardScene[], issues: ContinuityIssue[]): number {
    if (scenes.length === 0) return 0;
    
    let score = 100;
    
    issues.forEach(issue => {
      switch (issue.severity) {
        case 'high':
          score -= 15;
          break;
        case 'medium':
          score -= 8;
          break;
        case 'low':
          score -= 3;
          break;
      }
    });
    
    return Math.max(0, score);
  }
  
  /**
   * Generate summary of continuity analysis
   */
  private generateSummary(issues: ContinuityIssue[], score: number): string {
    const highIssues = issues.filter(i => i.severity === 'high').length;
    const mediumIssues = issues.filter(i => i.severity === 'medium').length;
    const lowIssues = issues.filter(i => i.severity === 'low').length;
    
    if (issues.length === 0) {
      return 'Excellent continuity - no issues detected. Storyboard flows logically with proper pedagogical sequence.';
    }
    
    const summary = `Continuity score: ${score}/100. Found ${issues.length} issues: ` +
      `${highIssues} high priority, ${mediumIssues} medium priority, ${lowIssues} low priority. ` +
      `${highIssues > 0 ? 'Regeneration recommended.' : 'Minor improvements suggested.'}`;
    
    return summary;
  }
  
  /**
   * Propose text-based repair recommendations
   */
  proposeRepairs(report: ContinuityReport): string[] {
    const repairs: string[] = [];
    
    report.issues.forEach(issue => {
      repairs.push(`[${issue.severity.toUpperCase()}] ${issue.recommendation}`);
    });
    
    if (report.requiresRegeneration) {
      repairs.unshift('[CRITICAL] Regeneration required due to high-priority pedagogical sequence issues');
    }
    
    return repairs;
  }
}
