"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateStoryboard = generateStoryboard;
const generative_ai_1 = require("@google/generative-ai");
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
async function generateStoryboard(formData) {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const prompt = buildPrompt(formData);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    try {
        const scenes = JSON.parse(text);
        return scenes;
    }
    catch (err) {
        console.error("❌ Failed to parse Gemini response as JSON:", err);
        throw new Error("AI response could not be parsed as valid storyboard JSON.");
    }
}
function buildPrompt(formData) {
    return `
You are an expert eLearning designer. Based on the information below, generate a detailed storyboard with 8–16 scenes.

Each scene should follow this structure:
{
  "sceneNumber": 1,
  "objectivesCovered": "",
  "visual": "",
  "narration": "",
  "onScreenText": "",
  "userInstructions": "",
  "interactions": "",
  "accessibilityNotes": ""
}

Details:
- Module Name: ${formData.moduleName}
- Output Language: ${formData.outputLanguage}
- Module Type: ${formData.moduleType}
- Complexity Level: ${formData.complexityLevel}
- Target Audience: ${formData.targetAudience}
- Tone: ${formData.tone}
- Organisation: ${formData.organisation}
- Duration: ${formData.duration}
- Brand Guidelines: ${formData.brandGuidelines}
- Learning Outcomes: ${formData.learningOutcomes}

Content:
${formData.content}

Return ONLY a valid JSON array of scenes, no intro or outro.
  `.trim();
}
