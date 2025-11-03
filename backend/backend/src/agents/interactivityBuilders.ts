// backend/src/agents/interactivityBuilders.ts
import { Scene } from '../agents_v2/types';
import { InteractivityDecision, InteractionDetails } from '../types/storyboardTypes';
import TimelineSequencingBuilder from './builders/TimelineSequencing';
import ProceduralDemoBuilder from './builders/ProceduralDemo';
import BranchingScenarioBuilder from './builders/BranchingScenario';
import ConversationSimulatorBuilder from './builders/ConversationSimulator';
import CaseStudyAnalysisBuilder from './builders/CaseStudyAnalysis';
import DecisionTreeBuilder from './builders/DecisionTree';

/**
 * PHASE 3: INTERACTIVITY CONTENT BUILDERS
 * 
 * Registry-based system for generating interaction content from decisions.
 * Each builder function creates standardized InteractionDetails for frontend rendering.
 * 
 * Builders are:
 * - Side-effect free (pure functions)
 * - Return templates only (no AI calls)
 * - Scene-aware (extract context from scene properties)
 * - Decision-driven (use metadata for customization)
 * - Accessible (include keyboard navigation)
 */

// ========== CORE BUILDER FUNCTIONS ==========

/**
 * Build Click-to-Reveal interaction
 * Progressive disclosure of concepts with reveal animation
 */
function buildClickToReveal(
  scene: Scene,
  decision: InteractivityDecision
): InteractionDetails {
  // Extract key concepts from scene content
  const concepts = extractKeyConcepts(scene.onScreenText, 3);
  
  return {
    type: 'click_to_reveal',
    title: `Explore: ${scene.pageTitle}`,
    interactionSteps: [
      'Click each concept card to reveal detailed information',
      'Review all concepts before continuing to the next scene',
      'Hover over cards for quick previews'
    ],
    feedbackRules: {
      neutral: 'Excellent! You\'ve explored all key concepts.'
    },
    accessibilityNotes: 'Use Tab key to navigate between concept cards. Press Enter or Space to reveal content. Press Escape to close revealed content.',
    imagePrompt: `Interactive reveal cards showing ${concepts.length} key concepts for ${scene.pageTitle} with modern card design and smooth animations`,
    templateData: {
      concepts: concepts.map((concept, index) => ({
        id: `concept-${index + 1}`,
        title: concept,
        content: `Detailed explanation of ${concept} with practical examples and key takeaways.`,
        revealed: false,
        order: index + 1
      })),
      revealAnimation: 'fade-slide',
      layout: 'grid',
      columns: concepts.length <= 2 ? 2 : 3
    }
  };
}

/**
 * Build Drag-and-Drop interaction
 * Kinesthetic learning through drag and drop mechanics
 */
function buildDragAndDrop(
  scene: Scene,
  decision: InteractivityDecision
): InteractionDetails {
  const learningOutcome = scene.learningOutcome || scene.pageTitle;
  const items = generateDragDropItems(learningOutcome, 4);
  
  return {
    type: 'drag_and_drop',
    title: `Match: ${scene.pageTitle}`,
    interactionSteps: [
      'Drag items from the left column to match with the correct category on the right',
      'Drop items into the appropriate target zones',
      'Click "Check Answers" to verify your matches'
    ],
    feedbackRules: {
      correct: 'Perfect! All items are correctly matched. You understand the relationships well.',
      incorrect: 'Some items need adjustment. Review the concepts and try again.',
      neutral: 'Drag all items to their correct positions before checking.'
    },
    accessibilityNotes: 'Use Tab to focus items. Press Space to pick up/drop items. Use Arrow keys to move between drop zones. Press Enter to confirm placement.',
    imagePrompt: `Drag and drop interface for ${scene.pageTitle} with clear source and target zones, visual feedback, and intuitive design`,
    templateData: {
      draggableItems: items.draggable,
      dropZones: items.zones,
      matchPairs: items.pairs,
      allowMultiple: false,
      showFeedback: true,
      enableHints: true
    }
  };
}

/**
 * Build Scenario Simulation interaction
 * Branching decision-making scenarios with consequences
 */
function buildScenarioSimulation(
  scene: Scene,
  decision: InteractivityDecision
): InteractionDetails {
  const scenario = generateScenarioContent(scene.learningOutcome || scene.pageTitle);
  
  return {
    type: 'scenario_simulation',
    title: `Scenario: ${scene.pageTitle}`,
    interactionSteps: [
      'Read the scenario description carefully',
      'Consider the situation and potential outcomes',
      'Choose your response from the available options',
      'Review the consequences of your decision and coaching feedback'
    ],
    feedbackRules: {
      correct: 'Excellent choice! Your decision demonstrates strong understanding of the principles.',
      incorrect: 'This choice has some challenges. Review the feedback and consider alternative approaches.',
      neutral: 'Each choice has trade-offs. Review all options before deciding.'
    },
    accessibilityNotes: 'Use Tab to navigate between choices. Press Enter to select your decision. Use Arrow keys to move between options.',
    imagePrompt: `Realistic workplace scenario for ${scene.pageTitle} showing decision points, characters, and environment with professional styling`,
    templateData: {
      scenarioText: scenario.description,
      context: scenario.context,
      choices: scenario.choices,
      consequences: scenario.consequences,
      coachingTips: scenario.coaching,
      allowRetry: true,
      showConsequences: true
    }
  };
}

/**
 * Build Multi-Select Quiz interaction
 * Knowledge check with multiple correct answers
 */
function buildMultiSelectQuiz(
  scene: Scene,
  decision: InteractivityDecision
): InteractionDetails {
  const quiz = generateMultiSelectQuestions(scene.learningOutcome || scene.pageTitle, 1);
  
  return {
    type: 'multi_select_quiz',
    title: `Knowledge Check: ${scene.pageTitle}`,
    interactionSteps: [
      'Read the question carefully',
      'Select ALL options that apply (multiple correct answers)',
      'Click "Submit" to check your answers',
      'Review feedback and correct answers'
    ],
    feedbackRules: {
      correct: 'Excellent! You\'ve identified all correct answers.',
      incorrect: 'Not quite. Review the concepts and try again.',
      neutral: 'Select all options that apply before submitting.'
    },
    accessibilityNotes: 'Use Tab to navigate options. Press Space to select/deselect. Press Enter to submit answers.',
    imagePrompt: `Quiz interface for ${scene.pageTitle} with clear options, selection indicators, and feedback display`,
    templateData: {
      questions: quiz.questions,
      requireAllCorrect: true,
      showPartialCredit: true,
      allowRetry: true,
      maxAttempts: 2
    }
  };
}

/**
 * Build Single-Select Quiz interaction
 * Basic knowledge check with single correct answer
 */
function buildSingleSelectQuiz(
  scene: Scene,
  decision: InteractivityDecision
): InteractionDetails {
  const quiz = generateSingleSelectQuestions(scene.learningOutcome || scene.pageTitle, 1);
  
  return {
    type: 'single_select_quiz',
    title: `Quick Check: ${scene.pageTitle}`,
    interactionSteps: [
      'Read the question',
      'Select the single best answer',
      'Submit your response',
      'Review the feedback'
    ],
    feedbackRules: {
      correct: 'Correct! You understand this concept well.',
      incorrect: 'Not quite. Review the teaching content and try again.',
      neutral: 'Select one answer before submitting.'
    },
    accessibilityNotes: 'Use Tab to navigate. Press Enter to select. Submit with Enter key.',
    imagePrompt: `Simple quiz interface for ${scene.pageTitle} with radio buttons and clear feedback`,
    templateData: {
      questions: quiz.questions,
      allowRetry: true,
      showExplanation: true
    }
  };
}

/**
 * Build Hotspot Exploration interaction
 * Interactive exploration of interfaces or processes
 */
function buildHotspotExploration(
  scene: Scene,
  decision: InteractivityDecision
): InteractionDetails {
  const hotspots = generateHotspots(scene.onScreenText, 4);
  
  return {
    type: 'hotspot_exploration',
    title: `Explore: ${scene.pageTitle}`,
    interactionSteps: [
      'Click on each hotspot to learn more',
      'Explore all areas before continuing',
      'Revisit hotspots as needed'
    ],
    feedbackRules: {
      neutral: 'Great job exploring! You\'ve discovered all key areas.'
    },
    accessibilityNotes: 'Tab through hotspots. Enter to activate. Escape to close.',
    imagePrompt: `Interactive interface for ${scene.pageTitle} with clickable hotspot markers and popup information`,
    templateData: {
      hotspots: hotspots,
      requireAllVisited: true,
      showProgress: true
    }
  };
}

// ========== BUILDER REGISTRY ==========

type BuilderFunction = (scene: Scene, decision: InteractivityDecision) => InteractionDetails;

// Initialize new builder instances
const timelineBuilder = new TimelineSequencingBuilder();
const proceduralBuilder = new ProceduralDemoBuilder();
const branchingBuilder = new BranchingScenarioBuilder();
const conversationBuilder = new ConversationSimulatorBuilder();
const caseStudyBuilder = new CaseStudyAnalysisBuilder();
const decisionTreeBuilder = new DecisionTreeBuilder();

const BUILDER_REGISTRY: Record<string, BuilderFunction> = {
  // Core builders (function-based)
  'click_to_reveal': buildClickToReveal,
  'drag_and_drop': buildDragAndDrop,
  'scenario_simulation': buildScenarioSimulation,
  'multi_select_quiz': buildMultiSelectQuiz,
  'single_select_quiz': buildSingleSelectQuiz,
  'hotspot_exploration': buildHotspotExploration,
  
  // Phase 5 builders (class-based)
  'timeline_sequencing': (scene, decision) => timelineBuilder.build(scene, decision),
  'procedural_demo': (scene, decision) => proceduralBuilder.build(scene, decision),
  'branching_scenario': (scene, decision) => branchingBuilder.build(scene, decision),
  'conversation_simulator': (scene, decision) => conversationBuilder.build(scene, decision),
  'case_study_analysis': (scene, decision) => caseStudyBuilder.build(scene, decision),
  'decision_tree': (scene, decision) => decisionTreeBuilder.build(scene, decision),
  
  // Alternative names (for compatibility)
  'ClickToReveal': buildClickToReveal,
  'DragAndDrop': buildDragAndDrop,
  'DragAndDrop-Matching': buildDragAndDrop,
  'DragAndDrop-Sequencing': buildDragAndDrop,
  'MCQ': buildSingleSelectQuiz,
  'Scenario': buildScenarioSimulation
};

/**
 * Fallback builder for unknown interaction types
 */
function buildFallbackInteraction(
  scene: Scene,
  decision: InteractivityDecision
): InteractionDetails {
  console.log(`⚠️  No builder found for type: ${decision.interactivityType}`);
  
  return {
    type: 'none',
    title: scene.pageTitle,
    interactionSteps: [
      'This scene has no interactive elements',
      'Review the content and continue when ready'
    ],
    accessibilityNotes: 'No keyboard interaction required for this scene.',
    templateData: {
      reason: `No builder found for interaction type: ${decision.interactivityType}`,
      originalType: decision.interactivityType,
      fallbackApplied: true
    }
  };
}

/**
 * Get builder function for interaction type
 * Returns fallback builder if type not found
 */
export function getBuilder(interactivityType: string): BuilderFunction {
  const builder = BUILDER_REGISTRY[interactivityType];
  
  if (!builder) {
    console.log(`⚠️  Builder not found for type: "${interactivityType}" - using fallback`);
    return buildFallbackInteraction;
  }
  
  console.log(`✅ Builder found for type: "${interactivityType}"`);
  return builder;
}

// ========== HELPER FUNCTIONS ==========

/**
 * Extract key concepts from on-screen text
 */
function extractKeyConcepts(text: string, count: number = 3): string[] {
  if (!text) return ['Key Concept 1', 'Key Concept 2', 'Key Concept 3'].slice(0, count);
  
  // Simple extraction: split by punctuation and take first few phrases
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const concepts = sentences.slice(0, count).map(s => s.trim().substring(0, 50));
  
  // Pad if needed
  while (concepts.length < count) {
    concepts.push(`Key Point ${concepts.length + 1}`);
  }
  
  return concepts.slice(0, count);
}

/**
 * Generate drag-drop items for matching activity
 */
function generateDragDropItems(topic: string, count: number = 4) {
  const items = [];
  const zones = [];
  const pairs = [];
  
  for (let i = 1; i <= count; i++) {
    const itemId = `item-${i}`;
    const zoneId = `zone-${i}`;
    
    items.push({
      id: itemId,
      label: `Concept ${i}`,
      description: `Related to ${topic}`
    });
    
    zones.push({
      id: zoneId,
      label: `Category ${i}`,
      description: `Drop matching items here`
    });
    
    pairs.push({ item: itemId, zone: zoneId });
  }
  
  return {
    draggable: items,
    zones: zones,
    pairs: pairs
  };
}

/**
 * Generate scenario content
 */
function generateScenarioContent(topic: string) {
  return {
    description: `You're facing a situation related to ${topic}. Consider your options carefully.`,
    context: `Professional workplace setting where ${topic} principles apply.`,
    choices: [
      {
        id: 'choice-1',
        text: 'Take immediate action based on established procedures',
        outcome: 'positive',
        rationale: 'Following established procedures ensures consistency and reliability.'
      },
      {
        id: 'choice-2',
        text: 'Consult with team members before deciding',
        outcome: 'positive',
        rationale: 'Collaboration brings diverse perspectives and better outcomes.'
      },
      {
        id: 'choice-3',
        text: 'Delay the decision and gather more information',
        outcome: 'mixed',
        rationale: 'More information helps, but timing matters. Balance thoroughness with urgency.'
      }
    ],
    consequences: {
      'choice-1': 'Your decisive action resolves the situation quickly and effectively.',
      'choice-2': 'The collaborative approach leads to a well-rounded solution with team buy-in.',
      'choice-3': 'While you gather information, the situation evolves. Consider the time factor.'
    },
    coaching: {
      'choice-1': 'Great decision-making! Quick action when appropriate shows confidence.',
      'choice-2': 'Excellent! Collaboration enhances decision quality and team engagement.',
      'choice-3': 'Good instinct to gather data, but remember to balance thoroughness with timeliness.'
    }
  };
}

/**
 * Generate multi-select quiz questions
 */
function generateMultiSelectQuestions(topic: string, count: number = 1) {
  return {
    questions: [{
      id: 'q1',
      text: `Which of the following are key principles of ${topic}? (Select all that apply)`,
      options: [
        { id: 'opt1', text: 'Clear communication', correct: true },
        { id: 'opt2', text: 'Active listening', correct: true },
        { id: 'opt3', text: 'Empathy and understanding', correct: true },
        { id: 'opt4', text: 'Avoiding difficult conversations', correct: false },
        { id: 'opt5', text: 'Ignoring feedback', correct: false }
      ],
      explanation: 'Effective practice requires clear communication, active listening, and empathy. Avoiding challenges prevents growth.'
    }]
  };
}

/**
 * Generate single-select quiz questions
 */
function generateSingleSelectQuestions(topic: string, count: number = 1) {
  return {
    questions: [{
      id: 'q1',
      text: `What is the most important principle of ${topic}?`,
      options: [
        { id: 'opt1', text: 'Understanding the context and requirements', correct: true },
        { id: 'opt2', text: 'Acting quickly without analysis', correct: false },
        { id: 'opt3', text: 'Following tradition without question', correct: false },
        { id: 'opt4', text: 'Avoiding responsibility', correct: false }
      ],
      explanation: 'Understanding context is fundamental to effective application of any principle.'
    }]
  };
}

/**
 * Generate hotspots for exploration
 */
function generateHotspots(text: string, count: number = 4) {
  const hotspots = [];
  
  for (let i = 1; i <= count; i++) {
    hotspots.push({
      id: `hotspot-${i}`,
      label: `Area ${i}`,
      description: `Click to learn about this important aspect`,
      content: `Detailed information about this key area of the topic.`,
      position: { x: (i - 1) * 25, y: 20 }
    });
  }
  
  return hotspots;
}

// CommonJS export
module.exports = { getBuilder };
