// backend/src/services/pipeline/validateAll.ts

/**
 * Pipeline Stage 3: Validate All
 * 
 * Apply Zod schema validation, pedagogical checks, interaction density,
 * KC distribution, scenario completeness, and accessibility checks.
 * Return typed ValidationError with violations when failing.
 */

import { Page, ValidationError, validateAllPages, Storyboard } from "../../validation";
import { validateDensityTargets } from "../../utils/metrics";
import { checkMinimumContent, calculateAverageVoiceoverLength, calculateInteractionCount } from "../../utils/minContentCheck";

export interface ValidationResult {
  valid: boolean;
  error?: ValidationError;
  metrics?: {
    totalPages: number;
    interactivePages: number;
    knowledgeChecks: number;
    totalDuration: number;
  };
}

/**
 * Validate duration estimate based on actual content
 * 
 * Calculates realistic duration based on:
 * - Voiceover words (130 WPM average)
 * - OST words (only when no narration)
 * - Interactive pages (1.5 min each)
 * - Scenario pages (2 min each)
 */
function validateDurationEstimate(pages: Page[], durationMinutes: number): void {
  // Calculate voiceover words from all events with audio
  const voiceoverWords = pages.reduce((total, page) => {
    return total + page.events.reduce((pageTotal, event) => {
      if (event.audio && typeof event.audio === 'string') {
        const words = event.audio.trim().split(/\s+/).filter(Boolean).length;
        return pageTotal + words;
      }
      return pageTotal;
    }, 0);
  }, 0);

  // Calculate OST words only from events with no narration
  const ostWords = pages.reduce((total, page) => {
    return total + page.events
      .filter(e => !e.audio || e.audio.trim().length === 0) // only when no narration
      .reduce((pageTotal, event) => {
        if (event.ost && typeof event.ost === 'string') {
          const words = event.ost.trim().split(/\s+/).filter(Boolean).length;
          return pageTotal + words;
        }
        return pageTotal;
      }, 0);
  }, 0);

  // Count interactive and scenario pages
  const interactivityPages = pages.filter(p => p.pageType.startsWith('Interactive')).length;
  const scenarioPages = pages.filter(p => p.pageType.startsWith('Scenario')).length;

  // Calculate total minutes using realistic eLearning pacing
  // Formula: (voiceover + OST words) / 130 WPM + interactive pages * 1.5 + scenario pages * 2
  const totalMinutes =
    (voiceoverWords + ostWords) / 130 +
    interactivityPages * 1.5 +
    scenarioPages * 2;

  // Define acceptable range (90-110% of target duration)
  const lower = durationMinutes * 0.9;
  const upper = durationMinutes * 1.1;

  // Log warning if outside range (not an error - just guidance)
  if (totalMinutes < lower || totalMinutes > upper) {
    console.warn(`⚠️ Estimated duration ${totalMinutes.toFixed(1)} min outside ideal range ${lower.toFixed(1)}-${upper.toFixed(1)} min (target: ${durationMinutes} min). Proceeding.`);
    console.warn(`   Breakdown: ${voiceoverWords} VO words + ${ostWords} OST words = ${((voiceoverWords + ostWords) / 130).toFixed(1)} min audio`);
    console.warn(`   + ${interactivityPages} interactive pages × 1.5 = ${(interactivityPages * 1.5).toFixed(1)} min`);
    console.warn(`   + ${scenarioPages} scenario pages × 2 = ${(scenarioPages * 2).toFixed(1)} min`);
  } else {
    console.log(`✅ Duration estimate: ${totalMinutes.toFixed(1)} min (within ${lower.toFixed(1)}-${upper.toFixed(1)} min range)`);
  }
}

/**
 * Validate all pages according to Brandon Hall architecture rules
 */
export function validateAll(
  pages: Page[],
  learningObjectives: string[],
  durationMinutes?: number
): ValidationResult {
  console.log(`🔍 Validating ${pages.length} pages against Brandon Hall architecture...`);
  console.log(`   Learning Objectives received:`, learningObjectives);
  
  // Generate LO IDs from learning objectives (matching planModule.ts format)
  // Plan uses lo-1, lo-2, etc., so we need to match that format
  const loIds = learningObjectives.map((_, idx) => `lo-${idx + 1}`);
  console.log(`   Generated LO IDs for validation:`, loIds);

  // Run validateAllPages with LO IDs instead of full text
  const validationError = validateAllPages(pages, loIds);

  if (validationError) {
    console.error(`❌ Validation failed:`, validationError.message);
    return {
      valid: false,
      error: validationError,
    };
  }

  // Additional density checks
  const storyboard: Storyboard = {
    moduleTitle: "Temporary", // Will be set in assembly
    toc: pages.map((p) => ({ pageNumber: p.pageNumber, title: p.title })),
    pages,
    assets: { images: [], icons: [] },
  };

  const densityValidation = validateDensityTargets(storyboard);

  // Log warnings (page count, etc.) but don't fail
  if (densityValidation.warnings && densityValidation.warnings.length > 0) {
    console.warn(`⚠️ Density warnings (non-blocking):`, densityValidation.warnings);
  }

  // Only fail on critical issues (not page count)
  if (!densityValidation.valid) {
    console.error(`❌ Density validation failed:`, densityValidation.issues);
    return {
      valid: false,
      error: {
        code: "DENSITY_FAILED",
        message: `Density targets not met: ${densityValidation.issues.join("; ")}`,
        hints: [
          "Ensure 18-40 total pages (ideal: 18-30)",
          "Ensure 8-12 interactive/scenario pages (or up to 50% for larger modules)",
          "Ensure 5-10 knowledge check pages",
          "Ensure 2-12 events per page",
          "Ideal word count: 15-60 words per event audio (guideline only)",
        ],
        violations: densityValidation.issues.map((issue) => ({
          issue,
        })),
      },
    };
  }

  // MINIMUM CONTENT CHECKS (WARNING ONLY - NOT A BLOCKER)
  console.log(`\n📊 Checking minimum content density (guideline only)...`);
  const contentCheck = checkMinimumContent(pages);
  
  if (!contentCheck.valid) {
    console.warn(`⚠️ Content density guidelines: ${contentCheck.issues.length} page(s) outside ideal range (this is acceptable)`);
    contentCheck.issues.forEach((issue) => {
      console.warn(`   - ${issue.pageNumber}: ${issue.issue}`);
    });
    // Log recommendations but don't fail
    if (contentCheck.recommendations.length > 0) {
      console.warn(`   💡 Recommendations for improvement:`, contentCheck.recommendations.slice(0, 3).join("; "));
    }
    // Don't return error - content density is a guideline, not a requirement
  } else {
    console.log(`✅ All pages meet content density guidelines`);
  }

  // ENHANCED QA THRESHOLDS
  const avgVoiceoverLength = calculateAverageVoiceoverLength(pages);
  const interactionCount = calculateInteractionCount(pages);
  const targetInteractionCount = Math.ceil(pages.length * 0.4); // 40% of pages should be interactive (8-12 for 20-25 pages)

  console.log(`   Average voiceover length: ${Math.round(avgVoiceoverLength)} chars`);
  console.log(`   Interaction count: ${interactionCount} (target: ${targetInteractionCount})`);

  // Voiceover density check (warning only, not a blocker)
  const MIN_VOICEOVER_CHARS = 500; // new soft floor
  if (avgVoiceoverLength < MIN_VOICEOVER_CHARS) {
    console.warn(
      `⚠️ Average voiceover length ${Math.round(avgVoiceoverLength)} below soft threshold (${MIN_VOICEOVER_CHARS}). Proceeding.`
    );
    // Log as warning but don't fail generation
  }

  if (interactionCount < targetInteractionCount) {
    console.error(`❌ Interaction count too low: ${interactionCount} < ${targetInteractionCount}`);
    return {
      valid: false,
      error: {
        code: "LOW_INTERACTION_DENSITY",
        message: `Interaction count (${interactionCount}) below target (${targetInteractionCount})`,
        hints: [
          "Add more interactive pages (Click-to-Reveal, Drag-and-Drop, Scenarios)",
          "Ensure at least 8-12 interactive pages total",
          "Level 1: 1 interaction per 5 scenes, Level 2: 1 per 3, Level 3: 1 per 2, Level 4: every scene",
        ],
        violations: [{ issue: `Interactions: ${interactionCount} (required: ${targetInteractionCount}+)` }],
      },
    };
  }

  console.log(`✅ Content density checks passed`);

  // DURATION ESTIMATE VALIDATION (WARNING ONLY)
  if (durationMinutes && typeof durationMinutes === 'number' && durationMinutes > 0) {
    console.log(`\n⏱️  Validating duration estimate...`);
    validateDurationEstimate(pages, durationMinutes);
  }

  // Calculate metrics
  const interactivePages = pages.filter(
    (p) => p.pageType.startsWith("Interactive") || p.pageType.startsWith("Scenario")
  ).length;

  const knowledgeChecks = pages.filter((p) => p.pageType.startsWith("Assessment")).length;

  const totalDuration = pages.reduce((sum, p) => sum + p.estimatedDurationSec, 0);

  console.log(`✅ Validation passed:`);
  console.log(`   📄 Total pages: ${pages.length}`);
  console.log(`   🎮 Interactive pages: ${interactivePages}`);
  console.log(`   ✅ Knowledge checks: ${knowledgeChecks}`);
  console.log(`   ⏱️  Total duration: ${totalDuration} seconds (${Math.round(totalDuration / 60)} minutes)`);

  return {
    valid: true,
    metrics: {
      totalPages: pages.length,
      interactivePages,
      knowledgeChecks,
      totalDuration,
    },
  };
}

