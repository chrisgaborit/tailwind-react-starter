/**
 * Configuration settings for the Genesis App backend
 * Environment-based configuration with sensible defaults
 */

// Pedagogical Continuity Agent configuration
export const ENABLE_CONTINUITY_AGENT = process.env.ENABLE_CONTINUITY_AGENT !== 'false';

// AI Service configuration
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Database configuration
export const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Feature flags
export const ENABLE_EMERGENCY_FALLBACK = process.env.ENABLE_EMERGENCY_FALLBACK !== 'false';
export const ENABLE_PEDAGOGICAL_ORCHESTRATOR = process.env.ENABLE_PEDAGOGICAL_ORCHESTRATOR !== 'false';
export const ENABLE_CHARACTER_MANAGER = process.env.ENABLE_CHARACTER_MANAGER !== 'false';

// Generation settings
export const DEFAULT_AI_MODEL = process.env.DEFAULT_AI_MODEL || 'gpt-4o';
export const MAX_STORYBOARD_SCENES = parseInt(process.env.MAX_STORYBOARD_SCENES || '50', 10);
export const MAX_REGENERATION_ATTEMPTS = parseInt(process.env.MAX_REGENERATION_ATTEMPTS || '1', 10);

// Quality thresholds
export const MIN_CONTINUITY_SCORE = parseInt(process.env.MIN_CONTINUITY_SCORE || '70', 10);
export const MAX_CONSECUTIVE_SCENARIOS = parseInt(process.env.MAX_CONSECUTIVE_SCENARIOS || '2', 10);
export const MAX_CHARACTER_REPETITION = parseInt(process.env.MAX_CHARACTER_REPETITION || '3', 10);

// Logging configuration
export const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
export const ENABLE_DETAILED_LOGGING = process.env.ENABLE_DETAILED_LOGGING === 'true';

// Validation
export const validateConfig = () => {
  const errors: string[] = [];
  
  if (!OPENAI_API_KEY && !GEMINI_API_KEY) {
    errors.push('At least one AI service API key (OpenAI or Gemini) is required');
  }
  
  if (!SUPABASE_URL) {
    errors.push('SUPABASE_URL is required');
  }
  
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    errors.push('SUPABASE_SERVICE_ROLE_KEY is required');
  }
  
  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
};

// Initialize configuration validation
if (process.env.NODE_ENV !== 'test') {
  validateConfig();
}
