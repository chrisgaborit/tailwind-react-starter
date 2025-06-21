import express from 'express';
import { generateStoryboard } from '../services/geminiService';
import { StoryboardFormData } from '../types/storyboardTypes';

const router = express.Router();

router.post('/generate', async (req, res) => {
  const formData = req.body as StoryboardFormData;

  try {
    const storyboard = await attemptGenerateWithRetry(formData, 3);
    res.json(storyboard);
  } catch (err: any) {
    console.error("🚨 Failed after retries:", err.message);
    res.status(500).json({ message: 'Failed to generate storyboard. Please try again later.' });
  }
});

export default router;

// Retry logic
async function attemptGenerateWithRetry(formData: StoryboardFormData, retries: number) {
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔄 Attempt ${attempt}...`);
      return await generateStoryboard(formData);
    } catch (err: any) {
      console.error(`⚠️ Attempt ${attempt} failed:`, err.message);
      lastError = err;
    }
  }

  throw lastError;
}
