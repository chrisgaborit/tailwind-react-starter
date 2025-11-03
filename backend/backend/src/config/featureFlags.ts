// backend/src/config/featureFlags.ts

/**
 * Centralised feature flags driven by environment variables.
 * Default behaviour keeps existing functionality unless explicitly disabled.
 */

function envFlag(name: string, defaultValue = "true"): boolean {
  const raw = process.env[name];
  if (raw == null) return defaultValue.toLowerCase() === "true";
  return raw.toLowerCase() === "true";
}

/**
 * Controls whether downstream services attempt to generate and store AI images.
 * Set `ENABLE_IMAGE_GENERATION=false` to disable all image generation pipelines.
 */
export const ENABLE_IMAGE_GENERATION = envFlag("ENABLE_IMAGE_GENERATION", "true");

