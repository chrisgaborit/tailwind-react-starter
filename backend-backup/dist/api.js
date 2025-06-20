"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const types_1 = require("./types");
// generateStoryboardFromData is not directly used by this endpoint if generation is client-side,
// but its import might be kept for type consistency or future use.
// import { generateStoryboardFromData } from './services/geminiService'; 
const constants_1 = require("./constants");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '5mb' })); // Use express.json from the default import
if (!process.env.API_KEY) {
    console.error('***************************************************************************');
    console.error('FATAL ERROR: API_KEY environment variable is not set.');
    console.error('Please create a .env file in the backend directory with your API_KEY.');
    console.error('Application will not function correctly if backend were making Gemini calls.');
    console.error('***************************************************************************');
}
app.post('/api/v1/generate-storyboard', async (req, res) => {
    // Simulate API key check as if backend were making the call
    if (!process.env.API_KEY) {
        return res.status(500).json({ error: constants_1.API_KEY_ERROR_MESSAGE + " (Backend check)" });
    }
    const formData = req.body;
    const requiredFields = [
        'moduleName',
        'moduleType',
        'audience',
        'tone',
        'learningOutcomes',
        'moduleLevel',
        'mainContent'
    ];
    const missingFields = requiredFields.filter(field => {
        const value = formData[field];
        return !value || (typeof value === 'string' && !value.trim());
    });
    if (missingFields.length > 0) {
        return res.status(400).json({
            error: constants_1.FORM_ERROR_MESSAGE,
            details: `Missing required fields: ${missingFields.join(', ')}.`
        });
    }
    if (!Object.values(types_1.ModuleType).includes(formData.moduleType)) {
        return res.status(400).json({
            error: constants_1.FORM_ERROR_MESSAGE,
            details: `Invalid moduleType. Must be one of: ${Object.values(types_1.ModuleType).join(', ')}.`
        });
    }
    if (!Object.values(types_1.Tone).includes(formData.tone)) {
        return res.status(400).json({
            error: constants_1.FORM_ERROR_MESSAGE,
            details: `Invalid tone. Must be one of: ${Object.values(types_1.Tone).join(', ')}.`
        });
    }
    if (!Object.values(types_1.ModuleLevel).includes(formData.moduleLevel)) {
        return res.status(400).json({
            error: constants_1.FORM_ERROR_MESSAGE,
            details: `Invalid moduleLevel. Must be one of: ${Object.values(types_1.ModuleLevel).join(', ')}.`
        });
    }
    if (formData.language && !Object.values(types_1.SupportedLanguage).includes(formData.language)) {
        return res.status(400).json({
            error: constants_1.FORM_ERROR_MESSAGE,
            details: `Invalid language. Must be one of: ${Object.values(types_1.SupportedLanguage).join(', ')}.`
        });
    }
    try {
        console.log(`[API] Received valid request for module: ${formData.moduleName}, type: ${formData.moduleType}, language: ${formData.language || 'Not specified (client-side default expected)'}`);
        res.status(200).json({
            message: "Request received by backend. Storyboard generation is handled client-side.",
            validatedData: formData
        });
    }
    catch (error) {
        console.error('[API] Error processing storyboard request (simulated):', error);
        let errorMessage = constants_1.GENERIC_ERROR_MESSAGE;
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        res.status(500).json({ error: errorMessage, details: error instanceof Error ? error.stack : undefined });
    }
});
app.get('/', (req, res) => {
    res.send('eLearning Storyboard Generator API is running.');
});
app.use((err, req, res, next) => {
    console.error('[API] Unhandled error:', err.stack);
    res.status(500).json({ error: 'Something broke unexpectedly!' });
});
app.listen(port, () => {
    console.log(`Backend server is running on http://localhost:${port}`);
    if (!process.env.API_KEY) {
        console.warn('[WARN] API_KEY is not set. If backend were making Gemini calls, it would fail.');
    }
});
