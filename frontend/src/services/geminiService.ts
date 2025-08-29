// @ts-nocheck

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import type { StoryboardScene, RawSceneData, StoryboardFormData, KnowledgeCheck } from "../types";
import { GEMINI_MODEL_TEXT, DEFAULT_NUM_SCENES } from "../constants";

// Helper function to parse JSON, handling potential markdown fences
function parseJsonFromGeminiResponse(responseText: string): any {
  let jsonStr = responseText.trim();
  const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
  const match = jsonStr.match(fenceRegex);
  if (match && match[1]) {
    jsonStr = match[1].trim();
  }
  
  try {
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Failed to parse JSON string after attempting to strip fences:", jsonStr, error);
    // Try parsing as is, in case it was a plain JSON string without fences
    try {
        return JSON.parse(responseText.trim());
    } catch (innerError) {
        console.error("Failed to parse JSON string (original):", responseText, innerError);
        // It's crucial to throw the error that indicates parsing failed on the AI's actual output.
        throw new Error(`Invalid JSON response from AI. The AI did not return valid JSON content. Raw text: ${responseText.substring(0, 500)}...`);
    }
  }
}

export const generateDetailedStoryboard = async (formData: StoryboardFormData): Promise<StoryboardScene[]> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string;
  if (!apiKey) {
    console.error("VITE_GEMINI_API_KEY is not defined in environment variables.");
    throw new Error("API_KEY_MISSING");
  }

  let ai: GoogleGenAI;
  try {
    ai = new GoogleGenAI({ apiKey });
  } catch (error) {
    console.error("Failed to initialize GoogleGenAI:", error);
    throw new Error("API_KEY_INVALID");
  }
  
  // Use DEFAULT_NUM_SCENES from constants, can be made dynamic later if needed
  const numScenesToGenerate = DEFAULT_NUM_SCENES;

  const instruction = `
    You are an expert instructional designer and e-learning content developer tasked with creating a detailed storyboard.
    Based on the following module specifications, generate exactly ${numScenesToGenerate} distinct storyboard scenes.

    Module Specifications:
    - Module Name: "${formData.moduleName}"
    - Module Type: "${formData.moduleType}"
    - Target Audience: "${formData.audience}"
    - Desired Tone: "${formData.tone}"
    - Organisation/Client: "${formData.organisationName || 'N/A'}"
    - Branding Guidelines & Visual Style: "${formData.orgBranding || 'General professional style'}"
    - Target Module Duration: "${formData.moduleDuration || 'Not specified'}"
    - Key Learning Outcomes for the entire module: "${formData.learningOutcomes}"
    - Module Complexity Level: "${formData.moduleLevel}" (This should influence the complexity of interactions and content)
    - Language: "${formData.language}"
    - Main Content Outline/Key Topics to be covered across scenes:
      """
      ${formData.mainContent}
      """

    For each of the ${numScenesToGenerate} scenes, provide ALL the following details:
    1.  "sceneNumber": An integer representing the sequence of the scene (e.g., 1, 2, 3,...).
    2.  "title": A short, catchy, and descriptive title for the scene.
    3.  "learningObjectivesCovered": Specific learning objective(s) or sub-topics addressed IN THIS SCENE, derived from the overall module learning outcomes and main content. Be specific to this scene.
    4.  "visualDescription": A comprehensive paragraph describing all visual elements: on-screen graphics, characters (if any, their appearance and actions), setting, animations, use of color, and overall composition. Mention any specific assets or branding elements if relevant from the guidelines. This should be detailed enough for a visual designer.
    5.  "narrationScript": The complete narration script (voice-over) for this scene, reflecting the specified tone and language. If no narration, state "None".
    6.  "onScreenText": Key text elements that should appear on screen (e.g., titles, bullet points, labels, captions). Keep it concise and impactful. If none, state "None".
    7.  "userInstructions": Clear instructions for the learner if any action is required in this scene (e.g., "Click the 'Next' button to continue," "Drag the correct label to the image," "Watch the video then answer the question"). If passive, state "None".
    8.  "interactions": Describe the type and nature of any interactivity in this scene (e.g., "Clickable tabs for more info," "Multiple-choice question," "Scenario-based decision point," "Video player controls," "Drag and drop: Match terms to definitions"). If none, state "Passive content consumption." Align complexity with module level.
    9.  "accessibilityNotes": Important considerations for accessibility for THIS SCENE (e.g., "All images require detailed alt text," "Video must have synchronized captions and a transcript," "Ensure keyboard navigability for interactive elements"). Be specific.
    10. "knowledgeCheck": An optional knowledge check question or reflection prompt relevant to this scene's content.
        - If it's a multiple-choice question (MCQ), provide it as an object: {"question": "Your question?", "options": ["Option A", "Option B", "Option C"], "answer": ["Correct Option(s)"]}. Options and answer should be arrays of strings.
        - If it's a true/false, fill-in-the-blank, or open-ended question, provide it as an object: {"question": "Your question?", "answer": ["Expected answer/key points"] } (options can be omitted or empty).
        - If no knowledge check for this scene, state "None for this scene." as a string.
    11. "imagePrompt": A concise, descriptive prompt suitable for an AI image generation model (like DALL-E, Midjourney, or Imagen) to create the main visual for this scene, based on the visualDescription. Focus on key elements, style, and composition.

    Return the output ONLY as a valid JSON array of objects, where each object represents a scene and strictly follows the 11-point structure detailed above.
    The JSON array should start with '[' and end with ']'. Do not include any introductory text, concluding remarks, or markdown formatting like \`\`\`json around the JSON array itself.
    Ensure all string values within the JSON are properly escaped.

    Example of one scene object (ensure all 11 fields are present for each scene):
    {
      "sceneNumber": 1,
      "title": "Welcome to CyberSafe",
      "learningObjectivesCovered": "Understand the importance of cybersecurity in the workplace.",
      "visualDescription": "Modern office setting. Diverse group of professionals working on computers. Subtle digital threat icons (lock, shield with exclamation) appear and fade. A friendly AI assistant character (sleek, blue, and white avatar) animates on screen.",
      "narrationScript": "In today's interconnected world, cybersecurity is more critical than ever. This module will equip you with the knowledge to protect our valuable digital assets...",
      "onScreenText": "Cybersecurity Essentials: Protecting Our Digital World",
      "userInstructions": "Click the 'Start Module' button to begin.",
      "interactions": "Click 'Start Module' button.",
      "accessibilityNotes": "Ensure high contrast for on-screen text. AI assistant avatar animation should have a text alternative describing its appearance.",
      "knowledgeCheck": "None for this scene.",
      "imagePrompt": "Professional diverse team in modern office, working on laptops, subtle cybersecurity icons overlay, friendly AI assistant avatar, bright, clean, tech-forward style."
    }
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_TEXT,
      contents: instruction,
      config: {
        responseMimeType: "application/json",
        temperature: 0.7, // Balances creativity and adherence to prompt
      },
    });
    
    const rawJson = response.text;
    const parsedData = parseJsonFromGeminiResponse(rawJson);
    
    if (!Array.isArray(parsedData)) {
      console.error("Parsed data is not an array:", parsedData);
      throw new Error("AI response was not a valid array of scenes.");
    }

    const scenes: StoryboardScene[] = parsedData.map((item: any, index: number): StoryboardScene => {
      const rawScene = item as RawSceneData;

      // Validate essential fields
      if (
        typeof rawScene.sceneNumber !== 'number' ||
        typeof rawScene.title !== 'string' ||
        typeof rawScene.visualDescription !== 'string' || // This is a key field now
        typeof rawScene.imagePrompt !== 'string'
      ) {
        console.warn("Invalid or incomplete scene data received from AI for scene number (approx):", rawScene.sceneNumber || (index + 1), rawScene);
        throw new Error(`Scene data at index ${index} is malformed or missing critical fields like title or visualDescription.`);
      }

      let knowledgeCheckValue: KnowledgeCheck | string;
      if (typeof rawScene.knowledgeCheck === 'object' && rawScene.knowledgeCheck !== null && 'question' in rawScene.knowledgeCheck) {
        knowledgeCheckValue = {
          question: rawScene.knowledgeCheck.question || "N/A",
          options: Array.isArray(rawScene.knowledgeCheck.options) ? rawScene.knowledgeCheck.options : [],
          answer: Array.isArray(rawScene.knowledgeCheck.answer) ? rawScene.knowledgeCheck.answer : (typeof rawScene.knowledgeCheck.answer === 'string' ? [rawScene.knowledgeCheck.answer] : [])
        };
      } else if (typeof rawScene.knowledgeCheck === 'string') {
        knowledgeCheckValue = rawScene.knowledgeCheck;
      } else {
        knowledgeCheckValue = "None."; // Default if malformed or missing
      }
      
      return {
        id: crypto.randomUUID(),
        sceneNumber: rawScene.sceneNumber,
        title: rawScene.title,
        learningObjectivesCovered: rawScene.learningObjectivesCovered || "N/A",
        visualDescription: rawScene.visualDescription,
        narrationScript: rawScene.narrationScript || "None.",
        onScreenText: rawScene.onScreenText || "None.",
        userInstructions: rawScene.userInstructions || "None.",
        interactions: rawScene.interactions || "Passive content consumption.",
        accessibilityNotes: rawScene.accessibilityNotes || "General accessibility best practices should be followed.",
        knowledgeCheck: knowledgeCheckValue,
        imagePrompt: rawScene.imagePrompt,
      };
    });
    
    if (scenes.length === 0 && parsedData.length > 0) {
        console.warn("All scenes were filtered out or failed validation despite AI returning data.");
        throw new Error("AI returned data, but it could not be processed into the expected storyboard format for any scene.");
    }
    if (scenes.length !== numScenesToGenerate && parsedData.length > 0) {
        console.warn(`AI returned ${scenes.length} scenes, but ${numScenesToGenerate} were requested. Prompt adherence issue?`);
        // We can still return what we got, or throw an error based on strictness
    }


    return scenes;

  } catch (error) {
    console.error("Error calling Gemini API or processing response:", error);
    if (error instanceof Error) {
        if (error.message.includes("API_KEY_MISSING") || error.message.includes("API_KEY_INVALID")) {
            throw error;
        }
        if (error.message.toLowerCase().includes("api key not valid")) {
           throw new Error("API_KEY_INVALID");
        }
         // Re-throw specific parsing error to give user better feedback
        if (error.message.startsWith("Invalid JSON response from AI")) {
            throw error;
        }
    }
    // For other errors, provide a general message
    throw new Error(`Failed to generate storyboard scenes from AI. ${error instanceof Error ? error.message : 'An unknown error occurred.'}`);
  }
};