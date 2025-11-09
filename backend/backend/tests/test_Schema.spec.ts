// backend/tests/test_Schema.spec.ts

import { describe, it, expect } from "@jest/globals";
import { Page, Storyboard, Page as PageSchema, Storyboard as StoryboardSchema } from "../src/validation";

describe("Zod Schema Validation", () => {
  const validPage: Page = {
    pageNumber: "p01",
    title: "Test Page",
    pageType: "Text + Image",
    learningObjectiveIds: ["LO1"],
    estimatedDurationSec: 60,
    accessibility: {
      altText: ["Image description"],
      keyboardNav: "Tab order: 1. Content. Keyboard: Tab to navigate.",
      contrastNotes: "High contrast",
      screenReader: "Page announced",
    },
    events: [
      {
        number: "1.1",
        audio: "This is a test audio script with exactly twenty five words to meet the requirement for minimum word count here.",
        ost: "On-screen text",
        devNotes: "Developer notes",
      },
      {
        number: "1.2",
        audio: "This is another test audio script with exactly thirty words to meet the minimum requirement for word count here now.",
        ost: "On-screen text 2",
        devNotes: "Developer notes 2",
      },
    ],
  };

  it("should validate a correct Page", () => {
    expect(() => PageSchema.parse(validPage)).not.toThrow();
  });

  it("should fail with invalid pageNumber format", () => {
    const invalid = { ...validPage, pageNumber: "page1" };
    expect(() => PageSchema.parse(invalid)).toThrow();
  });

  it("should fail with invalid pageType", () => {
    const invalid = { ...validPage, pageType: "Invalid Type" };
    expect(() => PageSchema.parse(invalid)).toThrow();
  });

  it("should fail with too few events", () => {
    const invalid = { ...validPage, events: [validPage.events[0]] };
    expect(() => PageSchema.parse(invalid)).toThrow();
  });

  it("should fail with too many events", () => {
    const invalid = {
      ...validPage,
      events: [
        ...validPage.events,
        { number: "1.3", audio: "Audio 3", ost: "OST 3", devNotes: "Notes 3" },
        { number: "1.4", audio: "Audio 4", ost: "OST 4", devNotes: "Notes 4" },
        { number: "1.5", audio: "Audio 5", ost: "OST 5", devNotes: "Notes 5" },
      ],
    };
    expect(() => PageSchema.parse(invalid)).toThrow();
  });

  it("should fail with invalid event number format", () => {
    const invalid = {
      ...validPage,
      events: [{ ...validPage.events[0], number: "1" }],
    };
    expect(() => PageSchema.parse(invalid)).toThrow();
  });

  it("should fail with event audio too long", () => {
    const longAudio = "a".repeat(221); // Exceeds 220 char limit
    const invalid = {
      ...validPage,
      events: [{ ...validPage.events[0], audio: longAudio }],
    };
    expect(() => PageSchema.parse(invalid)).toThrow();
  });

  it("should validate a complete Storyboard", () => {
    const storyboard: Storyboard = {
      moduleTitle: "Test Module",
      toc: [
        { pageNumber: "p01", title: "Page 1" },
        { pageNumber: "p02", title: "Page 2" },
      ],
      pages: [validPage, { ...validPage, pageNumber: "p02" }],
      assets: {
        images: ["image1", "image2"],
        icons: ["icon1"],
      },
    };

    expect(() => StoryboardSchema.parse(storyboard)).not.toThrow();
  });

  it("should fail with too few pages", () => {
    const invalid: Storyboard = {
      moduleTitle: "Test Module",
      toc: [{ pageNumber: "p01", title: "Page 1" }],
      pages: [validPage],
      assets: { images: [], icons: [] },
    };

    expect(() => StoryboardSchema.parse(invalid)).toThrow();
  });

  it("should fail with too many pages", () => {
    const pages = Array.from({ length: 26 }, (_, i) => ({
      ...validPage,
      pageNumber: `p${String(i + 1).padStart(2, "0")}`,
    }));

    const invalid: Storyboard = {
      moduleTitle: "Test Module",
      toc: pages.map((p) => ({ pageNumber: p.pageNumber, title: p.title })),
      pages,
      assets: { images: [], icons: [] },
    };

    expect(() => StoryboardSchema.parse(invalid)).toThrow();
  });
});



