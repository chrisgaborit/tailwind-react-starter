// backend/src/agents/builders/BranchingScenario.ts
import { Scene } from '../../agents_v2/types';
import { InteractivityDecision, InteractionDetails } from '../../types/storyboardTypes';

/**
 * Branching Scenario Builder  
 * Creates multi-path decision scenarios with consequences and coaching feedback
 */
export class BranchingScenarioBuilder {
  
  build(scene: Scene, decision: InteractivityDecision): InteractionDetails {
    const scenarioContent = this.generateScenario(scene);
    const branches = this.generateBranches(scene);
    
    return {
      type: "branching_scenario",
      title: `Scenario: ${scene.pageTitle}`,
      interactionSteps: [
        "Read the scenario description and context carefully",
        "Consider each choice and its potential consequences",
        "Select your decision from the available options",
        "Review the outcome and coaching feedback",
        "Optionally explore alternative paths to see other outcomes"
      ],
      feedbackRules: {
        correct: "Excellent decision! This approach demonstrates strong understanding and leads to positive outcomes.",
        incorrect: "This choice presents some challenges. Review the coaching feedback to understand the implications.",
        neutral: "Each path teaches something valuable. Consider the context and stakeholder impact when deciding."
      },
      accessibilityNotes: "Use Tab to navigate between choices. Press Enter to select your decision. Use Arrow keys to move between options. Press 'R' to reset and explore alternative paths.",
      imagePrompt: `Branching scenario interface for ${scene.pageTitle} showing realistic workplace situation with decision tree visual`,
      templateData: {
        scenario: scenarioContent,
        branches: branches,
        allowReset: true,
        trackChoices: true,
        showConsequencesImmediately: true,
        enablePathComparison: true
      }
    };
  }
  
  /**
   * Generate scenario content from scene
   */
  private generateScenario(scene: Scene) {
    const learningOutcome = scene.learningOutcome || scene.pageTitle;
    
    return {
      context: `You're in a professional situation where ${learningOutcome.toLowerCase()} is required.`,
      challenge: "A critical decision must be made that will impact outcomes and relationships.",
      stakes: "Your choice will affect team dynamics, project success, and professional relationships.",
      setting: "Modern workplace environment with realistic constraints and pressures",
      characters: [
        { name: "You", role: scene.pageTitle.includes('Manager') ? 'Team Manager' : 'Professional', perspective: 'Decision maker' },
        { name: "Team Member", role: "Colleague", perspective: "Affected party" },
        { name: "Stakeholder", role: "Senior Leader", perspective: "Observer" }
      ]
    };
  }
  
  /**
   * Generate decision branches with consequences
   */
  private generateBranches(scene: Scene) {
    return [
      {
        id: "branch-1",
        choice: "Take immediate action based on established procedures",
        outcomeType: "positive",
        consequence: "The situation is resolved quickly and efficiently. Your decisive action demonstrates confidence and clarity.",
        impact: {
          team: "Team appreciates clear direction",
          project: "Minimal disruption",
          relationships: "Trust maintained"
        },
        coaching: "Quick, informed action shows leadership. You balanced speed with sound judgment."
      },
      {
        id: "branch-2",
        choice: "Consult with the team before making a final decision",
        outcomeType: "positive",
        consequence: "The collaborative approach leads to a well-rounded solution with strong team buy-in and shared ownership.",
        impact: {
          team: "Team feels valued and engaged",
          project: "Stronger solution with multiple perspectives",
          relationships: "Enhanced collaboration"
        },
        coaching: "Collaboration builds stronger solutions and team engagement. Excellent choice for complex decisions."
      },
      {
        id: "branch-3",
        choice: "Delay the decision to gather more comprehensive information",
        outcomeType: "mixed",
        consequence: "While you gather thorough information, the delay creates some time pressure. The comprehensive data helps, but timing matters.",
        impact: {
          team: "Some uncertainty from delay",
          project: "Better informed but time-sensitive",
          relationships: "Mixed signals on urgency"
        },
        coaching: "Gathering information is valuable, but balance thoroughness with timeliness. Consider which decisions require quick action vs. deep analysis."
      },
      {
        id: "branch-4",
        choice: "Escalate the decision to senior leadership",
        outcomeType: "mixed",
        consequence: "Leadership appreciates being informed, but questions whether you could have handled this independently with your training.",
        impact: {
          team: "Team wonders about your confidence",
          project: "Delayed resolution",
          relationships: "Leadership questions your readiness"
        },
        coaching: "Escalation has its place, but this situation could have been handled at your level. Build confidence in applying your skills."
      }
    ];
  }
}

export default BranchingScenarioBuilder;


