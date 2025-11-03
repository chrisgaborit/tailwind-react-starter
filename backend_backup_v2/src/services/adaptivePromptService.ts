// Adaptive Prompt Refinement Service
// Automatically refines prompts based on human feedback patterns

const { createClient } = require("@supabase/supabase-js");
const { getLearningInsights, getCompanyLearningProfile } = require("./feedbackCaptureService");

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing Supabase configuration");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface PromptRefinement {
  id?: string;
  pattern_type: string;
  archetype: string;
  original_prompt: string;
  refined_prompt: string;
  refinement_reason: string;
  feedback_count: number;
  quality_improvement?: number;
  is_active: boolean;
  created_at?: string;
}

/**
 * Analyze feedback patterns and suggest prompt refinements
 */
async function analyzeFeedbackPatterns(): Promise<PromptRefinement[]> {
  const refinements: PromptRefinement[] = [];
  
  try {
    // Get all pattern types and archetypes
    const patternTypes = ['dilemma', 'click_to_reveal', 'tabbed_explainer', 'assessment', 'timeline', 'menu'];
    const archetypes = ['compliance_policy', 'software_tutorial', 'scenario_based', 'concept_explainer'];

    for (const patternType of patternTypes) {
      for (const archetype of archetypes) {
        const insights = await getLearningInsights(patternType, archetype);
        
        if (insights && insights.avg_edit_frequency > 0.5) { // High edit frequency
          const refinement = await generatePromptRefinement(patternType, archetype, insights);
          if (refinement) {
            refinements.push(refinement);
          }
        }
      }
    }

    return refinements;
  } catch (error) {
    console.error('Error analyzing feedback patterns:', error);
    return [];
  }
}

/**
 * Generate a prompt refinement for a specific pattern
 */
async function generatePromptRefinement(
  patternType: string,
  archetype: string,
  insights: any
): Promise<PromptRefinement | null> {
  try {
    // Get recent feedback events for this pattern
    const { data: recentFeedback, error } = await supabase
      .from('feedback_events')
      .select('field_name, edit_type, original_value, edited_value, edit_reason')
      .eq('pattern_type', patternType)
      .eq('archetype', archetype)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(50);

    if (error || !recentFeedback || recentFeedback.length === 0) {
      return null;
    }

    // Analyze common edit patterns
    const commonEdits = analyzeCommonEdits(recentFeedback);
    
    if (commonEdits.length === 0) {
      return null;
    }

    // Get the current prompt for this pattern
    const currentPrompt = getCurrentPrompt(patternType, archetype);
    
    // Generate refined prompt based on common edits
    const refinedPrompt = refinePromptBasedOnEdits(currentPrompt, commonEdits, patternType, archetype);
    
    if (refinedPrompt === currentPrompt) {
      return null; // No changes needed
    }

    // Create refinement record
    const refinement: PromptRefinement = {
      pattern_type: patternType,
      archetype: archetype,
      original_prompt: currentPrompt,
      refined_prompt: refinedPrompt,
      refinement_reason: generateRefinementReason(commonEdits),
      feedback_count: recentFeedback.length,
      quality_improvement: insights.avg_quality_score,
      is_active: true
    };

    // Save to database
    const { error: saveError } = await supabase
      .from('prompt_refinements')
      .insert(refinement);

    if (saveError) {
      console.error('Error saving prompt refinement:', saveError);
      return null;
    }

    return refinement;
  } catch (error) {
    console.error('Error generating prompt refinement:', error);
    return null;
  }
}

/**
 * Analyze common edit patterns from feedback
 */
function analyzeCommonEdits(feedback: any[]): Array<{
  field: string;
  editType: string;
  pattern: string;
  frequency: number;
}> {
  const editPatterns: { [key: string]: { count: number; examples: string[] } } = {};

  feedback.forEach(edit => {
    const key = `${edit.field_name}:${edit.edit_type}`;
    if (!editPatterns[key]) {
      editPatterns[key] = { count: 0, examples: [] };
    }
    editPatterns[key].count++;
    if (editPatterns[key].examples.length < 3) {
      editPatterns[key].examples.push(edit.edit_reason || 'No reason provided');
    }
  });

  return Object.entries(editPatterns)
    .filter(([, data]) => data.count >= 3) // At least 3 occurrences
    .map(([key, data]) => {
      const [field, editType] = key.split(':');
      return {
        field,
        editType,
        pattern: data.examples.join('; '),
        frequency: data.count
      };
    })
    .sort((a, b) => b.frequency - a.frequency);
}

/**
 * Get current prompt for a pattern type and archetype
 */
function getCurrentPrompt(patternType: string, archetype: string): string {
  // This would typically come from a prompts database or configuration
  // For now, return a basic prompt structure
  const basePrompts: { [key: string]: string } = {
    dilemma: `Create a character-driven dilemma that tests understanding of the learning objective. Include realistic workplace context, clear choices, and detailed consequences.`,
    click_to_reveal: `Create engaging click-to-reveal content that breaks down complex concepts into digestible sections. Use clear headers and progressive disclosure.`,
    tabbed_explainer: `Create organized tabbed content that presents information in logical sections. Ensure each tab has clear value and flows well together.`,
    assessment: `Create challenging but fair assessments that test application of knowledge, not just recall. Include plausible distractors and detailed feedback.`,
    timeline: `Create interactive timeline content that shows historical context or process evolution. Make events clickable with detailed information.`,
    menu: `Create clear menu interfaces that guide users to appropriate learning paths. Use descriptive labels and logical organization.`
  };

  return basePrompts[patternType] || basePrompts.dilemma;
}

/**
 * Refine prompt based on common edits
 */
function refinePromptBasedOnEdits(
  originalPrompt: string,
  commonEdits: Array<{ field: string; editType: string; pattern: string; frequency: number }>,
  patternType: string,
  archetype: string
): string {
  let refinedPrompt = originalPrompt;

  // Add specific guidance based on common edit patterns
  const guidance: string[] = [];

  commonEdits.forEach(edit => {
    switch (edit.field) {
      case 'narrationScript':
        if (edit.editType === 'text_change') {
          guidance.push('Ensure narration uses natural, conversational language that matches the target audience.');
        }
        break;
      case 'onScreenText':
        if (edit.editType === 'structure_change') {
          guidance.push('Structure on-screen text with clear hierarchy: title, body text, and bullet points.');
        }
        break;
      case 'knowledgeCheck':
        if (edit.editType === 'addition') {
          guidance.push('Include comprehensive knowledge checks with realistic scenarios and detailed feedback for each option.');
        }
        break;
      case 'visuals':
        if (edit.editType === 'text_change') {
          guidance.push('Provide specific, actionable visual descriptions that developers can implement directly.');
        }
        break;
    }
  });

  if (guidance.length > 0) {
    refinedPrompt += '\n\nADDITIONAL GUIDANCE BASED ON FEEDBACK:\n' + guidance.join('\n');
  }

  // Add archetype-specific refinements
  if (archetype === 'compliance_policy') {
    refinedPrompt += '\n\nCOMPLIANCE FOCUS: Ensure all content aligns with regulatory requirements and company policies.';
  } else if (archetype === 'scenario_based') {
    refinedPrompt += '\n\nSCENARIO FOCUS: Create realistic, relatable scenarios that learners can connect with personally.';
  }

  return refinedPrompt;
}

/**
 * Generate human-readable refinement reason
 */
function generateRefinementReason(commonEdits: Array<{ field: string; editType: string; pattern: string; frequency: number }>): string {
  const reasons: string[] = [];
  
  commonEdits.forEach(edit => {
    reasons.push(`${edit.field} frequently needs ${edit.editType} (${edit.frequency} times): ${edit.pattern}`);
  });

  return reasons.join('; ');
}

/**
 * Get active prompt refinements for a pattern
 */
async function getActivePromptRefinements(
  patternType: string,
  archetype: string
): Promise<PromptRefinement[]> {
  try {
    const { data, error } = await supabase
      .from('prompt_refinements')
      .select('*')
      .eq('pattern_type', patternType)
      .eq('archetype', archetype)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching active prompt refinements:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Active prompt refinements service error:', error);
    return [];
  }
}

/**
 * Apply company-specific learning to prompts
 */
async function applyCompanyLearning(
  basePrompt: string,
  patternType: string,
  archetype: string,
  companyId: string
): Promise<string> {
  try {
    const companyProfile = await getCompanyLearningProfile(companyId);
    
    if (!companyProfile) {
      return basePrompt;
    }

    let enhancedPrompt = basePrompt;

    // Apply company-specific tone preferences
    if (companyProfile.preferred_tone) {
      enhancedPrompt += `\n\nCOMPANY TONE: Use ${companyProfile.preferred_tone} tone throughout.`;
    }

    // Apply common edit patterns as guidance
    if (companyProfile.common_edit_patterns) {
      const editGuidance: string[] = [];
      Object.entries(companyProfile.common_edit_patterns).forEach(([editType, count]) => {
        if (count > 5) { // Frequently edited
          editGuidance.push(`Avoid ${editType} issues that require frequent manual correction.`);
        }
      });
      
      if (editGuidance.length > 0) {
        enhancedPrompt += '\n\nCOMPANY-SPECIFIC GUIDANCE:\n' + editGuidance.join('\n');
      }
    }

    return enhancedPrompt;
  } catch (error) {
    console.error('Error applying company learning:', error);
    return basePrompt;
  }
}

/**
 * Run adaptive learning analysis (to be called periodically)
 */
async function runAdaptiveLearningAnalysis(): Promise<void> {
  console.log('[ADAPTIVE LEARNING] Starting feedback pattern analysis...');
  
  try {
    const refinements = await analyzeFeedbackPatterns();
    
    if (refinements.length > 0) {
      console.log(`[ADAPTIVE LEARNING] Generated ${refinements.length} prompt refinements`);
      refinements.forEach(refinement => {
        console.log(`[ADAPTIVE LEARNING] Refined ${refinement.pattern_type} for ${refinement.archetype}: ${refinement.refinement_reason}`);
      });
    } else {
      console.log('[ADAPTIVE LEARNING] No refinements needed at this time');
    }
  } catch (error) {
    console.error('[ADAPTIVE LEARNING] Error in analysis:', error);
  }
}

module.exports = {
  analyzeFeedbackPatterns,
  getActivePromptRefinements,
  applyCompanyLearning,
  runAdaptiveLearningAnalysis
};
