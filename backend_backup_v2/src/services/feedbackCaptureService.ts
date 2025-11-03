// Feedback Capture Service
// Captures and processes human feedback for continuous learning

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing Supabase configuration");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface FeedbackEvent {
  id?: string;
  storyboard_id: string;
  scene_index: number;
  field_name: string;
  field_path?: string;
  original_value: string;
  edited_value: string;
  edit_type: 'text_change' | 'structure_change' | 'addition' | 'deletion';
  edit_reason?: string;
  archetype: string;
  pattern_type: string;
  company_id: string;
  user_id: string;
  quality_impact: 'positive' | 'negative' | 'neutral';
  created_at?: string;
}

interface QualityOverride {
  id?: string;
  storyboard_id: string;
  metric_type: string;
  ai_score: number;
  human_score: number;
  override_reason?: string;
  user_id: string;
  created_at?: string;
}

interface LearningPatternMetrics {
  id?: string;
  pattern_type: string;
  archetype: string;
  company_id?: string;
  total_uses: number;
  total_edits: number;
  avg_edit_frequency: number;
  avg_quality_score: number;
  common_edit_types: any;
  last_improved_at?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Capture a feedback event when a human makes an edit
 */
async function captureFeedbackEvent(
  feedback: Omit<FeedbackEvent, 'id' | 'created_at'>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('feedback_events')
      .insert(feedback);

    if (error) {
      console.error('Error capturing feedback event:', error);
      return false;
    }

    // Update learning patterns metrics
    await updateLearningPatternMetrics(feedback.pattern_type, feedback.archetype, feedback.company_id);
    
    // Update company learning profile
    await updateCompanyLearningProfile(feedback.company_id, feedback);

    return true;
  } catch (error) {
    console.error('Feedback capture service error:', error);
    return false;
  }
}

/**
 * Capture a quality score override
 */
async function captureQualityOverride(
  override: Omit<QualityOverride, 'id' | 'created_at'>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('quality_overrides')
      .insert(override);

    if (error) {
      console.error('Error capturing quality override:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Quality override service error:', error);
    return false;
  }
}

/**
 * Update learning patterns metrics based on feedback
 */
async function updateLearningPatternMetrics(
  patternType: string,
  archetype: string,
  companyId?: string
): Promise<void> {
  try {
    // Get current metrics
    const { data: existing, error: fetchError } = await supabase
      .from('learning_patterns_metrics')
      .select('*')
      .eq('pattern_type', patternType)
      .eq('archetype', archetype)
      .eq('company_id', companyId || null)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // Not found error
      console.error('Error fetching learning patterns metrics:', fetchError);
      return;
    }

    const currentMetrics = existing || {
      pattern_type: patternType,
      archetype: archetype,
      company_id: companyId,
      total_uses: 0,
      total_edits: 0,
      avg_edit_frequency: 0,
      avg_quality_score: 0,
      common_edit_types: {}
    };

    // Get recent feedback events for this pattern
    const { data: recentFeedback, error: feedbackError } = await supabase
      .from('feedback_events')
      .select('edit_type, quality_impact')
      .eq('pattern_type', patternType)
      .eq('archetype', archetype)
      .eq('company_id', companyId || null)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

    if (feedbackError) {
      console.error('Error fetching recent feedback:', feedbackError);
      return;
    }

    // Calculate new metrics
    const totalUses = currentMetrics.total_uses + 1;
    const totalEdits = currentMetrics.total_edits + (recentFeedback?.length || 0);
    const avgEditFrequency = totalUses > 0 ? totalEdits / totalUses : 0;

    // Calculate quality score from recent feedback
    const positiveFeedback = recentFeedback?.filter(f => f.quality_impact === 'positive').length || 0;
    const totalFeedback = recentFeedback?.length || 1;
    const avgQualityScore = (positiveFeedback / totalFeedback) * 100;

    // Update common edit types
    const editTypeCounts: { [key: string]: number } = {};
    recentFeedback?.forEach(feedback => {
      editTypeCounts[feedback.edit_type] = (editTypeCounts[feedback.edit_type] || 0) + 1;
    });

    const commonEditTypes = Object.entries(editTypeCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .reduce((acc, [type, count]) => ({ ...acc, [type]: count }), {});

    // Upsert the metrics
    const { error: upsertError } = await supabase
      .from('learning_patterns_metrics')
      .upsert({
        id: existing?.id,
        pattern_type: patternType,
        archetype: archetype,
        company_id: companyId,
        total_uses: totalUses,
        total_edits: totalEdits,
        avg_edit_frequency: avgEditFrequency,
        avg_quality_score: avgQualityScore,
        common_edit_types: commonEditTypes,
        last_improved_at: new Date().toISOString()
      });

    if (upsertError) {
      console.error('Error upserting learning patterns metrics:', upsertError);
    }
  } catch (error) {
    console.error('Error updating learning patterns metrics:', error);
  }
}

/**
 * Update company learning profile based on feedback
 */
async function updateCompanyLearningProfile(
  companyId: string,
  feedback: FeedbackEvent
): Promise<void> {
  try {
    // Get current profile
    const { data: existing, error: fetchError } = await supabase
      .from('company_learning_profiles')
      .select('*')
      .eq('company_id', companyId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching company learning profile:', fetchError);
      return;
    }

    const currentProfile = existing || {
      company_id: companyId,
      preferred_tone: null,
      preferred_character_names: [],
      common_edit_patterns: {},
      quality_preferences: {},
      total_feedback_events: 0
    };

    // Get all feedback events for this company
    const { data: allFeedback, error: allFeedbackError } = await supabase
      .from('feedback_events')
      .select('edit_type, field_name, quality_impact, edit_reason')
      .eq('company_id', companyId);

    if (allFeedbackError) {
      console.error('Error fetching all feedback for company:', allFeedbackError);
      return;
    }

    // Analyze edit patterns
    const editTypeCounts: { [key: string]: number } = {};
    const fieldEditCounts: { [key: string]: number } = {};
    const qualityImpacts: { [key: string]: number } = {};

    allFeedback?.forEach(feedback => {
      editTypeCounts[feedback.edit_type] = (editTypeCounts[feedback.edit_type] || 0) + 1;
      fieldEditCounts[feedback.field_name] = (fieldEditCounts[feedback.field_name] || 0) + 1;
      qualityImpacts[feedback.quality_impact] = (qualityImpacts[feedback.quality_impact] || 0) + 1;
    });

    const commonEditPatterns = Object.entries(editTypeCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .reduce((acc, [type, count]) => ({ ...acc, [type]: count }), {});

    const qualityPreferences = Object.entries(qualityImpacts)
      .sort(([,a], [,b]) => b - a)
      .reduce((acc, [impact, count]) => ({ ...acc, [impact]: count }), {});

    // Update the profile
    const { error: upsertError } = await supabase
      .from('company_learning_profiles')
      .upsert({
        id: existing?.id,
        company_id: companyId,
        preferred_tone: currentProfile.preferred_tone,
        preferred_character_names: currentProfile.preferred_character_names,
        common_edit_patterns: commonEditPatterns,
        quality_preferences: qualityPreferences,
        total_feedback_events: allFeedback?.length || 0,
        last_updated: new Date().toISOString()
      });

    if (upsertError) {
      console.error('Error upserting company learning profile:', upsertError);
    }
  } catch (error) {
    console.error('Error updating company learning profile:', error);
  }
}

/**
 * Get learning insights for a specific pattern
 */
async function getLearningInsights(
  patternType: string,
  archetype: string,
  companyId?: string
): Promise<LearningPatternMetrics | null> {
  try {
    const { data, error } = await supabase
      .from('learning_patterns_metrics')
      .select('*')
      .eq('pattern_type', patternType)
      .eq('archetype', archetype)
      .eq('company_id', companyId || null)
      .single();

    if (error) {
      console.error('Error fetching learning insights:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Learning insights service error:', error);
    return null;
  }
}

/**
 * Get company learning profile
 */
async function getCompanyLearningProfile(companyId: string): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('company_learning_profiles')
      .select('*')
      .eq('company_id', companyId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching company learning profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Company learning profile service error:', error);
    return null;
  }
}

/**
 * Get feedback events for a storyboard
 */
async function getStoryboardFeedback(storyboardId: string): Promise<FeedbackEvent[]> {
  try {
    const { data, error } = await supabase
      .from('feedback_events')
      .select('*')
      .eq('storyboard_id', storyboardId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching storyboard feedback:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Storyboard feedback service error:', error);
    return [];
  }
}

/**
 * Get quality overrides for a storyboard
 */
async function getStoryboardQualityOverrides(storyboardId: string): Promise<QualityOverride[]> {
  try {
    const { data, error } = await supabase
      .from('quality_overrides')
      .select('*')
      .eq('storyboard_id', storyboardId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching quality overrides:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Quality overrides service error:', error);
    return [];
  }
}

module.exports = {
  captureFeedbackEvent,
  captureQualityOverride,
  getLearningInsights,
  getCompanyLearningProfile,
  getStoryboardFeedback,
  getStoryboardQualityOverrides
};
