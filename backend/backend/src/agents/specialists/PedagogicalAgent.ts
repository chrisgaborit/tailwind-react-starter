// backend/src/agents/specialists/PedagogicalAgent.ts

/**
 * PedagogicalAgent - Specialist Agent
 * 
 * Designs learning paths using learning science principles
 * Creates pedagogically-sound scene sequences with proper scaffolding
 * 
 * Key Capabilities:
 * - 5-scene sequence per learning objective: TEACH → SHOW → APPLY → CHECK → REFLECT
 * - Bloom's taxonomy mapping to scene types
 * - Cognitive load management
 * - Scaffolding strategies for first-time learners
 * - Pedagogical validation and soundness checks
 */

import { openaiChat } from "../../services/openaiGateway";
import { safeJSONParse } from "../../utils/safeJSONParse";
import { DetectedFramework } from "./ContentExtractionAgent";

/**
 * Bloom's Taxonomy Levels
 */
export type BloomLevel = "Remember" | "Understand" | "Apply" | "Analyze" | "Evaluate" | "Create";

/**
 * Scene types in the 5-scene sequence
 */
export type SceneType = "TEACH" | "SHOW" | "APPLY" | "CHECK" | "REFLECT";

/**
 * Learning path design result
 */
export interface LearningPath {
  objectiveIndex: number;
  learningObjective: string;
  bloomLevel: BloomLevel;
  scenes: SceneDesign[];
  pedagogicalRationale: string;
  cognitiveLoadProfile: CognitiveLoadProfile;
  validation: PedagogicalValidation;
}

export interface SceneDesign {
  sceneType: SceneType;
  bloomLevel: BloomLevel;
  bloomProgression: string; // e.g., "Understand→Apply"
  title: string;
  contentStructure: ContentStructure;
  scaffoldingStrategies: string[];
  assessmentLinks: string[];
  learningScienceRationale: LearningScienceRationale;
  cognitiveLoad: "Low" | "Medium" | "High";
  estimatedDuration: number; // seconds
  interactionType?: string;
  visualMetaphor?: string;
  emotionalContext?: string;
}

export interface ContentStructure {
  pattern: "Concept→Definition→Examples" | "Problem→Solution→Steps" | "Problem→Cause→Illustration→Application" | "Question→Answer→Application" | "Example→Rule→Practice";
  components: ContentComponent[];
  bridgeToNext?: string;
}

export interface ContentComponent {
  type: "Problem" | "Cause" | "Illustration" | "Application" | "Concept" | "Definition" | "Examples" | "Solution" | "Steps" | "Question" | "Answer" | "Rule" | "Practice";
  content: string;
  visualCue?: string;
}

export interface LearningScienceRationale {
  dualCoding: string; // How visual + verbal work together
  cognitiveLoad: string; // Load management strategy
  scaffolding: string; // Support mechanisms
  activeLearning: string; // How learners engage
  retrievalPractice?: string; // For CHECK scenes
  metacognition?: string; // For REFLECT scenes
}

export interface CognitiveLoadProfile {
  intrinsic: "Low" | "Medium" | "High"; // Content complexity
  extraneous: "Low" | "Medium" | "High"; // Presentation issues
  germane: "Low" | "Medium" | "High"; // Schema building
  overall: "Low" | "Medium" | "High";
  recommendations: string[];
}

export interface PedagogicalValidation {
  bloomProgressionValid: boolean;
  cognitiveLoadAppropriate: boolean;
  scaffoldingAdequate: boolean;
  firstSceneZeroKnowledge: boolean;
  issues: string[];
  strengths: string[];
  score: number; // 0-100
}

/**
 * Scene specification for design
 */
export interface SceneSpecification {
  sceneType: SceneType;
  learningObjective: string;
  objectiveIndex: number;
  framework?: DetectedFramework | null;
  previousConcepts?: string[];
  audience: string;
  complexity: "Level1" | "Level2" | "Level3" | "Level4";
}

export class PedagogicalAgent {
  
  /**
   * Design learning path for a learning objective
   * Creates 5-scene sequence: TEACH → SHOW → APPLY → CHECK → REFLECT
   */
  async designLearningPath(
    learningObjective: string,
    objectiveIndex: number,
    framework: DetectedFramework | null,
    audience: string,
    complexity: "Level1" | "Level2" | "Level3" | "Level4",
    topic: string
  ): Promise<LearningPath> {
    console.log(`🎓 PedagogicalAgent: Designing learning path for LO${objectiveIndex + 1}`);
    console.log(`   📖 Objective: ${learningObjective.substring(0, 60)}...`);
    console.log(`   🎯 Framework: ${framework?.name || "None"}`);
    console.log(`   👥 Audience: ${audience}`);
    console.log(`   📊 Complexity: ${complexity}`);
    
    // Determine Bloom's level from objective
    const bloomLevel = this.inferBloomLevel(learningObjective);
    console.log(`   🧠 Bloom's Level: ${bloomLevel}`);
    
    // Design 5 scenes
    const scenes: SceneDesign[] = [];
    
    // SCENE 1: TEACH
    console.log(`   🎬 Designing TEACH scene...`);
    const teachScene = await this.designScene({
      sceneType: "TEACH",
      learningObjective,
      objectiveIndex,
      framework,
      previousConcepts: [],
      audience,
      complexity
    }, topic, true); // First scene = zero prior knowledge
    scenes.push(teachScene);
    
    // SCENE 2: SHOW
    console.log(`   🎬 Designing SHOW scene...`);
    const showScene = await this.designScene({
      sceneType: "SHOW",
      learningObjective,
      objectiveIndex,
      framework,
      previousConcepts: teachScene.contentStructure.components.map(c => c.content).slice(0, 3),
      audience,
      complexity
    }, topic, false);
    scenes.push(showScene);
    
    // SCENE 3: APPLY
    console.log(`   🎬 Designing APPLY scene...`);
    const applyScene = await this.designScene({
      sceneType: "APPLY",
      learningObjective,
      objectiveIndex,
      framework,
      previousConcepts: [
        ...teachScene.contentStructure.components.map(c => c.content).slice(0, 2),
        ...showScene.contentStructure.components.map(c => c.content).slice(0, 2)
      ],
      audience,
      complexity
    }, topic, false);
    scenes.push(applyScene);
    
    // SCENE 4: CHECK
    console.log(`   🎬 Designing CHECK scene...`);
    const checkScene = await this.designScene({
      sceneType: "CHECK",
      learningObjective,
      objectiveIndex,
      framework,
      previousConcepts: [
        ...teachScene.contentStructure.components.map(c => c.content),
        ...showScene.contentStructure.components.map(c => c.content),
        ...applyScene.contentStructure.components.map(c => c.content)
      ].slice(0, 5),
      audience,
      complexity
    }, topic, false);
    scenes.push(checkScene);
    
    // SCENE 5: REFLECT
    console.log(`   🎬 Designing REFLECT scene...`);
    const reflectScene = await this.designScene({
      sceneType: "REFLECT",
      learningObjective,
      objectiveIndex,
      framework,
      previousConcepts: scenes.flatMap(s => s.contentStructure.components.map(c => c.content)).slice(0, 7),
      audience,
      complexity
    }, topic, false);
    scenes.push(reflectScene);
    
    // Calculate cognitive load profile
    const cognitiveLoadProfile = this.calculateCognitiveLoadProfile(scenes, complexity);
    
    // Generate pedagogical rationale
    const pedagogicalRationale = this.generatePedagogicalRationale(scenes, bloomLevel, framework);
    
    // Validate pedagogical soundness
    const validation = this.validatePedagogicalSoundness(scenes, learningObjective, complexity);
    
    console.log(`   ✅ Learning path designed:`);
    console.log(`      🎬 Scenes: ${scenes.length}`);
    console.log(`      📊 Cognitive Load: ${cognitiveLoadProfile.overall}`);
    console.log(`      ✅ Validation Score: ${validation.score}/100`);
    
    return {
      objectiveIndex,
      learningObjective,
      bloomLevel,
      scenes,
      pedagogicalRationale,
      cognitiveLoadProfile,
      validation
    };
  }
  
  /**
   * Design individual scene with pedagogical structure
   */
  async designScene(
    spec: SceneSpecification,
    topic: string,
    isFirstScene: boolean = false
  ): Promise<SceneDesign> {
    console.log(`      📝 Designing ${spec.sceneType} scene...`);
    
    // Determine Bloom progression for this scene type
    const bloomMapping = this.getBloomMappingForSceneType(spec.sceneType);
    
    // Select content structure pattern
    const contentPattern = this.selectContentPattern(spec.sceneType, isFirstScene, spec.framework);
    
    // Generate scene design prompt
    const designPrompt = `
DESIGN ${spec.sceneType} SCENE

LEARNING OBJECTIVE: ${spec.learningObjective}
TOPIC: ${topic}
AUDIENCE: ${spec.audience}
COMPLEXITY: ${spec.complexity}
${spec.framework ? `FRAMEWORK: ${spec.framework.name}\n${spec.framework.components.map(c => `- ${c.name}: ${c.description}`).join('\n')}` : ''}
${isFirstScene ? '\n⚠️ FIRST TEACH SCENE - ASSUME ZERO PRIOR KNOWLEDGE' : ''}
${spec.previousConcepts && spec.previousConcepts.length > 0 ? `PREVIOUS CONCEPTS: ${spec.previousConcepts.join(', ')}` : ''}

SCENE TYPE REQUIREMENTS:
${this.getSceneTypeRequirements(spec.sceneType)}

BLOOM'S LEVEL: ${bloomMapping.bloomLevel}
BLOOM PROGRESSION: ${bloomMapping.progression}

CONTENT STRUCTURE PATTERN: ${contentPattern}

Return JSON with this structure:
{
  "title": "Scene title",
  "contentStructure": {
    "pattern": "${contentPattern}",
    "components": [
      {
        "type": "Component type",
        "content": "Component content",
        "visualCue": "Visual description"
      }
    ],
    "bridgeToNext": "How this connects to next concept"
  },
  "scaffoldingStrategies": ["strategy1", "strategy2", ...],
  "assessmentLinks": ["link1", "link2"],
  "learningScienceRationale": {
    "dualCoding": "How visual + verbal work together",
    "cognitiveLoad": "Load management strategy",
    "scaffolding": "Support mechanisms",
    "activeLearning": "How learners engage",
    ${spec.sceneType === "CHECK" ? '"retrievalPractice": "How retrieval supports learning",' : ''}
    ${spec.sceneType === "REFLECT" ? '"metacognition": "How reflection promotes metacognition",' : ''}
  },
  "cognitiveLoad": "Low|Medium|High",
  "estimatedDuration": 60-120,
  "interactionType": "${spec.sceneType === "SHOW" ? "Click-to-Reveal" : spec.sceneType === "APPLY" ? "DragDrop" : spec.sceneType === "CHECK" ? "MCQ" : "None"}",
  ${isFirstScene ? '"visualMetaphor": "Visual metaphor for concept",' : ''}
  ${isFirstScene ? '"emotionalContext": "Emotional hook or context",' : ''}
}

CRITICAL RULES:
- ${isFirstScene ? 'Assume zero prior knowledge - explain everything' : 'Build on previous concepts'}
- Use Problem → Cause → Illustration → Application structure for first TEACH scene
- Include visual metaphors and emotional context for first scene
- Ensure proper scaffolding for complexity level
- Link to assessment in CHECK scenes
- Promote metacognition in REFLECT scenes
    `.trim();
    
    try {
      const response = await openaiChat({
        systemKey: "master_blueprint",
        user: designPrompt
      });
      
      const parsed = safeJSONParse(response);
      
      if (!parsed || typeof parsed !== 'object') {
        return this.createFallbackSceneDesign(spec, bloomMapping, contentPattern);
      }
      
      // Ensure all required fields
      const sceneDesign: SceneDesign = {
        sceneType: spec.sceneType,
        bloomLevel: bloomMapping.bloomLevel,
        bloomProgression: bloomMapping.progression,
        title: parsed.title || `${spec.sceneType}: ${spec.learningObjective.substring(0, 50)}`,
        contentStructure: parsed.contentStructure || {
          pattern: contentPattern,
          components: []
        },
        scaffoldingStrategies: parsed.scaffoldingStrategies || this.getDefaultScaffolding(spec.complexity),
        assessmentLinks: parsed.assessmentLinks || [],
        learningScienceRationale: parsed.learningScienceRationale || this.getDefaultLearningScienceRationale(spec.sceneType),
        cognitiveLoad: parsed.cognitiveLoad || this.estimateCognitiveLoad(spec.sceneType, spec.complexity),
        estimatedDuration: parsed.estimatedDuration || this.estimateDuration(spec.sceneType),
        interactionType: parsed.interactionType,
        visualMetaphor: parsed.visualMetaphor,
        emotionalContext: parsed.emotionalContext
      };
      
      // Ensure first TEACH scene has required structure
      if (isFirstScene && spec.sceneType === "TEACH") {
        sceneDesign.contentStructure = this.ensureFirstSceneStructure(sceneDesign.contentStructure);
      }
      
      return sceneDesign;
      
    } catch (error) {
      console.error(`      ❌ Error designing ${spec.sceneType} scene:`, error);
      return this.createFallbackSceneDesign(spec, bloomMapping, contentPattern);
    }
  }
  
  /**
   * Validate pedagogical soundness
   */
  validatePedagogicalSoundness(
    scenes: SceneDesign[],
    learningObjective: string,
    complexity: "Level1" | "Level2" | "Level3" | "Level4"
  ): PedagogicalValidation {
    const issues: string[] = [];
    const strengths: string[] = [];
    
    // Check Bloom progression
    const bloomProgressionValid = this.validateBloomProgression(scenes);
    if (!bloomProgressionValid) {
      issues.push("Bloom's taxonomy progression is not logical");
    } else {
      strengths.push("Bloom's taxonomy progression is well-structured");
    }
    
    // Check cognitive load
    const cognitiveLoadAppropriate = this.validateCognitiveLoad(scenes, complexity);
    if (!cognitiveLoadAppropriate) {
      issues.push("Cognitive load may be too high for complexity level");
    } else {
      strengths.push("Cognitive load is appropriately managed");
    }
    
    // Check scaffolding
    const scaffoldingAdequate = this.validateScaffolding(scenes, complexity);
    if (!scaffoldingAdequate) {
      issues.push("Insufficient scaffolding for first-time learners");
    } else {
      strengths.push("Adequate scaffolding provided");
    }
    
    // Check first scene
    const firstScene = scenes.find(s => s.sceneType === "TEACH");
    const firstSceneZeroKnowledge = this.validateFirstScene(firstScene);
    if (!firstSceneZeroKnowledge) {
      issues.push("First TEACH scene does not assume zero prior knowledge");
    } else {
      strengths.push("First scene appropriately assumes zero prior knowledge");
    }
    
    // Calculate score
    const score = this.calculateValidationScore(issues, strengths);
    
    return {
      bloomProgressionValid,
      cognitiveLoadAppropriate,
      scaffoldingAdequate,
      firstSceneZeroKnowledge,
      issues,
      strengths,
      score
    };
  }
  
  // ========== HELPER METHODS ==========
  
  private inferBloomLevel(learningObjective: string): BloomLevel {
    const obj = learningObjective.toLowerCase();
    
    if (obj.match(/\b(remember|recall|identify|list|name|define)\b/)) return "Remember";
    if (obj.match(/\b(understand|explain|describe|summarize|interpret|classify)\b/)) return "Understand";
    if (obj.match(/\b(apply|demonstrate|use|implement|practice|execute)\b/)) return "Apply";
    if (obj.match(/\b(analyze|examine|compare|contrast|distinguish|investigate)\b/)) return "Analyze";
    if (obj.match(/\b(evaluate|assess|judge|critique|justify|recommend)\b/)) return "Evaluate";
    if (obj.match(/\b(create|design|develop|formulate|plan|construct)\b/)) return "Create";
    
    return "Understand"; // Default
  }
  
  private getBloomMappingForSceneType(sceneType: SceneType): { bloomLevel: BloomLevel; progression: string } {
    const mapping: Record<SceneType, { bloomLevel: BloomLevel; progression: string }> = {
      "TEACH": { bloomLevel: "Understand", progression: "Understand (concept explanation with examples)" },
      "SHOW": { bloomLevel: "Understand", progression: "Understand→Apply (click-to-reveal demonstration)" },
      "APPLY": { bloomLevel: "Apply", progression: "Apply→Analyze (drag-drop practice, scenarios)" },
      "CHECK": { bloomLevel: "Remember", progression: "Knowledge validation (2-question mini-quiz)" },
      "REFLECT": { bloomLevel: "Analyze", progression: "Analyze→Evaluate (personalization + bridge)" }
    };
    
    return mapping[sceneType];
  }
  
  private selectContentPattern(
    sceneType: SceneType,
    isFirstScene: boolean,
    framework: DetectedFramework | null
  ): "Concept→Definition→Examples" | "Problem→Solution→Steps" | "Problem→Cause→Illustration→Application" | "Question→Answer→Application" | "Example→Rule→Practice" {
    if (isFirstScene && sceneType === "TEACH") {
      return "Problem→Cause→Illustration→Application";
    }
    
    if (sceneType === "TEACH") {
      return framework ? "Concept→Definition→Examples" : "Problem→Solution→Steps";
    }
    
    if (sceneType === "SHOW") {
      return "Example→Rule→Practice";
    }
    
    if (sceneType === "APPLY") {
      return "Problem→Solution→Steps";
    }
    
    if (sceneType === "CHECK") {
      return "Question→Answer→Application";
    }
    
    if (sceneType === "REFLECT") {
      return "Concept→Definition→Examples";
    }
    
    return "Concept→Definition→Examples";
  }
  
  private getSceneTypeRequirements(sceneType: SceneType): string {
    const requirements: Record<SceneType, string> = {
      "TEACH": `
- Assume zero prior knowledge for first scene
- Use Problem → Cause → Illustration → Application structure
- Include visual metaphors and emotional context
- Bridge to next concept at end
- Explain concepts clearly with examples
      `.trim(),
      "SHOW": `
- Demonstrate concept in action
- Use click-to-reveal for progressive disclosure
- Show real-world application
- Connect to previous teaching
      `.trim(),
      "APPLY": `
- Provide hands-on practice
- Use drag-drop or scenario interactions
- Allow learners to apply knowledge
- Provide feedback
      `.trim(),
      "CHECK": `
- 2-question mini-quiz
- Validate understanding
- Test key concepts
- Provide immediate feedback
      `.trim(),
      "REFLECT": `
- Promote metacognition
- Personalize learning
- Bridge to next objective
- Encourage reflection
      `.trim()
    };
    
    return requirements[sceneType];
  }
  
  private ensureFirstSceneStructure(structure: ContentStructure): ContentStructure {
    // Ensure first scene has Problem → Cause → Illustration → Application
    if (structure.pattern !== "Problem→Cause→Illustration→Application") {
      structure.pattern = "Problem→Cause→Illustration→Application";
    }
    
    const requiredTypes = ["Problem", "Cause", "Illustration", "Application"];
    const existingTypes = structure.components.map(c => c.type);
    
    // Add missing components
    requiredTypes.forEach((type, index) => {
      if (!existingTypes.includes(type as any)) {
        structure.components.splice(index, 0, {
          type: type as any,
          content: `[${type} component to be filled]`,
          visualCue: `Visual for ${type}`
        });
      }
    });
    
    return structure;
  }
  
  private getDefaultScaffolding(complexity: "Level1" | "Level2" | "Level3" | "Level4"): string[] {
    const base = ["Glossary of key terms", "Analogies for complex concepts", "Multiple examples"];
    
    if (complexity === "Level3" || complexity === "Level4") {
      return [...base, "Progressive disclosure", "Worked examples", "Hints and guidance"];
    }
    
    return base;
  }
  
  private getDefaultLearningScienceRationale(sceneType: SceneType): LearningScienceRationale {
    return {
      dualCoding: "Visual and verbal information processed simultaneously",
      cognitiveLoad: "Managed through chunking and progressive disclosure",
      scaffolding: "Support provided through examples and guidance",
      activeLearning: "Learners engage through interactions and reflection",
      retrievalPractice: sceneType === "CHECK" ? "Retrieval strengthens memory" : undefined,
      metacognition: sceneType === "REFLECT" ? "Reflection promotes self-awareness" : undefined
    };
  }
  
  private estimateCognitiveLoad(
    sceneType: SceneType,
    complexity: "Level1" | "Level2" | "Level3" | "Level4"
  ): "Low" | "Medium" | "High" {
    const baseLoad: Record<SceneType, "Low" | "Medium" | "High"> = {
      "TEACH": "Medium",
      "SHOW": "Low",
      "APPLY": "High",
      "CHECK": "Low",
      "REFLECT": "Medium"
    };
    
    const load = baseLoad[sceneType];
    
    // Adjust for complexity
    if (complexity === "Level3" || complexity === "Level4") {
      if (load === "Low") return "Medium";
      if (load === "Medium") return "High";
    }
    
    return load;
  }
  
  private estimateDuration(sceneType: SceneType): number {
    const durations: Record<SceneType, number> = {
      "TEACH": 90,
      "SHOW": 60,
      "APPLY": 120,
      "CHECK": 45,
      "REFLECT": 60
    };
    
    return durations[sceneType];
  }
  
  private calculateCognitiveLoadProfile(
    scenes: SceneDesign[],
    complexity: "Level1" | "Level2" | "Level3" | "Level4"
  ): CognitiveLoadProfile {
    const loads = scenes.map(s => s.cognitiveLoad);
    const highCount = loads.filter(l => l === "High").length;
    const mediumCount = loads.filter(l => l === "Medium").length;
    
    // Intrinsic load based on complexity
    const intrinsic: "Low" | "Medium" | "High" = 
      complexity === "Level1" ? "Low" :
      complexity === "Level2" ? "Medium" :
      complexity === "Level3" ? "High" : "High";
    
    // Extraneous load - should be low with good design
    const extraneous: "Low" | "Medium" | "High" = highCount > 2 ? "Medium" : "Low";
    
    // Germane load - schema building
    const germane: "Low" | "Medium" | "High" = 
      scenes.some(s => s.sceneType === "APPLY" || s.sceneType === "REFLECT") ? "High" : "Medium";
    
    // Overall load
    const overall: "Low" | "Medium" | "High" = 
      highCount > 2 || intrinsic === "High" ? "High" :
      highCount > 0 || mediumCount > 2 ? "Medium" : "Low";
    
    const recommendations: string[] = [];
    if (overall === "High") {
      recommendations.push("Consider reducing cognitive load through chunking");
      recommendations.push("Add more scaffolding for complex concepts");
    }
    if (extraneous !== "Low") {
      recommendations.push("Reduce extraneous load through clearer presentation");
    }
    
    return {
      intrinsic,
      extraneous,
      germane,
      overall,
      recommendations
    };
  }
  
  private generatePedagogicalRationale(
    scenes: SceneDesign[],
    bloomLevel: BloomLevel,
    framework: DetectedFramework | null
  ): string {
    const rationale = `
This learning path follows a structured 5-scene sequence designed to promote deep understanding and application.

The sequence begins with TEACH (concept introduction), progresses to SHOW (demonstration), then APPLY (practice), 
validates with CHECK (assessment), and concludes with REFLECT (metacognition).

Each scene builds on the previous one, following Bloom's taxonomy progression from ${bloomLevel} to higher-order thinking.
${framework ? `The framework (${framework.name}) provides structure for teaching complex concepts.` : ''}

Cognitive load is managed through scaffolding, chunking, and progressive disclosure. The first scene assumes zero 
prior knowledge, ensuring all learners can access the content.
    `.trim();
    
    return rationale;
  }
  
  private validateBloomProgression(scenes: SceneDesign[]): boolean {
    const expectedOrder = ["TEACH", "SHOW", "APPLY", "CHECK", "REFLECT"];
    const sceneOrder = scenes.map(s => s.sceneType);
    
    // Check if order is correct
    for (let i = 0; i < expectedOrder.length; i++) {
      if (sceneOrder[i] !== expectedOrder[i]) {
        return false;
      }
    }
    
    // Check if Bloom levels progress appropriately
    const bloomLevels = scenes.map(s => s.bloomLevel);
    const bloomOrder = ["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"];
    
    // Allow for some flexibility but ensure progression
    let maxLevelIndex = 0;
    for (const level of bloomLevels) {
      const levelIndex = bloomOrder.indexOf(level);
      if (levelIndex < maxLevelIndex - 1) {
        return false; // Regression not allowed
      }
      maxLevelIndex = Math.max(maxLevelIndex, levelIndex);
    }
    
    return true;
  }
  
  private validateCognitiveLoad(
    scenes: SceneDesign[],
    complexity: "Level1" | "Level2" | "Level3" | "Level4"
  ): boolean {
    const highLoadScenes = scenes.filter(s => s.cognitiveLoad === "High").length;
    
    // Level1-2 should have fewer high-load scenes
    if ((complexity === "Level1" || complexity === "Level2") && highLoadScenes > 1) {
      return false;
    }
    
    // Level3-4 can have more but should be balanced
    if ((complexity === "Level3" || complexity === "Level4") && highLoadScenes > 3) {
      return false;
    }
    
    return true;
  }
  
  private validateScaffolding(
    scenes: SceneDesign[],
    complexity: "Level1" | "Level2" | "Level3" | "Level4"
  ): boolean {
    const firstScene = scenes.find(s => s.sceneType === "TEACH");
    if (!firstScene) return false;
    
    // Check if first scene has adequate scaffolding
    const scaffoldingCount = firstScene.scaffoldingStrategies.length;
    
    if (complexity === "Level3" || complexity === "Level4") {
      return scaffoldingCount >= 4;
    }
    
    return scaffoldingCount >= 3;
  }
  
  private validateFirstScene(firstScene?: SceneDesign): boolean {
    if (!firstScene || firstScene.sceneType !== "TEACH") return false;
    
    // Check if it has Problem → Cause → Illustration → Application structure
    if (firstScene.contentStructure.pattern !== "Problem→Cause→Illustration→Application") {
      return false;
    }
    
    // Check for visual metaphor and emotional context
    if (!firstScene.visualMetaphor || !firstScene.emotionalContext) {
      return false;
    }
    
    return true;
  }
  
  private calculateValidationScore(issues: string[], strengths: string[]): number {
    let score = 100;
    
    // Deduct points for issues
    score -= issues.length * 15;
    
    // Add points for strengths
    score += strengths.length * 5;
    
    return Math.max(0, Math.min(100, score));
  }
  
  private createFallbackSceneDesign(
    spec: SceneSpecification,
    bloomMapping: { bloomLevel: BloomLevel; progression: string },
    contentPattern: string
  ): SceneDesign {
    return {
      sceneType: spec.sceneType,
      bloomLevel: bloomMapping.bloomLevel,
      bloomProgression: bloomMapping.progression,
      title: `${spec.sceneType}: ${spec.learningObjective.substring(0, 50)}`,
      contentStructure: {
        pattern: contentPattern as any,
        components: [
          {
            type: "Concept" as any,
            content: `Teaching ${spec.learningObjective}`,
            visualCue: "Visual representation"
          }
        ]
      },
      scaffoldingStrategies: this.getDefaultScaffolding(spec.complexity),
      assessmentLinks: [],
      learningScienceRationale: this.getDefaultLearningScienceRationale(spec.sceneType),
      cognitiveLoad: this.estimateCognitiveLoad(spec.sceneType, spec.complexity),
      estimatedDuration: this.estimateDuration(spec.sceneType)
    };
  }
}

export default PedagogicalAgent;



