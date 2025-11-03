import { SummaryAgent } from "../../src/agents_v2/summaryAgent";
import { Storyboard, Scene } from "../../src/agents_v2/types";

const mockScene: Scene = {
  sceneNumber: 1,
  pageTitle: "Welcome",
  pageType: "Informative",
  narrationScript: "Welcome to Time Management",
  onScreenText: "Welcome",
  visual: {
    aiPrompt: "Welcome screen",
    altText: "Welcome"
  },
  interactionType: "None",
  timing: { estimatedSeconds: 45 }
};

const mockStoryboard: Storyboard = {
  moduleName: "Time Management",
  targetMinutes: 10,
  scenes: [mockScene],
  tableOfContents: ["Welcome"],
  metadata: {
    completionRule: "Complete all scenes"
  },
  qaReport: {
    score: 8,
    issues: [],
    recommendations: []
  }
};

describe("SummaryAgent", () => {
  it("should return 1-2 summary scenes", async () => {
    const agent = new SummaryAgent();
    const scenes = await agent.generate(mockStoryboard);
    
    expect(Array.isArray(scenes)).toBe(true);
    expect(scenes.length).toBeGreaterThanOrEqual(1);
    expect(scenes.length).toBeLessThanOrEqual(2);
  });

  it("should include summary and next steps content", async () => {
    const agent = new SummaryAgent();
    const scenes = await agent.generate(mockStoryboard);
    
    const titles = scenes.map((s: any) => (s.pageTitle || s.title || s.sceneTitle || s.page_title || "").toLowerCase()).join(" ");
    
    // Should mention summary, next steps, or commitment
    expect(titles).toMatch(/summary|next|step|commit|action/i);
  });

  it("should include narration and on-screen text", async () => {
    const agent = new SummaryAgent();
    const scenes = await agent.generate(mockStoryboard);
    
    scenes.forEach((scene: any) => {
      const narration = scene.narrationScript || scene.voiceover || scene.voice_over;
      const ost = scene.onScreenText || scene.on_screen_text;
      
      expect(narration).toBeTruthy();
      expect(ost).toBeTruthy();
      
      // OST should be concise (≤ 70 words is ~350 chars)
      if (ost) {
        expect(ost.length).toBeLessThan(400);
      }
    });
  });

  it("should include visual prompts and alt text", async () => {
    const agent = new SummaryAgent();
    const scenes = await agent.generate(mockStoryboard);
    
    scenes.forEach((scene: any) => {
      const visualPrompt = scene.visual?.aiPrompt || scene.visual_ai_prompt || scene.visualPrompt;
      const altText = scene.visual?.altText || scene.alt_text || scene.altText;
      
      expect(visualPrompt).toBeTruthy();
      expect(altText).toBeTruthy();
    });
  });
});
