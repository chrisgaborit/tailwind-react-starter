"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Language = exports.Tone = exports.ModuleLevel = exports.ModuleType = void 0;
var ModuleType;
(function (ModuleType) {
    ModuleType["Compliance"] = "Compliance";
    ModuleType["Onboarding"] = "Onboarding";
    ModuleType["ProductTraining"] = "Product Training";
    ModuleType["SalesTraining"] = "Sales Training";
    ModuleType["SoftSkills"] = "Soft Skills";
    ModuleType["Leadership"] = "Leadership";
    ModuleType["Safety"] = "Safety";
    ModuleType["Risk"] = "Risk";
    ModuleType["Ethics"] = "Ethics";
    ModuleType["ITProcess"] = "IT Process";
    ModuleType["Services"] = "Services";
    ModuleType["Induction"] = "Induction";
})(ModuleType || (exports.ModuleType = ModuleType = {}));
var ModuleLevel;
(function (ModuleLevel) {
    ModuleLevel["Level1"] = "Level 1 - Focus: Foundational knowledge. Style: Direct instruction, simple interactions (e.g., click next, simple MCQs).";
    ModuleLevel["Level2"] = "Level 2 - Focus: Application and understanding. Style: More interactivity, scenarios, case studies, guided exploration (e.g., tabs, drag & drop).";
    ModuleLevel["Level3"] = "Level 3 - Focus: Strategic thinking, complex problem-solving. Style: High interactivity, simulations, branching scenarios, deep reflection.";
    ModuleLevel["Level4"] = "Level 4 - Focus: Immersive and adaptive learning. Style: Gamification, AI-driven personalisation, virtual/augmented reality, advanced simulations.";
})(ModuleLevel || (exports.ModuleLevel = ModuleLevel = {}));
var Tone;
(function (Tone) {
    Tone["Professional"] = "Professional";
    Tone["Conversational"] = "Conversational";
    Tone["Inspirational"] = "Inspirational";
    Tone["Authoritative"] = "Authoritative";
})(Tone || (exports.Tone = Tone = {}));
var Language;
(function (Language) {
    Language["English"] = "English";
    Language["Spanish"] = "Spanish";
    Language["French"] = "French";
    Language["ChineseSimplified"] = "Chinese (Simplified)";
    Language["Hindi"] = "Hindi";
    Language["Arabic"] = "Arabic";
    Language["German"] = "German";
    Language["Japanese"] = "Japanese";
    Language["Indonesian"] = "Indonesian";
    Language["Devanagari"] = "Devanagari (Script for Hindi, Marathi, etc.)";
})(Language || (exports.Language = Language = {}));
