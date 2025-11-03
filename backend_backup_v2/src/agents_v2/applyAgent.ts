// backend/src/agents_v2/applyAgent.ts
import { LearningRequest, Scene } from "./types";
import { openaiChat } from "../services/openaiGateway";
import { resetHeader } from "./resetHeader";

export class ApplyAgent {
  async generate(req: LearningRequest): Promise<Scene[]> {
    const basePrompt = `
COURSE: ${req.topic}
AUDIENCE: ${req.audience || "General staff"}
SOURCE MATERIAL (summary excerpt):
${req.sourceMaterial.slice(0, 4000)}

Rules:
- Produce 1–2 scenes showing learners applying ${req.topic} concepts in a realistic context.
- Use an authentic, workplace scenario—no fictional names or "coaching" characters.
- Include a decision or reflection moment if relevant.
- OST ≤ 70 words; VO 100–150 words.
- Provide AI visual prompts and alt text for each scene.
Output: JSON array of Scene objects.
    `.trim();

    const finalPrompt = `${resetHeader}${basePrompt}`;

    try {
      const content = await openaiChat({ systemKey: "addie", user: finalPrompt });
      console.log("🎯 ApplyAgent: Raw AI response:", content);
      
      const parsed = JSON.parse(content);
      
      // Handle both direct array and object with scenes property
      let scenes = Array.isArray(parsed) ? parsed : (parsed.scenes || []);
      
      // Ensure we always return an array
      if (!Array.isArray(scenes)) {
        scenes = [scenes].filter(Boolean);
      }
      
      console.log("🎯 ApplyAgent: Extracted scenes:", scenes.length);
      
      return scenes.filter(Boolean); // Remove any null/undefined entries
    } catch (error) {
      console.error("🎯 ApplyAgent: OpenAI error:", error);
      
      // Fallback for testing
      const fallbackScenes: Scene[] = [
        {
          sceneNumber: 5,
          pageTitle: `${req.topic} In Context`,
          pageType: "Interactive",
          narrationScript: `Consider a workplace moment where ${req.topic} directly influences success. Drawing only from the uploaded material, describe how you would approach the situation, highlight any critical steps, and note how colleagues should be involved.`,
          onScreenText: `Scenario: Apply ${req.topic} using the documented approach. Outline the steps and stakeholder considerations.`,
          visual: {
            aiPrompt: `Workplace scene illustrating ${req.topic} being applied collaboratively`,
            altText: `Colleagues applying ${req.topic} in a workplace setting`,
            aspectRatio: "16:9"
          },
          interactionType: "Reflection",
          interactionDetails: {
            prompt: `How will you apply the documented approach to ${req.topic} in your role?`,
            type: "text_input"
          },
          timing: { estimatedSeconds: 90 }
        }
      ];
      
      console.log("🎯 ApplyAgent: Using fallback scenes:", fallbackScenes.length);
      return fallbackScenes;
    }
  }
}
