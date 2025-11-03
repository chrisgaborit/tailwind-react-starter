/**
 * Zod schemas for pedagogical validation
 * Contract-first development for runtime type safety
 */

import { z } from 'zod';

// Pedagogical purpose enum
export const PedagogicalPurposeSchema = z.enum(['teach', 'example', 'scenario', 'practice', 'assessment']);

// Continuity issue severity
export const ContinuitySeveritySchema = z.enum(['high', 'medium', 'low']);

// Continuity issue types
export const ContinuityIssueTypeSchema = z.enum([
  'repetition',
  'misalignment', 
  'complexity-gap',
  'terminology-drift',
  'pedagogical-sequence',
  'character-repetition',
  'abrupt-transition'
]);

// Individual continuity issue
export const ContinuityIssueSchema = z.object({
  type: ContinuityIssueTypeSchema,
  description: z.string().min(1, 'Description is required'),
  severity: ContinuitySeveritySchema,
  scenes: z.array(z.number().int().positive()).min(1, 'At least one scene must be specified'),
  recommendation: z.string().min(1, 'Recommendation is required'),
  evidence: z.string().optional()
});

// Continuity report
export const ContinuityReportSchema = z.object({
  issues: z.array(ContinuityIssueSchema).default([]),
  repairedStoryboard: z.any().optional(), // StoryboardModule type will be imported
  requiresRegeneration: z.boolean().default(false),
  overallScore: z.number().min(0).max(100).default(0),
  summary: z.string().min(1, 'Summary is required')
});

// Learning objective
export const LearningObjectiveSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  description: z.string().min(1, 'Description is required')
});

// Pedagogical segment
export const PedagogicalSegmentSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  learning_objective: z.string().min(1, 'Learning objective reference is required'),
  segment_type: z.enum(['teach', 'example', 'practice', 'assessment']),
  duration: z.number().positive('Duration must be positive'),
  description: z.string().min(1, 'Description is required')
});

// Pedagogical blueprint
export const PedagogicalBlueprintSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  learning_objectives: z.array(LearningObjectiveSchema).min(1, 'At least one learning objective is required'),
  segments: z.array(PedagogicalSegmentSchema).min(1, 'At least one segment is required'),
  total_duration: z.number().positive('Total duration must be positive'),
  pedagogical_strategy: z.string().min(1, 'Strategy is required'),
  strategy: z.enum(['scaffolded-progressive', 'case-based', 'problem-centered', 'principle-driven']),
  learningObjectiveFlow: z.array(z.object({
    objective: z.string(),
    teachingApproach: z.enum(['metaphor', 'direct-instruction', 'discovery', 'contrast']),
    exampleType: z.enum(['case-study', 'scenario', 'demonstration', 'analogy']),
    practiceModality: z.enum(['simulation', 'drag-drop', 'branching', 'reflection']),
    assessmentMethod: z.enum(['decision-tree', 'multiple-choice', 'performance', 'self-assessment']),
    timeAllocation: z.object({
      teach: z.number().min(0).max(100),
      example: z.number().min(0).max(100),
      practice: z.number().min(0).max(100),
      assess: z.number().min(0).max(100)
    })
  })),
  repetitionGuards: z.array(z.string()).default([]),
  clientTerminology: z.record(z.string()).default({})
});

// Validation helper functions
export const validateContinuityIssue = (issue: unknown) => {
  return ContinuityIssueSchema.parse(issue);
};

export const validateContinuityReport = (report: unknown) => {
  return ContinuityReportSchema.parse(report);
};

export const validatePedagogicalBlueprint = (blueprint: unknown) => {
  return PedagogicalBlueprintSchema.parse(blueprint);
};

// Type exports for use in other files
export type ContinuityIssueType = z.infer<typeof ContinuityIssueTypeSchema>;
export type ContinuitySeverity = z.infer<typeof ContinuitySeveritySchema>;
export type PedagogicalPurposeType = z.infer<typeof PedagogicalPurposeSchema>;
