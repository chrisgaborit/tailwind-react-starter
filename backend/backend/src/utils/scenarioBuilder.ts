// backend/src/utils/scenarioBuilder.ts
import { Page } from "../validation";

/**
 * Build a 4-page scenario arc: Setup → Decision → Consequence → Debrief
 * 
 * This generates the page structure for a complete scenario following
 * the Brandon Hall architecture pattern.
 */
export function buildScenario(title: string, loId: string): Array<Partial<Page>> {
  const make = (type: Page["pageType"], idx: number): Partial<Page> => ({
    title: `${title} — ${type.replace("Scenario: ", "")}`,
    pageType: type,
    learningObjectiveIds: [loId],
    estimatedDurationSec: type === "Scenario: Setup" ? 60 : type === "Scenario: Decision" ? 90 : type === "Scenario: Consequence" ? 75 : 45,
    accessibility: {
      altText: [`Scenario ${type} illustration for ${title}`],
      keyboardNav: "Tab order: 1. Scenario content, 2. Decision options (if applicable), 3. Continue button. Keyboard: Use Arrow keys to navigate options, Enter to select.",
      contrastNotes: "High contrast text on background for readability.",
      screenReader: `Scenario ${type} page. ${type === "Scenario: Decision" ? "Use arrow keys to select a decision option." : ""}`,
    },
    events: [
      {
        number: `${idx}.1`,
        audio: `Introduction to ${type.toLowerCase()} for ${title}`,
        ost: `Scenario ${type} content`,
        devNotes: `This event sets up the ${type} phase of the scenario.`,
      },
      {
        number: `${idx}.2`,
        audio: `Additional context or instruction for ${type.toLowerCase()}`,
        ost: `Supporting information`,
        devNotes: `Supplemental content for ${type}.`,
      },
    ],
  });

  return [
    make("Scenario: Setup", 1),
    make("Scenario: Decision", 2),
    make("Scenario: Consequence", 3),
    make("Scenario: Debrief", 4),
  ];
}

/**
 * Generate scenario page numbers given a starting page number
 */
export function assignScenarioPageNumbers(
  scenarioPages: Array<Partial<Page>>,
  startPageNumber: number
): Array<Partial<Page>> {
  return scenarioPages.map((page, idx) => ({
    ...page,
    pageNumber: `p${String(startPageNumber + idx).padStart(2, "0")}`,
  }));
}



