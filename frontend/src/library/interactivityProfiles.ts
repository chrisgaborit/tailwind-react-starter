// frontend/src/library/interactivityProfiles.ts
export type InteractivityProfile = {
  level: "Level1" | "Level2" | "Level3" | "Level4";
  minKnowledgeChecks: number;
  preferredInteractionTypes: string[];
  maxSameTypeInRow: number;
  branchingRequired: boolean;
};

export function pickProfile(levelRaw: string | undefined): InteractivityProfile {
  const key = String(levelRaw || "Level 3").toLowerCase();
  if (key.includes("4"))
    return {
      level: "Level4",
      minKnowledgeChecks: 8,
      preferredInteractionTypes: ["Scenario", "Simulation", "Interactive Video", "MCQ", "Clickable Hotspots", "Drag & Drop", "Reflection"],
      maxSameTypeInRow: 2,
      branchingRequired: true,
    };
  if (key.includes("3"))
    return {
      level: "Level3",
      minKnowledgeChecks: 6,
      preferredInteractionTypes: ["Scenario", "MCQ", "Clickable Hotspots", "Drag & Drop", "Reflection"],
      maxSameTypeInRow: 2,
      branchingRequired: true,
    };
  if (key.includes("2"))
    return {
      level: "Level2",
      minKnowledgeChecks: 4,
      preferredInteractionTypes: ["MCQ", "Clickable Hotspots", "Drag & Drop", "Reflection"],
      maxSameTypeInRow: 3,
      branchingRequired: false,
    };
  return {
    level: "Level1",
    minKnowledgeChecks: 3,
    preferredInteractionTypes: ["MCQ", "Reflection"],
    maxSameTypeInRow: 3,
    branchingRequired: false,
  };
}