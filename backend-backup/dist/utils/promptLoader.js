"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSystemPrompt = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const SUBFOLDER_MAP = {
    module: 'modules',
    level: 'levels',
    tone: 'tones',
    language: 'languages',
    branding: 'branding',
};
const buildSystemPrompt = (formData) => {
    const components = {
        module: formData.moduleType,
        level: formData.moduleLevel,
        tone: formData.tone,
        language: formData.language,
        branding: formData.branding,
    };
    const promptDir = path_1.default.join(__dirname, '../prompts');
    let fullPrompt = '';
    Object.keys(components).forEach((type) => {
        const filename = components[type];
        if (!filename)
            return;
        const subfolder = SUBFOLDER_MAP[type];
        const filePath = path_1.default.join(promptDir, subfolder, `${filename}.json`);
        try {
            const fileContent = fs_1.default.readFileSync(filePath, 'utf-8');
            const parsed = JSON.parse(fileContent);
            if (typeof parsed.prompt === 'string') {
                fullPrompt += `\n\n${parsed.prompt}`;
            }
            else {
                console.warn(`⚠️ Missing or invalid 'prompt' in ${filePath}`);
            }
        }
        catch (err) {
            console.warn(`⚠️ Could not load prompt from ${filePath}`, err);
        }
    });
    return fullPrompt.trim();
};
exports.buildSystemPrompt = buildSystemPrompt;
