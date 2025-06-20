"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const geminiService_1 = require("../services/geminiService");
const router = express_1.default.Router();
router.post('/', async (req, res) => {
    try {
        const formData = req.body;
        // Very simple input validation
        if (!formData.moduleName || !formData.mainContent) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const storyboard = await (0, geminiService_1.generateStoryboard)(formData);
        res.json(storyboard);
    }
    catch (error) {
        console.error('Error generating storyboard:', error);
        res.status(500).json({ error: 'Failed to generate storyboard' });
    }
});
exports.default = router;
