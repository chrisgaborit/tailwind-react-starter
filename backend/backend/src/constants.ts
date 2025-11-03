// backend/src/constants.ts

import { ModuleLevel } from './types/storyboardTypesArchive';

export const GEMINI_MODEL_NAME = 'models/gemini-1.5-pro';

export const API_KEY_ERROR_MESSAGE =
  'API_KEY environment variable not found. Please ensure it is set in your .env file for the backend server.';
export const GENERIC_ERROR_MESSAGE = 'An unexpected error occurred while processing your request.';
export const FORM_ERROR_MESSAGE = 'Invalid request body. Please ensure all required fields are provided and valid.';
export const MODULE_TYPE_LOGIC_ERROR =
  'Internal server error: Could not find specific logic for the provided module type.';

export const MODULE_TYPES = [
  'Compliance',
  'Onboarding & Induction',
  'Product Training',
  'Soft Skills & Leadership',
  'Systems & Process Training',
  'Customer Service',
  'Health, Safety & Wellbeing',
  'Sales & Marketing',
  'Technical or Systems Training',
  'Personal Development',
] as const;

export const TONE_TYPES = [
  'Professional',
  'Conversational',
  'Inspirational',
  'Playful',
  'Authoritative',
  'Empathetic',
  'Humorous',
] as const;

export const SUPPORTED_LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'German',
  'Mandarin',
  'Arabic',
  'Hindi',
  'Japanese',
] as const;

export const LEVEL_DESCRIPTIONS: { [key: string]: string } = {
  [ModuleLevel.Level1]:
    'Focus: Foundational knowledge. Style: Direct instruction, simple interactions (e.g., click next, simple MCQs).',
  [ModuleLevel.Level2]:
    'Focus: Application and understanding. Style: More interactivity, scenarios, case studies, guided exploration (e.g., tabs, drag & drop).',
  [ModuleLevel.Level3]:
    'Focus: Strategic thinking, complex problem-solving. Style: High interactivity, simulations, branching scenarios, deep reflection.',
  [ModuleLevel.Level4]:
    'Focus: Mastery & Innovation. Style: AI-driven adaptive learning, advanced simulations, generative tasks, real-world problem synthesis.',
};
