// backend/src/agents_v2/interactivityTemplates.ts

/**
 * Structured templates for different interaction types
 * These replace the markdown string approach with proper JSON structures
 */

export interface ClickToRevealPanel {
  label: string;
  text: string;
  voiceOver?: string;
  animation?: string;
}

export interface ClickToRevealInteraction {
  type: "Click-to-Reveal";
  tone: "Professional" | "Conversational" | "Scenario-based" | "Instructive";
  instruction: string;
  contextVisuals: string;
  reveals: ClickToRevealPanel[];
  developerNotes: string;
}

export interface DragAndDropItem {
  id: string;
  label: string;
  correctTarget: string;
}

export interface DragAndDropTarget {
  id: string;
  label: string;
}

export interface DragAndDropMatching {
  type: "DragAndDrop-Matching";
  tone: "Professional" | "Conversational" | "Encouraging";
  instruction: string;
  items: DragAndDropItem[];
  targets: DragAndDropTarget[];
  feedback: {
    correct: string;
    incorrect: string;
  };
  developerNotes: string;
}

export interface DragAndDropSequencingItem {
  id: string;
  label: string;
  correctOrder: number;
}

export interface DragAndDropSequencing {
  type: "DragAndDrop-Sequencing";
  tone: "Professional" | "Instructional" | "Guiding";
  instruction: string;
  items: DragAndDropSequencingItem[];
  feedback: {
    correct: string;
    incorrect: string;
  };
  developerNotes: string;
}

export const clickToRevealTemplate: ClickToRevealInteraction = {
  type: "Click-to-Reveal",
  tone: "Professional",
  instruction: "Click each element to explore the key concepts.",
  contextVisuals: "Visual description of the screen layout and initial state.",
  reveals: [
    { 
      label: "Concept 1", 
      text: "",
      voiceOver: "",
      animation: ""
    },
    { 
      label: "Concept 2", 
      text: "",
      voiceOver: "",
      animation: ""
    },
    { 
      label: "Concept 3", 
      text: "",
      voiceOver: "",
      animation: ""
    }
  ],
  developerNotes: "Animations ≤ 5s; one VO per reveal; ensure keyboard accessibility."
};

export const dragAndDropMatchingTemplate: DragAndDropMatching = {
  type: "DragAndDrop-Matching",
  tone: "Professional",
  instruction: "Drag each item to its correct category.",
  items: [
    { id: "item1", label: "Item 1", correctTarget: "target1" },
    { id: "item2", label: "Item 2", correctTarget: "target2" },
    { id: "item3", label: "Item 3", correctTarget: "target1" }
  ],
  targets: [
    { id: "target1", label: "Category A" },
    { id: "target2", label: "Category B" }
  ],
  feedback: {
    correct: "Excellent! All items are correctly matched.",
    incorrect: "Not quite right. Try rearranging the items."
  },
  developerNotes: "Implement drag-and-drop with visual feedback. Green highlight for correct matches, red for incorrect. Include keyboard navigation for accessibility. Screen reader support required."
};

export const dragAndDropSequencingTemplate: DragAndDropSequencing = {
  type: "DragAndDrop-Sequencing",
  tone: "Professional",
  instruction: "Arrange the steps in the correct order.",
  items: [
    { id: "step1", label: "Step 1", correctOrder: 1 },
    { id: "step2", label: "Step 2", correctOrder: 2 },
    { id: "step3", label: "Step 3", correctOrder: 3 },
    { id: "step4", label: "Step 4", correctOrder: 4 }
  ],
  feedback: {
    correct: "Perfect! You've arranged the steps in the correct order.",
    incorrect: "The sequence isn't quite right. Try reordering the steps."
  },
  developerNotes: "Show numbered placeholders (1-4). Allow drag-and-drop reordering. Submit button to check correctness. Visual feedback with green/red highlighting. Keyboard reorder support required."
};

/**
 * Get the appropriate template for an interaction type
 */
export function getInteractionTemplate(type: string): any {
  switch (type) {
    case "Click-to-Reveal":
    case "ClickToReveal":
      return clickToRevealTemplate;
    case "DragAndDrop-Matching":
    case "DragAndDropMatching":
      return dragAndDropMatchingTemplate;
    case "DragAndDrop-Sequencing":
    case "DragAndDropSequencing":
      return dragAndDropSequencingTemplate;
    default:
      return null;
  }
}

