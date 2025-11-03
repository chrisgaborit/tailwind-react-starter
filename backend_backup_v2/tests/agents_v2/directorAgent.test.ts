import { DirectorAgent } from "../../src/agents_v2/directorAgent";
import { LearningRequest } from "../../src/agents_v2/types";

const request: LearningRequest = {
  topic: "Time Management",
  duration: 15,
  audience: "All staff",
  sourceMaterial: "Time management involves prioritising tasks, managing distractions, and planning work effectively. Key techniques include the Eisenhower Matrix, time-blocking, and the Pomodoro Technique."
};

describe("DirectorAgent - Integration Tests", () => {
  it("should orchestrate full storyboard pipeline successfully", async () => {
    const agent = new DirectorAgent();
    const storyboard = await agent.buildStoryboard(request);
    
    // Should have scenes from all agents (Welcome + Teach + Apply + Summary)
    expect(storyboard.scenes.length).toBeGreaterThanOrEqual(6);
    expect(storyboard.scenes.length).toBeLessThanOrEqual(12);
    
    // Should have table of contents
    expect(storyboard.tableOfContents.length).toBeGreaterThan(0);
    expect(storyboard.tableOfContents.length).toBe(storyboard.scenes.length);
    
    // Should have QA report
    expect(storyboard.qaReport).toBeDefined();
    expect(storyboard.qaReport?.score).toBeGreaterThanOrEqual(0);
    expect(storyboard.qaReport?.score).toBeLessThanOrEqual(100);
  }); // Uses global 240s timeout

  it("should include source validation in QA report", async () => {
    const agent = new DirectorAgent();
    const storyboard = await agent.buildStoryboard(request);
    
    expect(storyboard.qaReport?.sourceValidation).toBeDefined();
    expect(storyboard.qaReport?.sourceValidation).toHaveProperty("valid");
    expect(storyboard.qaReport?.sourceValidation).toHaveProperty("issues");
  }); // Uses global 240s timeout

  it("should have properly structured scenes", async () => {
    const agent = new DirectorAgent();
    const storyboard = await agent.buildStoryboard(request);
    
    storyboard.scenes.forEach((scene, index) => {
      // Each scene should have required fields
      expect(scene.sceneNumber).toBeDefined();
      expect(scene.pageTitle).toBeTruthy();
      expect(scene.pageType).toBeTruthy();
      expect(scene.narrationScript).toBeTruthy();
      expect(scene.onScreenText).toBeTruthy();
      expect(scene.visual).toBeDefined();
      expect(scene.visual.aiPrompt).toBeTruthy();
      expect(scene.visual.altText).toBeTruthy();
    });
  }); // Uses global 240s timeout

  it("should have welcome scenes at the beginning", async () => {
    const agent = new DirectorAgent();
    const storyboard = await agent.buildStoryboard(request);
    
    // First two scenes should be welcome-related
    const firstScene = storyboard.scenes[0];
    const secondScene = storyboard.scenes[1];
    
    expect(firstScene.pageTitle.toLowerCase()).toMatch(/welcome|navigation/i);
    expect(secondScene.pageTitle.toLowerCase()).toMatch(/learning|outcome/i);
  }); // Uses global 240s timeout

  it("should have summary scenes at the end", async () => {
    const agent = new DirectorAgent();
    const storyboard = await agent.buildStoryboard(request);
    
    // Last 1-2 scenes should be summary-related
    const lastScene = storyboard.scenes[storyboard.scenes.length - 1];
    const secondLastScene = storyboard.scenes[storyboard.scenes.length - 2];
    
    const lastTitles = `${secondLastScene.pageTitle} ${lastScene.pageTitle}`.toLowerCase();
    expect(lastTitles).toMatch(/summary|next|step|commit|action/i);
  }); // Uses global 240s timeout

  it("should set correct module metadata", async () => {
    const agent = new DirectorAgent();
    const storyboard = await agent.buildStoryboard(request);
    
    expect(storyboard.moduleName).toBe(request.topic);
    expect(storyboard.targetMinutes).toBe(request.duration);
    expect(storyboard.metadata).toBeDefined();
    expect(storyboard.metadata.completionRule).toBeTruthy();
  }); // Uses global 240s timeout
});
