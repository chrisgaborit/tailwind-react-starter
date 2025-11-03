import { ApplyAgent } from "../../src/agents_v2/applyAgent";
import { LearningRequest } from "../../src/agents_v2/types";

const request: LearningRequest = {
  topic: "Time Management",
  duration: 15,
  audience: "All staff",
  sourceMaterial: "Time management involves prioritising, planning and managing distractions."
};

describe("ApplyAgent", () => {
  it("should return 1–2 application scenes", async () => {
    const agent = new ApplyAgent();
    const scenes = await agent.generate(request);
    
    expect(scenes.length).toBeGreaterThanOrEqual(1);
    expect(scenes.length).toBeLessThanOrEqual(2);
  });

  it("should include realistic workplace scenarios", async () => {
    const agent = new ApplyAgent();
    const scenes = await agent.generate(request);
    
    scenes.forEach((scene: any) => {
      const title = scene.pageTitle || scene.title;
      const narration = scene.narrationScript || scene.voiceover || scene.voice_over;
      
      // Title should suggest application/scenario
      expect(title).toBeTruthy();
      
      // Narration should be substantial for scenarios (at least 50 chars)
      expect(narration).toBeTruthy();
      if (narration) {
        expect(narration.length).toBeGreaterThan(50);
      }
    });
  });

  it("should include visual prompts and alt text", async () => {
    const agent = new ApplyAgent();
    const scenes = await agent.generate(request);
    
    scenes.forEach((scene: any) => {
      const visualPrompt = scene.visual?.aiPrompt || scene.visual_ai_prompt || scene.ai_visual_prompt;
      const altText = scene.visual?.altText || scene.alt_text;
      
      expect(visualPrompt).toBeTruthy();
      expect(altText).toBeTruthy();
    });
  });

  it("should have on-screen text for all scenes", async () => {
    const agent = new ApplyAgent();
    const scenes = await agent.generate(request);
    
    scenes.forEach((scene: any) => {
      const ost = scene.onScreenText || scene.on_screen_text;
      expect(ost).toBeTruthy();
      
      // OST should be concise (< 200 chars)
      if (ost) {
        expect(ost.length).toBeLessThan(200);
      }
    });
  });
});
