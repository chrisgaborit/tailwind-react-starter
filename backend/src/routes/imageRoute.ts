// backend/src/routes/imageRoute.ts
const express = require("express");
const { generateImageFromPrompt } = require("../services/imageService");

const imageRoute = express.Router();

imageRoute.post("/generate", async (req, res) => {
  try {
    const { prompt, style, size } = req.body || {};
    if (!prompt) return res.status(400).json({ error: "Missing prompt" });

    const { imageUrl, recipe } = await generateImageFromPrompt(prompt, { style, size });
    res.json({ imageUrl, recipe });
  } catch (e) {
    res.status(500).json({ error: e?.message || "Image generation failed" });
  }
});

module.exports = imageRoute;