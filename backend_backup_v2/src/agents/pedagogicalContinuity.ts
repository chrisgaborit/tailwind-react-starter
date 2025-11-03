/**
 * Pedagogical Continuity Agent - Quality Assurance Layer
 * 
 * Validates and repairs storyboards to ensure pedagogical continuity,
 * eliminate repetition, and maintain alignment between teaching and practice.
 */

import { OpenAI } from 'openai';
import type { 
  ContinuityReport, 
  PedagogicalBlueprint, 
  StoryboardModule, 
  MemoryStore 
} from '../../../packages/shared/src/types';

export class PedagogicalContinuityAgent {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Validate storyboard for pedagogical continuity and repair issues
   */
  async validateAndRepair(
    draftStoryboard: StoryboardModule,
    pedagogicalBlueprint: PedagogicalBlueprint,
    memory: MemoryStore
  ): Promise<ContinuityReport> {
    
    const pastFailures = await memory.getPedagogicalFailures();
    
    // First, analyze the storyboard for issues
    const analysisPrompt = `
ANALYZE STORYBOARD FLOW FOR PEDAGOGICAL CONTINUITY:

PEDAGOGICAL BLUEPRINT: ${JSON.stringify(pedagogicalBlueprint)}
DRAFT STORYBOARD: ${JSON.stringify(draftStoryboard.scenes)}

CHECK FOR:
1. REPETITION: Same interactivity type 3+ times? Same scenario pattern?
2. MISALIGNMENT: Teaching doesn't match practice? Examples don't illustrate concepts?
3. COMPLEXITY: Is knowledge building progressively?
4. TERMINOLOGY: Using client's exact terms from ${JSON.stringify(pedagogicalBlueprint.clientTerminology)}

PAST FAILURES TO AVOID:
${pastFailures}

OUTPUT JSON with:
{
  "issues": [
    {
      "type": "repetition" | "misalignment" | "complexity-gap" | "terminology-drift",
      "description": "Specific description of the issue",
      "severity": "high" | "medium" | "low",
      "scenes": [scene numbers affected],
      "recommendation": "Specific repair instruction"
    }
  ]
}`;

    try {
      const analysisResponse = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: analysisPrompt }],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const analysis = JSON.parse(analysisResponse.choices[0].message.content || '{}');
      const issues = analysis.issues || [];

      let repairedStoryboard: StoryboardModule | undefined;

      // If issues found, attempt repair
      if (issues.length > 0) {
        repairedStoryboard = await this.repairStoryboard(
          draftStoryboard,
          issues,
          pedagogicalBlueprint
        );

        // Store failures for future learning
        await this.storeFailures(issues, memory);
      }

      return {
        issues,
        repairedStoryboard
      };

    } catch (error) {
      console.error('Pedagogical Continuity Agent error:', error);
      return {
        issues: [{
          type: 'misalignment',
          description: 'Failed to analyze storyboard continuity',
          severity: 'high',
          scenes: [],
          recommendation: 'Manual review required'
        }]
      };
    }
  }

  /**
   * Repair storyboard based on identified issues
   */
  private async repairStoryboard(
    storyboard: StoryboardModule,
    issues: ContinuityReport['issues'],
    pedagogicalBlueprint: PedagogicalBlueprint
  ): Promise<StoryboardModule> {
    
    const repairPrompt = `
REPAIR STORYBOARD BASED ON ANALYSIS:

ORIGINAL STORYBOARD: ${JSON.stringify(storyboard)}
CONTINUITY ISSUES: ${JSON.stringify(issues)}
PEDAGOGICAL BLUEPRINT: ${JSON.stringify(pedagogicalBlueprint)}

REPAIR INSTRUCTIONS:
- Fix repetition by varying interactivity types
- Ensure teaching→example→practice alignment  
- Add progressive complexity
- Enforce client terminology: ${Object.keys(pedagogicalBlueprint.clientTerminology)}
- Maintain learning objective flow from blueprint

OUTPUT: Repaired storyboard JSON with same structure as original`;

    try {
      const repairResponse = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: repairPrompt }],
        response_format: { type: "json_object" },
        temperature: 0.5,
      });

      const repaired = JSON.parse(repairResponse.choices[0].message.content || '{}');
      return repaired as StoryboardModule;

    } catch (error) {
      console.error('Storyboard repair error:', error);
      return storyboard; // Return original if repair fails
    }
  }

  /**
   * Store pedagogical failures for future learning
   */
  private async storeFailures(
    issues: ContinuityReport['issues'],
    memory: MemoryStore
  ): Promise<void> {
    for (const issue of issues) {
      if (issue.severity === 'high' || issue.severity === 'medium') {
        await memory.storeFailure({
          type: issue.type,
          description: issue.description,
          recommendation: issue.recommendation,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  /**
   * Calculate pedagogical metrics for monitoring
   */
  calculatePedagogicalMetrics(storyboard: StoryboardModule): {
    repetitionScore: number;
    alignmentScore: number;
    terminologyAdherence: number;
    progressiveComplexity: number;
  } {
    const scenes = storyboard.scenes || [];
    
    return {
      repetitionScore: this.calculateRepetitionScore(scenes),
      alignmentScore: this.calculateAlignmentScore(scenes),
      terminologyAdherence: this.calculateTerminologyAdherence(scenes, storyboard),
      progressiveComplexity: this.calculateProgressiveComplexity(scenes)
    };
  }

  private calculateRepetitionScore(scenes: any[]): number {
    const interactivityTypes = scenes.map(s => s.interactionType).filter(Boolean);
    const uniqueTypes = new Set(interactivityTypes);
    return uniqueTypes.size / Math.max(interactivityTypes.length, 1);
  }

  private calculateAlignmentScore(scenes: any[]): number {
    // Simplified alignment check - would need more sophisticated logic
    const teachingScenes = scenes.filter(s => s.phase === 'LEARN' || s.phase === 'SEE');
    const practiceScenes = scenes.filter(s => s.phase === 'DO' || s.phase === 'APPLY');
    return teachingScenes.length > 0 && practiceScenes.length > 0 ? 1.0 : 0.5;
  }

  private calculateTerminologyAdherence(scenes: any[], storyboard: StoryboardModule): number {
    // Simplified terminology check
    const clientTerms = Object.keys(storyboard.project_metadata?.category ? {} : {});
    return clientTerms.length > 0 ? 0.8 : 0.5;
  }

  private calculateProgressiveComplexity(scenes: any[]): number {
    // Simplified complexity progression check
    const sceneCount = scenes.length;
    return sceneCount > 3 ? 0.8 : 0.5;
  }
}
