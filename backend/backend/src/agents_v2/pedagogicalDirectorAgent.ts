// backend/src/agents_v2/pedagogicalDirectorAgent.ts
// Director agent that follows proper pedagogical structure: TEACH → PRACTICE → APPLY → ASSESS

import { LearningRequest, Storyboard, Scene } from "./types";
import { PedagogicalStructureBuilder, INSTRUCTIONAL_PHASES, InstructionalPhase } from "./pedagogicalStructure";
import { WelcomeAgent } from "./welcomeAgent";
import { EnhancedTeachAgentSimple } from "./enhancedTeachAgentSimple";
import { ApplyAgent } from "./applyAgent";
import { QAAgent } from "./qaAgent";
import { SummaryAgent } from "./summaryAgent";
import { OutcomeAnalysisAgent } from "./outcomeAnalysisAgent";
import { InteractivityOrchestrator } from "./interactivityOrchestrator";

export class PedagogicalDirectorAgent {
  private structureBuilder: PedagogicalStructureBuilder;
  private interactivityOrchestrator: InteractivityOrchestrator;
  
  constructor() {
    this.structureBuilder = new PedagogicalStructureBuilder();
    this.interactivityOrchestrator = new InteractivityOrchestrator();
  }
  
  async buildStoryboard(req: LearningRequest): Promise<Storyboard> {
    console.log("🎓 PedagogicalDirectorAgent: Building pedagogically-structured storyboard");
    
    // Step 1: Analyze learning outcomes
    const outcomeAnalysis = await this.analyzeLearningOutcomes(req);
    
    // Step 2: Build pedagogical structure
    const structure = this.structureBuilder.buildStructure(
      outcomeAnalysis.outcomes, 
      req.duration
    );
    
    console.log(`📊 Pedagogical Structure: ${structure.totalScenes} scenes across ${structure.phases.length} phases`);
    
    // Step 3: Generate scenes following the structure
    const scenes = await this.generatePedagogicalScenes(req, structure, outcomeAnalysis);
    
    // Step 4: Build final storyboard
    const storyboard: Storyboard = {
      moduleName: req.topic,
      targetMinutes: req.duration,
      tableOfContents: scenes.map(s => s.pageTitle),
      scenes,
      metadata: {
        completionRule: "Completion when all scenes viewed and interactions completed.",
      }
    };
    
    console.log(`✅ Pedagogical storyboard complete: ${scenes.length} scenes`);
    return storyboard;
  }
  
  private async analyzeLearningOutcomes(req: LearningRequest) {
    console.log("🎯 Analyzing learning outcomes...");
    
    const outcomeAgent = new OutcomeAnalysisAgent();
    const outcomeMap = await outcomeAgent.analyzeOutcomes(req);
    
    return {
      outcomeMap,
      outcomes: req.learningOutcomes || outcomeMap.outcomes.map(o => o.outcome)
    };
  }
  
  private async generatePedagogicalScenes(
    req: LearningRequest,
    structure: any,
    outcomeAnalysis: any
  ): Promise<Scene[]> {
    
    const allScenes: Scene[] = [];
    let sceneNumber = 1;
    
    // Generate scenes for each phase in sequence
    for (const phase of structure.phases) {
      if (phase.sceneCount === 0) continue;
      
      console.log(`📚 Generating ${phase.sceneCount} scenes for phase: ${phase.phase}`);
      
      const phaseScenes = await this.generatePhaseScenes(
        req,
        phase,
        outcomeAnalysis,
        sceneNumber
      );
      
      allScenes.push(...phaseScenes);
      sceneNumber += phaseScenes.length;
    }
    
    return allScenes;
  }
  
  private async generatePhaseScenes(
    req: LearningRequest,
    phase: any,
    outcomeAnalysis: any,
    startSceneNumber: number
  ): Promise<Scene[]> {
    
    switch (phase.phase) {
      case 'Welcome':
        return await this.generateWelcomeScenes(req, startSceneNumber);
        
      case 'Teach':
        return await this.generateTeachingScenes(req, outcomeAnalysis, startSceneNumber);
        
      case 'Practice':
        return await this.generatePracticeScenes(req, outcomeAnalysis, startSceneNumber);
        
      case 'Apply':
        return await this.generateApplicationScenes(req, outcomeAnalysis, startSceneNumber);
        
      case 'Assess':
        return await this.generateAssessmentScenes(req, outcomeAnalysis, startSceneNumber);
        
      case 'Summary':
        return await this.generateSummaryScenes(req, startSceneNumber);
        
      default:
        return [];
    }
  }
  
  private async generateWelcomeScenes(req: LearningRequest, startSceneNumber: number): Promise<Scene[]> {
    console.log("   👋 Generating Welcome scenes...");
    
    const welcomeAgent = new WelcomeAgent();
    const welcomeScenes = await welcomeAgent.generate(req);
    
    // Renumber scenes
    return welcomeScenes.map((scene, index) => ({
      ...scene,
      sceneNumber: startSceneNumber + index
    }));
  }
  
  private async generateTeachingScenes(req: LearningRequest, outcomeAnalysis: any, startSceneNumber: number): Promise<Scene[]> {
    console.log("   📚 Generating Teaching scenes...");
    
    const outcomes = outcomeAnalysis.outcomes || [];
    const teachAgent = new EnhancedTeachAgentSimple();
    const teachingScenes = await teachAgent.generateTeachingScenes(
      req,
      outcomes,
      Math.max(1, outcomes.length)
    );
    
    // Renumber and ensure proper teaching content
    return teachingScenes.map((scene, index) => ({
      ...scene,
      sceneNumber: startSceneNumber + index,
      pageTitle: `Teaching: ${outcomes[index]?.substring(0, 50) || 'Core Concepts'}`
    }));
  }
  
  private async generatePracticeScenes(req: LearningRequest, outcomeAnalysis: any, startSceneNumber: number): Promise<Scene[]> {
    console.log("   🎮 Generating Practice scenes...");
    
    const practiceScenes: Scene[] = [];
    
    // Create practice scenes with interactions
    const outcomes = outcomeAnalysis.outcomes || [];
    for (let i = 0; i < outcomes.length; i++) {
      const outcome = outcomes[i];
      const sceneNumber = startSceneNumber + i;
      
      const practiceScene: Scene = {
        sceneNumber,
        pageTitle: `Practice: ${outcome.substring(0, 50)}`,
        pageType: "Interactive",
        narrationScript: `Now let's practice applying what you've learned about ${req.topic}. This interactive exercise will help reinforce your understanding and prepare you for real-world application.`,
        onScreenText: `Practice Exercise: Apply your knowledge of ${req.topic} through interactive activities.`,
        visual: {
          aiPrompt: `Interactive practice environment for ${req.topic}, showing engaging learning activities and clear instructions`,
          altText: `Interactive practice exercise for ${req.topic}`
        },
        interactionType: "None", // Will be set by interactivity orchestrator
        timing: { estimatedSeconds: 120 }
      };
      
      practiceScenes.push(practiceScene);
    }
    
    return practiceScenes;
  }
  
  private async generateApplicationScenes(req: LearningRequest, outcomeAnalysis: any, startSceneNumber: number): Promise<Scene[]> {
    console.log("   🎯 Generating Application scenes...");
    
    const applyAgent = new ApplyAgent();
    const applyScenes = await applyAgent.generate(req);
    
    // Limit to number of outcomes and renumber
    const outcomes = outcomeAnalysis.outcomes || [];
    const limitedScenes = (applyScenes || []).slice(0, outcomes.length);
    
    return limitedScenes.map((scene, index) => ({
      ...scene,
      sceneNumber: startSceneNumber + index,
      pageTitle: `Apply: ${scene.pageTitle}`
    }));
  }
  
  private async generateAssessmentScenes(req: LearningRequest, outcomeAnalysis: any, startSceneNumber: number): Promise<Scene[]> {
    console.log("   ✅ Generating Assessment scenes...");
    
    const assessmentScenes: Scene[] = [];
    
    // Create assessment scenes
    const outcomes = outcomeAnalysis.outcomes || [];
    for (let i = 0; i < outcomes.length; i++) {
      const outcome = outcomes[i];
      const sceneNumber = startSceneNumber + i;
      
      const assessmentScene: Scene = {
        sceneNumber,
        pageTitle: `Assessment: ${outcome.substring(0, 50)}`,
        pageType: "Interactive",
        narrationScript: `Let's check your understanding of ${req.topic}. This assessment will help verify that you've mastered the key concepts and are ready to apply them in your work.`,
        onScreenText: `Knowledge Check: Test your understanding of ${req.topic} concepts.`,
        visual: {
          aiPrompt: `Assessment interface for ${req.topic}, showing quiz elements and progress indicators`,
          altText: `Knowledge assessment for ${req.topic}`
        },
        interactionType: "MCQ",
        timing: { estimatedSeconds: 90 }
      };
      
      assessmentScenes.push(assessmentScene);
    }
    
    return assessmentScenes;
  }
  
  private async generateSummaryScenes(req: LearningRequest, startSceneNumber: number): Promise<Scene[]> {
    console.log("   📝 Generating Summary scenes...");
    
    const summaryAgent = new SummaryAgent();
    const summaryScenes = await summaryAgent.generate(req);
    
    // Limit to 2 scenes and renumber
    const limitedScenes = (summaryScenes || []).slice(0, 2);
    
    return limitedScenes.map((scene, index) => ({
      ...scene,
      sceneNumber: startSceneNumber + index,
      pageTitle: `Summary: ${scene.pageTitle}`
    }));
  }
}
