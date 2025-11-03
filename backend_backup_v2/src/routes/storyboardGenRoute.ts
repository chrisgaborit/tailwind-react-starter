// backend/src/routes/storyboardGenRoute.ts
const { Router, Request, Response } = require('express');
const { generateStoryboardFromBrief } = require('../services/storyboardGenerator');
const { generateImageFromPrompt } = require('../services/imageService');

exports.storyboardGenRoute = Router();

/**
 * Image generation switch:
 * - If FORCE_GENERATE_IMAGES === "true", always generate images.
 * - If "false" (default), respect formData.generateImages from the request.
 */
const FORCE_GENERATE_IMAGES =
  String(process.env.FORCE_GENERATE_IMAGES || "false").trim().toLowerCase() === "true";

/** Simple sleep helper (used between batches) */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Tiny concurrency pool to avoid hammering the image model/CDN */
async function runWithConcurrency<T>(
  tasks: Array<() => Promise<T>>,
  limit = 3,
  pauseBetweenBatchesMs = 200
): Promise<T[]> {
  const results: T[] = [];
  let idx = 0;

  while (idx < tasks.length) {
    const batch = tasks.slice(idx, idx + limit);
    // Run this batch in parallel
    const chunkResults = await Promise.all(
      batch.map(async (fn) => {
        try {
          return await fn();
        } catch (err) {
          // Surface error to logs but keep the pipeline alive
          console.error("⚠️ Image task failed:", (err as any)?.message || err);
          return undefined as unknown as T;
        }
      })
    );
    results.push(...chunkResults);
    idx += limit;

    // Gentle pause between batches to be nice to upstreams
    if (idx < tasks.length && pauseBetweenBatchesMs > 0) {
      await sleep(pauseBetweenBatchesMs);
    }
  }
  return results;
}

/** Build a robust, photorealistic prompt from a scene */
function buildScenePrompt(scene: any, brand?: any): string {
  const visualBrief = scene?.visual?.visualGenerationBrief || {};
  const subject =
    visualBrief.sceneDescription ||
    scene?.visual?.aiPrompt ||
    scene?.onScreenText ||
    scene?.narrationScript ||
    scene?.pageTitle ||
    "Diverse professionals collaborating in a modern workplace";

  const style = (visualBrief.style || "Photorealistic").toString();
  const aspect = visualBrief.aspectRatio || "16:9";
  const composition =
    visualBrief.composition ||
    "natural candid composition with clear subject focus";
  const environment =
    visualBrief.environment || "contemporary office or home office";
  const lighting =
    visualBrief.lighting || "soft natural daylight or warm practical lighting";
  const mood = visualBrief.mood || "professional, inclusive, productive";
  const palette = Array.isArray(brand?.colours) && brand.colours.length
    ? brand.colours.join(", ")
    : "#0387E6, #E63946, #BC57CF, #000000, #FFFFFF";

  const avoid = [
    "no vector art",
    "no flat illustration",
    "no cartoon",
    "no clip art",
    "no isometric illustration",
    "no 3D render look",
    "no exaggerated proportions",
  ].join(", ");

  const realism = [
    "photorealistic",
    "high-resolution",
    "natural skin tones",
    "realistic proportions",
    "subtle depth of field",
    "authentic textures",
    "clean background bokeh when appropriate",
  ].join(", ");

  return [
    `${subject}.`,
    `Environment: ${environment}. Composition: ${composition}.`,
    `Lighting: ${lighting}. Mood: ${mood}.`,
    `Style: ${style}; ${realism}. Aspect ratio: ${aspect}.`,
    `Brand-aware accents (subtle): ${palette}.`,
    `Avoid: ${avoid}.`,
  ].join(" ");
}

/**
 * POST /generate-storyboard-from-brief
 * Generates a storyboard and (optionally) scene-level images using Imagen/Gemini.
 */
storyboardGenRoute.post(
  "/generate-storyboard-from-brief",
  async (req: Request, res: Response) => {
    try {
      const { projectBrief, formData: rawFormData, brand, interactivityHints } =
        req.body ?? {};

      // Normalize formData + decide if we should generate images
      const requestedGenerateImages = Boolean(rawFormData?.generateImages);
      const effectiveGenerateImages =
        FORCE_GENERATE_IMAGES || requestedGenerateImages;

      const formData: any = {
        ...(rawFormData || {}),
        generateImages: effectiveGenerateImages,
      };

      console.log("📝 /generate-storyboard-from-brief");
      console.log("   ▶︎ moduleName:", formData?.moduleName);
      console.log("   ▶︎ requested generateImages:", requestedGenerateImages);
      console.log("   ▶︎ FORCE_GENERATE_IMAGES (env):", FORCE_GENERATE_IMAGES);
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
      if (effectiveGenerateImages && result.scenes.length) {
        console.log(`🎨 Generating images for ${result.scenes.length} scene(s)…`);

        // Create tasks for each scene (limit concurrency to avoid rate limits)
        const tasks = result.scenes.map((scene: any, i: number) => {
          return async () => {
            try {
              scene.visual = scene.visual || {};
              const prompt = buildScenePrompt(scene, brand);

              const visualBrief = scene.visual?.visualGenerationBrief || {};
              const size = visualBrief.size || "1280x720"; // good default for landscape
              const aspectRatio = visualBrief.aspectRatio || "16:9";
              const style = visualBrief.style || "photorealistic";

              console.log(
                `   • [${i + 1}/${result.scenes.length}] Scene ${
                  scene.sceneNumber ?? "?"
                }: style=${style}, size=${size}, AR=${aspectRatio}`
              );

              const { imageUrl, recipe } = await generateImageFromPrompt(prompt, {
                style,
                size,
                aspectRatio,
                // brandPalette: brand?.colours, // pass through if your image service supports it
              });

              if (imageUrl) {
                // Attach to scene.visual
                scene.visual.generatedImageUrl = imageUrl;
                scene.visual.imageParams = recipe;

                // Mirror at top-level for easier frontend use
                (scene as any).imageUrl = imageUrl;
                (scene as any).imageParams = recipe;

                // Optional: provide a helpful alt text if missing
                if (!scene.visual.altText) {
                  scene.visual.altText =
                    `Photorealistic scene for "${scene.pageTitle || "Storyboard scene"}"`;
                }

                console.log("     ✅ Image URL:", imageUrl);
              } else {
                console.warn(
                  `     ⚠️ No imageUrl returned for scene ${scene.sceneNumber ?? "?"}`
                );
              }
            } catch (imgErr: any) {
              console.error(
                `     ❌ Image generation failed for scene ${scene.sceneNumber ?? "?"}:`,
                imgErr?.message || imgErr
              );
            }
          };
        });

        // Run tasks with a small concurrency limit
        await runWithConcurrency(tasks, 3, 200);
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