import { Router, Request, Response } from "express";
import { StoryboardFormData, ModuleLevel } from "../types/storyboardTypesArchive";
import { generateStoryboardFromGemini } from "../services/geminiService";
import { generateImageFromPrompt } from "../services/imageService";
import {
  MODULE_TYPES,
  TONE_TYPES,
  SUPPORTED_LANGUAGES,
  FORM_ERROR_MESSAGE,
  GENERIC_ERROR_MESSAGE,
} from "../constants";
import { ENABLE_IMAGE_GENERATION } from "../config/featureFlags";

const legacyRoute = Router();

legacyRoute.post("/generate-storyboard", async (req: Request, res: Response) => {
  const formData = req.body as StoryboardFormData;

  const requiredFields: (keyof StoryboardFormData)[] = [
    "moduleName",
    "moduleType",
    "complexityLevel",
    "tone",
    "outputLanguage",
    "organisationName",
    "targetAudience",
    "duration",
    "brandGuidelines",
    "fonts",
    "colours",
    "logoUrl",
    "learningOutcomes",
    "content",
  ];

  const missingFields = requiredFields.filter((field) => {
    const value = formData[field];
    return !value || (typeof value === "string" && !value.trim());
  });

  if (missingFields.length > 0) {
    return res.status(400).json({
      error: FORM_ERROR_MESSAGE,
      details: `Missing or invalid required fields: ${missingFields.join(", ")}.`,
    });
  }

  if (!MODULE_TYPES.includes(formData.moduleType as (typeof MODULE_TYPES)[number])) {
    return res.status(400).json({ error: FORM_ERROR_MESSAGE, details: `Invalid moduleType.` });
  }

  if (!TONE_TYPES.includes(formData.tone as (typeof TONE_TYPES)[number])) {
    return res.status(400).json({ error: FORM_ERROR_MESSAGE, details: `Invalid tone.` });
  }

  if (!Object.values(ModuleLevel).includes(formData.complexityLevel as ModuleLevel)) {
    return res.status(400).json({ error: FORM_ERROR_MESSAGE, details: `Invalid complexityLevel.` });
  }

  if (!SUPPORTED_LANGUAGES.includes(formData.outputLanguage as (typeof SUPPORTED_LANGUAGES)[number])) {
    return res.status(400).json({ error: FORM_ERROR_MESSAGE, details: `Invalid outputLanguage.` });
  }

  try {
    console.log(`[API] Generating storyboard for: ${formData.moduleName}`);
    const storyboardModule = await generateStoryboardFromGemini(formData);
    res.status(200).json({ storyboardModule });
  } catch (error) {
    console.error("[API] Error generating storyboard:", error);
    const errorMessage = error instanceof Error ? error.message : GENERIC_ERROR_MESSAGE;
    res.status(500).json({
      error: errorMessage,
      details: error instanceof Error ? error.stack : undefined,
    });
  }
});

legacyRoute.post("/generate-image", async (req: Request, res: Response) => {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return res.status(400).json({
      error: 'A valid "prompt" string is required in the request body.',
    });
  }

  try {
    console.log(`[API] Received request to generate image.`);
    if (!ENABLE_IMAGE_GENERATION) {
      return res.status(200).json({
        imageUrl: null,
        recipe: {
          provider: "disabled",
          reason: "Image generation disabled via ENABLE_IMAGE_GENERATION=false",
          originalPrompt: prompt,
        },
      });
    }
    const { imageUrl, recipe } = await generateImageFromPrompt(prompt);
    res.status(200).json({ imageUrl, recipe });
  } catch (error) {
    console.error("[API] Error generating image:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred during image generation.";
    res.status(500).json({
      error: errorMessage,
      details: error instanceof Error ? error.stack : undefined,
    });
  }
});

export default legacyRoute;

