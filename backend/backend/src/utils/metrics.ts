// backend/src/utils/metrics.ts
import { Page, Storyboard } from "../validation";

/**
 * Metrics utilities for word counting, page counting, and density checks
 */

/**
 * Count words in a string
 */
export function countWords(text: string): number {
  if (!text || typeof text !== "string") return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Count words per event
 */
export function countWordsPerEvent(page: Page): number[] {
  return page.events.map((event) => countWords(event.audio));
}

/**
 * Validate event word count (guideline: 15-60 words, hard cap ~2000 chars)
 * Note: This is a guideline check, not a blocker
 */
export function validateEventWordCount(event: { audio: string }): boolean {
  const words = countWords(event.audio);
  const chars = event.audio.length;
  return words >= 15 && words <= 60 && chars <= 2000;
}

/**
 * Count total pages
 */
export function countPages(storyboard: Storyboard): number {
  return storyboard.pages.length;
}

/**
 * Count interactive pages
 */
export function countInteractivePages(pages: Page[]): number {
  return pages.filter(
    (p) => p.pageType.startsWith("Interactive") || p.pageType.startsWith("Scenario")
  ).length;
}

/**
 * Count knowledge check pages
 */
export function countKnowledgeChecks(pages: Page[]): number {
  return pages.filter((p) => p.pageType.startsWith("Assessment")).length;
}

/**
 * Count events per page
 */
export function countEventsPerPage(page: Page): number {
  return page.events.length;
}

/**
 * Validate event count per page (2-12 events)
 */
export function validateEventsPerPage(page: Page): boolean {
  const count = countEventsPerPage(page);
  return count >= 2 && count <= 12;
}

/**
 * Calculate total estimated duration
 */
export function calculateTotalDuration(pages: Page[]): number {
  return pages.reduce((sum, page) => sum + page.estimatedDurationSec, 0);
}

/**
 * Get density metrics for a storyboard
 */
export function getDensityMetrics(storyboard: Storyboard) {
  const pages = storyboard.pages;
  
  return {
    totalPages: countPages(storyboard),
    interactivePages: countInteractivePages(pages),
    knowledgeChecks: countKnowledgeChecks(pages),
    totalDuration: calculateTotalDuration(pages),
    eventsPerPage: pages.map((p) => countEventsPerPage(p)),
    wordsPerEvent: pages.flatMap((p) => countWordsPerEvent(p)),
  };
}

/**
 * Validate density targets
 * Returns warnings for page count (soft validation) and errors for critical issues
 */
export function validateDensityTargets(storyboard: Storyboard): {
  valid: boolean;
  issues: string[];
  warnings: string[];
} {
  const metrics = getDensityMetrics(storyboard);
  const issues: string[] = [];
  const warnings: string[] = [];

  // Page count: soft validation (warnings only, not blockers)
  const minPages = 18;
  const maxPages = 40;
  
  if (metrics.totalPages < minPages || metrics.totalPages > maxPages) {
    const warning = `Page count (${metrics.totalPages}) outside ideal range (${minPages}-${maxPages}) — proceeding.`;
    warnings.push(warning);
    console.warn(`⚠️ ${warning}`);
  } else if (metrics.totalPages > 30) {
    // Additional warning for high page count (30-40 range)
    console.warn(`⚠️ Page count high (${metrics.totalPages}) — continuing anyway`);
  }

  // Calculate max interactions based on page count
  // For 18-25 pages: max 12 (original rule)
  // For >25 pages: allow up to 50% interaction rate
  const maxInteractions = metrics.totalPages > 25 
    ? Math.ceil(metrics.totalPages * 0.5) // 50% for larger modules
    : 12; // Original max for standard modules
  
  if (metrics.interactivePages < 8) {
    issues.push(`Interactive pages (${metrics.interactivePages}) below minimum (8)`);
  }
  if (metrics.interactivePages > maxInteractions) {
    issues.push(`Interactive pages (${metrics.interactivePages}) above maximum (${maxInteractions} for ${metrics.totalPages} pages)`);
  }

  if (metrics.knowledgeChecks < 5 || metrics.knowledgeChecks > 10) {
    issues.push(`Knowledge checks (${metrics.knowledgeChecks}) outside target range (5-10)`);
  }

  // Check event counts per page
  const invalidEventCounts = metrics.eventsPerPage.filter((count) => count < 2 || count > 12);
  if (invalidEventCounts.length > 0) {
    issues.push(`${invalidEventCounts.length} page(s) have invalid event counts (must be 2-12)`);
  }

  // Check word counts - LOG WARNING ONLY, DON'T FAIL
  const invalidWordCounts = metrics.wordsPerEvent.filter((words) => words < 15 || words > 60);  // More relaxed range
  if (invalidWordCounts.length > 0) {
    console.warn(`⚠️ ${invalidWordCounts.length} events outside ideal word count (15-60 words). This is acceptable.`);
    // Don't add to issues - word count is a guideline, not a requirement
  }

  return {
    valid: issues.length === 0, // Only critical issues cause failure
    issues,
    warnings,
  };
}

