// backend/src/routes/storyboardGenRoute.ts
import { Router } from 'express';
import { generateStoryboardFromBrief } from '../services/storyboardGenerator';

export const storyboardGenRoute = Router();

storyboardGenRoute.post('/generate-storyboard-from-brief', async (req, res) => {
  try {
    const { projectBrief, formData, brand, interactivityHints } = req.body;
    const result = await generateStoryboardFromBrief({ projectBrief, formData, brand, interactivityHints });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Generation failed', detail: err?.message });
  }
});
