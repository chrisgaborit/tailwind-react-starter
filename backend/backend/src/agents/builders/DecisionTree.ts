// backend/src/agents/builders/DecisionTree.ts
import { Scene } from '../../agents_v2/types';
import { InteractivityDecision, InteractionDetails } from '../../types/storyboardTypes';

/**
 * Decision Tree Builder
 * Creates flowchart-style decision-making interactions with branching logic
 */
export class DecisionTreeBuilder {
  
  build(scene: Scene, decision: InteractivityDecision): InteractionDetails {
    const tree = this.generateDecisionTree(scene);
    
    return {
      type: "decision_tree",
      title: `Decide: ${scene.pageTitle}`,
      interactionSteps: [
        "Start at the root question of the decision tree",
        "Answer each question to navigate through the tree",
        "Follow the branches based on your answers",
        "Reach your personalized recommendation",
        "Review the decision path and reasoning"
      ],
      feedbackRules: {
        correct: "You've successfully navigated to an appropriate recommendation for your situation.",
        neutral: "The decision tree has guided you to a recommendation based on your specific context.",
        incorrect: "Review your path through the tree. Some answers may need reconsideration."
      },
      accessibilityNotes: "Use Tab to navigate options at each node. Press Enter to select and advance. Press 'B' to go back to previous node. Press 'R' to restart from root.",
      imagePrompt: `Decision tree flowchart for ${scene.pageTitle} with clear nodes, branches, and decision paths`,
      templateData: {
        tree: tree,
        showPath: true,
        allowBacktrack: true,
        highlightCurrentNode: true,
        visualStyle: 'flowchart'
      }
    };
  }
  
  /**
   * Generate decision tree structure
   */
  private generateDecisionTree(scene: Scene) {
    const topic = scene.learningOutcome || scene.pageTitle;
    
    return {
      rootNode: {
        id: "root",
        question: `What is your primary goal in this ${topic} situation?`,
        options: [
          { id: "goal-1", text: "Quick resolution", nextNode: "node-1a" },
          { id: "goal-2", text: "Comprehensive solution", nextNode: "node-1b" },
          { id: "goal-3", text: "Team buy-in", nextNode: "node-1c" }
        ]
      },
      nodes: [
        {
          id: "node-1a",
          question: "Do you have all necessary information?",
          options: [
            { id: "opt-a1", text: "Yes, proceed immediately", nextNode: "outcome-1" },
            { id: "opt-a2", text: "No, need quick research", nextNode: "outcome-2" }
          ]
        },
        {
          id: "node-1b",
          question: "What level of analysis is required?",
          options: [
            { id: "opt-b1", text: "Standard analysis", nextNode: "outcome-3" },
            { id: "opt-b2", text: "Deep analysis", nextNode: "outcome-4" }
          ]
        },
        {
          id: "node-1c",
          question: "Who needs to be involved in the decision?",
          options: [
            { id: "opt-c1", text: "Core team only", nextNode: "outcome-5" },
            { id: "opt-c2", text: "All stakeholders", nextNode: "outcome-6" }
          ]
        }
      ],
      outcomes: [
        {
          id: "outcome-1",
          recommendation: "Use the rapid response protocol",
          rationale: "You have the information and authority to act quickly",
          nextSteps: ["Document decision", "Implement immediately", "Monitor results"],
          confidence: "high"
        },
        {
          id: "outcome-2",
          recommendation: "Quick research phase (1-2 hours) then decide",
          rationale: "Brief research will strengthen your decision without significant delay",
          nextSteps: ["Identify information gaps", "Quick research sprint", "Decide within 24 hours"],
          confidence: "medium-high"
        },
        {
          id: "outcome-3",
          recommendation: "Standard analysis approach (2-3 days)",
          rationale: "Balanced approach for comprehensive but timely solution",
          nextSteps: ["Structured analysis", "Stakeholder input", "Implement with monitoring"],
          confidence: "high"
        },
        {
          id: "outcome-4",
          recommendation: "Deep analysis with multiple iterations (1-2 weeks)",
          rationale: "Complex situation requires thorough investigation",
          nextSteps: ["Data gathering", "Multiple analysis cycles", "Validation with experts", "Phased implementation"],
          confidence: "very high"
        },
        {
          id: "outcome-5",
          recommendation: "Core team workshop and decision session",
          rationale: "Focused collaboration with key decision-makers",
          nextSteps: ["Schedule workshop", "Prepare materials", "Facilitate decision", "Communicate outcomes"],
          confidence: "high"
        },
        {
          id: "outcome-6",
          recommendation: "Inclusive stakeholder process with working groups",
          rationale: "Broad buy-in requires comprehensive engagement",
          nextSteps: ["Map stakeholders", "Create working groups", "Iterative consultation", "Consensus building"],
          confidence: "medium"
        }
      ]
    };
  }
  
  /**
   * Generate personas for decision tree context
   */
  private generatePersonas(scene: Scene) {
    return [
      {
        id: "advisor",
        name: "Decision Tree Guide",
        role: "Expert Advisor",
        description: "Helps you navigate to the best recommendation for your situation"
      }
    ];
  }
}

export default DecisionTreeBuilder;


