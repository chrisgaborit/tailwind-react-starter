// backend/src/validation.ts
import { z } from "zod";

/**
 * Brandon Hall Architecture - Validation Schemas
 * 
 * Strict Zod schemas enforcing the four-column page structure,
 * accessibility requirements, and pedagogical loop per LO.
 */

export const Event = z.object({
  number: z.string().regex(/^\d+\.\d+$/), // e.g., 1.1, 1.2
  // allow longer narration strings for text-to-speech or audio subtitles
  audio: z.string().min(1).max(2000),
  ost: z.string().min(1),
  devNotes: z.string().min(1),
});

export const Accessibility = z.object({
  altText: z.array(z.string()),
  keyboardNav: z.string(), // Include tab order and key bindings
  contrastNotes: z.string(),
  screenReader: z.string(), // SR announcements, focus changes
});

export const PageSchema = z.object({
  pageNumber: z.string().regex(/^p\d{2}$/),
  title: z.string().min(3),
  pageType: z.enum([
    "Course Launch",
    "Text + Image",
    "Text + Video",
    "Interactive: Click-to-Reveal",
    "Interactive: Timeline",
    "Interactive: Hotspot",
    "Interactive: Drag-and-Drop",
    "Scenario: Setup",
    "Scenario: Decision",
    "Scenario: Consequence",
    "Scenario: Debrief",
    "Assessment: MCQ",
    "Assessment: MRQ",
    "Summary",
  ]),
  learningObjectiveIds: z.array(z.string()).nonempty(),
  estimatedDurationSec: z.number().int().min(15).max(120),
  accessibility: Accessibility,
  events: z.array(Event).min(2).max(12),
});

export const Storyboard = z.object({
  moduleTitle: z.string(),
  toc: z.array(z.object({ pageNumber: z.string(), title: z.string() })).min(1),
  pages: z.array(Page).min(18).max(25),
  assets: z.object({ 
    images: z.array(z.string()), 
    icons: z.array(z.string()) 
  }),
});

export type Storyboard = z.infer<typeof Storyboard>;
export const Page = PageSchema;
export type Page = z.infer<typeof PageSchema>;
export type Event = z.infer<typeof Event>;
export type Accessibility = z.infer<typeof Accessibility>;

/**
 * Pedagogical validators
 */

export interface ValidationError {
  code: string;
  message: string;
  hints: string[];
  violations: Array<{
    pageNumber?: string;
    loId?: string;
    field?: string;
    issue: string;
  }>;
}

/**
 * Enforce LO bundles: Each LO must have TEACH/SHOW/APPLY/CHECK pages
 */
export function enforceLOBundles(pages: Page[], los: string[]): void {
  console.log(`\n🔍 VALIDATION DEBUG: enforceLOBundles`);
  console.log(`   Expected LOs:`, los);
  console.log(`   Total pages to check: ${pages.length}`);
  console.log(`   Pages with LO mappings:`);
  
  const byLO = new Map<string, Page[]>();
  los.forEach((lo) => byLO.set(lo, []));
  
  for (const p of pages) {
    console.log(`   - "${p.title}": LO IDs = [${p.learningObjectiveIds.join(', ')}], Type = ${p.pageType}`);
    for (const lo of p.learningObjectiveIds) {
      const existing = byLO.get(lo);
      if (existing) {
        existing.push(p);
      } else {
        // LO not in expected list - log it
        console.warn(`   ⚠️  Page "${p.title}" has LO ID "${lo}" which is not in expected list`);
      }
    }
  }

  console.log(`\n   Validating LO bundles:`);
  for (const lo of los) {
    const pagesForLO = byLO.get(lo) || [];
    const types = new Set(pagesForLO.map((p) => p.pageType));
    
    console.log(`\n   LO: "${lo}"`);
    console.log(`   Pages found: ${pagesForLO.length}`);
    console.log(`   Types found:`, Array.from(types));
    
    const hasTeach = types.has("Text + Image") || types.has("Text + Video");
    const hasShow = types.has("Interactive: Click-to-Reveal") || types.has("Interactive: Timeline");
    const hasApply = types.has("Interactive: Drag-and-Drop") || types.has("Scenario: Decision");
    const hasCheck = types.has("Assessment: MCQ") || types.has("Assessment: MRQ");
    
    console.log(`   Has TEACH: ${hasTeach}, SHOW: ${hasShow}, APPLY: ${hasApply}, CHECK: ${hasCheck}`);
    
    if (pagesForLO.length > 0) {
      console.log(`   Pages for this LO:`);
      pagesForLO.forEach((p) => {
        console.log(`     - ${p.pageType}: "${p.title}"`);
      });
    } else {
      console.warn(`   ⚠️  No pages found for LO "${lo}"`);
    }
    
    if (!(hasTeach && hasShow && hasApply && hasCheck)) {
      const missing = [];
      if (!hasTeach) missing.push("TEACH");
      if (!hasShow) missing.push("SHOW");
      if (!hasApply) missing.push("APPLY");
      if (!hasCheck) missing.push("CHECK");
      throw new Error(`LO bundle incomplete for ${lo}. Missing: ${missing.join(", ")}`);
    }
  }
  
  console.log(`✅ All LO bundles validated successfully\n`);
}

/**
 * Enforce interaction density: 8-12 interactive/scenario pages (or proportional for larger modules)
 * For modules with >25 pages, allow up to 50% interaction rate
 */
export function enforceInteractionDensity(pages: Page[]): void {
  const interactive = pages.filter(
    (p) => p.pageType.startsWith("Interactive") || p.pageType.startsWith("Scenario")
  );
  const totalPages = pages.length;
  
  // Calculate max interactions based on page count
  // For 18-25 pages: max 12 (original rule)
  // For >25 pages: allow up to 50% interaction rate
  const maxInteractions = totalPages > 25 
    ? Math.ceil(totalPages * 0.5) // 50% for larger modules
    : 12; // Original max for standard modules
  
  if (interactive.length < 8) {
    throw new Error(`Too few interactions (${interactive.length} < 8).`);
  }
  if (interactive.length > maxInteractions) {
    throw new Error(`Too many interactions (${interactive.length} > ${maxInteractions} for ${totalPages} pages).`);
  }
}

/**
 * Enforce knowledge check spread: 5-10 assessment pages
 */
export function enforceKCSpread(pages: Page[], min = 5, max = 10): void {
  const kcs = pages.filter((p) => p.pageType.startsWith("Assessment"));
  
  if (kcs.length < min || kcs.length > max) {
    throw new Error(`Knowledge checks out of range: ${kcs.length} (required: ${min}-${max}).`);
  }
}

/**
 * Enforce accessibility on a single page
 */
export function enforceAccessibility(p: Page): void {
  if (!p.accessibility.altText || p.accessibility.altText.length === 0) {
    throw new Error(`${p.pageNumber} missing alt text.`);
  }
  if (!/Tab order:|Keyboard:/i.test(p.accessibility.keyboardNav)) {
    throw new Error(`${p.pageNumber} missing keyboard navigation map.`);
  }
}

/**
 * Validate all pages with structural, pedagogical, and accessibility checks
 */
export function validateAllPages(pages: Page[], los: string[]): ValidationError | null {
  const violations: ValidationError["violations"] = [];
  const hints: string[] = [];

  try {
    // Zod structural validation
    pages.forEach((p, idx) => {
      try {
        Page.parse(p);
      } catch (error: any) {
        violations.push({
          pageNumber: p.pageNumber,
          issue: `Schema validation failed: ${error.message}`,
        });
      }
    });

    // Pedagogical checks
    try {
      enforceLOBundles(pages, los);
    } catch (error: any) {
      violations.push({
        issue: `LO bundle validation failed: ${error.message}`,
      });
      hints.push("Ensure each LO has TEACH (Text + Image/Video), SHOW (Click-to-Reveal/Timeline), APPLY (Drag-and-Drop/Scenario: Decision), and CHECK (Assessment: MCQ/MRQ) pages.");
    }

    try {
      enforceInteractionDensity(pages);
    } catch (error: any) {
      violations.push({
        issue: `Interaction density validation failed: ${error.message}`,
      });
      hints.push("Add or remove Interactive/Scenario pages to reach 8-12 total interactions.");
    }

    try {
      enforceKCSpread(pages);
    } catch (error: any) {
      violations.push({
        issue: `Knowledge check spread validation failed: ${error.message}`,
      });
      hints.push("Add or remove Assessment pages to reach 5-10 total knowledge checks.");
    }

    // Accessibility checks
    pages.forEach((p) => {
      try {
        enforceAccessibility(p);
      } catch (error: any) {
        violations.push({
          pageNumber: p.pageNumber,
          issue: `Accessibility validation failed: ${error.message}`,
        });
        hints.push(`Page ${p.pageNumber}: Ensure altText array is populated and keyboardNav includes 'Tab order:' and 'Keyboard:' sections.`);
      }
    });

    if (violations.length > 0) {
      return {
        code: "VALIDATION_FAILED",
        message: `Validation failed with ${violations.length} violation(s)`,
        hints,
        violations,
      };
    }

    return null;
  } catch (error: any) {
    return {
      code: "VALIDATION_ERROR",
      message: error.message || "Unknown validation error",
      hints: [],
      violations: [{ issue: error.message || "Unknown error" }],
    };
  }
}

