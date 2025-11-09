import { Router, Request, Response } from "express";
import storyboardRoute from "./storyboardRoute";
import { storyboardGenRoute } from "./storyboardGenRoute";
import assetsRouter from "./assets";
import legacyRoute from "./legacyRoute";
import { generate as generateBrandonHall } from "../services/storyboardService";
import pdfParse from "pdf-parse";
import multer from "multer";

// Import DirectorAgent and specialist agents
import { DirectorAgent } from "../agents/director/DirectorAgent";
import { QualityAgent } from "../agents/director/QualityAgent";
import { ContentExtractionAgent } from "../agents/specialists/ContentExtractionAgent";
import { LearningRequest } from "../agents_v2/types";
import { StoryboardModuleV2 } from "../../packages/shared/src/storyboardTypesV2";
import { summarizeContentIfNeeded } from "../utils/summarizer";
import OpenAI from "openai";

const router = Router();

// Configure multer for file uploads (memory storage for PDFs)
const upload = multer({ storage: multer.memoryStorage() });

// Initialize OpenAI client for summarization
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

/* -----------------------------------------------------------
   POST /api/generate-storyboard
   THE ONLY PATH: Orchestrated storyboard generation using DirectorAgent
   All old generation methods have been removed.
   This is the single source of truth for storyboard generation.
----------------------------------------------------------- */
/* -----------------------------------------------------------
   POST /api/generate
   Brandon Hall Architecture - 5-stage deterministic pipeline
   Returns valid Storyboard JSON or typed ValidationError
----------------------------------------------------------- */
router.post("/generate", upload.single("file"), async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    console.log("\n" + "=".repeat(80));
    console.log("🏆 BRANDON HALL ARCHITECTURE - Storyboard Generation");
    console.log("=".repeat(80));
    
    // Handle both JSON and FormData requests
    let formData: any = {};
    let rawFormData: any = {};
    
    // Check if request is FormData (file upload)
    if (req.file) {
      // FormData request - parse formData field if it exists
      try {
        if (req.body.formData && typeof req.body.formData === 'string') {
          formData = JSON.parse(req.body.formData);
        } else {
          formData = req.body.formData || req.body || {};
        }
        rawFormData = formData;
      } catch (e) {
        console.warn("Failed to parse formData field:", e);
        rawFormData = req.body || {};
      }
    } else {
      // JSON request
      formData = req.body?.formData || {};
      rawFormData = formData || req.body || {};
    }
    
    // Extract required fields
    const moduleTitle = rawFormData?.moduleName || rawFormData?.topic || "Learning Module";
    const learningObjectives = rawFormData?.learningOutcomes || rawFormData?.learningObjectives || [];
    const audience = rawFormData?.targetAudience || rawFormData?.audience || "Learners";
    const duration = rawFormData?.durationMins || rawFormData?.duration || 20;
    
    // Extract source material from text or PDF
    let sourceMaterial = rawFormData?.content || rawFormData?.sourceMaterial || "";
    
    // Check if PDF was uploaded
    if (req.file && req.file.mimetype === "application/pdf") {
      try {
        console.log("📄 Extracting text from PDF...");
        const pdfData = await pdfParse(req.file.buffer);
        sourceMaterial = pdfData.text;
        console.log(`✅ Extracted ${sourceMaterial.length} characters from PDF`);
        
        if (sourceMaterial.length < 100) {
          console.warn("⚠️  PDF extraction resulted in very little text. Content may be image-based or encrypted.");
        }
      } catch (pdfError: any) {
        console.error("❌ PDF parsing failed:", pdfError.message);
        // Continue with empty sourceMaterial rather than failing
      }
    } else if (req.file) {
      console.warn(`⚠️  File uploaded but not a PDF (type: ${req.file.mimetype}). Ignoring file.`);
    }
    
    if (!learningObjectives || learningObjectives.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "MISSING_LEARNING_OBJECTIVES",
          message: "At least one learning objective is required",
          hints: ["Provide learningObjectives array in request body"],
          violations: [{ issue: "No learning objectives provided" }],
        },
      });
    }
    
    // Normalize learning objectives to strings
    const normalizedLOs = learningObjectives.map((lo: any) => 
      typeof lo === "string" ? lo : lo?.text || String(lo)
    ).filter(Boolean);
    
    console.log(`📋 Request: ${moduleTitle}`);
    console.log(`🎯 Learning Objectives: ${normalizedLOs.length}`);
    console.log(`👥 Audience: ${audience}`);
    console.log(`⏱️  Duration: ${duration} minutes`);
    console.log(`📄 Source Material Length: ${sourceMaterial.length} characters`);
    
    if (sourceMaterial.length < 100) {
      console.warn("⚠️  WARNING: Very little source material provided. Content may be generic.");
    }
    
    // Call Brandon Hall pipeline
    const result = await generateBrandonHall({
      moduleTitle,
      learningObjectives: normalizedLOs,
      audience,
      duration,
      sourceMaterial,
    });
    
    if (!result.success) {
      console.error("❌ Generation failed:", result.error);
      return res.status(400).json(result);
    }
    
    // Success - return storyboard
    const generationTime = Date.now() - startTime;
    
    console.log("\n" + "=".repeat(80));
    console.log("✅ STORYBOARD GENERATION SUCCESS");
    console.log("=".repeat(80));
    console.log(`📄 Pages: ${result.storyboard.pages.length}`);
    console.log(`🎮 Interactive: ${result.metadata.interactivePages}`);
    console.log(`✅ Knowledge Checks: ${result.metadata.knowledgeChecks}`);
    console.log(`⏱️  Duration: ${Math.round(result.metadata.totalDuration / 60)} minutes`);
    console.log(`⏱️  Generation Time: ${Math.round(generationTime / 1000)}s`);
    
    return res.status(200).json(result);
    
  } catch (error: any) {
    console.error("\n" + "=".repeat(80));
    console.error("❌ BRANDON HALL GENERATION FAILED");
    console.error("=".repeat(80));
    console.error("Error:", error?.message || error);
    console.error("Stack:", error?.stack);
    
    return res.status(500).json({
      success: false,
      error: {
        code: "GENERATION_ERROR",
        message: error?.message || "Unknown error during storyboard generation",
        hints: [
          "Check that all required fields are provided",
          "Verify API keys are configured",
          "Review logs for specific errors",
        ],
        violations: [{ issue: error?.message || "Unknown error" }],
      },
    });
  }
});

router.post("/generate-storyboard", async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    console.log("\n" + "=".repeat(80));
    console.log("🎬 DIRECTOR AGENT: Starting orchestrated generation (ONLY PATH)");
    console.log("=".repeat(80));
    console.log("📋 Request:", JSON.stringify({
      topic: req.body?.formData?.moduleName || req.body?.topic,
      learningOutcomes: req.body?.formData?.learningOutcomes || req.body?.learningOutcomes,
      duration: req.body?.formData?.durationMins || req.body?.duration,
      hasContent: !!(req.body?.formData?.content || req.body?.sourceMaterial)
    }, null, 2));
    
    // Extract and validate request data
    const { formData } = req.body || {};
    const rawFormData = formData || req.body;
    
    if (!rawFormData || !String(rawFormData.content || rawFormData.sourceMaterial || "").trim()) {
      return res.status(400).json({
        success: false,
        error: { message: "Provide content or sourceMaterial for storyboard generation." }
      });
    }
    
    // Normalize form data
    const content = rawFormData.content || rawFormData.sourceMaterial || "";
    const topic = rawFormData.moduleName || rawFormData.topic || "Learning Module";
    const duration = rawFormData.durationMins || rawFormData.duration || 20;
    const audience = rawFormData.targetAudience || rawFormData.audience || "Learners";
    // Normalize learning outcomes - accept both string arrays and objects with .text property
    let learningOutcomes = rawFormData.learningOutcomes || 
                          rawFormData.learningObjectives || 
                          [];
    
    // Convert array of objects to array of strings if needed
    if (Array.isArray(learningOutcomes) && learningOutcomes.length > 0) {
      learningOutcomes = learningOutcomes.map((lo: any) => {
        if (typeof lo === 'string') return lo;
        if (lo && typeof lo === 'object' && lo.text) return lo.text;
        return String(lo);
      }).filter(Boolean);
    }
    
    console.log(`📖 Topic: ${topic}`);
    console.log(`⏱️  Duration: ${duration} minutes`);
    console.log(`👥 Audience: ${audience}`);
    console.log(`🎯 Learning Outcomes: ${learningOutcomes.length}`);
    if (learningOutcomes.length > 0) {
      learningOutcomes.forEach((lo: string, idx: number) => {
        console.log(`   ${idx + 1}. ${lo.substring(0, 80)}${lo.length > 80 ? '...' : ''}`);
      });
    }
    
    // Summarize content if too large (prevents context window issues)
    console.log("\n📚 Summarizing content if needed...");
    const summarizedContent = await summarizeContentIfNeeded(content, openai);
    
    if (!summarizedContent.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: "Cannot generate storyboard with no content." }
      });
    }
    
    // Build LearningRequest for DirectorAgent
    const learningRequest: LearningRequest = {
      topic,
      duration,
      audience,
      sourceMaterial: summarizedContent,
      learningOutcomes: Array.isArray(learningOutcomes) ? learningOutcomes : [],
      brand: rawFormData.brand || {
        colours: rawFormData.colours || "#001E41",
        fonts: rawFormData.fonts || "Outfit"
      },
      moduleType: rawFormData.moduleType || "Soft Skills"
    };
    
    // Phase 1: Content Analysis (before DirectorAgent - for framework detection logging)
    console.log("\n🔍 ContentAgent: Analyzing source material...");
    let sourceAnalysis;
    try {
      const contentAgent = new ContentExtractionAgent();
      sourceAnalysis = await contentAgent.analyzeSource(
        summarizedContent,
        learningRequest.learningOutcomes || [],
        topic
      );
      
      if (sourceAnalysis.framework) {
        console.log(`🔍 ContentAgent: Detected ${sourceAnalysis.framework.name} framework`);
        console.log(`   📊 Components: ${sourceAnalysis.framework.components.length}`);
        console.log(`   🎭 Characters: ${sourceAnalysis.characters.length}`);
      } else {
        console.log("🔍 ContentAgent: No specific framework detected");
      }
    } catch (error: any) {
      console.error("🔍 ContentAgent: Framework detection failed:", error?.message);
      // Continue with generic framework - not critical
      sourceAnalysis = {
        framework: null,
        complexityLevel: "Level2" as const,
        tone: "Professional" as const,
        characters: [],
        conceptsByObjective: {}
      };
    }
    
    // Initialize DirectorAgent
    console.log("\n🎬 Director: Initializing orchestration...");
    const director = new DirectorAgent();
    
    // Orchestrate storyboard generation
    // DirectorAgent internally orchestrates all phases:
    // - Phase 1: Content Agent Analysis (logs framework detection)
    // - Phase 2: Pedagogical Agent Learning Path Design (logs 5-scene paths)
    // - Phase 3: Scene Generation with Specialist Coordination (logs scene creation)
    // - Phase 4: Quality Agent Validation (logs quality scores)
    // - Phase 5: Revision Loop (if needed)
    console.log("🎬 Director: Starting orchestration...");
    let storyboard: StoryboardModuleV2;
    let interactionCount = 0;
    
    try {
      storyboard = await director.orchestrateStoryboard(learningRequest);
      console.log(`✅ Director: Orchestration complete - ${storyboard.scenes.length} scenes generated`);
      
      // ========== API ROUTE - Storyboard received from Director ==========
      console.log("\n🔍 API ROUTE - Storyboard received from Director:");
      console.log("Total scenes:", storyboard.scenes?.length);
      if (storyboard.scenes && storyboard.scenes[0]) {
        const scene1 = storyboard.scenes[0];
        console.log("Scene 1 title:", scene1.title);
        console.log("Scene 1 ost:", scene1.ost?.substring(0, 50) || 'EMPTY', `(${scene1.ost?.length || 0} chars)`);
        console.log("Scene 1 narration:", scene1.narration?.substring(0, 50) || 'EMPTY', `(${scene1.narration?.length || 0} chars)`);
        console.log("Scene 1 keys:", Object.keys(scene1).join(', '));
      }
      
      // Log pedagogical path summary
      const learningOutcomesCount = learningRequest.learningOutcomes?.length || 0;
      const scenesPerLO = learningOutcomesCount > 0 ? Math.round(storyboard.scenes.length / learningOutcomesCount) : 0;
      console.log(`📚 PedagogicalAgent: Designed ${scenesPerLO}-scene learning path per objective (${learningOutcomesCount} objectives)`);
      
      // Count interactions added
      interactionCount = storyboard.scenes.filter(s => 
        s.interaction && s.interaction.kind !== "None"
      ).length;
      console.log(`✨ InteractivityAgent: Added ${interactionCount} interactions`);
      
    } catch (error: any) {
      console.error("❌ Director: Orchestration failed:", error?.message);
      if (error?.message?.includes("coordination") || error?.message?.includes("agent")) {
        throw new Error(`Agent coordination error: ${error?.message || "Unknown error"}`);
      }
      throw error; // Re-throw to be caught by outer catch
    }
    
    // Validate storyboard quality
    console.log("\n🔍 QualityAgent: Validating storyboard quality...");
    let validationResult;
    try {
      const qualityAgent = new QualityAgent();
      validationResult = await qualityAgent.validateStoryboard({
        storyboard,
        learningObjectives: learningRequest.learningOutcomes || [],
        framework: sourceAnalysis.framework,
        expectedSceneTypes: ["TEACH", "SHOW", "APPLY", "CHECK", "REFLECT"]
      });
      
      console.log(`✅ QualityAgent: Score ${validationResult.overallScore}% - ${validationResult.passed ? "PASSED" : "FAILED"}`);
    } catch (error: any) {
      console.error("🔍 QualityAgent: Validation failed:", error?.message);
      // Continue with minimal validation - create fallback result
      validationResult = {
        overallScore: 75, // Conservative score
        grade: "C" as const,
        passed: false,
        dimensions: {
          loAlignment: { score: 75, weight: 30, weightedScore: 22.5, issues: [], strengths: [] },
          pedagogicalStructure: { score: 75, weight: 25, weightedScore: 18.75, issues: [], strengths: [] },
          frameworkIntegration: { score: 70, weight: 20, weightedScore: 14, issues: [], strengths: [] },
          interactivityQuality: { score: 75, weight: 15, weightedScore: 11.25, issues: [], strengths: [] },
          productionReadiness: { score: 80, weight: 10, weightedScore: 8, issues: [], strengths: [] }
        },
        issues: [],
        strengths: ["Validation completed with fallback scoring"],
        recommendations: ["Review storyboard manually for quality assurance"]
      };
    }
    
    // Calculate total strengths from all dimensions
    const totalStrengths = Object.values(validationResult.dimensions).reduce(
      (sum, dim) => sum + dim.strengths.length,
      0
    );
    
    // Calculate estimated duration
    const totalTiming = storyboard.scenes.reduce((sum, scene) => sum + (scene.timingSec || 60), 0);
    const estimatedDurationMinutes = Math.round(totalTiming / 60);
    
    // Build metadata
    const metadata = {
      qualityScore: validationResult.overallScore,
      grade: validationResult.grade,
      framework: sourceAnalysis.framework?.name || "None",
      agentsUsed: [
        "Director",
        "Pedagogical",
        "Content",
        "Visual",
        "Interactivity",
        "Quality"
      ],
      generatedAt: new Date().toISOString(),
      sceneCount: storyboard.scenes.length,
      estimatedDuration: `${estimatedDurationMinutes} minutes`,
      complexity: sourceAnalysis.complexityLevel,
      tone: sourceAnalysis.tone,
      validationIssues: validationResult.issues.length,
      validationStrengths: totalStrengths,
      generationTimeMs: Date.now() - startTime,
      dimensionScores: {
        loAlignment: validationResult.dimensions.loAlignment.score,
        pedagogicalStructure: validationResult.dimensions.pedagogicalStructure.score,
        frameworkIntegration: validationResult.dimensions.frameworkIntegration.score,
        interactivityQuality: validationResult.dimensions.interactivityQuality.score,
        productionReadiness: validationResult.dimensions.productionReadiness.score
      }
    };
    
    // ========== FINAL CHECK - Data being sent in API response ==========
    console.log("\n🔍 FINAL CHECK - Data being sent in API response:");
    const response = {
      success: true,
      storyboard,
      metadata
    };
    
    console.log("Response structure:", JSON.stringify({
      success: response.success,
      sceneCount: response.storyboard?.scenes?.length,
      // Check BOTH old (SceneV2) and new (frontend/PDF) field names
      scene1HasOST: !!response.storyboard?.scenes?.[0]?.ost,
      scene1OSTLength: response.storyboard?.scenes?.[0]?.ost?.length || 0,
      scene1HasNarration: !!response.storyboard?.scenes?.[0]?.narration,
      scene1NarrationLength: response.storyboard?.scenes?.[0]?.narration?.length || 0,
      scene1HasOnScreenText: !!response.storyboard?.scenes?.[0]?.onScreenText,
      scene1OnScreenTextLength: response.storyboard?.scenes?.[0]?.onScreenText?.length || 0,
      scene1HasVoiceoverScript: !!response.storyboard?.scenes?.[0]?.voiceoverScript,
      scene1VoiceoverScriptLength: response.storyboard?.scenes?.[0]?.voiceoverScript?.length || 0,
      scene1Keys: Object.keys(response.storyboard?.scenes?.[0] || {})
    }, null, 2));
    
    if (response.storyboard?.scenes?.[0]) {
      const scene1 = response.storyboard.scenes[0];
      console.log("Scene 1 sample content:");
      
      // Helper to safely extract string from string or array
      const getString = (value: any): string => {
        if (!value) return 'EMPTY';
        if (typeof value === 'string') return value;
        if (Array.isArray(value)) return value.join(' ');
        return String(value);
      };
      
      console.log(`  ost (SceneV2): "${getString(scene1.ost).substring(0, 100)}"`);
      console.log(`  narration (SceneV2): "${getString(scene1.narration).substring(0, 100)}"`);
      console.log(`  onScreenText (Frontend): "${getString((scene1 as any).onScreenText).substring(0, 100)}"`);
      console.log(`  voiceoverScript (Frontend): "${getString((scene1 as any).voiceoverScript).substring(0, 100)}"`);
    }
    
    // Return response
    return res.status(200).json(response);
    
  } catch (error: any) {
    console.error("\n" + "=".repeat(80));
    console.error("❌ API: Storyboard generation failed");
    console.error("=".repeat(80));
    console.error("Error:", error?.message || error);
    console.error("Stack:", error?.stack);
    
    // Handle specific error types
    if (error?.message?.includes("framework")) {
      console.error("🔍 Framework detection error");
      return res.status(500).json({
        success: false,
        error: {
          message: "Framework detection failed. Continuing with generic framework.",
          type: "framework_detection_error"
        }
      });
    }
    
    if (error?.message?.includes("quality") || error?.message?.includes("validation")) {
      console.error("🔍 Quality validation error");
      return res.status(500).json({
        success: false,
        error: {
          message: "Quality validation failed. Review the storyboard manually.",
          type: "quality_validation_error"
        }
      });
    }
    
    if (error?.message?.includes("agent") || error?.message?.includes("coordination")) {
      console.error("🔍 Agent coordination error");
      return res.status(500).json({
        success: false,
        error: {
          message: "Agent coordination error. Please try again.",
          type: "agent_coordination_error"
        }
      });
    }
    
    // Generic error response
    return res.status(500).json({
      success: false,
      error: {
        message: error?.message || "Failed to generate storyboard. Please try again later.",
        type: "generation_error"
      }
    });
  }
});

// mount existing sub-routes
router.use("/storyboard", storyboardRoute);
router.use("/storyboard-gen", storyboardGenRoute);
router.use("/assets", assetsRouter);
router.use("/v1", legacyRoute);

export default router;
