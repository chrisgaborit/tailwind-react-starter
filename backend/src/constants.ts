import { ModuleLevel } from './types/storyboardTypes';

export const APP_TITLE = "eLearning Storyboard Generator";
export const GEMINI_MODEL_NAME = "gemini-2.5-flash-preview-04-17";

export const GENERIC_ERROR_MESSAGE = "An unexpected error occurred. Please try again.";
export const FORM_ERROR_MESSAGE = "Please fill in all required fields marked with * and provide the main content. Ensure module level, module type, audience and tone are selected.";
export const DURATION_HINT = "e.g., \"10-15 minutes\" or \"approx 15 screens\"";
export const API_KEY_ERROR_MESSAGE = "API_KEY environment variable not found. Please ensure it is configured for the execution environment.";
export const MODULE_TYPE_LOGIC_ERROR = "Internal error: Could not find specific logic for the provided module type.";

export const LEVEL_DESCRIPTIONS: { [key in ModuleLevel]: string } = {
  [ModuleLevel.Level1]: "Focus: Foundational knowledge. Style: Direct instruction, simple interactions (e.g., click next, simple MCQs).",
  [ModuleLevel.Level2]: "Focus: Application and understanding. Style: More interactivity, scenarios, case studies, guided exploration (e.g., tabs, drag & drop).",
  [ModuleLevel.Level3]: "Focus: Strategic thinking, complex problem-solving. Style: High interactivity, simulations, branching scenarios, deep reflection."
  [ModuleLevel.Level4]: "Advanced scenario-based simulations or AI-powered branching training",
};
