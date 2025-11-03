// backend/src/agents_v2/contentExtractionAgent.ts

/**
 * Content Extraction Agent
 * 
 * EXTRACT, DON'T INVENT
 * 
 * Analyzes training materials and extracts specific, actionable content:
 * - Models and frameworks (CAPS, DISC, etc.)
 * - Concrete techniques (I-statements, active listening, etc.)
 * - Real examples and case studies
 * - Step-by-step processes
 * - Domain-specific terminology
 * 
 * This ensures all storyboard content is grounded in actual training material,
 * not AI-generated generic concepts.
 */

import { openaiChat } from "../services/openaiGateway";
import { safeJSONParse } from "../utils/safeJSONParse";

export interface ExtractedContent {
  models: string[];           // Specific models/frameworks (e.g., "CAPS Model")
  techniques: string[];       // Concrete techniques (e.g., "3-step de-escalation")
  terminology: string[];      // Key terms and definitions
  examples: string[];         // Real case studies and examples
  processes: string[];        // Step-by-step procedures
  pitfalls: string[];         // Common mistakes to avoid
  characters?: string[];      // Named characters from examples
  scenarios?: string[];       // Specific situations described
}

export class ContentExtractionAgent {
  
  /**
   * Extract specific content from training materials
   */
  async extractContent(
    trainingMaterial: string,
    learningObjectives: string[],
    topic: string
  ): Promise<ExtractedContent> {
    console.log("📚 ContentExtractionAgent: Extracting specific content from training materials...");
    
    // If no training material provided, return empty extraction
    if (!trainingMaterial || trainingMaterial.trim().length < 50) {
      console.log("   ⚠️  No substantial training material provided - using minimal extraction");
      return this.createMinimalExtraction(topic, learningObjectives);
    }
    
    const extractionPrompt = `
EXTRACTION TASK: Extract SPECIFIC, ACTIONABLE content from the provided training material.

TRAINING MATERIAL:
${trainingMaterial}

LEARNING OBJECTIVES:
${learningObjectives.join('\n')}

EXTRACT THE FOLLOWING (return as JSON):
1. **models**: Specific models/frameworks mentioned (e.g., "CAPS Model: Controller, Analyser, Promoter, Supporter")
2. **techniques**: Concrete techniques with steps (e.g., "3-step de-escalation: 1) Acknowledge emotion, 2) Reframe issue, 3) Offer choices")
3. **terminology**: Key terms and their definitions
4. **examples**: Real examples, case studies, or scenarios mentioned
5. **processes**: Step-by-step procedures described
6. **pitfalls**: Common mistakes or what to avoid
7. **characters**: Any named people in examples (e.g., "Sarah", "Alex the Tank")
8. **scenarios**: Specific situations described

CRITICAL RULES:
- Extract ONLY what's explicitly in the training material
- Do NOT invent or add content
- Keep original terminology and phrasing
- Include specific details (names, numbers, steps)
- If something isn't mentioned, use empty array

Return ONLY valid JSON with this structure:
{
  "models": ["..."],
  "techniques": ["..."],
  "terminology": ["..."],
  "examples": ["..."],
  "processes": ["..."],
  "pitfalls": ["..."],
  "characters": ["..."],
  "scenarios": ["..."]
}
    `.trim();

    try {
      const rawResponse = await openaiChat({
        systemKey: "master_blueprint",
        user: extractionPrompt
      });
      
      const extracted = safeJSONParse(rawResponse);
      
      if (!extracted || typeof extracted !== 'object') {
        console.log("   ⚠️  Extraction failed, using minimal content");
        return this.createMinimalExtraction(topic, learningObjectives);
      }
      
      // Ensure all fields exist
      const content: ExtractedContent = {
        models: Array.isArray(extracted.models) ? extracted.models : [],
        techniques: Array.isArray(extracted.techniques) ? extracted.techniques : [],
        terminology: Array.isArray(extracted.terminology) ? extracted.terminology : [],
        examples: Array.isArray(extracted.examples) ? extracted.examples : [],
        processes: Array.isArray(extracted.processes) ? extracted.processes : [],
        pitfalls: Array.isArray(extracted.pitfalls) ? extracted.pitfalls : [],
        characters: Array.isArray(extracted.characters) ? extracted.characters : [],
        scenarios: Array.isArray(extracted.scenarios) ? extracted.scenarios : []
      };
      
      const totalExtracted = Object.values(content).reduce((sum, arr) => sum + arr.length, 0);
      
      console.log(`   ✅ Extracted ${totalExtracted} content elements:`);
      console.log(`      📊 Models: ${content.models.length}`);
      console.log(`      🔧 Techniques: ${content.techniques.length}`);
      console.log(`      📖 Terminology: ${content.terminology.length}`);
      console.log(`      💡 Examples: ${content.examples.length}`);
      console.log(`      📋 Processes: ${content.processes.length}`);
      console.log(`      ⚠️  Pitfalls: ${content.pitfalls.length}`);
      if (content.characters && content.characters.length > 0) {
        console.log(`      🎭 Characters: ${content.characters.join(', ')}`);
      }
      
      return content;
      
    } catch (error) {
      console.error("   ❌ ContentExtractionAgent error:", error);
      return this.createMinimalExtraction(topic, learningObjectives);
    }
  }
  
  /**
   * Create minimal extraction when no training material available
   */
  private createMinimalExtraction(topic: string, objectives: string[]): ExtractedContent {
    return {
      models: [`${topic} framework (based on learning objectives)`],
      techniques: objectives.map(obj => `Technique for: ${obj}`),
      terminology: [topic],
      examples: [`Example scenario for ${topic}`],
      processes: [`Process for achieving: ${objectives[0] || topic}`],
      pitfalls: [`Common mistakes in ${topic}`],
      characters: [],
      scenarios: [`Workplace scenario involving ${topic}`]
    };
  }
  
  /**
   * Format extracted content for agent prompts
   */
  formatForPrompt(content: ExtractedContent): string {
    const sections: string[] = [];
    
    if (content.models.length > 0) {
      sections.push(`MODELS/FRAMEWORKS:\n${content.models.map(m => `- ${m}`).join('\n')}`);
    }
    
    if (content.techniques.length > 0) {
      sections.push(`TECHNIQUES:\n${content.techniques.map(t => `- ${t}`).join('\n')}`);
    }
    
    if (content.processes.length > 0) {
      sections.push(`PROCESSES:\n${content.processes.map(p => `- ${p}`).join('\n')}`);
    }
    
    if (content.examples.length > 0) {
      sections.push(`EXAMPLES:\n${content.examples.map(e => `- ${e}`).join('\n')}`);
    }
    
    if (content.terminology.length > 0) {
      sections.push(`KEY TERMS:\n${content.terminology.map(t => `- ${t}`).join('\n')}`);
    }
    
    if (content.pitfalls.length > 0) {
      sections.push(`PITFALLS TO AVOID:\n${content.pitfalls.map(p => `- ${p}`).join('\n')}`);
    }
    
    if (content.characters && content.characters.length > 0) {
      sections.push(`CHARACTERS:\n${content.characters.map(c => `- ${c}`).join('\n')}`);
    }
    
    return sections.join('\n\n');
  }
}


