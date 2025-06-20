"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateStoryboard = generateStoryboard;
const generative_ai_1 = require("@google/generative-ai");
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const MODEL_NAME = 'gemini-1.5-pro-latest';
async function generateStoryboard(formData) {
    const systemInstruction = generateSystemInstruction(formData);
    const generationConfig = {
        temperature: 0.5,
        topK: 1,
        topP: 1,
        maxOutputTokens: 16000,
    };
    const chatSession = await genAI.getGenerativeModel({ model: MODEL_NAME }).startChat({
        generationConfig,
        history: [
            {
                role: 'system',
                parts: [{ text: systemInstruction }],
            },
        ],
    });
    const userPrompt = 'Generate the full storyboard based on the provided parameters.';
    const result = await chatSession.sendMessage(userPrompt);
    const response = result.response;
    const text = response.text();
    let cleaned = extractJSON(text);
    let parsed = [];
    try {
        parsed = JSON.parse(cleaned);
    }
    catch (err) {
        console.error('❌ Gemini returned invalid JSON:');
        console.error(text);
        throw new Error('AI response was not valid JSON.');
    }
    return parsed;
}
// Safely extract JSON array even if Gemini gives extra text
function extractJSON(rawText) {
    const start = rawText.indexOf('[');
    const end = rawText.lastIndexOf(']');
    if (start === -1 || end === -1) {
        throw new Error('Could not locate JSON array in AI output.');
    }
    return rawText.substring(start, end + 1);
}
function generateSystemInstruction(formData) {
    return `
You are Genesis AI, an expert corporate eLearning instructional designer trained on 25 years of best-practice eLearning.

MODULE PARAMETERS:
- Module Name: ${formData.moduleName}
- Organisation: ${formData.organisationName}
- Audience: ${formData.audience}
- Module Type: ${formData.moduleType}
- Interactivity Level: ${formData.moduleLevel}
- Tone: ${formData.tone}
- Language: ${formData.language}
- Learning Outcomes: ${formData.learningOutcomes}
- Main Content: ${formData.mainContent}
- Brand Guidelines: ${formData.brandGuidelines}
- Duration: ${formData.durationMinutes} minutes

OUTPUT INSTRUCTIONS:
- Generate approx 1 scene per 60–75 seconds.
- For each scene return:
  {
    sceneNumber: number,
    sceneTitle: string,
    visualDescription: string,
    voiceOver: string,
    onScreenText: string,
    interaction: string | null,
    knowledgeCheck: {
      question: string,
      options: string[],
      answer: string
    } | null
  }
- Interactions depend on Interactivity Level:
  - Level 1: Passive
  - Level 2: Click-to-reveal, flip cards, simple quizzes
  - Level 3: Branching, decision trees, roleplays
  - Level 4: Full simulations

STRICT FORMATTING RULES:
- Return only valid raw JSON array.
- No commentary, no markdown, no intro text.
- Output must be directly parsable.

Begin now.
  `;
}
