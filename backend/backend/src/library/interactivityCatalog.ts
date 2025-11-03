// backend/src/library/interactivityCatalog.ts
import { InteractivityType } from '../types/storyboardTypes';

/**
 * INTERACTIVITY_CATALOG - Master Catalog
 * Structured interactivity types for the InteractivitySequencer
 * Each entry defines compatibility with Bloom levels, module levels, and cognitive load
 */
export const INTERACTIVITY_CATALOG: InteractivityType[] = [
  {
    id: "click_to_reveal",
    name: "Click to Reveal",
    bloomLevels: ["remember", "understand"],
    moduleLevels: [1, 2, 3, 4],
    cognitiveLoad: "low",
    instructionalPurposes: ["foundation", "reinforcement"],
    templateRef: "reveal_template",
    description: "Progressive disclosure of concepts through click interactions"
  },
  {
    id: "scenario_simulation",
    name: "Scenario Simulation",
    bloomLevels: ["apply", "analyze", "evaluate"],
    moduleLevels: [2, 3, 4],
    cognitiveLoad: "medium",
    instructionalPurposes: ["practice", "assessment"],
    templateRef: "scenario_pathway_branching",
    description: "Realistic branching scenarios with immediate feedback"
  },
  {
    id: "drag_and_drop",
    name: "Drag and Drop",
    bloomLevels: ["understand", "apply", "analyze"],
    moduleLevels: [1, 2, 3, 4],
    cognitiveLoad: "medium",
    instructionalPurposes: ["practice", "reinforcement"],
    templateRef: "drag_drop_template",
    description: "Kinesthetic learning through drag and drop interactions"
  },
  {
    id: "multi_select_quiz",
    name: "Multi-Select Quiz",
    bloomLevels: ["remember", "understand", "apply"],
    moduleLevels: [1, 2, 3, 4],
    cognitiveLoad: "low",
    instructionalPurposes: ["reinforcement", "assessment"],
    templateRef: "multi_select_template",
    description: "Knowledge check with multiple correct answers"
  },
  {
    id: "hotspot_exploration",
    name: "Hotspot Exploration",
    bloomLevels: ["remember", "understand", "apply"],
    moduleLevels: [2, 3, 4],
    cognitiveLoad: "medium",
    instructionalPurposes: ["foundation", "practice"],
    templateRef: "hotspot_template",
    description: "Interactive exploration of interfaces or processes"
  },
  {
    id: "procedural_demo",
    name: "Procedural Demonstration",
    bloomLevels: ["apply", "analyze"],
    moduleLevels: [2, 3, 4],
    cognitiveLoad: "medium",
    instructionalPurposes: ["foundation", "practice"],
    templateRef: "procedural_template",
    description: "Step-by-step guided demonstration with practice"
  },
  {
    id: "reflection_journal",
    name: "Reflection Journal",
    bloomLevels: ["analyze", "evaluate", "create"],
    moduleLevels: [3, 4],
    cognitiveLoad: "high",
    instructionalPurposes: ["practice", "assessment"],
    templateRef: "reflection_template",
    description: "Open-ended reflection on learning and application"
  },
  {
    id: "case_study_analysis",
    name: "Case Study Analysis",
    bloomLevels: ["analyze", "evaluate"],
    moduleLevels: [3, 4],
    cognitiveLoad: "high",
    instructionalPurposes: ["practice", "assessment"],
    templateRef: "case_study_template",
    description: "In-depth analysis of real-world scenarios"
  },
  {
    id: "single_select_quiz",
    name: "Single Select Quiz",
    bloomLevels: ["remember", "understand"],
    moduleLevels: [1, 2, 3, 4],
    cognitiveLoad: "low",
    instructionalPurposes: ["reinforcement", "assessment"],
    templateRef: "single_select_template",
    description: "Basic knowledge check with single correct answer"
  },
  {
    id: "timeline_sequencing",
    name: "Timeline Sequencing",
    bloomLevels: ["understand", "apply", "analyze"],
    moduleLevels: [2, 3, 4],
    cognitiveLoad: "medium",
    instructionalPurposes: ["foundation", "practice", "reinforcement"],
    templateRef: "timeline_template",
    description: "Order events or steps in correct sequence"
  },
  {
    id: "procedural_demo",
    name: "Procedural Demonstration",
    bloomLevels: ["understand", "apply"],
    moduleLevels: [2, 3, 4],
    cognitiveLoad: "medium",
    instructionalPurposes: ["foundation", "practice"],
    templateRef: "procedural_demo_template",
    description: "Step-by-step guided demonstration with practice"
  },
  {
    id: "branching_scenario",
    name: "Branching Scenario",
    bloomLevels: ["apply", "analyze", "evaluate"],
    moduleLevels: [2, 3, 4],
    cognitiveLoad: "high",
    instructionalPurposes: ["practice", "assessment"],
    templateRef: "branching_scenario_template",
    description: "Multi-path decision scenario with consequences"
  },
  {
    id: "conversation_simulator",
    name: "Conversation Simulator",
    bloomLevels: ["apply", "analyze"],
    moduleLevels: [3, 4],
    cognitiveLoad: "high",
    instructionalPurposes: ["practice"],
    templateRef: "conversation_sim_template",
    description: "Realistic dialogue practice with response options"
  },
  {
    id: "decision_tree",
    name: "Decision Tree",
    bloomLevels: ["apply", "analyze"],
    moduleLevels: [2, 3, 4],
    cognitiveLoad: "medium",
    instructionalPurposes: ["practice", "reinforcement"],
    templateRef: "decision_tree_template",
    description: "Flowchart-style guided decision making"
  },
  {
    id: "video_analysis",
    name: "Video Analysis",
    bloomLevels: ["analyze", "evaluate"],
    moduleLevels: [2, 3, 4],
    cognitiveLoad: "medium",
    instructionalPurposes: ["practice", "reinforcement"],
    templateRef: "video_analysis_template",
    description: "Analyze video content with guided questions"
  },
  {
    id: "peer_review_activity",
    name: "Peer Review Activity",
    bloomLevels: ["evaluate", "create"],
    moduleLevels: [3, 4],
    cognitiveLoad: "high",
    instructionalPurposes: ["practice", "assessment"],
    templateRef: "peer_review_template",
    description: "Review and provide feedback on peer work"
  },
  {
    id: "simulation_exercise",
    name: "Simulation Exercise",
    bloomLevels: ["apply", "analyze", "create"],
    moduleLevels: [3, 4],
    cognitiveLoad: "high",
    instructionalPurposes: ["practice", "assessment"],
    templateRef: "simulation_template",
    description: "Immersive practice in simulated environment"
  }
];

/**
 * Get interactivity type by ID
 */
export function getInteractivityById(id: string): InteractivityType | undefined {
  return INTERACTIVITY_CATALOG.find(item => item.id === id);
}

/**
 * Get all interactivity types matching criteria
 */
export function filterInteractivitiesByCriteria(criteria: {
  bloomLevel?: string;
  moduleLevel?: number;
  cognitiveLoad?: string;
  instructionalPurpose?: string;
}): InteractivityType[] {
  return INTERACTIVITY_CATALOG.filter(item => {
    if (criteria.bloomLevel && !item.bloomLevels.includes(criteria.bloomLevel as any)) {
      return false;
    }
    if (criteria.moduleLevel && !item.moduleLevels.includes(criteria.moduleLevel as any)) {
      return false;
    }
    if (criteria.cognitiveLoad && item.cognitiveLoad !== criteria.cognitiveLoad) {
      return false;
    }
    if (criteria.instructionalPurpose && !item.instructionalPurposes.includes(criteria.instructionalPurpose as any)) {
      return false;
    }
    return true;
  });
}
