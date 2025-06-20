import express, { Request, Response } from "express";
import { StoryboardFormData } from "../types/storyboardTypes";
import { generateStoryboard } from "../services/geminiService";

const router = express.Router();

router.post("/", async (req: Request, res: Response) => {
  const formData = req.body as StoryboardFormData;

  try {
    const storyboard = await generateStoryboard(formData);
    res.json(storyboard);
  } catch (err) {
    console.error("Error generating storyboard:", err);
    res.status(500).json({ error: "Failed to generate storyboard" });
  }
});

export default router;
