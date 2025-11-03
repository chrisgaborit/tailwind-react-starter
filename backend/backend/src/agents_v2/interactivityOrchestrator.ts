// backend/src/agents_v2/interactivityOrchestrator.ts
import {
  Scene,
  OutcomeMap,
  InteractionPrescription,
  InteractionDecision,
  DensityProfile,
  InteractionType,
  InteractionPurpose,
  CrossPhaseScene,
  LearningRequest
} from "./types";
import { PedagogicalRuleEngine } from "./pedagogicalRuleEngine";
import { CognitiveLoadProtector } from "./cognitiveLoadProtector";
import { DensityManager } from "./densityManager";
import { openaiChat } from "../services/openaiGateway";
import { resetHeader } from "./resetHeader";
import { safeJSONParse } from "../utils/safeJSONParse";
import { 
  ClickToRevealInteraction, 
  clickToRevealTemplate,
  DragAndDropMatching,
  dragAndDropMatchingTemplate,
  DragAndDropSequencing,
  dragAndDropSequencingTemplate
} from "./interactivityTemplates";

/**
 * Phase 2: Interactivity Orchestrator
 * THE BRAIN: Decides when and what type of interaction to add based on pedagogy
 */
export class InteractivityOrchestrator {
  private ruleEngine: PedagogicalRuleEngine;
  private loadProtector: CognitiveLoadProtector;
  private densityManager: DensityManager;
  
  constructor() {
    this.ruleEngine = new PedagogicalRuleEngine();
    this.loadProtector = new CognitiveLoadProtector();
    this.densityManager = new DensityManager();
  }
  
  /**
   * Analyze all scenes and prescribe interactions
   */
  async prescribeInteractions(
    scenes: Scene[],
    outcomeMap: OutcomeMap,
    request: LearningRequest
  ): Promise<InteractionDecision[]> {
    console.log("\n🧠 InteractivityOrchestrator: Analyzing", scenes.length, "scenes for interaction opportunities");
    
    // Step 1: Determine module type and density profile
    const moduleType = this.densityManager.inferModuleType(request, outcomeMap.outcomes.map(o => o.outcome));
    const densityProfile = this.densityManager.getDensityProfile(moduleType);
    
    console.log("   📊 Module type:", moduleType);
    console.log("   📊 Target interaction rate:", Math.round(densityProfile.targetInteractionRate * 100) + "%");
    console.log("   📊 Intensity:", densityProfile.intensity);
    
    // Step 2: Analyze each scene
    const decisions: InteractionDecision[] = [];
    let minutesSinceLastInteraction = 0;
    
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const previousScenes = scenes.slice(0, i);
      
      // Get outcome for this scene (if applicable)
      const sceneOutcome = this.matchSceneToOutcome(scene, outcomeMap);
      
      // Analyze scene needs
      const decision = await this.analyzeSceneNeeds(
        scene,
        i,
        scenes.length,
        minutesSinceLastInteraction,
        sceneOutcome,
        previousScenes,
        densityProfile
      );
      
      decisions.push(decision);
      
      // Update time tracker
      if (decision.prescription?.needed) {
        minutesSinceLastInteraction = 0;
      } else {
        minutesSinceLastInteraction += this.estimateSceneDuration(scene);
      }
    }
    
    // Step 3: Validate overall density
    const scenesWithInteractions = decisions
      .map((d, i) => ({ ...scenes[i], interactionType: d.prescription?.type || "None" }));
    
    const densityValidation = this.densityManager.validateDensity(
      scenesWithInteractions as Scene[],
      densityProfile
    );
    
    console.log("   ✅ Interaction decisions made:", decisions.filter(d => d.prescription?.needed).length);
    console.log("   ✅ Density validation:", densityValidation.isValid ? "PASS" : "NEEDS ADJUSTMENT");
    
    if (!densityValidation.isValid) {
      console.log("   ⚠️  Density issues:", densityValidation.issues);
      // Could implement auto-adjustment here
    }
    
    // Step 4: Apply specific interaction distribution if specified
    const distribution = request.phase2Config?.interactionDistribution;
    if (distribution) {
      const distributedDecisions = this.enforceInteractionDistribution(decisions, distribution, scenes);
      console.log(`   🎯 Applied interaction distribution:`, distribution);
      return distributedDecisions;
    }
    
    // Step 5: Apply maxInteractions limit if specified (fallback)
    const maxInteractions = request.phase2Config?.maxInteractions;
    if (maxInteractions && maxInteractions > 0) {
      const limitedDecisions = this.limitToTopInteractions(decisions, maxInteractions);
      console.log(`   🎯 Applied maxInteractions limit: ${decisions.filter(d => d.prescription?.needed).length} → ${limitedDecisions.filter(d => d.prescription?.needed).length}`);
      return limitedDecisions;
    }
    
    return decisions;
  }
  
  /**
   * Analyze single scene for interaction needs
   */
  private async analyzeSceneNeeds(
    scene: Scene,
    sceneIndex: number,
    totalScenes: number,
    minutesSinceLastInteraction: number,
    outcome: { outcome: string; bloomLevel: string } | null,
    previousScenes: Scene[],
    densityProfile: DensityProfile
  ): Promise<InteractionDecision> {
    // Skip welcome and summary scenes (usually)
    if (this.isWelcomeOrSummaryScene(scene)) {
      return {
        sceneId: `scene-${sceneIndex}`,
        prescription: null,
        appliedRules: [],
        alternativesConsidered: [],
        confidence: 0
      };
    }
    
    // Step 1: Get pedagogical recommendations from rules
    const ruleContext = {
      scene,
      sceneIndex,
      totalScenes,
      minutesSinceLastInteraction,
      outcomeBloomLevel: outcome?.bloomLevel,
      previousScenes
    };
    
    const applicableRules = this.ruleEngine.getApplicableRules(ruleContext);
    const ruleRecommendation = this.ruleEngine.getRecommendedInteraction(ruleContext);
    
    // Step 2: Check cognitive load constraints
    const sceneLoad = this.loadProtector.assessSceneLoad(scene);
    const cumulativeAssessment = this.loadProtector.assessCumulativeLoad([...previousScenes, scene]);
    
    // Step 3: Make decision
    let prescription: InteractionPrescription | null = null;
    let alternativesConsidered: InteractionType[] = [];
    let confidence = 0;
    
    if (ruleRecommendation && !cumulativeAssessment.overloadRisk) {
      // Estimate interaction load impact
      const interactionLoadImpact = this.estimateInteractionLoad(ruleRecommendation.type);
      
      // Validate it won't cause overload
      const loadValidation = this.loadProtector.validateInteractionAddition(
        scene,
        interactionLoadImpact,
        previousScenes
      );
      
      if (loadValidation.safe) {
        // Create prescription
        prescription = {
          needed: true,
          type: ruleRecommendation.type,
          purpose: ruleRecommendation.purpose,
          pedagogicalRationale: ruleRecommendation.rationale,
          timing: this.determineOptimalTiming(ruleRecommendation.type, sceneIndex, totalScenes),
          cognitiveLoadImpact: interactionLoadImpact,
          estimatedDuration: this.estimateInteractionDuration(ruleRecommendation.type),
          priority: this.determinePriority(ruleRecommendation.purpose, outcome)
        };
        
        confidence = this.calculateConfidence(applicableRules.length, loadValidation, densityProfile);
        
        // Track alternatives
        alternativesConsidered = applicableRules
          .slice(1, 4) // Top 3 alternatives
          .map(r => r.action.interactionType);
      } else {
        // Interaction desired but unsafe - consider simpler alternative
        const simplerType = this.getSimplerAlternative(ruleRecommendation.type);
        if (simplerType) {
          alternativesConsidered.push(ruleRecommendation.type, simplerType);
          
          const simplerLoadImpact = this.estimateInteractionLoad(simplerType);
          const simplerValidation = this.loadProtector.validateInteractionAddition(
            scene,
            simplerLoadImpact,
            previousScenes
          );
          
          if (simplerValidation.safe) {
            prescription = {
              needed: true,
              type: simplerType,
              purpose: ruleRecommendation.purpose,
              pedagogicalRationale: `${ruleRecommendation.rationale} (Simplified due to cognitive load)`,
              timing: "immediate",
              cognitiveLoadImpact: simplerLoadImpact,
              estimatedDuration: this.estimateInteractionDuration(simplerType),
              priority: "recommended"
            };
            
            confidence = 70; // Lower confidence for fallback
          }
        }
      }
    }
    
    return {
      sceneId: `scene-${sceneIndex}`,
      prescription,
      appliedRules: applicableRules.map(r => r.id),
      alternativesConsidered,
      confidence
    };
  }
  
  /**
   * Match scene to learning outcome
   */
  private matchSceneToOutcome(
    scene: Scene,
    outcomeMap: OutcomeMap
  ): { outcome: string; bloomLevel: string } | null {
    const sceneText = `${scene.pageTitle} ${scene.narrationScript}`.toLowerCase();
    
    for (const outcome of outcomeMap.outcomes) {
      // Extract key terms from outcome
      const outcomeTerms = outcome.outcome.toLowerCase().split(/\s+/)
        .filter(word => word.length > 4);
      
      // Check if scene mentions outcome terms
      const matches = outcomeTerms.filter(term => sceneText.includes(term));
      
      if (matches.length >= 2) { // At least 2 term matches
        return {
          outcome: outcome.outcome,
          bloomLevel: outcome.bloomLevel
        };
      }
    }
    
    return null;
  }
  
  /**
   * Determine optimal timing for interaction
   */
  private determineOptimalTiming(
    type: InteractionType,
    sceneIndex: number,
    totalScenes: number
  ): "immediate" | "delayed" | "spaced" {
    // Knowledge checks work best immediate
    if (type === "knowledgeCheck") return "immediate";
    
    // Scenarios/simulations can be delayed for spaced practice
    if (type === "scenario" || type === "simulation") {
      const progress = sceneIndex / totalScenes;
      return progress > 0.7 ? "immediate" : "delayed";
    }
    
    // Reflection benefits from spacing
    if (type === "reflection" || type === "journal") return "spaced";
    
    return "immediate";
  }
  
  /**
   * Determine interaction priority
   */
  private determinePriority(
    purpose: InteractionPurpose,
    outcome: { outcome: string; bloomLevel: string } | null
  ): "required" | "recommended" | "optional" {
    // Assessment and skill practice are required
    if (purpose === "assessment" || purpose === "skillPractice") return "required";
    
    // Application for Apply/Analyze outcomes is required
    if (purpose === "application" && outcome && 
        (outcome.bloomLevel === "Apply" || outcome.bloomLevel === "Analyze")) {
      return "required";
    }
    
    // Attention reset is recommended
    if (purpose === "attentionReset") return "recommended";
    
    // Everything else is optional
    return "optional";
  }
  
  /**
   * Calculate confidence score
   */
  private calculateConfidence(
    ruleCount: number,
    loadValidation: { safe: boolean; projectedLoad: number },
    densityProfile: DensityProfile
  ): number {
    let confidence = 50; // Base
    
    // More applicable rules = higher confidence
    confidence += Math.min(30, ruleCount * 10);
    
    // Safe load = higher confidence
    if (loadValidation.safe) {
      confidence += 20;
    }
    
    // Optimal load range = highest confidence
    if (loadValidation.projectedLoad >= 4 && loadValidation.projectedLoad <= 7) {
      confidence += 10;
    }
    
    return Math.min(100, confidence);
  }
  
  /**
   * Estimate interaction cognitive load impact
   */
  private estimateInteractionLoad(type: InteractionType): number {
    const loadMap: Record<InteractionType, number> = {
      knowledgeCheck: 2,
      reflection: 1,
      slider: 1,
      hotspot: 2,
      matchingActivity: 2,
      sortingActivity: 2,
      dragDrop: 3,
      scenario: 3,
      journal: 2,
      simulation: 4,
      branchingScenario: 4,
      none: 0
    };
    
    return loadMap[type] || 2;
  }
  
  /**
   * Estimate interaction duration (seconds)
   */
  private estimateInteractionDuration(type: InteractionType): number {
    const durationMap: Record<InteractionType, number> = {
      knowledgeCheck: 30,
      reflection: 45,
      slider: 20,
      hotspot: 30,
      matchingActivity: 45,
      sortingActivity: 45,
      dragDrop: 60,
      scenario: 90,
      journal: 120,
      simulation: 180,
      branchingScenario: 180,
      none: 0
    };
    
    return durationMap[type] || 60;
  }
  
  /**
   * Estimate scene duration (minutes)
   */
  private estimateSceneDuration(scene: Scene): number {
    const voWordCount = (scene.narrationScript || "").split(/\s+/).length;
    const minutes = voWordCount / 150; // Average reading speed
    return Math.max(1, minutes);
  }
  
  /**
   * Get simpler interaction alternative
   */
  private getSimplerAlternative(type: InteractionType): InteractionType | null {
    const simplifications: Record<InteractionType, InteractionType> = {
      branchingScenario: "scenario",
      simulation: "scenario",
      scenario: "knowledgeCheck",
      dragDrop: "matchingActivity",
      matchingActivity: "knowledgeCheck",
      sortingActivity: "knowledgeCheck",
      journal: "reflection",
      // Already simple
      knowledgeCheck: "knowledgeCheck",
      reflection: "reflection",
      slider: "slider",
      hotspot: "hotspot",
      none: "none"
    };
    
    const simpler = simplifications[type];
    return simpler !== type ? simpler : null;
  }
  
  /**
   * Check if scene is welcome or summary
   */
  private isWelcomeOrSummaryScene(scene: Scene): boolean {
    const title = scene.pageTitle.toLowerCase();
    return title.includes("welcome") ||
           title.includes("introduction") ||
           title.includes("summary") ||
           title.includes("conclusion") ||
           title.includes("next steps");
  }
  
  /**
   * Generate Click-to-Reveal interaction content using STRUCTURED JSON approach
   * Returns properly structured data instead of markdown string
   */
  async generateClickToRevealContent(
    scene: Scene,
    prescription: InteractionPrescription,
    request: LearningRequest
  ): Promise<ClickToRevealInteraction> {
    console.log(`   🎨 Generating Click-to-Reveal structure for: ${scene.pageTitle}`);
    
    const tone = this.determineTone(request);
    
    const templatePrompt = `${resetHeader}

CREATE A CLICK-TO-REVEAL INTERACTIVITY AS STRUCTURED JSON.

SCENE CONTEXT:
- Topic: ${request.topic}
- Scene Title: ${scene.pageTitle}
- Scene Content: ${scene.narrationScript || scene.onScreenText || ''}
- Learning Objective: ${request.learningOutcomes?.[0] || request.topic}
- Target Audience: ${request.targetAudience || 'Corporate employees'}
- Pedagogical Purpose: ${prescription.pedagogicalRationale}

REQUIRED JSON OUTPUT FORMAT:

{
  "type": "Click-to-Reveal",
  "tone": "${tone}",
  "instruction": "[Write invitation text: 'Click each icon to explore...' or similar]",
  "contextVisuals": "[50-100 word description of screen layout, visual elements, learner scenario]",
  "reveals": [
    {
      "label": "[Short label like 'Principle 1' or 'Key Concept']",
      "text": "[EXACT on-screen text that appears when clicked - 2-3 sentences]",
      "voiceOver": "[EXACT voice-over script - conversational, 20-30 words]",
      "animation": "[Brief description: fade in, slide up, highlight, etc.]"
    },
    {
      "label": "[Second clickable element label]",
      "text": "[EXACT on-screen text for reveal 2]",
      "voiceOver": "[EXACT voice-over script for reveal 2]",
      "animation": "[Animation description for reveal 2]"
    },
    {
      "label": "[Third clickable element label]",
      "text": "[EXACT on-screen text for reveal 3]",
      "voiceOver": "[EXACT voice-over script for reveal 3]",
      "animation": "[Animation description for reveal 3]"
    }
  ],
  "developerNotes": "[Technical notes: timing, accessibility, keyboard nav, audio sync]"
}

CRITICAL RULES:
- Output ONLY valid JSON (no markdown, no explanations)
- Include 3-5 reveals (minimum 2, maximum 8)
- All text must be developer-ready (no placeholders)
- Each reveal must have all 4 fields: label, text, voiceOver, animation
- Tone: ${tone}
- Target: ${request.targetAudience || 'corporate employees'}
- Duration: ~${prescription.estimatedDuration || 60} seconds total
- Purpose: ${prescription.purpose}
`;

    try {
      const response = await openaiChat({
        systemKey: "interactivity_designer_json",
        user: templatePrompt
      });
      
      // Parse JSON response
      const parsed: ClickToRevealInteraction = safeJSONParse(response);
      
      // Validate structure
      this.validateClickToRevealStructure(parsed);
      
      console.log(`   ✅ Click-to-Reveal structure generated: ${parsed.reveals.length} panels`);
      return parsed;
      
    } catch (error) {
      console.error(`   ❌ Failed to generate Click-to-Reveal structure:`, error);
      // Return fallback template with minimal content
      return {
        ...clickToRevealTemplate,
        tone: tone as any,
        instruction: `Click each element to explore key concepts about ${scene.pageTitle}`,
        contextVisuals: `Interactive exploration of ${scene.pageTitle}`,
        reveals: [
          {
            label: "Concept 1",
            text: "First key concept (auto-generated fallback)",
            voiceOver: "This is the first key concept.",
            animation: "Fade in"
          },
          {
            label: "Concept 2",
            text: "Second key concept (auto-generated fallback)",
            voiceOver: "This is the second key concept.",
            animation: "Fade in"
          },
          {
            label: "Concept 3",
            text: "Third key concept (auto-generated fallback)",
            voiceOver: "This is the third key concept.",
            animation: "Fade in"
          }
        ],
        developerNotes: "Fallback content - consider regenerating for production."
      };
    }
  }
  
  /**
   * Generate Drag-and-Drop Matching interaction content
   */
  async generateDragAndDropMatchingContent(
    scene: Scene,
    prescription: InteractionPrescription,
    request: LearningRequest
  ): Promise<DragAndDropMatching> {
    console.log(`   🎨 Generating Drag-and-Drop Matching structure for: ${scene.pageTitle}`);
    
    const tone = this.determineTone(request);
    
    const templatePrompt = `${resetHeader}

CREATE A DRAG-AND-DROP MATCHING INTERACTIVITY AS STRUCTURED JSON.

SCENE CONTEXT:
- Topic: ${request.topic}
- Scene Title: ${scene.pageTitle}
- Scene Content: ${scene.narrationScript || scene.onScreenText || ''}
- Learning Objective: ${request.learningOutcomes?.[0] || request.topic}
- Target Audience: ${request.targetAudience || 'Corporate employees'}
- Pedagogical Purpose: ${prescription.pedagogicalRationale}

REQUIRED JSON OUTPUT FORMAT:

{
  "type": "DragAndDrop-Matching",
  "tone": "${tone}",
  "instruction": "[Clear instruction: 'Drag each item to its correct category' or similar]",
  "items": [
    {
      "id": "item1",
      "label": "[Specific item to be matched - e.g., 'Customer Complaint']",
      "correctTarget": "target1"
    },
    {
      "id": "item2", 
      "label": "[Second item to be matched]",
      "correctTarget": "target2"
    },
    {
      "id": "item3",
      "label": "[Third item to be matched]",
      "correctTarget": "target1"
    },
    {
      "id": "item4",
      "label": "[Fourth item to be matched]",
      "correctTarget": "target2"
    }
  ],
  "targets": [
    {
      "id": "target1",
      "label": "[Category name - e.g., 'Immediate Response']"
    },
    {
      "id": "target2",
      "label": "[Second category name - e.g., 'Follow-up Required']"
    }
  ],
  "feedback": {
    "correct": "[Encouraging message for correct matches]",
    "incorrect": "[Helpful message for incorrect matches]"
  },
  "developerNotes": "[Technical notes: drag-and-drop implementation, accessibility, visual feedback]"
}

CRITICAL RULES:
- Output ONLY valid JSON (no markdown, no explanations)
- Include 3-5 items to drag (minimum 3, maximum 6)
- Include 2-3 target categories (minimum 2, maximum 4)
- Each item must have correctTarget that matches a target id
- All text must be developer-ready (no placeholders)
- Tone: ${tone}
- Target: ${request.targetAudience || 'corporate employees'}
- Duration: ~${prescription.estimatedDuration || 60} seconds total
- Purpose: ${prescription.purpose}
`;

    try {
      const response = await openaiChat({
        systemKey: "interactivity_designer_json",
        user: templatePrompt
      });
      
      const parsed: DragAndDropMatching = safeJSONParse(response);
      this.validateDragAndDropMatchingStructure(parsed);
      
      console.log(`   ✅ Drag-and-Drop Matching structure generated: ${parsed.items.length} items, ${parsed.targets.length} targets`);
      return parsed;
      
    } catch (error) {
      console.error(`   ❌ Failed to generate Drag-and-Drop Matching structure:`, error);
      return {
        ...dragAndDropMatchingTemplate,
        tone: tone as any,
        instruction: `Drag each item to its correct category related to ${scene.pageTitle}`,
        developerNotes: "Fallback content - consider regenerating for production."
      };
    }
  }

  /**
   * Generate Drag-and-Drop Sequencing interaction content
   */
  async generateDragAndDropSequencingContent(
    scene: Scene,
    prescription: InteractionPrescription,
    request: LearningRequest
  ): Promise<DragAndDropSequencing> {
    console.log(`   🎨 Generating Drag-and-Drop Sequencing structure for: ${scene.pageTitle}`);
    
    const tone = this.determineTone(request);
    
    const templatePrompt = `${resetHeader}

CREATE A DRAG-AND-DROP SEQUENCING INTERACTIVITY AS STRUCTURED JSON.

SCENE CONTEXT:
- Topic: ${request.topic}
- Scene Title: ${scene.pageTitle}
- Scene Content: ${scene.narrationScript || scene.onScreenText || ''}
- Learning Objective: ${request.learningOutcomes?.[0] || request.topic}
- Target Audience: ${request.targetAudience || 'Corporate employees'}
- Pedagogical Purpose: ${prescription.pedagogicalRationale}

REQUIRED JSON OUTPUT FORMAT:

{
  "type": "DragAndDrop-Sequencing",
  "tone": "${tone}",
  "instruction": "[Clear instruction: 'Arrange the steps in the correct order' or similar]",
  "items": [
    {
      "id": "step1",
      "label": "[First step in the sequence - e.g., 'Identify the problem']",
      "correctOrder": 1
    },
    {
      "id": "step2",
      "label": "[Second step in the sequence - e.g., 'Gather information']",
      "correctOrder": 2
    },
    {
      "id": "step3",
      "label": "[Third step in the sequence - e.g., 'Analyze options']",
      "correctOrder": 3
    },
    {
      "id": "step4",
      "label": "[Fourth step in the sequence - e.g., 'Implement solution']",
      "correctOrder": 4
    },
    {
      "id": "step5",
      "label": "[Fifth step in the sequence - e.g., 'Monitor results']",
      "correctOrder": 5
    }
  ],
  "feedback": {
    "correct": "[Encouraging message for correct sequence]",
    "incorrect": "[Helpful message for incorrect sequence]"
  },
  "developerNotes": "[Technical notes: numbered placeholders, drag-and-drop reordering, submit button, accessibility]"
}

CRITICAL RULES:
- Output ONLY valid JSON (no markdown, no explanations)
- Include 3-6 steps to sequence (minimum 3, maximum 8)
- Each item must have correctOrder (1, 2, 3, etc.)
- All text must be developer-ready (no placeholders)
- Steps should be logically sequential
- Tone: ${tone}
- Target: ${request.targetAudience || 'corporate employees'}
- Duration: ~${prescription.estimatedDuration || 75} seconds total
- Purpose: ${prescription.purpose}
`;

    try {
      const response = await openaiChat({
        systemKey: "interactivity_designer_json",
        user: templatePrompt
      });
      
      const parsed: DragAndDropSequencing = safeJSONParse(response);
      this.validateDragAndDropSequencingStructure(parsed);
      
      console.log(`   ✅ Drag-and-Drop Sequencing structure generated: ${parsed.items.length} steps`);
      return parsed;
      
    } catch (error) {
      console.error(`   ❌ Failed to generate Drag-and-Drop Sequencing structure:`, error);
      return {
        ...dragAndDropSequencingTemplate,
        tone: tone as any,
        instruction: `Arrange the steps in the correct order for ${scene.pageTitle}`,
        developerNotes: "Fallback content - consider regenerating for production."
      };
    }
  }

  /**
   * Validate that the generated Click-to-Reveal has proper structure
   */
  private validateClickToRevealStructure(interaction: ClickToRevealInteraction): void {
    if (!interaction.type || interaction.type !== "Click-to-Reveal") {
      throw new Error(`Invalid interaction type: ${interaction.type}`);
    }
    
    if (!interaction.reveals || !Array.isArray(interaction.reveals)) {
      throw new Error(`Missing or invalid reveals array`);
    }
    
    if (interaction.reveals.length < 2) {
      throw new Error(`Click-to-Reveal must have at least 2 reveals, found ${interaction.reveals.length}`);
    }
    
    if (interaction.reveals.length > 8) {
      console.warn(`   ⚠️  Warning: ${interaction.reveals.length} reveals may be too many (max recommended: 8)`);
    }
    
    // Validate each reveal panel
    interaction.reveals.forEach((reveal, index) => {
      if (!reveal.label || reveal.label.trim() === '') {
        throw new Error(`Reveal ${index + 1} is missing label`);
      }
      if (!reveal.text || reveal.text.trim() === '') {
        throw new Error(`Reveal ${index + 1} is missing text content`);
      }
      // voiceOver and animation are optional but recommended
      if (!reveal.voiceOver) {
        console.warn(`   ⚠️  Reveal ${index + 1} missing voiceOver (recommended)`);
      }
    });
    
    if (!interaction.instruction || interaction.instruction.trim() === '') {
      throw new Error(`Missing instruction text`);
    }
    
    console.log(`   ✅ Structure validated: ${interaction.reveals.length} panels, tone: ${interaction.tone}`);
  }

  /**
   * Validate that the generated Drag-and-Drop Matching has proper structure
   */
  private validateDragAndDropMatchingStructure(interaction: DragAndDropMatching): void {
    if (!interaction.type || interaction.type !== "DragAndDrop-Matching") {
      throw new Error(`Invalid interaction type: ${interaction.type}`);
    }
    
    if (!interaction.items || !Array.isArray(interaction.items)) {
      throw new Error(`Missing or invalid items array`);
    }
    
    if (!interaction.targets || !Array.isArray(interaction.targets)) {
      throw new Error(`Missing or invalid targets array`);
    }
    
    if (interaction.items.length < 3) {
      throw new Error(`Drag-and-Drop Matching must have at least 3 items, found ${interaction.items.length}`);
    }
    
    if (interaction.items.length > 6) {
      console.warn(`   ⚠️  Warning: ${interaction.items.length} items may be too many (max recommended: 6)`);
    }
    
    if (interaction.targets.length < 2) {
      throw new Error(`Drag-and-Drop Matching must have at least 2 targets, found ${interaction.targets.length}`);
    }
    
    // Validate each item has a valid target
    interaction.items.forEach((item, index) => {
      if (!item.id || !item.label) {
        throw new Error(`Item ${index + 1} is missing id or label`);
      }
      if (!interaction.targets.find(target => target.id === item.correctTarget)) {
        throw new Error(`Item ${index + 1} has invalid correctTarget: ${item.correctTarget}`);
      }
    });
    
    // Validate each target
    interaction.targets.forEach((target, index) => {
      if (!target.id || !target.label) {
        throw new Error(`Target ${index + 1} is missing id or label`);
      }
    });
    
    console.log(`   ✅ Structure validated: ${interaction.items.length} items, ${interaction.targets.length} targets, tone: ${interaction.tone}`);
  }

  /**
   * Validate that the generated Drag-and-Drop Sequencing has proper structure
   */
  private validateDragAndDropSequencingStructure(interaction: DragAndDropSequencing): void {
    if (!interaction.type || interaction.type !== "DragAndDrop-Sequencing") {
      throw new Error(`Invalid interaction type: ${interaction.type}`);
    }
    
    if (!interaction.items || !Array.isArray(interaction.items)) {
      throw new Error(`Missing or invalid items array`);
    }
    
    if (interaction.items.length < 3) {
      throw new Error(`Drag-and-Drop Sequencing must have at least 3 items, found ${interaction.items.length}`);
    }
    
    if (interaction.items.length > 8) {
      console.warn(`   ⚠️  Warning: ${interaction.items.length} items may be too many (max recommended: 8)`);
    }
    
    // Validate each item has correct order
    interaction.items.forEach((item, index) => {
      if (!item.id || !item.label) {
        throw new Error(`Item ${index + 1} is missing id or label`);
      }
      if (typeof item.correctOrder !== 'number' || item.correctOrder < 1) {
        throw new Error(`Item ${index + 1} has invalid correctOrder: ${item.correctOrder}`);
      }
    });
    
    // Check for sequential order (1, 2, 3, etc.)
    const orders = interaction.items.map(item => item.correctOrder).sort((a, b) => a - b);
    for (let i = 0; i < orders.length; i++) {
      if (orders[i] !== i + 1) {
        throw new Error(`Items must have sequential order starting from 1, found gaps or duplicates`);
      }
    }
    
    console.log(`   ✅ Structure validated: ${interaction.items.length} steps, tone: ${interaction.tone}`);
  }
  
  /**
   * Enforce specific interaction distribution across scenes
   * Ensures exactly the requested number of each interaction type
   */
  private enforceInteractionDistribution(
    decisions: InteractionDecision[],
    distribution: {
      clickToReveal?: number;
      dragDropMatching?: number;
      dragDropSequencing?: number;
    },
    scenes: Scene[]
  ): InteractionDecision[] {
    console.log(`   🎯 Enforcing interaction distribution:`, distribution);
    
    const result: InteractionDecision[] = [];
    const targetCounts = {
      clickToReveal: distribution.clickToReveal || 0,
      dragDropMatching: distribution.dragDropMatching || 0,
      dragDropSequencing: distribution.dragDropSequencing || 0
    };
    
    const actualCounts = {
      clickToReveal: 0,
      dragDropMatching: 0,
      dragDropSequencing: 0
    };
    
    // First pass: Keep existing interactions that match our targets
    for (let i = 0; i < decisions.length; i++) {
      const decision = decisions[i];
      const scene = scenes[i];
      
      if (!decision.prescription?.needed) {
        // No interaction needed - keep as is
        result.push(decision);
        continue;
      }
      
      const currentType = decision.prescription.type;
      
      // Check if this interaction type is still needed
      if (currentType === "Click-to-Reveal" && actualCounts.clickToReveal < targetCounts.clickToReveal) {
        actualCounts.clickToReveal++;
        result.push(decision);
      } else if (currentType === "DragAndDrop-Matching" && actualCounts.dragDropMatching < targetCounts.dragDropMatching) {
        actualCounts.dragDropMatching++;
        result.push(decision);
      } else if (currentType === "DragAndDrop-Sequencing" && actualCounts.dragDropSequencing < targetCounts.dragDropSequencing) {
        actualCounts.dragDropSequencing++;
        result.push(decision);
      } else {
        // This interaction type is not needed - remove it
        result.push({
          ...decision,
          prescription: null
        });
      }
    }
    
    // Second pass: Add missing interactions to reach target counts
    const missingCounts = {
      clickToReveal: targetCounts.clickToReveal - actualCounts.clickToReveal,
      dragDropMatching: targetCounts.dragDropMatching - actualCounts.dragDropMatching,
      dragDropSequencing: targetCounts.dragDropSequencing - actualCounts.dragDropSequencing
    };
    
    console.log(`   📊 Current counts:`, actualCounts);
    console.log(`   📊 Missing counts:`, missingCounts);
    
    // Find best scenes for missing interactions
    const availableScenes = result
      .map((decision, index) => ({ decision, index, scene: scenes[index] }))
      .filter(item => !item.decision.prescription?.needed); // Scenes without interactions
    
    let sceneIndex = 0;
    
    // Add missing Click-to-Reveal interactions
    for (let i = 0; i < missingCounts.clickToReveal && sceneIndex < availableScenes.length; i++) {
      const sceneItem = availableScenes[sceneIndex];
      result[sceneItem.index] = this.createInteractionDecision(
        sceneItem.scene,
        sceneItem.index,
        scenes.length,
        "Click-to-Reveal",
        "knowledgeReinforcement"
      );
      sceneIndex++;
    }
    
    // Add missing Drag-and-Drop Matching interactions
    for (let i = 0; i < missingCounts.dragDropMatching && sceneIndex < availableScenes.length; i++) {
      const sceneItem = availableScenes[sceneIndex];
      result[sceneItem.index] = this.createInteractionDecision(
        sceneItem.scene,
        sceneItem.index,
        scenes.length,
        "DragAndDrop-Matching",
        "knowledgeReinforcement"
      );
      sceneIndex++;
    }
    
    // Add missing Drag-and-Drop Sequencing interactions
    for (let i = 0; i < missingCounts.dragDropSequencing && sceneIndex < availableScenes.length; i++) {
      const sceneItem = availableScenes[sceneIndex];
      result[sceneItem.index] = this.createInteractionDecision(
        sceneItem.scene,
        sceneItem.index,
        scenes.length,
        "DragAndDrop-Sequencing",
        "knowledgeReinforcement"
      );
      sceneIndex++;
    }
    
    // Log final distribution
    const finalCounts = {
      clickToReveal: result.filter(d => d.prescription?.type === "Click-to-Reveal").length,
      dragDropMatching: result.filter(d => d.prescription?.type === "DragAndDrop-Matching").length,
      dragDropSequencing: result.filter(d => d.prescription?.type === "DragAndDrop-Sequencing").length
    };
    
    console.log(`   ✅ Final interaction distribution:`, finalCounts);
    
    return result;
  }
  
  /**
   * Create an interaction decision for a specific type
   */
  private createInteractionDecision(
    scene: Scene,
    sceneIndex: number,
    totalScenes: number,
    type: InteractionType,
    purpose: InteractionPurpose
  ): InteractionDecision {
    return {
      sceneIndex,
      prescription: {
        needed: true,
        type,
        purpose,
        pedagogicalRationale: `Required ${type} interaction for balanced learning experience`,
        estimatedDuration: 60, // Default duration
        priority: 'high',
        timing: 'immediate',
        cognitiveLoadImpact: 'moderate'
      },
      confidence: 0.8, // High confidence for required interactions
      alternativesConsidered: [],
      reasoning: `Added ${type} interaction to meet distribution requirements`
    };
  }

  /**
   * Limit interactions to the top N most important ones
   * Selects based on priority and confidence scores
   */
  private limitToTopInteractions(
    decisions: InteractionDecision[],
    maxInteractions: number
  ): InteractionDecision[] {
    // Separate decisions into those with and without prescriptions
    const withPrescriptions = decisions
      .map((decision, index) => ({ decision, index }))
      .filter(item => item.decision.prescription?.needed);
    
    const withoutPrescriptions = decisions
      .map((decision, index) => ({ decision, index }))
      .filter(item => !item.decision.prescription?.needed);
    
    // If we already have fewer than max, return as-is
    if (withPrescriptions.length <= maxInteractions) {
      return decisions;
    }
    
    // Score each prescription based on priority and confidence
    const scored = withPrescriptions.map(item => {
      const prescription = item.decision.prescription!;
      const priorityScore = prescription.priority === 'critical' ? 100 
                          : prescription.priority === 'high' ? 75 
                          : prescription.priority === 'medium' ? 50 
                          : 25;
      const confidenceScore = item.decision.confidence;
      const totalScore = (priorityScore + confidenceScore) / 2;
      
      return { ...item, score: totalScore };
    });
    
    // Sort by score (highest first) and take top N
    const topInteractions = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, maxInteractions);
    
    // Build final decisions array
    const result: InteractionDecision[] = [];
    
    for (let i = 0; i < decisions.length; i++) {
      const isTopInteraction = topInteractions.some(item => item.index === i);
      
      if (isTopInteraction) {
        result.push(decisions[i]); // Keep the interaction
      } else {
        // Remove the prescription (make it non-interactive)
        result.push({
          ...decisions[i],
          prescription: null
        });
      }
    }
    
    return result;
  }
  
  /**
   * Determine tone based on request parameters
   */
  private determineTone(request: LearningRequest): string {
    // Check if tone is specified in request
    if (request.tone) {
      return request.tone;
    }
    
    // Infer from module type
    const moduleType = request.moduleType;
    if (moduleType === 'awareness') return 'conversational';
    if (moduleType === 'skillBuilding') return 'instructive';
    if (moduleType === 'application') return 'scenario-based';
    if (moduleType === 'immersive') return 'scenario-based';
    
    // Default to professional
    return 'professional';
  }
}

