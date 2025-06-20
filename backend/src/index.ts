import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import generateRoute from './routes/generateRoute';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Routes
app.use('/api/v1/generate-storyboard', generateRoute);

// Health Check
app.get('/', (req: Request, res: Response) => {
  res.send('eLearning Storyboard Generator API is running.');
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[API] Unhandled error:', err.stack);
  res.status(500).json({ error: 'Something broke unexpectedly!' });
});

// Start server
app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
  if (!process.env.API_KEY) {
    console.warn('[WARN] API_KEY is not set. Backend Gemini calls will fail if used.');
  }
});
