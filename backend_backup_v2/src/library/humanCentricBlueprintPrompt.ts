/**
 * Human-Centric Storyboard Blueprint with Learn-See-Do-Apply Framework
 * 
 * Transforms AI-generated content into engaging, pedagogically sound learning experiences
 * that match the quality of human-created storyboards.
 */

import type { StoryboardModule, StoryboardScene, LearningOutcome, PedagogyPhase } from "../types";
import { outcomeDrivenIntegrationService } from '../services/outcomeDrivenIntegrationService';

/**
 * Human-Centric Storyboard Blueprint with Learn-See-Do-Apply Framework
 */
export const HUMAN_CENTRIC_STORYBOARD_BLUEPRINT = `
<< HUMAN-CENTRIC STORYBOARD BLUEPRINT - LEARN-SEE-DO-APPLY FRAMEWORK >>

YOUR PRIMARY DIRECTIVE: Transform AI-generated content from technical outlines into engaging, pedagogically sound learning experiences that match the quality of human-created storyboards.

CRITICAL FIXES REQUIRED:
- ELIMINATE the "Scenario → KC → Scenario → KC" loop
- IMPLEMENT "Learn → See → Do → Apply" sequence for ALL concepts
- ADD explicit concept teaching BEFORE application
- CREATE emotional engagement through narrative voice
- ANCHOR to organizational context and values

ARCHITECTURAL REQUIREMENTS:

FRONTEND STRUCTURE:
Page 1+: LEARN Phase (Concept Teaching)
Page 2+: SEE Phase (Demonstration)
Page 3+: DO Phase (Guided Practice)  
Page 6+: APPLY Phase (Mastery Application)
Page 7+: REVIEW & ACTION

SCHEMA ENFORCEMENT:
Every StoryboardScene MUST include:
- learningOutcome: string[] (explicitly stated)
- teachingPhase: "LEARN" | "SEE" | "DO" | "APPLY"
- alignmentMap: Record<string, string[]> (links to objectives)

PEDAGOGICAL SEQUENCE TEMPLATE:

LEARN PHASE (Concept First):
- Concept Title + Business Relevance Statement
- 100-120 word explanation with analogy/metaphor
- Visual metaphor suggestion
- Mini example (transition to SEE)

SEE PHASE (Demonstration):
- Character-driven scenario (named people)
- Real workplace context
- Shows concept in action
- Narrator reflection points

DO PHASE (Guided Practice):
- Interactive scenario with hints/feedback
- Safe practice environment
- Progressive difficulty

APPLY PHASE (Mastery):
- Complex, multi-concept scenario
- Realistic consequences
- Reflection and action planning

HUMANIZATION RULES:
- Named narrator introduction (e.g., "I'm Alex, your leadership coach...")
- Warm, conversational tone throughout
- Organizational context anchoring (connect to company mission/values)
- Micro-reflections: "Pause and consider..."
- Character development in scenarios
- Empathy and real-world relevance

QUALITY ASSURANCE CHECKLIST:
✅ Learning objectives stated EARLY and referenced throughout
✅ Every concept taught EXPLICITLY before application
✅ All four pedagogical phases present for each learning outcome
✅ Emotional engagement through storytelling
✅ Organizational context and values integrated
✅ PDF filename = moduleTitle
✅ Clean learner-facing content from page 1

SUCCESS METRIC: The output should be indistinguishable from human-created storyboards in pedagogical soundness, emotional engagement, and instructional flow.
`;

/**
 * Enhanced blueprint injection with Learn-See-Do-Apply framework
 */
export function injectHumanCentricBlueprint(
  storyboard: StoryboardModule,
  formData: any = {}
): StoryboardModule {
  // Check if this is a Leadership/Soft Skills module that needs the framework
  const category = storyboard.project_metadata?.category || 
                  storyboard.metadata?.strategicCategory || 
                  formData.moduleType || 'Unknown';
  
  const isLeadershipModule = ['Leadership', 'Soft Skills'].includes(category);
  
  if (!isLeadershipModule) {
    // Apply standard blueprint for non-leadership modules
    return applyStandardBlueprint(storyboard, formData);
  }
  
  // Apply Learn-See-Do-Apply framework for Leadership/Soft Skills modules
  return applyLearnSeeDoApplyFramework(storyboard, formData);
}

/**
 * Apply Learn-See-Do-Apply framework to Leadership/Soft Skills modules
 */
async function applyLearnSeeDoApplyFramework(
  storyboard: StoryboardModule,
  formData: any
): Promise<StoryboardModule> {
  try {
    // Step 1: Generate learning outcomes if not present
    if (!storyboard.learningOutcomes || storyboard.learningOutcomes.length === 0) {
      storyboard.learningOutcomes = outcomeDrivenIntegrationService.generateLearningOutcomes(
        formData,
        storyboard.project_metadata
      );
    }
    
    // Step 2: Create project metadata if not present
    if (!storyboard.project_metadata) {
      storyboard.project_metadata = outcomeDrivenIntegrationService.createProjectMetadata(formData);
    }
    
    // Step 3: Apply the complete framework
    const result = await outcomeDrivenIntegrationService.applyFramework(storyboard, {
      generateInstructionalSequence: true,
      applyPedagogyEnforcement: true,
      buildAlignmentMap: true,
      runQualityValidation: true,
      cleanupRedundancy: true,
      includeBusinessImpact: true,
      includeLearningOutcomes: true,
      includeAlignmentMap: true
    });
    
    if (result.success) {
      return result.storyboard;
    } else {
      console.warn('Framework application failed, falling back to standard blueprint:', result.warnings);
      return applyStandardBlueprint(storyboard, formData);
    }
    
  } catch (error) {
    console.error('Error applying Learn-See-Do-Apply framework:', error);
    return applyStandardBlueprint(storyboard, formData);
  }
}

/**
 * Apply standard blueprint for non-leadership modules
 */
function applyStandardBlueprint(
  storyboard: StoryboardModule,
  formData: any
): StoryboardModule {
  // Use existing blueprint logic
  const { ensureTOCAndMetadata, ensureCapstoneAndClosing } = require('./blueprintPrompt');
  
  let updatedStory = ensureTOCAndMetadata(storyboard, formData);
  updatedStory = ensureCapstoneAndClosing(updatedStory, formData);
  
  return updatedStory;
}

/**
 * Generate human-centric scene content for a specific phase and learning outcome
 */
export function generateHumanCentricSceneContent(
  phase: PedagogyPhase,
  learningOutcome: LearningOutcome,
  businessImpact?: string,
  targetAudience?: string
): {
  title: string;
  voiceover: string;
  onScreenText: string;
  visualBrief: string;
  interactionType: string;
  instructionalPurpose: string;
} {
  const narrator = "Alex"; // Consistent narrator
  const businessContext = businessImpact ? ` This is important because ${businessImpact.toLowerCase()}.` : '';
  
  switch (phase) {
    case 'LEARN':
      return {
        title: `Learning: ${learningOutcome.verb} ${extractSkillFromOutcome(learningOutcome.text)}`,
        voiceover: `Hi, I'm ${narrator}, your learning coach. Let's explore ${learningOutcome.verb.toLowerCase()} ${extractSkillFromOutcome(learningOutcome.text)} together.

${learningOutcome.text}${businessContext}

Think of this like learning to drive - you need to understand the rules and principles before you can navigate real traffic. We'll start with the fundamentals, then see it in action, practice it safely, and finally apply it in real situations.

Pause and consider: How might this concept apply to your current role?`,
        onScreenText: `${learningOutcome.verb.toUpperCase()}: ${extractSkillFromOutcome(learningOutcome.text)}

Key Learning Points:
• Clear definition and principles
• Business relevance and impact
• Real-world application context`,
        visualBrief: `Teaching scene with ${narrator} as a supportive coach. Clean, professional setting with visual metaphors representing the concept. Use warm, approachable colors that convey learning and growth. Include subtle animations that reinforce key points.`,
        interactionType: 'None',
        instructionalPurpose: 'Teach'
      };
      
    case 'SEE':
      return {
        title: `Example: ${learningOutcome.verb} in Action`,
        voiceover: `Now let's see ${learningOutcome.verb.toLowerCase()} ${extractSkillFromOutcome(learningOutcome.text)} in a real workplace scenario.

Meet Jordan, a team leader who's facing a challenging situation. Watch how Jordan applies the principles we just learned, and notice the positive outcomes that result.

[Scenario plays out with character dialogue and actions]

As you can see, Jordan's approach demonstrates effective ${learningOutcome.verb.toLowerCase()}. The key was understanding the situation, applying the right principles, and adapting to the context.

Pause and consider: What would you have done differently in Jordan's situation?`,
        onScreenText: `Example: ${learningOutcome.verb} in Action

Watch Jordan's approach:
• Real workplace scenario
• Principles applied effectively
• Positive outcomes achieved`,
        visualBrief: `Character-driven scenario showing Jordan in a realistic workplace setting. Use established characters (Jordan, Sarah Chen) with authentic expressions and body language. Include visual cues that highlight key decision points and outcomes.`,
        interactionType: 'Click & Reveal',
        instructionalPurpose: 'Demonstrate'
      };
      
    case 'DO':
      return {
        title: `Practice: ${learningOutcome.verb} Skills`,
        voiceover: `Now it's your turn to practice ${learningOutcome.verb.toLowerCase()} ${extractSkillFromOutcome(learningOutcome.text)}.

You'll work through a guided practice activity that will help you develop this skill. Don't worry if you make mistakes - that's how we learn. You'll receive immediate feedback to help you improve.

Remember, this is a safe practice environment. Take your time, think through your options, and don't be afraid to try different approaches.

Ready to give it a try?`,
        onScreenText: `Practice: ${learningOutcome.verb} Skills

Your turn to practice:
• Guided activities with hints
• Immediate feedback provided
• Multiple attempts allowed
• Safe learning environment`,
        visualBrief: `Interactive practice environment with clear visual cues for user actions. Use encouraging colors and supportive imagery. Include progress indicators and feedback areas that feel welcoming rather than judgmental.`,
        interactionType: 'Scenario',
        instructionalPurpose: 'Practice'
      };
      
    case 'APPLY':
      return {
        title: `Apply: ${learningOutcome.verb} in Real Scenarios`,
        voiceover: `Now let's apply ${learningOutcome.verb.toLowerCase()} ${extractSkillFromOutcome(learningOutcome.text)} in a complex, realistic scenario.

This capstone activity will test your understanding and ability to apply what you've learned. You'll face challenging situations that require you to synthesize all your learning and make thoughtful decisions.

This scenario reflects the kind of complex, real-world situations you'll encounter in your role. Take your time, consider all the factors, and trust your learning.

Remember: there's often more than one right approach, but some approaches will lead to better outcomes than others.`,
        onScreenText: `Apply: ${learningOutcome.verb} in Real Scenarios

Capstone Assessment:
• Complex workplace scenario
• Multiple decision points
• Realistic consequences
• Comprehensive feedback`,
        visualBrief: `Complex, realistic workplace scenario with multiple characters and decision points. Use professional, authentic imagery that reflects real organizational challenges. Include visual indicators for different choice paths and their potential outcomes.`,
        interactionType: 'Scenario',
        instructionalPurpose: 'Assess'
      };
      
    default:
      throw new Error(`Unknown phase: ${phase}`);
  }
}

/**
 * Extract skill from learning outcome text
 */
function extractSkillFromOutcome(text: string): string {
  const words = text.split(' ');
  if (words.length > 3) {
    return words.slice(1, 4).join(' ');
  }
  return text;
}

/**
 * Generate human-centric internal pages
 */
export function generateHumanCentricInternalPages(
  storyboard: StoryboardModule,
  formData: any
): StoryboardScene[] {
  // TOC and Pronunciation pages removed per user request
  return [];
  
  // Page 1: Table of Contents
  internalPages.push({
    scene_id: 'toc-page',
    sceneNumber: 1,
    pageTitle: 'Table of Contents',
    title: 'Table of Contents',
    internalPage: true,
    templateType: 'table_of_contents',
    screenLayout: {
      description: 'Table of contents layout with module structure',
      elements: []
    },
    audio: {
      script: 'Welcome to this learning module. This table of contents will help you navigate through the content.',
      voiceParameters: {
        persona: 'Professional narrator',
        pace: 'moderate',
        tone: 'clear and welcoming'
      }
    },
    narrationScript: 'Welcome to this learning module. This table of contents will help you navigate through the content.',
    onScreenText: 'INTERNAL USE ONLY - Table of Contents',
    visual: {
      mediaType: 'Graphic',
      style: 'professional',
      visualGenerationBrief: {
        sceneDescription: 'Clean table of contents with module structure and navigation',
        style: 'corporate',
        mood: 'professional and organized'
      },
      altText: 'Table of contents page',
      aspectRatio: '16:9'
    },
    interactionType: 'None',
    timing: { estimatedSeconds: 30 }
  });
  
  // Page 2: Pronunciations & Acronyms
  internalPages.push({
    scene_id: 'pronunciations-page',
    sceneNumber: 2,
    pageTitle: 'Pronunciations & Acronyms',
    title: 'Pronunciations & Acronyms',
    internalPage: true,
    templateType: 'pronunciations_acronyms',
    screenLayout: {
      description: 'Pronunciations and acronyms layout',
      elements: []
    },
    audio: {
      script: 'This page contains important pronunciations and acronyms you\'ll encounter throughout this module.',
      voiceParameters: {
        persona: 'Professional narrator',
        pace: 'moderate',
        tone: 'clear and informative'
      }
    },
    narrationScript: 'This page contains important pronunciations and acronyms you\'ll encounter throughout this module.',
    onScreenText: 'INTERNAL USE ONLY - Pronunciations & Acronyms',
    visual: {
      mediaType: 'Graphic',
      style: 'professional',
      visualGenerationBrief: {
        sceneDescription: 'Clean layout with pronunciation guide and acronym definitions',
        style: 'corporate',
        mood: 'professional and informative'
      },
      altText: 'Pronunciations and acronyms page',
      aspectRatio: '16:9'
    },
    interactionType: 'None',
    timing: { estimatedSeconds: 30 }
  });
  
  return internalPages;
}

/**
 * Main entry point for human-centric blueprint application
 */
export function applyHumanCentricBlueprint(
  storyboard: StoryboardModule,
  formData: any = {}
): StoryboardModule {
  // Apply the human-centric blueprint with Learn-See-Do-Apply framework
  return injectHumanCentricBlueprint(storyboard, formData);
}




