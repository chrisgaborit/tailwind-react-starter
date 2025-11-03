// backend/src/library/interactivityScene.ts

interface InteractivitySceneOptions {
  title?: string;
  narration?: string;
  interactivity?: {
    type: string;
    question: string;
    options: string[];
    correctAnswer: string;
  };
  [key: string]: any;
}

/**
 * Build a default interactivity scene with override options.
 * Use this when AI fails to insert a rich interactive scene,
 * or as a fallback to maintain instructional density.
 */
export function buildInteractivityScene(options: InteractivitySceneOptions = {}) {
  return {
    title: "Knowledge Check",
    narration: "Let's see what you've learned so far.",
    interactivity: {
      type: "multiple-choice",
      question: "Which of the following is correct?",
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: "Option A",
    },
    ...options, // Overrides any defaults
  };
}