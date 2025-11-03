// backend/src/constants/interactionPriorities.ts

/**
 * Interaction Priority Weights - Narrative-First System
 * 
 * REORDERED PRIORITIES:
 * - HIGH: Narrative & emotional (scenarios, conversations, reflections)
 * - MEDIUM: Applied practice (case studies, simulations)
 * - LOW: Academic (drag-drop, click-reveal, MCQs)
 * 
 * Use these weights to boost scenario-based interactions over academic ones.
 */

export interface InteractionWeight {
  baseScore: number;
  blooms: string[];
  preferredDomains: string[];
  narrativeValue: 'high' | 'medium' | 'low';
  engagementLevel: 'high' | 'medium' | 'low';
}

/**
 * NEW PRIORITY SYSTEM - Scenario-Based First
 */
export const INTERACTION_WEIGHTS: Record<string, InteractionWeight> = {
  
  // ========== HIGH PRIORITY: Narrative & Emotional ==========
  
  branching_scenario: {
    baseScore: 100,
    blooms: ['apply', 'analyze', 'evaluate'],
    preferredDomains: ['emotional', 'leadership', 'safety', 'compliance'],
    narrativeValue: 'high',
    engagementLevel: 'high'
  },

  conversation_simulator: {
    baseScore: 95,
    blooms: ['apply', 'analyze'],
    preferredDomains: ['emotional', 'leadership'],
    narrativeValue: 'high',
    engagementLevel: 'high'
  },

  scenario_simulation: {
    baseScore: 90,
    blooms: ['apply', 'evaluate'],
    preferredDomains: ['emotional', 'leadership', 'safety'],
    narrativeValue: 'high',
    engagementLevel: 'high'
  },

  case_study_analysis: {
    baseScore: 85,
    blooms: ['analyze', 'evaluate'],
    preferredDomains: ['leadership', 'technical', 'compliance'],
    narrativeValue: 'high',
    engagementLevel: 'high'
  },

  reflection_journal: {
    baseScore: 80,
    blooms: ['analyze', 'evaluate', 'create'],
    preferredDomains: ['emotional', 'leadership'],
    narrativeValue: 'high',
    engagementLevel: 'medium'
  },

  // ========== MEDIUM PRIORITY: Applied Practice ==========

  decision_tree: {
    baseScore: 75,
    blooms: ['apply', 'analyze'],
    preferredDomains: ['technical', 'procedural', 'safety'],
    narrativeValue: 'medium',
    engagementLevel: 'medium'
  },

  procedural_demo: {
    baseScore: 70,
    blooms: ['understand', 'apply'],
    preferredDomains: ['procedural', 'technical', 'product'],
    narrativeValue: 'medium',
    engagementLevel: 'medium'
  },

  simulation_exercise: {
    baseScore: 75,
    blooms: ['apply', 'analyze', 'create'],
    preferredDomains: ['technical', 'procedural', 'product'],
    narrativeValue: 'medium',
    engagementLevel: 'high'
  },

  timeline_sequencing: {
    baseScore: 65,
    blooms: ['understand', 'apply', 'analyze'],
    preferredDomains: ['procedural', 'safety', 'compliance'],
    narrativeValue: 'medium',
    engagementLevel: 'medium'
  },

  hotspot_exploration: {
    baseScore: 60,
    blooms: ['remember', 'understand', 'apply'],
    preferredDomains: ['product', 'technical'],
    narrativeValue: 'low',
    engagementLevel: 'medium'
  },

  // ========== LOW PRIORITY: Academic (Use Sparingly) ==========

  multi_select_quiz: {
    baseScore: 50,
    blooms: ['remember', 'understand', 'apply'],
    preferredDomains: ['compliance', 'technical'],
    narrativeValue: 'low',
    engagementLevel: 'low'
  },

  single_select_quiz: {
    baseScore: 45,
    blooms: ['remember', 'understand'],
    preferredDomains: ['compliance', 'procedural'],
    narrativeValue: 'low',
    engagementLevel: 'low'
  },

  drag_and_drop: {
    baseScore: 40,
    blooms: ['understand', 'apply'],
    preferredDomains: ['procedural', 'technical'],
    narrativeValue: 'low',
    engagementLevel: 'medium'
  },

  click_to_reveal: {
    baseScore: 30,
    blooms: ['remember', 'understand'],
    preferredDomains: ['product', 'technical'],
    narrativeValue: 'low',
    engagementLevel: 'low'
  }
};

/**
 * Get priority boost for interaction type based on content domain
 */
export function getPriorityBoost(
  interactionType: string,
  contentDomain: string,
  preferNarrative: boolean = true
): number {
  const weight = INTERACTION_WEIGHTS[interactionType];
  if (!weight) return 0;

  let boost = 0;

  // Boost if domain matches
  if (weight.preferredDomains.includes(contentDomain)) {
    boost += 20;
  }

  // Boost narrative-focused interactions if narrative mode active
  if (preferNarrative && weight.narrativeValue === 'high') {
    boost += 15;
  }

  // Boost high engagement interactions
  if (weight.engagementLevel === 'high') {
    boost += 10;
  }

  // Penalty for low narrative value in narrative mode
  if (preferNarrative && weight.narrativeValue === 'low') {
    boost -= 15;
  }

  return boost;
}

/**
 * Get base score for interaction type
 */
export function getBaseScore(interactionType: string): number {
  return INTERACTION_WEIGHTS[interactionType]?.baseScore || 50;
}

/**
 * Check if interaction is narrative-focused
 */
export function isNarrativeFocused(interactionType: string): boolean {
  return INTERACTION_WEIGHTS[interactionType]?.narrativeValue === 'high';
}

/**
 * Get recommended interactions for narrative mode
 */
export function getNarrativeInteractions(): string[] {
  return Object.entries(INTERACTION_WEIGHTS)
    .filter(([, weight]) => weight.narrativeValue === 'high')
    .sort(([, a], [, b]) => b.baseScore - a.baseScore)
    .map(([type]) => type);
}

/**
 * Get academic interactions (to avoid in narrative mode)
 */
export function getAcademicInteractions(): string[] {
  return Object.entries(INTERACTION_WEIGHTS)
    .filter(([, weight]) => weight.narrativeValue === 'low')
    .map(([type]) => type);
}

export default INTERACTION_WEIGHTS;


