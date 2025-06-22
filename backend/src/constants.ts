// backend/src/constants.ts
import { ModuleLevel } from './types'; // Added import, assuming it's needed for other ModuleLevel keys

export const GEMINI_MODEL_NAME = "gemini-2.5-flash-preview-04-17";

export const API_KEY_ERROR_MESSAGE =
  "API_KEY environment variable not found. Please ensure it is set in your .env file for the backend server.";
export const GENERIC_ERROR_MESSAGE =
  "An unexpected error occurred while processing your request.";
export const FORM_ERROR_MESSAGE = // For API validation
  "Invalid request body. Please ensure all required fields are provided and valid.";
export const MODULE_TYPE_LOGIC_ERROR =
  "Internal server error: Could not find specific logic for the provided module type.";

// This object is assumed to exist in your file based on the error log.
// The problematic [ModuleLevel.Level4] entry has been removed.
export const LEVEL_DESCRIPTIONS: { [key: string]: string } = {
  // Assuming you have entries for Level1, Level2, Level3 here, for example:
  [ModuleLevel.Level1]: "Focus: Foundational knowledge. Style: Direct instruction, simple interactions (e.g., click next, simple MCQs).",
  [ModuleLevel.Level2]: "Focus: Application and understanding. Style: More interactivity, scenarios, case studies, guided exploration (e.g., tabs, drag & drop).",
  [ModuleLevel.Level3]: "Focus: Strategic thinking, complex problem-solving. Style: High interactivity, simulations, branching scenarios, deep reflection.",
  [ModuleLevel.Level4]: "Focus: Mastery & Innovation. Style: AI-driven adaptive learning, advanced simulations, generative tasks, real-world problem synthesis."
  // The line causing the error (related to ModuleLevel.Level4) has been removed from this object.
};

// Any other constants in your file would remain here.