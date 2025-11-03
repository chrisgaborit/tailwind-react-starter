// backend/src/library/blueprints.ts
// ✅ Master 36-Page Storyboard Blueprint for Level 2 or 3 (20–25 min modules)

import fs from "fs";
import path from "path";
import type { InstructionalBlock } from "../types";

const HUMAN_BLUEPRINT_PATH = path.resolve(
  __dirname,
  "../../samples/current-output.json"
);

const BRANDON_HALL_BLUEPRINT_PATH = path.resolve(
  __dirname,
  "./blueprints/bhBlueprint.json"
);

const KEYWORD_STOP_WORDS = new Set(
  [
    "the",
    "and",
    "with",
    "from",
    "that",
    "this",
    "into",
    "about",
    "using",
    "for",
    "your",
    "their",
    "they",
    "will",
    "have",
    "into",
    "each",
    "then",
    "make",
    "should",
    "include",
    "provide",
    "ensure",
  ].map((word) => word.toLowerCase())
);

const BASE_DURATION_BY_TYPE: Record<string, number> = {
  Administrative: 30,
  "Course Launch Page": 45,
  "Text + Image/Graphic": 55,
  "Timeline Interactivity": 75,
  "Graphic Organiser": 65,
  "Interactive Graphic": 80,
  "Tabbed Interactivity": 90,
  "Click-to-Reveal": 80,
  "Scenario Placeholder": 90,
  "Interactive Placeholder": 65,
  "Scenario MCQ": 95,
  MCQ: 75,
  MRQ: 85,
  "Interactive Multi-select": 90,
  "Knowledge Check": 80,
  End: 30,
};

function normaliseTypeKey(type: string | undefined): string {
  if (!type) return "Informational";
  return type.trim().toLowerCase();
}

function deriveExpectedDuration(
  type: string | undefined,
  title: string | undefined,
  requiresKnowledgeCheck: boolean,
  expectedInteractionType?: string
): number {
  const baseType = type && BASE_DURATION_BY_TYPE[type] ? BASE_DURATION_BY_TYPE[type] : undefined;
  if (requiresKnowledgeCheck) {
    if (expectedInteractionType && /scenario/i.test(expectedInteractionType)) {
      return 95;
    }
    if (expectedInteractionType && /drag|drop|multi/i.test(expectedInteractionType)) {
      return 90;
    }
    return 75;
  }

  if (baseType) return baseType;

  const lowered = normaliseTypeKey(type || title || "");
  if (/timeline/.test(lowered)) return 75;
  if (/tab/.test(lowered)) return 90;
  if (/scenario/.test(lowered)) return 90;
  if (/interactive/.test(lowered)) return 80;
  if (/summary|recap/.test(lowered)) return 55;
  if (/introduction|launch/.test(lowered)) return 50;
  return 50;
}

function detectExpectedInteractionType(
  type: string | undefined,
  title: string | undefined,
  content: string | undefined,
  requiresKnowledgeCheck: boolean
): string | undefined {
  const combined = `${type || ""} ${title || ""} ${content || ""}`.toLowerCase();

  if (requiresKnowledgeCheck) {
    if (/(scenario|case study)/.test(combined)) return "Scenario MCQ";
    if (/multi[-\s]?select|mrq/.test(combined)) return "Multiple Response";
    if (/drag/.test(combined)) return "Drag and Drop";
    if (/true|false/.test(combined)) return "True/False";
    return "MCQ";
  }

  if (/tab/.test(combined)) return "Tabbed Interaction";
  if (/timeline/.test(combined)) return "Timeline";
  if (/click/.test(combined) && /reveal/.test(combined)) return "Click to Reveal";
  if (/scenario/.test(combined)) return "Scenario";
  if (/accordion/.test(combined)) return "Accordion";
  if (/simulation/.test(combined)) return "Simulation";
  if (/slider/.test(combined)) return "Slider";
  if (/video/.test(combined)) return "Video";

  return undefined;
}

function defaultInteractionExpectation(expectedInteractionType?: string): string | undefined {
  if (!expectedInteractionType) return undefined;
  switch (expectedInteractionType) {
    case "Tabbed Interaction":
      return "Create at least three tabs with distinct labels, keyboard focus order, and summary feedback per tab.";
    case "Timeline":
      return "Provide 3-4 timeline points with years/dates, each revealing unique on-screen text and narration.";
    case "Click to Reveal":
      return "Design three reveal hotspots with labelled buttons, ensuring keyboard activation and descriptive feedback.";
    case "Scenario":
      return "Frame a scenario with characters, branching dialogue, and developer notes describing success and recovery paths.";
    case "Scenario MCQ":
      return "Deliver a scenario stem followed by 3-4 options, indicating the correct path and remediation guidance.";
    case "Multiple Response":
      return "Require learners to choose all correct statements, providing tailored feedback for partial selections.";
    case "Drag and Drop":
      return "Specify draggable items, drop targets, accessibility alternatives, and success criteria.";
    default:
      return undefined;
  }
}

function extractKeywords(...sources: (string | undefined)[]): string[] {
  const tokens: string[] = [];
  sources
    .filter(Boolean)
    .forEach((source) => {
      const words = String(source)
        .replace(/[^a-z0-9\s-]/gi, " ")
        .split(/\s+/)
        .map((word) => word.trim().toLowerCase())
        .filter((word) => word && word.length > 3 && !KEYWORD_STOP_WORDS.has(word));
      tokens.push(...words);
    });

  // Deduplicate while keeping order, cap to 18 terms for prompt readability
  return Array.from(new Set(tokens)).slice(0, 18);
}

function enrichInstructionalBlock(
  block: InstructionalBlock,
  overrides: Partial<InstructionalBlock> = {}
): InstructionalBlock {
  const merged: InstructionalBlock = {
    ...block,
    ...overrides,
  };

  const combinedText = `${merged.title} ${merged.type} ${merged.content}`.toLowerCase();
  const requiresKnowledgeCheck =
    overrides.requiresKnowledgeCheck ??
    merged.requiresKnowledgeCheck ??
    /knowledge check|assessment|quiz|mcq|mrq|question|drag|scenario/i.test(combinedText);

  const expectedInteractionType =
    overrides.expectedInteractionType ??
    merged.expectedInteractionType ??
    detectExpectedInteractionType(merged.type, merged.title, merged.content, requiresKnowledgeCheck);

  const expectedDurationSeconds =
    overrides.expectedDurationSeconds ??
    merged.expectedDurationSeconds ??
    deriveExpectedDuration(merged.type, merged.title, requiresKnowledgeCheck, expectedInteractionType);

  const keywords = overrides.keywords ??
    (merged.keywords && merged.keywords.length ? merged.keywords : extractKeywords(merged.title, merged.content, merged.type));

  const interactionExpectation =
    overrides.interactionExpectation ??
    merged.interactionExpectation ??
    defaultInteractionExpectation(expectedInteractionType);

  const accessibilityMustHaves = overrides.accessibilityMustHaves ??
    merged.accessibilityMustHaves ??
    (expectedInteractionType && expectedInteractionType !== "Informational"
      ? [
          "Describe keyboard navigation and focus order",
          "Provide alt text or transcript details for non-text elements",
        ]
      : undefined);

  return {
    ...merged,
    expectedDurationSeconds,
    requiresKnowledgeCheck,
    expectedInteractionType,
    interactionExpectation,
    accessibilityMustHaves,
    keywords,
  };
}

function parsePageIdentifiers(value: any, fallbackIndex: number): number[] {
  if (typeof value === "number" && Number.isFinite(value)) {
    const candidate = Math.round(value);
    return candidate > 0 ? [candidate] : [];
  }

  if (Array.isArray(value)) {
    return value
      .flatMap((item) => parsePageIdentifiers(item, fallbackIndex))
      .filter((num, idx, arr) => Number.isFinite(num) && arr.indexOf(num) === idx)
      .sort((a, b) => a - b);
  }

  if (typeof value === "string") {
    const normalised = value
      .replace(/\s+/g, "")
      .split(/[,&]/)
      .filter(Boolean);

    const pages: number[] = [];

    normalised.forEach((token) => {
      const cleaned = token.replace(/[^0-9\-]/g, "");
      if (!cleaned) return;

      if (cleaned.includes("-")) {
        const [startRaw, endRaw] = cleaned.split("-");
        const start = parseInt(startRaw, 10);
        const end = parseInt(endRaw, 10);
        if (Number.isFinite(start) && Number.isFinite(end)) {
          const step = start <= end ? 1 : -1;
          for (let n = start; step > 0 ? n <= end : n >= end; n += step) {
            if (!pages.includes(n)) {
              pages.push(n);
            }
          }
          return;
        }
      }

      const parsed = parseInt(cleaned, 10);
      if (Number.isFinite(parsed) && !pages.includes(parsed)) {
        pages.push(parsed);
      }
    });

    return pages;
  }

  return fallbackIndex >= 0 ? [fallbackIndex + 1] : [];
}

function truncateText(value: string | undefined, max = 200): string {
  if (!value) return "";
  return value.length <= max ? value : `${value.slice(0, max - 3)}...`;
}

function derivePageNumbers(slide: any, index: number): number[] {
  const raw = slide?.page_number_in_document || slide?.slide_number;
  const parsed = parsePageIdentifiers(raw, index);
  return parsed.length ? parsed : [index + 1];
}

function buildContentFromSlide(slide: any, index: number): string {
  const lines: string[] = [];

  if (slide?.page_number_in_document) {
    lines.push(`Source page(s): ${slide.page_number_in_document}.`);
  }

  if (slide?.type) {
    lines.push(`Slide type: ${slide.type}.`);
  }

  const events = Array.isArray(slide?.events) ? slide.events : [];
  if (events.length) {
    lines.push(`Events to cover: ${events.length}.`);

    events.forEach((event: any, eventIndex: number) => {
      const summaryParts: string[] = [];
      if (event?.audio_script) {
        summaryParts.push(`Narration: ${truncateText(event.audio_script)}`);
      }

      const ost = event?.on_screen_text;
      if (ost?.title) {
        summaryParts.push(`OST title: ${ost.title}`);
      }
      if (Array.isArray(ost?.bullet_points) && ost.bullet_points.length) {
        summaryParts.push(
          `Bullets: ${ost.bullet_points.join(" | ")}`
        );
      }
      if (Array.isArray(ost?.body_text) && ost.body_text.length) {
        summaryParts.push(
          `Body text: ${truncateText(ost.body_text.join(" "))}`
        );
      }

      const question = event?.question;
      if (question?.stem) {
        summaryParts.push(`Question stem: ${truncateText(question.stem)}`);
        if (Array.isArray(question?.options)) {
          const options = question.options
            .map((opt: any, idx: number) => {
              const label = String.fromCharCode(65 + idx);
              const flag = opt?.is_correct ? "✅" : "";
              return `${label}) ${truncateText(opt?.text)}${flag}`;
            })
            .join(" | ");
          summaryParts.push(`Options: ${options}`);
        }
        if (question?.feedback) {
          summaryParts.push(
            `Feedback cues: correct=${truncateText(
              question.feedback.correct
            )}, incorrect=${truncateText(question.feedback.incorrect)}`
          );
        }
      }

      const assets = Array.isArray(event?.assets) ? event.assets : [];
      if (assets.length) {
        const assetSummary = assets
          .map((asset: any) => asset?.description || asset?.source)
          .filter(Boolean)
          .join(", ");
        if (assetSummary) {
          summaryParts.push(`Assets referenced: ${assetSummary}`);
        }
      }

      if (event?.internal_development_notes) {
        summaryParts.push(
          `Dev notes: ${truncateText(event.internal_development_notes)}`
        );
      }
      if (event?.screen_media_treatment) {
        summaryParts.push(
          `Screen treatment: ${truncateText(event.screen_media_treatment)}`
        );
      }

      lines.push(
        `- Event ${event?.event_number ?? eventIndex + 1}: ${summaryParts.join(
          " "
        )}`
      );
    });
  }

  return [
    `Recreate slide "${slide?.slide_title || `Slide ${index + 1}`}" using the human-authored storyboard reference.`,
    ...lines,
    "Maintain fidelity to the human wording and interactions. Adapt tone and minor phrasing based on the module form data, but preserve intent, structure, and feedback.",
  ]
    .filter(Boolean)
    .join("\n");
}

type LoadedHumanBlueprint = {
  blocks: InstructionalBlock[];
  metadata: {
    documentTitle?: string;
    projectCode?: string;
    company?: string;
    createdBy?: string;
    revisionHistory?: any[];
    tableOfContents?: any[];
    globalNotes?: any;
  };
};

function loadHumanBlueprint(): LoadedHumanBlueprint | null {
  try {
    const raw = fs.readFileSync(HUMAN_BLUEPRINT_PATH, "utf8");
    const parsed = JSON.parse(raw);
    const slides = Array.isArray(parsed?.slides) ? parsed.slides : [];

    if (!slides.length) {
      return null;
    }

    const blocks: InstructionalBlock[] = [];

    if (parsed?.global_notes?.notes?.length) {
      blocks.push({
        pages: [1],
        title: "Global Notes",
        type: "Reference",
        content: parsed.global_notes.notes
          .map((note: string, idx: number) => `${idx + 1}. ${note}`)
          .join("\n"),
      });
    }

    slides.forEach((slide: any, index: number) => {
      blocks.push({
        pages: derivePageNumbers(slide, index),
        title: slide?.slide_title || `Slide ${index + 1}`,
        type: slide?.type || "Slide",
        content: buildContentFromSlide(slide, index),
      });
    });

    const enrichedBlocks = blocks.map((block) => enrichInstructionalBlock(block));

    return {
      blocks: enrichedBlocks,
      metadata: {
        documentTitle: parsed?.document_title,
        projectCode: parsed?.project_code,
        company: parsed?.company,
        createdBy: parsed?.created_by,
        revisionHistory: Array.isArray(parsed?.revision_history)
          ? parsed.revision_history
          : undefined,
        tableOfContents: Array.isArray(parsed?.table_of_contents)
          ? parsed.table_of_contents
          : undefined,
        globalNotes: parsed?.global_notes,
      },
    };
  } catch (error: any) {
    console.warn(
      `[Blueprint] Failed to load human storyboard from ${HUMAN_BLUEPRINT_PATH}:`,
      error?.message || error
    );
    return null;
  }
}

type LoadedBrandonHallBlueprint = {
  blocks: InstructionalBlock[];
};

function buildContentFromBrandonHallPage(
  page: any,
  absolutePageNumber: number,
  partIndex: number,
  partTotal: number,
  totalPages?: number
): string {
  const baseTitle = page?.title || `Page ${absolutePageNumber}`;
  const baseType = page?.type || "Slide";
  const instructions = typeof page?.instructions === "string" ? page.instructions.trim() : "";
  const levelInstructions = page?.contentInstructions;

  const lines: string[] = [];
  lines.push(
    `Blueprint page ${absolutePageNumber}${totalPages ? ` of ${totalPages}` : ""}: "${baseTitle}".`
  );
  lines.push(`Page type: ${baseType}.`);

  if (partTotal > 1) {
    lines.push(
      `This is part ${partIndex + 1} of ${partTotal} for "${baseTitle}". Maintain continuity across parts while ensuring narration, OST, and interactions are unique for each page.`
    );
  }

  if (instructions) {
    lines.push(instructions);
  }

  if (levelInstructions && typeof levelInstructions === "object") {
    const level3 = levelInstructions.level_3 || levelInstructions.level3;
    const level2 = levelInstructions.level_2 || levelInstructions.level2;
    if (level3) {
      lines.push(`Level 3 expectation: ${level3}`);
    }
    if (level2) {
      lines.push(`Level 2 baseline (for reference): ${level2}`);
    }
  }

  if (page?.notes) {
    lines.push(String(page.notes));
  }

  return lines.filter(Boolean).join("\n\n");
}

function loadBrandonHallBlueprint(): LoadedBrandonHallBlueprint | null {
  try {
    const raw = fs.readFileSync(BRANDON_HALL_BLUEPRINT_PATH, "utf8");
    const parsed = JSON.parse(raw);
    const pages = Array.isArray(parsed?.pages) ? parsed.pages : [];

    if (!pages.length) {
      return null;
    }

    const totalPages =
      typeof parsed?.config?.totalPageCount === "number"
        ? parsed.config.totalPageCount
        : undefined;

    const blocks: InstructionalBlock[] = [];

    pages.forEach((page: any, pageIndex: number) => {
      const pageNumbers = parsePageIdentifiers(page?.pageNumber, pageIndex);
      const uniqueNumbers = pageNumbers.length ? pageNumbers : [pageIndex + 1];

      uniqueNumbers.forEach((pageNumber, partIndex) => {
        const multiPart = uniqueNumbers.length > 1;
        const titleBase = page?.title || `Page ${pageNumber}`;
        const title = multiPart
          ? `${titleBase} (Part ${partIndex + 1} of ${uniqueNumbers.length})`
          : titleBase;

        const continuityGroupId = multiPart
          ? String(page?.pageNumber || page?.title || pageIndex)
          : undefined;

        const baseBlock: InstructionalBlock = {
          pages: [pageNumber],
          title,
          type: page?.type || "Slide",
          content: buildContentFromBrandonHallPage(
            page,
            pageNumber,
            partIndex,
            uniqueNumbers.length,
            totalPages
          ),
          continuityGroupId,
        };

        blocks.push(enrichInstructionalBlock(baseBlock));
      });
    });

    blocks.sort((a, b) => {
      const aPage = Array.isArray(a.pages) && a.pages.length ? a.pages[0] : 0;
      const bPage = Array.isArray(b.pages) && b.pages.length ? b.pages[0] : 0;
      return aPage - bPage;
    });

    return { blocks };
  } catch (error: any) {
    console.warn(
      `[Blueprint] Failed to load Brandon Hall blueprint from ${BRANDON_HALL_BLUEPRINT_PATH}:`,
      error?.message || error
    );
    return null;
  }
}

const fallbackMaster36PageBlueprintBase: InstructionalBlock[] = [
  {
    pages: [1],
    title: "Storyboard Revision History",
    type: "Table",
    content:
      "Table with columns: Date, Task, By, Version. Populate with 4 plausible entries showing the storyboard's development lifecycle. Use placeholder initials for 'By'.",
  },
  {
    pages: [2],
    title: "Pronunciation Guide",
    type: "Table",
    content:
      "Table with columns: Word or Phrase and Pronunciation. Identify 5–7 key acronyms or jargon and provide phonetic pronunciations. Add note to SME for validation.",
  },
  {
    pages: [3, 4],
    title: "Table of Contents",
    type: "Text + Table",
    content:
      "Detailed TOC with ~15–17 sections: Introduction, Core Content, Interactions, Assessments, Summary. Match p-numbers to structure.",
  },
  {
    pages: [5],
    title: "Introduction (Course Launch Page)",
    type: "Course Launch Page",
    content:
      "Course title, Get Started button, Internal Dev Note for high-quality background image.",
  },
  {
    pages: [6],
    title: "Overview",
    type: "Text + Image/Graphic",
    content:
      "3 events: (1) Course purpose, (2) Org commitment, (3) Target audience roles. Include image + icon notes.",
  },
  {
    pages: [7],
    title: "Learning Objectives",
    type: "Text + Image/Graphic",
    content:
      "Header: 'At the end of this module, you will be able to...'. List 3–4 action-based objectives. Add goal icon dev note.",
  },
  {
    pages: [8, 9],
    title: "Background/History",
    type: "Timeline Interactivity",
    content:
      "3-point clickable timeline with intro + popup events. Dev note for interactive popups.",
  },
  {
    pages: [10, 11],
    title: "Key Focus Areas",
    type: "Graphic Organiser",
    content:
      "List-based graphic with 6 items. Each item has icon and title. Add placeholder photo IDs.",
  },
  {
    pages: [12, 13, 14],
    title: "Core Principles/Concepts",
    type: "Interactive Graphic",
    content:
      "4–6 clickable principles with intro and detailed popups. Include icons and SME validation comment.",
  },
  {
    pages: [15, 16, 17, 18],
    title: "Key Processes and Procedures",
    type: "Tabbed Interactivity",
    content:
      "3-tab layout (e.g., Initial, Management, Review). Workflows with timeframes. SME comment required.",
  },
  {
    pages: [19, 20],
    title: "Applying a Key Process",
    type: "Text + Image/Graphic",
    content:
      "Recap one critical process. Include 'Best Practices' bullets with icons for visual separation.",
  },
  {
    pages: [21],
    title: "Knowledge Check 1",
    type: "MCQ",
    content:
      "1 correct + 2 distractors. Detailed feedback for correct/incorrect responses.",
  },
  {
    pages: [22],
    title: "Knowledge Check 2",
    type: "MRQ",
    content:
      "Choose 2–3 of 4–5 options. Feedback explains correct and incorrect answers.",
  },
  {
    pages: [23],
    title: "Choose Your Path",
    type: "Click-to-Reveal",
    content:
      "3 pathways based on role/situation. SME to provide scenario content.",
  },
  {
    pages: [24],
    title: "Scenario Pathways",
    type: "Scenario Placeholder",
    content:
      "Placeholder. SME Note: Provide scenario content. Audio/OST = TBD.",
  },
  {
    pages: [25],
    title: "Handling Special Cases",
    type: "Interactive Placeholder",
    content:
      "SME to supply specialist case topic. Placeholder content.",
  },
  {
    pages: [26, 27, 28],
    title: "Managing Non-Compliance",
    type: "Click-to-Reveal",
    content:
      "Tabs for Incident Tracking and Breaches. Escalation content. SME to provide handbook reference.",
  },
  {
    pages: [29],
    title: "Escalation Pathway",
    type: "Text + Image/Graphic",
    content:
      "Hierarchy from Staff → Manager → Risk → Committee → External. Narration walks steps.",
  },
  {
    pages: [30],
    title: "Knowledge Check 3",
    type: "Scenario MCQ",
    content:
      "Scenario-based MCQ. Correct answer must cite rule or concept.",
  },
  {
    pages: [31],
    title: "Knowledge Check 4",
    type: "Interactive Multi-select",
    content:
      "Accordion layout. 2 correct from 5. Detailed correct feedback. Generic incorrect feedback.",
  },
  {
    pages: [32],
    title: "Summary",
    type: "Text + Image/Graphic",
    content:
      "Header: 'Key Messages'. Audio + 3–4 OST bullets. Add scrollbar if overflow.",
  },
  {
    pages: [33],
    title: "Final Page",
    type: "End",
    content:
      "Header only (e.g., 'Life Insurance Code of Practice') + 'Page 36 of 36'.",
  },
];

const fallbackMaster36PageBlueprint: InstructionalBlock[] =
  fallbackMaster36PageBlueprintBase.map((block) => enrichInstructionalBlock(block));

const brandonHallBlueprint = loadBrandonHallBlueprint();
const humanBlueprint = loadHumanBlueprint();

export const master36PageBlueprint: InstructionalBlock[] =
  brandonHallBlueprint?.blocks && brandonHallBlueprint.blocks.length
    ? brandonHallBlueprint.blocks
    : humanBlueprint?.blocks && humanBlueprint.blocks.length
    ? humanBlueprint.blocks
    : fallbackMaster36PageBlueprint;

export const masterLevel2_3_20min = master36PageBlueprint;

export const humanBlueprintMetadata = humanBlueprint?.metadata || null;

export default master36PageBlueprint;
