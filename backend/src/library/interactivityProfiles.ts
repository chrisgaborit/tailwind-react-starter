// backend/src/library/interactivityProfiles.ts

export type InteractivityProfile = {
  level: "Level1" | "Level2" | "Level3" | "Level4";
  preferredInteractionTypes: string[];
  maxSameTypeInRow: number;
  branchingRequired: boolean;
  minKnowledgeChecks: number;
};

/**
 * Maps a requested level string (e.g., "Level 3", "level3", "3") into a
 * consistent interactivity profile with variety and Brandon Hall‑friendly defaults.
 */
export function pickProfile(levelLike?: string): InteractivityProfile {
  const norm = String(levelLike || "Level 3").toLowerCase().replace(/\s+/g, "");
  if (/(^|[^0-9])4($|[^0-9])|level4/.test(norm)) {
    return {
      level: "Level4",
      preferredInteractionTypes: [
        "Scenario",
        "Simulation",
        "Interactive Video",
        "Drag & Drop",
        "Clickable Hotspots",
        "MCQ",
        "Reflection",
      ],
      maxSameTypeInRow: 2,
      branchingRequired: true,
      minKnowledgeChecks: 8,
    };
  }
  if (/(^|[^0-9])3($|[^0-9])|level3/.test(norm)) {
    return {
      level: "Level3",
      preferredInteractionTypes: [
        "Scenario",
        "MCQ",
        "Clickable Hotspots",
        "Drag & Drop",
        "Reflection",
        "Interactive Video",
      ],
      maxSameTypeInRow: 2,
      branchingRequired: true,
      minKnowledgeChecks: 6,
    };
  }
  if (/(^|[^0-9])2($|[^0-9])|level2/.test(norm)) {
    return {
      level: "Level2",
      preferredInteractionTypes: ["MCQ", "Clickable Hotspots", "Drag & Drop", "Reflection"],
      maxSameTypeInRow: 2,
      branchingRequired: false,
      minKnowledgeChecks: 4,
    };
  }
  // Level 1 and unknowns
  return {
    level: "Level1",
    preferredInteractionTypes: ["MCQ", "Clickable Hotspots", "Reflection"],
    maxSameTypeInRow: 2,
    branchingRequired: false,
    minKnowledgeChecks: 3,
  };
}