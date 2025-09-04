// frontend/src/library/interactivityLibrary.ts
import type { StoryboardScene } from "@/types";

/**
 * Ensures a sane distribution of interactions across scenes.
 * - Tries to apply preferred types while respecting maxSameTypeInRow
 * - Keeps first 4 screens (Title/Pronunciation/ToC/Welcome) intact
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

  let currentInteractive = out.filter((s) => (s.interactionType || "None") !== "None").length;

  // Pass 1: ensure we have enough interactive scenes
  let i = keepStaticUntil;
  while (currentInteractive < targetInteractive && i < total) {
    if (out[i].interactionType === "None" || !out[i].interactionType) {
      const nextType = preferredTypes[(i + currentInteractive) % preferredTypes.length] || "MCQ";
      out[i].interactionType = nextType as any;
      out[i].interactionDescription = out[i].interactionDescription || describeInteraction(nextType, out[i].pageTitle);
      out[i].interactionDetails = out[i].interactionDetails || {
        interactionType: nextType,
        retryLogic: nextType === "MCQ" ? "Allow up to 2 retries; reveal on final incorrect." : "Allow retry.",
        completionRule: "User must interact at least once.",
        aiGenerationDirective:
          nextType === "MCQ"
            ? "[AI Generate: MCQ with option‑level feedback; randomise options.]"
            : undefined,
      };
      currentInteractive++;
    }
    i++;
  }

  // Pass 2: avoid long runs of the same type
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
        // swap to a different preferred type
        const alt = preferredTypes.find((x) => x !== t) || "MCQ";
        out[j].interactionType = alt as any;
        if (!out[j].interactionDescription) {
          out[j].interactionDescription = describeInteraction(alt, out[j].pageTitle);
        }
        out[j].interactionDetails = out[j].interactionDetails || { interactionType: alt };
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