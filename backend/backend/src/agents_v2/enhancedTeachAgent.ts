// backend/src/agents_v2/enhancedTeachAgent.ts
// Enhanced teaching agent that generates pedagogically sound, outcome-aligned teaching scenes

import { openaiChat } from "../services/openaiGateway";
import { LearningRequest, Scene } from "./types";
import { TeachingScene, TeachingMethod, getTeachingTemplate, teachingScenePrompt } from "./teachingTemplates";
import { safeJSONParse } from "../utils/safeJSONParse";

export class EnhancedTeachAgent {
  
  async generateTeachingScenes(
    req: LearningRequest, 
    outcomes: string[], 
    sceneCount: number
  ): Promise<Scene[]> {
    console.log("📚 EnhancedTeachAgent: Generating outcome-aligned teaching scenes");
    
    if (!outcomes || outcomes.length === 0) {
      console.log("   ⚠️ No learning outcomes provided, falling back to basic teaching");
      return this.generateBasicTeachingScenes(req, sceneCount);
    }
    
    const teachingScenes: Scene[] = [];
    const scenesPerOutcome = Math.max(1, Math.floor(sceneCount / outcomes.length));
    const remainder = sceneCount % outcomes.length;
    
    for (let i = 0; i < outcomes.length; i++) {
      const outcome = outcomes[i];
      const scenesForThisOutcome = scenesPerOutcome + (i < remainder ? 1 : 0);
      
      console.log(`   🎯 Generating ${scenesForThisOutcome} scenes for outcome: ${outcome.substring(0, 50)}...`);
      
      for (let j = 0; j < scenesForThisOutcome; j++) {
        try {
          const teachingScene = await this.generateSingleTeachingScene(
            req, 
            outcome, 
            i === 0 && j === 0 // First scene of first outcome
          );
          
          const scene: Scene = this.convertTeachingSceneToScene(teachingScene, teachingScenes.length + 1);
          teachingScenes.push(scene);
          
        } catch (error) {
          console.error(`   ❌ Failed to generate teaching scene ${j + 1} for outcome ${i + 1}:`, error);
          // Fallback to basic scene
          const fallbackScene = this.createFallbackScene(outcome, teachingScenes.length + 1);
          teachingScenes.push(fallbackScene);
        }
      }
    }
    
    console.log(`   ✅ Generated ${teachingScenes.length} enhanced teaching scenes`);
    return teachingScenes;
  }
  
  private async generateSingleTeachingScene(
    req: LearningRequest,
    learningOutcome: string,
    isFirstScene: boolean = false
  ): Promise<TeachingScene> {
    
    // Determine teaching method based on outcome content
    const teachingMethod = this.determineTeachingMethod(learningOutcome);
    const bloomLevel = this.determineBloomLevel(learningOutcome);
    const scenePlacement = isFirstScene ? "Early" : "Mid";
    
    // Create the prompt with the teaching template
    const prompt = teachingScenePrompt
      .replace("{topic}", req.topic)
      .replace("{learningOutcome}", learningOutcome)
      .replace("{targetAudience}", req.audience || "corporate employees")
      .replace("{teachingMethod}", teachingMethod)
      .replace("{bloomLevel}", bloomLevel)
      .replace("{scenePlacement}", scenePlacement);
    
    try {
      const response = await openaiChat({ 
        systemKey: "interactivity_designer_json", // Use JSON mode
        user: prompt 
      });
      
      const teachingScene: TeachingScene = safeJSONParse(response);
      
      // Validate the structure
      this.validateTeachingScene(teachingScene);
      
      console.log(`   ✅ Generated ${teachingMethod} scene for: ${learningOutcome.substring(0, 30)}...`);
      return teachingScene;
      
    } catch (error) {
      console.error(`   ❌ Failed to generate teaching scene:`, error);
      // Return fallback template
      const fallbackTemplate = getTeachingTemplate(teachingMethod);
      fallbackTemplate.learningOutcome = learningOutcome;
      return fallbackTemplate;
    }
  }
  
  private determineTeachingMethod(outcome: string): TeachingMethod {
    const outcomeLower = outcome.toLowerCase();
    
    if (outcomeLower.includes("identify") || outcomeLower.includes("recognize") || outcomeLower.includes("distinguish")) {
      return "Concept Explanation";
    } else if (outcomeLower.includes("apply") || outcomeLower.includes("use") || outcomeLower.includes("demonstrate")) {
      return "Skill Demonstration";
    } else if (outcomeLower.includes("analyze") || outcomeLower.includes("evaluate") || outcomeLower.includes("assess")) {
      return "Principle Illustration";
    } else if (outcomeLower.includes("create") || outcomeLower.includes("develop") || outcomeLower.includes("design")) {
      return "Process Walkthrough";
    } else if (outcomeLower.includes("understand") || outcomeLower.includes("explain") || outcomeLower.includes("describe")) {
      return "Knowledge Building";
    } else {
      return "Concept Explanation"; // Default
    }
  }
  
  private determineBloomLevel(outcome: string): string {
    const outcomeLower = outcome.toLowerCase();
    
    if (outcomeLower.includes("identify") || outcomeLower.includes("recognize") || outcomeLower.includes("list") || outcomeLower.includes("name")) {
      return "Remember";
    } else if (outcomeLower.includes("understand") || outcomeLower.includes("explain") || outcomeLower.includes("describe") || outcomeLower.includes("summarize")) {
      return "Understand";
    } else if (outcomeLower.includes("apply") || outcomeLower.includes("use") || outcomeLower.includes("demonstrate") || outcomeLower.includes("implement")) {
      return "Apply";
    } else if (outcomeLower.includes("analyze") || outcomeLower.includes("compare") || outcomeLower.includes("contrast") || outcomeLower.includes("examine")) {
      return "Analyze";
    } else if (outcomeLower.includes("evaluate") || outcomeLower.includes("assess") || outcomeLower.includes("judge") || outcomeLower.includes("critique")) {
      return "Evaluate";
    } else if (outcomeLower.includes("create") || outcomeLower.includes("develop") || outcomeLower.includes("design") || outcomeLower.includes("construct")) {
      return "Create";
    } else {
      return "Understand"; // Default
    }
  }
  
  private validateTeachingScene(scene: TeachingScene): void {
    const requiredFields = [
      'learningOutcome', 'pageTitle', 'onScreenText', 'voiceOverScript', 
      'visualAiPrompt', 'altText', 'teachingMethod', 'bloomLevels'
    ];
    
    for (const field of requiredFields) {
      if (!scene[field as keyof TeachingScene]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    // Validate word counts
    if (scene.onScreenText.split(' ').length > 80) {
      console.warn(`   ⚠️ On-screen text too long: ${scene.onScreenText.split(' ').length} words`);
    }
    
    if (scene.voiceOverScript.split(' ').length < 120 || scene.voiceOverScript.split(' ').length > 200) {
      console.warn(`   ⚠️ Voice-over script length: ${scene.voiceOverScript.split(' ').length} words (target: 120-200)`);
    }
  }
  
  private convertTeachingSceneToScene(teachingScene: TeachingScene, sceneNumber: number): Scene {
    return {
      sceneNumber,
      pageTitle: teachingScene.pageTitle,
      pageType: "Informative",
      narrationScript: teachingScene.voiceOverScript,
      onScreenText: teachingScene.onScreenText,
      visual: {
        aiPrompt: teachingScene.visualAiPrompt,
        altText: teachingScene.altText,
        aspectRatio: "16:9"
      },
      interactionType: "None",
      timing: { estimatedSeconds: Math.max(60, Math.min(90, teachingScene.voiceOverScript.split(' ').length / 2)) },
      
      // Store the enhanced teaching structure
      teachingScene: {
        learningOutcome: teachingScene.learningOutcome,
        loAlignmentEvidence: teachingScene.loAlignmentEvidence,
        bloomLevels: teachingScene.bloomLevels,
        teachingMethod: teachingScene.teachingMethod,
        contentStructurePattern: teachingScene.contentStructurePattern,
        scenePurpose: teachingScene.scenePurpose,
        cognitiveLoad: teachingScene.cognitiveLoad,
        scenePlacement: teachingScene.scenePlacement,
        sceneContext: teachingScene.sceneContext,
        prerequisiteKnowledge: teachingScene.prerequisiteKnowledge,
        scaffoldingStrategy: teachingScene.scaffoldingStrategy,
        whyThisWorks: teachingScene.whyThisWorks,
        assessmentLink: teachingScene.assessmentLink
      }
    };
  }
  
  private createFallbackScene(learningOutcome: string, sceneNumber: number): Scene {
    return {
      sceneNumber,
      pageTitle: "Core Learning Concepts",
      pageType: "Informative",
      narrationScript: `Understanding the key concepts related to ${learningOutcome} is essential for effective application. This foundational knowledge provides the framework for practical implementation in real-world situations.`,
      onScreenText: "Key concepts provide the foundation for effective practice. Understanding these fundamentals helps you make better decisions.",
      visual: {
        aiPrompt: "Professional illustration showing core concepts and their relationships in a clean, organized layout",
        altText: "Visual representation of core learning concepts"
      },
      interactionType: "None",
      timing: { estimatedSeconds: 60 }
    };
  }
  
  private async generateBasicTeachingScenes(req: LearningRequest, sceneCount: number): Promise<Scene[]> {
    console.log("   📚 Generating basic teaching scenes (no outcomes provided)");
    
    const scenes: Scene[] = [];
    for (let i = 0; i < sceneCount; i++) {
      scenes.push({
        sceneNumber: i + 1,
        pageTitle: `Teaching Concept ${i + 1}`,
        pageType: "Informative",
        narrationScript: `This section covers important concepts related to ${req.topic}. Understanding these fundamentals will help you apply the knowledge effectively in your work.`,
        onScreenText: `Key concepts for ${req.topic}. These fundamentals provide the foundation for practical application.`,
        visual: {
          aiPrompt: `Professional illustration related to ${req.topic}, showing key concepts and their practical applications`,
          altText: `Visual representation of key concepts for ${req.topic}`
        },
        interactionType: "None",
        timing: { estimatedSeconds: 60 }
      });
    }
    
    return scenes;
  }
}
