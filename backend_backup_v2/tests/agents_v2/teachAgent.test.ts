import { TeachAgent } from "../../src/agents_v2/teachAgent";
import { LearningRequest } from "../../src/agents_v2/types";

const request: LearningRequest = {
  topic: "Time Management",
  duration: 10,
  audience: "All staff",
  sourceMaterial: "Time management involves prioritising, planning and managing distractions."
};

describe("TeachAgent", () => {
  it("should return 2–3 teaching scenes", async () => {
    const agent = new TeachAgent();
    const scenes = await agent.generate(request);
    
    expect(scenes.length).toBeGreaterThanOrEqual(2);
    expect(scenes.length).toBeLessThanOrEqual(3);
  });

  it("should include narration script and on-screen text for all scenes", async () => {
    const agent = new TeachAgent();
    const scenes = await agent.generate(request);
    
    scenes.forEach((scene: any) => {
      // Check for narration/voiceover
      const narration = scene.narrationScript || scene.voiceover || scene.on_screen_text;
      expect(narration).toBeTruthy();
      
      // Check for on-screen text
      const ost = scene.onScreenText || scene.on_screen_text;
      expect(ost).toBeTruthy();
      
      // OST should be reasonably short (< 300 chars as a generous limit)
      if (ost) {
        expect(ost.length).toBeLessThan(300);
      }
    });
  });

  it("should include visual prompts for all teaching scenes", async () => {
    const agent = new TeachAgent();
    const scenes = await agent.generate(request);
    
    scenes.forEach((scene: any) => {
      const visualPrompt = scene.visual?.aiPrompt || scene.visual_ai_prompt;
      expect(visualPrompt).toBeTruthy();
      expect(typeof visualPrompt).toBe('string');
    });
  });

  it("should have descriptive page titles", async () => {
    const agent = new TeachAgent();
    const scenes = await agent.generate(request);
    
    scenes.forEach((scene: any) => {
      const title = scene.pageTitle || scene.title || scene.sceneTitle || scene.page_title;
      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(3);
    });
  });
});
