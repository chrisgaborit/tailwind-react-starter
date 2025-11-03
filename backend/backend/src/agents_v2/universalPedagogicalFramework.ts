// backend/src/agents_v2/universalPedagogicalFramework.ts

export interface UniversalPedagogicalFramework {
  version: "1.0";
  enforcedSequence: string[];
  complianceChecks: string[];
  teachingSceneTemplate: TeachingSceneTemplate;
  interactivityRules: InteractivityRules;
  structuralValidation: StructuralValidation;
}

export interface TeachingSceneTemplate {
  mandatoryFields: string[];
  bridgeStatement: boolean;
  dualCoding: boolean;
  pedagogicalRationale: boolean;
}

export interface InteractivityRules {
  bloomLevelMapping: Record<string, string[]>;
  feedbackRequirements: {
    corrective: boolean;
    explanatory: boolean;
    referenceTeaching: boolean;
  };
}

export interface StructuralValidation {
  checks: ValidationCheck[];
  passCriteria: Record<string, string>;
}

export interface ValidationCheck {
  name: string;
  description: string;
  validator: (storyboard: any) => boolean;
}

export interface PedagogicalComplianceReport {
  passed: boolean;
  frameworkVersion: string;
  checks: ValidationResult[];
  violations: string[];
  recommendations: string[];
}

export interface ValidationResult {
  checkName: string;
  passed: boolean;
  details: string;
  severity: "critical" | "warning" | "info";
}

// Universal Pedagogical Framework v1.0 Implementation
export const UNIVERSAL_PEDAGOGICAL_FRAMEWORK: UniversalPedagogicalFramework = {
  version: "1.0",
  enforcedSequence: [
    "Welcome",
    "LearningOutcomes", 
    "Teach",
    "Practice",
    "Apply",
    "Assess",
    "Summary"
  ],
  complianceChecks: [
    "OutcomeLinkage",
    "TeachingCoverage", 
    "SequenceLogic",
    "AssessmentPresence",
    "PedagogicalRationale"
  ],
  teachingSceneTemplate: {
    mandatoryFields: [
      "learningOutcomeLink",
      "voiceOverScript", 
      "onScreenText",
      "visualPrompt",
      "bridgeStatement",
      "pedagogicalRationale"
    ],
    bridgeStatement: true,
    dualCoding: true,
    pedagogicalRationale: true
  },
  interactivityRules: {
    bloomLevelMapping: {
      "Remember": ["Click-to-Reveal", "Match-Pair"],
      "Understand": ["Categorise", "Sequence"],
      "Apply": ["Scenario Choice", "Simulation"],
      "Analyze": ["Scenario Choice", "Case Study"],
      "Evaluate": ["Scenario Choice", "Decision Tree"],
      "Create": ["Scenario Choice", "Simulation"]
    },
    feedbackRequirements: {
      corrective: true,
      explanatory: true,
      referenceTeaching: true
    }
  },
  structuralValidation: {
    checks: [
      {
        name: "OutcomeLinkage",
        description: "Each scene explicitly maps to ≥1 Learning Outcome",
        validator: validateOutcomeLinkage
      },
      {
        name: "TeachingCoverage", 
        description: "All Learning Outcomes have ≥1 dedicated teaching scene",
        validator: validateTeachingCoverage
      },
      {
        name: "SequenceLogic",
        description: "No interactivity or scenario appears before teaching",
        validator: validateSequenceLogic
      },
      {
        name: "AssessmentPresence",
        description: "Each Learning Outcome ends with an assessment or reflection",
        validator: validateAssessmentPresence
      },
      {
        name: "PedagogicalRationale",
        description: "Every teaching scene includes 'Why This Works' explanation",
        validator: validatePedagogicalRationale
      }
    ],
    passCriteria: {
      "OutcomeLinkage": "All scenes must map to learning outcomes",
      "TeachingCoverage": "All outcomes must have teaching scenes",
      "SequenceLogic": "Teaching must precede practice/application",
      "AssessmentPresence": "All outcomes must have assessments",
      "PedagogicalRationale": "All teaching scenes need rationale"
    }
  }
};

// Validation Functions
function validateOutcomeLinkage(storyboard: any): boolean {
  if (!storyboard.scenes || !Array.isArray(storyboard.scenes)) return false;
  
  return storyboard.scenes.every((scene: any) => {
    // Check if scene has learning outcome linkage
    return scene.learningOutcome || 
           scene.teachingScene?.learningOutcome ||
           scene.pageTitle?.toLowerCase().includes('teaching') ||
           scene.pageTitle?.toLowerCase().includes('practice') ||
           scene.pageTitle?.toLowerCase().includes('apply') ||
           scene.pageTitle?.toLowerCase().includes('assess');
  });
}

function validateTeachingCoverage(storyboard: any): boolean {
  if (!storyboard.scenes || !Array.isArray(storyboard.scenes)) return false;
  
  const learningOutcomes = storyboard.learningOutcomes || [];
  const teachingScenes = storyboard.scenes.filter((scene: any) => 
    scene.pageTitle?.toLowerCase().includes('teaching') ||
    scene.teachingScene
  );
  
  // Each learning outcome should have at least one teaching scene
  return learningOutcomes.length <= teachingScenes.length;
}

function validateSequenceLogic(storyboard: any): boolean {
  if (!storyboard.scenes || !Array.isArray(storyboard.scenes)) return false;
  
  let teachingSceneFound = false;
  
  for (const scene of storyboard.scenes) {
    const isTeaching = scene.pageTitle?.toLowerCase().includes('teaching') || scene.teachingScene;
    const isInteractive = scene.interactionType && scene.interactionType !== "None";
    const isPractice = scene.pageTitle?.toLowerCase().includes('practice') || 
                      scene.pageTitle?.toLowerCase().includes('apply');
    
    if (isTeaching) {
      teachingSceneFound = true;
    }
    
    if ((isInteractive || isPractice) && !teachingSceneFound) {
      return false; // Interactive/practice before teaching
    }
  }
  
  return true;
}

function validateAssessmentPresence(storyboard: any): boolean {
  if (!storyboard.scenes || !Array.isArray(storyboard.scenes)) return false;
  
  const learningOutcomes = storyboard.learningOutcomes || [];
  const assessmentScenes = storyboard.scenes.filter((scene: any) =>
    scene.pageTitle?.toLowerCase().includes('assess') ||
    scene.pageTitle?.toLowerCase().includes('knowledge check') ||
    scene.pageTitle?.toLowerCase().includes('quiz') ||
    scene.interactionType === "MCQ"
  );
  
  // Should have at least one assessment per learning outcome
  return assessmentScenes.length >= learningOutcomes.length;
}

function validatePedagogicalRationale(storyboard: any): boolean {
  if (!storyboard.scenes || !Array.isArray(storyboard.scenes)) return false;
  
  const teachingScenes = storyboard.scenes.filter((scene: any) =>
    scene.pageTitle?.toLowerCase().includes('teaching') ||
    scene.teachingScene
  );
  
  return teachingScenes.every((scene: any) => {
    return scene.teachingScene?.whyThisWorks ||
           scene.teachingScene?.pedagogicalRationale ||
           scene.pedagogicalRationale;
  });
}

// Main Validation Engine
export class PedagogicalFrameworkValidator {
  private framework: UniversalPedagogicalFramework;
  
  constructor() {
    this.framework = UNIVERSAL_PEDAGOGICAL_FRAMEWORK;
  }
  
  validateStoryboard(storyboard: any): PedagogicalComplianceReport {
    const results: ValidationResult[] = [];
    const violations: string[] = [];
    const recommendations: string[] = [];
    
    // Run all validation checks
    for (const check of this.framework.structuralValidation.checks) {
      const passed = check.validator(storyboard);
      
      results.push({
        checkName: check.name,
        passed,
        details: check.description,
        severity: passed ? "info" : "critical"
      });
      
      if (!passed) {
        violations.push(`${check.name}: ${check.description}`);
        recommendations.push(this.getRecommendation(check.name));
      }
    }
    
    const allPassed = results.every(r => r.passed);
    
    return {
      passed: allPassed,
      frameworkVersion: this.framework.version,
      checks: results,
      violations,
      recommendations
    };
  }
  
  private getRecommendation(checkName: string): string {
    const recommendations: Record<string, string> = {
      "OutcomeLinkage": "Ensure every scene explicitly links to at least one learning outcome",
      "TeachingCoverage": "Add dedicated teaching scenes for each learning outcome",
      "SequenceLogic": "Reorder scenes so teaching precedes practice and application",
      "AssessmentPresence": "Add knowledge checks or assessments for each learning outcome",
      "PedagogicalRationale": "Include 'Why This Works' explanations in all teaching scenes"
    };
    
    return recommendations[checkName] || "Review scene structure and content";
  }
  
  enforceFrameworkStructure(learningOutcomes: string[]): any {
    return {
      pedagogicalFrameworkVersion: this.framework.version,
      enforcedSequence: this.framework.enforcedSequence,
      complianceChecks: this.framework.complianceChecks,
      requiredSceneFlow: this.generateRequiredSceneFlow(learningOutcomes)
    };
  }
  
  private generateRequiredSceneFlow(learningOutcomes: string[]): any[] {
    const flow = [
      { type: "Welcome", required: true, count: 1 },
      { type: "LearningOutcomes", required: true, count: 1 }
    ];
    
    // For each learning outcome, add the required sequence
    learningOutcomes.forEach((outcome, index) => {
      flow.push(
        { type: "Teach", required: true, count: 1, outcomeIndex: index, outcome },
        { type: "Practice", required: true, count: 1, outcomeIndex: index, outcome },
        { type: "Apply", required: true, count: 1, outcomeIndex: index, outcome },
        { type: "Assess", required: true, count: 1, outcomeIndex: index, outcome }
      );
    });
    
    flow.push(
      { type: "Summary", required: true, count: 1 },
      { type: "NextSteps", required: true, count: 1 }
    );
    
    return flow;
  }
}

// Export singleton instance
export const pedagogicalValidator = new PedagogicalFrameworkValidator();



