// Pedagogical Approach Matrix Service
// Defines the teaching DNA for each Module Type

// PEDAGOGICAL APPROACH MATRIX
export const PEDAGOGICAL_APPROACH: Record<string, {
  sequence: string[];
  interactions: string[];
  banned: string[];
  assessment_style: string;
  narrative_focus: string;
  learning_phase_map: Record<string, string[]>;
}> = {
  "Compliance & Ethics": {
    sequence: ["teach_rules", "real_world_scenarios", "rigorous_assessment"],
    interactions: ["branching_scenarios", "case_studies", "policy_application"],
    banned: ["gamification", "light_assessment", "roleplaying", "reflection_activities"],
    assessment_style: "Rigorous testing with clear right/wrong answers",
    narrative_focus: "Regulatory compliance and risk prevention",
    learning_phase_map: {
      teaching: ["click_reveal", "tabbed_content", "policy_breakdown"],
      practice: ["scenario_choices", "case_studies", "policy_application"],
      application: ["branching_scenarios", "emergency_simulations", "compliance_tests"],
      assessment: ["rigorous_quizzes", "policy_tests", "compliance_verification"]
    }
  },
  "Leadership & Coaching": {
    sequence: ["model_behaviors", "safe_roleplays", "workplace_application", "deep_reflection"],
    interactions: ["video_demonstrations", "interactive_roleplays", "reflection_journals"],
    banned: ["rigorous_testing", "policy_focus", "compliance_language", "incident_reporting"],
    assessment_style: "Scenario-based choices with emotional intelligence focus",
    narrative_focus: "Character development and interpersonal skills",
    learning_phase_map: {
      teaching: ["video_demos", "click_reveal", "behavioral_models"],
      practice: ["interactive_roleplays", "scenario_practice", "skill_drills"],
      application: ["workplace_scenarios", "branching_dilemmas", "real_world_application"],
      assessment: ["reflection_journals", "peer_feedback", "behavioral_assessments"]
    }
  },
  "Sales & Customer Service": {
    sequence: ["brief_frameworks", "objection_practice", "branching_scenarios", "performance_outcomes"],
    interactions: ["objection_handling", "customer_simulations", "performance_dashboards"],
    banned: ["theoretical_discussions", "abstract_concepts", "compliance_focus", "policy_heavy"],
    assessment_style: "Performance-based with real customer outcomes",
    narrative_focus: "Customer relationships and sales excellence",
    learning_phase_map: {
      teaching: ["framework_overviews", "best_practice_videos", "success_stories"],
      practice: ["objection_handling", "customer_simulations", "role_plays"],
      application: ["branching_scenarios", "performance_dashboards", "real_customer_cases"],
      assessment: ["performance_tests", "customer_satisfaction", "sales_metrics"]
    }
  },
  "Technical & Systems": {
    sequence: ["demonstrate_steps", "guided_simulations", "realistic_tasks", "accuracy_assessment"],
    interactions: ["software_simulations", "drag_drop_procedures", "accuracy_challenges"],
    banned: ["roleplaying", "reflection_activities", "emotional_focus", "character_development"],
    assessment_style: "Performance-based tasks and simulations",
    narrative_focus: "Technical proficiency and system mastery",
    learning_phase_map: {
      teaching: ["step_by_step_demos", "tutorial_videos", "feature_overviews"],
      practice: ["guided_simulations", "drag_drop_procedures", "interactive_tutorials"],
      application: ["realistic_tasks", "challenge_scenarios", "system_exploration"],
      assessment: ["accuracy_tests", "performance_simulations", "skill_verification"]
    }
  },
  "Health & Safety": {
    sequence: ["teach_standards", "hazard_spotting", "case_based_tests"],
    interactions: ["hazard_identification", "safety_scans", "emergency_simulations"],
    banned: ["theoretical_discussions", "optional_activities", "gamification", "light_assessment"],
    assessment_style: "Critical safety verification with zero tolerance",
    narrative_focus: "Safety awareness and risk prevention",
    learning_phase_map: {
      teaching: ["safety_standards", "hazard_education", "procedure_overviews"],
      practice: ["hazard_identification", "safety_scans", "emergency_drills"],
      application: ["case_based_tests", "emergency_simulations", "safety_scenarios"],
      assessment: ["safety_verification", "hazard_tests", "emergency_response"]
    }
  },
  "Onboarding & Culture": {
    sequence: ["introduce_values", "exploration_activities", "gamified_checks"],
    interactions: ["virtual_tours", "meet_the_team", "culture_quizzes", "exploration_games"],
    banned: ["rigorous_testing", "complex_simulations", "compliance_focus", "heavy_assessment"],
    assessment_style: "Engaging discovery with cultural integration",
    narrative_focus: "Learning and cultural integration",
    learning_phase_map: {
      teaching: ["company_values", "culture_introduction", "team_overviews"],
      practice: ["virtual_tours", "meet_the_team", "exploration_activities"],
      application: ["culture_quizzes", "exploration_games", "team_interactions"],
      assessment: ["cultural_fit", "engagement_checks", "integration_verification"]
    }
  },
  "Product Knowledge": {
    sequence: ["teach_features", "matching_practice", "customer_conversations"],
    interactions: ["feature_matching", "customer_roleplays", "product_demos"],
    banned: ["theoretical_frameworks", "abstract_discussions", "compliance_focus", "heavy_assessment"],
    assessment_style: "Practical application with customer success",
    narrative_focus: "Product mastery and customer value",
    learning_phase_map: {
      teaching: ["feature_overviews", "product_demos", "benefit_explanations"],
      practice: ["feature_matching", "product_exploration", "interactive_tours"],
      application: ["customer_roleplays", "sales_scenarios", "product_showcases"],
      assessment: ["product_quizzes", "customer_simulations", "sales_readiness"]
    }
  },
  "Professional Skills": {
    sequence: ["teach_models", "interactive_exercises", "workplace_scenarios", "growth_reflection"],
    interactions: ["skill_drills", "scenario_practice", "progress_tracking"],
    banned: ["rigorous_testing", "policy_focus", "compliance_language", "heavy_assessment"],
    assessment_style: "Skill development with growth tracking",
    narrative_focus: "Professional growth and skill mastery",
    learning_phase_map: {
      teaching: ["skill_models", "best_practices", "expert_insights"],
      practice: ["skill_drills", "interactive_exercises", "guided_practice"],
      application: ["workplace_scenarios", "real_world_application", "challenge_tasks"],
      assessment: ["progress_tracking", "skill_assessments", "growth_reflection"]
    }
  }
};

// INTERACTION VARIETY ENGINE
export const INTERACTION_VARIETY = {
  rule_1: "Each scene cluster must use DIFFERENT interaction types",
  rule_2: "Mix these interaction types strategically:",
  
  cognitive: ["click_reveal", "tabbed_content", "timeline", "sorting"],
  practical: ["drag_drop", "matching", "simulations", "branching"],
  social: ["roleplays", "discussion_prompts", "peer_feedback"],
  reflective: ["journals", "self_assessments", "progress_tracking"],
  
  rule_3: "Never use the same interaction type twice in a row",
  rule_4: "Match interaction to learning phase:",
  
  teaching_phase: ["click_reveal", "tabbed_content", "video_demos"],
  practice_phase: ["drag_drop", "matching", "simulations"], 
  application_phase: ["branching_scenarios", "roleplays", "real_tasks"],
  assessment_phase: ["quizzes", "performance_tests", "case_studies"]
};

/**
 * Gets the pedagogical approach for a Module Type
 */
export function getPedagogicalApproach(moduleType: string) {
  return PEDAGOGICAL_APPROACH[moduleType] || PEDAGOGICAL_APPROACH["Professional Skills"];
}

/**
 * Gets the required sequence for a Module Type
 */
export function getRequiredSequence(moduleType: string): string[] {
  const approach = getPedagogicalApproach(moduleType);
  return approach.sequence;
}

/**
 * Gets allowed interactions for a Module Type
 */
export function getAllowedInteractions(moduleType: string): string[] {
  const approach = getPedagogicalApproach(moduleType);
  return approach.interactions;
}

/**
 * Gets banned interactions for a Module Type
 */
export function getBannedInteractions(moduleType: string): string[] {
  const approach = getPedagogicalApproach(moduleType);
  return approach.banned;
}

/**
 * Gets interactions for a specific learning phase
 */
export function getInteractionsForPhase(moduleType: string, phase: string): string[] {
  const approach = getPedagogicalApproach(moduleType);
  return approach.learning_phase_map[phase] || [];
}

/**
 * Validates scene against pedagogical approach
 */
export function validatePedagogicalCompliance(
  scene: any,
  moduleType: string,
  sceneIndex: number
): {
  compliant: boolean;
  violations: string[];
  recommendations: string[];
  interaction_variety_score: number;
} {
  const approach = getPedagogicalApproach(moduleType);
  const violations: string[] = [];
  const recommendations: string[] = [];
  
  // Check interaction type compliance
  if (scene.interactionType) {
    const interactionType = scene.interactionType.toLowerCase();
    
    // Check if interaction is banned
    const isBanned = approach.banned.some(banned => 
      interactionType.includes(banned.toLowerCase())
    );
    
    if (isBanned) {
      violations.push(`Banned interaction type "${scene.interactionType}" for ${moduleType}`);
      recommendations.push(`Use allowed interactions: ${approach.interactions.join(", ")}`);
    }
    
    // Check if interaction is allowed
    const isAllowed = approach.interactions.some(allowed => 
      interactionType.includes(allowed.toLowerCase())
    );
    
    if (!isAllowed && !isBanned) {
      violations.push(`Interaction type "${scene.interactionType}" not recommended for ${moduleType}`);
      recommendations.push(`Consider using: ${approach.interactions.join(", ")}`);
    }
  }
  
  // Check sequence compliance
  const requiredSequence = approach.sequence;
  const currentPhase = determineLearningPhase(sceneIndex, requiredSequence.length);
  const expectedInteractions = getInteractionsForPhase(moduleType, currentPhase);
  
  if (scene.interactionType && expectedInteractions.length > 0) {
    const interactionMatches = expectedInteractions.some(expected => 
      scene.interactionType.toLowerCase().includes(expected.toLowerCase())
    );
    
    if (!interactionMatches) {
      violations.push(`Interaction "${scene.interactionType}" doesn't match expected phase "${currentPhase}"`);
      recommendations.push(`Expected interactions for ${currentPhase}: ${expectedInteractions.join(", ")}`);
    }
  }
  
  // Calculate interaction variety score
  const varietyScore = calculateInteractionVarietyScore(scene, moduleType);
  
  return {
    compliant: violations.length === 0,
    violations,
    recommendations,
    interaction_variety_score: varietyScore
  };
}

/**
 * Determines the learning phase based on scene index
 */
function determineLearningPhase(sceneIndex: number, totalPhases: number): string {
  const phaseIndex = Math.floor((sceneIndex / 36) * totalPhases);
  const phases = ["teaching", "practice", "application", "assessment"];
  return phases[Math.min(phaseIndex, phases.length - 1)];
}

/**
 * Calculates interaction variety score
 */
function calculateInteractionVarietyScore(scene: any, moduleType: string): number {
  // This would be implemented to track variety across scenes
  // For now, return a base score
  return 0.8;
}

/**
 * Generates pedagogical guidance for scene generation
 */
export function generatePedagogicalGuidance(moduleType: string, sceneIndex: number): string {
  const approach = getPedagogicalApproach(moduleType);
  const currentPhase = determineLearningPhase(sceneIndex, approach.sequence.length);
  const expectedInteractions = getInteractionsForPhase(moduleType, currentPhase);
  
  return `
PEDAGOGICAL APPROACH GUIDANCE FOR ${moduleType.toUpperCase()}:
- Required Sequence: ${approach.sequence.join(" → ")}
- Current Phase: ${currentPhase}
- Expected Interactions: ${expectedInteractions.join(", ")}
- Assessment Style: ${approach.assessment_style}
- Narrative Focus: ${approach.narrative_focus}

BANNED INTERACTIONS: ${approach.banned.join(", ")}
ALLOWED INTERACTIONS: ${approach.interactions.join(", ")}

CRITICAL: This scene must follow the ${approach.sequence.join(" → ")} sequence and use appropriate ${currentPhase} interactions.
  `.trim();
}

/**
 * Enforces pedagogical rules in scene generation
 */
export function enforcePedagogicalRules(
  scene: any,
  moduleType: string,
  sceneIndex: number
): {
  scene: any;
  violations: string[];
  fixed: boolean;
} {
  const validation = validatePedagogicalCompliance(scene, moduleType, sceneIndex);
  let updatedScene = { ...scene };
  let fixed = false;
  
  // Auto-fix: Replace banned interactions with appropriate ones
  if (scene.interactionType && validation.violations.length > 0) {
    const approach = getPedagogicalApproach(moduleType);
    const currentPhase = determineLearningPhase(sceneIndex, approach.sequence.length);
    const expectedInteractions = getInteractionsForPhase(moduleType, currentPhase);
    
    if (expectedInteractions.length > 0) {
      updatedScene.interactionType = expectedInteractions[0];
      fixed = true;
    }
  }
  
  return {
    scene: updatedScene,
    violations: validation.violations,
    fixed
  };
}

export {
  PEDAGOGICAL_APPROACH,
  INTERACTION_VARIETY
};












