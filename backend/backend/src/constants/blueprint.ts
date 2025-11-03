// backend/src/constants/blueprint.ts

/**
 * Brandon Hall Award-Level Blueprint
 * 
 * 8-point structure for consistently excellent eLearning storyboards.
 * Enforced by QAAgent and DirectorAgent.
 */

export interface BlueprintStep {
  step: number;
  name: string;
  required: boolean;
  sceneTypes: string[];
  requirements: string[];
  qualityChecks: string[];
}

/**
 * 8-Point Brandon Hall Blueprint
 */
export const BRANDON_HALL_BLUEPRINT: BlueprintStep[] = [
  {
    step: 1,
    name: "Title Scene",
    required: true,
    sceneTypes: ["Welcome", "LearningOutcomes"],
    requirements: [
      "Module title clearly stated",
      "Target audience identified",
      "Estimated duration shown",
      "Professional visual"
    ],
    qualityChecks: [
      "Title is engaging, not generic",
      "Duration is accurate",
      "Visual is high-quality"
    ]
  },
  {
    step: 2,
    name: "Emotional Hook",
    required: true,
    sceneTypes: ["Welcome"],
    requirements: [
      "Relatable problem or challenge",
      "Emotional connection established",
      "Stakes identified (what happens if not learned)",
      "Curiosity created about solution"
    ],
    qualityChecks: [
      "Hook is specific, not generic",
      "Learner can relate to problem",
      "Stakes are real and meaningful",
      "No 'Welcome to...' clichés"
    ]
  },
  {
    step: 3,
    name: "Learning Outcomes",
    required: true,
    sceneTypes: ["LearningOutcomes"],
    requirements: [
      "Clear, measurable outcomes listed",
      "Benefit-oriented language used",
      "Aligned with Bloom's taxonomy",
      "Realistic timeframe indicated"
    ],
    qualityChecks: [
      "Outcomes are specific and actionable",
      "Language is learner-centric",
      "Benefits are tangible",
      "Outcomes match module content"
    ]
  },
  {
    step: 4,
    name: "Character Dilemma",
    required: true,
    sceneTypes: ["Teach"],
    requirements: [
      "Relatable character introduced",
      "Character has name and role",
      "Character faces specific challenge",
      "Challenge matches learner's context"
    ],
    qualityChecks: [
      "Character is believable",
      "Role matches target audience",
      "Challenge is authentic",
      "Learner can identify with character"
    ]
  },
  {
    step: 5,
    name: "Teaching Scenes (1-3)",
    required: true,
    sceneTypes: ["Teach"],
    requirements: [
      "1-3 teaching scenes per learning outcome",
      "Each scene has narration 150-200 words",
      "On-screen text ≤ 70 words",
      "Visual supports learning",
      "Character's journey shows principle"
    ],
    qualityChecks: [
      "Content is story-based, not lecture",
      "Examples are realistic",
      "Principles clearly explained",
      "Character demonstrates learning"
    ]
  },
  {
    step: 6,
    name: "Application Scene",
    required: true,
    sceneTypes: ["Apply", "Practice"],
    requirements: [
      "Realistic workplace scenario",
      "Decision point with choices",
      "Real consequences shown",
      "Coaching feedback provided"
    ],
    qualityChecks: [
      "Scenario is authentic",
      "Choices are meaningful",
      "Consequences are realistic",
      "Feedback guides without solving"
    ]
  },
  {
    step: 7,
    name: "Capstone Knowledge Check",
    required: true,
    sceneTypes: ["Assess"],
    requirements: [
      "Assessment aligned with outcomes",
      "Multiple question types used",
      "Feedback is constructive",
      "Retry logic available"
    ],
    qualityChecks: [
      "Questions test application, not memorization",
      "Distractors are plausible",
      "Feedback explains reasoning",
      "Assessment is fair"
    ]
  },
  {
    step: 8,
    name: "Summary & Call to Action",
    required: true,
    sceneTypes: ["Summary", "NextSteps"],
    requirements: [
      "Key takeaways summarized",
      "Character's success story shown",
      "Specific next steps provided",
      "Call to action is clear and immediate"
    ],
    qualityChecks: [
      "Summary celebrates transformation",
      "Next steps are specific",
      "CTA creates urgency",
      "Ending is inspirational"
    ]
  }
];

/**
 * Required fields for every scene
 */
export const REQUIRED_SCENE_FIELDS = [
  'sceneNumber',
  'pageTitle',
  'narrationScript',
  'onScreenText',
  'visual.aiPrompt',
  'visual.altText'
];

/**
 * Quality thresholds
 */
export const QUALITY_THRESHOLDS = {
  minNarrationWords: 150,
  maxNarrationWords: 250,
  maxOnScreenWords: 70,
  minScenes: 6,
  maxScenes: 20,
  minInteractionVariety: 0.5, // 50% of scenes should have different interaction types
  minQAScore: 85
};

/**
 * Get blueprint step by name
 */
export function getBlueprintStep(name: string): BlueprintStep | undefined {
  return BRANDON_HALL_BLUEPRINT.find(step => 
    step.name.toLowerCase() === name.toLowerCase()
  );
}

/**
 * Validate storyboard against blueprint
 */
export function validateAgainstBlueprint(scenes: any[]): {
  passed: boolean;
  missingSteps: string[];
  violations: string[];
  score: number;
} {
  const violations: string[] = [];
  const missingSteps: string[] = [];
  let score = 100;

  // Check each required blueprint step
  BRANDON_HALL_BLUEPRINT.filter(step => step.required).forEach(step => {
    const matchingScenes = scenes.filter(scene => 
      step.sceneTypes.includes(scene.pedagogicalPhase || scene.pageType || '')
    );

    if (matchingScenes.length === 0) {
      missingSteps.push(step.name);
      score -= 15;
      violations.push(`Missing required step: ${step.name}`);
    } else {
      // Check requirements for matching scenes
      matchingScenes.forEach(scene => {
        step.requirements.forEach(req => {
          if (!checkRequirement(scene, req)) {
            violations.push(`Scene ${scene.sceneNumber} (${step.name}): ${req} not met`);
            score -= 2;
          }
        });
      });
    }
  });

  return {
    passed: missingSteps.length === 0 && violations.length < 5,
    missingSteps,
    violations,
    score: Math.max(0, score)
  };
}

/**
 * Check if scene meets specific requirement
 */
function checkRequirement(scene: any, requirement: string): boolean {
  const reqLower = requirement.toLowerCase();

  // Check for character references
  if (reqLower.includes('character') && reqLower.includes('name')) {
    return !!(scene.character?.name || scene.narrationScript?.match(/[A-Z][a-z]+ (is|was|faced)/));
  }

  // Check for emotional elements
  if (reqLower.includes('emotional') || reqLower.includes('hook')) {
    return !!(scene.emotionalTone || scene.narrationScript?.match(/(imagine|have you ever|picture this)/i));
  }

  // Check narration length
  if (reqLower.includes('narration') && reqLower.includes('150')) {
    const wordCount = (scene.narrationScript || '').split(/\s+/).length;
    return wordCount >= 150 && wordCount <= 300;
  }

  // Check on-screen text length
  if (reqLower.includes('screen text') && reqLower.includes('70')) {
    const wordCount = (scene.onScreenText || '').split(/\s+/).length;
    return wordCount <= 70;
  }

  // Check for visual
  if (reqLower.includes('visual')) {
    return !!(scene.visual?.aiPrompt || scene.imagePrompt);
  }

  // Check for coaching feedback
  if (reqLower.includes('coaching') || reqLower.includes('feedback')) {
    return !!(scene.interactionDetails?.feedbackRules || scene.feedback);
  }

  // Default: assume met
  return true;
}

export default BRANDON_HALL_BLUEPRINT;


