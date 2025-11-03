// backend/src/agents_v2/directorAgent.ts
import { LearningRequest, Storyboard, Scene } from "./types";
import { WelcomeAgent } from "./welcomeAgent";
import { TeachAgent } from "./teachAgent";
import { ApplyAgent } from "./applyAgent";
import { QAAgent } from "./qaAgent";
import { SourceValidator } from "./sourceValidator";
import { SummaryAgent } from "./summaryAgent";
import { openaiChat } from "../services/openaiGateway";
import { resetHeader } from "./resetHeader";

export class DirectorAgent {
  async buildStoryboard(req: LearningRequest): Promise<Storyboard> {
    console.log("🎬 DirectorAgent: Starting storyboard build for", req.topic);
    console.log("🔄 DirectorAgent: Hard reset header applied – no legacy content allowed");
    
    const welcome = await new WelcomeAgent().generate(req);
    console.log("🎬 DirectorAgent: Welcome scenes received:", welcome?.length);
    
    const teach = await new TeachAgent().generate(req);
    console.log("🎬 DirectorAgent: Teach scenes received:", teach?.length);
    
    const apply = await new ApplyAgent().generate(req);
    console.log("🎬 DirectorAgent: Apply scenes received:", apply?.length);

    const allScenes = [...welcome, ...teach, ...apply];
    
    // Normalize scene structure - handle ALL property name variations from AI
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

    const storyboard: Storyboard = {
      moduleName: req.topic,
      targetMinutes: req.duration,
      tableOfContents: scenes.map((s) => s.pageTitle),
      scenes,
      metadata: {
        completionRule: "Completion when all scenes viewed and interaction completed.",
      },
    };

    // ✅ Run validation and QA
    console.log("🔬 DirectorAgent: Running source validation...");
    const validator = SourceValidator.validate(JSON.stringify(scenes), req.sourceMaterial);
    
    console.log("🔍 DirectorAgent: Running QA review...");
    let qa = await new QAAgent().review(storyboard);
    
    storyboard.qaReport = { 
      ...qa, 
      sourceValidation: validator 
    };

    console.log("✅ DirectorAgent: QA complete. Score:", qa.score, "| Valid:", validator.valid);

    // 🔁 Auto-refine if score < 8
    if (qa.score < 8) {
      console.log("🔁 DirectorAgent: QA score below 8, initiating refinement...");
      console.log("🔁 DirectorAgent: Issues to address:", qa.issues.length);
      
      try {
        const refinementPromptBody = `
Improve the storyboard below according to these QA recommendations:
${qa.recommendations.join("\n")}

Keep structure identical; fix only wording, tone, and completeness.
Ensure all scenes have proper numbering, titles, VO, OST, and visual prompts.

Current storyboard:
${JSON.stringify(storyboard, null, 2)}

Return the complete improved storyboard as JSON.
        `.trim();

        const refinementPrompt = `${resetHeader}${refinementPromptBody}`;
        
        const refined = await openaiChat({ systemKey: "addie", user: refinementPrompt });
        console.log("🔁 DirectorAgent: Refinement complete, parsing...");
        
        const refinedStoryboard = JSON.parse(refined);
        
        // Merge refined content back
        if (refinedStoryboard.scenes && Array.isArray(refinedStoryboard.scenes)) {
          storyboard.scenes = refinedStoryboard.scenes;
          storyboard.tableOfContents = refinedStoryboard.scenes.map((s: Scene) => s.pageTitle);
          console.log("🔁 DirectorAgent: Storyboard refined successfully");
          
          // Re-run QA to verify improvement
          qa = await new QAAgent().review(storyboard);
          storyboard.qaReport = { ...qa, sourceValidation: validator };
          console.log("🔁 DirectorAgent: Post-refinement QA score:", qa.score);
        }
      } catch (error) {
        console.error("🔁 DirectorAgent: Refinement failed:", error);
        console.log("🔁 DirectorAgent: Continuing with original storyboard");
      }
    }

    // 🧩 Add summary scenes
    console.log("📝 DirectorAgent: Generating summary scenes...");
    let summary = await new SummaryAgent().generate(storyboard);
    
    // Ensure summary is always an array
    if (!Array.isArray(summary)) {
      console.log("📝 DirectorAgent: Summary is not an array, wrapping it");
      summary = summary ? [summary] : [];
    }
    
    console.log("📝 DirectorAgent: Summary scenes received:", summary.length);
    
    // Only proceed if we have summary scenes
    if (summary.length > 0) {
      // Normalize summary scenes - handle ALL property name variations from AI
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
      console.log("📝 DirectorAgent: No summary scenes to add");
    }

    console.log("✅ DirectorAgent: Complete! Total scenes:", storyboard.scenes.length);
    console.log("✅ DirectorAgent: Final QA score:", qa.score, "| Source valid:", validator.valid);

    return storyboard;
  }
}
