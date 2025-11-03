// backend/src/agents/TemplateDictator.ts
import crypto from 'crypto';
import { BloomLevel } from '../types/storyboardTypes';

/**
 * TemplateDictator - The "Prompt Architect"
 * 
 * Generates bulletproof teaching scene prompts that force AI into exact structure.
 * Centralized template enforcement for consistent, high-quality scene generation.
 * 
 * Integration: Called by EnhancedPedagogicalDirector before agent calls
 */
export class TemplateDictator {
  private readonly templateVersion = '1.0.0';
  
  constructor() {
    console.log('🎯 TemplateDictator initialized - Template enforcement system active');
  }

  /**
   * Generate a template-enforced teaching scene prompt
   * 
   * @param topic - The learning topic/subject
   * @param learningObjective - Specific learning objective to achieve
   * @param bloomLevel - Bloom's taxonomy level for the objective
   * @returns Formatted prompt string with checksum and timestamp
   */
  generateTeachingPrompt(
    topic: string, 
    learningObjective: string, 
    bloomLevel: BloomLevel
  ): string {
    const timestamp = new Date().toISOString();
    
    // Generate the template-enforced prompt
    const prompt = this.buildTeachingTemplate(topic, learningObjective, bloomLevel);
    
    // Generate checksum for tracking
    const checksum = this.generateChecksum(prompt);
    
    // Log prompt generation for audit trail
    console.log(`🎯 TemplateDictator: Generated teaching prompt`);
    console.log(`   📊 Topic: ${topic}`);
    console.log(`   🎯 Objective: ${learningObjective.substring(0, 50)}...`);
    console.log(`   🧠 Bloom Level: ${bloomLevel}`);
    console.log(`   🔐 Checksum: ${checksum}`);
    console.log(`   ⏰ Timestamp: ${timestamp}`);
    
    return prompt;
  }

  /**
   * Build the structured teaching template based on Bloom's level
   */
  private buildTeachingTemplate(topic: string, learningObjective: string, bloomLevel: BloomLevel): string {
    const bloomGuidance = this.getBloomGuidance(bloomLevel);
    const templateStructure = this.getTemplateStructure(bloomLevel);
    
    return `# TEACHING SCENE TEMPLATE v${this.templateVersion}

## MANDATORY STRUCTURE - DO NOT DEVIATE

**Topic:** ${topic}
**Learning Objective:** ${learningObjective}
**Bloom's Level:** ${bloomLevel}

## TEMPLATE REQUIREMENTS

### 1. SCENE STRUCTURE (REQUIRED)
${templateStructure}

### 2. CONTENT REQUIREMENTS (MANDATORY)
- **Page Title:** Must be 5-8 words, action-oriented
- **Narration Script:** 150-200 words, instructional tone
- **On-Screen Text:** 40-60 words, key points only
- **Visual AI Prompt:** Specific, detailed, learning-focused
- **Alt Text:** Descriptive, accessible

### 3. LEARNING ALIGNMENT (CRITICAL)
${bloomGuidance}

### 4. REJECTION CRITERIA (AUTO-REJECT IF MISSING)
- Missing any required section
- Narration under 150 words
- On-screen text over 70 words
- Generic visual prompts
- No clear learning progression
- Misaligned with Bloom's level

## OUTPUT FORMAT (EXACT JSON STRUCTURE REQUIRED)
\`\`\`json
{
  "sceneNumber": 1,
  "pageTitle": "[5-8 word action title]",
  "pageType": "Informative",
  "narrationScript": "[150-200 word instructional script]",
  "onScreenText": "[40-60 word key points]",
  "visual": {
    "aiPrompt": "[Specific, detailed visual description]",
    "altText": "[Descriptive alt text for accessibility]"
  },
  "timing": {
    "estimatedSeconds": 120
  },
  "pedagogicalPhase": "Teach",
  "learningOutcome": "${learningObjective}",
  "frameworkCompliant": true
}
\`\`\`

## VALIDATION CHECKLIST
Before submitting, verify:
✅ All required fields present
✅ Narration 150-200 words
✅ On-screen text 40-60 words  
✅ Visual prompt specific and detailed
✅ Clear learning progression
✅ Aligned with ${bloomLevel} level
✅ Professional, instructional tone

**FAILURE TO FOLLOW THIS TEMPLATE EXACTLY WILL RESULT IN AUTOMATIC REJECTION AND REGENERATION.**`;
  }

  /**
   * Get Bloom's taxonomy guidance for specific level
   */
  private getBloomGuidance(bloomLevel: BloomLevel): string {
    const guidanceMap: Record<BloomLevel, string> = {
      'Remember': 'Focus on facts, definitions, and recall. Use clear explanations and repetition.',
      'Understand': 'Explain concepts, compare/contrast, and show relationships. Use examples and analogies.',
      'Apply': 'Demonstrate practical use, show procedures, and provide guided practice.',
      'Analyze': 'Break down complex concepts, identify patterns, and show cause-effect relationships.',
      'Evaluate': 'Present criteria for judgment, show different perspectives, and guide critical thinking.',
      'Create': 'Encourage synthesis, design thinking, and original application of concepts.'
    };
    
    return guidanceMap[bloomLevel] || 'Focus on clear, structured learning progression.';
  }

  /**
   * Get template structure based on Bloom's level
   */
  private getTemplateStructure(bloomLevel: BloomLevel): string {
    const structureMap: Record<BloomLevel, string> = {
      'Remember': `1. **Definition Section** - Clear explanation of key terms
2. **Key Facts Section** - Important information to remember
3. **Examples Section** - Concrete examples for understanding
4. **Summary Section** - Key points reinforcement`,

      'Understand': `1. **Concept Introduction** - What and why
2. **Explanation Section** - How it works
3. **Examples & Non-Examples** - Clear illustrations
4. **Connection Section** - How it relates to other concepts`,

      'Apply': `1. **Procedure Overview** - Step-by-step process
2. **Demonstration Section** - Show how to do it
3. **Guided Practice** - Walk through example
4. **Application Tips** - Best practices and common mistakes`,

      'Analyze': `1. **Complex Concept Breakdown** - Deconstruct the topic
2. **Pattern Recognition** - Identify key patterns
3. **Cause-Effect Analysis** - Show relationships
4. **Critical Thinking Section** - Guide analysis process`,

      'Evaluate': `1. **Criteria Introduction** - What to evaluate
2. **Perspective Analysis** - Different viewpoints
3. **Judgment Framework** - How to make decisions
4. **Decision Support** - Tools for evaluation`,

      'Create': `1. **Design Principles** - Foundation for creation
2. **Synthesis Process** - How to combine elements
3. **Creative Application** - Original use cases
4. **Implementation Guide** - Bringing ideas to life`
    };
    
    return structureMap[bloomLevel] || 'Follow standard teaching structure with clear learning progression.';
  }

  /**
   * Generate checksum for prompt tracking
   */
  private generateChecksum(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
  }

  /**
   * Get current template version
   */
  getTemplateVersion(): string {
    return this.templateVersion;
  }
}


