// backend/src/agents_v2/welcomeAgent.ts
import { LearningRequest, Scene } from "./types";
import { openaiChat } from "../services/openaiGateway";
import { resetHeader } from "./resetHeader";

export class WelcomeAgent {
  async generate(req: LearningRequest): Promise<Scene[]> {
    console.log("👋 WelcomeAgent: Starting generation for", req.topic);
    const outcomes = this.pickOutcomes(req);

    const basePrompt = `
COURSE: ${req.topic}
DURATION: ${req.duration} minutes
AUDIENCE: ${req.audience || "General staff"}
LEARNING OUTCOMES:
- ${outcomes.join("\n- ")}

Rules:
- Produce exactly TWO scenes:
  1) Welcome & Navigation
  2) Learning Outcomes
- Use UK English, professional but friendly tone.
- Mention navigation (arrows, play/pause/replay).
- Include headphone reminder for audio.
- OST ≤ 70 words per scene.
- Include 1 AI visual prompt and alt text per scene.
Output: JSON array of Scene objects.
    `.trim();

    const finalPrompt = `${resetHeader}${basePrompt}`;

    try {
      const content = await openaiChat({ systemKey: "addie", user: finalPrompt });
      console.log("👋 WelcomeAgent: Raw AI response:", content);
      
      const parsed = JSON.parse(content);
      console.log("👋 WelcomeAgent: Parsed response:", typeof parsed, Array.isArray(parsed), parsed?.length);
      
      // Handle both direct array and object with scenes property
      let scenes = Array.isArray(parsed) ? parsed : (parsed.scenes || []);
      
      // Ensure we always return an array
      if (!Array.isArray(scenes)) {
        scenes = [scenes].filter(Boolean);
      }
      
      console.log("👋 WelcomeAgent: Extracted scenes:", scenes.length);
      
      return scenes.filter(Boolean); // Remove any null/undefined entries
    } catch (error) {
      console.error("👋 WelcomeAgent: OpenAI error:", error);
      
      // Fallback for testing
      const fallbackScenes: Scene[] = [
        {
          sceneNumber: 1,
          pageTitle: "Welcome & Navigation",
          pageType: "Informative",
          narrationScript: `Welcome to the ${req.topic} module. Navigate using the arrow buttons, use play and pause controls as needed, and revisit sections any time. Please have headphones ready for the audio content.
Audience focus: ${req.audience || "General staff"}.`,
          onScreenText: `Welcome to ${req.topic}. Use arrows to move through the module, play/pause to control audio, and replay sections as needed. Headphones recommended for audio.`,
          visual: {
            aiPrompt: `Professional welcome screen for ${req.topic} eLearning with navigation controls and headphone icon`,
            altText: `Welcome screen showing ${req.topic} title with navigation instructions`,
            aspectRatio: "16:9"
          },
          interactionType: "None",
          timing: { estimatedSeconds: 45 }
        },
        {
          sceneNumber: 2,
          pageTitle: "Learning Outcomes",
          pageType: "Informative", 
          narrationScript: `By the end of this ${req.topic} module, you will be able to describe the essential concepts, explain why they matter for ${req.audience || "your role"}, and identify one action to apply immediately.`,
          onScreenText: `Learning Outcomes: describe key ${req.topic} concepts, explain relevance for ${req.audience || "your role"}, identify an immediate action.`,
          visual: {
            aiPrompt: `Clean list of learning outcomes with checkmark icons for a ${req.topic} course`,
            altText: `List of ${req.topic} learning outcomes with visual indicators`,
            aspectRatio: "16:9"
          },
          interactionType: "None",
          timing: { estimatedSeconds: 60 }
        }
      ];
      
      console.log("👋 WelcomeAgent: Using fallback scenes:", fallbackScenes.length);
      return fallbackScenes;
    }
  }

  private pickOutcomes(req: LearningRequest): string[] {
    if (Array.isArray(req.learningOutcomes) && req.learningOutcomes.length > 0) {
      return req.learningOutcomes;
    }

    // Simple fallback extraction
    const fallback = [
      `Identify key ${req.topic} principles`,
      `Apply ${req.topic} techniques in daily work`,
      `Recognise common pitfalls and how to avoid them`,
      `Create a simple action plan for improvement`,
    ];
    return fallback.slice(0, 4);
  }
}
