// backend/src/services/storyboardGenerator.ts
const OpenAI = require('openai');
const { storyboardSystem, storyboardUser } = require('../prompts/storyboardPrompt');
const { StoryboardModule } = require('../types/storyboardTypes');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const MODEL = process.env.OPENAI_GEN_MODEL || 'gpt-4o-mini';

export async function generateStoryboardFromBrief(params: {
  projectBrief: string;
  formData: {
    moduleName: string; moduleType: string; targetAudience: string;
    learningOutcomes: string[]; level: 'Level1'|'Level2'|'Level3'|'Level4';
    tone: string; language: string;
  };
  brand: { name: string; colours: string[]; fonts: string[]; logoUrl?: string; voiceoverAccent?: string; tone?: string; };
  interactivityHints?: string;
}): Promise<StoryboardModule> {
  const user = storyboardUser(params);

  const resp = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0.2,
    messages: [
      { role: 'system', content: storyboardSystem },
      { role: 'user', content: user }
    ],
    response_format: { type: 'json_object' } as any
  });

  const text = resp.choices[0]?.message?.content || '{}';

  try {
    const parsed = JSON.parse(text) as StoryboardModule;
    if (!parsed?.meta || !Array.isArray(parsed?.scenes)) {
      throw new Error('Invalid structure');
    }
    return parsed;
  } catch (e) {
    // Log raw for debugging
    console.error('❌ JSON parse failed. Raw:', text.slice(0, 1200));
    throw e;
  }
}
