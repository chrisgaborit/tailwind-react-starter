// backend/src/services/storyboardGenerator.ts
const OpenAI = require('openai');
const { storyboardSystem, storyboardUser } = require('../prompts/storyboardPrompt');
const { StoryboardModule } = require('../types/storyboardTypes');
const { parseDurationMins } = require('../utils/parseDuration');
const { injectBlueprint } = require('../library/injectBlueprint');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const MODEL = process.env.OPENAI_GEN_MODEL || 'gpt-4o-mini';

export async function generateStoryboardFromBrief(params: {
  projectBrief: string;
  formData: {
    moduleName: string; moduleType: string; targetAudience: string;
    learningOutcomes: string[]; level?: string;
    tone: string; language: string;
    durationMins?: number | string;
  };
  brand: { name: string; colours: string[]; fonts: string[]; logoUrl?: string; voiceoverAccent?: string; tone?: string; };
  interactivityHints?: string;
}): Promise<StoryboardModule> {
  const normalisedLevel = normaliseLevel(params.formData.level);
  const durationMins = clampDuration(params.formData.durationMins);

  const shouldApplyBrandonHall =
    durationMins >= 20 && durationMins <= 25 &&
    (normalisedLevel === 'Level2' || normalisedLevel === 'Level3');

  const blueprintInstructions = shouldApplyBrandonHall
    ? injectBlueprint(
        params.formData.moduleName,
        params.formData.targetAudience,
        durationMins,
        140
      )
    : undefined;

  if (shouldApplyBrandonHall) {
    console.log('🧩 Applying Brandon Hall 36-page blueprint to storyboard generation.');
  } else {
    console.log(
      'ℹ️ Brandon Hall blueprint skipped — level/duration outside target band:',
      { level: normalisedLevel, durationMins }
    );
  }

  const formDataForPrompt: any = {
    ...params.formData,
    level: normalisedLevel,
    durationMins,
  };

  if (!formDataForPrompt.level) {
    formDataForPrompt.level = 'Level2';
  }

  if (!Array.isArray(formDataForPrompt.learningOutcomes)) {
    formDataForPrompt.learningOutcomes = coerceList(formDataForPrompt.learningOutcomes);
  }

  const user = storyboardUser({
    projectBrief: params.projectBrief,
    formData: formDataForPrompt,
    brand: params.brand,
    interactivityHints: params.interactivityHints,
    blueprintInstructions,
  });

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

function normaliseLevel(level?: string): 'Level1' | 'Level2' | 'Level3' | 'Level4' | undefined {
  if (!level) return undefined;
  const token = level.toString().toLowerCase().replace(/[^a-z0-9]/g, '');

  if (token.includes('4')) return 'Level4';
  if (token.includes('3')) return 'Level3';
  if (token.includes('2')) return 'Level2';
  if (token.includes('1')) return 'Level1';

  // Match textual variants like "advanced" → Level3, "basic" → Level1
  if (token.includes('advanced') || token.includes('complex')) return 'Level3';
  if (token.includes('intermediate')) return 'Level2';
  if (token.includes('basic') || token.includes('foundational')) return 'Level1';

  return undefined;
}

function clampDuration(raw?: number | string): number {
  const parsed = parseDurationMins(raw);
  const MIN = 1;
  const MAX = 120;
  if (!parsed || Number.isNaN(parsed)) return 20;
  return Math.min(MAX, Math.max(MIN, parsed));
}

function coerceList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/\r?\n|;|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}
