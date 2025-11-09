// backend/tests/test_LOBundles.spec.ts

import { describe, it, expect } from "@jest/globals";
import { Page, enforceLOBundles } from "../src/validation";

describe("LO Bundle Validation", () => {
  const los = ["LO1", "LO2"];

  it("should pass when all LOs have complete bundles", () => {
    const pages: Page[] = [
      // LO1 bundle
      {
        pageNumber: "p01",
        title: "Teach LO1",
        pageType: "Text + Image",
        learningObjectiveIds: ["LO1"],
        estimatedDurationSec: 90,
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
      },
      {
        pageNumber: "p02",
        title: "Show LO1",
        pageType: "Interactive: Click-to-Reveal",
        learningObjectiveIds: ["LO1"],
        estimatedDurationSec: 60,
        accessibility: {
          altText: ["Image"],
          keyboardNav: "Tab order: 1. Content. Keyboard: Tab to navigate.",
          contrastNotes: "High contrast",
          screenReader: "Page announced",
        },
        events: [
          { number: "2.1", audio: "Audio 1", ost: "OST 1", devNotes: "Notes 1" },
          { number: "2.2", audio: "Audio 2", ost: "OST 2", devNotes: "Notes 2" },
        ],
      },
      {
        pageNumber: "p03",
        title: "Apply LO1",
        pageType: "Interactive: Drag-and-Drop",
        learningObjectiveIds: ["LO1"],
        estimatedDurationSec: 120,
        accessibility: {
          altText: ["Image"],
          keyboardNav: "Tab order: 1. Content. Keyboard: Tab to navigate.",
          contrastNotes: "High contrast",
          screenReader: "Page announced",
        },
        events: [
          { number: "3.1", audio: "Audio 1", ost: "OST 1", devNotes: "Notes 1" },
          { number: "3.2", audio: "Audio 2", ost: "OST 2", devNotes: "Notes 2" },
        ],
      },
      {
        pageNumber: "p04",
        title: "Check LO1",
        pageType: "Assessment: MCQ",
        learningObjectiveIds: ["LO1"],
        estimatedDurationSec: 90,
        accessibility: {
          altText: ["Image"],
          keyboardNav: "Tab order: 1. Content. Keyboard: Tab to navigate.",
          contrastNotes: "High contrast",
          screenReader: "Page announced",
        },
        events: [
          { number: "4.1", audio: "Audio 1", ost: "OST 1", devNotes: "Notes 1" },
          { number: "4.2", audio: "Audio 2", ost: "OST 2", devNotes: "Notes 2" },
        ],
      },
      // LO2 bundle
      {
        pageNumber: "p05",
        title: "Teach LO2",
        pageType: "Text + Image",
        learningObjectiveIds: ["LO2"],
        estimatedDurationSec: 90,
        accessibility: {
          altText: ["Image"],
          keyboardNav: "Tab order: 1. Content. Keyboard: Tab to navigate.",
          contrastNotes: "High contrast",
          screenReader: "Page announced",
        },
        events: [
          { number: "5.1", audio: "Audio 1", ost: "OST 1", devNotes: "Notes 1" },
          { number: "5.2", audio: "Audio 2", ost: "OST 2", devNotes: "Notes 2" },
        ],
      },
      {
        pageNumber: "p06",
        title: "Show LO2",
        pageType: "Interactive: Click-to-Reveal",
        learningObjectiveIds: ["LO2"],
        estimatedDurationSec: 60,
        accessibility: {
          altText: ["Image"],
          keyboardNav: "Tab order: 1. Content. Keyboard: Tab to navigate.",
          contrastNotes: "High contrast",
          screenReader: "Page announced",
        },
        events: [
          { number: "6.1", audio: "Audio 1", ost: "OST 1", devNotes: "Notes 1" },
          { number: "6.2", audio: "Audio 2", ost: "OST 2", devNotes: "Notes 2" },
        ],
      },
      {
        pageNumber: "p07",
        title: "Apply LO2",
        pageType: "Interactive: Drag-and-Drop",
        learningObjectiveIds: ["LO2"],
        estimatedDurationSec: 120,
        accessibility: {
          altText: ["Image"],
          keyboardNav: "Tab order: 1. Content. Keyboard: Tab to navigate.",
          contrastNotes: "High contrast",
          screenReader: "Page announced",
        },
        events: [
          { number: "7.1", audio: "Audio 1", ost: "OST 1", devNotes: "Notes 1" },
          { number: "7.2", audio: "Audio 2", ost: "OST 2", devNotes: "Notes 2" },
        ],
      },
      {
        pageNumber: "p08",
        title: "Check LO2",
        pageType: "Assessment: MCQ",
        learningObjectiveIds: ["LO2"],
        estimatedDurationSec: 90,
        accessibility: {
          altText: ["Image"],
          keyboardNav: "Tab order: 1. Content. Keyboard: Tab to navigate.",
          contrastNotes: "High contrast",
          screenReader: "Page announced",
        },
        events: [
          { number: "8.1", audio: "Audio 1", ost: "OST 1", devNotes: "Notes 1" },
          { number: "8.2", audio: "Audio 2", ost: "OST 2", devNotes: "Notes 2" },
        ],
      },
    ];

    expect(() => enforceLOBundles(pages, los)).not.toThrow();
  });

  it("should fail when LO1 is missing TEACH page", () => {
    const pages: Page[] = [
      // LO1 missing TEACH
      {
        pageNumber: "p01",
        title: "Show LO1",
        pageType: "Interactive: Click-to-Reveal",
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
      },
    ];

    expect(() => enforceLOBundles(pages, los)).toThrow("LO bundle incomplete");
  });

  it("should fail when LO1 is missing CHECK page", () => {
    const pages: Page[] = [
      {
        pageNumber: "p01",
        title: "Teach LO1",
        pageType: "Text + Image",
        learningObjectiveIds: ["LO1"],
        estimatedDurationSec: 90,
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
      },
      {
        pageNumber: "p02",
        title: "Show LO1",
        pageType: "Interactive: Click-to-Reveal",
        learningObjectiveIds: ["LO1"],
        estimatedDurationSec: 60,
        accessibility: {
          altText: ["Image"],
          keyboardNav: "Tab order: 1. Content. Keyboard: Tab to navigate.",
          contrastNotes: "High contrast",
          screenReader: "Page announced",
        },
        events: [
          { number: "2.1", audio: "Audio 1", ost: "OST 1", devNotes: "Notes 1" },
          { number: "2.2", audio: "Audio 2", ost: "OST 2", devNotes: "Notes 2" },
        ],
      },
      {
        pageNumber: "p03",
        title: "Apply LO1",
        pageType: "Interactive: Drag-and-Drop",
        learningObjectiveIds: ["LO1"],
        estimatedDurationSec: 120,
        accessibility: {
          altText: ["Image"],
          keyboardNav: "Tab order: 1. Content. Keyboard: Tab to navigate.",
          contrastNotes: "High contrast",
          screenReader: "Page announced",
        },
        events: [
          { number: "3.1", audio: "Audio 1", ost: "OST 1", devNotes: "Notes 1" },
          { number: "3.2", audio: "Audio 2", ost: "OST 2", devNotes: "Notes 2" },
        ],
      },
      // Missing CHECK page
    ];

    expect(() => enforceLOBundles(pages, los)).toThrow("LO bundle incomplete");
  });
});



