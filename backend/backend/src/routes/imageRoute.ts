// backend/src/routes/imageRoute.ts
import { Router } from "express";
import { generateImageFromPrompt } from "../services/imageService";
import { ENABLE_IMAGE_GENERATION } from "../config/featureFlags";

export const imageRoute = Router();

imageRoute.post("/generate", async (req, res) => {
  try {
    const { prompt, style, size } = req.body || {};
    if (!prompt) return res.status(400).json({ error: "Missing prompt" });

    if (!ENABLE_IMAGE_GENERATION) {
      return res.json({
        imageUrl: null,
        recipe: {
          provider: "disabled",
          reason: "Image generation disabled via ENABLE_IMAGE_GENERATION=false",
          originalPrompt: prompt,
        },
      });
    }

    const { imageUrl, recipe } = await generateImageFromPrompt(prompt, { style, size });
    res.json({ imageUrl, recipe });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Image generation failed" });
  }
});
