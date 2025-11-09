// backend/tests/test_Accessibility.spec.ts

import { describe, it, expect } from "@jest/globals";
import { Page, enforceAccessibility } from "../src/validation";

describe("Accessibility Validation", () => {
  const basePage: Partial<Page> = {
    pageNumber: "p01",
    title: "Test Page",
    pageType: "Text + Image" as Page["pageType"],
    learningObjectiveIds: ["LO1"],
    estimatedDurationSec: 60,
    events: [
      { number: "1.1", audio: "Audio 1", ost: "OST 1", devNotes: "Notes 1" },
      { number: "1.2", audio: "Audio 2", ost: "OST 2", devNotes: "Notes 2" },
    ],
  };

  it("should pass with complete accessibility fields", () => {
    const page: Page = {
      ...basePage,
      accessibility: {
        altText: ["Image description 1", "Image description 2"],
        keyboardNav: "Tab order: 1. Main content, 2. Continue button. Keyboard: Use Tab to navigate, Enter to activate.",
        contrastNotes: "High contrast text on background for readability.",
        screenReader: "Page title and main content announced to screen reader users.",
      },
    } as Page;

    expect(() => enforceAccessibility(page)).not.toThrow();
  });

  it("should fail with empty altText array", () => {
    const page: Page = {
      ...basePage,
      accessibility: {
        altText: [],
        keyboardNav: "Tab order: 1. Content. Keyboard: Tab to navigate.",
        contrastNotes: "High contrast",
        screenReader: "Page announced",
      },
    } as Page;

    expect(() => enforceAccessibility(page)).toThrow("missing alt text");
  });

  it("should fail with missing keyboardNav tab order", () => {
    const page: Page = {
      ...basePage,
      accessibility: {
        altText: ["Image"],
        keyboardNav: "Use keyboard to navigate",
        contrastNotes: "High contrast",
        screenReader: "Page announced",
      },
    } as Page;

    expect(() => enforceAccessibility(page)).toThrow("missing keyboard navigation map");
  });

  it("should fail with missing keyboardNav Keyboard section", () => {
    const page: Page = {
      ...basePage,
      accessibility: {
        altText: ["Image"],
        keyboardNav: "Tab order: 1. Content",
        contrastNotes: "High contrast",
        screenReader: "Page announced",
      },
    } as Page;

    expect(() => enforceAccessibility(page)).toThrow("missing keyboard navigation map");
  });
});



