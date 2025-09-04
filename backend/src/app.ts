import express, { Express, NextFunction, Request, Response } from 'express';
import dotenv from 'dotenv';
import { StoryboardFormData, ModuleLevel } from './types/storyboardTypesArchive';
import { generateStoryboardFromGemini } from './services/geminiService';
import { generateImageFromPrompt } from './services/imageService';
import storyboardRoute from './routes/storyboardRoute'; 

import {
  MODULE_TYPES,
  TONE_TYPES,
  SUPPORTED_LANGUAGES,
  FORM_ERROR_MESSAGE,
  GENERIC_ERROR_MESSAGE,
} from './constants';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3001;

// ❌ Removed: app.use(cors());
// ✅ CORS is configured centrally in index.ts
app.use(express.json({ limit: '5mb' }));

// ✅ Register memory system routes
app.use('/api', storyboardRoute);

// ✅ API Key startup check
if (!process.env.GEMINI_API_KEY || !process.env.OPENAI_API_KEY) {
  console.error('***************************************************************************');
  console.error('FATAL ERROR: One or more API keys are missing in your .env file.');
  console.error('Please ensure your .env file includes both:');
  console.error('GEMINI_API_KEY=YOUR_GEMINI_KEY_HERE');
  console.error('OPENAI_API_KEY=YOUR_OPENAI_KEY_HERE');
  console.error('***************************************************************************');
}

// ✅ Storyboard Generation Endpoint
app.post('/api/v1/generate-storyboard', async (req: Request, res: Response) => {
  const formData = req.body as StoryboardFormData;

  const requiredFields: (keyof StoryboardFormData)[] = [
    'moduleName',
    'moduleType',
    'complexityLevel',
    'tone',
    'outputLanguage',
    'organisationName',
    'targetAudience',
    'duration',
    'brandGuidelines',
    'fonts',
    'colours',
    'logoUrl',
    'learningOutcomes',
    'content',
  ];

  const missingFields = requiredFields.filter((field) => {
    const value = formData[field];
    return !value || (typeof value === 'string' && !value.trim());
  });

  if (missingFields.length > 0) {
    return res.status(400).json({
      error: FORM_ERROR_MESSAGE,
      details: `Missing or invalid required fields: ${missingFields.join(', ')}.`,
    });
  }

  if (!MODULE_TYPES.includes(formData.moduleType as typeof MODULE_TYPES[number])) {
    return res.status(400).json({ error: FORM_ERROR_MESSAGE, details: `Invalid moduleType.` });
  }

  if (!TONE_TYPES.includes(formData.tone as typeof TONE_TYPES[number])) {
    return res.status(400).json({ error: FORM_ERROR_MESSAGE, details: `Invalid tone.` });
  }

  if (!Object.values(ModuleLevel).includes(formData.complexityLevel as ModuleLevel)) {
    return res.status(400).json({ error: FORM_ERROR_MESSAGE, details: `Invalid complexityLevel.` });
  }

  if (!SUPPORTED_LANGUAGES.includes(formData.outputLanguage as typeof SUPPORTED_LANGUAGES[number])) {
    return res.status(400).json({ error: FORM_ERROR_MESSAGE, details: `Invalid outputLanguage.` });
  }

  try {
    console.log(`[API] Generating storyboard for: ${formData.moduleName}`);
    const storyboardModule = await generateStoryboardFromGemini(formData);
    res.status(200).json({ storyboardModule });
  } catch (error) {
    console.error('[API] Error generating storyboard:', error);
    const errorMessage = error instanceof Error ? error.message : GENERIC_ERROR_MESSAGE;
    res.status(500).json({
      error: errorMessage,
      details: error instanceof Error ? error.stack : undefined,
    });
  }
});

// ✅ Image Generation Endpoint
app.post('/api/v1/generate-image', async (req: Request, res: Response) => {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({
      error: 'A valid "prompt" string is required in the request body.',
    });
  }

  try {
    console.log(`[API] Received request to generate image.`);
    const imageUrl = await generateImageFromPrompt(prompt);
    res.status(200).json({ imageUrl });
  } catch (error) {
    console.error('[API] Error generating image:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred during image generation.';
    res.status(500).json({
      error: errorMessage,
      details: error instanceof Error ? error.stack : undefined,
    });
  }
});

// ✅ Health check route
app.get('/', (_req: Request, res: Response) => {
  res.send('eLearning Storyboard Generator API is running.');
});

// ✅ Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[API] Unhandled application error:', err.stack);
  res.status(500).json({ error: 'An unexpected server error occurred.' });
});

// ✅ Start server
app.listen(port, () => {
  console.log(`✅ Backend server is running on http://localhost:${port}`);
  if (!process.env.GEMINI_API_KEY) {
    console.warn('[WARN] GEMINI_API_KEY is not set. Storyboard generation will fail.');
  }
  if (!process.env.OPENAI_API_KEY) {
    console.warn('[WARN] OPENAI_API_KEY is not set. Image generation will fail.');
  }
});