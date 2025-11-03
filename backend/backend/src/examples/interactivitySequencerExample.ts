// backend/src/examples/interactivitySequencerExample.ts
import { InteractivitySequencer } from '../agents/InteractivitySequencer';
import { SceneMetadata } from '../types/storyboardTypes';

/**
 * Example usage of InteractivitySequencer
 * Demonstrates intelligent interactivity selection across a multi-scene learning path
 */
export class InteractivitySequencerExample {
  private sequencer: InteractivitySequencer;

  constructor() {
    this.sequencer = new InteractivitySequencer();
  }

  /**
   * Example 1: Basic scene interactivity selection
   */
  basicExample(): void {
    console.log('\n🎮 EXAMPLE 1: Basic Interactivity Selection');
    console.log('==========================================');

    const sceneMeta: SceneMetadata = {
      sceneNumber: 3,
      bloomLevel: 'apply',
      instructionalPurpose: 'practice',
      moduleLevel: 2,
      previousInteractivities: ['click_to_reveal', 'single_select_quiz'],
      cognitiveLoad: 'medium'
    };

    const decision = this.sequencer.selectInteractivityForScene(sceneMeta);

    console.log('\n📊 DECISION:');
    console.log(`   Type: ${decision.interactivityType}`);
    console.log(`   Template: ${decision.suggestedTemplate}`);
    console.log(`   Score: ${decision.score?.toFixed(2)}`);
    console.log(`   Justification: ${decision.justification}`);
    console.log(`   Checksum: ${decision.checksum}`);

    if (decision.alternativeOptions && decision.alternativeOptions.length > 0) {
      console.log('\n🔄 ALTERNATIVES:');
      decision.alternativeOptions.forEach((alt, i) => {
        console.log(`   ${i + 1}. ${alt.type} (score: ${alt.score.toFixed(2)}) - ${alt.reason}`);
      });
    }
  }

  /**
   * Example 2: Progressive learning path
   */
  progressiveLearningPath(): void {
    console.log('\n\n🎮 EXAMPLE 2: Progressive Learning Path');
    console.log('=========================================');

    const learningPath: SceneMetadata[] = [
      {
        sceneNumber: 1,
        bloomLevel: 'remember',
        instructionalPurpose: 'foundation',
        moduleLevel: 1,
        previousInteractivities: [],
        cognitiveLoad: 'low'
      },
      {
        sceneNumber: 2,
        bloomLevel: 'understand',
        instructionalPurpose: 'foundation',
        moduleLevel: 2,
        previousInteractivities: ['click_to_reveal'],
        cognitiveLoad: 'low'
      },
      {
        sceneNumber: 3,
        bloomLevel: 'apply',
        instructionalPurpose: 'practice',
        moduleLevel: 2,
        previousInteractivities: ['click_to_reveal', 'multi_select_quiz'],
        cognitiveLoad: 'medium'
      },
      {
        sceneNumber: 4,
        bloomLevel: 'analyze',
        instructionalPurpose: 'practice',
        moduleLevel: 3,
        previousInteractivities: ['click_to_reveal', 'multi_select_quiz', 'drag_and_drop'],
        cognitiveLoad: 'medium'
      },
      {
        sceneNumber: 5,
        bloomLevel: 'evaluate',
        instructionalPurpose: 'assessment',
        moduleLevel: 3,
        previousInteractivities: ['multi_select_quiz', 'drag_and_drop', 'scenario_simulation'],
        cognitiveLoad: 'high'
      }
    ];

    const decisions = learningPath.map(meta => {
      const decision = this.sequencer.selectInteractivityForScene(meta);
      return { scene: meta.sceneNumber, type: decision.interactivityType, score: decision.score };
    });

    console.log('\n📊 LEARNING PATH INTERACTIVITIES:');
    decisions.forEach(d => {
      console.log(`   Scene ${d.scene}: ${d.type} (score: ${d.score?.toFixed(2)})`);
    });
  }

  /**
   * Example 3: Novelty scoring demonstration
   */
  noveltyScoring(): void {
    console.log('\n\n🎮 EXAMPLE 3: Novelty Scoring');
    console.log('==============================');

    // Same scene, different previous interactivities
    const baseScene: Omit<SceneMetadata, 'previousInteractivities'> = {
      sceneNumber: 5,
      bloomLevel: 'apply',
      instructionalPurpose: 'practice',
      moduleLevel: 2,
      cognitiveLoad: 'medium'
    };

    const scenarios = [
      { name: 'No previous interactivities', previous: [] },
      { name: 'One previous', previous: ['drag_and_drop'] },
      { name: 'Recent repetition', previous: ['drag_and_drop', 'scenario_simulation', 'drag_and_drop'] },
      { name: 'Heavy repetition', previous: ['drag_and_drop', 'drag_and_drop', 'drag_and_drop'] }
    ];

    console.log('\n📊 NOVELTY IMPACT:');
    scenarios.forEach(scenario => {
      const meta: SceneMetadata = { ...baseScene, previousInteractivities: scenario.previous };
      const decision = this.sequencer.selectInteractivityForScene(meta);
      console.log(`\n   ${scenario.name}:`);
      console.log(`      Selected: ${decision.interactivityType} (score: ${decision.score?.toFixed(2)})`);
      console.log(`      Previous: [${scenario.previous.join(', ')}]`);
    });
  }

  /**
   * Example 4: Module level progression
   */
  moduleLevelProgression(): void {
    console.log('\n\n🎮 EXAMPLE 4: Module Level Progression');
    console.log('=======================================');

    const baseScene: Omit<SceneMetadata, 'moduleLevel'> = {
      sceneNumber: 3,
      bloomLevel: 'apply',
      instructionalPurpose: 'practice',
      previousInteractivities: ['click_to_reveal'],
      cognitiveLoad: 'medium'
    };

    const levels = [1, 2, 3, 4];

    console.log('\n📊 MODULE LEVEL IMPACT:');
    levels.forEach(level => {
      const meta: SceneMetadata = { ...baseScene, moduleLevel: level as any };
      const decision = this.sequencer.selectInteractivityForScene(meta);
      console.log(`\n   Level ${level}:`);
      console.log(`      Selected: ${decision.interactivityType} (score: ${decision.score?.toFixed(2)})`);
      console.log(`      Justification: ${decision.justification}`);
    });
  }

  /**
   * Example 5: Configuration inspection
   */
  inspectConfiguration(): void {
    console.log('\n\n🎮 EXAMPLE 5: Sequencer Configuration');
    console.log('======================================');

    const config = this.sequencer.getConfiguration();

    console.log('\n⚙️ WEIGHTS:');
    Object.entries(config.weights).forEach(([key, value]) => {
      console.log(`   ${key}: ${(value * 100).toFixed(0)}%`);
    });

    console.log('\n🧠 COGNITIVE LOAD THRESHOLDS:');
    Object.entries(config.loadThresholds).forEach(([level, loads]) => {
      console.log(`   Module ${level}: ${loads.join(', ')}`);
    });

    console.log(`\n🎯 NOVELTY WINDOW: ${config.noveltyWindow} scenes`);
    console.log(`📚 CATALOG SIZE: ${config.catalogSize} interactivity types`);
  }

  /**
   * Run all examples
   */
  runAllExamples(): void {
    console.log('\n═══════════════════════════════════════════════');
    console.log('🎮 INTERACTIVITY SEQUENCER - COMPLETE EXAMPLES');
    console.log('═══════════════════════════════════════════════');

    this.basicExample();
    this.progressiveLearningPath();
    this.noveltyScoring();
    this.moduleLevelProgression();
    this.inspectConfiguration();

    console.log('\n═══════════════════════════════════════════════');
    console.log('✅ ALL EXAMPLES COMPLETE');
    console.log('═══════════════════════════════════════════════\n');
  }
}

// Uncomment to run examples:
// const example = new InteractivitySequencerExample();
// example.runAllExamples();


