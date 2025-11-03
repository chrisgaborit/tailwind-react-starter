// Quality Gates Service
// Validates storyboard quality against learning objectives and interactivity requirements

import { StoryboardModule, Scene } from "../types";
import { ProjectScope } from "./openaiService";
import { recordQualityMetric } from "./patternLibraryService";
import { validatePedagogicalCompliance, getPedagogicalApproach } from "./pedagogicalMatrixService";

// HARD-CODED PEDAGOGICAL SEQUENCE RULES
const REQUIRED_PEDAGOGICAL_FLOW = [
  "HOOK: Real problem/scenario",
  "TEACH: One core concept", 
  "DEMONSTRATE: Worked example",
  "PRACTICE: Guided application",
  "ASSESS: Knowledge check",
  "APPLY: Real-world scenario"
];

// ARCHETYPE PURITY RULES
const SOFT_SKILLS_RULES = {
  BANNED_TERMS: [
    "compliance", "incident", "breach", "violation", 
    "non-compliance", "critical incident", "escalation pathway",
    "policy violation", "regulatory", "audit", "investigation"
  ],
  REQUIRED_ELEMENTS: [
    "character development", "progressive skill building",
    "emotional intelligence", "relationship building",
    "coaching", "mentoring", "communication"
  ],
  ASSESSMENT_STYLE: "scenario-based choices with emotional intelligence"
};

const COMPLIANCE_RULES = {
  REQUIRED_ELEMENTS: [
    "policy reference", "clear consequences", "reporting procedures",
    "regulatory framework", "legal requirements"
  ],
  ASSESSMENT_STYLE: "policy application with clear right/wrong answers"
};

// CONTENT DUPLICATION RULES
const DUPLICATION_RULES = {
  MAX_INTRODUCTIONS: 1,
  MAX_CONCEPT_REPETITION: 1,
  SCENE_UNIQUENESS: "Each scene must teach NEW content",
  PROGRESSION_REQUIRED: "Each 'Part 2' must build on 'Part 1'"
};

// COGNITIVE LOAD MANAGEMENT
const COGNITIVE_LOAD_RULES = {
  MAX_NEW_CONCEPTS_PER_SCENE: 2,
  MAX_SCENES_BEFORE_ASSESSMENT: 4,
  REQUIRED_PRACTICE_BETWEEN_CONCEPTS: true,
  ASSESSMENT_IMMEDIATELY_AFTER_TEACHING: true
};

export interface QualityGateResult {
  passed: boolean;
  score: number; // 0-100
  issues: string[];
  recommendations: string[];
  details: any;
}

// CRITICAL PEDAGOGICAL VALIDATION FUNCTIONS

/**
 * Validates pedagogical sequence - CRITICAL RULE
 */
export function validatePedagogicalSequence(scenes: Scene[]): QualityGateResult {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  // Count introduction scenes
  const introScenes = scenes.filter(scene => 
    scene.title?.toLowerCase().includes('introduction') ||
    scene.title?.toLowerCase().includes('welcome') ||
    scene.title?.toLowerCase().includes('overview') ||
    scene.title?.toLowerCase().includes('getting started')
  );
  
  if (introScenes.length > DUPLICATION_RULES.MAX_INTRODUCTIONS) {
    issues.push(`❌ CRITICAL: Found ${introScenes.length} introduction scenes. Maximum allowed: ${DUPLICATION_RULES.MAX_INTRODUCTIONS}`);
    recommendations.push("Remove duplicate introduction scenes. Keep only the first one.");
  }
  
  // Check for assessment before teaching
  let teachingFound = false;
  let assessmentFound = false;
  let teachingIndex = -1;
  let assessmentIndex = -1;
  
  scenes.forEach((scene, index) => {
    const title = scene.title?.toLowerCase() || '';
    const content = scene.narrationScript?.toLowerCase() || '';
    
    if (title.includes('teach') || title.includes('learn') || content.includes('teach') || content.includes('learn')) {
      teachingFound = true;
      teachingIndex = index;
    }
    
    if (title.includes('assessment') || title.includes('quiz') || title.includes('test') || 
        content.includes('assessment') || content.includes('quiz') || content.includes('test')) {
      assessmentFound = true;
      assessmentIndex = index;
    }
  });
  
  if (assessmentFound && teachingFound && assessmentIndex < teachingIndex) {
    issues.push("❌ CRITICAL: Assessment found before teaching content. This violates pedagogical sequence.");
    recommendations.push("Move assessment scenes to after teaching content. Follow: Teach → Demo → Practice → Assess");
  }
  
  // Check for concept repetition
  const conceptCounts: { [key: string]: number } = {};
  scenes.forEach(scene => {
    const content = (scene.narrationScript || '').toLowerCase();
    const title = (scene.title || '').toLowerCase();
    
    // Extract key concepts (simplified)
    const concepts = content.match(/\b(coaching|mentoring|communication|leadership|teamwork|feedback)\b/g) || [];
    concepts.forEach(concept => {
      conceptCounts[concept] = (conceptCounts[concept] || 0) + 1;
    });
  });
  
  Object.entries(conceptCounts).forEach(([concept, count]) => {
    if (count > DUPLICATION_RULES.MAX_CONCEPT_REPETITION + 1) {
      issues.push(`❌ CRITICAL: Concept "${concept}" repeated ${count} times. Maximum allowed: ${DUPLICATION_RULES.MAX_CONCEPT_REPETITION + 1}`);
      recommendations.push(`Consolidate repeated explanations of "${concept}". Each concept should be taught once with progressive depth.`);
    }
  });
  
  const passed = issues.length === 0;
  const score = passed ? 100 : Math.max(0, 100 - (issues.length * 20));
  
  return {
    passed,
    score,
    issues,
    recommendations,
    details: {
      introScenes: introScenes.length,
      teachingIndex,
      assessmentIndex,
      conceptCounts
    }
  };
}

/**
 * Validates archetype purity - CRITICAL RULE
 */
export function validateArchetypePurity(scenes: Scene[], archetype: string): QualityGateResult {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  if (archetype.toLowerCase().includes('soft') || archetype.toLowerCase().includes('coaching')) {
    // Soft skills course - check for compliance contamination
    scenes.forEach((scene, index) => {
      const content = (scene.narrationScript || '').toLowerCase();
      const title = (scene.title || '').toLowerCase();
      const fullText = `${title} ${content}`;
      
      SOFT_SKILLS_RULES.BANNED_TERMS.forEach(term => {
        if (fullText.includes(term)) {
          issues.push(`❌ CRITICAL: Scene ${index + 1} contains banned compliance term "${term}" in soft skills course`);
          recommendations.push(`Replace compliance language with soft skills terminology. Focus on coaching, mentoring, and relationship building.`);
        }
      });
    });
    
    // Check for required soft skills elements
    const allContent = scenes.map(s => `${s.title || ''} ${s.narrationScript || ''}`).join(' ').toLowerCase();
    SOFT_SKILLS_RULES.REQUIRED_ELEMENTS.forEach(element => {
      if (!allContent.includes(element.replace(' ', ''))) {
        issues.push(`❌ CRITICAL: Missing required soft skills element: "${element}"`);
        recommendations.push(`Add content about ${element} to strengthen the soft skills focus.`);
      }
    });
  } else if (archetype.toLowerCase().includes('compliance')) {
    // Compliance course - check for required elements
    const allContent = scenes.map(s => `${s.title || ''} ${s.narrationScript || ''}`).join(' ').toLowerCase();
    COMPLIANCE_RULES.REQUIRED_ELEMENTS.forEach(element => {
      if (!allContent.includes(element.replace(' ', ''))) {
        issues.push(`❌ CRITICAL: Missing required compliance element: "${element}"`);
        recommendations.push(`Add content about ${element} to meet compliance requirements.`);
      }
    });
  }
  
  const passed = issues.length === 0;
  const score = passed ? 100 : Math.max(0, 100 - (issues.length * 15));
  
  return {
    passed,
    score,
    issues,
    recommendations,
    details: { archetype }
  };
}

/**
 * Validates cognitive load management - CRITICAL RULE
 */
export function validateCognitiveLoad(scenes: Scene[]): QualityGateResult {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  scenes.forEach((scene, index) => {
    const content = scene.narrationScript || '';
    const title = scene.title || '';
    
    // Count new concepts in this scene
    const conceptKeywords = ['coaching', 'mentoring', 'communication', 'leadership', 'teamwork', 'feedback', 'policy', 'procedure', 'regulation'];
    const conceptsInScene = conceptKeywords.filter(keyword => 
      content.toLowerCase().includes(keyword) || title.toLowerCase().includes(keyword)
    );
    
    if (conceptsInScene.length > COGNITIVE_LOAD_RULES.MAX_NEW_CONCEPTS_PER_SCENE) {
      issues.push(`❌ CRITICAL: Scene ${index + 1} introduces ${conceptsInScene.length} concepts. Maximum allowed: ${COGNITIVE_LOAD_RULES.MAX_NEW_CONCEPTS_PER_SCENE}`);
      recommendations.push(`Split complex scenes. Focus on 1-2 concepts per scene for better learning retention.`);
    }
  });
  
  // Check for assessment placement
  let lastTeachingIndex = -1;
  let firstAssessmentIndex = -1;
  
  scenes.forEach((scene, index) => {
    const title = scene.title?.toLowerCase() || '';
    const content = scene.narrationScript?.toLowerCase() || '';
    
    if (title.includes('teach') || title.includes('learn') || content.includes('teach') || content.includes('learn')) {
      lastTeachingIndex = index;
    }
    
    if ((title.includes('assessment') || title.includes('quiz') || title.includes('test')) && firstAssessmentIndex === -1) {
      firstAssessmentIndex = index;
    }
  });
  
  if (lastTeachingIndex !== -1 && firstAssessmentIndex !== -1) {
    const scenesBetween = firstAssessmentIndex - lastTeachingIndex - 1;
    if (scenesBetween > COGNITIVE_LOAD_RULES.MAX_SCENES_BEFORE_ASSESSMENT) {
      issues.push(`❌ CRITICAL: ${scenesBetween} scenes between teaching and assessment. Maximum allowed: ${COGNITIVE_LOAD_RULES.MAX_SCENES_BEFORE_ASSESSMENT}`);
      recommendations.push("Move assessment closer to teaching content for better knowledge retention.");
    }
  }
  
  const passed = issues.length === 0;
  const score = passed ? 100 : Math.max(0, 100 - (issues.length * 15));
  
  return {
    passed,
    score,
    issues,
    recommendations,
    details: {
      maxConceptsPerScene: COGNITIVE_LOAD_RULES.MAX_NEW_CONCEPTS_PER_SCENE,
      scenesBetweenTeachingAndAssessment: lastTeachingIndex !== -1 && firstAssessmentIndex !== -1 ? firstAssessmentIndex - lastTeachingIndex - 1 : 'N/A'
    }
  };
}

/**
 * Validates character continuity - CRITICAL RULE
 */
export function validateCharacterContinuity(scenes: Scene[]): QualityGateResult {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  // Extract character names from all scenes
  const characterNames = new Set<string>();
  const characterAppearances: { [key: string]: number[] } = {};
  
  scenes.forEach((scene, index) => {
    const content = (scene.narrationScript || '').toLowerCase();
    const title = (scene.title || '').toLowerCase();
    const fullText = `${title} ${content}`;
    
    // Look for character names (simplified pattern)
    const nameMatches = fullText.match(/\b(alex|sam|maria|john|sarah|mike|lisa|david|emma|chris)\b/g);
    if (nameMatches) {
      nameMatches.forEach(name => {
        const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
        characterNames.add(capitalizedName);
        if (!characterAppearances[capitalizedName]) {
          characterAppearances[capitalizedName] = [];
        }
        characterAppearances[capitalizedName].push(index + 1);
      });
    }
  });
  
  // Check for character consistency
  if (characterNames.size === 0) {
    issues.push("❌ CRITICAL: No character names found in storyboard");
    recommendations.push("Add consistent character names throughout the storyboard for better engagement.");
  } else if (characterNames.size > 4) {
    issues.push(`❌ CRITICAL: Too many characters (${characterNames.size}). Maximum recommended: 4`);
    recommendations.push("Reduce character count to 2-4 main characters for better focus and consistency.");
  }
  
  // Check for character progression
  Object.entries(characterAppearances).forEach(([character, appearances]) => {
    if (appearances.length === 1) {
      issues.push(`❌ CRITICAL: Character "${character}" appears only once. Characters should have continuity.`);
      recommendations.push(`Develop character "${character}" across multiple scenes for better narrative flow.`);
    }
  });
  
  const passed = issues.length === 0;
  const score = passed ? 100 : Math.max(0, 100 - (issues.length * 10));
  
  return {
    passed,
    score,
    issues,
    recommendations,
    details: {
      characterCount: characterNames.size,
      characterAppearances
    }
  };
}

// Phase 3: Enhanced quality checks
export interface AssessmentQualityResult {
  distractorPlausibility: number; // 0-100
  scenarioRealism: number; // 0-100
  toneAlignment: number; // 0-100
  overallScore: number; // 0-100
  issues: string[];
  recommendations: string[];
}

/**
 * Check if all learning objectives are covered in the storyboard
 */
export async function checkLearningObjectiveCoverage(
  storyboard: StoryboardModule,
  learningObjectives: string[],
  storyboardId: string
): Promise<QualityGateResult> {
  if (!learningObjectives || learningObjectives.length === 0) {
    return {
      passed: true,
      score: 100,
      issues: [],
      recommendations: [],
      details: { message: "No learning objectives to check" }
    };
  }

  const allText = storyboard.scenes
    .map(scene => [
      scene.narrationScript || "",
      scene.onScreenText?.title || "",
      ...(scene.onScreenText?.body_text || []),
      ...(scene.onScreenText?.bullet_points || []),
      scene.developerNotes || ""
    ].join(" "))
    .join(" ")
    .toLowerCase();

  const coveredObjectives: string[] = [];
  const uncoveredObjectives: string[] = [];

  learningObjectives.forEach(objective => {
    const objectiveWords = objective.toLowerCase().split(/\s+/);
    const hasCoverage = objectiveWords.some(word => 
      word.length > 3 && allText.includes(word)
    );
    
    if (hasCoverage) {
      coveredObjectives.push(objective);
    } else {
      uncoveredObjectives.push(objective);
    }
  });

  const coveragePercentage = (coveredObjectives.length / learningObjectives.length) * 100;
  const passed = coveragePercentage >= 80; // Require 80% coverage

  const issues = uncoveredObjectives.map(obj => `Learning objective not covered: "${obj}"`);
  const recommendations = uncoveredObjectives.map(obj => 
    `Add content that addresses: "${obj}"`
  );

  // Record the metric
  await recordQualityMetric(
    storyboardId,
    'lo_coverage',
    coveragePercentage,
    80,
    passed,
    {
      total_objectives: learningObjectives.length,
      covered_objectives: coveredObjectives.length,
      uncovered_objectives: uncoveredObjectives
    }
  );

  return {
    passed,
    score: coveragePercentage,
    issues,
    recommendations,
    details: {
      total_objectives: learningObjectives.length,
      covered_objectives: coveredObjectives.length,
      uncovered_objectives: uncoveredObjectives
    }
  };
}

/**
 * Check interactivity density matches the expected level
 */
export async function checkInteractivityDensity(
  storyboard: StoryboardModule,
  expectedDensity: 'low' | 'medium' | 'high',
  storyboardId: string
): Promise<QualityGateResult> {
  const totalScenes = storyboard.scenes.length;
  const interactiveScenes = storyboard.scenes.filter(scene => 
    scene.knowledgeCheck?.type !== null ||
    scene.interactionDetails ||
    scene.onScreenText?.bullet_points?.length > 0 ||
    scene.developerNotes?.toLowerCase().includes('interactive') ||
    scene.developerNotes?.toLowerCase().includes('click') ||
    scene.developerNotes?.toLowerCase().includes('select')
  ).length;

  const interactivityPercentage = (interactiveScenes / totalScenes) * 100;

  // Define density thresholds
  const thresholds = {
    low: { min: 0, max: 30 },
    medium: { min: 30, max: 70 },
    high: { min: 70, max: 100 }
  };

  const threshold = thresholds[expectedDensity];
  const passed = interactivityPercentage >= threshold.min && interactivityPercentage <= threshold.max;

  const issues: string[] = [];
  const recommendations: string[] = [];

  if (interactivityPercentage < threshold.min) {
    issues.push(`Interactivity density too low: ${interactivityPercentage.toFixed(1)}% (expected ${expectedDensity})`);
    recommendations.push(`Add more interactive elements like knowledge checks, click-to-reveal content, or decision points`);
  } else if (interactivityPercentage > threshold.max) {
    issues.push(`Interactivity density too high: ${interactivityPercentage.toFixed(1)}% (expected ${expectedDensity})`);
    recommendations.push(`Reduce interactive elements to match ${expectedDensity} density level`);
  }

  // Record the metric
  await recordQualityMetric(
    storyboardId,
    'interactivity_density',
    interactivityPercentage,
    threshold.min,
    passed,
    {
      expected_density: expectedDensity,
      interactive_scenes: interactiveScenes,
      total_scenes: totalScenes
    }
  );

  return {
    passed,
    score: interactivityPercentage,
    issues,
    recommendations,
    details: {
      expected_density: expectedDensity,
      interactive_scenes: interactiveScenes,
      total_scenes: totalScenes
    }
  };
}

/**
 * Check character consistency across scenes
 */
export async function checkCharacterConsistency(
  storyboard: StoryboardModule,
  projectScope: ProjectScope,
  storyboardId: string
): Promise<QualityGateResult> {
  const primaryCharacter = projectScope.characterProfiles.primary;
  const secondaryCharacters = projectScope.characterProfiles.secondary;

  const allCharacterNames = [primaryCharacter.name, ...secondaryCharacters.map(c => c.name)];
  
  let characterMentions = 0;
  let consistentMentions = 0;

  storyboard.scenes.forEach(scene => {
    const sceneText = [
      scene.narrationScript || "",
      scene.onScreenText?.title || "",
      ...(scene.onScreenText?.body_text || []),
      ...(scene.onScreenText?.bullet_points || []),
      scene.developerNotes || ""
    ].join(" ").toLowerCase();

    allCharacterNames.forEach(name => {
      if (sceneText.includes(name.toLowerCase())) {
        characterMentions++;
        // Check if character is mentioned with correct role
        const role = primaryCharacter.name === name ? primaryCharacter.role : 
                    secondaryCharacters.find(c => c.name === name)?.role;
        if (role && sceneText.includes(role.toLowerCase())) {
          consistentMentions++;
        }
      }
    });
  });

  const consistencyPercentage = characterMentions > 0 ? (consistentMentions / characterMentions) * 100 : 100;
  const passed = consistencyPercentage >= 70; // Require 70% consistency

  const issues: string[] = [];
  const recommendations: string[] = [];

  if (consistencyPercentage < 70) {
    issues.push(`Character consistency low: ${consistencyPercentage.toFixed(1)}%`);
    recommendations.push(`Ensure characters are mentioned with their correct roles consistently`);
  }

  // Record the metric
  await recordQualityMetric(
    storyboardId,
    'character_consistency',
    consistencyPercentage,
    70,
    passed,
    {
      character_mentions: characterMentions,
      consistent_mentions: consistentMentions,
      primary_character: primaryCharacter.name,
      secondary_characters: secondaryCharacters.map(c => c.name)
    }
  );

  return {
    passed,
    score: consistencyPercentage,
    issues,
    recommendations,
    details: {
      character_mentions: characterMentions,
      consistent_mentions: consistentMentions,
      primary_character: primaryCharacter.name,
      secondary_characters: secondaryCharacters.map(c => c.name)
    }
  };
}

/**
 * Check narrative flow and story progression
 */
export async function checkNarrativeFlow(
  storyboard: StoryboardModule,
  projectScope: ProjectScope,
  storyboardId: string
): Promise<QualityGateResult> {
  const scenes = storyboard.scenes;
  let flowScore = 0;
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Check for logical progression
  const hasIntro = scenes[0]?.narrationScript?.toLowerCase().includes('welcome') ||
                   scenes[0]?.narrationScript?.toLowerCase().includes('introduction') ||
                   scenes[0]?.onScreenText?.title?.toLowerCase().includes('intro');
  
  const hasConclusion = scenes[scenes.length - 1]?.narrationScript?.toLowerCase().includes('conclusion') ||
                        scenes[scenes.length - 1]?.narrationScript?.toLowerCase().includes('summary') ||
                        scenes[scenes.length - 1]?.onScreenText?.title?.toLowerCase().includes('conclusion');

  if (hasIntro) flowScore += 25;
  else {
    issues.push("Missing clear introduction");
    recommendations.push("Add an introductory scene that welcomes learners and sets expectations");
  }

  if (hasConclusion) flowScore += 25;
  else {
    issues.push("Missing clear conclusion");
    recommendations.push("Add a concluding scene that summarizes key points");
  }

  // Check for concept progression
  const coreConcepts = projectScope.narrativeStructure.coreConcepts;
  let conceptsCovered = 0;
  
  coreConcepts.forEach(concept => {
    const conceptWords = concept.toLowerCase().split(/\s+/);
    const hasConcept = scenes.some(scene => {
      const sceneText = [
        scene.narrationScript || "",
        scene.onScreenText?.title || "",
        ...(scene.onScreenText?.body_text || []),
        ...(scene.onScreenText?.bullet_points || [])
      ].join(" ").toLowerCase();
      
      return conceptWords.some(word => word.length > 3 && sceneText.includes(word));
    });
    
    if (hasConcept) conceptsCovered++;
  });

  const conceptCoverage = (conceptsCovered / coreConcepts.length) * 25;
  flowScore += conceptCoverage;

  if (conceptCoverage < 20) {
    issues.push("Core concepts not well integrated");
    recommendations.push("Ensure all core concepts are addressed in the narrative flow");
  }

  // Check for scene transitions
  let smoothTransitions = 0;
  for (let i = 1; i < scenes.length; i++) {
    const prevScene = scenes[i - 1];
    const currentScene = scenes[i];
    
    const hasTransition = currentScene.narrationScript?.toLowerCase().includes('now') ||
                         currentScene.narrationScript?.toLowerCase().includes('next') ||
                         currentScene.narrationScript?.toLowerCase().includes('let\'s') ||
                         currentScene.onScreenText?.title?.toLowerCase().includes('step');
    
    if (hasTransition) smoothTransitions++;
  }

  const transitionScore = (smoothTransitions / (scenes.length - 1)) * 25;
  flowScore += transitionScore;

  if (transitionScore < 15) {
    issues.push("Scene transitions could be smoother");
    recommendations.push("Add transition phrases between scenes for better flow");
  }

  const passed = flowScore >= 70;

  // Record the metric
  await recordQualityMetric(
    storyboardId,
    'narrative_flow',
    flowScore,
    70,
    passed,
    {
      has_intro: hasIntro,
      has_conclusion: hasConclusion,
      concepts_covered: conceptsCovered,
      total_concepts: coreConcepts.length,
      smooth_transitions: smoothTransitions,
      total_transitions: scenes.length - 1
    }
  );

  return {
    passed,
    score: flowScore,
    issues,
    recommendations,
    details: {
      has_intro: hasIntro,
      has_conclusion: hasConclusion,
      concepts_covered: conceptsCovered,
      total_concepts: coreConcepts.length,
      smooth_transitions: smoothTransitions,
      total_transitions: scenes.length - 1
    }
  };
}

/**
 * Check assessment quality (Phase 3 enhancement)
 */
export async function checkAssessmentQuality(
  storyboard: StoryboardModule,
  storyboardId: string
): Promise<AssessmentQualityResult> {
  const assessmentScenes = storyboard.scenes.filter(scene => 
    scene.knowledgeCheck?.type && scene.knowledgeCheck.type !== 'null'
  );

  if (assessmentScenes.length === 0) {
    return {
      distractorPlausibility: 100,
      scenarioRealism: 100,
      toneAlignment: 100,
      overallScore: 100,
      issues: [],
      recommendations: []
    };
  }

  let totalDistractorScore = 0;
  let totalRealismScore = 0;
  let totalToneScore = 0;
  const issues: string[] = [];
  const recommendations: string[] = [];

  assessmentScenes.forEach((scene, index) => {
    const kc = scene.knowledgeCheck;
    if (!kc || !kc.options) return;

    // Check distractor plausibility
    const correctOptions = kc.options.filter(opt => opt.is_correct);
    const incorrectOptions = kc.options.filter(opt => !opt.is_correct);
    
    let distractorScore = 0;
    if (incorrectOptions.length > 0) {
      // Check if incorrect options are plausible but clearly wrong
      const plausibleDistractors = incorrectOptions.filter(opt => 
        opt.text.length > 10 && // Not too short
        !opt.text.toLowerCase().includes('obviously') && // Not obviously wrong
        !opt.text.toLowerCase().includes('never') && // Not absolute statements
        opt.feedback?.incorrect && opt.feedback.incorrect.length > 20 // Has detailed feedback
      );
      distractorScore = (plausibleDistractors.length / incorrectOptions.length) * 100;
    }
    totalDistractorScore += distractorScore;

    if (distractorScore < 70) {
      issues.push(`Assessment ${index + 1}: Distractors may be too obvious or unrealistic`);
      recommendations.push(`Make incorrect options more plausible but clearly distinguishable from correct answers`);
    }

    // Check scenario realism
    const stem = kc.stem || '';
    const hasRealisticContext = stem.includes('at') || stem.includes('during') || stem.includes('while');
    const hasSpecificDetails = stem.length > 50;
    const hasCharacterContext = stem.includes('character') || stem.includes('situation');
    
    const realismScore = (hasRealisticContext ? 25 : 0) + (hasSpecificDetails ? 25 : 0) + (hasCharacterContext ? 50 : 0);
    totalRealismScore += realismScore;

    if (realismScore < 70) {
      issues.push(`Assessment ${index + 1}: Scenario lacks realistic context or specific details`);
      recommendations.push(`Add more specific workplace context and character details to scenarios`);
    }

    // Check tone alignment
    const questionText = kc.instruction || '';
    const isProfessional = !questionText.toLowerCase().includes('obviously') && 
                          !questionText.toLowerCase().includes('duh') &&
                          questionText.length > 10;
    const isClear = questionText.includes('?') || questionText.includes('select') || questionText.includes('choose');
    
    const toneScore = (isProfessional ? 50 : 0) + (isClear ? 50 : 0);
    totalToneScore += toneScore;

    if (toneScore < 80) {
      issues.push(`Assessment ${index + 1}: Tone may be unprofessional or unclear`);
      recommendations.push(`Ensure questions are professional, clear, and well-structured`);
    }
  });

  const avgDistractorScore = totalDistractorScore / assessmentScenes.length;
  const avgRealismScore = totalRealismScore / assessmentScenes.length;
  const avgToneScore = totalToneScore / assessmentScenes.length;
  const overallScore = (avgDistractorScore + avgRealismScore + avgToneScore) / 3;

  // Record the metric
  await recordQualityMetric(
    storyboardId,
    'assessment_quality',
    overallScore,
    75,
    overallScore >= 75,
    {
      distractor_plausibility: avgDistractorScore,
      scenario_realism: avgRealismScore,
      tone_alignment: avgToneScore,
      total_assessments: assessmentScenes.length
    }
  );

  return {
    distractorPlausibility: avgDistractorScore,
    scenarioRealism: avgRealismScore,
    toneAlignment: avgToneScore,
    overallScore: overallScore,
    issues,
    recommendations
  };
}

/**
 * Run all quality gates and return comprehensive results
 */
export async function runAllQualityGates(
  storyboard: StoryboardModule,
  projectScope: ProjectScope,
  learningObjectives: string[],
  storyboardId: string
): Promise<{
  overallPassed: boolean;
  overallScore: number;
  gateResults: {
    loCoverage: QualityGateResult;
    interactivityDensity: QualityGateResult;
    characterConsistency: QualityGateResult;
    narrativeFlow: QualityGateResult;
    assessmentQuality: AssessmentQualityResult; // Phase 3 addition
    // CRITICAL PEDAGOGICAL VALIDATIONS
    pedagogicalSequence: QualityGateResult;
    archetypePurity: QualityGateResult;
    cognitiveLoad: QualityGateResult;
    characterContinuity: QualityGateResult;
  };
  allIssues: string[];
  allRecommendations: string[];
}> {
  console.log(`[QUALITY GATES] Running comprehensive quality checks for storyboard ${storyboardId}...`);

  // CRITICAL PEDAGOGICAL VALIDATIONS - MUST PASS
  console.log(`[QUALITY GATES] 🚨 Running CRITICAL pedagogical validations...`);
  const pedagogicalSequence = validatePedagogicalSequence(storyboard.scenes);
  const archetypePurity = validateArchetypePurity(storyboard.scenes, projectScope.archetype);
  const cognitiveLoad = validateCognitiveLoad(storyboard.scenes);
  const characterContinuity = validateCharacterContinuity(storyboard.scenes);

  // Check if any CRITICAL validations failed
  const criticalFailures = [
    pedagogicalSequence,
    archetypePurity,
    cognitiveLoad,
    characterContinuity
  ].filter(result => !result.passed);

  if (criticalFailures.length > 0) {
    console.log(`[QUALITY GATES] ❌ CRITICAL FAILURES DETECTED: ${criticalFailures.length} critical validations failed`);
    criticalFailures.forEach((failure, index) => {
      console.log(`[QUALITY GATES] ❌ Critical Failure ${index + 1}:`, failure.issues);
    });
  }

  const loCoverage = await checkLearningObjectiveCoverage(storyboard, learningObjectives, storyboardId);
  const interactivityDensity = await checkInteractivityDensity(storyboard, projectScope.interactivityDensity, storyboardId);
  const characterConsistency = await checkCharacterConsistency(storyboard, projectScope, storyboardId);
  const narrativeFlow = await checkNarrativeFlow(storyboard, projectScope, storyboardId);
  const assessmentQuality = await checkAssessmentQuality(storyboard, storyboardId); // Phase 3 addition

  const gateResults = {
    loCoverage,
    interactivityDensity,
    characterConsistency,
    narrativeFlow,
    assessmentQuality,
    // CRITICAL PEDAGOGICAL VALIDATIONS
    pedagogicalSequence,
    archetypePurity,
    cognitiveLoad,
    characterContinuity
  };

  const allIssues = [
    ...loCoverage.issues,
    ...interactivityDensity.issues,
    ...characterConsistency.issues,
    ...narrativeFlow.issues,
    ...assessmentQuality.issues,
    // CRITICAL PEDAGOGICAL VALIDATIONS
    ...pedagogicalSequence.issues,
    ...archetypePurity.issues,
    ...cognitiveLoad.issues,
    ...characterContinuity.issues
  ];

  const allRecommendations = [
    ...loCoverage.recommendations,
    ...interactivityDensity.recommendations,
    ...characterConsistency.recommendations,
    ...narrativeFlow.recommendations,
    ...assessmentQuality.recommendations,
    // CRITICAL PEDAGOGICAL VALIDATIONS
    ...pedagogicalSequence.recommendations,
    ...archetypePurity.recommendations,
    ...cognitiveLoad.recommendations,
    ...characterContinuity.recommendations
  ];

  // Calculate overall score including critical validations
  const regularScore = (loCoverage.score + interactivityDensity.score + characterConsistency.score + narrativeFlow.score + assessmentQuality.overallScore) / 5;
  const criticalScore = (pedagogicalSequence.score + archetypePurity.score + cognitiveLoad.score + characterContinuity.score) / 4;
  const overallScore = (regularScore + criticalScore) / 2;
  
  // CRITICAL: Storyboard MUST pass all critical validations
  const criticalPassed = pedagogicalSequence.passed && archetypePurity.passed && cognitiveLoad.passed && characterContinuity.passed;
  const regularPassed = loCoverage.passed && interactivityDensity.passed && characterConsistency.passed && narrativeFlow.passed && assessmentQuality.overallScore >= 75;
  const overallPassed = criticalPassed && regularPassed;

  console.log(`[QUALITY GATES] Overall score: ${overallScore.toFixed(1)}% (${overallPassed ? 'PASSED' : 'FAILED'})`);
  console.log(`[QUALITY GATES] Regular score: ${regularScore.toFixed(1)}% (${regularPassed ? 'PASSED' : 'FAILED'})`);
  console.log(`[QUALITY GATES] Critical score: ${criticalScore.toFixed(1)}% (${criticalPassed ? 'PASSED' : 'FAILED'})`);
  console.log(`[QUALITY GATES] Issues found: ${allIssues.length}`);
  console.log(`[QUALITY GATES] Recommendations: ${allRecommendations.length}`);
  
  if (!criticalPassed) {
    console.log(`[QUALITY GATES] 🚨 CRITICAL VALIDATION FAILURES - STORYBOARD REJECTED`);
    console.log(`[QUALITY GATES] 🚨 Pedagogical Sequence: ${pedagogicalSequence.passed ? 'PASS' : 'FAIL'}`);
    console.log(`[QUALITY GATES] 🚨 Archetype Purity: ${archetypePurity.passed ? 'PASS' : 'FAIL'}`);
    console.log(`[QUALITY GATES] 🚨 Cognitive Load: ${cognitiveLoad.passed ? 'PASS' : 'FAIL'}`);
    console.log(`[QUALITY GATES] 🚨 Character Continuity: ${characterContinuity.passed ? 'PASS' : 'FAIL'}`);
  }

  return {
    overallPassed,
    overallScore,
    gateResults,
    allIssues,
    allRecommendations
  };
}

/**
 * Validates pedagogical approach compliance
 */
function validatePedagogicalApproach(
  scenes: Scene[],
  moduleType: string
): {
  score: number;
  issues: string[];
  recommendations: string[];
  violations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];
  const violations: string[] = [];
  
  if (!moduleType) {
    issues.push("Module type not specified for pedagogical validation");
    return { score: 0, issues, recommendations, violations };
  }
  
  const pedagogicalApproach = getPedagogicalApproach(moduleType);
  const requiredSequence = pedagogicalApproach.sequence;
  const allowedInteractions = pedagogicalApproach.interactions;
  const bannedInteractions = pedagogicalApproach.banned;
  
  // Check sequence compliance
  const sequenceIssues = validateSequenceCompliance(scenes, requiredSequence);
  issues.push(...sequenceIssues);
  
  // Check interaction compliance
  const interactionIssues = validateInteractionCompliance(scenes, allowedInteractions, bannedInteractions);
  issues.push(...interactionIssues);
  
  // Check pedagogical flow
  const flowIssues = validatePedagogicalFlow(scenes, moduleType);
  issues.push(...flowIssues);
  
  // Calculate score
  const totalChecks = 3; // sequence, interactions, flow
  const passedChecks = totalChecks - issues.length;
  const score = Math.max(0, passedChecks / totalChecks);
  
  if (issues.length === 0) {
    recommendations.push(`✅ Pedagogical approach compliance verified for ${moduleType}`);
  } else {
    recommendations.push(`⚠️ Pedagogical approach needs adjustment for ${moduleType}`);
    recommendations.push(`Required sequence: ${requiredSequence.join(" → ")}`);
    recommendations.push(`Allowed interactions: ${allowedInteractions.join(", ")}`);
    if (bannedInteractions.length > 0) {
      recommendations.push(`Banned interactions: ${bannedInteractions.join(", ")}`);
    }
  }
  
  return {
    score,
    issues,
    recommendations,
    violations
  };
}

/**
 * Validates sequence compliance
 */
function validateSequenceCompliance(scenes: Scene[], requiredSequence: string[]): string[] {
  const issues: string[] = [];
  
  // Check if we have enough scenes for the required sequence
  if (scenes.length < requiredSequence.length) {
    issues.push(`Insufficient scenes for required sequence. Need ${requiredSequence.length}, have ${scenes.length}`);
  }
  
  // Check if sequence is followed (simplified check)
  const teachingScenes = scenes.filter(scene => 
    scene.narrationScript?.toLowerCase().includes('teach') ||
    scene.narrationScript?.toLowerCase().includes('learn') ||
    scene.narrationScript?.toLowerCase().includes('understand')
  );
  
  const practiceScenes = scenes.filter(scene => 
    scene.interactionType?.toLowerCase().includes('practice') ||
    scene.interactionType?.toLowerCase().includes('simulation') ||
    scene.interactionType?.toLowerCase().includes('roleplay')
  );
  
  if (requiredSequence.includes('teach_rules') && teachingScenes.length === 0) {
    issues.push("Missing teaching phase - required for this module type");
  }
  
  if (requiredSequence.includes('practice') && practiceScenes.length === 0) {
    issues.push("Missing practice phase - required for this module type");
  }
  
  return issues;
}

/**
 * Validates interaction compliance
 */
function validateInteractionCompliance(
  scenes: Scene[], 
  allowedInteractions: string[], 
  bannedInteractions: string[]
): string[] {
  const issues: string[] = [];
  
  scenes.forEach((scene, index) => {
    if (scene.interactionType) {
      const interactionType = scene.interactionType.toLowerCase();
      
      // Check for banned interactions
      const isBanned = bannedInteractions.some(banned => 
        interactionType.includes(banned.toLowerCase())
      );
      
      if (isBanned) {
        issues.push(`Scene ${index + 1}: Banned interaction "${scene.interactionType}" detected`);
      }
      
      // Check for allowed interactions
      const isAllowed = allowedInteractions.some(allowed => 
        interactionType.includes(allowed.toLowerCase())
      );
      
      if (!isAllowed && !isBanned) {
        issues.push(`Scene ${index + 1}: Interaction "${scene.interactionType}" not recommended for this module type`);
      }
    }
  });
  
  return issues;
}

/**
 * Validates pedagogical flow
 */
function validatePedagogicalFlow(scenes: Scene[], moduleType: string): string[] {
  const issues: string[] = [];
  
  // Check for proper progression from teaching to application
  const hasTeaching = scenes.some(scene => 
    scene.narrationScript?.toLowerCase().includes('teach') ||
    scene.narrationScript?.toLowerCase().includes('learn') ||
    scene.narrationScript?.toLowerCase().includes('understand')
  );
  
  const hasApplication = scenes.some(scene => 
    scene.interactionType?.toLowerCase().includes('scenario') ||
    scene.interactionType?.toLowerCase().includes('application') ||
    scene.interactionType?.toLowerCase().includes('practice')
  );
  
  if (!hasTeaching) {
    issues.push("Missing teaching phase - learners need to understand concepts before applying them");
  }
  
  if (!hasApplication) {
    issues.push("Missing application phase - learners need to practice what they've learned");
  }
  
  return issues;
}
