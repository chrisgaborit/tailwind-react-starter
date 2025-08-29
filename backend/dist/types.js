"use strict";
/**
 * ==================================================================
 * SHARED TYPES FOR STORYBOARD GENERATOR
 * (Upgraded with AI visual briefs, rich interactions, audio directives,
 *  and metadata — while remaining backward-compatible with existing code)
 * ==================================================================
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstructionalPurpose = exports.LearningMode = exports.MODULE_TYPES = exports.ModuleLevel = void 0;
/* ---------------------------------------
   Levels / Module kinds / Tone / Language
----------------------------------------*/
var ModuleLevel;
(function (ModuleLevel) {
    ModuleLevel["Level1"] = "Level 1";
    ModuleLevel["Level2"] = "Level 2";
    ModuleLevel["Level3"] = "Level 3";
    ModuleLevel["Level4"] = "Level 4";
})(ModuleLevel || (exports.ModuleLevel = ModuleLevel = {}));
exports.MODULE_TYPES = [
    "Compliance",
    "Onboarding & Induction",
    "Product Training",
    "Soft Skills & Leadership",
    "Systems & Process Training",
    "Customer Service",
    "Health, Safety & Wellbeing",
    "Sales & Marketing",
    "Technical or Systems Training",
    "Personal Development",
];
/* ---------------------------------------
   Auxiliary enums used by UI components
----------------------------------------*/
var LearningMode;
(function (LearningMode) {
    LearningMode["SelfPaced"] = "Self-paced";
    LearningMode["InstructorLed"] = "Instructor-led";
    LearningMode["VirtualClass"] = "Virtual classroom";
    LearningMode["Blended"] = "Blended";
})(LearningMode || (exports.LearningMode = LearningMode = {}));
var InstructionalPurpose;
(function (InstructionalPurpose) {
    InstructionalPurpose["Awareness"] = "Awareness";
    InstructionalPurpose["Knowledge"] = "Knowledge";
    InstructionalPurpose["Skill"] = "Skill / Practice";
    InstructionalPurpose["Behaviour"] = "Behaviour change";
    InstructionalPurpose["Assessment"] = "Assessment / Certification";
})(InstructionalPurpose || (exports.InstructionalPurpose = InstructionalPurpose = {}));
//# sourceMappingURL=types.js.map