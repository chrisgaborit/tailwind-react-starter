import express, { Request, Response } from 'express';
import { generateStoryboard } from '../services/geminiService';
import { StoryboardFormData } from '../types/storyboardTypes';

const router = express.Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const formData: StoryboardFormData = req.body;
    console.log('[DEBUG] Received formData:', formData);

    const storyboard = await generateStoryboard(formData);

    res.json({ storyboard });
  } catch (error) {
    console.error('[ERROR] Failed to generate storyboard:', error);
    res.status(500).json({ error: 'Failed to generate storyboard' });
  }
});

export default router;
