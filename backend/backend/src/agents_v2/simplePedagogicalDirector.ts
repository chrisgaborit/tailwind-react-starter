// backend/src/agents_v2/simplePedagogicalDirector.ts
// Simplified pedagogical director that follows TEACH → PRACTICE → APPLY → ASSESS structure

import { LearningRequest, Storyboard, Scene } from "./types";
import { WelcomeAgent } from "./welcomeAgent";
import { EnhancedTeachAgentSimple } from "./enhancedTeachAgentSimple";
import { ApplyAgent } from "./applyAgent";
import { QAAgent } from "./qaAgent";

export class SimplePedagogicalDirector {
  
  async buildStoryboard(req: LearningRequest): Promise<Storyboard> {
    console.log("🎓 SimplePedagogicalDirector: Building storyboard with TEACH → PRACTICE → APPLY → ASSESS structure");
    
    const allScenes: Scene[] = [];
    let sceneNumber = 1;
    
    // 1. Welcome Phase (2 scenes)
    console.log("👋 Phase 1: Welcome & Orientation");
    const welcomeAgent = new WelcomeAgent();
    const welcomeScenes = await welcomeAgent.generate(req);
    const welcomeScenesRenumbered = welcomeScenes.map((scene: any, index: number) => ({
      ...scene,
      sceneNumber: sceneNumber + index,
      pageTitle: scene.pageTitle || scene.title || `Welcome ${index + 1}`
    }));
    allScenes.push(...welcomeScenesRenumbered);
    sceneNumber += welcomeScenesRenumbered.length;
    
    // 2. Teaching Phase (based on learning outcomes)
    console.log("📚 Phase 2: Teaching the Learning Objectives");
    const learningOutcomes = req.learningOutcomes || [
      `Understand key concepts of ${req.topic}`,
      `Apply ${req.topic} techniques in practice`,
      `Analyze ${req.topic} scenarios effectively`
    ];
    
    const teachAgent = new EnhancedTeachAgentSimple();
    const teachScenes = await teachAgent.generateTeachingScenes(req, learningOutcomes, learningOutcomes.length);
    const teachScenesRenumbered = teachScenes.map((scene: any, index: number) => ({
      ...scene,
      sceneNumber: sceneNumber + index,
      pageTitle: `Teaching: ${learningOutcomes[index]?.substring(0, 50) || 'Core Concepts'}`
    }));
    allScenes.push(...teachScenesRenumbered);
    sceneNumber += teachScenesRenumbered.length;
    
    // 3. Practice Phase (Interactive exercises)
    console.log("🎮 Phase 3: Interactive Practice");
    for (let i = 0; i < learningOutcomes.length; i++) {
      const outcome = learningOutcomes[i];
      const practiceScene: Scene = {
        sceneNumber: sceneNumber + i,
        pageTitle: `Practice: ${outcome.substring(0, 50)}`,
        pageType: "Interactive",
        narrationScript: `Now let's practice applying what you've learned about ${req.topic}. This interactive exercise will help reinforce your understanding and prepare you for real-world application.`,
        onScreenText: `Practice Exercise: Apply your knowledge of ${req.topic} through interactive activities.`,
        visual: {
          aiPrompt: `Interactive practice environment for ${req.topic}, showing engaging learning activities and clear instructions`,
          altText: `Interactive practice exercise for ${req.topic}`
        },
        interactionType: "None", // Will be set by interactivity orchestrator later
        timing: { estimatedSeconds: 120 }
      };
      allScenes.push(practiceScene);
    }
    sceneNumber += learningOutcomes.length;
    
    // 4. Application Phase (Real-world scenarios)
    console.log("🎯 Phase 4: Real-world Application");
    const applyAgent = new ApplyAgent();
    const applyScenes = await applyAgent.generate(req);
    const applyScenesLimited = (applyScenes || []).slice(0, learningOutcomes.length);
    const applyScenesRenumbered = applyScenesLimited.map((scene: any, index: number) => ({
      ...scene,
      sceneNumber: sceneNumber + index,
      pageTitle: `Apply: ${scene.pageTitle || scene.title || `Scenario ${index + 1}`}`
    }));
    allScenes.push(...applyScenesRenumbered);
    sceneNumber += applyScenesRenumbered.length;
    
    // 5. Assessment Phase (Knowledge checks)
    console.log("✅ Phase 5: Assessment & Knowledge Check");
    for (let i = 0; i < learningOutcomes.length; i++) {
      const outcome = learningOutcomes[i];
      const assessmentScene: Scene = {
        sceneNumber: sceneNumber + i,
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
      allScenes.push(assessmentScene);
    }
    sceneNumber += learningOutcomes.length;
    
    // 6. Summary Phase (2 scenes)
    console.log("📝 Phase 6: Summary & Reflection");
    const summaryScenes = [
      {
        sceneNumber: sceneNumber,
        pageTitle: "Key Takeaways Summary",
        pageType: "Informative",
        narrationScript: `Congratulations! You've completed the ${req.topic} module. Let's recap the key concepts you've learned and how to apply them in your daily work.`,
        onScreenText: `Key Takeaways: Review the essential concepts from this ${req.topic} module.`,
        visual: {
          aiPrompt: `Summary visual for ${req.topic}, showing key concepts and takeaways in an organized, memorable format`,
          altText: `Summary of key concepts for ${req.topic}`
        },
        interactionType: "None",
        timing: { estimatedSeconds: 60 }
      },
      {
        sceneNumber: sceneNumber + 1,
        pageTitle: "Next Steps & Application",
        pageType: "Informative", 
        narrationScript: `Now that you understand ${req.topic}, it's time to put this knowledge into practice. Consider how you can apply these concepts in your workplace and continue developing these skills.`,
        onScreenText: `Next Steps: Plan how to apply ${req.topic} concepts in your daily work.`,
        visual: {
          aiPrompt: `Action planning visual for ${req.topic}, showing next steps and application strategies`,
          altText: `Next steps and application planning for ${req.topic}`
        },
        interactionType: "None",
        timing: { estimatedSeconds: 60 }
      }
    ];
    allScenes.push(...summaryScenes);
    
    // Build final storyboard
    const storyboard: Storyboard = {
      moduleName: req.topic,
      targetMinutes: req.duration,
      tableOfContents: allScenes.map(s => s.pageTitle),
      scenes: allScenes,
      metadata: {
        completionRule: "Completion when all scenes viewed and interactions completed.",
      }
    };
    
    console.log(`✅ Pedagogical storyboard complete: ${allScenes.length} scenes`);
    console.log("   📊 Structure: Welcome → Teach → Practice → Apply → Assess → Summary");
    
    return storyboard;
  }
}



