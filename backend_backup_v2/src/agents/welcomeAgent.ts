/**
 * ==================================================================
 * WELCOME AGENT - GENERATES WELCOME + LEARNING OUTCOMES PAGES
 * ==================================================================
 * 
 * This agent generates the first two pages of every storyboard:
 * 1. Welcome Page - Professional welcome with navigation instructions
 * 2. Learning Outcomes Page - SMART learning objectives display
 * 
 * Features:
 * - SMART Learning Outcomes strategy with intelligent fallbacks
 * - Extracts outcomes from source material when available
 * - Generates default outcomes based on topic type
 * - TypeScript strict mode compliant
 * ==================================================================
 */

import { generateStoryboardFromOpenAI } from "../services/openaiService";
import type { StoryboardScene } from "../types";

// Define LearningRequest interface based on the existing structure
interface LearningRequest {
  topic: string;
  duration: number;
  audience?: string;
  sourceMaterial?: string;
  learningOutcomes?: string[];
  learningObjectives?: string;
  moduleName?: string;
  moduleType?: string;
  complexityLevel?: string;
  tone?: string;
  targetAudience?: string;
  [key: string]: any;
}

export class WelcomeAgent {
  /**
   * Generate the first two pages of every storyboard
   */
  async generateWelcomePages(learningRequest: LearningRequest): Promise<StoryboardScene[]> {
    console.log('👋 Welcome Agent generating pages 1-2');
    
    const learningOutcomes = await this.extractLearningOutcomes(learningRequest);
    
    const prompt = `
    You are an expert instructional designer. Always output valid JSON.
    
    GENERATE PAGES 1-2 FOR CORPORATE ELEARNING:

    TOPIC: ${learningRequest.topic}
    DURATION: ${learningRequest.duration} minutes
    AUDIENCE: ${learningRequest.audience || learningRequest.targetAudience || 'Corporate employees'}
    LEARNING OUTCOMES: ${learningOutcomes.join('\\n')}

    PAGE 1 - WELCOME:
    - Professional welcome message with course duration
    - Navigation instructions (arrows, play/pause/replay) 
    - Headphone requirement for audio
    - Corporate tone, friendly but professional
    - VISUAL: Use standard "AI Visual Generation Brief" format

    PAGE 2 - LEARNING OUTCOMES:
    - Display 3-5 learning outcomes as bullet points
    - Action-oriented, measurable language
    - Clear, scannable format
    - VISUAL: Use standard "AI Visual Generation Brief" format

    Return exactly 2 scenes as JSON array with: title, content, visual_description, voiceover_script, duration
    `;

    try {
      const response = await this.callOpenAI(prompt);
      const scenes = JSON.parse(response);
      return this.validateWelcomeStructure(scenes);
    } catch (error) {
      console.error('❌ Welcome Agent failed:', error);
      return this.generateFallbackPages(learningRequest, learningOutcomes);
    }
  }

  /**
   * Extract learning outcomes using intelligent fallback strategy
   */
  private async extractLearningOutcomes(learningRequest: LearningRequest): Promise<string[]> {
    // PRIORITY 1: User provided outcomes
    if (learningRequest.learningOutcomes && learningRequest.learningOutcomes.length > 0) {
      console.log('✅ Using user-provided learning outcomes');
      return learningRequest.learningOutcomes;
    }

    // PRIORITY 2: Extract from learning objectives text
    if (learningRequest.learningObjectives && learningRequest.learningObjectives.trim()) {
      console.log('🔍 Extracting learning outcomes from learning objectives');
      const extractedOutcomes = this.parseLearningObjectives(learningRequest.learningObjectives);
      if (extractedOutcomes.length >= 3) {
        console.log(`✅ Extracted ${extractedOutcomes.length} learning outcomes from objectives`);
        return extractedOutcomes;
      }
    }

    // PRIORITY 3: Extract from source material
    if (learningRequest.sourceMaterial && learningRequest.sourceMaterial.trim()) {
      console.log('🔍 Extracting learning outcomes from source material');
      const extractedOutcomes = await this.extractFromSourceMaterial(learningRequest.sourceMaterial);
      
      if (extractedOutcomes.length >= 3) {
        console.log(`✅ Extracted ${extractedOutcomes.length} learning outcomes from source`);
        return extractedOutcomes;
      }
    }

    // PRIORITY 4: Generate default outcomes
    console.log('🎯 Generating default learning outcomes');
    return this.generateDefaultOutcomes(learningRequest.topic);
  }

  /**
   * Parse learning objectives text into structured outcomes
   */
  private parseLearningObjectives(objectivesText: string): string[] {
    const lines = objectivesText.split(/[\n\r]+/).map(line => line.trim()).filter(line => line.length > 0);
    const outcomes: string[] = [];
    
    for (const line of lines) {
      // Look for bullet points, numbered lists, or paragraph breaks
      if (line.match(/^[•\-\*]\s+/) || line.match(/^\d+\.\s+/) || line.length > 20) {
        const cleanLine = line.replace(/^[•\-\*\d+\.]\s+/, '').trim();
        if (cleanLine.length > 10) {
          outcomes.push(cleanLine);
        }
      }
    }
    
    return outcomes.slice(0, 5); // Limit to 5 outcomes
  }

  /**
   * Extract learning outcomes from source material using AI
   */
  private async extractFromSourceMaterial(sourceMaterial: string): Promise<string[]> {
    const prompt = `
    Extract 3-5 learning objectives from this source material:
    ${sourceMaterial.substring(0, 3000)}
    
    Return as JSON array of strings. Focus on actionable, measurable outcomes.
    Each outcome should be:
    - Specific and measurable
    - Action-oriented (use verbs like "identify", "apply", "demonstrate")
    - Relevant to the content
    - Clear and concise
    
    Example format: ["Identify key safety requirements", "Apply safety procedures in daily work", "Demonstrate understanding of safety protocols"]
    `;

    try {
      const response = await this.callOpenAI(prompt);
      const parsed = JSON.parse(response);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Failed to extract learning outcomes:', error);
      return [];
    }
  }

  /**
   * Generate default learning outcomes based on topic type
   */
  private generateDefaultOutcomes(topic: string): string[] {
    const defaultTemplates: { [key: string]: string[] } = {
      'compliance': [
        `Identify key ${topic} requirements and regulations`,
        `Apply ${topic} principles in daily work activities`,
        `Demonstrate understanding of ${topic} policies and procedures`,
        `Recognize and report ${topic} violations appropriately`
      ],
      'soft skills': [
        `Apply effective ${topic} techniques in workplace situations`,
        `Demonstrate improved ${topic} in team interactions`, 
        `Identify opportunities to use ${topic} for better outcomes`,
        `Develop a personal action plan for ${topic} improvement`
      ],
      'technical': [
        `Understand core ${topic} concepts and principles`,
        `Apply ${topic} skills to solve practical problems`,
        `Demonstrate proficiency in key ${topic} techniques`,
        `Troubleshoot common ${topic} issues effectively`
      ],
      'default': [
        `Understand key concepts and principles of ${topic}`,
        `Apply ${topic} knowledge in practical situations`,
        `Demonstrate proficiency in ${topic} techniques`,
        `Develop skills to improve ${topic} effectiveness`
      ]
    };

    const topicLower = topic.toLowerCase();
    if (topicLower.includes('compliance') || topicLower.includes('safety') || topicLower.includes('policy')) {
      return defaultTemplates.compliance;
    }
    if (topicLower.includes('communication') || topicLower.includes('leadership') || topicLower.includes('teamwork')) {
      return defaultTemplates['soft skills'];
    }
    if (topicLower.includes('software') || topicLower.includes('technical') || topicLower.includes('system')) {
      return defaultTemplates.technical;
    }
    
    return defaultTemplates.default;
  }

  /**
   * Call OpenAI service for content generation
   */
  private async callOpenAI(prompt: string): Promise<string> {
    // Create a minimal formData object for the OpenAI service
    const formData = {
      topic: 'Welcome Pages Generation',
      learningObjectives: prompt,
      duration: 5,
      moduleName: 'Welcome Agent',
      moduleType: 'Professional Skills',
      complexityLevel: 'Level 1: Passive',
      tone: 'Professional & Clear',
      targetAudience: 'Corporate employees'
    };

    try {
      // Use the existing OpenAI service to generate content
      const result = await generateStoryboardFromOpenAI(formData, { 
        ragContext: '',
        aiModel: 'gpt-4o-mini' // Use cheaper model for simple content
      });
      
      // Extract the generated content from the response
      if (result && result.scenes && result.scenes.length > 0) {
        return JSON.stringify(result.scenes.slice(0, 2)); // Get first 2 scenes
      }
      
      throw new Error('No scenes generated');
    } catch (error) {
      console.error('OpenAI service call failed:', error);
      throw error;
    }
  }

  /**
   * Generate fallback pages when AI generation fails
   */
  private generateFallbackPages(learningRequest: LearningRequest, learningOutcomes: string[]): StoryboardScene[] {
    console.log('🔄 Generating fallback welcome pages');
    
    return [
      {
        sceneNumber: 1,
        pageTitle: 'Welcome',
        title: 'Welcome',
        sceneTitle: 'Welcome',
        content: `Welcome to this ${learningRequest.duration}-minute learning module on ${learningRequest.topic}. 

In this course, you will learn essential concepts and practical skills that you can apply in your daily work.

Navigation Instructions:
• Use the arrow buttons to move forward and backward
• Click play/pause to control audio narration
• Use the replay button to review any section
• Ensure you have headphones for the best audio experience

Let's begin your learning journey!`,
        visual_description: 'Professional welcome screen with course title, duration, and navigation instructions. Clean, corporate design with friendly but professional tone.',
        voiceover_script: `Welcome to this ${learningRequest.duration}-minute learning module on ${learningRequest.topic}. You'll learn essential concepts and practical skills for your daily work. Use the navigation controls to move through the content at your own pace.`,
        onScreenText: `Welcome to ${learningRequest.topic}`,
        narrationScript: `Welcome to this ${learningRequest.duration}-minute learning module on ${learningRequest.topic}. You'll learn essential concepts and practical skills for your daily work.`,
        metadata: {
          generated_by: 'welcome_agent',
          scene_number: 1,
          template_type: 'welcome'
        }
      },
      {
        sceneNumber: 2,
        pageTitle: 'Learning Outcomes',
        title: 'Learning Outcomes',
        sceneTitle: 'Learning Outcomes',
        content: `By the end of this module, you will be able to:

${learningOutcomes.map(outcome => `• ${outcome}`).join('\n')}

These learning outcomes will help you develop the knowledge and skills needed to succeed in your role. Each section of this module is designed to build your understanding progressively.`,
        visual_description: 'Clean, scannable list of learning outcomes with bullet points. Professional design with clear typography and good visual hierarchy.',
        voiceover_script: `By the end of this module, you will be able to: ${learningOutcomes.join('. ')}. These outcomes will help you develop the knowledge and skills needed to succeed in your role.`,
        onScreenText: 'Learning Outcomes',
        narrationScript: `By the end of this module, you will be able to: ${learningOutcomes.join('. ')}.`,
        metadata: {
          generated_by: 'welcome_agent',
          scene_number: 2,
          template_type: 'learning_outcomes'
        }
      }
    ];
  }

  /**
   * Validate and structure the generated scenes
   */
  private validateWelcomeStructure(scenes: any): StoryboardScene[] {
    if (!Array.isArray(scenes)) {
      throw new Error("Invalid scene structure: expected array");
    }
    
    return scenes.map((scene: any, index: number) => ({
      sceneNumber: index + 1,
      pageTitle: scene.title || scene.pageTitle || `Page ${index + 1}`,
      title: scene.title || `Page ${index + 1}`,
      sceneTitle: scene.title || scene.sceneTitle || `Page ${index + 1}`,
      content: scene.content?.trim() || "",
      visual_description: scene.visual_description?.trim() || scene.visualDescription?.trim() || "",
      voiceover_script: scene.voiceover_script?.trim() || scene.narrationScript?.trim() || "",
      onScreenText: scene.onScreenText?.trim() || scene.title || `Page ${index + 1}`,
      narrationScript: scene.voiceover_script?.trim() || scene.narrationScript?.trim() || "",
      pedagogical_purpose: scene.pedagogical_purpose || (index === 0 ? 'welcome' : 'outcomes'),
      metadata: {
        ...scene.metadata,
        generated_by: 'welcome_agent',
        scene_number: index + 1,
        template_type: index === 0 ? 'welcome' : 'learning_outcomes'
      }
    }));
  }
}

// Export the class for use in other modules
export default WelcomeAgent;
