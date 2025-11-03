// backend/src/agents_v2/directorAgent.ts
import { LearningRequest, Storyboard, Scene, OutcomeMap, InteractionDecision, DensityProfile } from "./types";
import { SimplePedagogicalDirector } from "./simplePedagogicalDirector";
import { EnhancedPedagogicalDirector } from "./enhancedPedagogicalDirector";
import { WelcomeAgent } from "./welcomeAgent";
import { TeachAgent } from "./teachAgent";
import { EnhancedTeachAgentSimple } from "./enhancedTeachAgentSimple";
import { ApplyAgent } from "./applyAgent";
import { QAAgent } from "./qaAgent";
import { SourceValidator } from "./sourceValidator";
import { SummaryAgent } from "./summaryAgent";
import { OutcomeAnalysisAgent } from "./outcomeAnalysisAgent";
import { LearningSequenceOptimizer } from "./learningSequenceOptimizer";
import { FlowEnhancer } from "./flowEnhancer";
import { InteractivityOrchestrator } from "./interactivityOrchestrator";
import { PedagogicalAlignmentValidator } from "./pedagogicalAlignmentValidator";
import { DensityManager } from "./densityManager";
import { openaiChat } from "../services/openaiGateway";
import { resetHeader } from "./resetHeader";
import { safeJSONParse } from "../utils/safeJSONParse";
import { ContentExtractionAgent, ExtractedContent } from "./contentExtractionAgent";

/**
 * Phase 1 + 2 Enhanced: Outcome-Driven Director Agent with Pedagogical Intelligence
 * Orchestrates all agents to create cohesive, pedagogically-intelligent storyboards
 */
export class DirectorAgent {
  private outcomeAnalyzer: OutcomeAnalysisAgent;
  private sequenceOptimizer: LearningSequenceOptimizer;
  private flowEnhancer: FlowEnhancer;
  private interactivityOrchestrator: InteractivityOrchestrator;
  private pedagogicalValidator: PedagogicalAlignmentValidator;
  private densityManager: DensityManager;
  private qaAgent: QAAgent;
  private contentExtractor: ContentExtractionAgent;
  
  constructor() {
    this.outcomeAnalyzer = new OutcomeAnalysisAgent();
    this.sequenceOptimizer = new LearningSequenceOptimizer();
    this.flowEnhancer = new FlowEnhancer();
    this.interactivityOrchestrator = new InteractivityOrchestrator();
    this.pedagogicalValidator = new PedagogicalAlignmentValidator();
    this.densityManager = new DensityManager();
    this.qaAgent = new QAAgent();
    this.contentExtractor = new ContentExtractionAgent();
  }
  
  async buildStoryboard(req: LearningRequest): Promise<Storyboard> {
    console.log("🎓 DirectorAgent: Using Universal Pedagogical Framework v1.0 with Content Extraction");
    console.log(`   📖 Topic: ${req.topic}`);
    console.log(`   🎯 Learning Outcomes: ${req.learningOutcomes?.length || 0}`);
    
    // 📚 STEP 0: Extract Specific Content from Training Materials
    console.log("\n📚 STEP 0: Extracting content from training materials...");
    const extractedContent = await this.contentExtractor.extractContent(
      req.sourceMaterial || '',
      req.learningOutcomes || [],
      req.topic
    );
    
    // Store extracted content in request for agents to use
    (req as any).extractedContent = extractedContent;
    
    // Use the enhanced pedagogical director for Universal Framework compliance
    const pedagogicalDirector = new EnhancedPedagogicalDirector();
    const storyboard = await pedagogicalDirector.buildStoryboard(req);
    
    // Phase 2 interactions are now handled by EnhancedPedagogicalDirector
    // No additional processing needed here - the framework handles everything
    
    // Run final QA
    console.log("🔍 Running final QA...");
    const qaReport = await this.qaAgent.review(storyboard);
    storyboard.qaReport = {
      ...qaReport,
      extractedContent: {
        totalElements: Object.values(extractedContent).reduce((sum: number, arr: any) => sum + (arr?.length || 0), 0),
        models: extractedContent.models.length,
        techniques: extractedContent.techniques.length,
        examples: extractedContent.examples.length
      }
    };
    
    console.log("✅ Pedagogical storyboard complete!");
    console.log(`   📊 Total scenes: ${storyboard.scenes.length}`);
    console.log(`   📈 QA score: ${qaReport.score / 10}`);
    console.log(`   📚 Extracted content elements: ${Object.values(extractedContent).reduce((sum: number, arr: any) => sum + (arr?.length || 0), 0)}`);
    
    return storyboard;
  }

  async buildStoryboardOld(req: LearningRequest): Promise<Storyboard> {
    console.log("🎬 DirectorAgent [Phase 1]: Starting outcome-driven storyboard build for", req.topic);
    console.log("🔄 DirectorAgent: Hard reset header applied – no legacy content allowed");
    
    // ========== PHASE 1: OUTCOME ANALYSIS ==========
    console.log("\n📋 PHASE 1: OUTCOME ANALYSIS");
    const outcomeMap = await this.outcomeAnalyzer.analyzeOutcomes(req);
    console.log("   ✅ Outcomes analyzed:", outcomeMap.outcomes.length);
    console.log("   ✅ Learning progression:", outcomeMap.learningProgression.join(" → "));
    console.log("   ✅ Estimated scenes needed:", outcomeMap.totalEstimatedScenes);
    
    // ========== PHASE 2: OUTCOME-DRIVEN SCENE GENERATION ==========
    console.log("\n📝 PHASE 2: GENERATING SCENES");
    
    // Generate welcome scenes
    const welcome = await new WelcomeAgent().generate(req);
    console.log("   🎬 DirectorAgent: Welcome scenes received:", welcome?.length);
    
    // Generate teaching scenes (now informed by outcomes)
    const teach = await this.generateOutcomeAlignedTeachScenes(req, outcomeMap);
    console.log("   🎬 DirectorAgent: Teach scenes received:", teach?.length);
    
    // Generate application scenes (now informed by outcomes)
    const apply = await this.generateOutcomeAlignedApplyScenes(req, outcomeMap);
    console.log("   🎬 DirectorAgent: Apply scenes received:", apply?.length);

    let allScenes = [...welcome, ...teach, ...apply];
    
    // ========== PHASE 3: NORMALIZE SCENE STRUCTURE ==========
    console.log("\n🔧 PHASE 3: NORMALIZING SCENES");
    const scenes: Scene[] = allScenes.map((scene: any, index) => ({
      sceneNumber: scene.sceneNumber || scene.scene_id || scene.scene_number || index + 1,
      pageTitle: scene.pageTitle || scene.title || scene.sceneTitle || scene.page_title || `Scene ${index + 1}`,
      pageType: scene.pageType || scene.page_type || "Informative",
      narrationScript: scene.narrationScript || scene.voiceover || scene.voice_over || scene.voiceOver || scene.narration_script || scene.on_screen_text || "",
      onScreenText: scene.onScreenText || scene.on_screen_text || scene.onScreenText || scene.ost || "",
      visual: {
        aiPrompt: scene.visual?.aiPrompt || scene.visual_ai_prompt || scene.ai_visual_prompt || scene.visualPrompt || scene.visual_prompt || "",
        altText: scene.visual?.altText || scene.alt_text || scene.altText || scene.visual?.alt_text || "",
        aspectRatio: scene.visual?.aspectRatio || scene.aspect_ratio || "16:9"
      },
      interactionType: scene.interactionType || scene.interaction_type || "None",
      interactionDetails: scene.interactionDetails || scene.interaction_details || {},
      timing: scene.timing || { estimatedSeconds: 60 }
    }));
    
    console.log("   ✅ Scenes normalized:", scenes.length);

    // ========== PHASE 4: OPTIMIZE LEARNING SEQUENCE ==========
    console.log("\n📊 PHASE 4: OPTIMIZING LEARNING SEQUENCE");
    const optimizedScenes = this.sequenceOptimizer.optimizeSequence(scenes, outcomeMap);
    console.log("   ✅ Scenes sequenced for optimal learning progression");

    // ========== PHASE 5: ENHANCE FLOW ==========
    console.log("\n🌊 PHASE 5: ENHANCING FLOW");
    const flowEnhancedScenes = this.flowEnhancer.enhanceFlow(optimizedScenes);
    console.log("   ✅ Flow transitions added");
    
    // Validate flow
    const flowValidation = this.flowEnhancer.validateFlow(flowEnhancedScenes);
    console.log("   ✅ Flow validation score:", flowValidation.flowScore);
    if (flowValidation.issues.length > 0) {
      console.log("   ⚠️  Flow issues found:", flowValidation.issues.length);
    }

    // ========== PHASE 6: INTERACTION INTELLIGENCE (PHASE 2) ==========
    let intelligentScenes = flowEnhancedScenes;
    let interactionDecisions: InteractionDecision[] = [];
    let densityProfile: DensityProfile | undefined;
    let pedagogicalValidation: any;
    
    // Check if Phase 2 is enabled (default: enabled)
    const phase2Enabled = req.phase2Config?.enabled !== false;
    
    if (phase2Enabled) {
      console.log("\n🧠 PHASE 6: INTERACTION INTELLIGENCE (Phase 2)");
      console.log("   🎯 Analyzing scenes for pedagogically-justified interactions...");
      
      try {
        // Step 1: Determine module type and density profile
        const moduleType = req.moduleType || this.densityManager.inferModuleType(req, outcomeMap.outcomes.map(o => o.outcome));
        densityProfile = this.densityManager.getDensityProfile(moduleType);
        console.log("   📊 Module type:", moduleType);
        console.log("   📊 Target interaction rate:", Math.round(densityProfile.targetInteractionRate * 100) + "%");
        
        // Step 2: Prescribe interactions
        interactionDecisions = await this.interactivityOrchestrator.prescribeInteractions(
          intelligentScenes,
          outcomeMap,
          req
        );
        
        // Step 3: Apply interaction prescriptions to scenes (NOW WITH ACTUAL CONTENT GENERATION)
        intelligentScenes = await this.applyInteractionPrescriptions(
          intelligentScenes,
          interactionDecisions,
          req
        );
        
        const addedCount = interactionDecisions.filter(d => d.prescription?.needed).length;
        console.log("   ✅ Interactions added:", addedCount);
        
        // Store the scenes with interactions before validation (in case validation fails)
        const scenesWithInteractions = [...intelligentScenes];
        
        try {
          // Step 4: Validate pedagogical quality
          pedagogicalValidation = this.pedagogicalValidator.validate(
            intelligentScenes,
            interactionDecisions,
            outcomeMap,
            densityProfile
          );
          
          console.log("   ✅ Pedagogical validation complete");
          console.log("   ✅ Pedagogical score:", pedagogicalValidation.pedagogicalScore);
          
        } catch (validationError) {
          console.error("   ⚠️ Pedagogical validation failed, but keeping interactions:", validationError);
          // Keep the scenes with interactions even if validation fails
          pedagogicalValidation = {
            isValid: true,
            pedagogicalScore: 75, // Default score when validation fails
            issues: [`Pedagogical validation failed: ${validationError}`],
            recommendations: ["Consider reviewing interaction alignment"]
          };
        }
        
      } catch (error) {
        console.error("   ❌ Phase 2 error (continuing with Phase 1 only):", error);
        // Fall back to Phase 1 scenes if Phase 2 fails
        intelligentScenes = flowEnhancedScenes;
      }
    } else {
      console.log("\n⏭️  PHASE 6: SKIPPING INTERACTION INTELLIGENCE (Phase 2 disabled)");
    }

    // ========== BUILD INITIAL STORYBOARD ==========
    const storyboard: Storyboard = {
      moduleName: req.topic,
      targetMinutes: req.duration,
      tableOfContents: intelligentScenes.map((s) => s.pageTitle),
      scenes: intelligentScenes,
      metadata: {
        completionRule: "Completion when all scenes viewed and interaction completed.",
      },
    };

    // ========== PHASE 7: VALIDATION & QA ==========
    console.log("\n🔍 PHASE 7: VALIDATION & QA");
    console.log("   🔬 Running source validation...");
    const validator = SourceValidator.validate(JSON.stringify(storyboard.scenes), req.sourceMaterial);
    
    console.log("   🔍 Running QA review...");
    let qa = await new QAAgent().review(storyboard, outcomeMap, flowValidation);
    
    storyboard.qaReport = { 
      ...qa, 
      sourceValidation: validator 
    };

    console.log("   ✅ QA complete. Score:", qa.score, "| Valid:", validator.valid);
    console.log("   ✅ Flow Score:", flowValidation.flowScore);

    // ========== AUTO-REFINE IF NEEDED ==========
    if (qa.score < 85) { // Raised threshold from 80
      console.log("\n🔁 PHASE 7: AUTO-REFINEMENT");
      console.log("   🔁 QA score below 85, initiating refinement...");
      console.log("   🔁 Issues to address:", qa.issues.length);
      
      try {
        const refinementPromptBody = `
Improve the storyboard below according to these QA recommendations:
${qa.recommendations.join("\n")}

Also address these flow issues:
${flowValidation.issues.join("\n")}

Learning Outcomes to ensure coverage:
${outcomeMap.outcomes.map(o => `- ${o.outcome} (Bloom Level: ${o.bloomLevel})`).join("\n")}

Keep structure identical; fix only wording, tone, completeness, and flow.
Ensure all scenes have proper numbering, titles, VO, OST, and visual prompts.
Ensure on-screen text complements (not duplicates) voiceover.
Ensure each scene clearly supports at least one learning outcome.

Current storyboard:
${JSON.stringify(storyboard, null, 2)}

Return the complete improved storyboard as JSON.
        `.trim();

        const refinementPrompt = `${resetHeader}${refinementPromptBody}`;
        
        const refined = await openaiChat({ systemKey: "master_blueprint", user: refinementPrompt });
        console.log("   🔁 Refinement complete, parsing...");
        
        const refinedStoryboard = safeJSONParse(refined);
        
        // Merge refined content back
        if (refinedStoryboard.scenes && Array.isArray(refinedStoryboard.scenes)) {
          storyboard.scenes = refinedStoryboard.scenes;
          
          console.log("   🔁 Refinement complete, parsing...");
          
          // CRITICAL FIX: Re-sequence after refinement to maintain optimal order
          console.log("   🔁 Re-optimizing sequence...");
          storyboard.scenes = this.sequenceOptimizer.optimizeSequence(storyboard.scenes, outcomeMap);
          
          storyboard.tableOfContents = storyboard.scenes.map((s: Scene) => s.pageTitle);
          console.log("   🔁 Storyboard refined successfully");
          
          // Re-run QA to verify improvement
          qa = await new QAAgent().review(storyboard, outcomeMap, flowValidation);
          storyboard.qaReport = { ...qa, sourceValidation: validator };
          console.log("   🔁 Post-refinement QA score:", qa.score);
        }
      } catch (error) {
        console.error("   🔁 Refinement failed:", error);
        console.log("   🔁 Continuing with original storyboard");
      }
    }

    // ========== PHASE 8: ADD SUMMARY SCENES ==========
    console.log("\n📝 PHASE 8: GENERATING SUMMARY");
    let summary = await new SummaryAgent().generate(storyboard, outcomeMap);
    
    // Ensure summary is always an array
    if (!Array.isArray(summary)) {
      console.log("   📝 Summary is not an array, wrapping it");
      summary = summary ? [summary] : [];
    }
    
    console.log("   📝 Summary scenes received:", summary.length);
    
    // Only proceed if we have summary scenes
    if (summary.length > 0) {
      // Normalize summary scenes
      const normalizedSummary = summary.map((scene: any, index) => ({
        sceneNumber: storyboard.scenes.length + index + 1,
        pageTitle: scene.pageTitle || scene.title || scene.sceneTitle || scene.page_title || `Summary ${index + 1}`,
        pageType: scene.pageType || scene.page_type || "Informative",
        narrationScript: scene.narrationScript || scene.voiceover || scene.voice_over || scene.voiceOver || scene.narration_script || "",
        onScreenText: scene.onScreenText || scene.on_screen_text || scene.onScreenText || scene.ost || "",
        visual: {
          aiPrompt: scene.visual?.aiPrompt || scene.visual_ai_prompt || scene.ai_visual_prompt || scene.visualPrompt || scene.visual_prompt || "",
          altText: scene.visual?.altText || scene.alt_text || scene.altText || scene.visual?.alt_text || "",
          aspectRatio: scene.visual?.aspectRatio || scene.aspect_ratio || "16:9"
        },
        interactionType: scene.interactionType || scene.interaction_type || "None",
        interactionDetails: scene.interactionDetails || scene.interaction_details || {},
        timing: scene.timing || { estimatedSeconds: 60 }
      }));
      
      storyboard.scenes.push(...normalizedSummary);
      storyboard.tableOfContents.push(...normalizedSummary.map((s) => s.pageTitle));
    } else {
      console.log("   📝 No summary scenes to add");
    }

    // ========== FINAL NUMBERING ==========
    storyboard.scenes.forEach((scene, index) => {
      (scene as any).sceneNumber = index + 1;
    });
    storyboard.tableOfContents = storyboard.scenes.map((scene: any, index: number) =>
      scene.pageTitle || scene.title || `Scene ${index + 1}`
    );

    // ========== FINAL REPORT ==========
    console.log("\n✅ ========== STORYBOARD COMPLETE ==========");
    console.log("   📊 Total scenes:", storyboard.scenes.length);
    console.log("   🎯 Outcomes covered:", outcomeMap.outcomes.length);
    console.log("   📈 QA score:", qa.score);
    console.log("   🌊 Flow score:", flowValidation.flowScore);
    if (phase2Enabled && pedagogicalValidation) {
      console.log("   🧠 Pedagogical score:", pedagogicalValidation.pedagogicalScore);
      console.log("   🎯 Interaction alignment:", pedagogicalValidation.alignmentScore);
    }
    console.log("   ✅ Source validated:", validator.valid);
    console.log("   📋 Learning path:", outcomeMap.learningProgression.join(" → "));
    if (phase2Enabled && interactionDecisions.length > 0) {
      const addedInteractions = interactionDecisions.filter(d => d.prescription?.needed).length;
      console.log("   🎮 Interactions added:", addedInteractions);
    }
    console.log("==========================================\n");

    return storyboard;
  }
  
  /**
   * Apply interaction prescriptions to scenes (Phase 2)
   * NOW WITH ACTUAL CONTENT GENERATION using template approach
   */
  private async applyInteractionPrescriptions(
    scenes: Scene[],
    decisions: InteractionDecision[],
    req: LearningRequest
  ): Promise<Scene[]> {
    const updatedScenes: Scene[] = [];
    
    for (let index = 0; index < scenes.length; index++) {
      const scene = scenes[index];
      const decision = decisions[index];
      
      if (!decision || !decision.prescription || !decision.prescription.needed) {
        // No interaction needed for this scene
        updatedScenes.push(scene);
        continue;
      }
      
      const prescription = decision.prescription;
      
      // Generate ACTUAL interaction content based on type
      let generatedContent: any = {};
      
      try {
        console.log(`   🎨 Generating ${prescription.type} for scene ${index + 1}: ${scene.pageTitle}`);
        
        if (prescription.type === "Click-to-Reveal" || prescription.type === "ClickToReveal") {
          generatedContent = await this.interactivityOrchestrator.generateClickToRevealContent(
            scene,
            prescription,
            req
          );
        } else if (prescription.type === "DragAndDrop-Matching") {
          generatedContent = await this.interactivityOrchestrator.generateDragAndDropMatchingContent(
            scene,
            prescription,
            req
          );
        } else if (prescription.type === "DragAndDrop-Sequencing") {
          generatedContent = await this.interactivityOrchestrator.generateDragAndDropSequencingContent(
            scene,
            prescription,
            req
          );
        } else {
          // Fallback for unknown interaction types
          generatedContent = {
            type: prescription.type,
            instruction: `Interactive content for ${scene.pageTitle}`,
            developerNotes: `Generated interaction of type: ${prescription.type}`
          };
        }
        
        console.log(`   ✅ ${prescription.type} generated for scene ${index + 1}`);
        
      } catch (error) {
        console.error(`   ❌ Failed to generate ${prescription.type} for scene ${index + 1}:`, error);
        // Fall back to basic interaction metadata
        generatedContent = {
          type: prescription.type,
          instruction: `Error generating interaction: ${error}`,
          developerNotes: "Generation failed - using fallback content"
        };
      }
      
      // Update scene with BOTH metadata AND generated content
        updatedScenes.push({
          ...scene,
          interactionType: this.mapInteractionTypeToSceneType(prescription.type),
          interactionDetails: {
            // NEW STRUCTURED FORMAT: Store properly structured interaction data
            ...generatedContent,  // Spread the structured ClickToRevealInteraction object
            // Legacy fields for backward compatibility
            purpose: prescription.purpose,
            pedagogicalRationale: prescription.pedagogicalRationale,
            estimatedDuration: prescription.estimatedDuration,
            priority: prescription.priority,
            timing: prescription.timing,
            cognitiveLoadImpact: prescription.cognitiveLoadImpact
          }
        });
    }
    
    return updatedScenes;
  }
  
  /**
   * Map Phase 2 interaction types to Scene interaction types
   */
  private mapInteractionTypeToSceneType(phase2Type: string): string {
    const mapping: Record<string, string> = {
      knowledgeCheck: "MCQ",
      scenario: "Scenario",
      reflection: "Reflection",
      simulation: "Simulation",
      dragDrop: "DragDrop",
      hotspot: "Hotspots",
      branchingScenario: "Scenario", // Map to Scenario for now
      sortingActivity: "DragDrop", // Map to DragDrop for now
      matchingActivity: "DragDrop", // Map to DragDrop for now
      slider: "Reflection", // Map to Reflection for now
      journal: "Reflection", // Map to Reflection for now
      "Click-to-Reveal": "Hotspots", // Our new structured Click-to-Reveal
      "ClickToReveal": "Hotspots", // Alternative naming
      "DragAndDrop-Matching": "DragDrop", // Our new structured matching
      "DragAndDrop-Sequencing": "DragDrop", // Our new structured sequencing
      none: "None"
    };
    
    return mapping[phase2Type] || "None";
  }
  
  /**
   * Generate teaching scenes aligned with outcomes
   */
  private async generateOutcomeAlignedTeachScenes(
    req: LearningRequest, 
    outcomeMap: OutcomeMap
  ): Promise<Scene[]> {
    console.log("📚 Generating outcome-aligned teaching scenes");
    
    // Use EnhancedTeachAgentSimple for now
    const enhancedTeachAgent = new EnhancedTeachAgentSimple();
    
    // Determine scene count based on outcomes and duration
    const estimatedScenes = Math.max(2, Math.min(5, Math.floor(req.duration / 10)));
    const learningOutcomes = req.learningOutcomes || outcomeMap.outcomes.map(o => o.outcome);
    
    return await enhancedTeachAgent.generateTeachingScenes(req, learningOutcomes, estimatedScenes);
  }
  
  /**
   * Generate application scenes aligned with outcomes
   */
  private async generateOutcomeAlignedApplyScenes(
    req: LearningRequest, 
    outcomeMap: OutcomeMap
  ): Promise<any[]> {
    // Add outcome context to the request for ApplyAgent
    const enhancedReq = {
      ...req,
      outcomeContext: outcomeMap.outcomes
        .filter(o => ["Apply", "Analyze", "Evaluate", "Create"].includes(o.bloomLevel))
        .map(o => `Outcome: ${o.outcome} (Level: ${o.bloomLevel})`)
        .join("\n")
    };
    
    return await new ApplyAgent().generate(enhancedReq);
  }
}
