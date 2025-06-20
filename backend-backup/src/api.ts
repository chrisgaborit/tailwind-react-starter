
import express, { Express, Request, Response, NextFunction, RequestHandler } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { StoryboardFormData, ModuleLevel, ModuleType, Tone, StoryboardScene, SupportedLanguage } from './types';
// generateStoryboardFromData is not directly used by this endpoint if generation is client-side,
// but its import might be kept for type consistency or future use.
// import { generateStoryboardFromData } from './services/geminiService'; 
import { API_KEY_ERROR_MESSAGE, FORM_ERROR_MESSAGE, GENERIC_ERROR_MESSAGE } from './constants';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '5mb' }) as RequestHandler); // Use express.json from the default import

if (!process.env.API_KEY) {
  console.error('***************************************************************************');
  console.error('FATAL ERROR: API_KEY environment variable is not set.');
  console.error('Please create a .env file in the backend directory with your API_KEY.');
  console.error('Application will not function correctly if backend were making Gemini calls.');
  console.error('***************************************************************************');
}

app.post('/api/v1/generate-storyboard', async (req: Request, res: Response) => {
  // Simulate API key check as if backend were making the call
  if (!process.env.API_KEY) {
    return res.status(500).json({ error: API_KEY_ERROR_MESSAGE + " (Backend check)" });
  }

  const formData = req.body as StoryboardFormData;

  const requiredFields: (keyof StoryboardFormData)[] = [
    'moduleName',
    'moduleType',
    'audience',
    'tone',
    'learningOutcomes',
    'moduleLevel',
    'mainContent'
  ];
  const missingFields = requiredFields.filter(field => {
    const value = formData[field];
    return !value || (typeof value === 'string' && !value.trim());
  });

  if (missingFields.length > 0) {
    return res.status(400).json({
      error: FORM_ERROR_MESSAGE,
      details: `Missing required fields: ${missingFields.join(', ')}.`
    });
  }

  if (!Object.values(ModuleType).includes(formData.moduleType as ModuleType)) {
    return res.status(400).json({
     error: FORM_ERROR_MESSAGE,
     details: `Invalid moduleType. Must be one of: ${Object.values(ModuleType).join(', ')}.`
   });
  }

  if (!Object.values(Tone).includes(formData.tone as Tone)) {
    return res.status(400).json({
     error: FORM_ERROR_MESSAGE,
     details: `Invalid tone. Must be one of: ${Object.values(Tone).join(', ')}.`
   });
  }

  if (!Object.values(ModuleLevel).includes(formData.moduleLevel as ModuleLevel)) {
     return res.status(400).json({
      error: FORM_ERROR_MESSAGE,
      details: `Invalid moduleLevel. Must be one of: ${Object.values(ModuleLevel).join(', ')}.`
    });
  }

  if (formData.language && !Object.values(SupportedLanguage).includes(formData.language as SupportedLanguage)) {
    return res.status(400).json({
      error: FORM_ERROR_MESSAGE,
      details: `Invalid language. Must be one of: ${Object.values(SupportedLanguage).join(', ')}.`
    });
  }

  try {
    console.log(`[API] Received valid request for module: ${formData.moduleName}, type: ${formData.moduleType}, language: ${formData.language || 'Not specified (client-side default expected)'}`);
    
    res.status(200).json({ 
        message: "Request received by backend. Storyboard generation is handled client-side.",
        validatedData: formData 
    });

  } catch (error) {
    console.error('[API] Error processing storyboard request (simulated):', error);
    let errorMessage = GENERIC_ERROR_MESSAGE;
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    res.status(500).json({ error: errorMessage, details: error instanceof Error ? error.stack : undefined });
  }
});

app.get('/', (req: Request, res: Response) => {
  res.send('eLearning Storyboard Generator API is running.');
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[API] Unhandled error:', err.stack);
  res.status(500).json({ error: 'Something broke unexpectedly!' });
});

app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
  if (!process.env.API_KEY) {
    console.warn('[WARN] API_KEY is not set. If backend were making Gemini calls, it would fail.');
  }
});
