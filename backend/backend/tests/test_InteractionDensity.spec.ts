// backend/tests/test_InteractionDensity.spec.ts

import { describe, it, expect } from "@jest/globals";
import { Page, enforceInteractionDensity } from "../src/validation";

describe("Interaction Density Validation", () => {
  const basePage: Partial<Page> = {
    pageNumber: "p01",
    title: "Test Page",
    learningObjectiveIds: ["LO1"],
    estimatedDurationSec: 60,
    accessibility: {
      altText: ["Image"],
      keyboardNav: "Tab order: 1. Content. Keyboard: Tab to navigate.",
      contrastNotes: "High contrast",
      screenReader: "Page announced",
    },
    events: [
      { number: "1.1", audio: "Audio 1", ost: "OST 1", devNotes: "Notes 1" },
      { number: "1.2", audio: "Audio 2", ost: "OST 2", devNotes: "Notes 2" },
    ],
  };

  it("should pass with 8 interactive pages", () => {
    const pages: Page[] = Array.from({ length: 8 }, (_, i) => ({
      ...basePage,
      pageNumber: `p${String(i + 1).padStart(2, "0")}`,
      pageType: "Interactive: Click-to-Reveal" as Page["pageType"],
    })) as Page[];

    expect(() => enforceInteractionDensity(pages)).not.toThrow();
  });

  it("should pass with 12 interactive pages", () => {
    const pages: Page[] = Array.from({ length: 12 }, (_, i) => ({
      ...basePage,
      pageNumber: `p${String(i + 1).padStart(2, "0")}`,
      pageType: "Interactive: Drag-and-Drop" as Page["pageType"],
    })) as Page[];

    expect(() => enforceInteractionDensity(pages)).not.toThrow();
  });

  it("should fail with 7 interactive pages", () => {
    const pages: Page[] = Array.from({ length: 7 }, (_, i) => ({
      ...basePage,
      pageNumber: `p${String(i + 1).padStart(2, "0")}`,
      pageType: "Interactive: Click-to-Reveal" as Page["pageType"],
    })) as Page[];

    expect(() => enforceInteractionDensity(pages)).toThrow("Too few interactions");
  });

  it("should fail with 13 interactive pages", () => {
    const pages: Page[] = Array.from({ length: 13 }, (_, i) => ({
      ...basePage,
      pageNumber: `p${String(i + 1).padStart(2, "0")}`,
      pageType: "Scenario: Setup" as Page["pageType"],
    })) as Page[];

    expect(() => enforceInteractionDensity(pages)).toThrow("Too many interactions");
  });

  it("should count scenario pages as interactive", () => {
    const pages: Page[] = [
      { ...basePage, pageNumber: "p01", pageType: "Scenario: Setup" } as Page,
      { ...basePage, pageNumber: "p02", pageType: "Scenario: Decision" } as Page,
      { ...basePage, pageNumber: "p03", pageType: "Scenario: Consequence" } as Page,
      { ...basePage, pageNumber: "p04", pageType: "Scenario: Debrief" } as Page,
      { ...basePage, pageNumber: "p05", pageType: "Interactive: Click-to-Reveal" } as Page,
      { ...basePage, pageNumber: "p06", pageType: "Interactive: Timeline" } as Page,
      { ...basePage, pageNumber: "p07", pageType: "Interactive: Hotspot" } as Page,
      { ...basePage, pageNumber: "p08", pageType: "Interactive: Drag-and-Drop" } as Page,
    ];

    expect(() => enforceInteractionDensity(pages)).not.toThrow();
  });
});



