// backend/src/examples/phase2aIntegrationExample.ts
/**
 * Phase 2a Integration Example
 * 
 * Demonstrates how InteractivitySequencer is integrated into the storyboard generation pipeline.
 * This example shows:
 * 1. Metadata construction from scene properties
 * 2. InteractivitySequencer decision making
 * 3. Decision injection into scene objects
 * 4. Novelty tracking across scenes
 * 5. Logging and auditability
 * 
 * NO TEMPLATE BUILDING YET - Phase 2a is metadata injection only
 */

import { EnhancedPedagogicalDirector } from '../agents_v2/enhancedPedagogicalDirector';
import { LearningRequest } from '../agents_v2/types';

export class Phase2aIntegrationExample {
  private director: EnhancedPedagogicalDirector;

  constructor() {
    this.director = new EnhancedPedagogicalDirector();
  }

  /**
   * Example 1: Basic storyboard generation with interactivity decisions
   */
  async basicIntegrationExample(): Promise<void> {
    console.log('\n🎯 EXAMPLE 1: Basic Integration');
    console.log('================================\n');

    const request: LearningRequest = {
      topic: 'Effective Communication Skills',
      duration: 15,
      audience: 'Managers',
      sourceMaterial: 'Basic principles of effective communication in professional settings',
      learningOutcomes: [
        'Identify key principles of active listening',
        'Apply effective communication techniques in conversations'
      ],
      moduleType: 'intermediate' // Maps to module level 2
    };

    console.log('📋 Request:');
    console.log(`   Topic: ${request.topic}`);
    console.log(`   Duration: ${request.duration} minutes`);
    console.log(`   Module Type: ${request.moduleType}`);
    console.log(`   Learning Outcomes: ${request.learningOutcomes?.length}\n`);

    // Generate storyboard with interactivity decisions
    const storyboard = await this.director.buildStoryboard(request);

    console.log('\n📊 RESULTS:');
    console.log(`   Total Scenes: ${storyboard.scenes.length}`);
    console.log(`   Scenes with Decisions: ${storyboard.scenes.filter(s => s.interactivityDecision).length}\n`);

    // Display interactivity decisions
    console.log('🎮 INTERACTIVITY DECISIONS:\n');
    storyboard.scenes.forEach((scene, index) => {
      const decision = scene.interactivityDecision;
      if (decision) {
        console.log(`   Scene ${scene.sceneNumber}: ${scene.pageTitle}`);
        console.log(`      Type: ${decision.interactivityType}`);
        console.log(`      Score: ${decision.score?.toFixed(2)}`);
        console.log(`      Template: ${decision.suggestedTemplate}`);
        console.log(`      Justification: ${decision.justification}`);
        console.log(`      Checksum: ${decision.checksum}\n`);
      }
    });

    // Analyze decision diversity
    const interactivityTypes = storyboard.scenes
      .map(s => s.interactivityDecision?.interactivityType)
      .filter(type => type && type !== 'none' && type !== 'None');

    const uniqueTypes = new Set(interactivityTypes);

    console.log('\n📈 DECISION ANALYTICS:');
    console.log(`   Total Decisions: ${interactivityTypes.length}`);
    console.log(`   Unique Types: ${uniqueTypes.size}`);
    console.log(`   Types Used: ${Array.from(uniqueTypes).join(', ')}`);

    // Count by type
    const typeCounts: Record<string, number> = {};
    interactivityTypes.forEach(type => {
      if (type) {
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      }
    });

    console.log('\n   Distribution:');
    Object.entries(typeCounts).forEach(([type, count]) => {
      console.log(`      ${type}: ${count} scenes`);
    });
  }

  /**
   * Example 2: Show metadata construction details
   */
  async metadataConstructionExample(): Promise<void> {
    console.log('\n\n🎯 EXAMPLE 2: Metadata Construction');
    console.log('====================================\n');

    const request: LearningRequest = {
      topic: 'Data Analysis Fundamentals',
      duration: 20,
      audience: 'Analysts',
      sourceMaterial: 'Introduction to data analysis methodologies and tools',
      learningOutcomes: [
        'Understand basic statistical concepts',
        'Apply data visualization techniques'
      ],
      moduleType: 'advanced' // Maps to module level 3
    };

    const storyboard = await this.director.buildStoryboard(request);

    console.log('📋 METADATA EXAMPLES:\n');

    // Show metadata for first few scenes
    storyboard.scenes.slice(0, 5).forEach(scene => {
      console.log(`Scene ${scene.sceneNumber}: ${scene.pageTitle}`);
      console.log(`   Pedagogical Phase: ${scene.pedagogicalPhase}`);
      console.log(`   Learning Outcome: ${scene.learningOutcome?.substring(0, 50) || 'N/A'}...`);
      
      if (scene.interactivityDecision) {
        console.log(`   Decision Metadata:`);
        console.log(`      Type: ${scene.interactivityDecision.interactivityType}`);
        console.log(`      Score: ${scene.interactivityDecision.score?.toFixed(2)}`);
        console.log(`      Timestamp: ${scene.interactivityDecision.timestamp}`);
      }
      console.log('');
    });
  }

  /**
   * Example 3: Demonstrate novelty tracking
   */
  async noveltyTrackingExample(): Promise<void> {
    console.log('\n\n🎯 EXAMPLE 3: Novelty Tracking');
    console.log('================================\n');

    const request: LearningRequest = {
      topic: 'Project Management Essentials',
      duration: 25,
      audience: 'Team Leads',
      sourceMaterial: 'Core project management principles and practices',
      learningOutcomes: [
        'Understand project planning fundamentals',
        'Apply risk management strategies',
        'Evaluate project success metrics'
      ],
      moduleType: 'moderate' // Maps to module level 3
    };

    const storyboard = await this.director.buildStoryboard(request);

    console.log('🔄 NOVELTY ANALYSIS:\n');

    // Track sequence of interactivity types
    const sequence = storyboard.scenes
      .map(s => ({
        scene: s.sceneNumber,
        type: s.interactivityDecision?.interactivityType || 'none'
      }))
      .filter(item => item.type !== 'none' && item.type !== 'None');

    console.log('Interactivity Sequence:');
    sequence.forEach(item => {
      console.log(`   Scene ${item.scene}: ${item.type}`);
    });

    // Check for repetition
    console.log('\n🔍 REPETITION ANALYSIS:');
    for (let i = 0; i < sequence.length; i++) {
      const current = sequence[i];
      const recent = sequence.slice(Math.max(0, i - 3), i);
      const repeated = recent.some(prev => prev.type === current.type);
      
      if (repeated) {
        console.log(`   ⚠️  Scene ${current.scene} (${current.type}) - Type used recently`);
      } else {
        console.log(`   ✅ Scene ${current.scene} (${current.type}) - Novel choice`);
      }
    }
  }

  /**
   * Run all examples
   */
  async runAllExamples(): Promise<void> {
    console.log('\n═══════════════════════════════════════════════');
    console.log('🎮 PHASE 2a INTEGRATION - COMPLETE EXAMPLES');
    console.log('═══════════════════════════════════════════════');

    try {
      await this.basicIntegrationExample();
      await this.metadataConstructionExample();
      await this.noveltyTrackingExample();

      console.log('\n═══════════════════════════════════════════════');
      console.log('✅ ALL PHASE 2a EXAMPLES COMPLETE');
      console.log('═══════════════════════════════════════════════\n');
    } catch (error) {
      console.error('\n❌ ERROR IN EXAMPLES:', error);
    }
  }
}

// Uncomment to run examples:
// const example = new Phase2aIntegrationExample();
// example.runAllExamples();


