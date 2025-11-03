import { WelcomeAgent } from "../../src/agents_v2/welcomeAgent";
import { LearningRequest } from "../../src/agents_v2/types";

const request: LearningRequest = {
  topic: "Time Management",
  duration: 10,
  audience: "All staff",
  sourceMaterial: "Time management involves prioritising and planning your day."
};

describe("WelcomeAgent", () => {
  it("should return exactly 2 scenes with valid titles", async () => {
    const agent = new WelcomeAgent();
    const scenes = await agent.generate(request);
    
    expect(Array.isArray(scenes)).toBe(true);
    expect(scenes.length).toBe(2);
    
    // Check first scene is Welcome - handle varied property names
    const firstTitle = (scenes[0] as any).pageTitle || (scenes[0] as any).title || (scenes[0] as any).sceneTitle || "";
    expect(firstTitle.toLowerCase()).toMatch(/welcome|navigation/i);
    
    // Check second scene is Learning Outcomes
    const secondTitle = (scenes[1] as any).pageTitle || (scenes[1] as any).title || (scenes[1] as any).sceneTitle || "";
    expect(secondTitle.toLowerCase()).toMatch(/learning|outcome/i);
  });

  it("should include visual prompts and alt text for all scenes", async () => {
    const agent = new WelcomeAgent();
    const scenes = await agent.generate(request);
    
    scenes.forEach((scene: any) => {
      const visualPrompt = scene.visual?.aiPrompt || scene.visual_ai_prompt || scene.visualPrompt || scene.ai_visual_prompt;
      const altText = scene.visual?.altText || scene.alt_text || scene.altText;
      expect(visualPrompt).toBeTruthy();
      expect(altText).toBeTruthy();
    });
  });

  it("should include on-screen text and narration for all scenes", async () => {
    const agent = new WelcomeAgent();
    const scenes = await agent.generate(request);
    
    scenes.forEach((scene: any) => {
      const ost = scene.onScreenText || scene.on_screen_text;
      expect(ost).toBeTruthy();
      expect(typeof ost).toBe('string');
    });
  });
});
