"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateStoryboard = generateStoryboard;
const generative_ai_1 = require("@google/generative-ai");
const promptEngineering_1 = require("../utils/promptEngineering");
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.API_KEY || "");
async function generateStoryboard(formData) {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const systemInstruction = (0, promptEngineering_1.generateSystemInstruction)(formData);
    const result = await model.generateContent(systemInstruction);
    const response = result.response;
    const text = response.text();
    try {
        const parsed = JSON.parse(text);
        return parsed.storyboard;
    }
    catch (err) {
        console.error("Failed to parse AI response as JSON:", err);
        throw new Error("AI response was not valid JSON");
    }
}
