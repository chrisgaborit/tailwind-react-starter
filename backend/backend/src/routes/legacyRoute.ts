import { Router, Request, Response } from "express";
import { StoryboardFormData, ModuleLevel } from "../types/storyboardTypesArchive";
import { generateImageFromPrompt } from "../services/imageService";
import {
  MODULE_TYPES,
  TONE_TYPES,
  SUPPORTED_LANGUAGES,
  FORM_ERROR_MESSAGE,
  GENERIC_ERROR_MESSAGE,
} from "../constants";
import { ENABLE_IMAGE_GENERATION } from "../config/featureFlags";
import { DirectorAgent } from "../agents/director/DirectorAgent";
import { LearningRequest } from "../agents_v2/types";
import { summarizeContentIfNeeded } from "../utils/summarizer";
import OpenAI from "openai";

const legacyRoute = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

/**
 * ⚠️ DEPRECATED ENDPOINT
 * This endpoint is deprecated. Use /api/generate-storyboard instead.
 * This route now redirects to DirectorAgent orchestration for backward compatibility.
 */
legacyRoute.post("/generate-storyboard", async (req: Request, res: Response) => {
  console.warn("⚠️ DEPRECATED: /api/v1/generate-storyboard called. Redirecting to DirectorAgent orchestration.");
  console.warn("⚠️ Please update clients to use /api/generate-storyboard instead.");
  
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
    // Convert legacy format to LearningRequest for DirectorAgent
    const content = formData.content || "";
    const summarizedContent = await summarizeContentIfNeeded(content, openai);
    
    if (!summarizedContent.trim()) {
      return res.status(400).json({
        error: "Cannot generate storyboard with no content.",
        deprecationWarning: "This endpoint is deprecated. Use /api/generate-storyboard instead."
      });
    }
    
    const learningRequest: LearningRequest = {
      topic: formData.moduleName || "Learning Module",
      duration: typeof formData.duration === "number" ? formData.duration : 20,
      audience: formData.targetAudience || "Learners",
      sourceMaterial: summarizedContent,
      learningOutcomes: Array.isArray(formData.learningOutcomes) ? formData.learningOutcomes : [],
      brand: {
        colours: Array.isArray(formData.colours) ? formData.colours[0] : formData.colours || "#001E41",
        fonts: Array.isArray(formData.fonts) ? formData.fonts[0] : formData.fonts || "Outfit"
      },
      moduleType: formData.moduleType || "Soft Skills"
    };
    
    console.log(`[DEPRECATED API] Generating storyboard via DirectorAgent for: ${formData.moduleName}`);
    const director = new DirectorAgent();
    const storyboardModule = await director.orchestrateStoryboard(learningRequest);
    
    res.status(200).json({ 
      storyboardModule,
      deprecationWarning: "This endpoint is deprecated. Use /api/generate-storyboard instead.",
      generationMethod: "Agent Orchestration v2.0 (via deprecated endpoint)"
    });
  } catch (error) {
    console.error("[DEPRECATED API] Error generating storyboard:", error);
    const errorMessage = error instanceof Error ? error.message : GENERIC_ERROR_MESSAGE;
    res.status(500).json({
      error: errorMessage,
      details: error instanceof Error ? error.stack : undefined,
      deprecationWarning: "This endpoint is deprecated. Use /api/generate-storyboard instead."
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

