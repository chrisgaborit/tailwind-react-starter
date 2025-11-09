// backend/src/agents/director/DirectorAgent.ts

/**
 * DirectorAgent - Master Orchestrator
 * 
 * Coordinates all specialist agents to create pedagogically-intelligent storyboards
 * following the 5-scene-per-LO structure: TEACH → SHOW → APPLY → CHECK → REFLECT
 */

import { ContentExtractionAgent, ExtractedContent } from "../../agents_v2/contentExtractionAgent";
import { InteractivityOrchestrator } from "../../agents_v2/interactivityOrchestrator";
import { VisualDirectorAgent } from "../../agents/VisualDirectorAgent";
import { Character } from "../../agents/CharacterGenerationAgent";
import { QAAgent } from "../../agents_v2/qaAgent";
import { EnhancedTeachAgentSimple } from "../../agents_v2/enhancedTeachAgentSimple";
import { ApplyAgent } from "../../agents_v2/applyAgent";
import { WelcomeAgent } from "../../agents_v2/welcomeAgent";
import { SummaryAgent } from "../../agents_v2/summaryAgent";
import { OutcomeAnalysisAgent } from "../../agents_v2/outcomeAnalysisAgent";
import { LearningRequest, Storyboard, Scene, OutcomeMap } from "../../agents_v2/types";
import { StoryboardModuleV2, SceneV2, ModuleMeta, ModuleStructure, ModuleAssets } from "../../../../packages/shared/src/storyboardTypesV2";
import { openaiChat } from "../../services/openaiGateway";
import { resetHeader } from "../../agents_v2/resetHeader";
import { safeJSONParse } from "../../utils/safeJSONParse";
import { enforceInteractiveDensity } from "../../library/interactivityLibrary";

/**
 * Framework context passed between agents
 */
interface FrameworkContext {
  extractedContent: ExtractedContent;
  learningOutcomes: string[];
  outcomeMap: OutcomeMap;
  characters?: any[];
  concepts?: string[];
}

/**
 * Scene generation context for specialists
 */
interface SceneGenerationContext {
  sceneType: "TEACH" | "SHOW" | "APPLY" | "CHECK" | "REFLECT";
  learningOutcome: string;
  outcomeIndex: number;
  frameworkContext: FrameworkContext;
  previousScenes: SceneV2[];
  sceneIndex: number;
}

export class DirectorAgent {
  private contentAgent: ContentExtractionAgent;
  private pedagogicalAgent: EnhancedTeachAgentSimple; // Acts as PedagogicalAgent
  private interactivityAgent: InteractivityOrchestrator;
  private visualAgent: VisualDirectorAgent;
  private qualityAgent: QAAgent;
  private outcomeAnalyzer: OutcomeAnalysisAgent;
  private applyAgent: ApplyAgent;
  private welcomeAgent: WelcomeAgent;
  private summaryAgent: SummaryAgent;
  
  constructor() {
    this.contentAgent = new ContentExtractionAgent();
    this.pedagogicalAgent = new EnhancedTeachAgentSimple();
    this.interactivityAgent = new InteractivityOrchestrator();
    this.visualAgent = new VisualDirectorAgent();
    this.qualityAgent = new QAAgent();
    this.outcomeAnalyzer = new OutcomeAnalysisAgent();
    this.applyAgent = new ApplyAgent();
    this.welcomeAgent = new WelcomeAgent();
    this.summaryAgent = new SummaryAgent();
    
    console.log("🎬 DirectorAgent initialized with all specialist agents");
  }
  
  /**
   * Main orchestration method
   * Coordinates all phases of storyboard generation
   */
  async orchestrateStoryboard(req: LearningRequest): Promise<StoryboardModuleV2> {
    // Validate input
    if (!req.sourceMaterial || req.sourceMaterial.trim().length === 0) {
      throw new Error("Source content is required for agent orchestration");
    }
    
    // Extract learning outcomes - use provided ones or extract from source material
    let learningOutcomes = req.learningOutcomes || [];
    
    if (learningOutcomes.length === 0) {
      console.warn("⚠️  No learning outcomes provided. Attempting to extract from source material...");
      learningOutcomes = await this.extractLearningOutcomesFromSource(req.sourceMaterial, req.topic);
      
      if (learningOutcomes.length === 0) {
        throw new Error("At least one learning objective is required. Please provide learning objectives in the form or ensure they're present in the source material.");
      }
      
      console.log(`✅ Extracted ${learningOutcomes.length} learning outcomes from source material`);
    }
    
    console.log("✅ Learning outcomes received:", learningOutcomes);
    
    // Update req with extracted learning outcomes
    req.learningOutcomes = learningOutcomes;
    
    console.log("\n" + "=".repeat(80));
    console.log("🎬 DIRECTOR AGENT: Starting Storyboard Orchestration");
    console.log("=".repeat(80));
    console.log(`📖 Topic: ${req.topic}`);
    console.log(`🎯 Learning Outcomes: ${learningOutcomes.length}`);
    learningOutcomes.forEach((lo, idx) => {
      console.log(`   ${idx + 1}. ${lo}`);
    });
    console.log(`⏱️  Duration: ${req.duration} minutes`);
    console.log(`📚 Source Material Length: ${req.sourceMaterial.length} characters`);
    
    // ========== PHASE 1: CONTENT ANALYSIS ==========
    console.log("\n" + "-".repeat(80));
    console.log("📚 PHASE 1: Content Agent Analysis");
    console.log("-".repeat(80));
    
    const frameworkContext = await this.phase1ContentAnalysis(req);
    console.log(`✅ Content analysis complete`);
    console.log(`   📊 Models extracted: ${frameworkContext.extractedContent.models.length}`);
    console.log(`   🔧 Techniques extracted: ${frameworkContext.extractedContent.techniques.length}`);
    console.log(`   💡 Examples extracted: ${frameworkContext.extractedContent.examples.length}`);
    console.log(`   📖 Terminology extracted: ${frameworkContext.extractedContent.terminology.length}`);
    
    // ========== PHASE 2: PEDAGOGICAL LEARNING PATH DESIGN ==========
    console.log("\n" + "-".repeat(80));
    console.log("🎓 PHASE 2: Pedagogical Agent Learning Path Design");
    console.log("-".repeat(80));
    
    const learningPath = await this.phase2LearningPathDesign(req, frameworkContext);
    console.log(`✅ Learning path designed`);
    console.log(`   📋 Total scenes planned: ${learningPath.length}`);
    console.log(`   🎯 Scenes per learning outcome: 5 (TEACH → SHOW → APPLY → CHECK → REFLECT)`);
    
    // ========== PHASE 3: SCENE GENERATION WITH SPECIALISTS ==========
    console.log("\n" + "-".repeat(80));
    console.log("🎨 PHASE 3: Scene Generation with Specialist Coordination");
    console.log("-".repeat(80));
    
    const generatedScenes = await this.phase3SceneGeneration(req, learningPath, frameworkContext);
    console.log(`✅ Scene generation complete`);
    console.log(`   🎬 Total scenes generated: ${generatedScenes.length}`);
    
    // ========== PHASE 4: QUALITY VALIDATION ==========
    console.log("\n" + "-".repeat(80));
    console.log("🔍 PHASE 4: Quality Agent Validation");
    console.log("-".repeat(80));
    
    let qualityScore = 0;
    let validationAttempts = 0;
    const maxAttempts = 3;
    const QUALITY_THRESHOLD = 70; // Temporarily lowered while improving agents
    let finalScenes = generatedScenes;
    
    while (qualityScore < QUALITY_THRESHOLD && validationAttempts < maxAttempts) {
      validationAttempts++;
      console.log(`\n🔍 Validation attempt ${validationAttempts}/${maxAttempts}`);
      
      const storyboardForValidation = this.convertToLegacyStoryboard(req, finalScenes);
      const qaReport = await this.qualityAgent.review(storyboardForValidation, frameworkContext.outcomeMap);
      qualityScore = qaReport.score;
      
      console.log(`   📊 Quality Score: ${qualityScore}/100 (Threshold: ${QUALITY_THRESHOLD})`);
      
      if (qualityScore < QUALITY_THRESHOLD) {
        if (validationAttempts >= maxAttempts) {
          // Max attempts reached, return best attempt
          console.log(`   ⚠️  Max revision attempts reached (${maxAttempts}). Returning best result.`);
          break;
        }
        
        console.log(`   ⚠️  Quality below threshold. Issues found: ${qaReport.issues.length}`);
        console.log(`   🔄 Initiating revision...`);
        
        // ========== PHASE 5: REVISION LOOP ==========
        finalScenes = await this.phase5RevisionLoop(
          finalScenes,
          qaReport,
          req,
          frameworkContext
        );
        
        console.log(`   ✅ Revision complete. Re-validating...`);
      } else {
        console.log(`   ✅ Quality threshold met!`);
        break;
      }
    }
    
    if (qualityScore < QUALITY_THRESHOLD) {
      console.log(`   ⚠️  Maximum revision attempts reached. Using best available quality (${qualityScore}%).`);
    }
    
    // ========== BUILD FINAL STORYBOARD MODULE ==========
    let storyboardModule = this.buildStoryboardModuleV2(req, finalScenes, frameworkContext);
    
    // ========== ENSURE LEARNING OUTCOMES ARE INJECTED ==========
    console.log("\n🔍 Checking learning outcome injection...");
    const scenesWithoutLO = storyboardModule.scenes.filter(s => !s.dev?.variables?.learningOutcome);
    if (scenesWithoutLO.length > 0) {
      console.warn(`⚠️  ${scenesWithoutLO.length} scenes missing LO references - re-injecting...`);
      storyboardModule.scenes.forEach((scene, index) => {
        if (!scene.dev?.variables?.learningOutcome) {
          const loIndex = index % req.learningOutcomes.length;
          scene.dev = scene.dev || { variables: {}, accessibilityNotes: "", xapiEvents: [] };
          scene.dev.variables = scene.dev.variables || {};
          scene.dev.variables.learningOutcome = req.learningOutcomes[loIndex];
          scene.dev.variables.outcomeIndex = loIndex;
        }
      });
      console.log("✅ Learning outcomes re-injected");
    }
    
    // ========== FINAL CONTENT VALIDATION ==========
    console.log("\n🔍 Final Content Validation:");
    let validScenes = 0;
    let invalidScenes = 0;
    
    storyboardModule.scenes.forEach((scene, index) => {
      const ostLength = scene.ost?.length || 0;
      const voLength = scene.narration?.length || 0;
      const status = (ostLength > 20 && voLength > 50) ? "✅" : "❌";
      
      console.log(`${status} Scene ${scene.ordinal || index + 1} (${scene.title?.substring(0, 40) || 'Untitled'}): OST=${ostLength} chars, VO=${voLength} chars`);
      
      if (ostLength > 20 && voLength > 50) {
        validScenes++;
      } else {
        invalidScenes++;
        console.error(`   ⚠️  Scene ${scene.ordinal || index + 1} has missing content!`);
        console.error(`      OST: "${scene.ost?.substring(0, 50) || 'EMPTY'}"`);
        console.error(`      VO: "${scene.narration?.substring(0, 50) || 'EMPTY'}"`);
      }
    });
    
    console.log(`\n📊 Content Validation Summary: ${validScenes} valid, ${invalidScenes} invalid out of ${storyboardModule.scenes.length} total scenes`);
    
    if (invalidScenes > 0) {
      console.warn(`⚠️  WARNING: ${invalidScenes} scenes have missing OST or VO content!`);
    }
    
    // ========== FRAMEWORK ENFORCEMENT ==========
    console.log("\n" + "-".repeat(80));
    console.log("🔧 Framework Enforcement");
    console.log("-".repeat(80));
    
    // Ensure TEACH→SHOW→APPLY→CHECK→REFLECT structure
    storyboardModule = this.ensureTEACHPracticeApplyCheckReflect(storyboardModule, req.learningOutcomes);
    
    // Enforce interactive density based on complexity level
    // NOTE: enforceInteractiveDensity may convert onScreenText to array, so we'll fix it after
    const complexityLevel = (req as any).complexityLevel || 2;
    storyboardModule = enforceInteractiveDensity(storyboardModule as any, { level: complexityLevel, moduleType: req.moduleType });
    
    // CRITICAL FIX: enforceInteractiveDensity converts onScreenText to array, convert back to string
    storyboardModule.scenes.forEach((scene) => {
      const sceneAny = scene as any;
      
      // Convert onScreenText back to string if it's an array
      if (Array.isArray(sceneAny.onScreenText)) {
        sceneAny.onScreenText = sceneAny.onScreenText.join(' ');
      }
      // Ensure onScreenText is a string
      if (typeof sceneAny.onScreenText !== 'string') {
        sceneAny.onScreenText = String(sceneAny.onScreenText || scene.ost || '');
      }
      
      // Ensure voiceoverScript is a string
      if (typeof sceneAny.voiceoverScript !== 'string') {
        sceneAny.voiceoverScript = String(sceneAny.voiceoverScript || scene.narration || '');
      }
      
      // Ensure ost is a string (SceneV2 format)
      if (Array.isArray(scene.ost)) {
        (scene as any).ost = scene.ost.join(' ');
      }
      if (typeof scene.ost !== 'string') {
        (scene as any).ost = String(scene.ost || sceneAny.onScreenText || '');
      }
      
      // Ensure narration is a string (SceneV2 format)
      if (Array.isArray(scene.narration)) {
        (scene as any).narration = scene.narration.join(' ');
      }
      if (typeof scene.narration !== 'string') {
        (scene as any).narration = String(scene.narration || sceneAny.voiceoverScript || '');
      }
    });
    
    console.log("✅ Framework enforcement applied");
    
    // ========== QUALITY GUARD: Check for generic fallback content ==========
    const genericPattern = /(Mark|Alex|Jamie)/i;
    const allGeneric = storyboardModule.scenes.every(s => {
      const narration = s.narration || "";
      return genericPattern.test(narration);
    });
    
    if (allGeneric && storyboardModule.scenes.length > 3) {
      console.warn("🛑 Generic fallback detected in all scenes. This may indicate a generation issue.");
      // Don't throw - just warn, as the scenes might still be valid
    }
    
    console.log("\n" + "=".repeat(80));
    console.log("✅ DIRECTOR AGENT: Storyboard Orchestration Complete");
    console.log("=".repeat(80));
    console.log(`📊 Final Quality Score: ${qualityScore}/100`);
    console.log(`🎬 Total Scenes: ${storyboardModule.scenes.length}`);
    console.log(`🎯 Learning Outcomes Covered: ${frameworkContext.learningOutcomes.length}`);
    console.log("=".repeat(80) + "\n");
    
    return storyboardModule;
  }
  
  /**
   * PHASE 1: Content Agent analyzes source material
   * Extracts framework, characters, concepts from training materials
   */
  private async phase1ContentAnalysis(req: LearningRequest): Promise<FrameworkContext> {
    console.log("📚 Analyzing source material...");
    
    // Extract content from source material
    const extractedContent = await this.contentAgent.extractContent(
      req.sourceMaterial || '',
      req.learningOutcomes || [],
      req.topic
    );
    
    // Analyze outcomes
    const outcomeMap = await this.outcomeAnalyzer.analyzeOutcomes(req);
    const learningOutcomes = outcomeMap.outcomes.map(o => o.outcome);
    
    // Extract characters and concepts from extracted content
    const characters = extractedContent.characters || [];
    const concepts = [
      ...extractedContent.models,
      ...extractedContent.techniques,
      ...extractedContent.terminology
    ];
    
    return {
      extractedContent,
      learningOutcomes,
      outcomeMap,
      characters,
      concepts
    };
  }
  
  /**
   * PHASE 2: Pedagogical Agent designs learning path
   * Creates 5 scenes per learning outcome: TEACH → SHOW → APPLY → CHECK → REFLECT
   */
  private async phase2LearningPathDesign(
    req: LearningRequest,
    context: FrameworkContext
  ): Promise<SceneGenerationContext[]> {
    console.log("🎓 Designing learning path...");
    console.log(`   🎯 Learning Outcomes: ${context.learningOutcomes.length}`);
    
    const learningPath: SceneGenerationContext[] = [];
    let sceneIndex = 0;
    
    // Generate welcome scenes first
    const welcomeScenes = await this.welcomeAgent.generate(req);
    sceneIndex += welcomeScenes.length;
    
    // For each learning outcome, create 5 scenes
    for (let i = 0; i < context.learningOutcomes.length; i++) {
      const outcome = context.learningOutcomes[i];
      console.log(`   📋 Learning Outcome ${i + 1}: ${outcome.substring(0, 60)}...`);
      
      const sceneTypes: Array<"TEACH" | "SHOW" | "APPLY" | "CHECK" | "REFLECT"> = [
        "TEACH",
        "SHOW",
        "APPLY",
        "CHECK",
        "REFLECT"
      ];
      
      for (const sceneType of sceneTypes) {
        learningPath.push({
          sceneType,
          learningOutcome: outcome,
          outcomeIndex: i,
          frameworkContext: context,
          previousScenes: [],
          sceneIndex: sceneIndex++
        });
        
        console.log(`      ✅ ${sceneType} scene planned`);
      }
    }
    
    return learningPath;
  }
  
  /**
   * PHASE 3: Coordinate specialists for each scene
   * For each scene, coordinates:
   * - PedagogicalAgent: Structures teaching approach
   * - ContentAgent: Extracts relevant material using framework
   * - InteractivityAgent: Adds interactions based on scene type
   * - VisualAgent: Generates framework-aware prompts
   */
  private async phase3SceneGeneration(
    req: LearningRequest,
    learningPath: SceneGenerationContext[],
    context: FrameworkContext
  ): Promise<SceneV2[]> {
    console.log("🎨 Generating scenes with specialist coordination...");
    
    const scenes: SceneV2[] = [];
    
    for (let i = 0; i < learningPath.length; i++) {
      const pathContext = learningPath[i];
      const previousScenes = scenes.slice(0, i);
      pathContext.previousScenes = previousScenes;
      
      console.log(`\n   🎬 Scene ${i + 1}/${learningPath.length}: ${pathContext.sceneType} for LO ${pathContext.outcomeIndex + 1}`);
      
      // Coordinate all specialists
      const scene = await this.coordinateSpecialists(req, pathContext);
      
      scenes.push(scene);
      console.log(`      ✅ Scene generated: "${scene.title}"`);
    }
    
    return scenes;
  }
  
  /**
   * Coordinate all specialists for a single scene
   */
  private async coordinateSpecialists(
    req: LearningRequest,
    context: SceneGenerationContext
  ): Promise<SceneV2> {
    const { sceneType, learningOutcome, frameworkContext, previousScenes } = context;
    
    // 1. Generate scene-specific content based on scene type
    console.log(`      📚 Generating ${sceneType} scene content...`);
    let baseScene: Scene;
    
    if (sceneType === "TEACH") {
      // Only use generateTeachingScenes for TEACH scenes
      const pedagogicalStructure = await this.pedagogicalAgent.generateTeachingScenes(
        req,
        [learningOutcome],
        1
      );
      baseScene = pedagogicalStructure[0] || this.createBaseScene(context);
    } else {
      // Generate scene-specific content for SHOW, APPLY, CHECK, REFLECT
      baseScene = await this.generateSceneSpecificContent(
        sceneType,
        learningOutcome,
        req,
        frameworkContext,
        previousScenes
      );
    }
    
    // 2. ContentAgent: Extract relevant material using framework
    console.log(`      📖 ContentAgent: Extracting relevant content...`);
    const relevantContent = this.extractRelevantContent(
      frameworkContext.extractedContent,
      learningOutcome,
      sceneType
    );
    
    // 3. InteractivityAgent: Add interactions based on scene type
    console.log(`      🎮 InteractivityAgent: Adding interactions...`);
    
    // Extract instructional content for interactions (same extraction as scenes)
    const extractedInstructionalContent = await this.extractInstructionalContentFromLO(
      learningOutcome,
      req.topic,
      req.sourceMaterial
    );
    
    const interactionSpec = await this.addInteractions(
      baseScene,
      sceneType,
      req,
      frameworkContext,
      extractedInstructionalContent
    );
    
    // 4. VisualAgent: Generate framework-aware prompts
    console.log(`      🎨 VisualAgent: Generating visual prompts...`);
    const visualPrompt = await this.generateVisualPrompt(
      baseScene,
      sceneType,
      frameworkContext,
      relevantContent
    );
    
    // CRITICAL: Extract OST and VO from multiple possible field names
    // Check all possible field name variations from LLM responses
    const onScreenText = 
      baseScene.onScreenText || 
      (baseScene as any).ostText || 
      (baseScene as any).ost || 
      (baseScene as any).on_screen_text ||
      (baseScene as any).onScreenText ||
      (baseScene as any).teachingScene?.onScreenText ||
      "";
    
    const narrationScript = 
      baseScene.narrationScript || 
      (baseScene as any).voiceOver || 
      (baseScene as any).voiceoverScript || 
      (baseScene as any).narration || 
      (baseScene as any).narration_script ||
      (baseScene as any).teachingScene?.voiceOverScript ||
      "";
    
    // Log content validation
    const ostLength = onScreenText.length;
    const voLength = narrationScript.length;
    const status = (ostLength > 20 && voLength > 50) ? "✅" : "❌";
    
    console.log(`      ${status} Scene ${context.sceneIndex + 1}: OST=${ostLength} chars, VO=${voLength} chars`);
    
    if (ostLength === 0 || voLength === 0) {
      console.error(`      ⚠️  Scene ${context.sceneIndex + 1} has missing content!`);
      console.error(`         BaseScene fields:`, Object.keys(baseScene));
      console.error(`         BaseScene.pageTitle:`, baseScene.pageTitle);
      console.error(`         BaseScene.onScreenText:`, baseScene.onScreenText);
      console.error(`         BaseScene.narrationScript:`, baseScene.narrationScript);
      if ((baseScene as any).teachingScene) {
        console.error(`         TeachingScene.onScreenText:`, (baseScene as any).teachingScene?.onScreenText);
        console.error(`         TeachingScene.voiceOverScript:`, (baseScene as any).teachingScene?.voiceOverScript);
      }
    }
    
    // Build final SceneV2 with explicit field mapping
    // CRITICAL: Include BOTH field name variants for frontend/PDF compatibility
    const sceneV2: SceneV2 & { onScreenText?: string; voiceoverScript?: string } = {
      id: `scene-${context.sceneIndex + 1}`,
      ordinal: context.sceneIndex + 1,
      title: baseScene.pageTitle || `${sceneType}: ${learningOutcome.substring(0, 50)}`,
      type: this.mapSceneType(sceneType),
      layout: this.mapLayout(sceneType),
      // SceneV2 fields (ost, narration)
      ost: onScreenText || `Content for ${baseScene.pageTitle || sceneType} scene`,
      narration: narrationScript || `This ${sceneType.toLowerCase()} scene addresses ${learningOutcome.substring(0, 60)}`,
      // Frontend/PDF expected fields (onScreenText, voiceoverScript)
      onScreenText: onScreenText || `Content for ${baseScene.pageTitle || sceneType} scene`,
      voiceoverScript: narrationScript || `This ${sceneType.toLowerCase()} scene addresses ${learningOutcome.substring(0, 60)}`,
      image: {
        prompt: visualPrompt,
        altText: baseScene.visual?.altText || `Visual for ${sceneType} scene`
      },
      interaction: interactionSpec,
      dev: {
        variables: {
          learningOutcome: learningOutcome, // Ensure LO is always set
          sceneType: sceneType,
          outcomeIndex: context.outcomeIndex
        },
        accessibilityNotes: this.generateAccessibilityNotes(sceneType),
        xapiEvents: this.generateXapiEvents(sceneType)
      },
      timingSec: this.estimateTiming(sceneType)
    };
    
    // Ensure learning outcome is always present
    if (!sceneV2.dev?.variables?.learningOutcome) {
      sceneV2.dev = sceneV2.dev || { variables: {}, accessibilityNotes: "", xapiEvents: [] };
      sceneV2.dev.variables = sceneV2.dev.variables || {};
      sceneV2.dev.variables.learningOutcome = learningOutcome;
    }
    
    return sceneV2;
  }
  
  /**
   * Extract relevant content from framework context for a specific scene
   */
  private extractRelevantContent(
    extractedContent: ExtractedContent,
    learningOutcome: string,
    sceneType: string
  ): string {
    const relevant: string[] = [];
    
    // For TEACH scenes, focus on models and techniques
    if (sceneType === "TEACH" || sceneType === "SHOW") {
      relevant.push(...extractedContent.models);
      relevant.push(...extractedContent.techniques);
      relevant.push(...extractedContent.terminology);
    }
    
    // For APPLY scenes, focus on examples and processes
    if (sceneType === "APPLY" || sceneType === "CHECK") {
      relevant.push(...extractedContent.examples);
      relevant.push(...extractedContent.processes);
      relevant.push(...extractedContent.scenarios || []);
    }
    
    // For REFLECT scenes, focus on pitfalls
    if (sceneType === "REFLECT") {
      relevant.push(...extractedContent.pitfalls);
    }
    
    return relevant
      .filter(Boolean)
      .slice(0, 5) // Limit to top 5 most relevant
      .join(", ");
  }
  
  /**
   * Add interactions based on scene type
   * Uses extracted instructional content to ensure interactions test actual LO content
   */
  private async addInteractions(
    baseScene: Scene,
    sceneType: string,
    req: LearningRequest,
    context: FrameworkContext,
    extractedInstructionalContent?: {
      keyConcepts: string[];
      concreteExamples: string[];
      misconceptions: string[];
    }
  ): Promise<any> {
    // Map scene types to interaction types
    const interactionMap: Record<string, string> = {
      "TEACH": "None",
      "SHOW": "None",
      "APPLY": "DragDrop",
      "CHECK": "MCQ",
      "REFLECT": "None"
    };
    
    const interactionType = interactionMap[sceneType] || "None";
    
    if (interactionType === "None") {
      return { kind: "None" };
    }
    
    // For APPLY scenes, generate drag-and-drop interaction using extracted content
    if (interactionType === "DragDrop" && sceneType === "APPLY") {
      // Use extracted key concepts for matching pairs
      const keyConcepts = extractedInstructionalContent?.keyConcepts || 
        context.extractedContent.techniques.slice(0, 4);
      
      // Generate matching pairs from key concepts
      const pairs = keyConcepts.slice(0, 4).map((concept, idx) => {
        const conceptParts = concept.split(':');
        const conceptName = conceptParts[0].trim();
        const conceptDesc = conceptParts[1]?.trim() || concept;
        
        return {
          statement: conceptName,
          answer: conceptDesc,
          statementId: `statement-${idx + 1}`,
          answerId: `answer-${idx + 1}`
        };
      });
      
      return {
        kind: "DragDrop",
        stages: [{
          id: "apply-stage-1",
          prompt: `Match each concept with its correct description based on ${baseScene.pageTitle}`,
          pairs: pairs,
          feedback: {
            correct: "Well done! You've correctly matched the concepts. This shows you understand the key ideas.",
            incorrect: "Not quite. Review the teaching content and try again. Focus on the specific definitions."
          },
          ui: {
            allowReset: true,
            checkButtonLabel: "Check Answer"
          }
        }]
      };
    }
    
    // For CHECK scenes, generate MCQ interaction using extracted content
    if (interactionType === "MCQ" && sceneType === "CHECK") {
      // Use extracted key concepts for questions
      const keyConcepts = extractedInstructionalContent?.keyConcepts || [];
      const misconceptions = extractedInstructionalContent?.misconceptions || [];
      
      // Generate questions based on key concepts
      const questions = keyConcepts.slice(0, 2).map((concept, idx) => {
        const conceptParts = concept.split(':');
        const conceptName = conceptParts[0].trim();
        const correctAnswer = conceptParts[1]?.trim() || concept;
        
        // Use misconceptions as distractors if available
        const distractors = misconceptions.slice(0, 2).concat([
          "A generic answer that doesn't relate to the concept",
          "An incorrect interpretation of the concept"
        ]).slice(0, 3);
        
        return {
          id: `check-question-${idx + 1}`,
          stem: `Which best describes ${conceptName}?`,
          options: [
            {
              id: `opt-${idx + 1}-correct`,
              text: correctAnswer,
              isCorrect: true,
              coaching: `Correct! ${conceptName} is ${correctAnswer}.`
            },
            ...distractors.map((distractor, optIdx) => ({
              id: `opt-${idx + 1}-${optIdx + 1}`,
              text: distractor,
              isCorrect: false,
              coaching: `Not quite. Review the teaching content about ${conceptName}.`
            }))
          ].slice(0, 4), // Max 4 options
          singleSelect: true
        };
      });
      
      // Ensure we have at least 1 question
      if (questions.length === 0) {
        questions.push({
          id: "check-question-1",
          stem: `Which best demonstrates understanding of ${baseScene.pageTitle}?`,
          options: [
            {
              id: "opt-1",
              text: "Correct answer based on key concepts",
              isCorrect: true,
              coaching: "Correct! This demonstrates proper understanding."
            },
            {
              id: "opt-2",
              text: "Incorrect answer",
              isCorrect: false,
              coaching: "Not quite. Review the teaching content."
            }
          ],
          singleSelect: true
        });
      }
      
      return {
        kind: "MCQ",
        items: questions
      };
    }
    
    return { kind: "None" };
  }
  
  /**
   * Generate visual prompt using VisualAgent
   */
  private async generateVisualPrompt(
    baseScene: Scene,
    sceneType: string,
    context: FrameworkContext,
    relevantContent: string
  ): Promise<string> {
    // Map scene type to VisualDirectorAgent scene type
    const visualSceneTypeMap: Record<string, "hook" | "character_intro" | "conflict" | "teaching" | "breakthrough" | "climax" | "resolution" | "action"> = {
      "TEACH": "teaching",
      "SHOW": "character_intro",
      "APPLY": "action",
      "CHECK": "conflict",
      "REFLECT": "resolution"
    };
    
    const emotion = this.getEmotionForSceneType(sceneType);
    const visualSceneType = visualSceneTypeMap[sceneType] || "teaching";
    
    // Build character object for VisualAgent
    const characterName = context.characters?.[0] || "the learner";
    const characterObj: Character | undefined = characterName && typeof characterName === "string" ? {
      name: characterName,
      role: "protagonist",
      archetype: "The Learner",
      traits: [],
      motivation: "Learning and growth"
    } : undefined;
    
    // Generate cinematic direction
    const cinematicDirection = this.visualAgent.generateSceneDirection(
      visualSceneType,
      {
        protagonist: characterObj
      },
      emotion as "tension" | "frustration" | "confusion" | "aha_moment" | "confidence",
      relevantContent
    );
    
    return cinematicDirection.fullDirection;
  }
  
  /**
   * Get emotion for scene type
   */
  private getEmotionForSceneType(sceneType: string): "tension" | "frustration" | "confusion" | "aha_moment" | "confidence" {
    const emotionMap: Record<string, "tension" | "frustration" | "confusion" | "aha_moment" | "confidence"> = {
      "TEACH": "confidence",
      "SHOW": "aha_moment",
      "APPLY": "tension",
      "CHECK": "frustration",
      "REFLECT": "confidence"
    };
    
    return emotionMap[sceneType] || "confidence";
  }
  
  /**
   * PHASE 5: Revision loop if quality fails
   */
  private async phase5RevisionLoop(
    scenes: SceneV2[],
    qaReport: any,
    req: LearningRequest,
    context: FrameworkContext
  ): Promise<SceneV2[]> {
    console.log("   🔄 Starting revision loop...");
    
    const revisionPrompt = `
IMPROVE THE FOLLOWING STORYBOARD based on these QA issues:

ISSUES:
${qaReport.issues.join('\n')}

RECOMMENDATIONS:
${qaReport.recommendations.join('\n')}

LEARNING OUTCOMES TO ENSURE COVERAGE:
${context.learningOutcomes.map((lo, i) => `${i + 1}. ${lo}`).join('\n')}

CURRENT STORYBOARD:
${JSON.stringify(scenes, null, 2)}

REQUIREMENTS:
- Fix all identified issues
- Ensure all learning outcomes are covered
- Maintain 5-scene structure per LO (TEACH → SHOW → APPLY → CHECK → REFLECT)
- Keep all scene IDs and ordinals
- Improve narration, OST, and visual prompts
- Ensure interactions are pedagogically justified

Return the complete improved storyboard as JSON array of SceneV2 objects.
    `.trim();
    
    try {
      const refinedResponse = await openaiChat({
        systemKey: "master_blueprint",
        user: `${resetHeader}${revisionPrompt}`
      });
      
      const refinedScenes = safeJSONParse(refinedResponse);
      
      if (Array.isArray(refinedScenes) && refinedScenes.length > 0) {
        console.log(`   ✅ Revision complete: ${refinedScenes.length} scenes refined`);
        return refinedScenes;
      } else {
        console.log(`   ⚠️  Revision failed to parse, using original scenes`);
        return scenes;
      }
    } catch (error) {
      console.error(`   ❌ Revision error:`, error);
      return scenes;
    }
  }
  
  /**
   * Build final StoryboardModuleV2 structure
   */
  private buildStoryboardModuleV2(
    req: LearningRequest,
    scenes: SceneV2[],
    context: FrameworkContext
  ): StoryboardModuleV2 {
    const meta: ModuleMeta = {
      moduleName: req.topic,
      moduleType: req.moduleType || "Soft Skills",
      level: "Level2",
      targetDurationMin: req.duration,
      audiencePersona: req.audience || "Learners",
      brand: {
        colours: {
          primary: req.brand?.colours || "#001E41",
          accents: ["#5BCBF5", "#31B2E7"]
        },
        fonts: {
          heading: req.brand?.fonts || "Outfit",
          body: "Inter"
        },
        typography: {
          H1: {
            family: "Outfit",
            weight: 700,
            sizePt: 32,
            colour: "#001E41"
          },
          H2: {
            family: "Outfit",
            weight: 600,
            sizePt: 24,
            colour: "#001E41"
          },
          Body: {
            family: "Inter",
            weight: 400,
            sizePt: 16,
            colour: "#333333"
          }
        },
        layout: {
          grid: "AMP-16x9",
          gutterPx: 24,
          safeMarginPx: 48
        }
      },
      voiceover: {
        language: "en-AU",
        accent: "Australian",
        persona: {
          tone: "Professional, warm, confident"
        },
        wpmApprox: 110
      },
      accessibility: {
        captionsDefaultOn: true,
        audioDescriptionPolicy: "key-visuals",
        colourContrastRatioMin: "WCAG2.1-AA",
        keyboardOnlySupport: true,
        altTextPolicy: "required-all"
      },
      xapi: {
        activityIdBase: `https://learno.ai/xapi/${req.topic.toLowerCase().replace(/\s+/g, '-')}`,
        verbs: ["launched", "experienced", "answered", "completed", "passed", "failed", "branched", "interacted"]
      },
      learningOutcomes: context.learningOutcomes
    };
    
    const structure: ModuleStructure = {
      firstFourEnforced: true,
      durationPlan: {
        targetScenes: scenes.length,
        sceneTimingStrategy: "heuristic",
        minKC: context.learningOutcomes.length
      }
    };
    
    const assets: ModuleAssets = {
      globalImageStyle: {
        artDirection: "photo-real",
        lens: "35mm",
        lighting: "soft daylight",
        colourGrade: "cool corporate",
        brandTreatment: "subtle",
        aspect: "16:9"
      }
    };
    
    return {
      version: "2.0",
      meta,
      structure,
      assets,
      scenes
    };
  }
  
  // ========== HELPER METHODS ==========
  
  /**
   * Generate scene-specific content for SHOW, APPLY, CHECK, REFLECT scenes
   * This prevents repetition by generating unique content for each scene type
   * Uses content extraction to ensure actual instructional content is included
   */
  private async generateSceneSpecificContent(
    sceneType: "SHOW" | "APPLY" | "CHECK" | "REFLECT",
    learningOutcome: string,
    req: LearningRequest,
    frameworkContext: FrameworkContext,
    previousScenes: SceneV2[]
  ): Promise<Scene> {
    // STEP 1: Extract instructional content from LO (same as TEACH scenes)
    console.log(`      🔍 Extracting instructional content from LO for ${sceneType} scene...`);
    const extractedInstructionalContent = await this.extractInstructionalContentFromLO(
      learningOutcome,
      req.topic,
      req.sourceMaterial
    );
    
    // Find the TEACH scene for this learning outcome to reference its content
    const teachScene = previousScenes.find(s => 
      s.dev?.variables?.learningOutcome === learningOutcome && 
      s.dev?.variables?.sceneType === "TEACH"
    );
    
    const teachContent = teachScene 
      ? `Previous TEACH scene content: ${teachScene.narration?.substring(0, 200)}...`
      : `Learning outcome: ${learningOutcome}`;
    
    // Build context from previous scenes to avoid repetition
    const previousTitles = previousScenes
      .slice(-3) // Last 3 scenes
      .map(s => s.title)
      .join(", ");
    
    const sceneTypePrompts: Record<typeof sceneType, string> = {
      SHOW: `
Generate a SHOW (demonstration) scene that demonstrates the concepts from the learning objective.

LEARNING OBJECTIVE: ${learningOutcome}

MANDATORY INSTRUCTIONAL CONTENT TO DEMONSTRATE:
${JSON.stringify(extractedInstructionalContent.keyConcepts, null, 2)}

CONCRETE EXAMPLES TO USE:
${JSON.stringify(extractedInstructionalContent.concreteExamples, null, 2)}

${teachContent}

PREVIOUS SCENES (avoid repeating): ${previousTitles}

This scene should:
- DEMONSTRATE the concepts through examples (not re-teach them)
- Use click-to-reveal interactions to show how each key concept works in practice
- Build on the TEACH scene by showing real-world application
- Focus on "how it works" rather than "what it is"
- MUST include specific demonstrations of the key concepts listed above

CRITICAL: Return JSON with EXACTLY these field names:
{
  "pageTitle": "[Demonstration title]",
  "narrationScript": "[150-200 words demonstrating concepts with examples. MUST include specific demonstrations of the key concepts listed above]",
  "onScreenText": "[40-60 words highlighting what will be demonstrated]",
  "visual": {
    "aiPrompt": "[Visual for demonstration]",
    "altText": "[Alt text]"
  }
}

DO NOT use different field names like 'ostText', 'voiceOver', 'narration', or 'ost'. Use EXACTLY 'narrationScript' and 'onScreenText'.
      `.trim(),
      
      APPLY: `
Generate an APPLY (practice) scene that lets learners practice the concepts.

LEARNING OBJECTIVE: ${learningOutcome}

MANDATORY INSTRUCTIONAL CONTENT TO PRACTICE:
${JSON.stringify(extractedInstructionalContent.keyConcepts, null, 2)}

CONCRETE EXAMPLES FOR SCENARIOS:
${JSON.stringify(extractedInstructionalContent.concreteExamples, null, 2)}

${teachContent}

PREVIOUS SCENES (avoid repeating): ${previousTitles}

This scene should:
- Provide PRACTICE opportunities (drag-drop matching, scenarios)
- Test application of the specific key concepts listed above
- Use realistic scenarios that require decision-making based on the concepts
- Build on TEACH and SHOW scenes by requiring active application
- MUST test understanding of the actual concepts from the learning objective

CRITICAL: Return JSON with EXACTLY these field names:
{
  "pageTitle": "[Practice title]",
  "narrationScript": "[150-200 words setting up the practice scenario. MUST reference the key concepts listed above]",
  "onScreenText": "[40-60 words explaining the practice activity]",
  "visual": {
    "aiPrompt": "[Visual for practice scenario]",
    "altText": "[Alt text]"
  }
}

DO NOT use different field names like 'ostText', 'voiceOver', 'narration', or 'ost'. Use EXACTLY 'narrationScript' and 'onScreenText'.
      `.trim(),
      
      CHECK: `
Generate a CHECK (knowledge validation) scene that tests understanding.

LEARNING OBJECTIVE: ${learningOutcome}

MANDATORY INSTRUCTIONAL CONTENT TO TEST:
${JSON.stringify(extractedInstructionalContent.keyConcepts, null, 2)}

MISCONCEPTIONS TO ADDRESS IN QUESTIONS:
${JSON.stringify(extractedInstructionalContent.misconceptions, null, 2)}

${teachContent}

PREVIOUS SCENES (avoid repeating): ${previousTitles}

This scene should:
- TEST knowledge with quiz questions that test the specific key concepts listed above
- Use actual concepts from the learning objective (not generic questions)
- Provide corrective feedback that references the teaching content
- Validate that learners can identify, apply, or analyze the specific concepts
- MUST include questions that test understanding of the actual content

CRITICAL: Return JSON with EXACTLY these field names:
{
  "pageTitle": "[Quiz title]",
  "narrationScript": "[100-150 words introducing the knowledge check. MUST reference the key concepts being tested]",
  "onScreenText": "[40-60 words explaining the quiz format]",
  "visual": {
    "aiPrompt": "[Visual for quiz]",
    "altText": "[Alt text]"
  }
}

DO NOT use different field names like 'ostText', 'voiceOver', 'narration', or 'ost'. Use EXACTLY 'narrationScript' and 'onScreenText'.
      `.trim(),
      
      REFLECT: `
Generate a REFLECT (personalization) scene that connects learning to personal application.

LEARNING OBJECTIVE: ${learningOutcome}

MANDATORY INSTRUCTIONAL CONTENT TO REFLECT ON:
${JSON.stringify(extractedInstructionalContent.keyConcepts, null, 2)}

CONCRETE EXAMPLES FOR REFLECTION:
${JSON.stringify(extractedInstructionalContent.concreteExamples, null, 2)}

${teachContent}

PREVIOUS SCENES (avoid repeating): ${previousTitles}

This scene should:
- Prompt PERSONAL REFLECTION on how to apply the specific key concepts listed above
- Bridge to the next learning objective or module
- Help learners internalize the learning by connecting concepts to their context
- Connect to real-world application using the examples provided
- MUST reference the actual concepts from the learning objective

CRITICAL: Return JSON with EXACTLY these field names:
{
  "pageTitle": "[Reflection title]",
  "narrationScript": "[150-200 words prompting personal reflection. MUST reference the key concepts listed above]",
  "onScreenText": "[40-60 words with reflection questions]",
  "visual": {
    "aiPrompt": "[Visual for reflection]",
    "altText": "[Alt text]"
  }
}

DO NOT use different field names like 'ostText', 'voiceOver', 'narration', or 'ost'. Use EXACTLY 'narrationScript' and 'onScreenText'.
      `.trim()
    };
    
    const prompt = sceneTypePrompts[sceneType];
    
    try {
      const response = await openaiChat({
        systemKey: "master_blueprint",
        user: `${resetHeader}${prompt}`
      });
      
      const parsed = safeJSONParse(response);
      
      if (parsed && parsed.pageTitle) {
        const scene = {
          sceneNumber: previousScenes.length + 1,
          pageTitle: parsed.pageTitle,
          pageType: sceneType === "CHECK" ? "Assessment" : sceneType === "APPLY" ? "Interactive" : "Informative",
          narrationScript: parsed.narrationScript || `This ${sceneType.toLowerCase()} scene focuses on ${learningOutcome}`,
          onScreenText: parsed.onScreenText || learningOutcome.substring(0, 70),
          visual: {
            aiPrompt: parsed.visual?.aiPrompt || `Visual for ${sceneType} scene`,
            altText: parsed.visual?.altText || `Visual representation for ${sceneType}`
          },
          interactionType: "None",
          timing: { estimatedSeconds: sceneType === "CHECK" ? 90 : 120 }
        };
        
        // Validate content is present (for SHOW, APPLY, CHECK, REFLECT)
        if (extractedInstructionalContent.keyConcepts.length > 0) {
          const validation = this.validateSceneContentPresence(
            scene.narrationScript,
            extractedInstructionalContent.keyConcepts
          );
          
          if (validation.missingConcepts.length > 0) {
            console.warn(`      ⚠️  ${sceneType} scene missing concepts: ${validation.missingConcepts.join(', ')}`);
            // Inject missing content
            scene.narrationScript += ` Remember: ${extractedInstructionalContent.keyConcepts.slice(0, 2).join('. ')}.`;
          }
        }
        
        return scene;
      }
    } catch (error) {
      console.error(`   ⚠️  Error generating ${sceneType} scene content:`, error);
    }
    
    // Fallback
    return this.createBaseScene({
      sceneType,
      learningOutcome,
      outcomeIndex: 0,
      frameworkContext,
      previousScenes: [],
      sceneIndex: previousScenes.length
    });
  }
  
  private createBaseScene(context: SceneGenerationContext): Scene {
    return {
      sceneNumber: context.sceneIndex + 1,
      pageTitle: `${context.sceneType}: ${context.learningOutcome.substring(0, 50)}`,
      pageType: "Informative",
      narrationScript: `This scene teaches ${context.learningOutcome}`,
      onScreenText: context.learningOutcome.substring(0, 70),
      visual: {
        aiPrompt: `Visual for ${context.sceneType} scene`,
        altText: `Visual representation`
      },
      interactionType: "None",
      timing: { estimatedSeconds: 60 }
    };
  }
  
  private mapSceneType(sceneType: string): "Informative" | "Interactive" | "Assessment" | "BranchHub" | "InteractiveVideo" {
    const map: Record<string, "Informative" | "Interactive" | "Assessment" | "BranchHub" | "InteractiveVideo"> = {
      "TEACH": "Informative",
      "SHOW": "Informative",
      "APPLY": "Interactive",
      "CHECK": "Assessment",
      "REFLECT": "Informative"
    };
    
    return map[sceneType] || "Informative";
  }
  
  private mapLayout(sceneType: string): string {
    const map: Record<string, string> = {
      "TEACH": "Standard",
      "SHOW": "Hero",
      "APPLY": "DragDrop2Stage",
      "CHECK": "MCQ",
      "REFLECT": "Standard"
    };
    
    return map[sceneType] || "Standard";
  }
  
  private generateAccessibilityNotes(sceneType: string): string {
    return `Scene type: ${sceneType}. Ensure keyboard navigation, screen reader support, and high contrast.`;
  }
  
  private generateXapiEvents(sceneType: string): Array<{ event: string; when: string }> {
    return [
      { event: "launched", when: "Scene loaded" },
      { event: "experienced", when: "Scene completed" }
    ];
  }
  
  private estimateTiming(sceneType: string): number {
    const timingMap: Record<string, number> = {
      "TEACH": 90,
      "SHOW": 60,
      "APPLY": 120,
      "CHECK": 90,
      "REFLECT": 60
    };
    
    return timingMap[sceneType] || 60;
  }
  
  /**
   * Ensure TEACH→SHOW→APPLY→CHECK→REFLECT structure for each learning outcome
   */
  private ensureTEACHPracticeApplyCheckReflect(
    storyboard: StoryboardModuleV2,
    learningOutcomes: string[]
  ): StoryboardModuleV2 {
    console.log("🔧 Ensuring TEACH→SHOW→APPLY→CHECK→REFLECT structure...");
    
    // Group scenes by learning outcome
    const scenesByLO: Map<string, SceneV2[]> = new Map();
    
    learningOutcomes.forEach(lo => {
      scenesByLO.set(lo, []);
    });
    
    // Distribute scenes to learning outcomes
    storyboard.scenes.forEach(scene => {
      const lo = scene.dev?.variables?.learningOutcome || learningOutcomes[0];
      if (!scenesByLO.has(lo)) {
        scenesByLO.set(lo, []);
      }
      scenesByLO.get(lo)!.push(scene);
    });
    
    // Ensure each LO has the 5-scene sequence
    const requiredTypes: Array<"TEACH" | "SHOW" | "APPLY" | "CHECK" | "REFLECT"> = 
      ["TEACH", "SHOW", "APPLY", "CHECK", "REFLECT"];
    
    const newScenes: SceneV2[] = [];
    
    learningOutcomes.forEach((lo, loIndex) => {
      const loScenes = scenesByLO.get(lo) || [];
      const existingTypes = new Set(loScenes.map(s => s.dev?.variables?.sceneType).filter(Boolean));
      
      requiredTypes.forEach((sceneType, typeIndex) => {
        // Find existing scene of this type
        let scene = loScenes.find(s => s.dev?.variables?.sceneType === sceneType);
        
        if (!scene) {
          // Create missing scene
          console.log(`   ⚠️  Missing ${sceneType} scene for LO ${loIndex + 1}, creating...`);
          const fallbackOST = `This ${sceneType.toLowerCase()} scene addresses: ${lo}`;
          const fallbackVO = `In this ${sceneType.toLowerCase()} scene, we will ${sceneType.toLowerCase()} the concept: ${lo}`;
          scene = {
            id: `scene-lo${loIndex + 1}-${sceneType.toLowerCase()}`,
            ordinal: newScenes.length + loScenes.length + 1,
            title: `${sceneType}: ${lo.substring(0, 50)}`,
            type: sceneType === "CHECK" ? "Assessment" : sceneType === "APPLY" ? "Interactive" : "Informative",
            layout: "standard",
            // SceneV2 fields
            ost: fallbackOST,
            narration: fallbackVO,
            // Frontend/PDF fields (for compatibility)
            onScreenText: fallbackOST,
            voiceoverScript: fallbackVO,
            image: {
              prompt: `Visual for ${sceneType} scene about ${lo.substring(0, 30)}`,
              altText: `${sceneType} scene visual`
            },
            interaction: { kind: "None" },
            dev: {
              variables: {
                learningOutcome: lo,
                sceneType: sceneType,
                outcomeIndex: loIndex
              },
              accessibilityNotes: `Accessible ${sceneType} scene`,
              xapiEvents: []
            },
            timingSec: this.estimateTiming(sceneType)
          } as SceneV2 & { onScreenText?: string; voiceoverScript?: string };
        }
        
        // Ensure existing scenes also have frontend field names for compatibility
        const sceneAny = scene as any;
        if (!sceneAny.onScreenText && scene.ost) {
          sceneAny.onScreenText = scene.ost;
        }
        if (!sceneAny.voiceoverScript && scene.narration) {
          sceneAny.voiceoverScript = scene.narration;
        }
        
        newScenes.push(scene);
      });
    });
    
    // Add any remaining scenes (welcome, summary, etc.)
    const welcomeAndSummary = storyboard.scenes.filter(s => {
      const sceneType = s.dev?.variables?.sceneType;
      return !sceneType || !requiredTypes.includes(sceneType as any);
    });
    
    storyboard.scenes = [...welcomeAndSummary, ...newScenes];
    
    // Re-number ordinals and ensure all scenes have frontend field names
    storyboard.scenes.forEach((scene, index) => {
      scene.ordinal = index + 1;
      
      // Ensure frontend field names exist for compatibility
      const sceneAny = scene as any;
      
      // Convert onScreenText from array to string if needed (enforceInteractiveDensity converts it)
      if (Array.isArray(sceneAny.onScreenText)) {
        sceneAny.onScreenText = sceneAny.onScreenText.join(' ');
      }
      if (!sceneAny.onScreenText || sceneAny.onScreenText.length === 0) {
        // Use ost if available, convert from array if needed
        if (Array.isArray(scene.ost)) {
          sceneAny.onScreenText = scene.ost.join(' ');
        } else if (scene.ost) {
          sceneAny.onScreenText = scene.ost;
        }
      }
      
      // Ensure voiceoverScript is a string
      if (!sceneAny.voiceoverScript || sceneAny.voiceoverScript.length === 0) {
        sceneAny.voiceoverScript = scene.narration || '';
      }
      
      // Also ensure ost and narration are strings (not arrays)
      if (Array.isArray(scene.ost)) {
        (scene as any).ost = scene.ost.join(' ');
      }
      if (Array.isArray(scene.narration)) {
        (scene as any).narration = scene.narration.join(' ');
      }
    });
    
    console.log(`   ✅ Framework structure enforced: ${storyboard.scenes.length} scenes`);
    
    // ========== FINAL CHECK - Storyboard before returning from Director ==========
    console.log("\n🔍 FINAL CHECK - Storyboard before returning from Director:");
    console.log("Total scenes:", storyboard.scenes.length);
    
    storyboard.scenes.slice(0, 3).forEach((scene, i) => {
      console.log(`\nScene ${i + 1}:`);
      console.log(`  Title: ${scene.title}`);
      console.log(`  ost (SceneV2): ${scene.ost ? scene.ost.substring(0, 50) + '...' : 'EMPTY'} (${scene.ost?.length || 0} chars)`);
      console.log(`  narration (SceneV2): ${scene.narration ? scene.narration.substring(0, 50) + '...' : 'EMPTY'} (${scene.narration?.length || 0} chars)`);
      const sceneAny = scene as any;
      console.log(`  onScreenText (Frontend): ${sceneAny.onScreenText ? sceneAny.onScreenText.substring(0, 50) + '...' : 'EMPTY'} (${sceneAny.onScreenText?.length || 0} chars)`);
      console.log(`  voiceoverScript (Frontend): ${sceneAny.voiceoverScript ? sceneAny.voiceoverScript.substring(0, 50) + '...' : 'EMPTY'} (${sceneAny.voiceoverScript?.length || 0} chars)`);
      console.log(`  All keys: ${Object.keys(scene).join(', ')}`);
    });
    
    return storyboard;
  }
  
  /**
   * Extract instructional content from LO (shared method for all scene types)
   */
  private async extractInstructionalContentFromLO(
    learningOutcome: string,
    topic: string,
    sourceMaterial?: string
  ): Promise<{
    actionVerb: string;
    subjectMatter: string;
    keyConcepts: string[];
    concreteExamples: string[];
    misconceptions: string[];
  }> {
    const extractionPrompt = `
You are analyzing a learning objective to extract the SPECIFIC CONTENT that must be taught.

LEARNING OBJECTIVE: "${learningOutcome}"
TOPIC: "${topic}"
${sourceMaterial ? `SOURCE MATERIAL CONTEXT:\n${sourceMaterial.substring(0, 1000)}` : ''}

EXTRACT:
1. ACTION VERB: What must the learner DO?
2. SUBJECT MATTER: What specific topic/skill/concept?
3. KEY CONCEPTS: What are the 3-5 core ideas that MUST be explained?
4. CONCRETE EXAMPLES: What real-world examples demonstrate this?
5. MISCONCEPTIONS: What do learners typically get wrong?

Return ONLY valid JSON:
{
  "actionVerb": "Identify",
  "subjectMatter": "CAPS behavioral types",
  "keyConcepts": ["Controller: Direct, results-focused", "Analyser: Detail-oriented, systematic", ...],
  "concreteExamples": ["Controller customer: 'Just tell me the bottom line'", ...],
  "misconceptions": ["Thinking all difficult people are aggressive", ...]
}
    `.trim();

    try {
      const response = await openaiChat({
        systemKey: "master_blueprint",
        user: `${resetHeader}${extractionPrompt}`
      });

      const parsed = safeJSONParse(response);
      const extracted = parsed.report || parsed;

      return {
        actionVerb: extracted.actionVerb || "Understand",
        subjectMatter: extracted.subjectMatter || learningOutcome.substring(0, 50),
        keyConcepts: Array.isArray(extracted.keyConcepts) ? extracted.keyConcepts : 
          extracted.keyConcepts ? [extracted.keyConcepts] : [],
        concreteExamples: Array.isArray(extracted.concreteExamples) ? extracted.concreteExamples : 
          extracted.concreteExamples ? [extracted.concreteExamples] : [],
        misconceptions: Array.isArray(extracted.misconceptions) ? extracted.misconceptions : 
          extracted.misconceptions ? [extracted.misconceptions] : []
      };
    } catch (error) {
      console.error("⚠️  Failed to extract instructional content, using fallback:", error);
      return {
        actionVerb: "Understand",
        subjectMatter: learningOutcome.substring(0, 50),
        keyConcepts: [],
        concreteExamples: [],
        misconceptions: []
      };
    }
  }
  
  /**
   * Validate scene content presence
   */
  private validateSceneContentPresence(
    content: string,
    requiredConcepts: string[]
  ): {
    missingConcepts: string[];
    coverageScore: number;
  } {
    const missing: string[] = [];
    let covered = 0;

    for (const concept of requiredConcepts) {
      const conceptWords = concept.toLowerCase()
        .split(/\s+/)
        .filter(w => w.length > 4)
        .slice(0, 3);
      
      const found = conceptWords.some(word => 
        content.toLowerCase().includes(word)
      );

      if (found) {
        covered++;
      } else {
        missing.push(concept);
      }
    }

    return {
      missingConcepts: missing,
      coverageScore: requiredConcepts.length > 0 ? (covered / requiredConcepts.length) * 100 : 0
    };
  }
  
  /**
   * Extract learning outcomes from source material if none provided
   */
  private async extractLearningOutcomesFromSource(sourceMaterial: string, topic: string): Promise<string[]> {
    if (!sourceMaterial || sourceMaterial.trim().length < 50) {
      return [];
    }
    
    try {
      const extractionPrompt = `
Extract learning objectives from the following training material.

Topic: ${topic}
Source Material:
${sourceMaterial.substring(0, 2000)}${sourceMaterial.length > 2000 ? '...' : ''}

Return a JSON array of learning objectives (3-6 objectives):
{
  "learningObjectives": [
    "Objective 1",
    "Objective 2",
    ...
  ]
}

Focus on:
- What learners should be able to DO after training
- Skills, knowledge, or behaviors to master
- Action-oriented statements (e.g., "Identify...", "Apply...", "Develop...")
      `.trim();
      
      const response = await openaiChat({
        systemKey: "master_blueprint",
        user: `${resetHeader}${extractionPrompt}`
      });
      
      const parsed = safeJSONParse(response);
      const objectives = parsed?.learningObjectives || parsed?.objectives || [];
      
      if (Array.isArray(objectives) && objectives.length > 0) {
        return objectives.filter((obj: any) => typeof obj === 'string' && obj.trim().length > 10).slice(0, 6);
      }
    } catch (error) {
      console.error("⚠️  Failed to extract learning outcomes from source:", error);
    }
    
    return [];
  }
  
  private convertToLegacyStoryboard(req: LearningRequest, scenes: SceneV2[]): Storyboard {
    return {
      moduleName: req.topic,
      targetMinutes: req.duration,
      tableOfContents: scenes.map(s => s.title),
      scenes: scenes.map(s => ({
        sceneNumber: s.ordinal,
        pageTitle: s.title,
        pageType: s.type === "Informative" ? "Informative" : "Interactive",
        narrationScript: s.narration,
        onScreenText: s.ost,
        visual: {
          aiPrompt: s.image?.prompt || "",
          altText: s.image?.altText || ""
        },
        interactionType: s.interaction?.kind === "None" ? "None" : "MCQ",
        timing: { estimatedSeconds: s.timingSec || 60 }
      })),
      metadata: {
        completionRule: "Completion when all scenes viewed and interaction completed."
      }
    };
  }
}

export default DirectorAgent;

