// backend/src/agents_v2/enhancedTeachAgentSimple.ts
import { LearningRequest, Scene } from "./types";
import { openaiChat } from "../services/openaiGateway";
import { getEnhancedPrompt } from "../prompts/agentPrompts";
import { resetHeader } from "./resetHeader";
import { safeJSONParse } from "../utils/safeJSONParse";
import { TeachingScene } from "./teachingTemplates";

export class EnhancedTeachAgentSimple {
  async generateTeachingScenes(
    req: LearningRequest,
    learningOutcomes: string[],
    count: number
  ): Promise<Scene[]> {
    console.log("📚 EnhancedTeachAgentSimple: Generating structured teaching scenes");
    
    const scenes: Scene[] = [];
    
    for (let i = 0; i < Math.min(count, learningOutcomes.length); i++) {
      const outcome = learningOutcomes[i];
      const sceneNumber = scenes.length + 1;

      try {
        const scene = await this.generateStoryDrivenScene(req, outcome, sceneNumber);
        scenes.push(scene);
        console.log(`   ✅ Generated structured teaching scene: "${scene.pageTitle}"`);
      } catch (error) {
        console.error(`   ❌ Failed to generate teaching scene for outcome ${i + 1}:`, error);
        scenes.push(this.createFallbackScene(req, outcome, sceneNumber));
      }
    }
    
    return scenes;
  }
  
  private async generateStoryDrivenScene(
    req: LearningRequest,
    learningOutcome: string,
    sceneNumber: number
  ): Promise<Scene> {
    // STEP 1: Extract SPECIFIC INSTRUCTIONAL CONTENT from the LO
    console.log(`      🔍 Extracting instructional content from LO...`);
    const extractedInstructionalContent = await this.extractInstructionalContentFromLO(
      learningOutcome,
      req.topic,
      req.sourceMaterial
    );
    
    console.log(`      ✅ Extracted ${extractedInstructionalContent.keyConcepts.length} key concepts`);
    
    const extractedContent = (req as any).extractedContent;
    const contentSummary = this.buildExtractedContentSummary(learningOutcome, extractedContent);
    const availableCharacters = this.getAvailableCharacters(extractedContent);

    // STEP 2: Generate scene using EXTRACTED CONTENT
    const enhancedPrompt = getEnhancedPrompt("teachAgent", {
      topic: req.topic,
      outcome: learningOutcome,
      audience: req.audience || "General staff",
      extractedContentSummary: contentSummary,
      availableCharacters,
    });

    // Inject extracted instructional content into the prompt
    const contentInjection = `
MANDATORY INSTRUCTIONAL CONTENT (this MUST appear in the voiceover):
${JSON.stringify(extractedInstructionalContent.keyConcepts, null, 2)}

CONCRETE EXAMPLES TO INCLUDE:
${JSON.stringify(extractedInstructionalContent.concreteExamples, null, 2)}

MISCONCEPTIONS TO ADDRESS:
${JSON.stringify(extractedInstructionalContent.misconceptions, null, 2)}

${enhancedPrompt}
`.trim();

    const finalPrompt = `${resetHeader}${contentInjection}`;
    const response = await openaiChat({ systemKey: "master_blueprint", user: finalPrompt });
    console.log(`   🧠 EnhancedTeachAgentSimple: Response received for outcome "${learningOutcome.substring(0, 60)}..."`);

    const parsed = safeJSONParse(response);
    const payload = this.normalizeTeachAgentResponse(parsed);

    if (!payload || typeof payload !== "object") {
      throw new Error("TeachAgent returned an invalid payload");
    }

    const teachingScene = this.generatePedagogicallyStructuredContent(
      req.topic,
      learningOutcome,
      extractedContent
    );

    teachingScene.pageTitle = payload.title || teachingScene.pageTitle;
    teachingScene.onScreenText = payload.on_screen_text || payload.onScreenText || teachingScene.onScreenText;
    
    // CRITICAL: Enrich narration with explicit instructional content if it's too generic
    const rawNarration = payload.narration_script || payload.narrationScript || teachingScene.voiceOverScript;
    teachingScene.voiceOverScript = this.enrichWithInstructionalContent(
      rawNarration,
      learningOutcome,
      extractedContent
    );
    
    teachingScene.visualAIPrompt = payload.visual_ai_prompt || payload.visualAiPrompt || teachingScene.visualAIPrompt;
    teachingScene.altText = payload.alt_text || payload.altText || teachingScene.altText;
    
    // STEP 3: VALIDATE content is present
    const validation = this.validateInstructionalContentPresence(
      teachingScene.voiceOverScript,
      extractedInstructionalContent.keyConcepts
    );
    
    if (validation.missingConcepts.length > 0) {
      console.warn(`      ⚠️  Scene missing concepts: ${validation.missingConcepts.join(', ')}`);
      // Force injection of missing content
      teachingScene.voiceOverScript = this.forceInstructionalContent(
        teachingScene.voiceOverScript,
        learningOutcome,
        extractedContent,
        extractedInstructionalContent
      );
    }

    const developerNotes: string[] = [];
    if (payload.character) {
      developerNotes.push(
        `Character: ${payload.character.name}${payload.character.role ? ` (${payload.character.role})` : ""}`
      );
      if (payload.character.challenge) {
        developerNotes.push(`Challenge: ${payload.character.challenge}`);
      }
      if (payload.character.transformation) {
        developerNotes.push(`Transformation: ${payload.character.transformation}`);
      }
    }
    if (payload.teaching_principle || payload.teachingPrinciple) {
      developerNotes.push(`Teaching Principle: ${payload.teaching_principle || payload.teachingPrinciple}`);
    }
    if (payload.real_world_example || payload.realWorldExample) {
      developerNotes.push(`Real Example: ${payload.real_world_example || payload.realWorldExample}`);
    }
    if (developerNotes.length > 0) {
      teachingScene.developerNotes = developerNotes.join("\n");
    }

    const scaffoldingSet = new Set<string>(teachingScene.scaffoldingStrategy || []);
    scaffoldingSet.add("Character-driven storytelling");
    if (payload.real_world_example || payload.realWorldExample) {
      scaffoldingSet.add("Immediate workplace connection");
    }
    teachingScene.scaffoldingStrategy = Array.from(scaffoldingSet);

    const runtimeSeconds = this.estimateRuntimeSeconds(
      teachingScene.voiceOverScript,
      teachingScene.runtimeSeconds
    );
    teachingScene.runtimeSeconds = runtimeSeconds;
    teachingScene.totalWords =
      this.countWords(teachingScene.voiceOverScript) + this.countWords(teachingScene.onScreenText);

    return {
      sceneNumber,
      pageTitle: teachingScene.pageTitle,
      pageType: "Informative",
      narrationScript: teachingScene.voiceOverScript,
      onScreenText: teachingScene.onScreenText,
      visual: {
        aiPrompt: teachingScene.visualAIPrompt,
        altText: teachingScene.altText,
      },
      interactionType: "None",
      timing: { estimatedSeconds: runtimeSeconds },
      teachingScene,
    };
  }
  
  private createFallbackScene(req: LearningRequest, learningOutcome: string, sceneNumber: number): Scene {
    const extractedContent = (req as any).extractedContent;
    const fallbackTeachingScene = this.generatePedagogicallyStructuredContent(
      req.topic,
      learningOutcome,
      extractedContent
    );
    fallbackTeachingScene.pageTitle = fallbackTeachingScene.pageTitle || `Teaching: ${learningOutcome.substring(0, 50)}`;
    fallbackTeachingScene.onScreenText =
      fallbackTeachingScene.onScreenText ||
      `Key concepts for ${req.topic}. These fundamentals provide the foundation for practical application.`;
    fallbackTeachingScene.voiceOverScript =
      fallbackTeachingScene.voiceOverScript ||
      `This section covers important concepts related to ${req.topic}. Understanding these fundamentals will help you apply the knowledge effectively in your work.`;
    fallbackTeachingScene.visualAIPrompt =
      fallbackTeachingScene.visualAIPrompt ||
      `Professional illustration related to ${req.topic}, showing key concepts and their practical applications`;
    fallbackTeachingScene.altText =
      fallbackTeachingScene.altText || `Visual representation of key concepts for ${req.topic}`;
    const runtimeSeconds = this.estimateRuntimeSeconds(fallbackTeachingScene.voiceOverScript, 60);
    fallbackTeachingScene.runtimeSeconds = runtimeSeconds;

    return {
      sceneNumber,
      pageTitle: fallbackTeachingScene.pageTitle,
      pageType: "Informative",
      narrationScript: fallbackTeachingScene.voiceOverScript,
      onScreenText: fallbackTeachingScene.onScreenText,
      visual: {
        aiPrompt: fallbackTeachingScene.visualAIPrompt,
        altText: fallbackTeachingScene.altText,
      },
      interactionType: "None",
      timing: { estimatedSeconds: runtimeSeconds },
      teachingScene: fallbackTeachingScene,
    };
  }

  private normalizeTeachAgentResponse(candidate: any): any {
    if (!candidate) return null;
    if (Array.isArray(candidate)) {
      return candidate[0];
    }
    if (candidate.scene) {
      return candidate.scene;
    }
    if (candidate.scenes && Array.isArray(candidate.scenes)) {
      return candidate.scenes[0];
    }
    return candidate;
  }

  private buildExtractedContentSummary(learningOutcome: string, extractedContent?: any): string {
    if (!extractedContent) {
      return "";
    }

    const sections: string[] = [];
    const addSection = (title: string, values?: any[]) => {
      if (values && values.length > 0) {
        const trimmed = values
          .map((value: any) => (typeof value === "string" ? value : JSON.stringify(value)))
          .filter(Boolean)
          .slice(0, 4);
        if (trimmed.length > 0) {
          sections.push(`${title}:\n${trimmed.map((value) => `- ${value}`).join("\n")}`);
        }
      }
    };

    addSection("MODELS OR FRAMEWORKS", extractedContent.models);
    addSection("TECHNIQUES OR TACTICS", extractedContent.techniques);
    addSection("KEY TERMS", extractedContent.terminology);
    addSection("EXAMPLES", extractedContent.examples);
    addSection("PITFALLS TO AVOID", extractedContent.pitfalls);

    if (sections.length === 0) {
      return `- Use credible, specific details that help learners master ${learningOutcome}.`;
    }

    return sections.join("\n\n");
  }

  private getAvailableCharacters(extractedContent?: any): string[] {
    if (!extractedContent || !Array.isArray(extractedContent.characters)) {
      return [];
    }
    return extractedContent.characters.filter(Boolean).slice(0, 5);
  }

  private estimateRuntimeSeconds(script: string, fallback: number = 80): number {
    const words = this.countWords(script);
    if (words === 0) {
      return fallback;
    }
    const estimated = Math.round(words / 2); // ≈ 2 words per second for narration
    return Math.max(60, Math.min(120, estimated));
  }

  private countWords(text?: string): number {
    if (!text || typeof text !== "string") {
      return 0;
    }
    return text.trim().split(/\s+/).filter(Boolean).length;
  }
  
  private generatePedagogicallyStructuredContent(
    topic: string, 
    learningOutcome: string,
    extractedContent?: any
  ): TeachingScene {
    // 📚 Use extracted content if available, otherwise extract from learning outcome
    const keyConcepts = extractedContent 
      ? this.extractConceptsFromMaterial(extractedContent, learningOutcome)
      : this.extractKeyConcepts(learningOutcome);
    const topicContext = this.getTopicContext(topic);
    
    // Generate structured content following the pedagogical template
    const pageTitle = this.generatePageTitle(learningOutcome, topic);
    const onScreenText = this.generateOnScreenText(learningOutcome, keyConcepts);
    const voiceOverScript = this.generateVoiceOverScript(learningOutcome, keyConcepts, topicContext);
    const visualPrompt = this.generateVisualPrompt(learningOutcome, topic);
    
    return {
      learningOutcome,
      bloomTaxonomyLevel: this.determineBloomLevel(learningOutcome),
      teachingMethod: "Concept Explanation",
      contentStructurePattern: "Concept → Definition → Examples → Summary",
      scenePurpose: `Introduce and explain key concepts for ${learningOutcome}`,
      cognitiveLoad: "Medium",
      scenePlacement: "Early",
      sceneContext: `Foundation learning for ${topic}`,
      pageTitle,
      onScreenText,
      voiceOverScript,
      visualAIPrompt: visualPrompt,
      altText: `Visual representation of key concepts for ${learningOutcome}`,
      prerequisiteKnowledge: "Basic workplace experience",
      scaffoldingStrategy: ["Clear explanations", "Visual aids", "Real-world examples"],
      whyThisWorks: "Structured approach builds foundational knowledge systematically with clear progression",
      assessmentLink: "Prepares learners for practical application exercises and scenario-based assessments",
      redFlagChecks: {
        textConcise: true,
        noDuplication: true,
        visualSupportsConcept: true
      },
      totalWords: 320,
      runtimeSeconds: 80,
      learnerCentredTone: true,
      accessibilityRationale: "Clear visual and audio presentation supports diverse learning styles"
    };
  }
  
  /**
   * Extract concepts from training material (EXTRACT, DON'T INVENT)
   */
  private extractConceptsFromMaterial(extractedContent: any, learningOutcome: string): string[] {
    const concepts: string[] = [];
    
    // Use ACTUAL models from training material
    if (extractedContent.models && extractedContent.models.length > 0) {
      concepts.push(...extractedContent.models.slice(0, 3));
    }
    
    // Use SPECIFIC techniques from training material
    if (extractedContent.techniques && extractedContent.techniques.length > 0) {
      concepts.push(...extractedContent.techniques.slice(0, 3));
    }
    
    // Use KEY terminology from training material
    if (extractedContent.terminology && extractedContent.terminology.length > 0) {
      concepts.push(...extractedContent.terminology.slice(0, 2));
    }
    
    // Fallback to generic if no extracted content
    if (concepts.length === 0) {
      return this.extractKeyConcepts(learningOutcome);
    }
    
    console.log(`      📖 Using ${concepts.length} concepts from extracted training material`);
    return concepts;
  }
  
  private extractKeyConcepts(learningOutcome: string): string[] {
    // Extract key concepts from learning outcome text
    const concepts: string[] = [];
    
    if (learningOutcome.toLowerCase().includes('identify')) {
      concepts.push('recognition', 'classification', 'key characteristics');
    }
    if (learningOutcome.toLowerCase().includes('apply')) {
      concepts.push('implementation', 'practical application', 'skill execution');
    }
    if (learningOutcome.toLowerCase().includes('analyze')) {
      concepts.push('analysis', 'evaluation', 'critical thinking');
    }
    if (learningOutcome.toLowerCase().includes('communication')) {
      concepts.push('verbal skills', 'listening', 'feedback', 'non-verbal cues');
    }
    if (learningOutcome.toLowerCase().includes('difficult people')) {
      concepts.push('conflict resolution', 'behavioral patterns', 'emotional intelligence');
    }
    
    return concepts.length > 0 ? concepts : ['core principles', 'fundamental concepts', 'practical skills'];
  }
  
  private getTopicContext(topic: string): string {
    const contextMap: Record<string, string> = {
      'effective communication skills': 'professional workplace interactions and collaboration',
      'dealing with difficult people': 'conflict management and relationship building',
      'leadership skills': 'team management and organizational effectiveness',
      'customer service': 'client satisfaction and business success'
    };
    
    return contextMap[topic.toLowerCase()] || 'professional development and workplace effectiveness';
  }
  
  private generatePageTitle(learningOutcome: string, topic: string): string {
    const action = learningOutcome.split(' ')[0]; // Get first word (Identify, Apply, Analyze, etc.)
    const concept = learningOutcome.substring(learningOutcome.indexOf(' ') + 1, learningOutcome.length);
    
    return `Understanding ${action}: ${concept.substring(0, 40)}`;
  }
  
  private generateOnScreenText(learningOutcome: string, keyConcepts: string[]): string {
    const instructionalContent = this.extractInstructionalContent(learningOutcome, keyConcepts);
    
    // Build explicit on-screen text with actual content
    let text = `${learningOutcome}. `;
    
    if (instructionalContent.definitions.length > 0) {
      text += `Key concepts: ${instructionalContent.definitions.map(d => d.name).slice(0, 3).join(', ')}. `;
    }
    
    text += `Understanding these specific elements will help you apply this knowledge effectively.`;
    
    return text;
  }
  
  private generateVoiceOverScript(learningOutcome: string, keyConcepts: string[], topicContext: string): string {
    // Extract actual instructional content from the learning outcome
    const instructionalContent = this.extractInstructionalContent(learningOutcome, keyConcepts);
    
    // Build explicit teaching script that includes actual content
    let script = `Let's explore ${learningOutcome}. `;
    
    // Add explicit instructional content
    if (instructionalContent.definitions.length > 0) {
      script += `Here are the key concepts you need to understand: `;
      script += instructionalContent.definitions.map((def, idx) => {
        return `${def.name}: ${def.description}`;
      }).join('. ') + '. ';
    }
    
    if (instructionalContent.examples.length > 0) {
      script += `For example, ${instructionalContent.examples[0]}. `;
    }
    
    if (instructionalContent.methods.length > 0) {
      script += `To apply this, ${instructionalContent.methods[0]}. `;
    }
    
    script += `Understanding these specific elements is crucial for success in ${topicContext}. `;
    script += `By the end of this section, you'll be able to ${learningOutcome.toLowerCase()} with confidence.`;
    
    return script;
  }
  
  /**
   * STEP 1: Extract SPECIFIC INSTRUCTIONAL CONTENT from the LO
   * Universal method that works for ANY topic, ANY LO, ANY audience
   */
  private async extractInstructionalContentFromLO(
    learningOutcome: string,
    topic: string,
    sourceMaterial?: string
  ): Promise<{
    actionVerb: string;
    subjectMatter: string;
    keyConcepts: string[];
    concreteExamples: string[];
    misconceptions: string[];
  }> {
    const extractionPrompt = `
You are analyzing a learning objective to extract the SPECIFIC CONTENT that must be taught.

LEARNING OBJECTIVE: "${learningOutcome}"
TOPIC: "${topic}"
${sourceMaterial ? `SOURCE MATERIAL CONTEXT:\n${sourceMaterial.substring(0, 1000)}` : ''}

EXTRACT:

1. ACTION VERB: What must the learner DO? (understand, apply, identify, develop, etc.)
2. SUBJECT MATTER: What specific topic/skill/concept?
3. KEY CONCEPTS: What are the 3-5 core ideas that MUST be explained to achieve this LO?
4. CONCRETE EXAMPLES: What real-world examples demonstrate this?
5. MISCONCEPTIONS: What do learners typically get wrong?

EXAMPLE:

LO: "Identify the four CAPS behavioral types and their characteristics"

OUTPUT:
{
  "actionVerb": "Identify",
  "subjectMatter": "CAPS behavioral types",
  "keyConcepts": [
    "Controller: Direct, results-focused, wants efficiency",
    "Analyser: Detail-oriented, systematic, wants data", 
    "Promoter: Enthusiastic, relationship-driven, wants connection",
    "Supporter: Patient, helpful, wants harmony"
  ],
  "concreteExamples": [
    "Controller customer: 'Just tell me the bottom line. I don't have time for details.'",
    "Analyser customer: 'Can you send me all the documentation? I need to review it thoroughly.'"
  ],
  "misconceptions": [
    "Thinking all difficult people are aggressive (some are passive)",
    "Believing one type is 'better' than others"
  ]
}

LEARNING OBJECTIVE TO ANALYZE: "${learningOutcome}"

Return ONLY valid JSON. This content MUST appear in the teaching scene.
    `.trim();

    try {
      const response = await openaiChat({
        systemKey: "master_blueprint",
        user: `${resetHeader}${extractionPrompt}`
      });

      const parsed = safeJSONParse(response);
      const extracted = parsed.report || parsed;

      return {
        actionVerb: extracted.actionVerb || this.extractActionVerb(learningOutcome),
        subjectMatter: extracted.subjectMatter || this.extractSubjectMatter(learningOutcome),
        keyConcepts: Array.isArray(extracted.keyConcepts) ? extracted.keyConcepts : 
          extracted.keyConcepts ? [extracted.keyConcepts] : 
          this.extractKeyConcepts(learningOutcome),
        concreteExamples: Array.isArray(extracted.concreteExamples) ? extracted.concreteExamples : 
          extracted.concreteExamples ? [extracted.concreteExamples] : [],
        misconceptions: Array.isArray(extracted.misconceptions) ? extracted.misconceptions : 
          extracted.misconceptions ? [extracted.misconceptions] : []
      };
    } catch (error) {
      console.error("⚠️  Failed to extract instructional content, using fallback:", error);
      // Fallback extraction
      return {
        actionVerb: this.extractActionVerb(learningOutcome),
        subjectMatter: this.extractSubjectMatter(learningOutcome),
        keyConcepts: this.extractKeyConcepts(learningOutcome),
        concreteExamples: [],
        misconceptions: []
      };
    }
  }

  private extractActionVerb(lo: string): string {
    const verbs = ['understand', 'apply', 'identify', 'develop', 'analyze', 'evaluate', 'create', 'demonstrate', 'explain', 'recognize'];
    const loLower = lo.toLowerCase();
    for (const verb of verbs) {
      if (loLower.includes(verb)) return verb.charAt(0).toUpperCase() + verb.slice(1);
    }
    return 'Understand';
  }

  private extractSubjectMatter(lo: string): string {
    // Remove common prefixes and extract the core subject
    const cleaned = lo.replace(/^(understand|apply|identify|develop|analyze|evaluate|create|demonstrate|explain|recognize)\s+/i, '');
    return cleaned.substring(0, 60);
  }

  /**
   * STEP 3: VALIDATE content is present
   */
  private validateInstructionalContentPresence(
    voiceOver: string,
    requiredConcepts: string[]
  ): {
    missingConcepts: string[];
    coverageScore: number;
  } {
    const missing: string[] = [];
    let covered = 0;

    for (const concept of requiredConcepts) {
      // Check if key words from the concept appear in voiceover
      const conceptWords = concept.toLowerCase()
        .split(/\s+/)
        .filter(w => w.length > 4)
        .slice(0, 3); // Check first 3 significant words
      
      const found = conceptWords.some(word => 
        voiceOver.toLowerCase().includes(word)
      );

      if (found) {
        covered++;
      } else {
        missing.push(concept);
      }
    }

    return {
      missingConcepts: missing,
      coverageScore: requiredConcepts.length > 0 ? (covered / requiredConcepts.length) * 100 : 0
    };
  }

  /**
   * Extract actual instructional content from learning outcome
   */
  private extractInstructionalContent(learningOutcome: string, keyConcepts: string[]): {
    definitions: Array<{ name: string; description: string }>;
    examples: string[];
    methods: string[];
  } {
    const definitions: Array<{ name: string; description: string }> = [];
    const examples: string[] = [];
    const methods: string[] = [];
    
    const loLower = learningOutcome.toLowerCase();
    
    // Extract if LO asks to "identify" or "list"
    if (loLower.includes('identify') || loLower.includes('list')) {
      // Look for numbered items or specific types
      if (loLower.includes('four') || loLower.includes('4')) {
        // Extract the thing being identified
        const match = learningOutcome.match(/identify (?:the )?(?:four|4) (\w+)/i);
        if (match) {
          const itemType = match[1];
          keyConcepts.forEach(concept => {
            definitions.push({
              name: concept,
              description: `${concept} is a key component of ${itemType} that...`
            });
          });
        }
      }
    }
    
    // Extract if LO mentions specific frameworks or models
    if (loLower.includes('caps model') || loLower.includes('caps')) {
      definitions.push(
        { name: 'Controller', description: 'direct and results-focused individuals who speak quickly, make quick decisions, and want efficiency' },
        { name: 'Analyser', description: 'detail-oriented and systematic individuals who ask many questions, want data, and think before acting' },
        { name: 'Promoter', description: 'enthusiastic and relationship-driven individuals who are expressive, share stories, and value connection' },
        { name: 'Supporter', description: 'patient and helpful individuals who are calm, considerate, and want harmony' }
      );
      examples.push('A Controller might say "Get to the point, I\'m busy" while an Analyser asks "Can you send me the full report?"');
    }
    
    // Extract techniques or methods
    if (loLower.includes('technique') || loLower.includes('method') || loLower.includes('strategy')) {
      keyConcepts.forEach(concept => {
        methods.push(`apply the ${concept} technique by...`);
      });
    }
    
    // Fallback: use key concepts as definitions
    if (definitions.length === 0 && keyConcepts.length > 0) {
      keyConcepts.forEach(concept => {
        definitions.push({
          name: concept,
          description: `an essential concept for mastering ${learningOutcome}`
        });
      });
    }
    
    return { definitions, examples, methods };
  }
  
  /**
   * Enrich narration script with explicit instructional content
   */
  private enrichWithInstructionalContent(
    narration: string,
    learningOutcome: string,
    extractedContent?: any
  ): string {
    // Check if narration already contains specific instructional content
    const hasSpecificContent = this.hasExplicitInstructionalContent(narration, learningOutcome);
    
    if (hasSpecificContent) {
      return narration; // Already good
    }
    
    // Extract and inject actual instructional content
    const instructionalContent = this.extractInstructionalContent(
      learningOutcome,
      extractedContent ? this.extractConceptsFromMaterial(extractedContent, learningOutcome) : []
    );
    
    // Build enriched narration
    let enriched = narration;
    
    // Add definitions if missing
    if (instructionalContent.definitions.length > 0 && !narration.includes(instructionalContent.definitions[0].name)) {
      const definitionsText = instructionalContent.definitions
        .map(def => `${def.name}: ${def.description}`)
        .join('. ');
      enriched += ` Specifically, ${definitionsText}.`;
    }
    
    // Add examples if missing
    if (instructionalContent.examples.length > 0 && !narration.toLowerCase().includes('example')) {
      enriched += ` For example, ${instructionalContent.examples[0]}.`;
    }
    
    return enriched;
  }
  
  /**
   * Check if narration contains explicit instructional content
   */
  private hasExplicitInstructionalContent(narration: string, learningOutcome: string): boolean {
    const loLower = learningOutcome.toLowerCase();
    const narrationLower = narration.toLowerCase();
    
    // Check for generic motivational phrases (bad)
    const genericPhrases = [
      'learned about',
      'felt confident',
      'understood the importance',
      'gained insight',
      'felt empowered'
    ];
    
    const hasGenericOnly = genericPhrases.some(phrase => 
      narrationLower.includes(phrase) && narration.length < 200
    );
    
    if (hasGenericOnly) {
      return false;
    }
    
    // Check for specific content indicators (good)
    const specificIndicators = [
      'are',
      'is a',
      'includes',
      'consists of',
      'can be identified by',
      'technique involves',
      'method requires'
    ];
    
    const hasSpecific = specificIndicators.some(indicator => narrationLower.includes(indicator));
    
    // Check if LO mentions specific items and narration includes them
    if (loLower.includes('identify') || loLower.includes('list')) {
      // Extract what needs to be identified
      const match = learningOutcome.match(/identify (?:the )?(?:four|4|five|5|three|3|two|2) (\w+)/i);
      if (match) {
        const itemType = match[1];
        // Check if narration mentions the item type and lists items
        return narrationLower.includes(itemType.toLowerCase()) && 
               (narration.match(/:/g) || []).length >= 2; // Has multiple definitions
      }
    }
    
    return hasSpecific;
  }
  
  /**
   * Force instructional content into narration if it's too generic
   */
  private forceInstructionalContent(
    narration: string,
    learningOutcome: string,
    extractedContent?: any,
    extractedInstructionalContent?: {
      keyConcepts: string[];
      concreteExamples: string[];
      misconceptions: string[];
    }
  ): string {
    // Use extracted instructional content if provided, otherwise extract it
    const keyConcepts = extractedInstructionalContent?.keyConcepts || 
      (extractedContent ? this.extractConceptsFromMaterial(extractedContent, learningOutcome) : 
        this.extractKeyConcepts(learningOutcome));
    
    const examples = extractedInstructionalContent?.concreteExamples || [];
    const misconceptions = extractedInstructionalContent?.misconceptions || [];
    
    // Build explicit instructional script with actual content
    let script = narration;
    
    if (keyConcepts.length > 0) {
      script += ` Specifically, here are the key concepts you must understand: `;
      script += keyConcepts.slice(0, 5).join('. ') + '. ';
    }
    
    if (examples.length > 0) {
      script += `For example, ${examples[0]}. `;
    }
    
    if (misconceptions.length > 0) {
      script += `Common misconception to avoid: ${misconceptions[0]}. `;
    }
    
    // Preserve character story if present, but add instructional content
    if (narration.length > 50) {
      // Extract character name if present
      const nameMatch = narration.match(/\b([A-Z][a-z]+)\b/);
      if (nameMatch) {
        const characterName = nameMatch[1];
        script = `${characterName} discovered that ${script.toLowerCase()}`;
      }
    }
    
    return script;
  }
  
  /**
   * Validate that scene contains actual instructional content
   */
  private validateInstructionalContent(narration: string, learningOutcome: string): boolean {
    return this.hasExplicitInstructionalContent(narration, learningOutcome);
  }
  
  private generateVisualPrompt(learningOutcome: string, topic: string): string {
    const keyWords = learningOutcome.toLowerCase().split(' ').slice(0, 4);
    
    return `Professional illustration showing ${keyWords.join(' ')} concepts, with clear visual hierarchy, workplace context, and supporting graphics that enhance understanding of ${topic}`;
  }
  
  private determineBloomLevel(learningOutcome: string): 'Remember' | 'Understand' | 'Apply' | 'Analyze' | 'Evaluate' | 'Create' {
    const outcome = learningOutcome.toLowerCase();
    
    if (outcome.includes('identify') || outcome.includes('recognize') || outcome.includes('list')) {
      return 'Remember';
    }
    if (outcome.includes('understand') || outcome.includes('explain') || outcome.includes('describe')) {
      return 'Understand';
    }
    if (outcome.includes('apply') || outcome.includes('use') || outcome.includes('implement')) {
      return 'Apply';
    }
    if (outcome.includes('analyze') || outcome.includes('examine') || outcome.includes('compare')) {
      return 'Analyze';
    }
    if (outcome.includes('evaluate') || outcome.includes('assess') || outcome.includes('judge')) {
      return 'Evaluate';
    }
    if (outcome.includes('create') || outcome.includes('design') || outcome.includes('develop')) {
      return 'Create';
    }
    
    return 'Understand'; // Default
  }
}
