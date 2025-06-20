import { GoogleGenerativeAI } from '@google/generative-ai';
import { StoryboardFormData, StoryboardScene } from '../types/storyboardTypes';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateStoryboard(formData: StoryboardFormData): Promise<StoryboardScene[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

  const { moduleName, moduleType, moduleLevel, tone, organisationName, audience, learningOutcomes, mainContent, durationMinutes, language, brandGuidelines } = formData;

  const prompt = `
You are a world-class instructional designer, voiceover director, and eLearning storyboard writer.
Generate a JSON storyboard of scenes for a Level ${moduleLevel.replace("Level ", "")}, ${moduleType} training module called "${moduleName}" for ${organisationName}.

Audience: ${audience}
Tone: ${tone}
Duration: approx ${durationMinutes} minutes
Language: ${language}

Learning Outcomes:
${learningOutcomes}

Content Summary:
${mainContent}

Apply global best practices for Level ${moduleLevel.replace("Level ", "")}:
- Use story-driven flow, scenario-based learning, adult learning theory
- Include frequent and varied interactivity (MCQs, click-reveal, branching if Level 3+)
- Multimedia suggestions: visuals, animations, voiceover tone
- Structured scenes with:
  {
    "sceneTitle": string,
    "visualDescription": string,
    "narrationScript": string,
    "onScreenText": string,
    "interaction"?: string,
    "knowledgeCheck"?: {
      "question": string,
      "options": string[],
      "correctAnswer": string
    }
  }

Include 6–10 scenes depending on pacing. Return only valid JSON. No Markdown or commentary.
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('[Gemini RAW TEXT START]');
    console.log(text);
    console.log('[Gemini RAW TEXT END]');

    try {
      const parsed = JSON.parse(text) as StoryboardScene[];
      return parsed;
    } catch (parseErr) {
      console.error('[Gemini PARSE ERROR]', parseErr);
      throw new Error('Gemini returned invalid JSON.');
    }
  } catch (err) {
    console.error('[Gemini ERROR]', err);
    return [
      {
        sceneTitle: 'Fallback Scene',
        visualDescription: 'A learner stares at a blank screen, unsure what’s happening.',
        narrationScript: 'When AI stumbles, resilience kicks in.',
        onScreenText: 'Oops — Gemini needs a moment...',
        interaction: 'Click to try again',
        knowledgeCheck: {
          question: 'What should you do when AI fails?',
          options: ['Panic', 'Refresh', 'Yell at the screen'],
          correctAnswer: 'Refresh'
        }
      }
    ];
  }
}
