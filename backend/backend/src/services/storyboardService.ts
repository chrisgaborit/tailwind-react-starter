// backend/src/services/storyboardService.ts

/**
 * Brandon Hall Architecture - Storyboard Service Orchestrator
 * 
 * Executes the 5-stage pipeline:
 * 1. planModule - Build LO bundles and scenarios
 * 2. draftByUnit - Generate content via LLM
 * 3. validateAll - Validate against schemas and rules
 * 4. editQuality - Improve audio, accessibility, interactions
 * 5. assembleStoryboard - Final assembly with TOC and numbering
 */

import { Storyboard, ValidationError } from "../validation";
import { planModule, ModulePlan } from "./pipeline/planModule";
import { draftByUnit, draftMultipleUnits, DraftUnitInput } from "./pipeline/draftByUnit";
import { validateAll, ValidationResult } from "./pipeline/validateAll";
import { editQualityBatch } from "./pipeline/editQuality";
import { assembleStoryboard } from "./pipeline/assembleStoryboard";
import { buildScenario, assignScenarioPageNumbers } from "../utils/scenarioBuilder";
import { Page } from "../validation";

export interface StoryboardServiceInput {
  moduleTitle: string;
  learningObjectives: string[];
  audience?: string;
  duration?: number;
  constraints?: string[];
  sourceMaterial?: string;
  level?: number; // 1-4 for interactivity density (default: 2)
}

export interface StoryboardServiceOutput {
  success: true;
  storyboard: Storyboard;
  metadata: {
    totalPages: number;
    interactivePages: number;
    knowledgeChecks: number;
    totalDuration: number;
    scenarios: number;
  };
}

export interface StoryboardServiceError {
  success: false;
  error: ValidationError;
}

/**
 * Generate storyboard using Brandon Hall architecture pipeline
 */
export async function generate(input: StoryboardServiceInput): Promise<StoryboardServiceOutput | StoryboardServiceError> {
  console.log("=".repeat(80));
  console.log("🎬 BRANDON HALL ARCHITECTURE - Storyboard Generation");
  console.log("=".repeat(80));
  console.log(`Module: ${input.moduleTitle}`);
  console.log(`Learning Objectives: ${input.learningObjectives.length}`);
  console.log(`Audience: ${input.audience || "General"}`);
  console.log(`Duration: ${input.duration || 20} minutes`);

  try {
    // ========== STAGE 1: PLAN MODULE ==========
    console.log("\n📋 STAGE 1: Planning Module Structure...");
    const plan = planModule({
      moduleTitle: input.moduleTitle,
      learningObjectives: input.learningObjectives,
      audience: input.audience,
      duration: input.duration,
      constraints: input.constraints,
      level: input.level || 2, // Default to level 2
    });

    console.log(`✅ Planning complete:`);
    console.log(`   📚 LO Bundles: ${plan.loBundles.length}`);
    console.log(`   🎭 Scenarios: ${plan.scenarios.length}`);
    console.log(`   ✅ Knowledge Checks: ${plan.assessmentPlan.totalKCs}`);
    console.log(`   📄 Total Pages Planned: ${plan.totalPages}`);

    // ========== STAGE 2: DRAFT BY UNIT ==========
    console.log("\n✍️  STAGE 2: Drafting Content by Unit...");

    const draftInputs: DraftUnitInput[] = [];

    // Add Course Launch page
    draftInputs.push({
      pageType: "Course Launch",
      title: `Welcome to ${input.moduleTitle}`,
      learningObjectiveIds: [],
      estimatedDurationSec: 45,
    });

    // Add LO bundle pages
    plan.loBundles.forEach((bundle) => {
      bundle.pages.forEach((pagePlan) => {
        draftInputs.push({
          pageType: pagePlan.pageType,
          title: pagePlan.title,
          learningObjectiveIds: [bundle.loId],
          loText: bundle.loText,
          estimatedDurationSec: pagePlan.estimatedDurationSec,
          sourceMaterial: input.sourceMaterial, // Pass source material to each page
        });
      });
    });

    // Add scenario pages
    plan.scenarios.forEach((scenario) => {
      scenario.pages.forEach((pagePlan) => {
        draftInputs.push({
          pageType: pagePlan.pageType as Page["pageType"],
          title: pagePlan.title || scenario.title,
          learningObjectiveIds: scenario.pages[0]?.learningObjectiveIds || [scenario.loId],
          loText: input.learningObjectives.find((_, idx) => `lo-${idx + 1}` === scenario.loId),
          context: `This is part of a 4-page scenario: ${scenario.title}`,
          estimatedDurationSec: pagePlan.estimatedDurationSec || 60,
          sourceMaterial: input.sourceMaterial, // Pass source material to scenarios
        });
      });
    });

    // Add knowledge check pages
    plan.assessmentPlan.kcDistribution.forEach((dist) => {
      for (let i = 0; i < dist.count; i++) {
        draftInputs.push({
          pageType: i % 2 === 0 ? "Assessment: MCQ" : "Assessment: MRQ",
          title: `Knowledge Check ${i + 1} for ${dist.loId}`,
          learningObjectiveIds: [dist.loId],
          estimatedDurationSec: 90,
          sourceMaterial: input.sourceMaterial, // Pass source material to assessments
        });
      }
    });

    // Add Summary page
    draftInputs.push({
      pageType: "Summary",
      title: `Summary: ${input.moduleTitle}`,
      learningObjectiveIds: plan.loBundles.map((b) => b.loId),
      estimatedDurationSec: 60,
    });

    console.log(`   📝 Drafting ${draftInputs.length} pages...`);
    const draftedPages = await draftMultipleUnits(draftInputs, {
      audience: input.audience,
      moduleTitle: input.moduleTitle,
      sourceMaterial: input.sourceMaterial
    });

    // ========== STAGE 3: VALIDATE ALL ==========
    console.log("\n🔍 STAGE 3: Validating All Pages...");
    const validation = validateAll(draftedPages, input.learningObjectives, input.duration);

    if (!validation.valid) {
      console.error("❌ Validation failed:", validation.error);
      return {
        success: false,
        error: validation.error!,
      };
    }

    // ========== STAGE 4: EDIT QUALITY ==========
    console.log("\n✏️  STAGE 4: Editing Quality...");
    const editedPages = await editQualityBatch(draftedPages);

    // Re-validate after editing
    const revalidation = validateAll(editedPages, input.learningObjectives, input.duration);
    if (!revalidation.valid) {
      console.warn("⚠️  Re-validation after quality edit failed, using original pages");
    }

    // ========== STAGE 5: ASSEMBLE STORYBOARD ==========
    console.log("\n📦 STAGE 5: Assembling Final Storyboard...");
    const finalPages = revalidation.valid ? editedPages : draftedPages;
    const storyboard = assembleStoryboard({
      moduleTitle: input.moduleTitle,
      pages: finalPages,
    });

    // ========== FINAL VALIDATION ==========
    console.log("\n✅ FINAL VALIDATION: Running complete validation...");
    const finalValidation = validateAll(storyboard.pages, input.learningObjectives, input.duration);

    if (!finalValidation.valid) {
      console.error("❌ Final validation failed:", finalValidation.error);
      return {
        success: false,
        error: finalValidation.error!,
      };
    }

    // ========== SUCCESS ==========
    console.log("\n" + "=".repeat(80));
    console.log("✅ STORYBOARD GENERATION COMPLETE");
    console.log("=".repeat(80));
    console.log(`📄 Total Pages: ${storyboard.pages.length}`);
    console.log(`🎮 Interactive Pages: ${finalValidation.metrics?.interactivePages || 0}`);
    console.log(`✅ Knowledge Checks: ${finalValidation.metrics?.knowledgeChecks || 0}`);
    console.log(`⏱️  Total Duration: ${finalValidation.metrics?.totalDuration || 0} seconds`);

    return {
      success: true,
      storyboard,
      metadata: {
        totalPages: storyboard.pages.length,
        interactivePages: finalValidation.metrics?.interactivePages || 0,
        knowledgeChecks: finalValidation.metrics?.knowledgeChecks || 0,
        totalDuration: finalValidation.metrics?.totalDuration || 0,
        scenarios: plan.scenarios.length,
      },
    };

  } catch (error: any) {
    console.error("\n" + "=".repeat(80));
    console.error("❌ STORYBOARD GENERATION FAILED");
    console.error("=".repeat(80));
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);

    return {
      success: false,
      error: {
        code: "GENERATION_ERROR",
        message: error.message || "Unknown error during storyboard generation",
        hints: [
          "Check that all learning objectives are provided",
          "Verify API keys are configured",
          "Review logs for specific validation failures",
        ],
        violations: [{ issue: error.message || "Unknown error" }],
      },
    };
  }
}

