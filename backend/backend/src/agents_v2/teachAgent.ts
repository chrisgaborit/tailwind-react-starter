// backend/src/agents_v2/teachAgent.ts
import { LearningRequest, Scene } from "./types";
import { openaiChat } from "../services/openaiGateway";
import { resetHeader } from "./resetHeader";
import { safeJSONParse } from "../utils/safeJSONParse";

export class TeachAgent {
  async generate(req: LearningRequest): Promise<Scene[]> {
    const basePrompt = `
COURSE: ${req.topic}
AUDIENCE: ${req.audience || "General staff"}
SOURCE MATERIAL (summary excerpt):
${req.sourceMaterial.slice(0, 4000)}

Rules:
- Produce 2–3 scenes that explain key concepts of ${req.topic}.
- Use plain language and professional UK English.
- Include definitions, frameworks or principles drawn only from the source.
- OST ≤ 70 words; do not repeat narration verbatim.
- Each scene must include an AI visual prompt and alt text.
Output: JSON array of Scene objects.
    `.trim();

    const finalPrompt = `${resetHeader}${basePrompt}`;

    try {
      const content = await openaiChat({ systemKey: "master_blueprint", user: finalPrompt });
      console.log("📚 TeachAgent: Raw AI response:", content);
      
      const parsed = safeJSONParse(content);
      
      // Handle both direct array and object with scenes property
      let scenes = Array.isArray(parsed) ? parsed : (parsed.scenes || []);
      
      // Ensure we always return an array
      if (!Array.isArray(scenes)) {
        scenes = [scenes].filter(Boolean);
      }
      
      console.log("📚 TeachAgent: Extracted scenes:", scenes.length);
      
      // Normalize scenes to ensure all required fields are present
      const normalized = scenes.filter(Boolean).map((s: any, i: number) => ({
        sceneNumber: s.sceneNumber || s.scene_id || s.scene_number || i + 1,
        pageTitle: s.pageTitle || s.title || s.sceneTitle || s.page_title || `Teaching Concept ${i + 1}`,
        pageType: s.pageType || s.page_type || "Informative",
        narrationScript: s.narrationScript || s.voiceover || s.voice_over || s.narration_script || s.on_screen_text || "Explanation of key concept.",
        onScreenText: s.onScreenText || s.on_screen_text || s.onScreenText || s.ost || "Key point explanation.",
        visual: {
          aiPrompt: s.visual?.aiPrompt || s.visual_ai_prompt || s.ai_visual_prompt || s.visualPrompt || s.visual_prompt || "Illustration of concept",
          altText: s.visual?.altText || s.alt_text || s.altText || "Visual representation of teaching point",
          aspectRatio: s.visual?.aspectRatio || s.aspect_ratio || "16:9"
        },
        interactionType: s.interactionType || s.interaction_type || "None",
        interactionDetails: s.interactionDetails || s.interaction_details || {},
        timing: s.timing || { estimatedSeconds: 60 }
      }));
      
      return normalized.slice(0, 3); // Return max 3 scenes
    } catch (error) {
      console.error("📚 TeachAgent: OpenAI error:", error);
      
      // Fallback for testing
      const fallbackScenes: Scene[] = [
        {
          sceneNumber: 3,
          pageTitle: `${req.topic} Key Principles`,
          pageType: "Informative",
          narrationScript: `${req.topic} requires a clear understanding of its core principles. Focus on the essential ideas highlighted in the source material, describe them in straightforward language, and emphasise why they matter for ${req.audience || "your learners"}.`,
          onScreenText: `Core principles: outline essential ${req.topic} ideas, emphasise relevance for ${req.audience || "learners"}, connect to practical application.`,
          visual: {
            aiPrompt: `Illustrated framework summarising the core principles of ${req.topic}`,
            altText: `Framework highlighting the main principles of ${req.topic}`,
            aspectRatio: "16:9"
          },
          interactionType: "None",
          timing: { estimatedSeconds: 60 }
        },
        {
          sceneNumber: 4,
          pageTitle: `${req.topic} In Practice`,
          pageType: "Informative",
          narrationScript: `Translate the guidance from the source into clear steps. Break down complex ideas, explain how to apply them day-to-day, and highlight any tools or frameworks the uploaded material references for ${req.topic}.`,
          onScreenText: `Translate source guidance into clear steps. Highlight daily application, reference documented tools or frameworks for ${req.topic}.`,
          visual: {
            aiPrompt: `Visual showing step-by-step workflow applying ${req.topic} guidance`,
            altText: `Workflow diagram showing how to apply ${req.topic} guidance`,
            aspectRatio: "16:9"
          },
          interactionType: "None",
          timing: { estimatedSeconds: 60 }
        }
      ];
      
      console.log("📚 TeachAgent: Using fallback scenes:", fallbackScenes.length);
      return fallbackScenes;
    }
  }
}
