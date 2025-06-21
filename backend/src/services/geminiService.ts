import { GoogleGenerativeAI } from "@google/generative-ai";
import { StoryboardFormData, StoryboardScene } from "../types/storyboardTypes";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function generateStoryboard(
  formData: StoryboardFormData
): Promise<StoryboardScene[]> {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

  const prompt = buildPrompt(formData);

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  console.log("[DEBUG] Raw Gemini response:", text);

  try {
    const cleaned = text
      .replace(/^```json/, "")
      .replace(/^```/, "")
      .replace(/```$/, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) {
      throw new Error("Parsed response is not an array of scenes.");
    }

    return parsed;
  } catch (err) {
    console.error("❌ Failed to parse Gemini response as storyboard JSON:", err);
    throw new Error(
      "The AI response was not in the expected storyboard format (array of scenes)."
    );
  }
}

function buildPrompt(formData: StoryboardFormData): string {
  return `
You are a senior instructional designer and expert in digital learning.

Your task is to generate a **rich, interactive storyboard** for an eLearning module with the following specifications.

Each scene must follow this structure and all fields must be fully completed — **no empty values**:
{
  "sceneNumber": 1,
  "title": "Scene title here",
  "objectivesCovered": "Which objectives this scene supports",
  "visual": "Describe visual elements clearly (e.g., animations, characters, infographics, background imagery)",
  "narration": "Exact voiceover script",
  "onScreenText": "Concise and visible text that appears onscreen (not narration)",
  "userInstructions": "What the learner should do (e.g., Click the button to continue, Drag the items, Select the correct answer)",
  "interactions": "Type of interaction in this scene (e.g., multiple-choice, drag-and-drop, branching, video play, reflection journal)",
  "accessibilityNotes": "Alt text, closed captions, keyboard support, or screen reader labels"
}

⚠️ Do not leave any fields empty. Even simple scenes should contain meaningful content in each field.

Include:
- 8 to 16 scenes total
- Variation across scenes in interactivity and format
- Use the tone and branding described below
- Write in ${formData.outputLanguage}
- Output ONLY a valid JSON array — no markdown, no commentary

Project Inputs:
- Module Name: ${formData.moduleName}
- Target Audience: ${formData.targetAudience}
- Module Type: ${formData.moduleType}
- Organisation: ${formData.organisationName}
- Brand Guidelines: ${formData.brandGuidelines}
- Fonts: ${formData.fonts}
- Colours: ${formData.colours}
- Logo URL: ${formData.logoUrl}
- Tone: ${formData.tone}
- Complexity Level: ${formData.complexityLevel}
- Duration: ${formData.duration}

Learning Outcomes:
${formData.learningOutcomes}

Content:
${formData.content}
`.trim();
}
