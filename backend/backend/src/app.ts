import express, { Express, NextFunction, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import apiRouter from './routes/apiRouter';
import v2Routes from './index.v2.routes';
import { ENABLE_IMAGE_GENERATION } from './config/featureFlags';

dotenv.config();

const app: Express = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

app.use('/api', apiRouter);
app.use(v2Routes);

console.log('📋 Registered routes:');
if (app._router && Array.isArray(app._router.stack)) {
  app._router.stack.forEach((r: any) => {
    if (r.route && r.route.path) {
      const methods = Object.keys(r.route.methods || {}).map((m) => m.toUpperCase()).join(',');
      console.log(`   ${methods || 'GET'} ${r.route.path}`);
    } else if (r.name === 'router') {
      console.log(`   Router mounted at: ${r.regexp}`);
    }
  });
}

if (!process.env.GEMINI_API_KEY || (ENABLE_IMAGE_GENERATION && !process.env.OPENAI_API_KEY)) {
  console.error('***************************************************************************');
  console.error('FATAL ERROR: One or more API keys are missing in your .env file.');
  console.error('Please ensure your .env file includes both:');
  console.error('GEMINI_API_KEY=YOUR_GEMINI_KEY_HERE');
  if (ENABLE_IMAGE_GENERATION) {
    console.error('OPENAI_API_KEY=YOUR_OPENAI_KEY_HERE');
  }
  console.error('***************************************************************************');
}

app.get('/', (_req: Request, res: Response) => {
  res.send('eLearning Storyboard Generator API is running.');
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', mode: 'agents-v2' });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[API] Unhandled application error:', err.stack);
  res.status(500).json({ error: 'An unexpected server error occurred.' });
});

export default app;
