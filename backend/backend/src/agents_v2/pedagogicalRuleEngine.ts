// backend/src/agents_v2/pedagogicalRuleEngine.ts
import { 
  PedagogicalRule, 
  InteractionType, 
  InteractionPurpose,
  Scene,
  OutcomeAnalysis 
} from "./types";

/**
 * Phase 2: Pedagogical Rule Engine
 * Defines WHEN and WHAT TYPE of interaction to use based on learning science
 */
export class PedagogicalRuleEngine {
  private rules: PedagogicalRule[];
  
  constructor() {
    this.rules = this.initializeRules();
  }
  
  /**
   * Get applicable rules for a scene based on context
   */
  getApplicableRules(context: {
    scene: Scene;
    sceneIndex: number;
    totalScenes: number;
    minutesSinceLastInteraction: number;
    outcomeBloomLevel?: string;
    previousScenes: Scene[];
  }): PedagogicalRule[] {
    const applicable: PedagogicalRule[] = [];
    
    for (const rule of this.rules) {
      if (this.evaluateTrigger(rule, context)) {
        applicable.push(rule);
      }
    }
    
    // Sort by priority (highest first)
    return applicable.sort((a, b) => b.priority - a.priority);
  }
  
  /**
   * Get recommended interaction based on highest priority applicable rule
   */
  getRecommendedInteraction(context: {
    scene: Scene;
    sceneIndex: number;
    totalScenes: number;
    minutesSinceLastInteraction: number;
    outcomeBloomLevel?: string;
    previousScenes: Scene[];
  }): { type: InteractionType; purpose: InteractionPurpose; rationale: string } | null {
    const applicableRules = this.getApplicableRules(context);
    
    if (applicableRules.length === 0) {
      return null;
    }
    
    const topRule = applicableRules[0];
    return {
      type: topRule.action.interactionType,
      purpose: topRule.action.purpose,
      rationale: topRule.rationale
    };
  }
  
  /**
   * Initialize pedagogical rules based on learning science
   */
  private initializeRules(): PedagogicalRule[] {
    return [
      // Rule 1: Attention Reset after passive content
      {
        id: "attention-reset",
        name: "Attention Reset Rule",
        trigger: {
          condition: "minutesSinceLastInteraction",
          threshold: 4
        },
        action: {
          interactionType: "knowledgeCheck",
          purpose: "attentionReset"
        },
        rationale: "Research shows attention wanes after 4-6 minutes of passive content. Brief interaction re-engages learners.",
        priority: 8
      },
      
      // Rule 2: Skill Practice for Apply/Analyze outcomes
      {
        id: "skill-practice-apply",
        name: "Skill Practice Rule (Apply Level)",
        trigger: {
          condition: "bloomLevel",
          threshold: undefined
        },
        action: {
          interactionType: "scenario",
          purpose: "skillPractice"
        },
        rationale: "Apply-level outcomes require practice. Scenarios provide safe environment for skill application.",
        priority: 9
      },
      
      // Rule 3: Reflection for emotional/soft skills content
      {
        id: "reflection-emotional",
        name: "Reflection for Emotional Content",
        trigger: {
          condition: "emotionalContent",
          threshold: undefined
        },
        action: {
          interactionType: "reflection",
          purpose: "meaningMaking"
        },
        rationale: "Emotional or values-based content benefits from personal reflection to deepen meaning.",
        priority: 7
      },
      
      // Rule 4: Knowledge reinforcement after teaching
      {
        id: "knowledge-check",
        name: "Knowledge Reinforcement Rule",
        trigger: {
          condition: "afterTeaching",
          threshold: undefined
        },
        action: {
          interactionType: "knowledgeCheck",
          purpose: "knowledgeReinforcement"
        },
        rationale: "Immediate recall strengthens memory encoding (testing effect).",
        priority: 8
      },
      
      // Rule 5: Click-to-Reveal for progressive disclosure
      {
        id: "click-to-reveal-readable",
        name: "Click-to-Reveal for Progressive Disclosure",
        trigger: {
          condition: "bloomLevel",
          threshold: undefined
        },
        action: {
          interactionType: "Click-to-Reveal",
          purpose: "progressiveDisclosure"
        },
        rationale: "Click-to-Reveal interactions help learners digest complex information by revealing it progressively.",
        priority: 6
      },

      // Rule 6: Drag-and-Drop Matching for concept relationships
      {
        id: "drag-drop-matching",
        name: "Drag-and-Drop Matching for Concept Relationships",
        trigger: {
          condition: "bloomLevel",
          threshold: undefined
        },
        action: {
          interactionType: "DragAndDrop-Matching",
          purpose: "conceptMapping"
        },
        rationale: "Drag-and-Drop Matching helps learners understand relationships between concepts.",
        priority: 6
      },

      // Rule 7: Drag-and-Drop Sequencing for process understanding
      {
        id: "drag-drop-sequencing",
        name: "Drag-and-Drop Sequencing for Process Understanding",
        trigger: {
          condition: "bloomLevel",
          threshold: undefined
        },
        action: {
          interactionType: "DragAndDrop-Sequencing",
          purpose: "processUnderstanding"
        },
        rationale: "Drag-and-Drop Sequencing helps learners understand step-by-step processes.",
        priority: 6
      },

      // Rule 8: Branching scenario for complex decision-making
      {
        id: "branching-complex",
        name: "Branching Scenario for Complex Decisions",
        trigger: {
          condition: "bloomLevel",
          threshold: undefined
        },
        action: {
          interactionType: "branchingScenario",
          purpose: "application"
        },
        rationale: "Analyze/Evaluate outcomes need consequences exploration. Branching shows cause-effect.",
        priority: 10
      },
      
      // Rule 6: Simulation for procedural skills
      {
        id: "simulation-procedural",
        name: "Simulation for Procedural Skills",
        trigger: {
          condition: "proceduralContent",
          threshold: undefined
        },
        action: {
          interactionType: "simulation",
          purpose: "skillPractice"
        },
        rationale: "Procedural knowledge requires hands-on practice for automaticity.",
        priority: 9
      },
      
      // Rule 7: Drag-and-Drop Matching for categorization
      {
        id: "dragdrop-matching",
        name: "Drag-and-Drop Matching for Categorization",
        trigger: {
          condition: "categorizationNeeded",
          threshold: undefined
        },
        action: {
          interactionType: "DragAndDrop-Matching",
          purpose: "knowledgeReinforcement"
        },
        rationale: "Active categorization through drag-and-drop matching strengthens schema formation and pattern recognition.",
        priority: 7
      },
      
      // Rule 8: Hotspot for visual/spatial learning
      {
        id: "hotspot-visual",
        name: "Hotspot for Visual Content",
        trigger: {
          condition: "visualComplexity",
          threshold: 7
        },
        action: {
          interactionType: "hotspot",
          purpose: "exploration"
        },
        rationale: "Complex visuals benefit from guided exploration to direct attention to key elements.",
        priority: 7
      },
      
      // Rule 9: Slider for attitudinal assessment
      {
        id: "slider-attitude",
        name: "Slider for Attitudes/Beliefs",
        trigger: {
          condition: "attitudinalContent",
          threshold: undefined
        },
        action: {
          interactionType: "slider",
          purpose: "meaningMaking"
        },
        rationale: "Sliders reveal pre-existing attitudes, creating cognitive dissonance for learning.",
        priority: 6
      },
      
      // Rule 10: Journal for transfer planning
      {
        id: "journal-transfer",
        name: "Journal for Action Planning",
        trigger: {
          condition: "nearEnd",
          threshold: 0.8 // Last 20% of module
        },
        action: {
          interactionType: "journal",
          purpose: "application"
        },
        rationale: "Action planning at module end increases real-world transfer likelihood.",
        priority: 8
      },
      
      // Rule 11: Drag-and-Drop Sequencing for process ordering
      {
        id: "dragdrop-sequencing",
        name: "Drag-and-Drop Sequencing for Process Ordering",
        trigger: {
          condition: "sequentialProcess",
          threshold: undefined
        },
        action: {
          interactionType: "DragAndDrop-Sequencing",
          purpose: "knowledgeReinforcement"
        },
        rationale: "Active ordering through drag-and-drop sequencing strengthens procedural memory and step dependencies.",
        priority: 8
      },
      
      // Rule 12: Engagement boost for long modules
      {
        id: "engagement-long",
        name: "Engagement for Long Modules",
        trigger: {
          condition: "moduleDuration",
          threshold: 15 // minutes
        },
        action: {
          interactionType: "scenario",
          purpose: "engagement"
        },
        rationale: "Longer modules need variety to maintain motivation and prevent dropout.",
        priority: 5
      }
    ];
  }
  
  /**
   * Evaluate if a rule's trigger condition is met
   */
  private evaluateTrigger(
    rule: PedagogicalRule, 
    context: {
      scene: Scene;
      sceneIndex: number;
      totalScenes: number;
      minutesSinceLastInteraction: number;
      outcomeBloomLevel?: string;
      previousScenes: Scene[];
    }
  ): boolean {
    const { trigger } = rule;
    const { scene, sceneIndex, totalScenes, minutesSinceLastInteraction, outcomeBloomLevel } = context;
    
    switch (trigger.condition) {
      case "minutesSinceLastInteraction":
        return minutesSinceLastInteraction >= (trigger.threshold || 4);
      
      case "bloomLevel":
        if (rule.id === "skill-practice-apply") {
          return outcomeBloomLevel === "Apply" || outcomeBloomLevel === "Analyze";
        }
        if (rule.id === "branching-complex") {
          return outcomeBloomLevel === "Analyze" || outcomeBloomLevel === "Evaluate";
        }
        return false;
      
      case "emotionalContent":
        return this.containsEmotionalContent(scene);
      
      case "afterTeaching":
        return this.isAfterTeachingScene(scene, context.previousScenes);
      
      case "proceduralContent":
        return this.containsProceduralContent(scene);
      
      case "categorizationNeeded":
        return this.needsCategorization(scene);
      
      case "visualComplexity":
        return this.hasHighVisualComplexity(scene);
      
      case "attitudinalContent":
        return this.containsAttitudinalContent(scene);
      
      case "nearEnd":
        const progressRatio = sceneIndex / totalScenes;
        return progressRatio >= (trigger.threshold || 0.8);
      
      case "sequentialProcess":
        return this.containsSequentialProcess(scene);
      
      case "moduleDuration":
        // Would need total module duration - estimate from totalScenes
        const estimatedMinutes = totalScenes * 1.5; // Rough estimate
        return estimatedMinutes >= (trigger.threshold || 15);
      
      default:
        return false;
    }
  }
  
  /**
   * Helper: Check if scene contains emotional/values content
   */
  private containsEmotionalContent(scene: Scene): boolean {
    const text = `${scene.pageTitle} ${scene.narrationScript} ${scene.onScreenText}`.toLowerCase();
    const emotionalKeywords = [
      "feel", "emotion", "attitude", "belief", "value", "difficult", "challenging",
      "frustrat", "stress", "conflict", "empathy", "respect", "trust"
    ];
    return emotionalKeywords.some(keyword => text.includes(keyword));
  }
  
  /**
   * Helper: Check if scene comes after teaching content
   */
  private isAfterTeachingScene(scene: Scene, previousScenes: Scene[]): boolean {
    if (previousScenes.length === 0) return false;
    
    const prevScene = previousScenes[previousScenes.length - 1];
    const prevText = `${prevScene.pageTitle} ${prevScene.narrationScript}`.toLowerCase();
    
    // Teaching indicators
    const teachingKeywords = ["framework", "model", "principle", "concept", "theory", "approach"];
    return teachingKeywords.some(keyword => prevText.includes(keyword));
  }
  
  /**
   * Helper: Check if scene contains procedural content
   */
  private containsProceduralContent(scene: Scene): boolean {
    const text = `${scene.pageTitle} ${scene.narrationScript}`.toLowerCase();
    const proceduralKeywords = ["step", "process", "procedure", "how to", "method", "technique"];
    return proceduralKeywords.some(keyword => text.includes(keyword));
  }
  
  /**
   * Helper: Check if scene needs categorization
   */
  private needsCategorization(scene: Scene): boolean {
    const text = `${scene.pageTitle} ${scene.narrationScript}`.toLowerCase();
    const categorizationKeywords = ["type", "category", "classify", "sort", "kind", "group"];
    return categorizationKeywords.some(keyword => text.includes(keyword));
  }
  
  /**
   * Helper: Check if scene has high visual complexity
   */
  private hasHighVisualComplexity(scene: Scene): boolean {
    const visualPrompt = scene.visual?.aiPrompt || "";
    const complexityIndicators = [
      "diagram", "flowchart", "infographic", "detailed", "complex", "multiple", "labeled"
    ];
    return complexityIndicators.some(indicator => visualPrompt.toLowerCase().includes(indicator));
  }
  
  /**
   * Helper: Check if scene contains attitudinal content
   */
  private containsAttitudinalContent(scene: Scene): boolean {
    const text = `${scene.pageTitle} ${scene.narrationScript}`.toLowerCase();
    const attitudinalKeywords = [
      "attitude", "belief", "opinion", "perspective", "view", "stance", "position"
    ];
    return attitudinalKeywords.some(keyword => text.includes(keyword));
  }
  
  /**
   * Helper: Check if scene contains sequential process
   */
  private containsSequentialProcess(scene: Scene): boolean {
    const text = `${scene.pageTitle} ${scene.narrationScript}`.toLowerCase();
    
    // Look for numbered steps or sequence words
    const hasNumberedSteps = /\b(first|second|third|1\.|2\.|3\.|step 1|step 2)/i.test(text);
    const sequenceKeywords = ["sequence", "order", "stages", "phases", "progression"];
    const hasSequenceWords = sequenceKeywords.some(keyword => text.includes(keyword));
    
    return hasNumberedSteps || hasSequenceWords;
  }
}

