// backend/src/examples/templateEnforcementExample.ts
import { TemplateDictator } from '../agents/TemplateDictator';
import { ValidationEnforcer } from '../validators/ValidationEnforcer';
import { TeachingSceneSchema } from '../schemas/teachingSceneSchema';
import { BloomLevel } from '../types/storyboardTypes';

/**
 * Example integration of TemplateDictator and ValidationEnforcer
 * Shows how to use the template enforcement system in practice
 */
export class TemplateEnforcementExample {
  private templateDictator: TemplateDictator;
  private validationEnforcer: ValidationEnforcer;

  constructor() {
    this.templateDictator = new TemplateDictator();
    this.validationEnforcer = new ValidationEnforcer();
  }

  /**
   * Example: Generate and validate a teaching scene
   */
  async generateValidatedTeachingScene(
    topic: string,
    learningObjective: string,
    bloomLevel: BloomLevel
  ): Promise<void> {
    console.log('\n🎯 TEMPLATE ENFORCEMENT EXAMPLE');
    console.log('=====================================');

    // Step 1: Generate template-enforced prompt
    console.log('\n📝 Step 1: Generating template-enforced prompt...');
    const prompt = this.templateDictator.generateTeachingPrompt(
      topic,
      learningObjective,
      bloomLevel
    );

    // Step 2: Simulate AI generation (in real implementation, this would call OpenAI)
    console.log('\n🤖 Step 2: Simulating AI generation...');
    const mockAIContent = this.generateMockAIContent(topic, learningObjective);

    // Step 3: Validate the generated content
    console.log('\n🛡️ Step 3: Validating generated content...');
    const validationResult = await this.validationEnforcer.validateAndRetry(
      mockAIContent,
      TeachingSceneSchema,
      3
    );

    // Step 4: Display results
    console.log('\n📊 VALIDATION RESULTS');
    console.log('=====================');
    console.log(`✅ Valid: ${validationResult.isValid}`);
    console.log(`🔄 Attempts: ${validationResult.attempts}`);
    console.log(`🔐 Checksum: ${validationResult.checksum}`);
    console.log(`⏰ Timestamp: ${validationResult.timestamp}`);

    if (!validationResult.isValid) {
      console.log('\n❌ VALIDATION FAILED');
      console.log('===================');
      console.log(`📋 Failures: ${validationResult.failures.join(', ')}`);
      console.log(`💡 Guidance: ${validationResult.guidance}`);
    } else {
      console.log('\n✅ VALIDATION SUCCESSFUL');
      console.log('========================');
      console.log('Content passed all quality checks!');
    }

    // Step 5: Show validation statistics
    const stats = this.validationEnforcer.getValidationStats();
    console.log('\n📈 VALIDATION STATISTICS');
    console.log('========================');
    console.log(`Total validations: ${stats.total}`);
    console.log(`Successful: ${stats.success}`);
    console.log(`Failed: ${stats.failed}`);
    console.log(`Success rate: ${stats.successRate.toFixed(1)}%`);
  }

  /**
   * Generate mock AI content for testing
   */
  private generateMockAIContent(topic: string, learningObjective: string): string {
    return JSON.stringify({
      sceneNumber: 1,
      pageTitle: `Understanding ${topic} Fundamentals`,
      pageType: "Informative",
      narrationScript: `Welcome to this comprehensive lesson on ${topic}. In this module, we will explore the fundamental concepts and principles that form the foundation of ${topic}. Our learning objective is to ${learningObjective.toLowerCase()}. This knowledge is essential for building a strong understanding of the subject matter and will serve as the basis for more advanced topics we'll cover later. Throughout this lesson, we'll use clear examples and practical demonstrations to help you grasp these important concepts. By the end of this session, you'll have a solid understanding of the key principles and be able to apply them in real-world scenarios.`,
      onScreenText: `Learn ${topic} fundamentals. Key concepts and principles. Clear examples and practical applications. Build strong foundation for advanced topics.`,
      visual: {
        aiPrompt: `Professional educational illustration showing ${topic} concepts with clear diagrams, examples, and visual elements that support learning`,
        altText: `Educational diagram illustrating ${topic} fundamentals with key concepts highlighted`
      },
      timing: {
        estimatedSeconds: 120
      },
      pedagogicalPhase: "Teach",
      learningOutcome: learningObjective,
      frameworkCompliant: true
    });
  }

  /**
   * Run the complete example
   */
  async runExample(): Promise<void> {
    await this.generateValidatedTeachingScene(
      "Effective Communication",
      "Identify key principles of effective communication in professional settings",
      "Understand"
    );
  }
}

// Example usage (uncomment to run)
// const example = new TemplateEnforcementExample();
// example.runExample();


