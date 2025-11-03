// backend/src/agents_v2/enhancedPedagogicalDirector.ts
import { LearningRequest, Storyboard, Scene } from "./types";
import { WelcomeAgent } from "./welcomeAgent";
import { EnhancedTeachAgentSimple } from "./enhancedTeachAgentSimple";
import { ApplyAgent } from "./applyAgent";
import { SummaryAgent } from "./summaryAgent";
import { OutcomeAnalysisAgent } from "./outcomeAnalysisAgent";
import { InteractivityOrchestrator } from "./interactivityOrchestrator";
import { pedagogicalValidator, UNIVERSAL_PEDAGOGICAL_FRAMEWORK } from "./universalPedagogicalFramework";
import { InteractivitySequencer } from "../agents/InteractivitySequencer";
import { SceneMetadata, InteractivityDecision } from "../types/storyboardTypes";
const { getBuilder } = require("../agents/interactivityBuilders");

export class EnhancedPedagogicalDirector {
  private welcomeAgent: WelcomeAgent;
  private teachAgent: EnhancedTeachAgentSimple;
  private applyAgent: ApplyAgent;
  private summaryAgent: SummaryAgent;
  private outcomeAnalysisAgent: OutcomeAnalysisAgent;
  private interactivityOrchestrator: InteractivityOrchestrator;
  private interactivitySequencer: InteractivitySequencer;
  
  // Track interactivities for novelty scoring
  private previousInteractivities: string[] = [];

  constructor() {
    this.welcomeAgent = new WelcomeAgent();
    this.teachAgent = new EnhancedTeachAgentSimple();
    this.applyAgent = new ApplyAgent();
    this.summaryAgent = new SummaryAgent();
    this.outcomeAnalysisAgent = new OutcomeAnalysisAgent();
    this.interactivityOrchestrator = new InteractivityOrchestrator();
    this.interactivitySequencer = new InteractivitySequencer();
    console.log('🎮 InteractivitySequencer integration active (Phase 2a)');
  }

  async buildStoryboard(req: LearningRequest): Promise<Storyboard> {
    console.log("🎓 EnhancedPedagogicalDirector: Enforcing Universal Pedagogical Framework v1.0");
    console.log("📋 Framework Rules: TEACH → PRACTICE → APPLY → ASSESS per Learning Outcome");

    // Reset interactivity tracking for new storyboard
    this.previousInteractivities = [];

    let currentSceneNumber = 1;
    const allScenes: Scene[] = [];

    // Analyze outcomes once
    const outcomeAnalysis = await this.outcomeAnalysisAgent.analyzeOutcomes(req);
    const learningOutcomes = outcomeAnalysis.outcomes.map(o => o.outcome);

    console.log(`🎯 Processing ${learningOutcomes.length} learning outcomes with universal framework`);

    // 1. Welcome & Orientation (Framework Enforced)
    console.log("👋 Phase 1: Welcome & Orientation (Framework Enforced)");
    const welcomeScenes = await this.welcomeAgent.generate(req);
    const welcomeScenesRenumbered = welcomeScenes.map((scene, index) => ({ 
      ...scene, 
      sceneNumber: currentSceneNumber + index,
      pedagogicalPhase: "Welcome"
    }));
    allScenes.push(...welcomeScenesRenumbered);
    currentSceneNumber += welcomeScenesRenumbered.length;

    // 2. Learning Outcomes Overview (Framework Enforced)
    console.log("📋 Phase 2: Learning Outcomes Overview (Framework Enforced)");
    const learningOutcomesScene: Scene = {
      sceneNumber: currentSceneNumber,
      pageTitle: "Learning Outcomes Overview",
      pageType: "Informative",
      narrationScript: `By the end of this ${req.topic} module, you will master these key learning outcomes: ${learningOutcomes.map((outcome, i) => `${i + 1}. ${outcome}`).join(' ')}. Each outcome follows our proven TEACH → PRACTICE → APPLY → ASSESS learning sequence to ensure deep understanding and practical application.`,
      onScreenText: `Learning Outcomes: ${learningOutcomes.map((outcome, i) => `${i + 1}. ${outcome}`).join(' | ')}`,
      visual: {
        aiPrompt: `Professional learning outcomes display for ${req.topic}, showing numbered objectives with clear progression indicators`,
        altText: `Learning outcomes for ${req.topic} with progression indicators`
      },
      interactionType: "None",
      timing: { estimatedSeconds: 60 },
      pedagogicalPhase: "LearningOutcomes"
    };
    allScenes.push(learningOutcomesScene);
    currentSceneNumber++;

    // 3. TEACH → PRACTICE → APPLY → ASSESS for each Learning Outcome (Framework Enforced)
    for (let i = 0; i < learningOutcomes.length; i++) {
      const outcome = learningOutcomes[i];
      console.log(`🎓 Processing Learning Outcome ${i + 1}: ${outcome.substring(0, 50)}...`);

      // TEACH Phase (Framework Enforced)
      console.log(`   📚 TEACH: ${outcome.substring(0, 40)}...`);
      const teachingScenes = await this.teachAgent.generateTeachingScenes(
        req,
        [outcome], // One outcome at a time
        1
      );
      
      const teachingScene = teachingScenes[0];
      if (teachingScene) {
        const enhancedTeachingScene: Scene = {
          ...teachingScene,
          sceneNumber: currentSceneNumber,
          pedagogicalPhase: "Teach",
          learningOutcomeIndex: i,
          learningOutcome: outcome,
          // Ensure framework compliance
          narrationScript: this.enhanceNarrationWithFramework(teachingScene.narrationScript, outcome, "Teach"),
          onScreenText: this.enhanceOnScreenTextWithFramework(teachingScene.onScreenText, outcome, "Teach")
        };
        allScenes.push(enhancedTeachingScene);
        currentSceneNumber++;
      }

      // PRACTICE Phase (Framework Enforced)
      console.log(`   🎮 PRACTICE: ${outcome.substring(0, 40)}...`);
      const practiceScene: Scene = {
        sceneNumber: currentSceneNumber,
        pageTitle: `Practice: ${outcome.substring(0, 50)}`,
        pageType: "Interactive",
        narrationScript: `Now let's practice applying what you've learned about ${outcome}. This interactive exercise will help reinforce your understanding and prepare you for real-world application. Follow the instructions carefully and use the knowledge from the previous teaching scene.`,
        onScreenText: `Practice Exercise: Apply your knowledge of ${outcome.substring(0, 40)} through interactive activities.`,
        visual: {
          aiPrompt: `Interactive practice environment for ${outcome}, showing engaging learning activities and clear instructions with reference to teaching content`,
          altText: `Interactive practice exercise for ${outcome}`
        },
        interactionType: "None", // Will be populated by InteractivityOrchestrator
        timing: { estimatedSeconds: 120 },
        pedagogicalPhase: "Practice",
        learningOutcomeIndex: i,
        learningOutcome: outcome
      };
      allScenes.push(practiceScene);
      currentSceneNumber++;

      // APPLY Phase (Framework Enforced)
      console.log(`   🎯 APPLY: ${outcome.substring(0, 40)}...`);
      const applyScene: Scene = {
        sceneNumber: currentSceneNumber,
        pageTitle: `Apply: ${outcome.substring(0, 50)}`,
        pageType: "Interactive",
        narrationScript: `Let's apply ${outcome} in a realistic scenario. Based on what you learned in the teaching phase and practiced in the interactive exercise, make decisions and see how your choices impact the outcome.`,
        onScreenText: `Real-world Application: Use your knowledge of ${outcome.substring(0, 40)} to navigate this scenario.`,
        visual: {
          aiPrompt: `Realistic workplace scenario for ${outcome}, showing decision points and potential outcomes based on teaching principles`,
          altText: `Real-world application scenario for ${outcome}`
        },
        interactionType: "Scenario",
        timing: { estimatedSeconds: 150 },
        pedagogicalPhase: "Apply",
        learningOutcomeIndex: i,
        learningOutcome: outcome
      };
      allScenes.push(applyScene);
      currentSceneNumber++;

      // ASSESS Phase (Framework Enforced)
      console.log(`   ✅ ASSESS: ${outcome.substring(0, 40)}...`);
      const assessmentScene: Scene = {
        sceneNumber: currentSceneNumber,
        pageTitle: `Knowledge Check: ${outcome.substring(0, 50)}`,
        pageType: "Interactive",
        narrationScript: `Let's assess your understanding of ${outcome}. This knowledge check will help verify that you've mastered the key concepts from the teaching phase and can apply them effectively.`,
        onScreenText: `Knowledge Check: Test your understanding of ${outcome.substring(0, 40)} concepts.`,
        visual: {
          aiPrompt: `Assessment interface for ${outcome}, showing quiz elements and progress indicators with references to teaching content`,
          altText: `Knowledge assessment for ${outcome}`
        },
        interactionType: "MCQ",
        timing: { estimatedSeconds: 90 },
        pedagogicalPhase: "Assess",
        learningOutcomeIndex: i,
        learningOutcome: outcome
      };
      allScenes.push(assessmentScene);
      currentSceneNumber++;
    }

    // 4. Summary Phase (Framework Enforced)
    console.log("📝 Phase 4: Summary & Reflection (Framework Enforced)");
    const summaryScenes = [
      {
        sceneNumber: currentSceneNumber,
        pageTitle: "Key Takeaways Summary",
        pageType: "Informative",
        narrationScript: `Congratulations! You've completed the ${req.topic} module following our proven TEACH → PRACTICE → APPLY → ASSESS learning sequence. Let's recap the key concepts you've mastered and how to apply them in your daily work.`,
        onScreenText: `Key Takeaways: Review the essential concepts from this ${req.topic} module.`,
        visual: {
          aiPrompt: `Summary visual for ${req.topic}, showing key concepts and takeaways in an organized, memorable format`,
          altText: `Summary of key concepts for ${req.topic}`
        },
        interactionType: "None",
        timing: { estimatedSeconds: 60 },
        pedagogicalPhase: "Summary"
      },
      {
        sceneNumber: currentSceneNumber + 1,
        pageTitle: "Next Steps & Application",
        pageType: "Informative",
        narrationScript: `Now that you understand ${req.topic} through our comprehensive learning approach, it's time to put this knowledge into practice. Consider how you can apply these concepts in your workplace and continue developing these skills.`,
        onScreenText: `Next Steps: Plan how to apply ${req.topic} concepts in your daily work.`,
        visual: {
          aiPrompt: `Action planning visual for ${req.topic}, showing next steps and application strategies`,
          altText: `Next steps and application planning for ${req.topic}`
        },
        interactionType: "None",
        timing: { estimatedSeconds: 60 },
        pedagogicalPhase: "NextSteps"
      }
    ];
    allScenes.push(...summaryScenes);
    currentSceneNumber += summaryScenes.length;

    // Phase 2a: Inject interactivity decisions into all scenes
    console.log("🎮 Phase 2a: Injecting InteractivitySequencer decisions...");
    const scenesWithDecisions = allScenes.map((scene, index) => {
      const metadata = this.buildSceneMetadata(scene, index, req);
      return this.injectInteractivityDecision(scene, metadata);
    });

    console.log(`✅ Interactivity decisions injected for ${scenesWithDecisions.length} scenes`);

    // Phase 3: Generate interactivity content
    console.log("🎨 Phase 3: Generating interactivity content...");
    const scenesWithContent = scenesWithDecisions.map(scene => {
      return this.applyInteractivityContent(scene);
    });

    const contentCount = scenesWithContent.filter(s => s.interactionDetails && s.interactionDetails.type !== 'none').length;
    console.log(`✅ Interactivity content generated for ${contentCount} scenes`);

    // Create storyboard with framework metadata
    const storyboard: Storyboard = {
      moduleName: req.topic,
      targetMinutes: req.duration,
      tableOfContents: scenesWithContent.map(s => s.pageTitle),
      scenes: scenesWithContent,
      metadata: {
        completionRule: "Completion when all scenes viewed and interactions completed.",
        pedagogicalFrameworkVersion: UNIVERSAL_PEDAGOGICAL_FRAMEWORK.version,
        enforcedSequence: UNIVERSAL_PEDAGOGICAL_FRAMEWORK.enforcedSequence,
        complianceChecks: UNIVERSAL_PEDAGOGICAL_FRAMEWORK.complianceChecks,
        learningOutcomes: learningOutcomes,
        frameworkEnforced: true
      },
      qaReport: { score: 0, issues: [], recommendations: [] } // Will be populated by DirectorAgent
    };

    // Apply Phase 2 interactions if enabled
    if (req.phase2Config?.enabled) {
      console.log("🧠 Applying Phase 2 interactions to framework-compliant storyboard...");
      try {
        // Create outcome map for interaction prescription
        const outcomeMap: any = {
          outcomes: learningOutcomes.map(outcome => ({ 
            outcome, 
            complexity: 1, 
            prerequisites: [],
            bloomLevel: this.determineBloomLevel(outcome)
          }))
        };
        
        const interactionDecisions = await this.interactivityOrchestrator.prescribeInteractions(
          storyboard.scenes,
          outcomeMap,
          req
        );
        
        console.log("🔍 Interaction decisions received:", interactionDecisions.length);
        interactionDecisions.forEach((decision, index) => {
          if (decision.prescription?.needed) {
            console.log(`   📋 Scene ${index + 1}: ${decision.prescription.type} - ${decision.prescription.purpose}`);
          }
        });
        
        // Apply the interaction decisions to scenes
        const enhancedScenes = await this.applyInteractionDecisions(storyboard.scenes, interactionDecisions, req);
        storyboard.scenes = enhancedScenes;
        storyboard.tableOfContents = enhancedScenes.map(s => s.pageTitle);
        
        const addedCount = interactionDecisions.filter(d => d.prescription?.needed).length;
        console.log(`✅ Phase 2 interactions applied: ${addedCount} interactions added`);
      } catch (error) {
        console.log(`❌ Phase 2 error (continuing with framework structure only): ${error}`);
        // Keep the framework-compliant storyboard even if interactions fail
      }
    }

    // Validate framework compliance
    console.log("🔍 Validating Universal Pedagogical Framework compliance...");
    const complianceReport = pedagogicalValidator.validateStoryboard(storyboard);
    
    if (!complianceReport.passed) {
      console.log("⚠️ Framework compliance issues found:");
      complianceReport.violations.forEach(violation => console.log(`   - ${violation}`));
      console.log("🔄 Regenerating with framework enforcement...");
      // In a real implementation, you would regenerate the storyboard
      // For now, we'll add the violations to the QA report
      storyboard.qaReport.issues.push(...complianceReport.violations);
      storyboard.qaReport.recommendations.push(...complianceReport.recommendations);
    } else {
      console.log("✅ Universal Pedagogical Framework compliance validated!");
    }

    console.log(`🎓 Framework-Enforced Storyboard Complete!`);
    console.log(`   📊 Total scenes: ${storyboard.scenes.length}`);
    console.log(`   🎯 Learning outcomes: ${learningOutcomes.length}`);
    console.log(`   📋 Framework version: ${UNIVERSAL_PEDAGOGICAL_FRAMEWORK.version}`);

    return storyboard;
  }

  private enhanceNarrationWithFramework(originalNarration: string, outcome: string, phase: string): string {
    const frameworkReference = phase === "Teach" ? 
      "This teaching scene provides the foundation you'll need for the upcoming practice, application, and assessment phases." :
      `Based on the teaching content about ${outcome}, `;
    
    return `${frameworkReference} ${originalNarration}`;
  }

  private enhanceOnScreenTextWithFramework(originalText: string, outcome: string, phase: string): string {
    const frameworkPrefix = phase === "Teach" ? 
      `Teaching: ` :
      `Building on teaching: `;
    
    return `${frameworkPrefix}${originalText}`;
  }

  private async applyInteractionDecisions(
    scenes: Scene[],
    decisions: any[],
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
          ...generatedContent,  // Spread the structured interaction object
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
      branchingScenario: "Scenario",
      sortingActivity: "DragDrop",
      matchingActivity: "DragDrop",
      slider: "Reflection",
      "Click-to-Reveal": "Hotspots",
      "ClickToReveal": "Hotspots",
      "DragAndDrop-Matching": "DragDrop",
      "DragAndDrop-Sequencing": "DragDrop"
    };
    
    return mapping[phase2Type] || "None";
  }

  /**
   * Determine Bloom's taxonomy level for a learning outcome
   */
  private determineBloomLevel(outcome: string): string {
    const outcomeLower = outcome.toLowerCase();
    
    if (outcomeLower.includes('remember') || outcomeLower.includes('recall') || outcomeLower.includes('identify') || outcomeLower.includes('list')) {
      return 'Remember';
    } else if (outcomeLower.includes('understand') || outcomeLower.includes('explain') || outcomeLower.includes('describe') || outcomeLower.includes('summarize')) {
      return 'Understand';
    } else if (outcomeLower.includes('apply') || outcomeLower.includes('implement') || outcomeLower.includes('use') || outcomeLower.includes('demonstrate')) {
      return 'Apply';
    } else if (outcomeLower.includes('analyze') || outcomeLower.includes('compare') || outcomeLower.includes('contrast') || outcomeLower.includes('examine')) {
      return 'Analyze';
    } else if (outcomeLower.includes('evaluate') || outcomeLower.includes('assess') || outcomeLower.includes('judge') || outcomeLower.includes('critique')) {
      return 'Evaluate';
    } else if (outcomeLower.includes('create') || outcomeLower.includes('design') || outcomeLower.includes('develop') || outcomeLower.includes('generate')) {
      return 'Create';
    }
    
    // Default to Apply for most outcomes
    return 'Apply';
  }

  /**
   * Phase 2a: Build scene metadata for InteractivitySequencer
   */
  private buildSceneMetadata(
    scene: Scene,
    sceneIndex: number,
    req: LearningRequest
  ): SceneMetadata {
    // Normalize Bloom level to lowercase for InteractivitySequencer
    const bloomLevel = this.normalizeBloomLevelForSequencer(
      scene.learningOutcome ? this.determineBloomLevel(scene.learningOutcome) : 'understand'
    );

    // Determine instructional purpose from pedagogical phase
    const instructionalPurpose = this.determinePurposeFromPhase(scene.pedagogicalPhase);

    // Determine module level from request metadata
    const moduleLevel = this.determineModuleLevelFromRequest(req);

    // Calculate cognitive load for this scene
    const cognitiveLoad = this.calculateSceneCognitiveLoad(scene, sceneIndex);

    const metadata: SceneMetadata = {
      sceneNumber: scene.sceneNumber,
      bloomLevel,
      instructionalPurpose,
      moduleLevel,
      previousInteractivities: [...this.previousInteractivities], // Clone for immutability
      cognitiveLoad
    };

    return metadata;
  }

  /**
   * Normalize Bloom level to lowercase for InteractivitySequencer
   */
  private normalizeBloomLevelForSequencer(level: string): "remember" | "understand" | "apply" | "analyze" | "evaluate" | "create" {
    const normalized = level.trim().toLowerCase();
    const validLevels = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'];
    
    if (validLevels.includes(normalized)) {
      return normalized as any;
    }
    
    return 'understand'; // Safe fallback
  }

  /**
   * Determine instructional purpose from pedagogical phase
   */
  private determinePurposeFromPhase(phase?: string): "foundation" | "practice" | "reinforcement" | "assessment" {
    if (!phase) return 'foundation';

    const purposeMap: Record<string, "foundation" | "practice" | "reinforcement" | "assessment"> = {
      'Welcome': 'foundation',
      'LearningOutcomes': 'foundation',
      'Teach': 'foundation',
      'Practice': 'practice',
      'Apply': 'practice',
      'Assess': 'assessment',
      'Summary': 'reinforcement',
      'NextSteps': 'reinforcement'
    };

    return purposeMap[phase] || 'foundation';
  }

  /**
   * Determine module level from request metadata
   */
  private determineModuleLevelFromRequest(req: LearningRequest): 1 | 2 | 3 | 4 {
    // Check if module level is specified in request
    if (req.moduleType) {
      const typeToLevel: Record<string, 1 | 2 | 3 | 4> = {
        'basic': 1,
        'intermediate': 2,
        'advanced': 3,
        'expert': 4,
        'passive': 1,
        'limited': 2,
        'moderate': 3,
        'immersive': 4
      };

      const level = typeToLevel[req.moduleType.toLowerCase()];
      if (level) return level;
    }

    // Default to level 2 (Limited/Intermediate)
    return 2;
  }

  /**
   * Calculate cognitive load for a scene
   */
  private calculateSceneCognitiveLoad(scene: Scene, sceneIndex: number): "low" | "medium" | "high" {
    let loadScore = 0;

    // Factor 1: Pedagogical phase (base load)
    const phaseLoad: Record<string, number> = {
      'Welcome': 1,
      'LearningOutcomes': 1,
      'Teach': 2,
      'Practice': 3,
      'Apply': 3,
      'Assess': 2,
      'Summary': 1,
      'NextSteps': 1
    };
    loadScore += phaseLoad[scene.pedagogicalPhase || 'Teach'] || 2;

    // Factor 2: Existing interaction type
    const interactionLoad: Record<string, number> = {
      'None': 0,
      'MCQ': 1,
      'Scenario': 3,
      'Hotspots': 2,
      'DragDrop': 2,
      'Reflection': 3
    };
    loadScore += interactionLoad[scene.interactionType || 'None'] || 0;

    // Factor 3: Scene position (early scenes lighter, middle heavier)
    if (sceneIndex < 3) {
      loadScore -= 1; // Lighter at start
    } else if (sceneIndex > 10) {
      loadScore -= 1; // Lighter at end
    }

    // Convert score to load level
    if (loadScore <= 2) return 'low';
    if (loadScore <= 4) return 'medium';
    return 'high';
  }

  /**
   * Phase 2a: Inject interactivity decision into scene
   */
  private injectInteractivityDecision(scene: Scene, metadata: SceneMetadata): Scene {
    console.log(`🎮 Selecting interactivity for Scene ${scene.sceneNumber}: ${scene.pageTitle}`);

    try {
      // Call InteractivitySequencer
      const decision = this.interactivitySequencer.selectInteractivityForScene(metadata);

      console.log(`   ✅ Decision: ${decision.interactivityType} (score: ${decision.score?.toFixed(2)})`);
      console.log(`   📋 Justification: ${decision.justification}`);
      console.log(`   🔐 Checksum: ${decision.checksum}`);

      // Track for novelty scoring
      if (decision.interactivityType !== 'none' && decision.interactivityType !== 'None') {
        this.previousInteractivities.push(decision.interactivityType);
      }

      // Inject decision into scene (metadata only - no template building yet)
      return {
        ...scene,
        interactivityDecision: decision
      };

    } catch (error) {
      console.error(`   ❌ InteractivitySequencer failed for scene ${scene.sceneNumber}:`, error);

      // Fallback decision
      const fallbackDecision: InteractivityDecision = {
        interactivityType: 'none',
        justification: `InteractivitySequencer error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        suggestedTemplate: 'none',
        score: 0
      };

      return {
        ...scene,
        interactivityDecision: fallbackDecision
      };
    }
  }

  /**
   * Phase 3: Apply interactivity content to scene
   * Generates actual interaction content using builder functions
   */
  private applyInteractivityContent(scene: Scene): Scene {
    // Skip if no decision
    if (!scene.interactivityDecision) {
      return scene;
    }

    const decision = scene.interactivityDecision;
    
    // Skip 'none' types
    if (decision.interactivityType === 'none' || decision.interactivityType === 'None') {
      return scene;
    }

    console.log(`🎨 Generating content for Scene ${scene.sceneNumber}: ${decision.interactivityType}`);

    try {
      // Get appropriate builder function
      const builder = getBuilder(decision.interactivityType);

      // Generate interaction content
      const interactionDetails = builder(scene, decision);

      console.log(`   ✅ Content generated: ${interactionDetails.type}`);
      console.log(`   📝 Title: ${interactionDetails.title}`);
      console.log(`   🔢 Steps: ${interactionDetails.interactionSteps.length}`);

      // Inject into scene
      return {
        ...scene,
        interactionDetails
      };

    } catch (error) {
      console.error(`   ❌ Builder failed for scene ${scene.sceneNumber}:`, error);

      // Fallback interaction details
      return {
        ...scene,
        interactionDetails: {
          type: 'none',
          title: scene.pageTitle,
          interactionSteps: ['This scene has no interactive elements'],
          accessibilityNotes: 'No keyboard interaction required.',
          templateData: {
            error: error instanceof Error ? error.message : 'Unknown error',
            fallbackApplied: true
          }
        }
      };
    }
  }
}
