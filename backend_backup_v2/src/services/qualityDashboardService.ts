// Quality Dashboard Service
// Provides quality scoring and human override capabilities

const { StoryboardModule } = require("../types");
const { runAllQualityGates } = require("./qualityGatesService");
const { captureQualityOverride, getStoryboardQualityOverrides, getCompanyLearningProfile } = require("./feedbackCaptureService");

interface QualityDashboardData {
  storyboardId: string;
  overallScore: number;
  humanOverride?: number;
  gateResults: {
    loCoverage: { score: number; passed: boolean; issues: string[] };
    interactivityDensity: { score: number; passed: boolean; issues: string[] };
    characterConsistency: { score: number; passed: boolean; issues: string[] };
    narrativeFlow: { score: number; passed: boolean; issues: string[] };
    assessmentQuality: { score: number; passed: boolean; issues: string[] };
  };
  recommendations: string[];
  companyInsights?: {
    commonIssues: string[];
    preferredImprovements: string[];
    qualityTrends: any;
  };
}

/**
 * Generate comprehensive quality dashboard data
 */
async function generateQualityDashboard(
  storyboard: StoryboardModule,
  projectScope: any,
  learningObjectives: string[],
  companyId: string,
  userId: string
): Promise<QualityDashboardData> {
  const storyboardId = `temp_${Date.now()}`;
  
  // Run quality gates
  const qualityResults = await runAllQualityGates(
    storyboard,
    projectScope,
    learningObjectives,
    storyboardId
  );

  // Get human overrides if any
  const overrides = await getStoryboardQualityOverrides(storyboardId);
  const humanOverride = overrides.length > 0 ? 
    overrides.reduce((sum, override) => sum + override.human_score, 0) / overrides.length : 
    undefined;

  // Get company insights
  const companyInsights = await getCompanyInsights(companyId, qualityResults);

  return {
    storyboardId,
    overallScore: humanOverride || qualityResults.overallScore,
    humanOverride,
    gateResults: {
      loCoverage: {
        score: qualityResults.gateResults.loCoverage.score,
        passed: qualityResults.gateResults.loCoverage.passed,
        issues: qualityResults.gateResults.loCoverage.issues
      },
      interactivityDensity: {
        score: qualityResults.gateResults.interactivityDensity.score,
        passed: qualityResults.gateResults.interactivityDensity.passed,
        issues: qualityResults.gateResults.interactivityDensity.issues
      },
      characterConsistency: {
        score: qualityResults.gateResults.characterConsistency.score,
        passed: qualityResults.gateResults.characterConsistency.passed,
        issues: qualityResults.gateResults.characterConsistency.issues
      },
      narrativeFlow: {
        score: qualityResults.gateResults.narrativeFlow.score,
        passed: qualityResults.gateResults.narrativeFlow.passed,
        issues: qualityResults.gateResults.narrativeFlow.issues
      },
      assessmentQuality: {
        score: qualityResults.gateResults.assessmentQuality.overallScore,
        passed: qualityResults.gateResults.assessmentQuality.overallScore >= 75,
        issues: qualityResults.gateResults.assessmentQuality.issues
      }
    },
    recommendations: qualityResults.allRecommendations,
    companyInsights
  };
}

/**
 * Submit a human quality override
 */
async function submitQualityOverride(
  storyboardId: string,
  metricType: string,
  aiScore: number,
  humanScore: number,
  overrideReason: string,
  userId: string
): Promise<boolean> {
  try {
    const success = await captureQualityOverride({
      storyboard_id: storyboardId,
      metric_type: metricType,
      ai_score: aiScore,
      human_score: humanScore,
      override_reason: overrideReason,
      user_id: userId
    });

    if (success) {
      console.log(`[QUALITY DASHBOARD] Human override recorded: ${metricType} ${aiScore}% → ${humanScore}%`);
    }

    return success;
  } catch (error) {
    console.error('Error submitting quality override:', error);
    return false;
  }
}

/**
 * Get company-specific quality insights
 */
async function getCompanyInsights(
  companyId: string,
  qualityResults: any
): Promise<{
  commonIssues: string[];
  preferredImprovements: string[];
  qualityTrends: any;
} | undefined> {
  try {
    const companyProfile = await getCompanyLearningProfile(companyId);
    
    if (!companyProfile) {
      return undefined;
    }

    // Analyze common issues based on company feedback patterns
    const commonIssues: string[] = [];
    const preferredImprovements: string[] = [];

    // Check quality preferences
    if (companyProfile.quality_preferences) {
      Object.entries(companyProfile.quality_preferences).forEach(([impact, count]) => {
        if (impact === 'negative' && count > 10) {
          commonIssues.push('Frequent quality issues detected in previous projects');
        }
      });
    }

    // Check common edit patterns for improvement suggestions
    if (companyProfile.common_edit_patterns) {
      Object.entries(companyProfile.common_edit_patterns).forEach(([editType, count]) => {
        if (count > 5) {
          switch (editType) {
            case 'text_change':
              preferredImprovements.push('Focus on more natural, conversational language');
              break;
            case 'structure_change':
              preferredImprovements.push('Improve content structure and organization');
              break;
            case 'addition':
              preferredImprovements.push('Include more comprehensive content and details');
              break;
            case 'deletion':
              preferredImprovements.push('Reduce unnecessary or redundant content');
              break;
          }
        }
      });
    }

    return {
      commonIssues,
      preferredImprovements,
      qualityTrends: {
        totalFeedbackEvents: companyProfile.total_feedback_events,
        lastUpdated: companyProfile.last_updated
      }
    };
  } catch (error) {
    console.error('Error getting company insights:', error);
    return undefined;
  }
}

/**
 * Generate quality improvement suggestions
 */
function generateQualitySuggestions(
  dashboardData: QualityDashboardData
): string[] {
  const suggestions: string[] = [];

  // Analyze each quality gate
  Object.entries(dashboardData.gateResults).forEach(([gate, result]) => {
    if (!result.passed) {
      switch (gate) {
        case 'loCoverage':
          suggestions.push('Add more content that directly addresses the learning objectives');
          break;
        case 'interactivityDensity':
          if (result.score < 30) {
            suggestions.push('Increase interactive elements like knowledge checks and click-to-reveal content');
          } else if (result.score > 80) {
            suggestions.push('Consider reducing interactive elements to avoid overwhelming learners');
          }
          break;
        case 'characterConsistency':
          suggestions.push('Ensure character names and roles remain consistent throughout the storyboard');
          break;
        case 'narrativeFlow':
          suggestions.push('Improve scene transitions and overall story progression');
          break;
        case 'assessmentQuality':
          suggestions.push('Enhance knowledge checks with more realistic scenarios and better feedback');
          break;
      }
    }
  });

  // Add company-specific suggestions
  if (dashboardData.companyInsights?.preferredImprovements) {
    suggestions.push(...dashboardData.companyInsights.preferredImprovements);
  }

  return suggestions;
}

/**
 * Get quality trends for a company
 */
async function getQualityTrends(companyId: string): Promise<{
  averageScore: number;
  trendDirection: 'improving' | 'declining' | 'stable';
  commonIssues: string[];
  improvementAreas: string[];
}> {
  try {
    // This would typically query historical quality data
    // For now, return mock data based on company profile
    const companyProfile = await getCompanyLearningProfile(companyId);
    
    if (!companyProfile) {
      return {
        averageScore: 0,
        trendDirection: 'stable',
        commonIssues: [],
        improvementAreas: []
      };
    }

    // Calculate average score based on quality preferences
    const totalFeedback = companyProfile.total_feedback_events || 0;
    const positiveFeedback = companyProfile.quality_preferences?.positive || 0;
    const averageScore = totalFeedback > 0 ? (positiveFeedback / totalFeedback) * 100 : 0;

    // Determine trend (simplified logic)
    const trendDirection = averageScore > 70 ? 'improving' : 
                          averageScore < 50 ? 'declining' : 'stable';

    // Extract common issues and improvement areas
    const commonIssues: string[] = [];
    const improvementAreas: string[] = [];

    if (companyProfile.common_edit_patterns) {
      Object.entries(companyProfile.common_edit_patterns).forEach(([pattern, count]) => {
        if (count > 5) {
          commonIssues.push(`Frequent ${pattern} edits`);
          improvementAreas.push(`Improve ${pattern} quality`);
        }
      });
    }

    return {
      averageScore,
      trendDirection,
      commonIssues,
      improvementAreas
    };
  } catch (error) {
    console.error('Error getting quality trends:', error);
    return {
      averageScore: 0,
      trendDirection: 'stable',
      commonIssues: [],
      improvementAreas: []
    };
  }
}

module.exports = {
  generateQualityDashboard,
  submitQualityOverride,
  generateQualitySuggestions,
  getQualityTrends
};
