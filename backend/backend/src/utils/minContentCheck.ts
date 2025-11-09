// backend/src/utils/minContentCheck.ts

/**
 * Minimum Content Check Validator
 * 
 * Ensures all pages meet minimum content density requirements before PDF export.
 * Halts generation and triggers regeneration for low-density scenes.
 */

import { Page } from "../validation";

export interface ContentCheckResult {
  valid: boolean;
  issues: Array<{
    pageNumber: string;
    pageTitle: string;
    issue: string;
    current: number;
    required: number;
  }>;
  recommendations: string[];
}

/**
 * Check minimum content density for all pages
 */
export function checkMinimumContent(pages: Page[]): ContentCheckResult {
  const issues: ContentCheckResult["issues"] = [];
  const recommendations: string[] = [];

  pages.forEach((page) => {
    // Calculate total voiceover length
    const totalVoiceover = page.events.reduce((sum, e) => sum + e.audio.length, 0);
    const totalOST = page.events.reduce((sum, e) => sum + e.ost.length, 0);
    
    // Relaxed thresholds based on page type
    let minVoiceoverChars: number;
    let maxVoiceoverChars: number | null = null; // Optional upper bound for some types
    
    if (page.pageType === "Text + Image" || page.pageType === "Text + Video") {
      minVoiceoverChars = 400; // Text+Image: 400
    } else if (page.pageType.startsWith("Interactive")) {
      minVoiceoverChars = 350;
      maxVoiceoverChars = 450; // Interactive: 350-450
    } else if (page.pageType.startsWith("Scenario")) {
      minVoiceoverChars = 300;
      maxVoiceoverChars = 400; // Scenario: 300-400
    } else if (page.pageType.startsWith("Assessment")) {
      minVoiceoverChars = 200; // Assessments can be shorter
    } else if (page.pageType === "Course Launch" || page.pageType === "Summary") {
      minVoiceoverChars = 300; // Launch/Summary: 300
    } else {
      minVoiceoverChars = 400; // Default: 400
    }

    // Check voiceover (lower bound)
    if (totalVoiceover < minVoiceoverChars) {
      issues.push({
        pageNumber: page.pageNumber,
        pageTitle: page.title,
        issue: `Voiceover too short: ${totalVoiceover} chars (ideal: ${minVoiceoverChars}+)`,
        current: totalVoiceover,
        required: minVoiceoverChars,
      });
      recommendations.push(`Page ${page.pageNumber}: Expand voiceover with more narrative detail and examples`);
    }

    // Check voiceover (upper bound for Interactive/Scenario)
    if (maxVoiceoverChars && totalVoiceover > maxVoiceoverChars) {
      issues.push({
        pageNumber: page.pageNumber,
        pageTitle: page.title,
        issue: `Voiceover too long: ${totalVoiceover} chars (ideal: ${maxVoiceoverChars} max)`,
        current: totalVoiceover,
        required: maxVoiceoverChars,
      });
      recommendations.push(`Page ${page.pageNumber}: Consider condensing voiceover content`);
    }

    // Relaxed OST threshold (30% of voiceover, minimum 150)
    const minOSTChars = Math.max(150, Math.floor(totalVoiceover * 0.3));

    // Check on-screen text
    if (totalOST < minOSTChars) {
      issues.push({
        pageNumber: page.pageNumber,
        pageTitle: page.title,
        issue: `On-screen text too short: ${totalOST} chars (ideal: ${minOSTChars}+)`,
        current: totalOST,
        required: minOSTChars,
      });
      recommendations.push(`Page ${page.pageNumber}: Expand on-screen text to complement voiceover`);
    }

    // Check for behavioral examples (simple heuristic: look for action verbs)
    const hasActionVerbs = page.events.some((e) => 
      /(choose|decide|drag|sort|match|select|apply|practice|demonstrate)/i.test(e.audio)
    );
    
    if (!hasActionVerbs && (page.pageType === "Interactive: Drag-and-Drop" || page.pageType.startsWith("Scenario"))) {
      issues.push({
        pageNumber: page.pageNumber,
        pageTitle: page.title,
        issue: `Missing learner action verbs (choose, decide, drag, sort, match, select)`,
        current: 0,
        required: 1,
      });
      recommendations.push(`Page ${page.pageNumber}: Add learner action verbs to make it interactive`);
    }
  });

  return {
    valid: issues.length === 0,
    issues,
    recommendations,
  };
}

/**
 * Calculate average voiceover length
 */
export function calculateAverageVoiceoverLength(pages: Page[]): number {
  if (pages.length === 0) return 0;
  
  const total = pages.reduce((sum, page) => {
    return sum + page.events.reduce((pageSum, event) => pageSum + event.audio.length, 0);
  }, 0);
  
  return total / pages.length;
}

/**
 * Calculate interaction count
 */
export function calculateInteractionCount(pages: Page[]): number {
  return pages.filter((p) => 
    p.pageType.startsWith("Interactive") || 
    p.pageType.startsWith("Scenario") ||
    p.pageType.startsWith("Assessment")
  ).length;
}

