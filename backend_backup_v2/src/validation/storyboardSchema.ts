// backend/src/validation/storyboardSchema.ts
const { z } = require('zod');
import type { PedagogicalPhaseType, LearningOutcome, AlignmentLink, StoryboardModule, StoryboardScene } from '../types';

// New Outcome-Driven Learn-See-Do-Apply Framework Schemas
const BloomVerbSchema = z.enum(["remember", "understand", "apply", "analyze", "evaluate", "create"]);
const PedagogyPhaseSchema = z.enum(["LEARN", "SEE", "DO", "APPLY"]);

const LearningOutcomeSchema = z.object({
  id: z.string().uuid(),
  verb: BloomVerbSchema,
  text: z.string().min(1),
  context: z.string().optional(),
  measure: z.string().optional(),
  // Legacy fields for backward compatibility
  description: z.string().optional(),
  level: z.string().optional(),
  category: z.string().optional(),
  assessmentCriteria: z.array(z.string()).optional(),
});

const AlignmentLinkSchema = z.object({
  outcomeId: z.string().uuid(),
  sceneId: z.string(),
  phase: PedagogyPhaseSchema,
  evidence: z.string().optional(),
});

const ProjectMetadataSchema = z.object({
  title: z.string().min(1),
  businessImpact: z.string().optional(),
  category: z.enum(["Leadership", "Soft Skills", "Compliance", "Technical", "Sales", "HSE", "Onboarding", "Product", "Professional"]).optional(),
  // Legacy fields for backward compatibility
  moduleName: z.string().optional(),
  strategicCategory: z.string().optional(),
}).passthrough();

const VoiceParameters = z.object({
  persona: z.string().min(2),
  gender: z.string().optional(),
  pace: z.string().min(2),
  tone: z.string().min(2),
  emphasis: z.string().optional(),
});

const AudioSpec = z.object({
  script: z.string().min(2),
  voiceParameters: VoiceParameters,
  backgroundMusic: z.string().optional(),
  aiGenerationDirective: z.string().optional(),
});

const VisualGenerationBrief = z.object({
  sceneDescription: z.string().min(2),
  style: z.string().min(2),
  subject: z.record(z.any()).optional(),
  setting: z.string().optional(),
  composition: z.string().optional(),
  lighting: z.string().optional(),
  colorPalette: z.array(z.string()).optional(),
  mood: z.string().optional(),
  brandIntegration: z.string().optional(),
  negativeSpace: z.string().optional(),
});

const VisualSpec = z.object({
  mediaType: z.enum(["Image", "Graphic", "Animation", "Video"]),
  style: z.string().min(1),
  visualGenerationBrief: VisualGenerationBrief,
  aiPrompt: z.string().optional(),
  altText: z.string().min(1).max(125),
  aspectRatio: z.string().min(2),
  composition: z.string().optional(),
  environment: z.string().optional(),
  assetId: z.string().optional(),
});

const OverlayElement = z.object({
  elementType: z.string().min(1),
  content: z.string().optional(),
  placement: z.string().optional(),
  style: z
    .object({
      fontFamily: z.string().optional(),
      fontWeight: z.string().optional(),
      fontSize: z.string().optional(),
      color: z.string().optional(),
      alignment: z.string().optional(),
      position: z.string().optional(),
      padding: z.string().optional(),
      border: z.string().optional(),
      animation: z.string().optional(),
    })
    .optional(),
  aiGenerationDirective: z.string().optional(),
}).passthrough();

const ScreenLayoutSpec = z.union([
  z.string(),
  z.object({
    description: z.string().min(1),
    elements: z.array(z.union([OverlayElement, z.record(z.any())])),
  }),
]);

const XapiEvent = z.object({
  verb: z.string().min(2),
  object: z.string().min(1),
  result: z.record(z.any()).optional(),
});

const DecisionRule = z.object({
  choice: z.string().min(1),
  feedback: z
    .object({
      text: z.string().min(1),
      tone: z.string().optional(),
      visualCue: z.string().optional(),
    })
    .optional(),
  xapi: XapiEvent.optional(),
  navigateTo: z.string().optional(),
});

const InteractionDetails = z.object({
  interactionType: z.string().min(1),
  aiActions: z.array(z.string()).optional(),
  aiDecisionLogic: z.array(DecisionRule).optional(),
  retryLogic: z.string().optional(),
  completionRule: z.string().optional(),
  data: z.any().optional(),
  xapiEvents: z.array(XapiEvent).optional(),
  aiGenerationDirective: z.string().optional(),
});

const TimingSpec = z.object({
  estimatedSeconds: z.number().int().positive(),
});

const KnowledgeCheck = z.object({
  stem: z.string().optional(),
  question: z.string().optional(),
  options: z
    .array(
      z.union([
        z.string(),
        z.object({
          text: z.string(),
          correct: z.boolean().optional(),
          feedback: z.string().optional(),
        }),
      ])
    )
    .optional(),
  answer: z.union([z.string(), z.array(z.string())]).optional(),
});

const StoryboardScene = z.object({
  sceneNumber: z.number().int().positive(),
  pageTitle: z.string().min(1),
  screenLayout: ScreenLayoutSpec,
  templateId: z.string().optional(),
  screenId: z.string().optional(),
  audio: AudioSpec,
  narrationScript: z.string().min(1),
  onScreenText: z.string().min(0),
  visual: VisualSpec,
  interactionDetails: InteractionDetails.optional(),
  interactionType: z.string().min(1),
  interactionDescription: z.string().optional(),
  developerNotes: z.string().optional(),
  accessibilityNotes: z.string().optional(),
  timing: TimingSpec,
  events: z
    .array(
      z.object({
        eventNumber: z.number().int().positive(),
        onScreenText: z.string().optional(),
        audio: z.object({ script: z.string().optional() }).optional(),
        developerNotes: z.string().optional(),
        interactive: z.object({ behaviourExplanation: z.string().optional() }).optional(),
      })
    )
    .optional(),
  generatedImageUrl: z.string().optional(),
  knowledgeCheck: KnowledgeCheck.optional(),
  knowledgeChecks: z.array(KnowledgeCheck).optional(),
  // New fields for Learn-See-Do-Apply framework
  scene_id: z.string().optional(),
  internalPage: z.boolean().optional(),
  templateType: z.enum(["INTERNAL_PREFACE", "LEARNER_START", "table_of_contents", "pronunciations_acronyms"]).optional(),
  phase: z.union([z.enum(["experience", "discover", "learn", "practice"]), PedagogyPhaseSchema]).optional(),
  learningOutcomeRefs: z.array(z.string()).optional(),
  instructionalPurpose: z.enum(["Teach", "Demonstrate", "Practice", "Assess"]).optional(),
});

const RevisionHistoryItem = z.object({
  dateISO: z.string().min(8),
  change: z.string().min(1),
  author: z.string().min(1),
});

const PronunciationGuideItem = z.object({
  term: z.string(),
  pronunciation: z.string(),
  note: z.string().optional(),
});

const TableOfContentsItem = z.object({
  pageNumber: z.number().int().nonnegative(),
  title: z.string(),
});

const ModuleTiming = z.object({
  targetMinutes: z.number().int().nonnegative(),
  totalEstimatedMinutes: z.number().int().nonnegative(),
  perSceneSeconds: z.array(z.number().int().nonnegative()),
});

const StoryboardMetadata = z
  .object({
    moduleTiming: ModuleTiming.optional(),
    completionRule: z.string().optional(),
    warnings: z.array(z.string()).optional(),
  })
  .passthrough();

exports.StoryboardModuleSchema = z.object({
  moduleName: z.string().min(1),
  // Enhanced project metadata
  project_metadata: ProjectMetadataSchema.optional(),
  // Learning outcomes and alignment (new framework)
  learningOutcomes: z.array(LearningOutcomeSchema).optional(),
  alignmentMap: z.array(AlignmentLinkSchema).optional(),
  // Legacy fields
  revisionHistory: z.array(RevisionHistoryItem).optional(),
  pronunciationGuide: z.array(PronunciationGuideItem).optional(),
  tableOfContents: z.union([z.array(z.string()), z.array(TableOfContentsItem)]).optional(),
  scenes: z.array(StoryboardScene).min(4),
  pages: z.array(StoryboardScene).optional(),
  metadata: StoryboardMetadata.optional(),
  moduleOverview: z.string().optional(),
  durationMinutes: z.number().optional(),
  learningLevel: z.string().optional(),
  targetAudience: z.string().optional(),
  moduleGoal: z.string().optional(),
});

// Export individual schemas for validation
exports.BloomVerbSchema = BloomVerbSchema;
exports.PedagogyPhaseSchema = PedagogyPhaseSchema;
exports.LearningOutcomeSchema = LearningOutcomeSchema;
exports.AlignmentLinkSchema = AlignmentLinkSchema;
exports.ProjectMetadataSchema = ProjectMetadataSchema;

/**
 * Validates that a storyboard has proper pedagogical flow
 * Ensures at least one LEARN and one APPLY phase exist
 */
function validatePedagogicalFlow(storyboard: any): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!storyboard || !Array.isArray(storyboard.scenes)) {
    errors.push("Storyboard must have scenes array");
    return { isValid: false, errors, warnings };
  }
  
  // Check for LEARN and APPLY phases
  const phases = storyboard.scenes
    .filter(scene => scene.phase)
    .map(scene => scene.phase);
  
  const hasLearn = phases.includes("LEARN");
  const hasApply = phases.includes("APPLY");
  
  if (!hasLearn) {
    errors.push("Storyboard must have at least one LEARN phase");
  }
  
  if (!hasApply) {
    errors.push("Storyboard must have at least one APPLY phase");
  }
  
  // Check for proper sequence (LEARN should come before APPLY)
  const learnIndex = storyboard.scenes.findIndex(scene => scene.phase === "LEARN");
  const applyIndex = storyboard.scenes.findIndex(scene => scene.phase === "APPLY");
  
  if (hasLearn && hasApply && learnIndex > applyIndex) {
    warnings.push("LEARN phase should come before APPLY phase for optimal learning flow");
  }
  
  // Check for learning outcomes and alignment mapping
  if (storyboard.learningOutcomes && storyboard.learningOutcomes.length > 0) {
    if (!storyboard.alignmentMap || storyboard.alignmentMap.length === 0) {
      warnings.push("Learning outcomes present but no alignment mapping found");
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

exports.validatePedagogicalFlow = validatePedagogicalFlow;

// Export type for TypeScript inference
const StoryboardModuleSchema = exports.StoryboardModuleSchema;