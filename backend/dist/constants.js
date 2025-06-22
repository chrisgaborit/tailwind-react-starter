"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LEVEL_DESCRIPTIONS = exports.MODULE_TYPE_LOGIC_ERROR = exports.API_KEY_ERROR_MESSAGE = exports.DURATION_HINT = exports.FORM_ERROR_MESSAGE = exports.GENERIC_ERROR_MESSAGE = exports.GEMINI_MODEL_NAME = exports.APP_TITLE = void 0;
const storyboardTypes_1 = require("./types/storyboardTypes");
exports.APP_TITLE = "eLearning Storyboard Generator";
exports.GEMINI_MODEL_NAME = "gemini-2.5-flash-preview-04-17";
exports.GENERIC_ERROR_MESSAGE = "An unexpected error occurred. Please try again.";
exports.FORM_ERROR_MESSAGE = "Please fill in all required fields marked with * and provide the main content. Ensure module level, module type, audience and tone are selected.";
exports.DURATION_HINT = "e.g., \"10-15 minutes\" or \"approx 15 screens\"";
exports.API_KEY_ERROR_MESSAGE = "API_KEY environment variable not found. Please ensure it is configured for the execution environment.";
exports.MODULE_TYPE_LOGIC_ERROR = "Internal error: Could not find specific logic for the provided module type.";
exports.LEVEL_DESCRIPTIONS = {
    [storyboardTypes_1.ModuleLevel.Level1]: "Focus: Foundational knowledge. Style: Direct instruction, simple interactions (e.g., click next, simple MCQs).",
    [storyboardTypes_1.ModuleLevel.Level2]: "Focus: Application and understanding. Style: More interactivity, scenarios, case studies, guided exploration (e.g., tabs, drag & drop).",
    [storyboardTypes_1.ModuleLevel.Level3]: "Focus: Strategic thinking, complex problem-solving. Style: High interactivity, simulations, branching scenarios, deep reflection."[storyboardTypes_1.ModuleLevel.Level4], "Advanced scenario-based simulations or AI-powered branching training": ,
};
