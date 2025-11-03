// backend/src/utils/qualityReport.ts
import type { StoryboardModule, Scene } from "../types";

export interface QualityReport {
  overallScore: number; // 0-100
  sceneCount: {
    expected: number;
    actual: number;
    status: "pass" | "fail";
  };
  contentFidelity: {
    score: number;
    issues: string[];
  };
  visualQuality: {
    score: number;
    issues: string[];
  };
  interactionCompleteness: {
    score: number;
    issues: string[];
  };
  accessibilityCompliance: {
    score: number;
    issues: string[];
  };
  brandConsistency: {
    score: number;
    issues: string[];
  };
  recommendations: string[];
}

export function generateQualityReport(storyboard: StoryboardModule, expectedSceneCount: number): QualityReport {
  const scenes = storyboard.scenes || [];
  
  // Scene count validation
  const sceneCountStatus = scenes.length === expectedSceneCount ? "pass" : "fail";
  
  // Content fidelity check
  const contentFidelity = checkContentFidelity(scenes);
  
  // Visual quality check
  const visualQuality = checkVisualQuality(scenes);
  
  // Interaction completeness check
  const interactionCompleteness = checkInteractionCompleteness(scenes);
  
  // Accessibility compliance check
  const accessibilityCompliance = checkAccessibilityCompliance(scenes);
  
  // Brand consistency check
  const brandConsistency = checkBrandConsistency(storyboard);
  
  // Calculate overall score
  const scores = [
    contentFidelity.score,
    visualQuality.score,
    interactionCompleteness.score,
    accessibilityCompliance.score,
    brandConsistency.score
  ];
  const overallScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  
  // Generate recommendations
  const recommendations = generateRecommendations({
    contentFidelity,
    visualQuality,
    interactionCompleteness,
    accessibilityCompliance,
    brandConsistency
  });
  
  return {
    overallScore,
    sceneCount: {
      expected: expectedSceneCount,
      actual: scenes.length,
      status: sceneCountStatus
    },
    contentFidelity,
    visualQuality,
    interactionCompleteness,
    accessibilityCompliance,
    brandConsistency,
    recommendations
  };
}

function checkContentFidelity(scenes: Scene[]): { score: number; issues: string[] } {
  const issues: string[] = [];
  let validScenes = 0;
  
  scenes.forEach((scene, index) => {
    const narration = String(scene.narrationScript || "").trim();
    const onScreenText = String(scene.onScreenText || "").trim();
    
    // Check for generic content
    const genericPhrases = [
      "this is important", "let's learn about", "as we can see", "it's worth noting",
      "keep in mind", "remember that", "it's crucial to", "we need to understand"
    ];
    
    const hasGenericContent = genericPhrases.some(phrase => 
      narration.toLowerCase().includes(phrase) || onScreenText.toLowerCase().includes(phrase)
    );
    
    if (hasGenericContent) {
      issues.push(`Scene ${index + 1}: Contains generic phrases instead of specific content`);
    }
    
    // Check narration quality
    if (narration.length < 20) {
      issues.push(`Scene ${index + 1}: Narration too short (${narration.length} chars)`);
    } else if (narration.length > 500) {
      issues.push(`Scene ${index + 1}: Narration too long (${narration.length} chars)`);
    } else {
      validScenes++;
    }
    
    // Check for content duplication
    if (narration && onScreenText) {
      const overlap = calculateTextOverlap(narration, onScreenText);
      if (overlap > 0.8) {
        issues.push(`Scene ${index + 1}: On-screen text duplicates narration (${Math.round(overlap * 100)}% overlap)`);
      }
    }
  });
  
  const score = scenes.length > 0 ? Math.round((validScenes / scenes.length) * 100) : 0;
  return { score, issues };
}

function checkVisualQuality(scenes: Scene[]): { score: number; issues: string[] } {
  const issues: string[] = [];
  let validScenes = 0;
  
  scenes.forEach((scene, index) => {
    const visual = scene.visual as any;
    const brief = visual?.visualGenerationBrief;
    
    if (!brief) {
      issues.push(`Scene ${index + 1}: Missing visual generation brief`);
      return;
    }
    
    let sceneValid = true;
    
    // Check scene description
    if (!brief.sceneDescription || brief.sceneDescription.length < 20) {
      issues.push(`Scene ${index + 1}: Visual brief scene description too generic`);
      sceneValid = false;
    }
    
    // Check subject
    const subject = brief.subject;
    if (!subject || Object.keys(subject).length === 0) {
      issues.push(`Scene ${index + 1}: Visual brief subject is empty`);
      sceneValid = false;
    }
    
    // Check style
    if (!brief.style || brief.style.length < 5) {
      issues.push(`Scene ${index + 1}: Visual brief style too generic`);
    }
    
    // Check composition
    if (!brief.composition || brief.composition.length < 10) {
      issues.push(`Scene ${index + 1}: Visual brief composition details missing`);
    }
    
    if (sceneValid) validScenes++;
  });
  
  const score = scenes.length > 0 ? Math.round((validScenes / scenes.length) * 100) : 0;
  return { score, issues };
}

function checkInteractionCompleteness(scenes: Scene[]): { score: number; issues: string[] } {
  const issues: string[] = [];
  let validScenes = 0;
  
  scenes.forEach((scene, index) => {
    const interactionType = String(scene.interactionType || "").trim();
    
    if (interactionType && interactionType !== "None") {
      // Check interaction details
      if (!scene.interactionDetails || Object.keys(scene.interactionDetails).length === 0) {
        issues.push(`Scene ${index + 1}: Interactive scene missing interaction details`);
        return;
      }
      
      // Check knowledge check if present
      const kc = scene.knowledgeCheck as any;
      if (kc) {
        if (!kc.question || String(kc.question).trim().length < 10) {
          issues.push(`Scene ${index + 1}: Knowledge check question too short`);
        }
        
        if (!kc.options || !Array.isArray(kc.options) || kc.options.length < 3) {
          issues.push(`Scene ${index + 1}: Knowledge check needs at least 3 options`);
        } else {
          const hasCorrectAnswer = kc.options.some((opt: any) => opt.correct === true);
          if (!hasCorrectAnswer) {
            issues.push(`Scene ${index + 1}: Knowledge check has no correct answer marked`);
          }
        }
      }
    }
    
    validScenes++;
  });
  
  const score = scenes.length > 0 ? Math.round((validScenes / scenes.length) * 100) : 0;
  return { score, issues };
}

function checkAccessibilityCompliance(scenes: Scene[]): { score: number; issues: string[] } {
  const issues: string[] = [];
  let validScenes = 0;
  
  scenes.forEach((scene, index) => {
    let sceneValid = true;
    
    // Check alt text
    const visual = scene.visual as any;
    const altText = visual?.altText || visual?.visualGenerationBrief?.altText;
    if (!altText || String(altText).trim().length < 10) {
      issues.push(`Scene ${index + 1}: Missing or insufficient alt text`);
      sceneValid = false;
    }
    
    // Check accessibility notes
    const accessibilityNotes = String(scene.accessibilityNotes || "").trim();
    if (!accessibilityNotes) {
      issues.push(`Scene ${index + 1}: Missing accessibility notes`);
    }
    
    // Check for keyboard navigation on interactive scenes
    const interactionType = String(scene.interactionType || "").trim();
    if (interactionType && interactionType !== "None") {
      if (!/keyboard|focus/.test(accessibilityNotes.toLowerCase())) {
        issues.push(`Scene ${index + 1}: Interactive scene missing keyboard navigation notes`);
      }
    }
    
    if (sceneValid) validScenes++;
  });
  
  const score = scenes.length > 0 ? Math.round((validScenes / scenes.length) * 100) : 0;
  return { score, issues };
}

function checkBrandConsistency(storyboard: StoryboardModule): { score: number; issues: string[] } {
  const issues: string[] = [];
  let score = 100;
  
  // Check metadata brand information
  const metadata = storyboard.metadata as any;
  const brand = metadata?.brand;
  
  if (!brand) {
    issues.push("Missing brand metadata");
    score -= 20;
  } else {
    if (!brand.colours || !Array.isArray(brand.colours) || brand.colours.length === 0) {
      issues.push("Brand colors not specified");
      score -= 10;
    }
    
    if (!brand.fonts || !Array.isArray(brand.fonts) || brand.fonts.length === 0) {
      issues.push("Brand fonts not specified");
      score -= 10;
    }
    
    if (!brand.guidelines || String(brand.guidelines).trim().length < 10) {
      issues.push("Brand guidelines missing or insufficient");
      score -= 10;
    }
  }
  
  return { score: Math.max(0, score), issues };
}

function generateRecommendations(checks: any): string[] {
  const recommendations: string[] = [];
  
  if (checks.contentFidelity.score < 70) {
    recommendations.push("Improve content fidelity by grounding narration in specific source material and avoiding generic phrases");
  }
  
  if (checks.visualQuality.score < 70) {
    recommendations.push("Enhance visual briefs with specific subjects, detailed compositions, and concrete visual elements");
  }
  
  if (checks.interactionCompleteness.score < 70) {
    recommendations.push("Complete interaction details and knowledge checks with proper options and feedback");
  }
  
  if (checks.accessibilityCompliance.score < 80) {
    recommendations.push("Improve accessibility compliance with comprehensive alt text and keyboard navigation notes");
  }
  
  if (checks.brandConsistency.score < 60) {
    recommendations.push("Enhance brand consistency with proper color palettes, fonts, and brand guidelines");
  }
  
  return recommendations;
}

function calculateTextOverlap(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);
  const commonWords = words1.filter(word => words2.includes(word));
  return commonWords.length / Math.max(words1.length, words2.length);
}


