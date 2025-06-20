"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const geminiService_1 = require("../services/geminiService");
const router = express_1.default.Router();
router.post("/", async (req, res) => {
    const formData = req.body;
    try {
        const storyboard = await (0, geminiService_1.generateStoryboard)(formData);
        res.json(storyboard);
    }
    catch (err) {
        console.error("Error generating storyboard:", err);
        res.status(500).json({ error: "Failed to generate storyboard" });
    }
});
exports.default = router;
