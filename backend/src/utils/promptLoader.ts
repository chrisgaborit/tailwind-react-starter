import fs from 'fs';
import path from 'path';
import { StoryboardFormData } from '../types/storyboardTypesArchive';

type PromptComponents = {
  module?: string;
  level?: string;
  tone?: string;
  language?: string;
  branding?: string;
};

const SUBFOLDER_MAP: Record<keyof PromptComponents, string> = {
  module: 'modules',
  level: 'levels',
  tone: 'tones',
  language: 'languages',
  branding: 'branding',
};

export const buildSystemPrompt = (formData: StoryboardFormData): string => {
  const components: PromptComponents = {
    module: formData.moduleType,
    level: formData.complexityLevel, // ✅ Fixed
    tone: formData.tone,
    language: formData.outputLanguage, // ✅ Fixed
    branding: formData.brandGuidelines,
  };

  const promptDir = path.join(__dirname, '../prompts');
  let fullPrompt = '';

  (Object.keys(components) as (keyof PromptComponents)[]).forEach((type) => {
    const filename = components[type];
    if (!filename) return;

    const subfolder = SUBFOLDER_MAP[type];
    const filePath = path.join(promptDir, subfolder, `${filename}.json`);

    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(fileContent);

      if (typeof parsed.prompt === 'string') {
        fullPrompt += `\n\n${parsed.prompt}`;
      } else {
        console.warn(`⚠️ Missing or invalid 'prompt' in ${filePath}`);
      }
    } catch (err) {
      console.warn(`⚠️ Could not load prompt from ${filePath}`, err);
    }
  });

  return fullPrompt.trim();
};
