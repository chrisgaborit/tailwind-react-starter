"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const geminiService_1 = require("../services/geminiService");
const router = express_1.default.Router();
router.post('/generate', async (req, res) => {
    const formData = req.body;
    try {
        const storyboard = await attemptGenerateWithRetry(formData, 3);
        res.json(storyboard);
    }
    catch (err) {
        console.error("🚨 Failed after retries:", err.message);
        res.status(500).json({ message: 'Failed to generate storyboard. Please try again later.' });
    }
});
exports.default = router;
// Retry logic
async function attemptGenerateWithRetry(formData, retries) {
    let lastError;
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            console.log(`🔄 Attempt ${attempt}...`);
            return await (0, geminiService_1.generateStoryboard)(formData);
        }
        catch (err) {
            console.error(`⚠️ Attempt ${attempt} failed:`, err.message);
            lastError = err;
        }
    }
    throw lastError;
}
