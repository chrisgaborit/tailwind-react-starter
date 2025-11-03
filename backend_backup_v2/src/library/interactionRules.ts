// backend/src/library/interactionRules.ts

export function getInteractiveSettings(levelKey: string) {
  const levels = {
    "Level 1": {
      interactiveRatio: 1 / 6, // 🟡 1 per 5–6 screens
      maxSameTypeInRow: 2,
      preferredTypes: ["MCQ", "Reflection", "Clickable Hotspots"],
    },
    "Level 2": {
      interactiveRatio: 1 / 3, // 🟠 1 per 3–4 screens
      maxSameTypeInRow: 2,
      preferredTypes: ["MCQ", "Clickable Hotspots", "Drag & Drop", "Scenario"],
    },
    "Level 3": {
      interactiveRatio: 1 / 2, // 🔵 1 per 2–3 screens
      maxSameTypeInRow: 2,
      preferredTypes: [
        "Scenario",
        "Drag & Drop",
        "MCQ",
        "Interactive Video",
        "Clickable Hotspots",
      ],
    },
    "Level 4": {
      interactiveRatio: 1.0, // 🟣 Every screen
      maxSameTypeInRow: 1,
      preferredTypes: [
        "Simulation",
        "Game",
        "Scenario",
        "Interactive Video",
        "Drag & Drop",
        "AI-Simulated Chat",
      ],
    },
  };

  return levels[levelKey] || levels["Level 2"];
}