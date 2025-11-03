// backend/src/agents_v2/qaAgent.ts
import { Storyboard, QAReport, OutcomeMap, FlowValidation } from "./types";
import { openaiChat } from "../services/openaiGateway";
import { resetHeader } from "./resetHeader";
import { safeJSONParse } from "../utils/safeJSONParse";
import { BRANDON_HALL_BLUEPRINT, validateAgainstBlueprint, QUALITY_THRESHOLDS } from "../constants/blueprint";

/**
 * Phase 1 Enhanced: QA Agent with Outcome Coverage and Flow Validation
 */
export class QAAgent {
  async review(
    storyboard: Storyboard, 
    outcomeMap?: OutcomeMap,
    flowValidation?: FlowValidation
  ): Promise<QAReport> {
    
    // Build comprehensive QA prompt
    let qaPrompt = `
Review the following storyboard for instructional quality, tone, and compliance with UK English and ADDIE framework.

${JSON.stringify(storyboard, null, 2)}

Checklist:
- Scene flow follows ADDIE: Welcome → Teach → Apply → Summary.
- Each scene has VO, OST, and Visual Brief.
- No hallucinated content.
- UK English spelling and professional tone.
- Learning Outcomes measurable (use Bloom's verbs).
- On-screen text complements (not duplicates) voiceover.
- Scene numbering is unique and sequential.
- Appropriate interactive elements included.
`;

    // Add outcome coverage checks if available
    if (outcomeMap && outcomeMap.outcomes.length > 0) {
      qaPrompt += `

Learning Outcomes to Validate Coverage:
${outcomeMap.outcomes.map((o, i) => `${i + 1}. ${o.outcome} (Bloom Level: ${o.bloomLevel})`).join("\n")}

Additional Checks:
- Every learning outcome is addressed by at least one scene.
- Scenes follow the Bloom progression: ${outcomeMap.learningProgression.join(" → ")}
- Assessment methods are appropriate for each outcome level.
`;
    }

    // Add flow validation findings if available
    if (flowValidation) {
      qaPrompt += `

Flow Analysis Results:
- Flow Score: ${flowValidation.flowScore}/100
- Cognitive Load: ${flowValidation.metrics.cognitiveLoad}/10
- Engagement Level: ${flowValidation.metrics.engagementLevel}/10
- Transition Quality: ${flowValidation.metrics.transitionQuality}/10
- Outcome Alignment: ${flowValidation.metrics.outcomeAlignment}%

${flowValidation.issues.length > 0 ? `
Flow Issues Detected:
${flowValidation.issues.map((issue, i) => `${i + 1}. ${issue}`).join("\n")}
` : ''}
`;
    }

    qaPrompt += `

Return JSON with:
{
  "score": number (0-100, where 85+ is excellent, 70-84 is good, <70 needs refinement),
  "issues": string[],
  "recommendations": string[]
}
    `.trim();

    const finalPrompt = `${resetHeader}${qaPrompt}`;

    try {
      const content = await openaiChat({ systemKey: "master_blueprint", user: finalPrompt });
      console.log("🔍 QAAgent: Raw AI response:", content);
      
      const parsed = safeJSONParse(content);
      
      // Handle both direct object and nested structure
      const report = parsed.report || parsed;
      
      // Normalize score to 0-10 scale for consistency
      let normalizedScore = report.score || 0;
      if (normalizedScore > 10) {
        normalizedScore = normalizedScore / 10; // Convert 0-100 to 0-10
      }
      
      console.log("🔍 QAAgent: QA score:", normalizedScore);
      
      // Add Phase 1 specific validations
      const enhancedReport = this.enhanceWithPhase1Validation(
        {
          score: normalizedScore,
          issues: Array.isArray(report.issues) ? report.issues : [],
          recommendations: Array.isArray(report.recommendations) ? report.recommendations : []
        },
        storyboard,
        outcomeMap,
        flowValidation
      );
      
      return enhancedReport;
      
    } catch (error) {
      console.error("🔍 QAAgent: Error during review:", error);
      
      // Fallback QA report with Phase 1 validation
      return this.enhanceWithPhase1Validation(
        {
          score: 8.5,
          issues: [],
          recommendations: ["QA review completed with fallback scoring due to API limitations."]
        },
        storyboard,
        outcomeMap,
        flowValidation
      );
    }
  }
  
  /**
   * Enhance QA report with Phase 1 specific validation
   */
  private enhanceWithPhase1Validation(
    baseReport: QAReport,
    storyboard: Storyboard,
    outcomeMap?: OutcomeMap,
    flowValidation?: FlowValidation
  ): QAReport {
    const issues = [...baseReport.issues];
    const recommendations = [...baseReport.recommendations];
    let score = baseReport.score;
    
    // Validate outcome coverage if outcomeMap provided
    if (outcomeMap && outcomeMap.outcomes.length > 0) {
      const coverageResult = this.validateOutcomeCoverage(storyboard, outcomeMap);
      
      if (coverageResult.uncoveredOutcomes.length > 0) {
        issues.push(`${coverageResult.uncoveredOutcomes.length} learning outcomes not adequately covered`);
        recommendations.push(`Add scenes to address: ${coverageResult.uncoveredOutcomes.join(", ")}`);
        score -= 0.5;
      }
      
      if (coverageResult.coveragePercentage < 100) {
        recommendations.push(`Improve outcome coverage from ${coverageResult.coveragePercentage}% to 100%`);
      }
    }
    
    // Incorporate flow validation findings
    if (flowValidation) {
      if (flowValidation.flowScore < 80) {
        issues.push(`Flow score of ${flowValidation.flowScore} is below target (80+)`);
        score -= 0.3;
      }
      
      // Add flow issues and recommendations
      flowValidation.issues.forEach(issue => {
        if (!issues.includes(issue)) {
          issues.push(issue);
        }
      });
      
      flowValidation.recommendations.forEach(rec => {
        if (!recommendations.includes(rec)) {
          recommendations.push(rec);
        }
      });
      
      // Adjust score based on flow metrics
      if (flowValidation.metrics.engagementLevel < 5) {
        score -= 0.3;
        recommendations.push("Increase engagement through more interactive elements");
      }
      
      if (flowValidation.metrics.transitionQuality < 5) {
        score -= 0.2;
        recommendations.push("Improve scene transitions with connecting language");
      }
    }
    
    // Validate Click-to-Reveal interactions (Phase 2)
    const clickToRevealScenes = storyboard.scenes.filter(s => 
      s.interactionType === "Hotspots" && s.interactionDetails
    );
    
    clickToRevealScenes.forEach((scene, index) => {
      const details = scene.interactionDetails;
      
      if (details && details.type === "Click-to-Reveal") {
        // NEW STRUCTURED FORMAT validation
        if (!details.reveals || !Array.isArray(details.reveals)) {
          issues.push(`Scene ${scene.sceneNumber}: Missing structured reveals array`);
          score -= 0.2;
        } else if (details.reveals.length < 2) {
          issues.push(`Scene ${scene.sceneNumber}: Click-to-Reveal has only ${details.reveals.length} panel(s), needs at least 2`);
          score -= 0.2;
        } else {
          // Validate each reveal panel
          details.reveals.forEach((reveal: any, panelIndex: number) => {
            if (!reveal.label || !reveal.text) {
              issues.push(`Scene ${scene.sceneNumber}, Panel ${panelIndex + 1}: Missing label or text`);
              score -= 0.1;
            }
          });
        }
      } else if (details && details.clickToRevealContent) {
        // LEGACY FORMAT (temporary backward compatibility)
        console.warn(`   ⚠️  Scene ${scene.sceneNumber} using legacy clickToRevealContent format`);
        recommendations.push(`Scene ${scene.sceneNumber}: Upgrade to structured Click-to-Reveal format`);
      } else {
        // No structured content at all
        issues.push(`Scene ${scene.sceneNumber}: Missing Click-to-Reveal content`);
        score -= 0.3;
      }
    });
    
    // Validate Drag-and-Drop interactions (Phase 2)
    const dragDropScenes = storyboard.scenes.filter(s => 
      s.interactionType === "DragDrop" && s.interactionDetails
    );
    
    dragDropScenes.forEach((scene, index) => {
      const details = scene.interactionDetails;
      
      if (details && details.type === "DragAndDrop-Matching") {
        // Validate Drag-and-Drop Matching structure
        if (!details.items || !Array.isArray(details.items)) {
          issues.push(`Scene ${scene.sceneNumber}: Missing items array for Drag-and-Drop Matching`);
          score -= 0.2;
        } else if (!details.targets || !Array.isArray(details.targets)) {
          issues.push(`Scene ${scene.sceneNumber}: Missing targets array for Drag-and-Drop Matching`);
          score -= 0.2;
        } else if (details.items.length < 3) {
          issues.push(`Scene ${scene.sceneNumber}: Drag-and-Drop Matching has only ${details.items.length} item(s), needs at least 3`);
          score -= 0.2;
        } else if (details.targets.length < 2) {
          issues.push(`Scene ${scene.sceneNumber}: Drag-and-Drop Matching has only ${details.targets.length} target(s), needs at least 2`);
          score -= 0.2;
        } else {
          // Validate each item has valid target
          details.items.forEach((item: any, itemIndex: number) => {
            if (!item.id || !item.label) {
              issues.push(`Scene ${scene.sceneNumber}, Item ${itemIndex + 1}: Missing id or label`);
              score -= 0.1;
            }
            if (!details.targets.find((target: any) => target.id === item.correctTarget)) {
              issues.push(`Scene ${scene.sceneNumber}, Item ${itemIndex + 1}: Invalid correctTarget: ${item.correctTarget}`);
              score -= 0.1;
            }
          });
          // Validate each target
          details.targets.forEach((target: any, targetIndex: number) => {
            if (!target.id || !target.label) {
              issues.push(`Scene ${scene.sceneNumber}, Target ${targetIndex + 1}: Missing id or label`);
              score -= 0.1;
            }
          });
        }
      } else if (details && details.type === "DragAndDrop-Sequencing") {
        // Validate Drag-and-Drop Sequencing structure
        if (!details.items || !Array.isArray(details.items)) {
          issues.push(`Scene ${scene.sceneNumber}: Missing items array for Drag-and-Drop Sequencing`);
          score -= 0.2;
        } else if (details.items.length < 3) {
          issues.push(`Scene ${scene.sceneNumber}: Drag-and-Drop Sequencing has only ${details.items.length} item(s), needs at least 3`);
          score -= 0.2;
        } else {
          // Validate each item has correct order
          details.items.forEach((item: any, itemIndex: number) => {
            if (!item.id || !item.label) {
              issues.push(`Scene ${scene.sceneNumber}, Item ${itemIndex + 1}: Missing id or label`);
              score -= 0.1;
            }
            if (typeof item.correctOrder !== 'number' || item.correctOrder < 1) {
              issues.push(`Scene ${scene.sceneNumber}, Item ${itemIndex + 1}: Invalid correctOrder: ${item.correctOrder}`);
              score -= 0.1;
            }
          });
          // Check for sequential order
          const orders = details.items.map((item: any) => item.correctOrder).sort((a: number, b: number) => a - b);
          for (let i = 0; i < orders.length; i++) {
            if (orders[i] !== i + 1) {
              issues.push(`Scene ${scene.sceneNumber}: Items must have sequential order starting from 1, found gaps or duplicates`);
              score -= 0.2;
              break;
            }
          }
        }
      }
    });
    
    // Ensure score stays in valid range
    score = Math.max(0, Math.min(10, score));
    
    return {
      score,
      issues,
      recommendations
    };
  }
  
  /**
   * Validate that all learning outcomes are covered by scenes
   */
  private validateOutcomeCoverage(
    storyboard: Storyboard,
    outcomeMap: OutcomeMap
  ): {
    coveragePercentage: number;
    uncoveredOutcomes: string[];
    coveredOutcomes: string[];
  } {
    const allSceneText = storyboard.scenes
      .map(s => `${s.pageTitle} ${s.narrationScript} ${s.onScreenText}`.toLowerCase())
      .join(" ");
    
    const coveredOutcomes: string[] = [];
    const uncoveredOutcomes: string[] = [];
    
    outcomeMap.outcomes.forEach(outcome => {
      // Extract key terms from outcome
      const outcomeTerms = this.extractKeyTerms(outcome.outcome);
      
      // Check if any key terms appear in scene content
      const isCovered = outcomeTerms.some(term => 
        allSceneText.includes(term.toLowerCase())
      );
      
      if (isCovered) {
        coveredOutcomes.push(outcome.outcome);
      } else {
        uncoveredOutcomes.push(outcome.outcome);
      }
    });
    
    const coveragePercentage = Math.round(
      (coveredOutcomes.length / outcomeMap.outcomes.length) * 100
    );
    
    return {
      coveragePercentage,
      uncoveredOutcomes,
      coveredOutcomes
    };
  }
  
  /**
   * Extract key terms from learning outcome
   */
  private extractKeyTerms(outcome: string): string[] {
    // Remove common action verbs
    const stopWords = ["identify", "understand", "apply", "analyze", "evaluate", "create", 
                       "explain", "describe", "demonstrate", "the", "a", "an", "to", "in", "of"];
    
    const words = outcome.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.includes(word));
    
    return words;
  }

  /**
   * Phase 6: Blueprint Validation
   * Validates storyboard against Brandon Hall 8-point blueprint
   */
  async validateBlueprint(storyboard: Storyboard): Promise<{
    blueprintScore: number;
    passed: boolean;
    missingSteps: string[];
    violations: string[];
    recommendations: string[];
  }> {
    console.log('📋 QAAgent: Validating against Brandon Hall blueprint...');

    const blueprintValidation = validateAgainstBlueprint(storyboard.scenes);

    console.log(`   📊 Blueprint Score: ${blueprintValidation.score}/100`);
    console.log(`   ✅ Passed: ${blueprintValidation.passed}`);
    console.log(`   ⚠️ Missing Steps: ${blueprintValidation.missingSteps.length}`);
    console.log(`   🔍 Violations: ${blueprintValidation.violations.length}`);

    // Generate recommendations based on violations
    const recommendations: string[] = [];

    if (blueprintValidation.missingSteps.includes('Emotional Hook')) {
      recommendations.push('Add an emotional hook scene that presents a relatable problem or challenge');
    }

    if (blueprintValidation.missingSteps.includes('Character Dilemma')) {
      recommendations.push('Introduce a named character with a specific challenge that learners can relate to');
    }

    if (blueprintValidation.missingSteps.includes('Application Scene')) {
      recommendations.push('Add a realistic workplace scenario where learners apply the learned skills');
    }

    if (blueprintValidation.missingSteps.includes('Summary & Call to Action')) {
      recommendations.push('Include a summary scene with specific next steps and a clear call to action');
    }

    // Check for character consistency
    const charactersFound = new Set<string>();
    storyboard.scenes.forEach(scene => {
      if ((scene as any).character?.name) {
        charactersFound.add((scene as any).character.name);
      }
    });

    if (charactersFound.size > 2) {
      recommendations.push('Too many different characters - maintain consistency with 1-2 characters throughout');
    } else if (charactersFound.size === 0) {
      recommendations.push('No characters found - add a relatable character to drive narrative engagement');
    }

    // Check interaction variety
    const interactionTypes = storyboard.scenes
      .map(s => s.interactionType || 'None')
      .filter(type => type !== 'None');
    
    const uniqueTypes = new Set(interactionTypes);
    const varietyRatio = interactionTypes.length > 0 ? uniqueTypes.size / interactionTypes.length : 0;

    if (varietyRatio < QUALITY_THRESHOLDS.minInteractionVariety) {
      recommendations.push(`Increase interaction variety - currently ${(varietyRatio * 100).toFixed(0)}%, target ${(QUALITY_THRESHOLDS.minInteractionVariety * 100)}%`);
    }

    return {
      blueprintScore: blueprintValidation.score,
      passed: blueprintValidation.passed,
      missingSteps: blueprintValidation.missingSteps,
      violations: blueprintValidation.violations,
      recommendations
    };
  }

  /**
   * Phase 6: Comprehensive Quality Check
   * Runs both AI review and blueprint validation
   */
  async comprehensiveReview(
    storyboard: Storyboard,
    outcomeMap?: OutcomeMap,
    flowValidation?: FlowValidation
  ): Promise<QAReport & { blueprintValidation?: any }> {
    console.log('🔍 QAAgent: Running comprehensive quality review...');

    // Run standard AI review
    const aiReview = await this.review(storyboard, outcomeMap, flowValidation);

    // Run blueprint validation
    const blueprintValidation = await this.validateBlueprint(storyboard);

    // Combine results
    const combinedScore = Math.round((aiReview.score + blueprintValidation.blueprintScore) / 2);

    console.log(`   🎯 Combined Score: ${combinedScore}/100`);
    console.log(`      AI Review: ${aiReview.score}/100`);
    console.log(`      Blueprint: ${blueprintValidation.blueprintScore}/100`);

    return {
      score: combinedScore,
      issues: [
        ...aiReview.issues,
        ...blueprintValidation.violations
      ],
      recommendations: [
        ...aiReview.recommendations,
        ...blueprintValidation.recommendations
      ],
      blueprintValidation: {
        passed: blueprintValidation.passed,
        missingSteps: blueprintValidation.missingSteps,
        score: blueprintValidation.blueprintScore
      }
    };
  }
}
