// backend/src/utils/enhancedQualityValidator.ts
import type { StoryboardModule, StoryboardScene } from "../types";

export interface EnhancedQualityIssue {
  code: string;
  severity: "error" | "warning" | "info";
  message: string;
  scene?: number;
  field?: string;
  suggestion?: string;
}

export interface EnhancedQualityReport {
  overallScore: number; // 0-100
  issues: EnhancedQualityIssue[];
  metrics: {
    visualSpecificity: number;
    contentFidelity: number;
    knowledgeCheckQuality: number;
    interactivityAppropriateness: number;
    accessibilityCompliance: number;
    brandIntegration: number;
  };
  recommendations: string[];
}

/**
 * Enhanced quality validator that addresses the specific issues mentioned:
 * - Some visuals too generic
 * - Occasional content drift from source docs
 * - Knowledge checks sometimes weak
 */
export function validateEnhancedQuality(storyboard: StoryboardModule, sourceContext?: string): EnhancedQualityReport {
  const scenes = storyboard.scenes || [];
  const issues: EnhancedQualityIssue[] = [];
  const metrics = {
    visualSpecificity: 0,
    contentFidelity: 0,
    knowledgeCheckQuality: 0,
    interactivityAppropriateness: 0,
    accessibilityCompliance: 0,
    brandIntegration: 0,
  };

  let totalScore = 0;
  let maxScore = 0;

  scenes.forEach((scene, index) => {
    const sceneNumber = index + 1;
    const sceneScore = validateSceneQuality(scene, sceneNumber, sourceContext, issues, metrics);
    totalScore += sceneScore;
    maxScore += 100;
  });

  // Calculate overall metrics
  metrics.visualSpecificity = Math.round((metrics.visualSpecificity / scenes.length) * 100);
  metrics.contentFidelity = Math.round((metrics.contentFidelity / scenes.length) * 100);
  metrics.knowledgeCheckQuality = Math.round((metrics.knowledgeCheckQuality / scenes.length) * 100);
  metrics.interactivityAppropriateness = Math.round((metrics.interactivityAppropriateness / scenes.length) * 100);
  metrics.accessibilityCompliance = Math.round((metrics.accessibilityCompliance / scenes.length) * 100);
  metrics.brandIntegration = Math.round((metrics.brandIntegration / scenes.length) * 100);

  const overallScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  const recommendations = generateRecommendations(metrics, issues);

  return {
    overallScore,
    issues,
    metrics,
    recommendations,
  };
}

function validateSceneQuality(
  scene: StoryboardScene,
  sceneNumber: number,
  sourceContext: string | undefined,
  issues: EnhancedQualityIssue[],
  metrics: any
): number {
  let sceneScore = 100;

  // 1. Visual Specificity Check
  const visualScore = checkVisualSpecificity(scene, sceneNumber, issues);
  metrics.visualSpecificity += visualScore;
  sceneScore = Math.min(sceneScore, visualScore);

  // 2. Content Fidelity Check
  const contentScore = checkContentFidelity(scene, sceneNumber, sourceContext, issues);
  metrics.contentFidelity += contentScore;
  sceneScore = Math.min(sceneScore, contentScore);

  // 3. Knowledge Check Quality
  const kcScore = checkKnowledgeCheckQuality(scene, sceneNumber, issues);
  metrics.knowledgeCheckQuality += kcScore;
  sceneScore = Math.min(sceneScore, kcScore);

  // 4. Interactivity Appropriateness
  const interactivityScore = checkInteractivityAppropriateness(scene, sceneNumber, issues);
  metrics.interactivityAppropriateness += interactivityScore;
  sceneScore = Math.min(sceneScore, interactivityScore);

  // 5. Accessibility Compliance
  const accessibilityScore = checkAccessibilityCompliance(scene, sceneNumber, issues);
  metrics.accessibilityCompliance += accessibilityScore;
  sceneScore = Math.min(sceneScore, accessibilityScore);

  // 6. Brand Integration
  const brandScore = checkBrandIntegration(scene, sceneNumber, issues);
  metrics.brandIntegration += brandScore;
  sceneScore = Math.min(sceneScore, brandScore);

  return sceneScore;
}

function checkVisualSpecificity(scene: StoryboardScene, sceneNumber: number, issues: EnhancedQualityIssue[]): number {
  let score = 100;
  const visual = scene.visual as any;

  if (!visual?.visualGenerationBrief) {
    issues.push({
      code: "MISSING_VISUAL_BRIEF",
      severity: "error",
      message: `Scene ${sceneNumber}: Missing visualGenerationBrief`,
      scene: sceneNumber,
      field: "visual.visualGenerationBrief",
      suggestion: "Provide detailed visual brief with subject, setting, composition, lighting, and mood",
    });
    score = 0;
  } else {
    const brief = visual.visualGenerationBrief;
    const checks = [
      { field: "sceneDescription", weight: 25, message: "Scene description" },
      { field: "style", weight: 20, message: "Visual style" },
      { field: "composition", weight: 20, message: "Composition rules" },
      { field: "lighting", weight: 15, message: "Lighting direction" },
      { field: "mood", weight: 10, message: "Emotional mood" },
      { field: "colorPalette", weight: 10, message: "Color palette" },
    ];

    checks.forEach(({ field, weight, message }) => {
      if (!brief[field] || String(brief[field]).trim().length < 10) {
        issues.push({
          code: "GENERIC_VISUAL",
          severity: "warning",
          message: `Scene ${sceneNumber}: ${message} is too generic or missing`,
          scene: sceneNumber,
          field: `visual.visualGenerationBrief.${field}`,
          suggestion: `Provide specific, detailed ${message.toLowerCase()} that matches the content`,
        });
        score -= weight;
      }
    });

    // Check for generic terms
    const genericTerms = ["professional", "clean", "modern", "corporate", "business"];
    const description = String(brief.sceneDescription || "").toLowerCase();
    const hasGenericTerms = genericTerms.some(term => description.includes(term));
    
    if (hasGenericTerms && description.length < 50) {
      issues.push({
        code: "GENERIC_DESCRIPTION",
        severity: "warning",
        message: `Scene ${sceneNumber}: Visual description is too generic`,
        scene: sceneNumber,
        field: "visual.visualGenerationBrief.sceneDescription",
        suggestion: "Use specific, concrete details about subjects, actions, and environment",
      });
      score -= 15;
    }
  }

  return Math.max(0, score);
}

function checkContentFidelity(scene: StoryboardScene, sceneNumber: number, sourceContext: string | undefined, issues: EnhancedQualityIssue[]): number {
  let score = 100;

  if (!sourceContext) return score;

  const narration = String(scene.narration || "").toLowerCase();
  const onScreenText = String(scene.onScreenText || "").toLowerCase();
  const sourceLower = sourceContext.toLowerCase();

  // Check for content drift (generic statements not grounded in source)
  const genericPhrases = [
    "this is important",
    "let's learn about",
    "as we can see",
    "it's worth noting",
    "keep in mind",
    "remember that",
  ];

  const hasGenericPhrases = genericPhrases.some(phrase => 
    narration.includes(phrase) || onScreenText.includes(phrase)
  );

  if (hasGenericPhrases) {
    issues.push({
      code: "CONTENT_DRIFT",
      severity: "warning",
      message: `Scene ${sceneNumber}: Contains generic phrases not grounded in source material`,
      scene: sceneNumber,
      field: "narration/onScreenText",
      suggestion: "Use specific details and examples from the source material",
    });
    score -= 20;
  }

  // Check for source material integration
  const sourceKeywords = extractKeywords(sourceContext);
  const contentKeywords = extractKeywords(narration + " " + onScreenText);
  const keywordOverlap = sourceKeywords.filter(kw => contentKeywords.includes(kw)).length;
  const keywordRatio = sourceKeywords.length > 0 ? keywordOverlap / sourceKeywords.length : 0;

  if (keywordRatio < 0.3) {
    issues.push({
      code: "LOW_SOURCE_INTEGRATION",
      severity: "warning",
      message: `Scene ${sceneNumber}: Low integration with source material (${Math.round(keywordRatio * 100)}% keyword overlap)`,
      scene: sceneNumber,
      field: "content",
      suggestion: "Include more specific details and terminology from the source material",
    });
    score -= 15;
  }

  return Math.max(0, score);
}

function checkKnowledgeCheckQuality(scene: StoryboardScene, sceneNumber: number, issues: EnhancedQualityIssue[]): number {
  let score = 100;
  const kc = scene.knowledgeCheck as any;

  if (!kc || kc.type === "None") return score;

  // Check question quality
  const question = String(kc.question || "").trim();
  if (question.length < 20) {
    issues.push({
      code: "WEAK_QUESTION",
      severity: "error",
      message: `Scene ${sceneNumber}: Knowledge check question is too short`,
      scene: sceneNumber,
      field: "knowledgeCheck.question",
      suggestion: "Create scenario-based questions with specific context",
    });
    score -= 30;
  }

  // Check for scenario-based questions
  const scenarioIndicators = ["imagine", "scenario", "situation", "case", "example", "suppose"];
  const hasScenario = scenarioIndicators.some(indicator => question.toLowerCase().includes(indicator));
  
  if (!hasScenario && kc.type === "SingleSelect") {
    issues.push({
      code: "NON_SCENARIO_QUESTION",
      severity: "warning",
      message: `Scene ${sceneNumber}: Knowledge check should be scenario-based`,
      scene: sceneNumber,
      field: "knowledgeCheck.question",
      suggestion: "Frame questions in realistic scenarios with specific context",
    });
    score -= 15;
  }

  // Check options quality
  const options = kc.options || [];
  if (options.length < 3) {
    issues.push({
      code: "INSUFFICIENT_OPTIONS",
      severity: "error",
      message: `Scene ${sceneNumber}: Knowledge check needs at least 3 options`,
      scene: sceneNumber,
      field: "knowledgeCheck.options",
      suggestion: "Provide 3-4 options with realistic distractors",
    });
    score -= 25;
  }

  // Check feedback quality
  const hasFeedback = options.some((opt: any) => opt.feedback && String(opt.feedback).trim().length > 10);
  if (!hasFeedback) {
    issues.push({
      code: "MISSING_FEEDBACK",
      severity: "warning",
      message: `Scene ${sceneNumber}: Knowledge check options lack detailed feedback`,
      scene: sceneNumber,
      field: "knowledgeCheck.options",
      suggestion: "Provide specific feedback for each option explaining why it's correct or incorrect",
    });
    score -= 20;
  }

  return Math.max(0, score);
}

function checkInteractivityAppropriateness(scene: StoryboardScene, sceneNumber: number, issues: EnhancedQualityIssue[]): number {
  let score = 100;
  const interactionType = String(scene.interactionType || "None");
  
  if (interactionType === "None") return score;

  const content = String(scene.narration || "").toLowerCase();
  const onScreenText = String(scene.onScreenText || "").toLowerCase();
  const fullContent = content + " " + onScreenText;

  // Check if interaction type matches content structure
  const contentStructure = analyzeContentStructure(fullContent);
  const appropriateInteraction = getAppropriateInteractionType(contentStructure);

  if (interactionType !== appropriateInteraction) {
    issues.push({
      code: "MISMATCHED_INTERACTION",
      severity: "warning",
      message: `Scene ${sceneNumber}: Interaction type "${interactionType}" doesn't match content structure`,
      scene: sceneNumber,
      field: "interactionType",
      suggestion: `Consider using "${appropriateInteraction}" for this type of content`,
    });
    score -= 20;
  }

  return Math.max(0, score);
}

function checkAccessibilityCompliance(scene: StoryboardScene, sceneNumber: number, issues: EnhancedQualityIssue[]): number {
  let score = 100;
  const visual = scene.visual as any;

  // Check alt text
  const altText = String(visual?.altText || "").trim();
  if (!altText || altText.length < 10) {
    issues.push({
      code: "MISSING_ALT_TEXT",
      severity: "error",
      message: `Scene ${sceneNumber}: Missing or insufficient alt text`,
      scene: sceneNumber,
      field: "visual.altText",
      suggestion: "Provide descriptive alt text (10+ characters) for screen readers",
    });
    score -= 30;
  }

  // Check accessibility notes
  const accessibilityNotes = String(scene.accessibilityNotes || "").trim();
  if (!accessibilityNotes) {
    issues.push({
      code: "MISSING_ACCESSIBILITY_NOTES",
      severity: "warning",
      message: `Scene ${sceneNumber}: Missing accessibility notes`,
      scene: sceneNumber,
      field: "accessibilityNotes",
      suggestion: "Include keyboard navigation, focus order, and screen reader support notes",
    });
    score -= 15;
  }

  return Math.max(0, score);
}

function checkBrandIntegration(scene: StoryboardScene, sceneNumber: number, issues: EnhancedQualityIssue[]): number {
  let score = 100;
  const visual = scene.visual as any;
  const brief = visual?.visualGenerationBrief;

  if (!brief) return score;

  // Check for brand color integration
  const hasBrandColors = brief.colorPalette && Array.isArray(brief.colorPalette) && brief.colorPalette.length > 0;
  if (!hasBrandColors) {
    issues.push({
      code: "MISSING_BRAND_COLORS",
      severity: "warning",
      message: `Scene ${sceneNumber}: Visual brief lacks brand color palette`,
      scene: sceneNumber,
      field: "visual.visualGenerationBrief.colorPalette",
      suggestion: "Include brand colors in the visual palette",
    });
    score -= 15;
  }

  // Check for brand integration notes
  const hasBrandIntegration = brief.brandIntegration && String(brief.brandIntegration).trim().length > 10;
  if (!hasBrandIntegration) {
    issues.push({
      code: "MISSING_BRAND_INTEGRATION",
      severity: "info",
      message: `Scene ${sceneNumber}: Visual brief lacks brand integration guidance`,
      scene: sceneNumber,
      field: "visual.visualGenerationBrief.brandIntegration",
      suggestion: "Include specific brand integration notes for fonts, colors, and styling",
    });
    score -= 10;
  }

  return Math.max(0, score);
}

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(word => word.length > 3)
    .filter(word => !["this", "that", "with", "from", "they", "have", "been", "were", "said", "each", "which", "their", "time", "will", "about", "there", "could", "other", "after", "first", "well", "also", "new", "want", "because", "any", "these", "give", "day", "most", "us"].includes(word));
}

function analyzeContentStructure(content: string): string {
  if (content.includes("list") || content.includes("bullet") || content.includes("item")) return "list";
  if (content.includes("step") || content.includes("process") || content.includes("sequence")) return "process";
  if (content.includes("compare") || content.includes("versus") || content.includes("difference")) return "comparison";
  if (content.includes("component") || content.includes("part") || content.includes("element")) return "components";
  if (content.includes("timeline") || content.includes("chronological") || content.includes("history")) return "timeline";
  return "general";
}

function getAppropriateInteractionType(structure: string): string {
  const mapping: Record<string, string> = {
    list: "Tabs",
    process: "Timeline",
    comparison: "Dual Cards",
    components: "Hotspots",
    timeline: "Timeline",
    general: "Click-to-Reveal",
  };
  return mapping[structure] || "Click-to-Reveal";
}

function generateRecommendations(metrics: any, issues: EnhancedQualityIssue[]): string[] {
  const recommendations: string[] = [];

  if (metrics.visualSpecificity < 70) {
    recommendations.push("Improve visual specificity by providing detailed visualGenerationBrief with concrete subjects, settings, and composition rules");
  }

  if (metrics.contentFidelity < 70) {
    recommendations.push("Enhance content fidelity by grounding more content in source material and reducing generic statements");
  }

  if (metrics.knowledgeCheckQuality < 70) {
    recommendations.push("Strengthen knowledge checks with scenario-based questions, realistic distractors, and detailed feedback");
  }

  if (metrics.interactivityAppropriateness < 70) {
    recommendations.push("Better match interaction types to content structure (lists→tabs, processes→timelines, etc.)");
  }

  if (metrics.accessibilityCompliance < 80) {
    recommendations.push("Improve accessibility compliance with comprehensive alt text and keyboard navigation notes");
  }

  if (metrics.brandIntegration < 60) {
    recommendations.push("Enhance brand integration with specific color palettes and brand guidelines in visual briefs");
  }

  return recommendations;
}


