import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const MODEL_NAME = "gemini-1.5-pro-latest";

export interface StoryboardScene {
  sceneNumber: number;
  sceneTitle: string;
  visualDescription: string;
  voiceOver: string;
  onScreenText: string;
  interaction: string | null;
  knowledgeCheck?: {
    question: string;
    options: string[];
    answer: string;
  } | null;
}

export interface StoryboardFormData {
  moduleName: string;
  organisationName: string;
  audience: string;
  moduleType: string;
  moduleLevel: string;
  tone: string;
  language: string;
  brandGuidelines: string;
  learningOutcomes: string;
  mainContent: string;
  durationMinutes: number;
}

export async function generateStoryboard(formData: StoryboardFormData): Promise<StoryboardScene[]> {
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
        role: "system",
        parts: [{ text: systemInstruction }],
      },
    ],
  });

  const userPrompt = "Generate the full storyboard based on the provided parameters.";
  const result = await chatSession.sendMessage(userPrompt);
  const response = result.response;
  const text = response.text();

  // Parsing with safety cleaner applied
  let jsonText = extractJSON(text);
  let parsed: StoryboardScene[] = [];

  try {
    parsed = JSON.parse(jsonText);
  } catch (e) {
    console.error("AI response could not be parsed as JSON:", e);
    console.error("AI raw output:", text);
    throw new Error("The AI response was not in the expected format.");
  }

  return parsed;
}

// This function safely extracts JSON even if Gemini returns extra text
function extractJSON(rawText: string): string {
  const start = rawText.indexOf('[');
  const end = rawText.lastIndexOf(']');
  if (start === -1 || end === -1) {
    throw new Error("Valid JSON array not found in AI output.");
  }
  return rawText.substring(start, end + 1);
}

function generateSystemInstruction(formData: StoryboardFormData): string {
  return `
You are Genesis AI, a professional instructional designer trained on 25 years of corporate eLearning design.

You are generating full scene-by-scene corporate eLearning storyboards based on the following parameters:

Module Parameters:
- Module Name: ${formData.moduleName}
- Organisation: ${formData.organisationName}
- Audience: ${formData.audience}
- Module Type: ${formData.moduleType}
- Interactivity Level: ${formData.moduleLevel}
- Duration: ${formData.durationMinutes} minutes
- Tone: ${formData.tone}
- Language: ${formData.language}
- Learning Outcomes: ${formData.learningOutcomes}
- Main Content: ${formData.mainContent}
- Brand Guidelines: ${formData.brandGuidelines}

Scene Count Rule:
- Generate approximately 1 scene per 60-75 seconds of total module duration.

Scene Structure Rules:
Each scene MUST include:
- sceneNumber (numeric)
- sceneTitle (short, precise)
- visualDescription (explain what is shown visually on screen)
- voiceOver (professional narration script using clear, simple corporate tone)
- onScreenText (max 15 words per screen for key bullet points)
- interaction (if applicable, otherwise null)
- knowledgeCheck (2–3 per module, optional, structured properly as question/options/answer)

Interaction Types Based On Level:
- Level 1: Passive only
- Level 2: Click-to-reveal, flip cards, timelines, simple quizzes, drag/drop matching
- Level 3: Branching scenarios, decision trees, roleplays, realistic application tasks
- Level 4: Full simulations, advanced gamified sequences, applied problem solving

Knowledge Check Examples:
- Multiple Choice
- Multiple Response
- Drag & Drop
- Sequencing
- True/False
- Short Scenarios

Formatting Rules:
- Output only valid JSON array (no markdown, no explanations, no intro text)
- Do not prefix with text like 'Here is your output...'
- Ensure JSON is directly parsable

Begin now.
`;
}
