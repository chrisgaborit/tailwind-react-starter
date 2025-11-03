"use strict";
/**
 * ==================================================================
 * MASTER TYPES - SINGLE SOURCE OF TRUTH
 * ==================================================================
 *
 * This file contains ALL type definitions used across the application.
 *
 * CONTRACT-FIRST DEVELOPMENT RULES:
 * 1. ALL schema changes must start here
 * 2. Mark new fields as optional (field?: string) until fully wired
 * 3. Once stable, make fields required
 * 4. All imports must come from this file
 * 5. Never redefine types locally
 *
 * ==================================================================
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MODULE_TYPES = exports.ModuleLevel = void 0;
exports.isScreenLayoutObject = isScreenLayoutObject;
exports.isTableOfContentsItemArray = isTableOfContentsItemArray;
exports.isValidStoryboardModule = isValidStoryboardModule;
/* =========================================================
 * Core Enums & Constants
 * =======================================================*/
var ModuleLevel;
(function (ModuleLevel) {
    ModuleLevel["Level1"] = "Level 1";
    ModuleLevel["Level2"] = "Level 2";
    ModuleLevel["Level3"] = "Level 3";
    ModuleLevel["Level4"] = "Level 4";
})(ModuleLevel || (exports.ModuleLevel = ModuleLevel = {}));
exports.MODULE_TYPES = [
    "Compliance & Ethics",
    "Leadership & Coaching",
    "Sales & Customer Service",
    "Technical & Systems",
    "Health & Safety",
    "Onboarding & Culture",
    "Product Knowledge",
    "Professional Skills",
];
/* =========================================================
 * Type Guards & Utilities
 * =======================================================*/
function isScreenLayoutObject(layout) {
    return !!layout && typeof layout === "object" && "description" in layout;
}
function isTableOfContentsItemArray(toc) {
    var _a;
    return Array.isArray(toc) && toc.length > 0 && typeof ((_a = toc[0]) === null || _a === void 0 ? void 0 : _a.pageNumber) === "number";
}
function isValidStoryboardModule(obj) {
    return (obj &&
        typeof obj === "object" &&
        typeof obj.moduleName === "string" &&
        Array.isArray(obj.scenes) &&
        obj.scenes.length > 0);
}
// All types are exported above as interfaces and types
//# sourceMappingURL=types.js.map