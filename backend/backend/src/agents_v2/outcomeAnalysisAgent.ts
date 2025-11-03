// backend/src/agents_v2/outcomeAnalysisAgent.ts
import { 
  OutcomeMap, 
  OutcomeAnalysis, 
  BloomLevel, 
  SceneTypeRequirement,
  LearningRequest 
} from "./types";
import { openaiChat } from "../services/openaiGateway";
import { safeJSONParse } from "../utils/safeJSONParse";

/**
 * Phase 1: Outcome Analysis Agent
 * Analyzes learning outcomes to drive storyboard generation
 */
export class OutcomeAnalysisAgent {
  
  /**
   * Analyze learning outcomes and create comprehensive outcome map
   */
  async analyzeOutcomes(req: LearningRequest): Promise<OutcomeMap> {
    console.log("🎯 OutcomeAnalysisAgent: Analyzing", req.learningOutcomes?.length || 0, "learning outcomes");
    
    // If no learning outcomes provided, extract from source material
    const outcomes = req.learningOutcomes && req.learningOutcomes.length > 0
      ? req.learningOutcomes
      : await this.extractOutcomesFromSource(req.sourceMaterial, req.topic);
    
    console.log("🎯 OutcomeAnalysisAgent: Working with outcomes:", outcomes);
    
    // Analyze each outcome using AI
    const analyses: OutcomeAnalysis[] = [];
    
    for (const outcome of outcomes) {
      const analysis = await this.analyzeIndividualOutcome(outcome, req);
      analyses.push(analysis);
    }
    
    // Build prerequisite map
    const prerequisites = this.buildPrerequisiteMap(analyses);
    
    // Determine learning progression
    const progression = this.determineLearningProgression(analyses);
    
    // Calculate total estimated scenes
    const totalEstimatedScenes = analyses.reduce(
      (sum, analysis) => sum + analysis.estimatedSceneCount, 
      2 // +2 for welcome scenes
    ) + 2; // +2 for summary scenes
    
    const outcomeMap: OutcomeMap = {
      outcomes: analyses,
      totalEstimatedScenes,
      learningProgression: progression,
      prerequisites
    };
    
    console.log("🎯 OutcomeAnalysisAgent: Analysis complete");
    console.log("   - Total outcomes:", analyses.length);
    console.log("   - Estimated scenes:", totalEstimatedScenes);
    console.log("   - Progression:", progression.join(" → "));
    
    return outcomeMap;
  }
  
  /**
   * Analyze a single learning outcome
   */
  private async analyzeIndividualOutcome(
    outcome: string, 
    req: LearningRequest
  ): Promise<OutcomeAnalysis> {
    const prompt = `
Analyze this learning outcome for instructional design:

Learning Outcome: "${outcome}"

Context:
- Topic: ${req.topic}
- Audience: ${req.audience || "General learners"}
- Duration: ${req.duration} minutes

Provide analysis in JSON format:
{
  "outcome": "the learning outcome",
  "bloomLevel": "Remember|Understand|Apply|Analyze|Evaluate|Create",
  "complexityScore": 1-10,
  "prerequisites": ["prerequisite knowledge needed"],
  "requiredSceneTypes": [
    {"type": "definition|example|demonstration|practice|scenario|case_study|reflection|assessment", "priority": "required|recommended|optional", "count": 1}
  ],
  "assessmentMethod": "how to measure this outcome",
  "estimatedSceneCount": 2-5
}

Focus on:
1. Accurately map to Bloom's Taxonomy level
2. Identify realistic prerequisites
3. Recommend appropriate scene types for this outcome
4. Suggest effective assessment methods
`.trim();

    try {
      const response = await openaiChat({ systemKey: "master_blueprint", user: prompt });
      const analysis = safeJSONParse(response);
      
      // Validate and normalize
      return {
        outcome: analysis.outcome || outcome,
        bloomLevel: this.validateBloomLevel(analysis.bloomLevel),
        complexityScore: Math.min(10, Math.max(1, analysis.complexityScore || 5)),
        prerequisites: Array.isArray(analysis.prerequisites) ? analysis.prerequisites : [],
        requiredSceneTypes: this.validateSceneTypes(analysis.requiredSceneTypes),
        assessmentMethod: analysis.assessmentMethod || "Knowledge check",
        estimatedSceneCount: Math.min(5, Math.max(1, analysis.estimatedSceneCount || 2))
      };
    } catch (error) {
      console.error("🎯 OutcomeAnalysisAgent: Error analyzing outcome, using defaults:", error);
      return this.getDefaultAnalysis(outcome);
    }
  }
  
  /**
   * Extract learning outcomes from source material if none provided
   */
  private async extractOutcomesFromSource(
    sourceMaterial: string, 
    topic: string
  ): Promise<string[]> {
    console.log("🎯 OutcomeAnalysisAgent: Extracting outcomes from source material");
    
    const prompt = `
Extract 3-5 clear, measurable learning outcomes from this training material.

Topic: ${topic}

Source Material:
${sourceMaterial.substring(0, 2000)} ${sourceMaterial.length > 2000 ? '...' : ''}

Return JSON array of learning outcomes:
{
  "outcomes": [
    "Clear, measurable outcome 1",
    "Clear, measurable outcome 2",
    "Clear, measurable outcome 3"
  ]
}

Each outcome should:
- Start with an action verb (identify, apply, analyze, etc.)
- Be specific and measurable
- Be achievable within the course duration
`.trim();

    try {
      const response = await openaiChat({ systemKey: "master_blueprint", user: prompt });
      const parsed = safeJSONParse(response);
      return Array.isArray(parsed.outcomes) ? parsed.outcomes : [
        `Understand key concepts of ${topic}`,
        `Apply ${topic} principles in practice`,
        `Analyze situations related to ${topic}`
      ];
    } catch (error) {
      console.error("🎯 OutcomeAnalysisAgent: Error extracting outcomes:", error);
      return [
        `Understand key concepts of ${topic}`,
        `Apply ${topic} principles in practice`,
        `Analyze situations related to ${topic}`
      ];
    }
  }
  
  /**
   * Build prerequisite map showing dependencies between outcomes
   */
  private buildPrerequisiteMap(analyses: OutcomeAnalysis[]): Record<string, string[]> {
    const map: Record<string, string[]> = {};
    
    analyses.forEach(analysis => {
      // Match prerequisites to other outcomes
      const matchedPrereqs = analysis.prerequisites.filter(prereq =>
        analyses.some(other => 
          other.outcome.toLowerCase().includes(prereq.toLowerCase()) ||
          prereq.toLowerCase().includes(other.outcome.toLowerCase())
        )
      );
      
      if (matchedPrereqs.length > 0) {
        map[analysis.outcome] = matchedPrereqs;
      }
    });
    
    return map;
  }
  
  /**
   * Determine optimal learning progression based on Bloom's levels
   */
  private determineLearningProgression(analyses: OutcomeAnalysis[]): BloomLevel[] {
    const bloomOrder: BloomLevel[] = ["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"];
    
    // Extract unique Bloom levels from outcomes, maintaining order
    const progression: BloomLevel[] = [];
    bloomOrder.forEach(level => {
      if (analyses.some(a => a.bloomLevel === level)) {
        progression.push(level);
      }
    });
    
    return progression;
  }
  
  /**
   * Validate Bloom's taxonomy level
   */
  private validateBloomLevel(level: string): BloomLevel {
    const validLevels: BloomLevel[] = ["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"];
    const normalized = level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
    return validLevels.includes(normalized as BloomLevel) 
      ? (normalized as BloomLevel) 
      : "Understand";
  }
  
  /**
   * Validate and normalize scene type requirements
   */
  private validateSceneTypes(types: any[]): SceneTypeRequirement[] {
    if (!Array.isArray(types)) return this.getDefaultSceneTypes();
    
    const validTypes = ["definition", "example", "demonstration", "practice", "scenario", "case_study", "reflection", "assessment"];
    const validPriorities = ["required", "recommended", "optional"];
    
    return types
      .filter(t => validTypes.includes(t.type))
      .map(t => ({
        type: t.type,
        priority: validPriorities.includes(t.priority) ? t.priority : "recommended",
        count: Math.min(3, Math.max(1, t.count || 1))
      }));
  }
  
  /**
   * Get default analysis for an outcome
   */
  private getDefaultAnalysis(outcome: string): OutcomeAnalysis {
    return {
      outcome,
      bloomLevel: "Understand",
      complexityScore: 5,
      prerequisites: [],
      requiredSceneTypes: this.getDefaultSceneTypes(),
      assessmentMethod: "Knowledge check questions",
      estimatedSceneCount: 2
    };
  }
  
  /**
   * Get default scene type requirements
   */
  private getDefaultSceneTypes(): SceneTypeRequirement[] {
    return [
      { type: "example", priority: "required", count: 1 },
      { type: "practice", priority: "recommended", count: 1 }
    ];
  }
}

