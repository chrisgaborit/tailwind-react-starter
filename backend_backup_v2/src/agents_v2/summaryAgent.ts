// backend/src/agents_v2/summaryAgent.ts
import { Storyboard, Scene } from "./types";
import { openaiChat } from "../services/openaiGateway";
import { resetHeader } from "./resetHeader";

export class SummaryAgent {
  async generate(storyboard: Storyboard): Promise<Scene[]> {
    const basePrompt = `
Summarise the learning for the following module in 1–2 scenes.

MODULE: ${storyboard.moduleName}
QA FEEDBACK: ${JSON.stringify(storyboard.qaReport || {}, null, 2)}

Rules:
- Reinforce key points and actions.
- Use UK English and professional tone.
- Provide a "Next Steps" or "Commit to Action" message.
- Ensure OST ≤ 70 words and VO ≤ 150 words.
- Include AI visual prompt and alt text.
Output: JSON array of Scene objects.
    `.trim();

    const finalPrompt = `${resetHeader}${basePrompt}`;

    try {
      const content = await openaiChat({ systemKey: "addie", user: finalPrompt });
      console.log("📝 SummaryAgent: Raw AI response:", content);
      
      const parsed = JSON.parse(content);
      
      // Handle both direct array and object with scenes property
      let scenes = Array.isArray(parsed) ? parsed : (parsed.scenes || []);
      
      // Ensure we always return an array
      if (!Array.isArray(scenes)) {
        scenes = [scenes].filter(Boolean);
      }
      
      // If no scenes, return default fallback
      if (scenes.length === 0) {
        console.log("📝 SummaryAgent: No scenes returned, using default fallback");
        scenes = this.getDefaultSummaryScenes(storyboard.moduleName);
      }
      
      console.log("📝 SummaryAgent: Extracted scenes:", scenes.length);
      
      // Normalize scenes to ensure all required fields are present
      const normalized = scenes.filter(Boolean).map((s: any, i: number) => ({
        sceneNumber: s.sceneNumber || s.scene_id || s.scene_number || i + 1,
        pageTitle: s.pageTitle || s.title || s.sceneTitle || s.page_title || `Summary Scene ${i + 1}`,
        pageType: s.pageType || s.page_type || "Informative",
        narrationScript: s.narrationScript || s.voiceover || s.voice_over || s.narration_script || "Summary of key learnings.",
        onScreenText: s.onScreenText || s.on_screen_text || s.onScreenText || s.ost || "Review and next steps.",
        visual: {
          aiPrompt: s.visual?.aiPrompt || s.visual_ai_prompt || s.ai_visual_prompt || s.visualPrompt || s.visual_prompt || "Summary and reflection scene",
          altText: s.visual?.altText || s.alt_text || s.altText || "Summary visual",
          aspectRatio: s.visual?.aspectRatio || s.aspect_ratio || "16:9"
        },
        interactionType: s.interactionType || s.interaction_type || "None",
        interactionDetails: s.interactionDetails || s.interaction_details || {},
        timing: s.timing || { estimatedSeconds: 60 }
      }));
      
      return normalized.slice(0, 2); // Return max 2 scenes
    } catch (error) {
      console.error("📝 SummaryAgent: OpenAI error:", error);
      
      // Fallback summary scenes
      const fallbackScenes: Scene[] = [
        {
          sceneNumber: 999,
          pageTitle: "Module Summary",
          pageType: "Informative",
          narrationScript: `You've now completed the ${storyboard.moduleName} module. Let's recap the key points you've learned and how to apply them in your daily work.`,
          onScreenText: `Module complete! Key takeaways: Apply what you've learned, practice regularly, and refer back to this content as needed.`,
          visual: {
            aiPrompt: "Summary screen with key learning points displayed as bullet points or icons",
            altText: "Module summary showing key learning points",
            aspectRatio: "16:9"
          },
          interactionType: "None",
          timing: { estimatedSeconds: 60 }
        },
        {
          sceneNumber: 1000,
          pageTitle: "Next Steps & Commitment",
          pageType: "Interactive",
          narrationScript: `Now it's time to put your learning into action. Think about one specific way you'll apply these concepts this week. Making a commitment increases the likelihood you'll follow through.`,
          onScreenText: `Your commitment: Choose one action to implement this week. Reflect on your progress and revisit this module as needed.`,
          visual: {
            aiPrompt: "Action plan template with space for personal commitment and next steps",
            altText: "Action plan screen prompting learner commitment",
            aspectRatio: "16:9"
          },
          interactionType: "Reflection",
          interactionDetails: {
            prompt: "What's one action you'll take this week?",
            type: "text_input"
          },
          timing: { estimatedSeconds: 90 }
        }
      ];
      
      console.log("📝 SummaryAgent: Using fallback scenes:", fallbackScenes.length);
      return fallbackScenes;
    }
  }

  private getDefaultSummaryScenes(moduleName: string): Scene[] {
    return [
      {
        sceneNumber: 999,
        pageTitle: "Module Summary",
        pageType: "Informative",
        narrationScript: `You've now completed the ${moduleName} module. Let's recap the key points you've learned and how to apply them in your daily work.`,
        onScreenText: `Module complete! Key takeaways: Apply what you've learned, practice regularly, and refer back to this content as needed.`,
        visual: {
          aiPrompt: "Summary screen with key learning points displayed as bullet points or icons",
          altText: "Module summary showing key learning points",
          aspectRatio: "16:9"
        },
        interactionType: "None",
        timing: { estimatedSeconds: 60 }
      },
      {
        sceneNumber: 1000,
        pageTitle: "Next Steps & Commitment",
        pageType: "Interactive",
        narrationScript: `Now it's time to put your learning into action. Think about one specific way you'll apply these concepts this week. Making a commitment increases the likelihood you'll follow through.`,
        onScreenText: `Your commitment: Choose one action to implement this week. Reflect on your progress and revisit this module as needed.`,
        visual: {
          aiPrompt: "Action plan template with space for personal commitment and next steps",
          altText: "Action plan screen prompting learner commitment",
          aspectRatio: "16:9"
        },
        interactionType: "Reflection",
        interactionDetails: {
          prompt: "What's one action you'll take this week?",
          type: "text_input"
        },
        timing: { estimatedSeconds: 90 }
      }
    ];
  }
}
