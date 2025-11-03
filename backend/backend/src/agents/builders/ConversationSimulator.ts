// backend/src/agents/builders/ConversationSimulator.ts
import { Scene } from '../../agents_v2/types';
import { InteractivityDecision, InteractionDetails } from '../../types/storyboardTypes';

/**
 * Conversation Simulator Builder
 * Creates realistic dialogue practice with response options and feedback
 */
export class ConversationSimulatorBuilder {
  
  build(scene: Scene, decision: InteractivityDecision): InteractionDetails {
    const conversationFlow = this.generateConversationFlow(scene);
    
    return {
      type: "conversation_simulator",
      title: `Practice: ${scene.pageTitle}`,
      interactionSteps: [
        "Read the conversation context and situation",
        "Review what the other person says",
        "Select your response from the available options",
        "See how your response affects the conversation",
        "Continue the dialogue to its conclusion"
      ],
      feedbackRules: {
        correct: "Excellent communication! Your response demonstrates empathy, clarity, and professionalism.",
        incorrect: "This response could be improved. Review the feedback to understand the impact.",
        neutral: "Each response shapes the conversation differently. Consider tone, content, and impact."
      },
      accessibilityNotes: "Use Tab to navigate response options. Press Enter to select your response. Press 'B' to go back one turn. Press 'R' to restart the conversation.",
      imagePrompt: `Conversation simulator interface for ${scene.pageTitle} showing realistic dialogue between two professionals`,
      templateData: {
        conversationFlow: conversationFlow,
        personas: this.generatePersonas(scene),
        responseOptions: this.generateResponseOptions(),
        showFacialExpressions: true,
        enableToneIndicators: true,
        trackEmotionalImpact: true
      }
    };
  }
  
  /**
   * Generate conversation flow
   */
  private generateConversationFlow(scene: Scene) {
    return [
      {
        turn: 1,
        speaker: "other",
        message: "I'm concerned about the current situation and need your guidance.",
        emotion: "concerned",
        contextHint: "This is an opening that requires empathy"
      },
      {
        turn: 2,
        speaker: "learner",
        messageOptions: [
          { id: "opt1", text: "Tell me more about what's concerning you.", tone: "empathetic", effectiveness: "high" },
          { id: "opt2", text: "Let's focus on solutions, not problems.", tone: "directive", effectiveness: "medium" },
          { id: "opt3", text: "I'm sure it's not as bad as you think.", tone: "dismissive", effectiveness: "low" }
        ]
      },
      {
        turn: 3,
        speaker: "other",
        messageVariants: {
          opt1: "Thank you for listening. Here's what's been happening...",
          opt2: "I appreciate that, but I think we need to understand the root cause first.",
          opt3: "Actually, it is quite serious. I feel like you're not taking this seriously."
        }
      }
    ];
  }
  
  /**
   * Generate conversation personas
   */
  private generatePersonas(scene: Scene) {
    return [
      {
        id: "learner",
        name: "You",
        role: "Professional",
        avatar: "professional-avatar.svg",
        description: "You're applying the skills from this learning module"
      },
      {
        id: "colleague",
        name: "Chris",
        role: "Team Member",
        avatar: "colleague-avatar.svg",
        description: "A colleague who needs your support and guidance"
      }
    ];
  }
  
  /**
   * Generate response options template
   */
  private generateResponseOptions() {
    return {
      empathetic: [
        "I understand this is challenging for you.",
        "Tell me more about how this is affecting you.",
        "Let's work through this together."
      ],
      directive: [
        "Here's what we need to do next.",
        "Let's focus on the action plan.",
        "We should address this systematically."
      ],
      supportive: [
        "I'm here to help you through this.",
        "We'll find a solution that works.",
        "You have the skills to handle this."
      ]
    };
  }
}

export default ConversationSimulatorBuilder;


