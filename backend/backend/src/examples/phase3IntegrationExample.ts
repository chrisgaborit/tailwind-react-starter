// backend/src/examples/phase3IntegrationExample.ts
/**
 * Phase 3 Integration Example
 * 
 * Demonstrates complete interactivity pipeline:
 * 1. Scene generation
 * 2. Decision injection (Phase 2a)
 * 3. Content generation (Phase 3)
 * 
 * Shows how builders create actual interaction content ready for frontend rendering.
 */

import { EnhancedPedagogicalDirector } from '../agents_v2/enhancedPedagogicalDirector';
import { LearningRequest } from '../agents_v2/types';

export class Phase3IntegrationExample {
  private director: EnhancedPedagogicalDirector;

  constructor() {
    this.director = new EnhancedPedagogicalDirector();
  }

  /**
   * Example 1: Complete pipeline with content generation
   */
  async completeIntegrationExample(): Promise<void> {
    console.log('\n🎯 EXAMPLE 1: Complete Interactivity Pipeline');
    console.log('=============================================\n');

    const request: LearningRequest = {
      topic: 'Effective Team Leadership',
      duration: 20,
      audience: 'Team Leaders',
      sourceMaterial: 'Leadership principles and team management best practices',
      learningOutcomes: [
        'Understand key leadership principles',
        'Apply effective communication techniques',
        'Evaluate team performance and provide feedback'
      ],
      moduleType: 'intermediate'
    };

    console.log('📋 Generating storyboard with full interactivity...\n');

    const storyboard = await this.director.buildStoryboard(request);

    console.log('\n📊 STORYBOARD ANALYSIS:');
    console.log(`   Total Scenes: ${storyboard.scenes.length}`);
    
    const scenesWithDecisions = storyboard.scenes.filter(s => s.interactivityDecision);
    const scenesWithContent = storyboard.scenes.filter(s => s.interactionDetails);
    const scenesWithRealContent = storyboard.scenes.filter(
      s => s.interactionDetails && s.interactionDetails.type !== 'none'
    );

    console.log(`   With Decisions: ${scenesWithDecisions.length}`);
    console.log(`   With Content: ${scenesWithContent.length}`);
    console.log(`   With Real Interactions: ${scenesWithRealContent.length}`);

    // Show detailed examples
    console.log('\n🎨 INTERACTION CONTENT EXAMPLES:\n');
    
    scenesWithRealContent.slice(0, 3).forEach(scene => {
      console.log(`Scene ${scene.sceneNumber}: ${scene.pageTitle}`);
      console.log(`   Decision Type: ${scene.interactivityDecision?.interactivityType}`);
      console.log(`   Decision Score: ${scene.interactivityDecision?.score?.toFixed(2)}`);
      
      if (scene.interactionDetails) {
        console.log(`   Content Type: ${scene.interactionDetails.type}`);
        console.log(`   Content Title: ${scene.interactionDetails.title}`);
        console.log(`   Steps: ${scene.interactionDetails.interactionSteps.length}`);
        console.log(`   Accessibility: ${scene.interactionDetails.accessibilityNotes?.substring(0, 60)}...`);
        
        if (scene.interactionDetails.templateData) {
          const dataKeys = Object.keys(scene.interactionDetails.templateData);
          console.log(`   Template Data Keys: ${dataKeys.join(', ')}`);
        }
      }
      console.log('');
    });
  }

  /**
   * Example 2: Analyze interaction types distribution
   */
  async interactionTypesAnalysis(): Promise<void> {
    console.log('\n\n🎯 EXAMPLE 2: Interaction Types Distribution');
    console.log('=============================================\n');

    const request: LearningRequest = {
      topic: 'Data Analysis Fundamentals',
      duration: 25,
      audience: 'Analysts',
      sourceMaterial: 'Core data analysis concepts and methods',
      learningOutcomes: [
        'Remember basic statistical concepts',
        'Understand data visualization principles',
        'Apply data cleaning techniques',
        'Analyze trends and patterns'
      ],
      moduleType: 'advanced'
    };

    const storyboard = await this.director.buildStoryboard(request);

    // Collect interaction types
    const interactions: Record<string, number> = {};
    
    storyboard.scenes.forEach(scene => {
      if (scene.interactionDetails && scene.interactionDetails.type !== 'none') {
        const type = scene.interactionDetails.type;
        interactions[type] = (interactions[type] || 0) + 1;
      }
    });

    console.log('📊 INTERACTION DISTRIBUTION:\n');
    Object.entries(interactions).forEach(([type, count]) => {
      const percentage = ((count / storyboard.scenes.length) * 100).toFixed(1);
      console.log(`   ${type}: ${count} scenes (${percentage}%)`);
    });
  }

  /**
   * Example 3: Content quality verification
   */
  async contentQualityVerification(): Promise<void> {
    console.log('\n\n🎯 EXAMPLE 3: Content Quality Verification');
    console.log('===========================================\n');

    const request: LearningRequest = {
      topic: 'Conflict Resolution Skills',
      duration: 15,
      audience: 'Managers',
      sourceMaterial: 'Techniques for resolving workplace conflicts',
      learningOutcomes: [
        'Identify sources of conflict',
        'Apply mediation techniques'
      ],
      moduleType: 'intermediate'
    };

    const storyboard = await this.director.buildStoryboard(request);

    console.log('✅ QUALITY CHECKS:\n');

    let passCount = 0;
    let totalChecks = 0;

    storyboard.scenes.forEach(scene => {
      if (!scene.interactionDetails || scene.interactionDetails.type === 'none') {
        return; // Skip non-interactive scenes
      }

      const details = scene.interactionDetails;
      const checks = [
        { name: 'Has Title', pass: !!details.title },
        { name: 'Has Steps', pass: details.interactionSteps && details.interactionSteps.length > 0 },
        { name: 'Has Accessibility', pass: !!details.accessibilityNotes },
        { name: 'Has Template Data', pass: !!details.templateData }
      ];

      console.log(`Scene ${scene.sceneNumber}: ${scene.pageTitle}`);
      checks.forEach(check => {
        console.log(`   ${check.pass ? '✅' : '❌'} ${check.name}`);
        totalChecks++;
        if (check.pass) passCount++;
      });
      console.log('');
    });

    const qualityScore = ((passCount / totalChecks) * 100).toFixed(1);
    console.log(`📈 OVERALL QUALITY SCORE: ${qualityScore}%`);
    console.log(`   Passed: ${passCount}/${totalChecks} checks`);
  }

  /**
   * Example 4: Template data structure analysis
   */
  async templateDataAnalysis(): Promise<void> {
    console.log('\n\n🎯 EXAMPLE 4: Template Data Structure Analysis');
    console.log('===============================================\n');

    const request: LearningRequest = {
      topic: 'Communication Essentials',
      duration: 15,
      audience: 'All Staff',
      sourceMaterial: 'Basic communication principles',
      learningOutcomes: [
        'Understand active listening',
        'Apply clear communication techniques'
      ],
      moduleType: 'basic'
    };

    const storyboard = await this.director.buildStoryboard(request);

    console.log('📦 TEMPLATE DATA STRUCTURES:\n');

    storyboard.scenes.forEach(scene => {
      if (!scene.interactionDetails || !scene.interactionDetails.templateData) {
        return;
      }

      console.log(`Scene ${scene.sceneNumber}: ${scene.interactionDetails.type}`);
      console.log('   Template Data:');
      
      const data = scene.interactionDetails.templateData;
      Object.entries(data).forEach(([key, value]) => {
        const type = Array.isArray(value) ? `Array(${value.length})` : typeof value;
        console.log(`      ${key}: ${type}`);
        
        // Show sample for arrays
        if (Array.isArray(value) && value.length > 0) {
          const sample = value[0];
          if (typeof sample === 'object' && sample !== null) {
            const sampleKeys = Object.keys(sample);
            console.log(`         Sample keys: ${sampleKeys.join(', ')}`);
          }
        }
      });
      console.log('');
    });
  }

  /**
   * Run all examples
   */
  async runAllExamples(): Promise<void> {
    console.log('\n═══════════════════════════════════════════════');
    console.log('🎨 PHASE 3 INTEGRATION - COMPLETE EXAMPLES');
    console.log('═══════════════════════════════════════════════');

    try {
      await this.completeIntegrationExample();
      await this.interactionTypesAnalysis();
      await this.contentQualityVerification();
      await this.templateDataAnalysis();

      console.log('\n═══════════════════════════════════════════════');
      console.log('✅ ALL PHASE 3 EXAMPLES COMPLETE');
      console.log('═══════════════════════════════════════════════\n');
    } catch (error) {
      console.error('\n❌ ERROR IN EXAMPLES:', error);
    }
  }
}

// Uncomment to run examples:
// const example = new Phase3IntegrationExample();
// example.runAllExamples();


