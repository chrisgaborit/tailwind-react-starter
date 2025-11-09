// backend/src/agents/specialists/ContentExtractionAgent.ts

/**
 * ContentExtractionAgent - Specialist Agent
 * 
 * Detects behavioral/conceptual frameworks and extracts teaching material
 * with deep analysis of source content for storyboard generation.
 * 
 * Key Capabilities:
 * - Framework detection (CAPS, LICOP, DISC, etc.)
 * - Character extraction from source material
 * - Concept mapping to learning objectives
 * - Scenario and example identification
 * - Complexity and tone assessment
 * - Scene-specific content extraction
 */

import { openaiChat } from "../../services/openaiGateway";
import { safeJSONParse } from "../../utils/safeJSONParse";

/**
 * Detected framework structure
 */
export interface DetectedFramework {
  name: string;
  type: "behavioral" | "conceptual" | "compliance" | "process" | "unknown";
  components: FrameworkComponent[];
  characters?: FrameworkCharacter[];
  teachingApproach: string;
  confidence: number; // 0-100
  evidence: string[]; // Text snippets that indicate this framework
}

export interface FrameworkComponent {
  name: string;
  description: string;
  characteristics?: string[];
  examples?: string[];
}

export interface FrameworkCharacter {
  name: string;
  type: string; // e.g., "Controller", "Analyser", "Promoter", "Supporter"
  traits: string[];
  behaviors: string[];
  examples?: string[];
}

/**
 * Source analysis result
 */
export interface SourceAnalysis {
  framework: DetectedFramework | null;
  conceptsByObjective: Record<string, string[]>; // LO1: [concept1, concept2, ...]
  scenarios: Scenario[];
  characters: ExtractedCharacter[];
  complexityLevel: "Level1" | "Level2" | "Level3" | "Level4";
  tone: "Professional" | "Conversational" | "Formal" | "Supportive" | "Authoritative";
  teachingApproach: string;
  keyConcepts: string[];
  realWorldExamples: string[];
}

export interface Scenario {
  title: string;
  description: string;
  characters: string[];
  learningObjective?: string;
  complexity: "simple" | "moderate" | "complex";
  outcome: string;
}

export interface ExtractedCharacter {
  name: string;
  role: string;
  context: string;
  relevance: string;
  archetype?: string;
}

/**
 * Scene-specific content extraction
 */
export interface SceneContent {
  relevantConcepts: string[];
  applicableFrameworkComponents: FrameworkComponent[];
  characters: ExtractedCharacter[];
  examples: string[];
  scenarios: Scenario[];
  teachingPoints: string[];
  visualCues: string[];
  interactionHints: string[];
}

export class ContentExtractionAgent {
  
  /**
   * Analyze source material to detect frameworks and extract teaching material
   */
  async analyzeSource(
    sourceMaterial: string,
    learningObjectives: string[],
    topic: string
  ): Promise<SourceAnalysis> {
    console.log("📚 ContentExtractionAgent: Analyzing source material...");
    console.log(`   📖 Topic: ${topic}`);
    console.log(`   🎯 Learning Objectives: ${learningObjectives.length}`);
    console.log(`   📄 Source length: ${sourceMaterial.length} characters`);
    
    if (!sourceMaterial || sourceMaterial.trim().length < 50) {
      console.log("   ⚠️  Insufficient source material - using minimal analysis");
      return this.createMinimalAnalysis(topic, learningObjectives);
    }
    
    // Step 1: Framework Detection
    console.log("   🔍 Step 1: Detecting frameworks...");
    const framework = await this.detectFramework(sourceMaterial, topic);
    
    if (framework) {
      console.log(`   ✅ Framework detected: ${framework.name} (confidence: ${framework.confidence}%)`);
      console.log(`      Type: ${framework.type}`);
      console.log(`      Components: ${framework.components.length}`);
    } else {
      console.log("   ⚠️  No framework detected");
    }
    
    // Step 2: Comprehensive Analysis
    console.log("   🔍 Step 2: Comprehensive analysis...");
    const analysisPrompt = `
COMPREHENSIVE SOURCE ANALYSIS TASK

Analyze the following training material and extract all teaching elements.

SOURCE MATERIAL:
${sourceMaterial}

TOPIC: ${topic}

LEARNING OBJECTIVES:
${learningObjectives.map((lo, i) => `${i + 1}. ${lo}`).join('\n')}

${framework ? `DETECTED FRAMEWORK: ${framework.name}\n${this.formatFrameworkForPrompt(framework)}` : ''}

EXTRACT AND RETURN AS JSON:

{
  "framework": {
    "name": "${framework?.name || 'Generic Framework'}",
    "type": "${framework?.type || 'unknown'}",
    "components": ${framework ? JSON.stringify(framework.components) : '[]'},
    "teachingApproach": "Describe how to teach this framework/content"
  },
  "conceptsByObjective": {
    ${learningObjectives.map((lo, i) => `"LO${i + 1}": ["concept1", "concept2", ...]`).join(',\n    ')}
  },
  "scenarios": [
    {
      "title": "Scenario title",
      "description": "Detailed scenario description",
      "characters": ["Character1", "Character2"],
      "learningObjective": "LO1",
      "complexity": "simple|moderate|complex",
      "outcome": "What happens/learned"
    }
  ],
  "characters": [
    {
      "name": "Character name",
      "role": "Their role/job",
      "context": "Where they appear",
      "relevance": "Why they matter",
      "archetype": "Optional archetype if applicable"
    }
  ],
  "complexityLevel": "Level1|Level2|Level3|Level4",
  "tone": "Professional|Conversational|Formal|Supportive|Authoritative",
  "teachingApproach": "Overall approach to teaching this content",
  "keyConcepts": ["key concept 1", "key concept 2", ...],
  "realWorldExamples": ["example 1", "example 2", ...]
}

CRITICAL RULES:
- Extract ONLY what's explicitly in the source material
- Map concepts to specific learning objectives
- Identify ALL named characters
- Extract real scenarios and examples
- Assess complexity based on content depth
- Determine tone from language used
- Return valid JSON only
    `.trim();
    
    try {
      const rawResponse = await openaiChat({
        systemKey: "master_blueprint",
        user: analysisPrompt
      });
      
      const parsed = safeJSONParse(rawResponse);
      
      if (!parsed || typeof parsed !== 'object') {
        console.log("   ⚠️  Analysis parsing failed, using minimal analysis");
        return this.createMinimalAnalysis(topic, learningObjectives);
      }
      
      // Merge framework detection with comprehensive analysis
      const analysis: SourceAnalysis = {
        framework: framework || parsed.framework || null,
        conceptsByObjective: parsed.conceptsByObjective || this.mapConceptsToObjectives(learningObjectives, parsed.keyConcepts || []),
        scenarios: parsed.scenarios || [],
        characters: parsed.characters || [],
        complexityLevel: parsed.complexityLevel || "Level2",
        tone: parsed.tone || "Professional",
        teachingApproach: parsed.teachingApproach || framework?.teachingApproach || "Direct instruction with examples",
        keyConcepts: parsed.keyConcepts || [],
        realWorldExamples: parsed.realWorldExamples || []
      };
      
      // Enhance framework with characters if found
      if (analysis.framework && analysis.characters.length > 0) {
        analysis.framework.characters = this.mapCharactersToFramework(analysis.characters, analysis.framework);
      }
      
      console.log(`   ✅ Analysis complete:`);
      console.log(`      🎯 Concepts mapped to ${Object.keys(analysis.conceptsByObjective).length} objectives`);
      console.log(`      📖 Scenarios: ${analysis.scenarios.length}`);
      console.log(`      🎭 Characters: ${analysis.characters.length}`);
      console.log(`      📊 Complexity: ${analysis.complexityLevel}`);
      console.log(`      🎨 Tone: ${analysis.tone}`);
      
      return analysis;
      
    } catch (error) {
      console.error("   ❌ ContentExtractionAgent analysis error:", error);
      return this.createMinimalAnalysis(topic, learningObjectives);
    }
  }
  
  /**
   * Detect framework patterns in source material
   */
  private async detectFramework(
    sourceMaterial: string,
    topic: string
  ): Promise<DetectedFramework | null> {
    // Pattern-based detection first
    const capsPattern = /CAPS\s*(Model|Framework)|Controller.*Analyser.*Promoter.*Supporter|personality.*types.*(Controller|Analyser|Promoter|Supporter)/i;
    const licopPattern = /LICOP|Life Insurance Code of Practice|insurance.*code.*practice/i;
    const discPattern = /DISC.*(Model|Framework)|Dominance.*Influence.*Steadiness.*Conscientiousness/i;
    
    let detectedFramework: DetectedFramework | null = null;
    
    // CAPS Model Detection
    if (capsPattern.test(sourceMaterial)) {
      console.log("   🎯 CAPS Model pattern detected");
      detectedFramework = await this.extractCAPSModel(sourceMaterial);
    }
    // LICOP Detection
    else if (licopPattern.test(sourceMaterial)) {
      console.log("   🎯 LICOP pattern detected");
      detectedFramework = await this.extractLICOP(sourceMaterial);
    }
    // DISC Model Detection
    else if (discPattern.test(sourceMaterial)) {
      console.log("   🎯 DISC Model pattern detected");
      detectedFramework = await this.extractDISCModel(sourceMaterial);
    }
    // Generic framework detection
    else {
      detectedFramework = await this.detectGenericFramework(sourceMaterial, topic);
    }
    
    return detectedFramework;
  }
  
  /**
   * Extract CAPS Model framework
   */
  private async extractCAPSModel(sourceMaterial: string): Promise<DetectedFramework> {
    const extractionPrompt = `
Extract the CAPS Model framework from the following content.

SOURCE MATERIAL:
${sourceMaterial}

Return JSON with this structure:
{
  "name": "CAPS Model",
  "type": "behavioral",
  "components": [
    {
      "name": "Controller",
      "description": "Description of Controller type",
      "characteristics": ["trait1", "trait2"],
      "examples": ["example1", "example2"]
    },
    {
      "name": "Analyser",
      "description": "Description of Analyser type",
      "characteristics": ["trait1", "trait2"],
      "examples": ["example1", "example2"]
    },
    {
      "name": "Promoter",
      "description": "Description of Promoter type",
      "characteristics": ["trait1", "trait2"],
      "examples": ["example1", "example2"]
    },
    {
      "name": "Supporter",
      "description": "Description of Supporter type",
      "characteristics": ["trait1", "trait2"],
      "examples": ["example1", "example2"]
    }
  ],
  "teachingApproach": "How to teach the CAPS model",
  "confidence": 95,
  "evidence": ["quote1", "quote2"]
}
    `.trim();
    
    try {
      const response = await openaiChat({
        systemKey: "master_blueprint",
        user: extractionPrompt
      });
      
      const extracted = safeJSONParse(response);
      
      if (extracted && extracted.name === "CAPS Model") {
        return {
          name: "CAPS Model",
          type: "behavioral",
          components: extracted.components || this.getDefaultCAPSComponents(),
          teachingApproach: extracted.teachingApproach || "Teach through character archetypes and real-world examples",
          confidence: extracted.confidence || 90,
          evidence: extracted.evidence || []
        };
      }
    } catch (error) {
      console.error("   ⚠️  CAPS extraction error:", error);
    }
    
    // Fallback to default CAPS structure
    return {
      name: "CAPS Model",
      type: "behavioral",
      components: this.getDefaultCAPSComponents(),
      teachingApproach: "Teach through character archetypes and real-world examples",
      confidence: 70,
      evidence: ["CAPS pattern detected in source"]
    };
  }
  
  /**
   * Extract LICOP framework
   */
  private async extractLICOP(sourceMaterial: string): Promise<DetectedFramework> {
    const extractionPrompt = `
Extract the Life Insurance Code of Practice (LICOP) framework from the following content.

SOURCE MATERIAL:
${sourceMaterial}

Return JSON with this structure:
{
  "name": "LICOP",
  "type": "compliance",
  "components": [
    {
      "name": "Component name",
      "description": "Description",
      "characteristics": ["trait1", "trait2"]
    }
  ],
  "teachingApproach": "How to teach LICOP principles",
  "confidence": 95,
  "evidence": ["quote1", "quote2"]
}
    `.trim();
    
    try {
      const response = await openaiChat({
        systemKey: "master_blueprint",
        user: extractionPrompt
      });
      
      const extracted = safeJSONParse(response);
      
      if (extracted && extracted.name === "LICOP") {
        return {
          name: "LICOP",
          type: "compliance",
          components: extracted.components || [],
          teachingApproach: extracted.teachingApproach || "Teach through compliance scenarios and case studies",
          confidence: extracted.confidence || 90,
          evidence: extracted.evidence || []
        };
      }
    } catch (error) {
      console.error("   ⚠️  LICOP extraction error:", error);
    }
    
    return {
      name: "LICOP",
      type: "compliance",
      components: [],
      teachingApproach: "Teach through compliance scenarios and case studies",
      confidence: 70,
      evidence: ["LICOP pattern detected in source"]
    };
  }
  
  /**
   * Extract DISC Model framework
   */
  private async extractDISCModel(sourceMaterial: string): Promise<DetectedFramework> {
    const extractionPrompt = `
Extract the DISC Model framework from the following content.

SOURCE MATERIAL:
${sourceMaterial}

Return JSON with this structure:
{
  "name": "DISC Model",
  "type": "behavioral",
  "components": [
    {
      "name": "Dominance",
      "description": "Description",
      "characteristics": ["trait1", "trait2"]
    },
    {
      "name": "Influence",
      "description": "Description",
      "characteristics": ["trait1", "trait2"]
    },
    {
      "name": "Steadiness",
      "description": "Description",
      "characteristics": ["trait1", "trait2"]
    },
    {
      "name": "Conscientiousness",
      "description": "Description",
      "characteristics": ["trait1", "trait2"]
    }
  ],
  "teachingApproach": "How to teach the DISC model",
  "confidence": 95,
  "evidence": ["quote1", "quote2"]
}
    `.trim();
    
    try {
      const response = await openaiChat({
        systemKey: "master_blueprint",
        user: extractionPrompt
      });
      
      const extracted = safeJSONParse(response);
      
      if (extracted && extracted.name === "DISC Model") {
        return {
          name: "DISC Model",
          type: "behavioral",
          components: extracted.components || [],
          teachingApproach: extracted.teachingApproach || "Teach through behavioral profiles and examples",
          confidence: extracted.confidence || 90,
          evidence: extracted.evidence || []
        };
      }
    } catch (error) {
      console.error("   ⚠️  DISC extraction error:", error);
    }
    
    return {
      name: "DISC Model",
      type: "behavioral",
      components: [],
      teachingApproach: "Teach through behavioral profiles and examples",
      confidence: 70,
      evidence: ["DISC pattern detected in source"]
    };
  }
  
  /**
   * Detect generic framework if no specific pattern found
   */
  private async detectGenericFramework(
    sourceMaterial: string,
    topic: string
  ): Promise<DetectedFramework | null> {
    const detectionPrompt = `
Analyze the following content and identify if there's a framework, model, or structured approach.

SOURCE MATERIAL:
${sourceMaterial}

TOPIC: ${topic}

Return JSON if a framework is detected:
{
  "name": "Framework name",
  "type": "behavioral|conceptual|compliance|process|unknown",
  "components": [
    {
      "name": "Component name",
      "description": "Description",
      "characteristics": ["trait1", "trait2"]
    }
  ],
  "teachingApproach": "How to teach this",
  "confidence": 50-100,
  "evidence": ["quote1", "quote2"]
}

If no clear framework, return null.
    `.trim();
    
    try {
      const response = await openaiChat({
        systemKey: "master_blueprint",
        user: detectionPrompt
      });
      
      const extracted = safeJSONParse(response);
      
      if (extracted && extracted.name && extracted.confidence > 50) {
        return {
          name: extracted.name,
          type: extracted.type || "unknown",
          components: extracted.components || [],
          teachingApproach: extracted.teachingApproach || "Direct instruction with examples",
          confidence: extracted.confidence || 60,
          evidence: extracted.evidence || []
        };
      }
    } catch (error) {
      console.error("   ⚠️  Generic framework detection error:", error);
    }
    
    return null;
  }
  
  /**
   * Extract content for a specific scene type
   */
  async extractForScene(
    sceneSpec: {
      sceneType: "TEACH" | "SHOW" | "APPLY" | "CHECK" | "REFLECT";
      learningObjective: string;
      objectiveIndex: number;
    },
    analysis: SourceAnalysis
  ): Promise<SceneContent> {
    console.log(`   📝 Extracting content for ${sceneSpec.sceneType} scene (LO${sceneSpec.objectiveIndex + 1})...`);
    
    const relevantConcepts = analysis.conceptsByObjective[`LO${sceneSpec.objectiveIndex + 1}`] || 
                            analysis.conceptsByObjective[`LO${sceneSpec.objectiveIndex + 1}`] ||
                            analysis.keyConcepts;
    
    // Filter framework components based on scene type
    let applicableFrameworkComponents: FrameworkComponent[] = [];
    if (analysis.framework) {
      if (sceneSpec.sceneType === "TEACH" || sceneSpec.sceneType === "SHOW") {
        // Show all components for teaching
        applicableFrameworkComponents = analysis.framework.components;
      } else if (sceneSpec.sceneType === "APPLY" || sceneSpec.sceneType === "CHECK") {
        // Show components relevant to the learning objective
        applicableFrameworkComponents = analysis.framework.components.filter(comp => 
          relevantConcepts.some(concept => 
            concept.toLowerCase().includes(comp.name.toLowerCase()) ||
            comp.name.toLowerCase().includes(concept.toLowerCase())
          )
        );
      }
    }
    
    // Filter characters relevant to this scene
    const relevantCharacters = analysis.characters.filter(char => 
      analysis.scenarios.some(scenario => 
        scenario.learningObjective === `LO${sceneSpec.objectiveIndex + 1}` &&
        scenario.characters.includes(char.name)
      )
    );
    
    // Filter scenarios for this learning objective
    const relevantScenarios = analysis.scenarios.filter(scenario =>
      scenario.learningObjective === `LO${sceneSpec.objectiveIndex + 1}` ||
      (!scenario.learningObjective && sceneSpec.sceneType === "APPLY")
    );
    
    // Extract examples
    const relevantExamples = analysis.realWorldExamples.filter(example =>
      relevantConcepts.some(concept => example.toLowerCase().includes(concept.toLowerCase()))
    );
    
    // Generate teaching points
    const teachingPoints = this.generateTeachingPoints(
      sceneSpec.sceneType,
      relevantConcepts,
      applicableFrameworkComponents,
      analysis.framework
    );
    
    // Generate visual cues
    const visualCues = this.generateVisualCues(
      sceneSpec.sceneType,
      applicableFrameworkComponents,
      relevantCharacters,
      relevantScenarios
    );
    
    // Generate interaction hints
    const interactionHints = this.generateInteractionHints(
      sceneSpec.sceneType,
      applicableFrameworkComponents,
      relevantScenarios
    );
    
    return {
      relevantConcepts,
      applicableFrameworkComponents,
      characters: relevantCharacters.length > 0 ? relevantCharacters : analysis.characters.slice(0, 2),
      examples: relevantExamples.length > 0 ? relevantExamples : analysis.realWorldExamples.slice(0, 3),
      scenarios: relevantScenarios.length > 0 ? relevantScenarios : analysis.scenarios.slice(0, 1),
      teachingPoints,
      visualCues,
      interactionHints
    };
  }
  
  // ========== HELPER METHODS ==========
  
  private formatFrameworkForPrompt(framework: DetectedFramework): string {
    return `
Framework: ${framework.name}
Type: ${framework.type}
Components:
${framework.components.map(comp => `- ${comp.name}: ${comp.description}`).join('\n')}
Teaching Approach: ${framework.teachingApproach}
    `.trim();
  }
  
  private mapConceptsToObjectives(
    learningObjectives: string[],
    keyConcepts: string[]
  ): Record<string, string[]> {
    const mapping: Record<string, string[]> = {};
    
    learningObjectives.forEach((lo, i) => {
      const loKey = `LO${i + 1}`;
      // Simple keyword matching - could be enhanced with LLM
      mapping[loKey] = keyConcepts.filter(concept =>
        lo.toLowerCase().includes(concept.toLowerCase()) ||
        concept.toLowerCase().includes(lo.toLowerCase().split(' ')[0])
      ).slice(0, 5);
    });
    
    return mapping;
  }
  
  private mapCharactersToFramework(
    characters: ExtractedCharacter[],
    framework: DetectedFramework
  ): FrameworkCharacter[] {
    return characters.map(char => ({
      name: char.name,
      type: char.archetype || "Unknown",
      traits: [],
      behaviors: [],
      examples: []
    }));
  }
  
  private generateTeachingPoints(
    sceneType: string,
    concepts: string[],
    frameworkComponents: FrameworkComponent[],
    framework: DetectedFramework | null
  ): string[] {
    const points: string[] = [];
    
    if (sceneType === "TEACH") {
      points.push(...concepts.map(c => `Explain ${c}`));
      if (framework) {
        points.push(`Introduce ${framework.name} framework`);
        points.push(...frameworkComponents.map(comp => `Teach ${comp.name} characteristics`));
      }
    } else if (sceneType === "SHOW") {
      points.push(...concepts.map(c => `Demonstrate ${c} in action`));
      if (framework) {
        points.push(...frameworkComponents.map(comp => `Show ${comp.name} in real scenario`));
      }
    } else if (sceneType === "APPLY") {
      points.push(...concepts.map(c => `Apply ${c} to solve problem`));
      points.push("Practice with interactive scenario");
    } else if (sceneType === "CHECK") {
      points.push("Assess understanding of key concepts");
      points.push("Test application of framework");
    } else if (sceneType === "REFLECT") {
      points.push("Reflect on learning");
      points.push("Identify key takeaways");
      points.push("Plan for application");
    }
    
    return points;
  }
  
  private generateVisualCues(
    sceneType: string,
    frameworkComponents: FrameworkComponent[],
    characters: ExtractedCharacter[],
    scenarios: Scenario[]
  ): string[] {
    const cues: string[] = [];
    
    if (frameworkComponents.length > 0) {
      cues.push(`Visual representation of ${frameworkComponents.map(c => c.name).join(' and ')}`);
    }
    
    if (characters.length > 0) {
      cues.push(`Character: ${characters[0].name} in workplace setting`);
    }
    
    if (scenarios.length > 0) {
      cues.push(`Scenario: ${scenarios[0].title}`);
    }
    
    return cues;
  }
  
  private generateInteractionHints(
    sceneType: string,
    frameworkComponents: FrameworkComponent[],
    scenarios: Scenario[]
  ): string[] {
    const hints: string[] = [];
    
    if (sceneType === "APPLY") {
      if (frameworkComponents.length > 0) {
        hints.push(`Drag-and-drop: Match behaviors to ${frameworkComponents.map(c => c.name).join('/')} types`);
      }
      if (scenarios.length > 0) {
        hints.push(`Scenario-based interaction: ${scenarios[0].title}`);
      }
    } else if (sceneType === "CHECK") {
      hints.push("Multiple choice: Test framework understanding");
      hints.push("Knowledge check: Validate concept mastery");
    }
    
    return hints;
  }
  
  private getDefaultCAPSComponents(): FrameworkComponent[] {
    return [
      {
        name: "Controller",
        description: "Direct, decisive, results-oriented personality type",
        characteristics: ["Direct", "Decisive", "Results-focused", "Task-oriented"],
        examples: []
      },
      {
        name: "Analyser",
        description: "Detail-oriented, systematic, precision-focused personality type",
        characteristics: ["Systematic", "Detail-oriented", "Analytical", "Precise"],
        examples: []
      },
      {
        name: "Promoter",
        description: "Enthusiastic, persuasive, relationship-focused personality type",
        characteristics: ["Enthusiastic", "Persuasive", "People-oriented", "Energetic"],
        examples: []
      },
      {
        name: "Supporter",
        description: "Steady, supportive, relationship-focused personality type",
        characteristics: ["Steady", "Supportive", "Patient", "Relationship-focused"],
        examples: []
      }
    ];
  }
  
  private createMinimalAnalysis(
    topic: string,
    learningObjectives: string[]
  ): SourceAnalysis {
    const conceptsByObjective: Record<string, string[]> = {};
    learningObjectives.forEach((lo, i) => {
      conceptsByObjective[`LO${i + 1}`] = [topic, lo.split(' ')[0]];
    });
    
    return {
      framework: null,
      conceptsByObjective,
      scenarios: [],
      characters: [],
      complexityLevel: "Level2",
      tone: "Professional",
      teachingApproach: "Direct instruction with examples",
      keyConcepts: [topic],
      realWorldExamples: [`Example scenario for ${topic}`]
    };
  }
}

export default ContentExtractionAgent;



