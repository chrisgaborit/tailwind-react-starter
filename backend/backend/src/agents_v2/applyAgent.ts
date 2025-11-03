// backend/src/agents_v2/applyAgent.ts
import { LearningRequest, Scene } from "./types";
import { openaiChat } from "../services/openaiGateway";
import { getEnhancedPrompt } from "../prompts/agentPrompts";
import { resetHeader } from "./resetHeader";
import { safeJSONParse } from "../utils/safeJSONParse";

export class ApplyAgent {
  async generate(req: LearningRequest): Promise<Scene[]> {
    const extractedContent = (req as any).extractedContent;
    const extractedCharacters = this.collectCharacters(extractedContent);
    const sourceExcerpt = this.buildSourceExcerpt(req.sourceMaterial);
    const learningOutcomeFocus = this.resolvePrimaryLearningOutcome(req);
    const rawOutcomeContext = (req as any).outcomeContext;
    const outcomeContext = typeof rawOutcomeContext === "string" ? rawOutcomeContext : undefined;

    const enhancedPrompt = getEnhancedPrompt("applyAgent", {
      topic: req.topic,
      audience: req.audience || "General staff",
      learningOutcome: learningOutcomeFocus,
      outcomeContext,
      sourceMaterialExcerpt: sourceExcerpt,
      extractedCharacters,
    });

    const finalPrompt = `${resetHeader}${enhancedPrompt}`;

    try {
      const content = await openaiChat({ systemKey: "master_blueprint", user: finalPrompt });
      console.log("🎯 ApplyAgent: Raw AI response:", content);
      
      const parsed = safeJSONParse(content);
      
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

  private collectCharacters(extractedContent?: any): Array<string | { name: string; role?: string; detail?: string }> {
    if (!extractedContent || !Array.isArray(extractedContent.characters)) {
      return [];
    }

    return extractedContent.characters
      .filter(Boolean)
      .slice(0, 4)
      .map((entry: any) => {
        if (typeof entry !== "string") {
          return entry;
        }

        const trimmed = entry.trim();
        if (!trimmed) {
          return entry;
        }

        const parts = trimmed.split(/[-–—:]/).map((part: string) => part.trim()).filter(Boolean);
        const primary = parts.shift() || trimmed;
        const roleMatch = primary.match(/\(([^)]+)\)/);
        const name = primary.replace(/\(([^)]+)\)/, "").trim();
        const role = roleMatch ? roleMatch[1].trim() : undefined;
        const detail = parts.length > 0 ? parts.join(" – ") : undefined;

        if (!name) {
          return trimmed;
        }

        return { name, role, detail };
      });
  }

  private buildSourceExcerpt(material?: string): string | undefined {
    if (!material) {
      return undefined;
    }

    const trimmed = material.trim();
    if (!trimmed) {
      return undefined;
    }

    const condensed = trimmed.replace(/\s+/g, " ");
    if (condensed.length > 800) {
      return `${condensed.slice(0, 800)}...`;
    }
    return condensed;
  }

  private resolvePrimaryLearningOutcome(req: LearningRequest): string | undefined {
    if (req.learningOutcomes && req.learningOutcomes.length > 0) {
      return req.learningOutcomes[0];
    }

    const outcomeContext = (req as any).outcomeContext;
    if (typeof outcomeContext === "string" && outcomeContext.trim().length > 0) {
      const firstLine = outcomeContext
        .split("\n")
        .map((line: string) => line.trim())
        .find((line: string) => line.length > 0);

      if (firstLine) {
        return firstLine.replace(/^Outcome:\s*/i, "").trim();
      }
    }

    return undefined;
  }
}
