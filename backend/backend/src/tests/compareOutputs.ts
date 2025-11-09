// backend/src/tests/compareOutputs.ts
/**
 * Comparison Test: Old vs New Storyboard Generation
 * 
 * This script compares the old direct storyboardGenerator method
 * with the new DirectorAgent orchestration approach.
 * 
 * Test Case: "Dealing with Difficult People" (CAPS Model)
 */

import { DirectorAgent } from "../agents/director/DirectorAgent";
import { QualityAgent } from "../agents/director/QualityAgent";
import { ContentExtractionAgent } from "../agents/specialists/ContentExtractionAgent";
import { LearningRequest } from "../agents_v2/types";
import { StoryboardModuleV2, SceneV2 } from "../../../../packages/shared/src/storyboardTypesV2";
import { normalizeToScenes } from "../utils/normalizeStoryboard";
import { storyboardSystem, storyboardUser } from "../prompts/storyboardPrompt";
import { StoryboardModule } from "../types/storyboardTypes";
import { summarizeContentIfNeeded } from "../utils/summarizer";
import OpenAI from "openai";

// Sample "Dealing with Difficult People" content with CAPS Model
const SAMPLE_CONTENT = `
Dealing with Difficult People: The CAPS Model

Introduction
In professional settings, we encounter various personality types that can make interactions challenging. The CAPS Model provides a framework for understanding and managing difficult people effectively. This model categorizes difficult behaviors into four primary types: Controller, Analyser, Promoter, and Supporter.

The CAPS Model Framework

1. CONTROLLER (C-Type)
Controllers are driven by a need for dominance and control. They exhibit behaviors such as:
- Aggressive communication style
- Interrupting others
- Making decisions without consultation
- Displaying impatience with process
- Using power and authority to get their way

Underlying Fear: Fear of being out of control or losing power
Motivation: Maintain control and demonstrate competence
Communication Style: Direct, forceful, task-oriented

Example: Sarah, a project manager, consistently interrupts team meetings, dismisses alternative viewpoints, and makes unilateral decisions without team input.

2. ANALYSER (A-Type)
Analysers are perfectionists who struggle with decision-making due to fear of making mistakes. They show:
- Over-analysis and paralysis by analysis
- Reluctance to make decisions
- Focus on details at the expense of progress
- Resistance to change
- Critical feedback style

Underlying Fear: Fear of making mistakes or being wrong
Motivation: Ensure accuracy and avoid errors
Communication Style: Methodical, detail-oriented, questioning

Example: David, a quality assurance specialist, repeatedly requests additional data and analysis before approving any project milestone, causing delays.

3. PROMOTER (P-Type)
Promoters are enthusiastic but may lack follow-through. They demonstrate:
- Over-commitment and under-delivery
- Enthusiasm that fades quickly
- Difficulty saying no
- Lack of attention to details
- Need for constant recognition

Underlying Fear: Fear of being overlooked or not valued
Motivation: Gain approval and recognition
Communication Style: Energetic, optimistic, relationship-focused

Example: Lisa, a sales representative, enthusiastically commits to multiple deadlines but frequently misses them due to overcommitment.

4. SUPPORTER (S-Type)
Supporters avoid conflict but may become passive-aggressive. They exhibit:
- Passive resistance to change
- Avoidance of direct confrontation
- Indirect communication
- Reluctance to express opinions
- Tendency to agree publicly but resist privately

Underlying Fear: Fear of conflict or rejection
Motivation: Maintain harmony and avoid confrontation
Communication Style: Indirect, agreeable, relationship-preserving

Example: Michael, a team member, agrees to all suggestions in meetings but later fails to implement changes, using passive resistance.

Strategies for Managing Each Type

Controller Strategies:
- Provide data and options rather than ultimatums
- Acknowledge their expertise and authority
- Set clear boundaries and expectations
- Use direct, concise communication
- Give them opportunities to lead

Analyser Strategies:
- Provide detailed information and data
- Allow time for analysis and consideration
- Break decisions into smaller steps
- Validate their concerns and thoroughness
- Set clear deadlines and expectations

Promoter Strategies:
- Channel enthusiasm into specific, achievable goals
- Provide regular check-ins and accountability
- Celebrate small wins to maintain momentum
- Help them prioritize and focus
- Set realistic expectations

Supporter Strategies:
- Create safe spaces for honest communication
- Ask direct questions to understand concerns
- Provide support and encouragement
- Address issues privately before they escalate
- Recognize their contributions publicly

Conclusion
Understanding the CAPS Model helps professionals identify difficult behaviors, recognize underlying motivations, and apply appropriate strategies. By matching our approach to each personality type, we can improve workplace interactions and achieve better outcomes.
`;

const LEARNING_OUTCOMES = [
  "Identify the four personality types in the CAPS Model (Controller, Analyser, Promoter, Supporter)",
  "Recognize the underlying fears and motivations driving difficult behaviors",
  "Apply appropriate communication strategies for each CAPS personality type",
  "Demonstrate techniques for managing Controller-type behaviors in professional settings",
  "Evaluate and select the best approach for interacting with Analyser, Promoter, and Supporter types"
];

interface ComparisonMetrics {
  loAlignment: {
    coverage: number; // Percentage of LOs addressed
    scenesPerLO: number;
    avgScenesPerLO: number;
  };
  frameworkIntegration: {
    frameworkDetected: boolean;
    frameworkName: string | null;
    frameworkComponentsFound: number;
    frameworkMentions: number;
  };
  interactivity: {
    totalInteractions: number;
    interactionTypes: Record<string, number>;
    scenesWithInteractions: number;
    interactionQuality: "high" | "medium" | "low";
  };
  pedagogicalStructure: {
    teachScenes: number;
    showScenes: number;
    applyScenes: number;
    checkScenes: number;
    reflectScenes: number;
    hasCompleteSequence: boolean;
    avgScenesPerLO: number;
  };
  qualityScore: {
    overall: number;
    grade: string;
    passed: boolean;
    dimensionScores: {
      loAlignment: number;
      pedagogicalStructure: number;
      frameworkIntegration: number;
      interactivityQuality: number;
      productionReadiness: number;
    };
  };
}

/**
 * Generate storyboard using OLD method (direct OpenAI call)
 */
async function generateOldMethod(
  content: string,
  learningOutcomes: string[]
): Promise<StoryboardModuleV2> {
  console.log("\n" + "=".repeat(80));
  console.log("📜 OLD METHOD: Direct Storyboard Generation");
  console.log("=".repeat(80));

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  
  // Summarize content if needed
  const summarizedContent = await summarizeContentIfNeeded(content, openai);
  
  const formData = {
    moduleName: "Dealing with Difficult People",
    content: summarizedContent,
    learningOutcomes: learningOutcomes,
    targetAudience: "Professional learners",
    durationMins: 20,
    moduleType: "Soft Skills",
    level: "Level2" as const,
    tone: "Professional"
  };

  try {
    // Use the old method - direct OpenAI call with storyboard prompt
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
    const MODEL = process.env.OPENAI_GEN_MODEL || "gpt-4o-mini";

    const userPrompt = storyboardUser({
      projectBrief: formData.content,
      formData: {
        moduleName: formData.moduleName,
        moduleType: formData.moduleType,
        targetAudience: formData.targetAudience,
        learningOutcomes: formData.learningOutcomes,
        level: formData.level,
        tone: formData.tone,
        language: "English"
      },
      brand: {
        name: "Default",
        colours: ["#001E41"],
        fonts: ["Outfit"]
      }
    });

    const resp = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0.2,
      messages: [
        { role: "system", content: storyboardSystem },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" } as any
    });

    const text = resp.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(text) as Partial<StoryboardModule>;

    if (!parsed || !Array.isArray(parsed.scenes)) {
      throw new Error("Invalid structure from old method");
    }

    // Normalize to StoryboardModuleV2 format
    const storyboard: StoryboardModuleV2 =
      ((normalizeToScenes(parsed) as unknown) as StoryboardModuleV2);

    return storyboard;
  } catch (error: any) {
    console.error("❌ Old method failed:", error?.message);
    throw error;
  }
}

/**
 * Generate storyboard using NEW method (DirectorAgent orchestration)
 */
async function generateNewMethod(
  content: string,
  learningOutcomes: string[]
): Promise<StoryboardModuleV2> {
  console.log("\n" + "=".repeat(80));
  console.log("✨ NEW METHOD: DirectorAgent Orchestration");
  console.log("=".repeat(80));

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  
  // Summarize content if needed
  const summarizedContent = await summarizeContentIfNeeded(content, openai);

  const learningRequest: LearningRequest = {
    topic: "Dealing with Difficult People",
    duration: 20,
    audience: "Professional learners",
    sourceMaterial: summarizedContent,
    learningOutcomes: learningOutcomes,
    brand: {
      colours: "#001E41",
      fonts: "Outfit"
    },
    moduleType: "Soft Skills"
  };

  const director = new DirectorAgent();
  const storyboard = await director.orchestrateStoryboard(learningRequest);

  return storyboard;
}

/**
 * Analyze storyboard metrics
 */
function analyzeMetrics(
  storyboard: StoryboardModuleV2,
  learningOutcomes: string[]
): ComparisonMetrics {
  const scenes = storyboard.scenes || [];
  
  // LO Alignment Analysis
  const loCoverage = new Set<string>();
  const scenesPerLO: Record<string, number> = {};
  
  learningOutcomes.forEach((lo, index) => {
    scenesPerLO[`LO${index + 1}`] = 0;
    scenes.forEach(scene => {
      if (scene.learningOutcome === lo || 
          scene.learningOutcomeIndex === index ||
          scene.narrationScript?.toLowerCase().includes(lo.toLowerCase().slice(0, 20)) ||
          scene.onScreenText?.toLowerCase().includes(lo.toLowerCase().slice(0, 20))) {
        loCoverage.add(lo);
        scenesPerLO[`LO${index + 1}`]++;
      }
    });
  });

  const loAlignment = {
    coverage: (loCoverage.size / learningOutcomes.length) * 100,
    scenesPerLO: scenesPerLO,
    avgScenesPerLO: scenes.length / learningOutcomes.length
  };

  // Framework Integration Analysis
  const allText = scenes.map(s => 
    `${s.narrationScript || ""} ${s.onScreenText || ""} ${s.visual?.aiPrompt || ""}`
  ).join(" ").toLowerCase();

  const frameworkKeywords = {
    caps: ["controller", "analyser", "promoter", "supporter", "caps model"],
    controller: ["controller", "c-type", "dominance", "control"],
    analyser: ["analyser", "a-type", "perfectionist", "analysis"],
    promoter: ["promoter", "p-type", "enthusiasm", "recognition"],
    supporter: ["supporter", "s-type", "passive", "harmony"]
  };

  let frameworkDetected = false;
  let frameworkName: string | null = null;
  let frameworkComponentsFound = 0;
  let frameworkMentions = 0;

  // Check for CAPS Model
  if (allText.includes("caps model") || 
      (allText.includes("controller") && allText.includes("analyser") && 
       allText.includes("promoter") && allText.includes("supporter"))) {
    frameworkDetected = true;
    frameworkName = "CAPS Model";
    
    frameworkKeywords.controller.forEach(kw => {
      if (allText.includes(kw)) frameworkComponentsFound++;
    });
    frameworkKeywords.analyser.forEach(kw => {
      if (allText.includes(kw)) frameworkComponentsFound++;
    });
    frameworkKeywords.promoter.forEach(kw => {
      if (allText.includes(kw)) frameworkComponentsFound++;
    });
    frameworkKeywords.supporter.forEach(kw => {
      if (allText.includes(kw)) frameworkComponentsFound++;
    });

    frameworkMentions = (allText.match(/caps|controller|analyser|promoter|supporter/gi) || []).length;
  }

  // Interactivity Analysis
  const interactionTypes: Record<string, number> = {};
  let totalInteractions = 0;
  let scenesWithInteractions = 0;

  scenes.forEach(scene => {
    const interaction = scene.interaction;
    if (interaction && interaction.kind && interaction.kind !== "None") {
      totalInteractions++;
      scenesWithInteractions++;
      const type = interaction.kind;
      interactionTypes[type] = (interactionTypes[type] || 0) + 1;
    }
  });

  const interactionQuality = 
    totalInteractions >= 20 ? "high" :
    totalInteractions >= 10 ? "medium" : "low";

  // Pedagogical Structure Analysis
  const teachScenes = scenes.filter(s => s.sceneType === "TEACH" || s.pedagogicalPhase === "Teach").length;
  const showScenes = scenes.filter(s => s.sceneType === "SHOW" || s.pedagogicalPhase === "Practice").length;
  const applyScenes = scenes.filter(s => s.sceneType === "APPLY" || s.pedagogicalPhase === "Apply").length;
  const checkScenes = scenes.filter(s => s.sceneType === "CHECK" || s.pedagogicalPhase === "Assess").length;
  const reflectScenes = scenes.filter(s => s.sceneType === "REFLECT").length;

  // Check if we have complete 5-scene sequences per LO
  const expectedScenesPerLO = learningOutcomes.length * 5;
  const hasCompleteSequence = scenes.length >= expectedScenesPerLO * 0.8; // 80% threshold

  const pedagogicalStructure = {
    teachScenes,
    showScenes,
    applyScenes,
    checkScenes,
    reflectScenes,
    hasCompleteSequence,
    avgScenesPerLO: scenes.length / learningOutcomes.length
  };

  return {
    loAlignment,
    frameworkIntegration: {
      frameworkDetected,
      frameworkName,
      frameworkComponentsFound,
      frameworkMentions
    },
    interactivity: {
      totalInteractions,
      interactionTypes,
      scenesWithInteractions,
      interactionQuality
    },
    pedagogicalStructure,
    qualityScore: {
      overall: 0, // Will be calculated by QualityAgent
      grade: "N/A",
      passed: false,
      dimensionScores: {
        loAlignment: 0,
        pedagogicalStructure: 0,
        frameworkIntegration: 0,
        interactivityQuality: 0,
        productionReadiness: 0
      }
    }
  };
}

/**
 * Get quality score using QualityAgent
 */
async function getQualityScore(
  storyboard: StoryboardModuleV2,
  learningOutcomes: string[],
  frameworkName: string | null
): Promise<ComparisonMetrics["qualityScore"]> {
  const qualityAgent = new QualityAgent();
  
  try {
    const contentAgent = new ContentExtractionAgent();
    const sourceAnalysis = await contentAgent.analyzeSource(
      SAMPLE_CONTENT,
      learningOutcomes,
      "Dealing with Difficult People"
    );

    const validationResult = await qualityAgent.validateStoryboard({
      storyboard,
      learningObjectives: learningOutcomes,
      framework: sourceAnalysis.framework,
      expectedSceneTypes: ["TEACH", "SHOW", "APPLY", "CHECK", "REFLECT"]
    });

    return {
      overall: validationResult.overallScore,
      grade: validationResult.grade,
      passed: validationResult.passed,
      dimensionScores: {
        loAlignment: validationResult.dimensions.loAlignment.score,
        pedagogicalStructure: validationResult.dimensions.pedagogicalStructure.score,
        frameworkIntegration: validationResult.dimensions.frameworkIntegration.score,
        interactivityQuality: validationResult.dimensions.interactivityQuality.score,
        productionReadiness: validationResult.dimensions.productionReadiness.score
      }
    };
  } catch (error: any) {
    console.error("⚠️  Quality validation failed:", error?.message);
    return {
      overall: 0,
      grade: "N/A",
      passed: false,
      dimensionScores: {
        loAlignment: 0,
        pedagogicalStructure: 0,
        frameworkIntegration: 0,
        interactivityQuality: 0,
        productionReadiness: 0
      }
    };
  }
}

/**
 * Format comparison report
 */
function formatComparisonReport(
  oldMetrics: ComparisonMetrics,
  newMetrics: ComparisonMetrics
): string {
  const report = [
    "\n" + "=".repeat(80),
    "📊 COMPARISON REPORT: Old vs New Storyboard Generation",
    "=".repeat(80),
    "",
    "📜 OLD METHOD:",
    "-".repeat(80),
    `❌ Learning Objectives Coverage: ${oldMetrics.loAlignment.coverage.toFixed(1)}%`,
    `   - Scenes per LO: ${Object.values(oldMetrics.loAlignment.scenesPerLO).join(", ")}`,
    `   - Average: ${oldMetrics.loAlignment.avgScenesPerLO.toFixed(1)} scenes per LO`,
    "",
    oldMetrics.frameworkIntegration.frameworkDetected
      ? `✅ Framework Detected: ${oldMetrics.frameworkIntegration.frameworkName}`
      : `❌ No Framework Integration: ${oldMetrics.frameworkIntegration.frameworkName || "None detected"}`,
    `   - Components found: ${oldMetrics.frameworkIntegration.frameworkComponentsFound}`,
    `   - Framework mentions: ${oldMetrics.frameworkIntegration.frameworkMentions}`,
    "",
    `❌ Interactivity: ${oldMetrics.interactivity.totalInteractions} total interactions`,
    `   - Types: ${Object.entries(oldMetrics.interactivity.interactionTypes).map(([k, v]) => `${k}: ${v}`).join(", ") || "None"}`,
    `   - Quality: ${oldMetrics.interactivity.interactionQuality}`,
    "",
    `❌ Pedagogical Structure:`,
    `   - TEACH: ${oldMetrics.pedagogicalStructure.teachScenes}, SHOW: ${oldMetrics.pedagogicalStructure.showScenes}, APPLY: ${oldMetrics.pedagogicalStructure.applyScenes}`,
    `   - CHECK: ${oldMetrics.pedagogicalStructure.checkScenes}, REFLECT: ${oldMetrics.pedagogicalStructure.reflectScenes}`,
    `   - Complete sequence: ${oldMetrics.pedagogicalStructure.hasCompleteSequence ? "✅" : "❌"}`,
    "",
    `❌ Quality Score: ${oldMetrics.qualityScore.overall}% (Grade: ${oldMetrics.qualityScore.grade})`,
    `   - LO Alignment: ${oldMetrics.qualityScore.dimensionScores.loAlignment}%`,
    `   - Pedagogical Structure: ${oldMetrics.qualityScore.dimensionScores.pedagogicalStructure}%`,
    `   - Framework Integration: ${oldMetrics.qualityScore.dimensionScores.frameworkIntegration}%`,
    `   - Interactivity Quality: ${oldMetrics.qualityScore.dimensionScores.interactivityQuality}%`,
    `   - Production Readiness: ${oldMetrics.qualityScore.dimensionScores.productionReadiness}%`,
    "",
    "✨ NEW METHOD:",
    "-".repeat(80),
    `✅ Learning Objectives Coverage: ${newMetrics.loAlignment.coverage.toFixed(1)}%`,
    `   - Scenes per LO: ${Object.values(newMetrics.loAlignment.scenesPerLO).join(", ")}`,
    `   - Average: ${newMetrics.loAlignment.avgScenesPerLO.toFixed(1)} scenes per LO`,
    "",
    newMetrics.frameworkIntegration.frameworkDetected
      ? `✅ Framework Detected: ${newMetrics.frameworkIntegration.frameworkName}`
      : `❌ No Framework Integration: ${newMetrics.frameworkIntegration.frameworkName || "None detected"}`,
    `   - Components found: ${newMetrics.frameworkIntegration.frameworkComponentsFound}`,
    `   - Framework mentions: ${newMetrics.frameworkIntegration.frameworkMentions}`,
    "",
    `✅ Interactivity: ${newMetrics.interactivity.totalInteractions} total interactions`,
    `   - Types: ${Object.entries(newMetrics.interactivity.interactionTypes).map(([k, v]) => `${k}: ${v}`).join(", ") || "None"}`,
    `   - Quality: ${newMetrics.interactivity.interactionQuality}`,
    "",
    `✅ Pedagogical Structure:`,
    `   - TEACH: ${newMetrics.pedagogicalStructure.teachScenes}, SHOW: ${newMetrics.pedagogicalStructure.showScenes}, APPLY: ${newMetrics.pedagogicalStructure.applyScenes}`,
    `   - CHECK: ${newMetrics.pedagogicalStructure.checkScenes}, REFLECT: ${newMetrics.pedagogicalStructure.reflectScenes}`,
    `   - Complete sequence: ${newMetrics.pedagogicalStructure.hasCompleteSequence ? "✅" : "❌"}`,
    "",
    `✅ Quality Score: ${newMetrics.qualityScore.overall}% (Grade: ${newMetrics.qualityScore.grade})`,
    `   - LO Alignment: ${newMetrics.qualityScore.dimensionScores.loAlignment}%`,
    `   - Pedagogical Structure: ${newMetrics.qualityScore.dimensionScores.pedagogicalStructure}%`,
    `   - Framework Integration: ${newMetrics.qualityScore.dimensionScores.frameworkIntegration}%`,
    `   - Interactivity Quality: ${newMetrics.qualityScore.dimensionScores.interactivityQuality}%`,
    `   - Production Readiness: ${newMetrics.qualityScore.dimensionScores.productionReadiness}%`,
    "",
    "=".repeat(80),
    "📈 IMPROVEMENT SUMMARY:",
    "=".repeat(80),
    `LO Coverage: ${oldMetrics.loAlignment.coverage.toFixed(1)}% → ${newMetrics.loAlignment.coverage.toFixed(1)}% (+${(newMetrics.loAlignment.coverage - oldMetrics.loAlignment.coverage).toFixed(1)}%)`,
    `Framework Integration: ${oldMetrics.frameworkIntegration.frameworkDetected ? "✅" : "❌"} → ${newMetrics.frameworkIntegration.frameworkDetected ? "✅" : "❌"}`,
    `Interactions: ${oldMetrics.interactivity.totalInteractions} → ${newMetrics.interactivity.totalInteractions} (+${newMetrics.interactivity.totalInteractions - oldMetrics.interactivity.totalInteractions})`,
    `Quality Score: ${oldMetrics.qualityScore.overall}% → ${newMetrics.qualityScore.overall}% (+${(newMetrics.qualityScore.overall - oldMetrics.qualityScore.overall).toFixed(1)}%)`,
    "=".repeat(80)
  ];

  return report.join("\n");
}

/**
 * Main comparison function
 */
export async function compareOutputs(): Promise<void> {
  console.log("\n" + "=".repeat(80));
  console.log("🧪 STORYBOARD GENERATION COMPARISON TEST");
  console.log("=".repeat(80));
  console.log("Test Case: Dealing with Difficult People (CAPS Model)");
  console.log(`Learning Outcomes: ${LEARNING_OUTCOMES.length}`);
  console.log("=".repeat(80));

  try {
    // Generate with OLD method
    const oldStoryboard = await generateOldMethod(SAMPLE_CONTENT, LEARNING_OUTCOMES);
    const oldMetrics = analyzeMetrics(oldStoryboard, LEARNING_OUTCOMES);
    oldMetrics.qualityScore = await getQualityScore(
      oldStoryboard,
      LEARNING_OUTCOMES,
      oldMetrics.frameworkIntegration.frameworkName
    );

    console.log(`\n✅ Old method completed: ${oldStoryboard.scenes.length} scenes generated`);

    // Generate with NEW method
    const newStoryboard = await generateNewMethod(SAMPLE_CONTENT, LEARNING_OUTCOMES);
    const newMetrics = analyzeMetrics(newStoryboard, LEARNING_OUTCOMES);
    newMetrics.qualityScore = await getQualityScore(
      newStoryboard,
      LEARNING_OUTCOMES,
      newMetrics.frameworkIntegration.frameworkName
    );

    console.log(`\n✅ New method completed: ${newStoryboard.scenes.length} scenes generated`);

    // Generate and print comparison report
    const report = formatComparisonReport(oldMetrics, newMetrics);
    console.log(report);

    // Save results to file
    const fs = require("fs");
    const path = require("path");
    const reportPath = path.join(__dirname, "comparison-report.txt");
    fs.writeFileSync(reportPath, report, "utf8");
    console.log(`\n📄 Full report saved to: ${reportPath}`);

  } catch (error: any) {
    console.error("\n❌ Comparison test failed:", error?.message);
    console.error(error?.stack);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  compareOutputs()
    .then(() => {
      console.log("\n✅ Comparison test completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Comparison test failed:", error);
      process.exit(1);
    });
}

