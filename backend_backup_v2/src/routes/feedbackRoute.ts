// Feedback API Routes
// Handles feedback capture, quality overrides, and learning insights

const express = require("express");
const { 
  captureFeedbackEvent, 
  captureQualityOverride, 
  getStoryboardFeedback, 
  getStoryboardQualityOverrides,
  getLearningInsights,
  getCompanyLearningProfile
} = require("../services/feedbackCaptureService");
const { 
  analyzeFeedbackPatterns, 
  getActivePromptRefinements,
  applyCompanyLearning,
  runAdaptiveLearningAnalysis
} = require("../services/adaptivePromptService");
const { 
  generateQualityDashboard, 
  submitQualityOverride, 
  getQualityTrends 
} = require("../services/qualityDashboardService");

const router = express.Router();

/**
 * POST /api/feedback/capture
 * Capture a human feedback event
 */
router.post("/capture", async (req, res) => {
  try {
    const {
      storyboard_id,
      scene_index,
      field_name,
      field_path,
      original_value,
      edited_value,
      edit_type,
      edit_reason,
      archetype,
      pattern_type,
      company_id,
      user_id,
      quality_impact
    } = req.body;

    // Validate required fields
    if (!storyboard_id || !scene_index || !field_name || !original_value || !edited_value || !edit_type) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: storyboard_id, scene_index, field_name, original_value, edited_value, edit_type"
      });
    }

    const success = await captureFeedbackEvent({
      storyboard_id,
      scene_index,
      field_name,
      field_path,
      original_value,
      edited_value,
      edit_type,
      edit_reason,
      archetype: archetype || 'compliance_policy',
      pattern_type: pattern_type || 'dilemma',
      company_id: company_id || 'default',
      user_id: user_id || 'anonymous',
      quality_impact: quality_impact || 'neutral'
    });

    if (success) {
      res.json({ success: true, message: "Feedback captured successfully" });
    } else {
      res.status(500).json({ success: false, error: "Failed to capture feedback" });
    }
  } catch (error) {
    console.error("Feedback capture error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

/**
 * POST /api/feedback/quality-override
 * Submit a quality score override
 */
router.post("/quality-override", async (req, res) => {
  try {
    const {
      storyboard_id,
      metric_type,
      ai_score,
      human_score,
      override_reason,
      user_id
    } = req.body;

    // Validate required fields
    if (!storyboard_id || !metric_type || ai_score === undefined || human_score === undefined) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: storyboard_id, metric_type, ai_score, human_score"
      });
    }

    const success = await submitQualityOverride(
      storyboard_id,
      metric_type,
      ai_score,
      human_score,
      override_reason || '',
      user_id || 'anonymous'
    );

    if (success) {
      res.json({ success: true, message: "Quality override submitted successfully" });
    } else {
      res.status(500).json({ success: false, error: "Failed to submit quality override" });
    }
  } catch (error) {
    console.error("Quality override error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

/**
 * GET /api/feedback/storyboard/:storyboardId
 * Get feedback events for a storyboard
 */
router.get("/storyboard/:storyboardId", async (req, res) => {
  try {
    const { storyboardId } = req.params;
    const feedback = await getStoryboardFeedback(storyboardId);
    const overrides = await getStoryboardQualityOverrides(storyboardId);

    res.json({
      success: true,
      data: {
        feedback_events: feedback,
        quality_overrides: overrides
      }
    });
  } catch (error) {
    console.error("Get storyboard feedback error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

/**
 * GET /api/feedback/insights/:patternType/:archetype
 * Get learning insights for a pattern
 */
router.get("/insights/:patternType/:archetype", async (req, res) => {
  try {
    const { patternType, archetype } = req.params;
    const { company_id } = req.query;

    const insights = await getLearningInsights(patternType, archetype, company_id as string);

    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    console.error("Get learning insights error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

/**
 * GET /api/feedback/company/:companyId
 * Get company learning profile
 */
router.get("/company/:companyId", async (req, res) => {
  try {
    const { companyId } = req.params;
    const profile = await getCompanyLearningProfile(companyId);

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error("Get company profile error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

/**
 * GET /api/feedback/quality-trends/:companyId
 * Get quality trends for a company
 */
router.get("/quality-trends/:companyId", async (req, res) => {
  try {
    const { companyId } = req.params;
    const trends = await getQualityTrends(companyId);

    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    console.error("Get quality trends error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

/**
 * GET /api/feedback/prompt-refinements/:patternType/:archetype
 * Get active prompt refinements
 */
router.get("/prompt-refinements/:patternType/:archetype", async (req, res) => {
  try {
    const { patternType, archetype } = req.params;
    const refinements = await getActivePromptRefinements(patternType, archetype);

    res.json({
      success: true,
      data: refinements
    });
  } catch (error) {
    console.error("Get prompt refinements error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

/**
 * POST /api/feedback/analyze-patterns
 * Run adaptive learning analysis
 */
router.post("/analyze-patterns", async (req, res) => {
  try {
    await runAdaptiveLearningAnalysis();
    res.json({ success: true, message: "Pattern analysis completed" });
  } catch (error) {
    console.error("Pattern analysis error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

/**
 * POST /api/feedback/apply-company-learning
 * Apply company learning to a prompt
 */
router.post("/apply-company-learning", async (req, res) => {
  try {
    const { base_prompt, pattern_type, archetype, company_id } = req.body;

    if (!base_prompt || !pattern_type || !archetype || !company_id) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: base_prompt, pattern_type, archetype, company_id"
      });
    }

    const enhancedPrompt = await applyCompanyLearning(
      base_prompt,
      pattern_type,
      archetype,
      company_id
    );

    res.json({
      success: true,
      data: {
        original_prompt: base_prompt,
        enhanced_prompt: enhancedPrompt
      }
    });
  } catch (error) {
    console.error("Apply company learning error:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

module.exports = router;
