// backend/src/agents/director/QualityAgent.ts

/**
 * QualityAgent - Director Quality Validator
 * 
 * Validates storyboard quality across 5 dimensions with weighted scoring
 * Ensures 70%+ score threshold for production readiness (temporarily lowered while improving agents)
 * 
 * Validation Dimensions:
 * A. LO Alignment (30%)
 * B. Pedagogical Structure (25%)
 * C. Framework Integration (20%)
 * D. Interactivity Quality (15%)
 * E. Production Readiness (10%)
 */

import { StoryboardModuleV2, SceneV2 } from "../../../../packages/shared/src/storyboardTypesV2";
import { DetectedFramework } from "../specialists/ContentExtractionAgent";
import { LearningPath } from "../specialists/PedagogicalAgent";

/**
 * Validation result structure
 */
export interface ValidationResult {
  overallScore: number; // 0-100
  grade: "A" | "A-" | "B+" | "B" | "B-" | "C+" | "C" | "C-" | "D+" | "D" | "F";
  passed: boolean; // ≥70% (temporarily lowered)
  dimensions: DimensionScores;
  issues: QualityIssue[];
  strengths: string[];
  recommendations: string[];
  revisionGuidance?: RevisionGuidance;
}

export interface DimensionScores {
  loAlignment: DimensionScore; // 30%
  pedagogicalStructure: DimensionScore; // 25%
  frameworkIntegration: DimensionScore; // 20%
  interactivityQuality: DimensionScore; // 15%
  productionReadiness: DimensionScore; // 10%
}

export interface DimensionScore {
  score: number; // 0-100
  weight: number; // percentage weight
  weightedScore: number; // score * weight
  issues: QualityIssue[];
  strengths: string[];
}

export interface QualityIssue {
  severity: "critical" | "high" | "medium" | "low";
  dimension: "LO Alignment" | "Pedagogical Structure" | "Framework Integration" | "Interactivity Quality" | "Production Readiness";
  code: string;
  message: string;
  sceneIndex?: number;
  sceneType?: string;
  recommendation: string;
}

export interface RevisionGuidance {
  priority: "critical" | "high" | "medium";
  actions: string[];
  focusAreas: string[];
  estimatedEffort: string;
}

/**
 * Validation context
 */
export interface ValidationContext {
  storyboard: StoryboardModuleV2;
  learningObjectives: string[];
  framework?: DetectedFramework | null;
  learningPaths?: LearningPath[];
  expectedSceneTypes?: string[]; // TEACH, SHOW, APPLY, CHECK, REFLECT
}

export class QualityAgent {
  
  /**
   * Validate storyboard quality across all dimensions
   */
  async validateStoryboard(context: ValidationContext): Promise<ValidationResult> {
    console.log("\n" + "=".repeat(80));
    console.log("🔍 QualityAgent: Starting comprehensive validation");
    console.log("=".repeat(80));
    console.log(`📊 Storyboard: ${context.storyboard.meta.moduleName}`);
    console.log(`🎯 Learning Objectives: ${context.learningObjectives.length}`);
    console.log(`🎬 Scenes: ${context.storyboard.scenes.length}`);
    console.log(`📐 Framework: ${context.framework?.name || "None"}`);
    
    // Validate each dimension
    console.log("\n📋 Dimension A: LO Alignment (30%)");
    const loAlignment = this.validateLOAlignment(context);
    console.log(`   Score: ${loAlignment.score}/100`);
    console.log(`   Issues: ${loAlignment.issues.length}`);
    
    console.log("\n📋 Dimension B: Pedagogical Structure (25%)");
    const pedagogicalStructure = this.validatePedagogicalStructure(context);
    console.log(`   Score: ${pedagogicalStructure.score}/100`);
    console.log(`   Issues: ${pedagogicalStructure.issues.length}`);
    
    console.log("\n📋 Dimension C: Framework Integration (20%)");
    const frameworkIntegration = this.validateFrameworkIntegration(context);
    console.log(`   Score: ${frameworkIntegration.score}/100`);
    console.log(`   Issues: ${frameworkIntegration.issues.length}`);
    
    console.log("\n📋 Dimension D: Interactivity Quality (15%)");
    const interactivityQuality = this.validateInteractivityQuality(context);
    console.log(`   Score: ${interactivityQuality.score}/100`);
    console.log(`   Issues: ${interactivityQuality.issues.length}`);
    
    console.log("\n📋 Dimension E: Production Readiness (10%)");
    const productionReadiness = this.validateProductionReadiness(context);
    console.log(`   Score: ${productionReadiness.score}/100`);
    console.log(`   Issues: ${productionReadiness.issues.length}`);
    
    // Calculate weighted total score
    const dimensions: DimensionScores = {
      loAlignment: { ...loAlignment, weight: 30, weightedScore: loAlignment.score * 0.30 },
      pedagogicalStructure: { ...pedagogicalStructure, weight: 25, weightedScore: pedagogicalStructure.score * 0.25 },
      frameworkIntegration: { ...frameworkIntegration, weight: 20, weightedScore: frameworkIntegration.score * 0.20 },
      interactivityQuality: { ...interactivityQuality, weight: 15, weightedScore: interactivityQuality.score * 0.15 },
      productionReadiness: { ...productionReadiness, weight: 10, weightedScore: productionReadiness.score * 0.10 }
    };
    
    const overallScore = Math.round(
      dimensions.loAlignment.weightedScore +
      dimensions.pedagogicalStructure.weightedScore +
      dimensions.frameworkIntegration.weightedScore +
      dimensions.interactivityQuality.weightedScore +
      dimensions.productionReadiness.weightedScore
    );
    
    // Determine grade
    const grade = this.calculateGrade(overallScore);
    const QUALITY_THRESHOLD = 70; // Temporarily lowered while improving agents
    const passed = overallScore >= QUALITY_THRESHOLD;
    
    // Collect all issues
    const allIssues = [
      ...dimensions.loAlignment.issues,
      ...dimensions.pedagogicalStructure.issues,
      ...dimensions.frameworkIntegration.issues,
      ...dimensions.interactivityQuality.issues,
      ...dimensions.productionReadiness.issues
    ];
    
    // Collect all strengths
    const allStrengths = [
      ...dimensions.loAlignment.strengths,
      ...dimensions.pedagogicalStructure.strengths,
      ...dimensions.frameworkIntegration.strengths,
      ...dimensions.interactivityQuality.strengths,
      ...dimensions.productionReadiness.strengths
    ];
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(dimensions, allIssues, context);
    
    // Generate revision guidance if score < 70%
    let revisionGuidance: RevisionGuidance | undefined;
    if (!passed) {
      revisionGuidance = this.generateRevisionGuidance(dimensions, allIssues);
    }
    
    console.log("\n" + "=".repeat(80));
    console.log("✅ QualityAgent: Validation Complete");
    console.log("=".repeat(80));
    console.log(`📊 Overall Score: ${overallScore}/100`);
    console.log(`📈 Grade: ${grade}`);
    console.log(`✅ Status: ${passed ? "PASSED" : "FAILED"} (Threshold: 70%)`);
    console.log(`⚠️  Total Issues: ${allIssues.length}`);
    console.log(`💡 Recommendations: ${recommendations.length}`);
    console.log("=".repeat(80) + "\n");
    
    return {
      overallScore,
      grade,
      passed,
      dimensions,
      issues: allIssues,
      strengths: allStrengths,
      recommendations,
      revisionGuidance
    };
  }
  
  /**
   * Dimension A: LO Alignment (30%)
   */
  private validateLOAlignment(context: ValidationContext): DimensionScore {
    const issues: QualityIssue[] = [];
    const strengths: string[] = [];
    let score = 100;
    
    const { storyboard, learningObjectives } = context;
    const scenes = storyboard.scenes;
    
    // Check 1: Each LO has dedicated teaching scenes
    const loCoverage = new Map<string, number>();
    learningObjectives.forEach((lo, index) => {
      loCoverage.set(`LO${index + 1}`, 0);
    });
    
    scenes.forEach((scene, sceneIndex) => {
      // Check if scene mentions or addresses a learning objective
      const sceneText = `${scene.title} ${scene.ost} ${scene.narration}`.toLowerCase();
      learningObjectives.forEach((lo, loIndex) => {
        const loKey = `LO${loIndex + 1}`;
        if (sceneText.includes(lo.toLowerCase().substring(0, 20))) {
          loCoverage.set(loKey, (loCoverage.get(loKey) || 0) + 1);
        }
      });
    });
    
    // Flag missing LO coverage
    loCoverage.forEach((count, loKey) => {
      if (count === 0) {
        issues.push({
          severity: "critical",
          dimension: "LO Alignment",
          code: "MISSING_LO_COVERAGE",
          message: `${loKey} has no dedicated teaching scenes`,
          recommendation: `Add scenes specifically addressing ${loKey}`
        });
        score -= 15;
      } else {
        strengths.push(`${loKey} has ${count} scene(s) addressing it`);
      }
    });
    
    // Check 2: Scene content directly addresses the LO
    scenes.forEach((scene, sceneIndex) => {
      const sceneText = `${scene.title} ${scene.ost} ${scene.narration}`.toLowerCase();
      const hasLOConnection = learningObjectives.some(lo => 
        sceneText.includes(lo.toLowerCase().substring(0, 20))
      );
      
      if (!hasLOConnection && scene.type !== "Informative") {
        issues.push({
          severity: "high",
          dimension: "LO Alignment",
          code: "WEAK_LO_CONNECTION",
          message: `Scene ${sceneIndex + 1} (${scene.title}) has weak connection to learning objectives`,
          sceneIndex,
          recommendation: "Strengthen connection between scene content and learning objectives"
        });
        score -= 5;
      }
    });
    
    // Check 3: Progression builds toward LO mastery
    const expectedSequence = ["TEACH", "SHOW", "APPLY", "CHECK", "REFLECT"];
    const sceneTypes = scenes.map(s => this.inferSceneType(s));
    const hasProperSequence = this.checkSequenceProgression(sceneTypes, expectedSequence);
    
    if (!hasProperSequence) {
      issues.push({
        severity: "high",
        dimension: "LO Alignment",
        code: "POOR_PROGRESSION",
        message: "Scene progression does not build toward LO mastery",
        recommendation: "Ensure scenes follow TEACH→SHOW→APPLY→CHECK→REFLECT sequence per LO"
      });
      score -= 10;
    } else {
      strengths.push("Scene progression follows proper learning sequence");
    }
    
    return {
      score: Math.max(0, score),
      issues,
      strengths
    };
  }
  
  /**
   * Dimension B: Pedagogical Structure (25%)
   */
  private validatePedagogicalStructure(context: ValidationContext): DimensionScore {
    const issues: QualityIssue[] = [];
    const strengths: string[] = [];
    let score = 100;
    
    const { storyboard, learningObjectives } = context;
    const scenes = storyboard.scenes;
    
    // Check 1: Each LO has TEACH→SHOW→APPLY→CHECK→REFLECT sequence
    const expectedSequence = ["TEACH", "SHOW", "APPLY", "CHECK", "REFLECT"];
    const scenesPerLO = Math.ceil(scenes.length / learningObjectives.length);
    const expectedScenesPerLO = 5; // TEACH, SHOW, APPLY, CHECK, REFLECT
    
    if (scenesPerLO < expectedScenesPerLO) {
      issues.push({
        severity: "critical",
        dimension: "Pedagogical Structure",
        code: "MISSING_SCENE_TYPES",
        message: `Expected ${expectedScenesPerLO} scenes per LO, found average of ${scenesPerLO}`,
        recommendation: `Ensure each LO has all 5 scene types: ${expectedSequence.join(" → ")}`
      });
      score -= 20;
    } else {
      strengths.push(`Proper scene count per LO (${scenesPerLO} scenes)`);
    }
    
    // Check 2: Bloom's levels progress appropriately
    const bloomProgression = this.validateBloomProgression(scenes);
    if (!bloomProgression.valid) {
      issues.push({
        severity: "high",
        dimension: "Pedagogical Structure",
        code: "WRONG_BLOOM_PROGRESSION",
        message: bloomProgression.message,
        recommendation: "Ensure Bloom's levels progress from Remember/Understand to Apply/Analyze/Evaluate"
      });
      score -= 15;
    } else {
      strengths.push("Bloom's taxonomy progression is appropriate");
    }
    
    // Check 3: First TEACH scene assumes zero prior knowledge
    const firstTeachScene = scenes.find(s => this.inferSceneType(s) === "TEACH");
    if (firstTeachScene) {
      const hasZeroKnowledge = this.checkZeroKnowledgeAssumption(firstTeachScene);
      if (!hasZeroKnowledge) {
        issues.push({
          severity: "high",
          dimension: "Pedagogical Structure",
          code: "ASSUMES_PRIOR_KNOWLEDGE",
          message: "First TEACH scene assumes prior knowledge",
          sceneIndex: scenes.indexOf(firstTeachScene),
          recommendation: "First TEACH scene should assume zero prior knowledge and explain concepts from basics"
        });
        score -= 10;
      } else {
        strengths.push("First TEACH scene appropriately assumes zero prior knowledge");
      }
    } else {
      issues.push({
        severity: "critical",
        dimension: "Pedagogical Structure",
        code: "MISSING_FIRST_TEACH",
        message: "Missing first TEACH scene",
        recommendation: "Add a TEACH scene that introduces concepts from scratch"
      });
      score -= 15;
    }
    
    // Check 4: Scene types are present
    const sceneTypes = scenes.map(s => this.inferSceneType(s));
    const missingTypes = expectedSequence.filter(type => !sceneTypes.includes(type));
    
    if (missingTypes.length > 0) {
      issues.push({
        severity: "high",
        dimension: "Pedagogical Structure",
        code: "MISSING_SCENE_TYPES",
        message: `Missing scene types: ${missingTypes.join(", ")}`,
        recommendation: `Add missing scene types: ${missingTypes.join(", ")}`
      });
      score -= 10;
    } else {
      strengths.push("All required scene types are present");
    }
    
    return {
      score: Math.max(0, score),
      issues,
      strengths
    };
  }
  
  /**
   * Dimension C: Framework Integration (20%)
   */
  private validateFrameworkIntegration(context: ValidationContext): DimensionScore {
    const issues: QualityIssue[] = [];
    const strengths: string[] = [];
    let score = 100;
    
    const { storyboard, framework } = context;
    const scenes = storyboard.scenes;
    
    // If no framework detected, score is lower but not zero
    if (!framework) {
      issues.push({
        severity: "medium",
        dimension: "Framework Integration",
        code: "FRAMEWORK_NOT_DETECTED",
        message: "No framework (CAPS, LICOP, etc.) detected in source material",
        recommendation: "Consider identifying and applying a framework if applicable"
      });
      score -= 30; // Framework not required but preferred
      return {
        score: Math.max(0, score),
        issues,
        strengths
      };
    }
    
    strengths.push(`Framework detected: ${framework.name}`);
    
    // Check 1: Framework is consistently applied
    const frameworkComponents = framework.components.map(c => c.name.toLowerCase());
    const frameworkMentions = scenes.filter(scene => {
      const sceneText = `${scene.title} ${scene.ost} ${scene.narration}`.toLowerCase();
      return frameworkComponents.some(comp => sceneText.includes(comp));
    }).length;
    
    const frameworkConsistency = (frameworkMentions / scenes.length) * 100;
    
    if (frameworkConsistency < 50) {
      issues.push({
        severity: "high",
        dimension: "Framework Integration",
        code: "INCONSISTENT_FRAMEWORK",
        message: `Framework (${framework.name}) is mentioned in only ${Math.round(frameworkConsistency)}% of scenes`,
        recommendation: `Consistently apply ${framework.name} framework across more scenes`
      });
      score -= 20;
    } else {
      strengths.push(`Framework consistently applied (${Math.round(frameworkConsistency)}% of scenes)`);
    }
    
    // Check 2: Characters and concepts from framework appear
    if (framework.characters && framework.characters.length > 0) {
      const characterNames = framework.characters.map(c => c.name.toLowerCase());
      const characterMentions = scenes.filter(scene => {
        const sceneText = `${scene.title} ${scene.ost} ${scene.narration}`.toLowerCase();
        return characterNames.some(name => sceneText.includes(name));
      }).length;
      
      if (characterMentions === 0) {
        issues.push({
          severity: "medium",
          dimension: "Framework Integration",
          code: "FRAMEWORK_CHARACTERS_MISSING",
          message: `Framework characters (${framework.characters.map(c => c.name).join(", ")}) not used in scenes`,
          recommendation: `Incorporate framework characters: ${framework.characters.map(c => c.name).join(", ")}`
        });
        score -= 10;
      } else {
        strengths.push(`Framework characters appear in ${characterMentions} scene(s)`);
      }
    }
    
    // Check 3: Examples use framework vocabulary
    const frameworkTerms = framework.components.map(c => c.name.toLowerCase());
    const scenesWithFrameworkTerms = scenes.filter(scene => {
      const sceneText = `${scene.title} ${scene.ost} ${scene.narration}`.toLowerCase();
      return frameworkTerms.some(term => sceneText.includes(term));
    }).length;
    
    if (scenesWithFrameworkTerms < scenes.length * 0.3) {
      issues.push({
        severity: "high",
        dimension: "Framework Integration",
        code: "GENERIC_CONTENT",
        message: "Content is too generic and doesn't use framework vocabulary",
        recommendation: `Use ${framework.name} framework terminology and concepts throughout`
      });
      score -= 15;
    } else {
      strengths.push(`Framework vocabulary used in ${scenesWithFrameworkTerms} scene(s)`);
    }
    
    return {
      score: Math.max(0, score),
      issues,
      strengths
    };
  }
  
  /**
   * Dimension D: Interactivity Quality (15%)
   */
  private validateInteractivityQuality(context: ValidationContext): DimensionScore {
    const issues: QualityIssue[] = [];
    const strengths: string[] = [];
    let score = 100;
    
    const { storyboard } = context;
    const scenes = storyboard.scenes;
    
    // Check 1: SHOW scenes have click-to-reveal
    const showScenes = scenes.filter(s => this.inferSceneType(s) === "SHOW");
    showScenes.forEach((scene, index) => {
      const hasClickToReveal = scene.interaction?.kind === "None" ? false :
        scene.interaction && "kind" in scene.interaction && 
        (scene.interaction.kind === "ClickToReveal" || 
         (scene.interaction as any).type === "ClickToReveal");
      
      if (!hasClickToReveal) {
        issues.push({
          severity: "high",
          dimension: "Interactivity Quality",
          code: "MISSING_CLICK_TO_REVEAL",
          message: `SHOW scene ${index + 1} (${scene.title}) missing click-to-reveal interaction`,
          sceneIndex: scenes.indexOf(scene),
          sceneType: "SHOW",
          recommendation: "Add click-to-reveal interaction with 3-4 trigger items"
        });
        score -= 8;
      } else {
        strengths.push(`SHOW scene ${index + 1} has click-to-reveal`);
      }
    });
    
    // Check 2: APPLY scenes have drag-drop or scenarios
    const applyScenes = scenes.filter(s => this.inferSceneType(s) === "APPLY");
    applyScenes.forEach((scene, index) => {
      const hasInteraction = scene.interaction?.kind !== "None" && scene.interaction?.kind !== undefined;
      const isDragDropOrScenario = scene.interaction?.kind === "DragDrop" || 
                                    (scene.interaction as any)?.type === "DragDrop" ||
                                    scene.type === "Interactive";
      
      if (!hasInteraction || !isDragDropOrScenario) {
        issues.push({
          severity: "high",
          dimension: "Interactivity Quality",
          code: "MISSING_APPLY_INTERACTION",
          message: `APPLY scene ${index + 1} (${scene.title}) missing drag-drop or scenario interaction`,
          sceneIndex: scenes.indexOf(scene),
          sceneType: "APPLY",
          recommendation: "Add drag-and-drop matching or scenario-based interaction"
        });
        score -= 8;
      } else {
        strengths.push(`APPLY scene ${index + 1} has appropriate interaction`);
      }
    });
    
    // Check 3: CHECK scenes have mini-quizzes
    const checkScenes = scenes.filter(s => this.inferSceneType(s) === "CHECK");
    checkScenes.forEach((scene, index) => {
      const hasQuiz = scene.interaction?.kind === "MCQ" || 
                      (scene.interaction as any)?.type === "MCQ" ||
                      scene.type === "Assessment";
      
      if (!hasQuiz) {
        issues.push({
          severity: "high",
          dimension: "Interactivity Quality",
          code: "MISSING_QUIZ",
          message: `CHECK scene ${index + 1} (${scene.title}) missing mini-quiz`,
          sceneIndex: scenes.indexOf(scene),
          sceneType: "CHECK",
          recommendation: "Add 2-question mini-quiz to validate understanding"
        });
        score -= 8;
      } else {
        strengths.push(`CHECK scene ${index + 1} has mini-quiz`);
      }
    });
    
    // Check 4: All interactions have feedback
    const interactiveScenes = scenes.filter(s => 
      s.interaction?.kind !== "None" && s.interaction?.kind !== undefined
    );
    
    interactiveScenes.forEach((scene, index) => {
      const hasFeedback = this.checkInteractionFeedback(scene);
      if (!hasFeedback) {
        issues.push({
          severity: "medium",
          dimension: "Interactivity Quality",
          code: "MISSING_FEEDBACK",
          message: `Interactive scene ${index + 1} (${scene.title}) missing feedback`,
          sceneIndex: scenes.indexOf(scene),
          recommendation: "Add immediate feedback for correct/incorrect responses"
        });
        score -= 5;
      }
    });
    
    if (interactiveScenes.length > 0) {
      strengths.push(`${interactiveScenes.length} interactive scene(s) with feedback`);
    }
    
    // Check 5: No decorative-only interactions
    const decorativeScenes = scenes.filter(s => {
      const hasInteraction = s.interaction?.kind !== "None";
      const hasPedagogicalPurpose = this.hasPedagogicalPurpose(s);
      return hasInteraction && !hasPedagogicalPurpose;
    });
    
    if (decorativeScenes.length > 0) {
      issues.push({
        severity: "low",
        dimension: "Interactivity Quality",
        code: "DECORATIVE_INTERACTION",
        message: `${decorativeScenes.length} scene(s) have decorative interactions without pedagogical purpose`,
        recommendation: "Ensure all interactions support learning objectives"
      });
      score -= 3;
    }
    
    return {
      score: Math.max(0, score),
      issues,
      strengths
    };
  }
  
  /**
   * Dimension E: Production Readiness (10%)
   */
  private validateProductionReadiness(context: ValidationContext): DimensionScore {
    const issues: QualityIssue[] = [];
    const strengths: string[] = [];
    let score = 100;
    
    const { storyboard } = context;
    const scenes = storyboard.scenes;
    
    // Check 1: All required fields populated
    scenes.forEach((scene, index) => {
      // OST
      if (!scene.ost || scene.ost.trim().length === 0) {
        issues.push({
          severity: "critical",
          dimension: "Production Readiness",
          code: "MISSING_OST",
          message: `Scene ${index + 1} (${scene.title}) missing on-screen text`,
          sceneIndex: index,
          recommendation: "Add on-screen text (≤70 words)"
        });
        score -= 5;
      }
      
      // Narration
      if (!scene.narration || scene.narration.trim().length === 0) {
        issues.push({
          severity: "critical",
          dimension: "Production Readiness",
          code: "MISSING_NARRATION",
          message: `Scene ${index + 1} (${scene.title}) missing narration/voiceover`,
          sceneIndex: index,
          recommendation: "Add narration script for voiceover"
        });
        score -= 5;
      }
      
      // Visual prompt
      if (!scene.image?.prompt || scene.image.prompt.trim().length === 0) {
        issues.push({
          severity: "high",
          dimension: "Production Readiness",
          code: "MISSING_VISUAL_PROMPT",
          message: `Scene ${index + 1} (${scene.title}) missing visual prompt`,
          sceneIndex: index,
          recommendation: "Add detailed visual generation prompt"
        });
        score -= 3;
      }
      
      // Alt text
      if (!scene.image?.altText || scene.image.altText.trim().length === 0) {
        issues.push({
          severity: "high",
          dimension: "Production Readiness",
          code: "MISSING_ALT_TEXT",
          message: `Scene ${index + 1} (${scene.title}) missing alt text`,
          sceneIndex: index,
          recommendation: "Add descriptive alt text for accessibility"
        });
        score -= 2;
      }
    });
    
    // Check 2: No placeholder text
    const placeholderPatterns = [
      /\[.*\]/,
      /placeholder/i,
      /lorem ipsum/i,
      /todo/i,
      /tbd/i,
      /to be determined/i,
      /example text/i
    ];
    
    scenes.forEach((scene, index) => {
      const sceneText = `${scene.title} ${scene.ost} ${scene.narration}`.toLowerCase();
      placeholderPatterns.forEach(pattern => {
        if (pattern.test(sceneText)) {
          issues.push({
            severity: "high",
            dimension: "Production Readiness",
            code: "PLACEHOLDER_TEXT",
            message: `Scene ${index + 1} (${scene.title}) contains placeholder text`,
            sceneIndex: index,
            recommendation: "Replace placeholder text with actual content"
          });
          score -= 2;
        }
      });
    });
    
    // Check 3: Timing estimates present
    const scenesWithoutTiming = scenes.filter(s => !s.timingSec || s.timingSec === 0);
    if (scenesWithoutTiming.length > 0) {
      issues.push({
        severity: "medium",
        dimension: "Production Readiness",
        code: "MISSING_TIMING",
        message: `${scenesWithoutTiming.length} scene(s) missing timing estimates`,
        recommendation: "Add timing estimates (seconds) for each scene"
      });
      score -= 3;
    } else {
      strengths.push("All scenes have timing estimates");
    }
    
    // Check 4: Accessibility notes included
    const scenesWithoutAccessibility = scenes.filter(s => 
      !s.dev?.accessibilityNotes || s.dev.accessibilityNotes.trim().length === 0
    );
    
    if (scenesWithoutAccessibility.length > scenes.length * 0.5) {
      issues.push({
        severity: "medium",
        dimension: "Production Readiness",
        code: "MISSING_ACCESSIBILITY_NOTES",
        message: `${scenesWithoutAccessibility.length} scene(s) missing accessibility notes`,
        recommendation: "Add accessibility notes for keyboard navigation, screen readers, etc."
      });
      score -= 2;
    } else {
      strengths.push("Most scenes have accessibility notes");
    }
    
    return {
      score: Math.max(0, score),
      issues,
      strengths
    };
  }
  
  // ========== HELPER METHODS ==========
  
  private inferSceneType(scene: SceneV2): "TEACH" | "SHOW" | "APPLY" | "CHECK" | "REFLECT" | "OTHER" {
    const title = scene.title.toLowerCase();
    const narration = scene.narration.toLowerCase();
    
    if (title.includes("teach") || narration.includes("introduc") || narration.includes("explain")) {
      return "TEACH";
    }
    if (title.includes("show") || title.includes("demonstrat") || narration.includes("demonstrate")) {
      return "SHOW";
    }
    if (title.includes("apply") || title.includes("practic") || scene.type === "Interactive") {
      return "APPLY";
    }
    if (title.includes("check") || title.includes("quiz") || title.includes("assess") || scene.type === "Assessment") {
      return "CHECK";
    }
    if (title.includes("reflect") || title.includes("summary") || narration.includes("reflect")) {
      return "REFLECT";
    }
    
    return "OTHER";
  }
  
  private checkSequenceProgression(sceneTypes: string[], expectedSequence: string[]): boolean {
    // Check if we have the expected sequence pattern
    let expectedIndex = 0;
    for (const sceneType of sceneTypes) {
      if (expectedSequence.includes(sceneType)) {
        const currentExpected = expectedSequence[expectedIndex];
        if (sceneType === currentExpected) {
          expectedIndex = (expectedIndex + 1) % expectedSequence.length;
        } else {
          // Allow some flexibility but check if we're progressing
          const currentIndex = expectedSequence.indexOf(sceneType);
          if (currentIndex >= expectedIndex - 1) {
            expectedIndex = currentIndex + 1;
          } else {
            return false; // Regression
          }
        }
      }
    }
    return true;
  }
  
  private validateBloomProgression(scenes: SceneV2[]): { valid: boolean; message: string } {
    // Simple heuristic: CHECK scenes should come after TEACH/SHOW/APPLY
    const sceneTypes = scenes.map(s => this.inferSceneType(s));
    const firstCheckIndex = sceneTypes.indexOf("CHECK");
    const firstTeachIndex = sceneTypes.indexOf("TEACH");
    
    if (firstCheckIndex !== -1 && firstTeachIndex !== -1 && firstCheckIndex < firstTeachIndex) {
      return {
        valid: false,
        message: "CHECK scenes appear before teaching content"
      };
    }
    
    return { valid: true, message: "Bloom progression is appropriate" };
  }
  
  private checkZeroKnowledgeAssumption(scene: SceneV2): boolean {
    const text = `${scene.title} ${scene.ost} ${scene.narration}`.toLowerCase();
    
    // Check for zero-knowledge indicators
    const zeroKnowledgeIndicators = [
      "assume",
      "starting from",
      "beginning",
      "introduction",
      "first",
      "basics",
      "foundation",
      "concept"
    ];
    
    // Check for prior knowledge assumptions (negative indicators)
    const priorKnowledgeIndicators = [
      "as you know",
      "remember",
      "recall",
      "as we discussed",
      "from previous"
    ];
    
    const hasZeroKnowledge = zeroKnowledgeIndicators.some(indicator => text.includes(indicator));
    const hasPriorKnowledge = priorKnowledgeIndicators.some(indicator => text.includes(indicator));
    
    return hasZeroKnowledge && !hasPriorKnowledge;
  }
  
  private checkInteractionFeedback(scene: SceneV2): boolean {
    if (scene.interaction?.kind === "None" || !scene.interaction) {
      return true; // Not applicable
    }
    
    // Check for feedback in interaction
    if (scene.interaction.kind === "MCQ") {
      const mcq = scene.interaction as any;
      return mcq.items?.some((item: any) => 
        item.feedback?.correct || item.options?.some((opt: any) => opt.coaching)
      );
    }
    
    if (scene.interaction.kind === "DragDrop") {
      const dragDrop = scene.interaction as any;
      return dragDrop.feedback?.correct || dragDrop.feedback?.incorrect;
    }
    
    return false;
  }
  
  private hasPedagogicalPurpose(scene: SceneV2): boolean {
    // Check if interaction serves a learning purpose
    const sceneType = this.inferSceneType(scene);
    const hasInteraction = scene.interaction?.kind !== "None";
    
    if (!hasInteraction) return false;
    
    // SHOW scenes should have click-to-reveal
    if (sceneType === "SHOW") {
      return scene.interaction?.kind === "ClickToReveal" || 
             (scene.interaction as any)?.type === "ClickToReveal";
    }
    
    // APPLY scenes should have drag-drop or scenario
    if (sceneType === "APPLY") {
      return scene.interaction?.kind === "DragDrop" || scene.type === "Interactive";
    }
    
    // CHECK scenes should have quiz
    if (sceneType === "CHECK") {
      return scene.interaction?.kind === "MCQ" || scene.type === "Assessment";
    }
    
    return true; // Assume purpose if it's an interaction
  }
  
  private calculateGrade(score: number): "A" | "A-" | "B+" | "B" | "B-" | "C+" | "C" | "C-" | "D+" | "D" | "F" {
    if (score >= 97) return "A";
    if (score >= 93) return "A-";
    if (score >= 87) return "B+";
    if (score >= 83) return "B";
    if (score >= 80) return "B-";
    if (score >= 77) return "C+";
    if (score >= 73) return "C";
    if (score >= 70) return "C-";
    if (score >= 67) return "D+";
    if (score >= 63) return "D";
    return "F";
  }
  
  private generateRecommendations(
    dimensions: DimensionScores,
    issues: QualityIssue[],
    context: ValidationContext
  ): string[] {
    const recommendations: string[] = [];
    
    // Group issues by dimension
    const issuesByDimension = new Map<string, QualityIssue[]>();
    issues.forEach(issue => {
      const existing = issuesByDimension.get(issue.dimension) || [];
      existing.push(issue);
      issuesByDimension.set(issue.dimension, existing);
    });
    
    // Generate recommendations based on dimension scores
    if (dimensions.loAlignment.score < 80) {
      recommendations.push("Strengthen learning objective alignment: Ensure each LO has dedicated scenes and clear progression");
    }
    
    if (dimensions.pedagogicalStructure.score < 80) {
      recommendations.push("Fix pedagogical structure: Ensure TEACH→SHOW→APPLY→CHECK→REFLECT sequence per LO");
    }
    
    if (dimensions.frameworkIntegration.score < 70 && context.framework) {
      recommendations.push(`Improve framework integration: Consistently apply ${context.framework.name} framework across scenes`);
    }
    
    if (dimensions.interactivityQuality.score < 80) {
      recommendations.push("Enhance interactivity: Add missing interactions (click-to-reveal for SHOW, drag-drop for APPLY, quiz for CHECK)");
    }
    
    if (dimensions.productionReadiness.score < 80) {
      recommendations.push("Complete production readiness: Fill missing fields, remove placeholders, add timing and accessibility notes");
    }
    
    // Add specific recommendations from issues
    const criticalIssues = issues.filter(i => i.severity === "critical");
    criticalIssues.forEach(issue => {
      recommendations.push(issue.recommendation);
    });
    
    return [...new Set(recommendations)]; // Remove duplicates
  }
  
  private generateRevisionGuidance(
    dimensions: DimensionScores,
    issues: QualityIssue[]
  ): RevisionGuidance {
    const criticalIssues = issues.filter(i => i.severity === "critical");
    const highIssues = issues.filter(i => i.severity === "high");
    
    let priority: "critical" | "high" | "medium" = "medium";
    if (criticalIssues.length > 0) priority = "critical";
    else if (highIssues.length > 3) priority = "high";
    
    const actions: string[] = [];
    const focusAreas: string[] = [];
    
    // Identify lowest scoring dimension
    const dimensionScores = [
      { name: "LO Alignment", score: dimensions.loAlignment.score },
      { name: "Pedagogical Structure", score: dimensions.pedagogicalStructure.score },
      { name: "Framework Integration", score: dimensions.frameworkIntegration.score },
      { name: "Interactivity Quality", score: dimensions.interactivityQuality.score },
      { name: "Production Readiness", score: dimensions.productionReadiness.score }
    ];
    
    dimensionScores.sort((a, b) => a.score - b.score);
    const lowestDimension = dimensionScores[0];
    
    focusAreas.push(lowestDimension.name);
    
    // Generate actions based on issues
    if (criticalIssues.length > 0) {
      actions.push(`Fix ${criticalIssues.length} critical issue(s) first`);
    }
    
    if (lowestDimension.score < 70) {
      actions.push(`Focus on improving ${lowestDimension.name} (current score: ${lowestDimension.score}/100)`);
    }
    
    // Estimate effort
    const totalIssues = issues.length;
    let estimatedEffort = "Low";
    if (totalIssues > 10) estimatedEffort = "High";
    else if (totalIssues > 5) estimatedEffort = "Medium";
    
    return {
      priority,
      actions,
      focusAreas,
      estimatedEffort
    };
  }
}

export default QualityAgent;

