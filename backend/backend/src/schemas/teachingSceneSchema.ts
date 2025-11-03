// backend/src/schemas/teachingSceneSchema.ts
import { z } from 'zod';

/**
 * Zod schema for teaching scene validation
 * Ensures all generated teaching scenes meet quality standards
 */
export const TeachingSceneSchema = z.object({
  sceneNumber: z.number().int().positive('Scene number must be a positive integer'),
  
  pageTitle: z.string()
    .min(5, 'Page title must be at least 5 characters')
    .max(100, 'Page title must be under 100 characters')
    .refine(title => title.split(' ').length >= 3 && title.split(' ').length <= 12, 
      'Page title must be 3-12 words'),
  
  pageType: z.enum(['Informative', 'Interactive'], {
    errorMap: () => ({ message: 'Page type must be either Informative or Interactive' })
  }),
  
  narrationScript: z.string()
    .min(150, 'Narration script must be at least 150 words')
    .max(300, 'Narration script must be under 300 words')
    .refine(script => script.split(' ').length >= 150 && script.split(' ').length <= 300,
      'Narration script must be 150-300 words'),
  
  onScreenText: z.string()
    .min(40, 'On-screen text must be at least 40 words')
    .max(70, 'On-screen text must be under 70 words')
    .refine(text => text.split(' ').length >= 40 && text.split(' ').length <= 70,
      'On-screen text must be 40-70 words'),
  
  visual: z.object({
    aiPrompt: z.string()
      .min(20, 'Visual AI prompt must be at least 20 characters')
      .max(200, 'Visual AI prompt must be under 200 characters')
      .refine(prompt => prompt.split(' ').length >= 5,
        'Visual AI prompt must be at least 5 words'),
    
    altText: z.string()
      .min(10, 'Alt text must be at least 10 characters')
      .max(100, 'Alt text must be under 100 characters')
      .refine(alt => alt.split(' ').length >= 3,
        'Alt text must be at least 3 words'),
    
    aspectRatio: z.enum(['16:9', '1:1', '4:5']).optional()
  }),
  
  interactionType: z.enum(['None', 'MCQ', 'Scenario', 'Hotspots', 'DragDrop', 'Reflection']).optional(),
  
  interactionDetails: z.record(z.any()).optional(),
  
  timing: z.object({
    estimatedSeconds: z.number()
      .int()
      .min(60, 'Estimated duration must be at least 60 seconds')
      .max(300, 'Estimated duration must be under 300 seconds')
  }),
  
  pedagogicalPhase: z.enum([
    'Welcome', 'LearningOutcomes', 'Teach', 'Practice', 
    'Apply', 'Assess', 'Summary', 'NextSteps'
  ]).optional(),
  
  learningOutcomeIndex: z.number().int().min(0).optional(),
  
  learningOutcome: z.string().min(10, 'Learning outcome must be at least 10 characters').optional(),
  
  frameworkCompliant: z.boolean().optional()
});

/**
 * Schema for validation error details
 */
export const ValidationErrorSchema = z.object({
  error: z.string(),
  attempts: z.number().int().min(1),
  lastAttemptContent: z.string(),
  failures: z.array(z.string()),
  validationSchema: z.string(),
  guidance: z.string(),
  checksum: z.string(),
  timestamp: z.string()
});

/**
 * Schema for validation result
 */
export const ValidationResultSchema = z.object({
  isValid: z.boolean(),
  content: z.string(),
  attempts: z.number().int().min(1),
  failures: z.array(z.string()),
  checksum: z.string(),
  timestamp: z.string(),
  validationSchema: z.string().optional(),
  guidance: z.string().optional()
});

/**
 * Schema for template enforcement metadata
 */
export const TemplateEnforcementSchema = z.object({
  templateVersion: z.string().optional(),
  checksum: z.string().optional(),
  validationPassed: z.boolean().optional(),
  regenerationAttempts: z.number().int().min(0).optional(),
  lastValidationTimestamp: z.string().optional(),
  templateType: z.enum(['teaching', 'scenario', 'assessment', 'practice']).optional()
});


