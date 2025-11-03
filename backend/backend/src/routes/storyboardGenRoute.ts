// backend/src/routes/storyboardGenRoute.ts
import { Router, Request, Response } from "express";
import { generateStoryboardFromBrief } from "../services/storyboardGenerator";
import { generateImageFromPrompt } from "../services/imageService";
import { ENABLE_IMAGE_GENERATION } from "../config/featureFlags";

export const storyboardGenRoute = Router();

/**
 * TEMP switch:
 * Force images ON while wiring the front end.
 * Later: set via env or remove to respect formData.generateImages.
 */
const FORCE_GENERATE_IMAGES =
  ENABLE_IMAGE_GENERATION &&
  (process.env.FORCE_GENERATE_IMAGES === "false" ? false : true);

/**
 * POST /generate-storyboard-from-brief
 * Generates a storyboard and (optionally) scene-level images using Imagen 3/Gemini.
 */
storyboardGenRoute.post(
  "/generate-storyboard-from-brief",
  async (req: Request, res: Response) => {
    try {
      const { projectBrief, formData: rawFormData, brand, interactivityHints } =
        req.body ?? {};

      // Normalise formData and TEMP force generateImages ON for testing
      const formData: any = {
        ...(rawFormData || {}),
        generateImages: ENABLE_IMAGE_GENERATION
          ? FORCE_GENERATE_IMAGES
            ? true
            : Boolean(rawFormData?.generateImages)
          : false,
      };

      console.log("📝 /generate-storyboard-from-brief called");
      console.log("   ▶︎ moduleName:", formData?.moduleName);
      console.log("   ▶︎ requested generateImages:", rawFormData?.generateImages);
      console.log("   ▶︎ effective generateImages:", formData?.generateImages);

      // 1) Generate the base storyboard
      const result = await generateStoryboardFromBrief({
        projectBrief,
        formData,
        brand,
        interactivityHints,
      });

      if (!result || !Array.isArray(result?.scenes)) {
        console.warn("⚠️ Storyboard generator returned no scenes.");
        return res.json(result || { scenes: [] });
      }

      // 2) Optionally add images if requested/effective
      if (!ENABLE_IMAGE_GENERATION) {
        console.log("🎨 Image generation globally disabled (ENABLE_IMAGE_GENERATION=false).");
      } else if (formData.generateImages && result.scenes.length) {
        console.log(
          `🎨 Generating images for ${result.scenes.length} scene(s)…`
        );

        for (const scene of result.scenes) {
          try {
            // Ensure nested object exists
            scene.visual = scene.visual || {};

            // Build a robust prompt, preferring your structured brief
            const visualBrief = scene.visual?.visualGenerationBrief || {};
            const prompt =
              visualBrief.sceneDescription ||
              scene.visual?.aiPrompt ||
              scene.onScreenText ||
              scene.narrationScript ||
              scene.pageTitle ||
              "Training visual, photorealistic, professional, high-quality";

            // Select style/size with safe defaults
            const style = visualBrief.style || "photorealistic";
            // Good default for landscape slides; adjust if you prefer square or portrait
            const size = visualBrief.size || "1280x720";
            const aspectRatio = visualBrief.aspectRatio || "16:9";

            console.log(
              `   • Scene ${scene.sceneNumber ?? "?"}: generating image → style=${style}, size=${size}, AR=${aspectRatio}`
            );

            // Call your image service (assumed to handle Supabase upload, returns public URL + recipe)
            const { imageUrl, recipe } = await generateImageFromPrompt(prompt, {
              style,
              size,
              aspectRatio,
              // You can pass through brand colours or other hints if your service supports it:
              // brandPalette: brand?.palette,
              // safety: "standard",
            });

            if (imageUrl) {
              // Attach to visual object
              scene.visual.generatedImageUrl = imageUrl;
              scene.visual.imageParams = recipe;

              // Mirror at top-level for easier frontend use
              (scene as any).imageUrl = imageUrl;
              (scene as any).imageParams = recipe;

              console.log("     ✅ Uploaded image URL:", imageUrl);
            } else {
              console.warn(
                `     ⚠️ No imageUrl returned for scene ${scene.sceneNumber ?? "?"}`
              );
            }
          } catch (imgErr: any) {
            console.error(
              `     ❌ Failed to generate image for scene ${scene.sceneNumber ?? "?"}:`,
              imgErr?.message || imgErr
            );
            // Still return storyboard without blocking the rest
          }
        }
      } else {
        console.log("🎨 Skipping image generation for this request.");
      }

      return res.json(result);
    } catch (err: any) {
      console.error("❌ Storyboard generation error:", err);
      return res
        .status(500)
        .json({ error: "Generation failed", detail: err?.message });
    }
  }
);
