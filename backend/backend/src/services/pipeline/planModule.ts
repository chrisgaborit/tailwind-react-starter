// backend/src/services/pipeline/planModule.ts

/**
 * Pipeline Stage 1: Plan Module
 * 
 * Builds LO bundles with page stubs for TEACH/SHOW/APPLY/CHECK (+ REFLECT optional).
 * Pre-places two scenarios via buildScenario() mapped to relevant LOs.
 * Creates an assessment plan distributing 5-10 KCs.
 */

import { Page } from "../../validation";
import { buildScenario, assignScenarioPageNumbers } from "../../utils/scenarioBuilder";

export interface ModulePlan {
  loBundles: Array<{
    loId: string;
    loText: string;
    pages: Array<{
      pageType: Page["pageType"];
      title: string;
      estimatedDurationSec: number;
    }>;
  }>;
  scenarios: Array<{
    title: string;
    loId: string;
    pages: Array<Partial<Page>>;
  }>;
  assessmentPlan: {
    totalKCs: number;
    kcDistribution: Array<{
      loId: string;
      count: number;
    }>;
  };
  totalPages: number;
}

export interface PlanModuleInput {
  moduleTitle: string;
  learningObjectives: string[];
  audience?: string;
  duration?: number;
  constraints?: string[];
  level?: number; // 1-4 for interactivity density
  sourceMaterial?: string; // Training material content
}

/**
 * Plan the module structure
 */
export function planModule(input: PlanModuleInput): ModulePlan {
  const { moduleTitle, learningObjectives, duration = 20 } = input;

  // Determine interactivity density based on level
  // Level 1: 1 interaction per 5 scenes, Level 2: 1 per 3, Level 3: 1 per 2, Level 4: every scene
  const level = input.level || 2; // Default to level 2
  const interactionRatios = {
    1: 1 / 5,  // 20% of scenes
    2: 1 / 3,  // 33% of scenes
    3: 1 / 2,  // 50% of scenes
    4: 1,      // 100% of scenes
  };
  const interactionRatio = interactionRatios[level as keyof typeof interactionRatios] || interactionRatios[2];
  
  console.log(`📊 Interactivity level: ${level} (target ratio: ${Math.round(interactionRatio * 100)}%)`);

  // Build LO bundles with TEACH/SHOW/APPLY/CHECK (+ optional REFLECT)
  const loBundles = learningObjectives.map((lo, idx) => {
    const loId = `lo-${idx + 1}`;
    
    console.log(`📋 Planning LO bundle ${idx + 1}: loId="${loId}", loText="${lo.substring(0, 50)}..."`);
    
    return {
      loId,
      loText: lo,
      pages: [
        {
          pageType: "Text + Image" as Page["pageType"],
          title: `Teach: ${lo.substring(0, 50)}`,
          estimatedDurationSec: 90,
        },
        {
          pageType: "Interactive: Click-to-Reveal" as Page["pageType"],
          title: `Show: ${lo.substring(0, 50)}`,
          estimatedDurationSec: 60,
        },
        {
          pageType: "Interactive: Drag-and-Drop" as Page["pageType"],
          title: `Apply: ${lo.substring(0, 50)}`,
          estimatedDurationSec: 120,
        },
        {
          pageType: "Assessment: MCQ" as Page["pageType"],
          title: `Check: ${lo.substring(0, 50)}`,
          estimatedDurationSec: 90,
        },
        // Optional REFLECT
        {
          pageType: "Text + Image" as Page["pageType"],
          title: `Reflect: ${lo.substring(0, 50)}`,
          estimatedDurationSec: 60,
        },
      ],
    };
  });

  // Pre-place two scenarios mapped to relevant LOs
  const scenarios = [
    {
      title: `${moduleTitle} - Scenario 1`,
      loId: learningObjectives.length > 0 ? `lo-${1}` : `lo-1`,
      pages: buildScenario(`${moduleTitle} - Scenario 1`, learningObjectives.length > 0 ? `lo-${1}` : `lo-1`),
    },
    {
      title: `${moduleTitle} - Scenario 2`,
      loId: learningObjectives.length > 1 ? `lo-${2}` : `lo-${1}`,
      pages: buildScenario(`${moduleTitle} - Scenario 2`, learningObjectives.length > 1 ? `lo-${2}` : `lo-1`),
    },
  ];

  // Assessment plan: distribute 5-10 KCs across LOs
  const totalKCs = Math.min(10, Math.max(5, Math.ceil(learningObjectives.length * 1.5)));
  const kcPerLO = Math.floor(totalKCs / learningObjectives.length);
  const remaining = totalKCs - (kcPerLO * learningObjectives.length);

  const kcDistribution = learningObjectives.map((_, idx) => ({
    loId: `lo-${idx + 1}`,
    count: kcPerLO + (idx < remaining ? 1 : 0),
  }));

  // Calculate total pages
  const totalPages = 
    loBundles.reduce((sum, bundle) => sum + bundle.pages.length, 0) + // LO bundle pages
    scenarios.reduce((sum, scenario) => sum + scenario.pages.length, 0) + // Scenario pages
    totalKCs + // Assessment pages
    1 + // Course Launch
    1; // Summary

  return {
    loBundles,
    scenarios,
    assessmentPlan: {
      totalKCs,
      kcDistribution,
    },
    totalPages,
  };
}

