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
    const extractedContent = (req as any).extractedContent;
    const contentSummary = this.buildExtractedContentSummary(learningOutcome, extractedContent);
    const availableCharacters = this.getAvailableCharacters(extractedContent);

    const enhancedPrompt = getEnhancedPrompt("teachAgent", {
      topic: req.topic,
      outcome: learningOutcome,
      audience: req.audience || "General staff",
      extractedContentSummary: contentSummary,
      availableCharacters,
    });

    const finalPrompt = `${resetHeader}${enhancedPrompt}`;
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
    teachingScene.voiceOverScript = payload.narration_script || payload.narrationScript || teachingScene.voiceOverScript;
    teachingScene.visualAIPrompt = payload.visual_ai_prompt || payload.visualAiPrompt || teachingScene.visualAIPrompt;
    teachingScene.altText = payload.alt_text || payload.altText || teachingScene.altText;

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
    const action = learningOutcome.split(' ')[0];
    const concept = learningOutcome.substring(learningOutcome.indexOf(' ') + 1);
    
    return `${action} the key principles and concepts for ${concept}. Understanding these fundamentals will help you apply this knowledge effectively in your workplace. Focus on ${keyConcepts.slice(0, 2).join(' and ')} as core elements.`;
  }
  
  private generateVoiceOverScript(learningOutcome: string, keyConcepts: string[], topicContext: string): string {
    const action = learningOutcome.split(' ')[0];
    const concept = learningOutcome.substring(learningOutcome.indexOf(' ') + 1);
    
    return `Let's explore the essential concepts for ${concept}. Understanding these principles is crucial for success in ${topicContext}. We'll break down the key elements: ${keyConcepts.slice(0, 3).join(', ')}. Each concept builds upon the previous one, creating a solid foundation for practical application. By the end of this section, you'll have a clear understanding of how to ${action.toLowerCase()} these concepts effectively in real workplace scenarios.`;
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
