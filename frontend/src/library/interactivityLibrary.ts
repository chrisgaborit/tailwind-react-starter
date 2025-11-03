// frontend/src/library/interactivityLibrary.ts
import type { StoryboardScene } from "@/types";

/**
 * Enforces interaction density based on module level.
 * - Level 1: 1 per 5–6 screens
 * - Level 2: 1 per 3–4 screens
 * - Level 3: 1 per 2–3 screens
 * - Level 4: every screen
 *
 * Also ensures variation and purpose of each interaction.
 */
export function enforceInteractiveDensity(
  scenes: StoryboardScene[],
  levelKey: string,
  interactiveRatio: number,
  maxSameTypeInRow: number,
  preferredTypes: string[]
): StoryboardScene[] {
  if (!Array.isArray(scenes) || scenes.length === 0) return scenes;
  const out = scenes.map((s) => ({ ...s }));
  const keepStaticUntil = 4;
  const total = out.length;
  const targetInteractive = Math.max(0, Math.round(total * interactiveRatio));

  let currentInteractive = out.filter(
    (s) => (s.interactionType || "None") !== "None"
  ).length;

  // Pass 1: add interactions where missing
  let i = keepStaticUntil;
  while (currentInteractive < targetInteractive && i < total) {
    if (!out[i].interactionType || out[i].interactionType === "None") {
      const nextType = preferredTypes[(i + currentInteractive) % preferredTypes.length] || "MCQ";
      out[i].interactionType = nextType as any;
      out[i].interactionDescription = out[i].interactionDescription || describeInteraction(nextType, out[i].pageTitle);
      out[i].interactionDetails = out[i].interactionDetails || {
        interactionType: nextType,
        retryLogic: getRetryLogic(nextType),
        completionRule: "User must interact at least once.",
        aiGenerationDirective: getAIDirective(nextType),
      };
      currentInteractive++;
    }
    i++;
  }

  // Pass 2: prevent repetition of same type
  let runType = "";
  let runLen = 0;
  for (let j = keepStaticUntil; j < total; j++) {
    const t = String(out[j].interactionType || "None");
    if (t === "None") {
      runType = "";
      runLen = 0;
      continue;
    }
    if (t === runType) {
      runLen++;
      if (runLen >= maxSameTypeInRow) {
        const alt = preferredTypes.find((x) => x !== t) || "MCQ";
        out[j].interactionType = alt as any;
        if (!out[j].interactionDescription) {
          out[j].interactionDescription = describeInteraction(alt, out[j].pageTitle);
        }
        out[j].interactionDetails = out[j].interactionDetails || {
          interactionType: alt,
          retryLogic: getRetryLogic(alt),
          completionRule: "User must interact at least once.",
          aiGenerationDirective: getAIDirective(alt),
        };
        runType = alt;
        runLen = 1;
      }
    } else {
      runType = t;
      runLen = 1;
    }
  }

  return out;
}

function describeInteraction(t: string, topic: string) {
  switch (t) {
    case "MCQ":
      return `2–3 question knowledge check on: ${topic}. Immediate feedback per option.`;
    case "Scenario":
      return `Branching decision with 2–3 paths for: ${topic}. Show consequences and debrief.`;
    case "Clickable Hotspots":
      return `Reveal hotspots to explain key elements of: ${topic}.`;
    case "Drag & Drop":
      return `Sort/match items related to: ${topic}. Allow partial credit + retry.`;
    case "Reflection":
      return `Prompt the learner to write a brief reflection on: ${topic}.`;
    case "Interactive Video":
      return `Short video with embedded questions on: ${topic}. Captions ON.`;
    default:
      return `Interactive element aligned to: ${topic}.`;
  }
}

function getRetryLogic(type: string): string {
  switch (type) {
    case "MCQ":
      return "Allow up to 2 retries; reveal on final incorrect.";
    case "Drag & Drop":
    case "Clickable Hotspots":
      return "Allow retry.";
    case "Scenario":
      return "No retry; path locked after decision.";
    default:
      return "Allow retry.";
  }
}

function getAIDirective(type: string): string | undefined {
  switch (type) {
    case "MCQ":
      return "[AI Generate: MCQ with option‑level feedback; randomise options.]";
    case "Scenario":
      return "[AI Generate: branching choices with outcome debrief.]";
    case "Reflection":
      return "[AI Generate: open-ended reflection prompt.]";
    default:
      return undefined;
  }
}