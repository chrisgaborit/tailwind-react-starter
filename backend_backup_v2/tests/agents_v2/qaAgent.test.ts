import { QAAgent } from "../../src/agents_v2/qaAgent";
import { Storyboard, Scene } from "../../src/agents_v2/types";

const mockScene: Scene = {
  sceneNumber: 1,
  pageTitle: "Welcome",
  pageType: "Informative",
  narrationScript: "Welcome to this course on Time Management.",
  onScreenText: "Welcome to Time Management",
  visual: {
    aiPrompt: "Friendly welcome screen with navigation icons",
    altText: "Welcome screen showing course title"
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
  }
};

describe("QAAgent", () => {
  it("should return a QA report with score, issues, and recommendations", async () => {
    const qa = new QAAgent();
    const report = await qa.review(mockStoryboard);
    
    expect(report).toHaveProperty("score");
    expect(typeof report.score).toBe("number");
    expect(Array.isArray(report.issues)).toBe(true);
    expect(Array.isArray(report.recommendations)).toBe(true);
  });

  it("should return a score between 0 and 100", async () => {
    const qa = new QAAgent();
    const report = await qa.review(mockStoryboard);
    
    expect(report.score).toBeGreaterThanOrEqual(0);
    expect(report.score).toBeLessThanOrEqual(100);
  });

  it("should provide recommendations when issues are found", async () => {
    const qa = new QAAgent();
    const report = await qa.review(mockStoryboard);
    
    // If there are issues, there should be recommendations
    if (report.issues.length > 0) {
      expect(report.recommendations.length).toBeGreaterThan(0);
    }
  });

  it("should handle storyboards with multiple scenes", async () => {
    const multiSceneStoryboard: Storyboard = {
      ...mockStoryboard,
      scenes: [
        mockScene,
        { ...mockScene, sceneNumber: 2, pageTitle: "Learning Outcomes" },
        { ...mockScene, sceneNumber: 3, pageTitle: "Key Concepts" }
      ],
      tableOfContents: ["Welcome", "Learning Outcomes", "Key Concepts"]
    };
    
    const qa = new QAAgent();
    const report = await qa.review(multiSceneStoryboard);
    
    expect(report).toBeDefined();
    expect(report.score).toBeGreaterThanOrEqual(0);
  });
});
