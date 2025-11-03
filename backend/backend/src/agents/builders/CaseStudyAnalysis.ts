// backend/src/agents/builders/CaseStudyAnalysis.ts
import { Scene } from '../../agents_v2/types';
import { InteractivityDecision, InteractionDetails } from '../../types/storyboardTypes';

/**
 * Case Study Analysis Builder
 * Creates real-world case analysis with guided questions and expert comparison
 */
export class CaseStudyAnalysisBuilder {
  
  build(scene: Scene, decision: InteractivityDecision): InteractionDetails {
    const caseStudy = this.generateCaseStudy(scene);
    const analysisQuestions = this.generateAnalysisQuestions(scene);
    
    return {
      type: "case_study_analysis",
      title: `Analyze: ${scene.pageTitle}`,
      interactionSteps: [
        "Read the case study carefully, noting key details",
        "Answer the analysis questions thoughtfully",
        "Submit your analysis for comparison",
        "Review expert analysis and compare with your responses",
        "Identify gaps and insights for improvement"
      ],
      feedbackRules: {
        correct: "Strong analysis! Your thinking aligns with expert approaches and demonstrates deep understanding.",
        incorrect: "Your analysis has some gaps. Review the expert perspective to refine your approach.",
        neutral: "Case analysis is subjective. Focus on applying the frameworks and principles you've learned."
      },
      accessibilityNotes: "Use Tab to navigate questions. Type your analysis in text areas. Press Ctrl+Enter to submit. Press 'E' to toggle expert analysis view.",
      imagePrompt: `Case study analysis interface for ${scene.pageTitle} showing professional case documentation and analysis workspace`,
      templateData: {
        caseStudy: caseStudy,
        analysisQuestions: analysisQuestions,
        expertAnalysis: this.generateExpertAnalysis(scene),
        allowComparison: true,
        showRubric: true,
        enablePeerReview: false
      }
    };
  }
  
  /**
   * Generate case study content
   */
  private generateCaseStudy(scene: Scene) {
    const topic = scene.learningOutcome || scene.pageTitle;
    
    return {
      title: `Real-World Challenge: ${topic}`,
      context: `This case study presents a realistic workplace situation requiring application of ${topic}.`,
      background: "A mid-sized organization is facing a situation that requires careful analysis and decision-making.",
      challenge: `The team must navigate competing priorities and stakeholder expectations while applying ${topic} principles.`,
      keyFacts: [
        "Team of 8 professionals with varying experience levels",
        "Budget constraints of 20% below previous year",
        "Timeline pressure with delivery due in 6 weeks",
        "Multiple stakeholders with different priorities",
        "Regulatory requirements must be met"
      ],
      stakeholders: [
        { name: "Alex", role: "Team Lead", perspective: "Focused on team wellbeing" },
        { name: "Jordan", role: "Project Manager", perspective: "Focused on delivery timeline" },
        { name: "Sam", role: "Executive Sponsor", perspective: "Focused on business outcomes" }
      ]
    };
  }
  
  /**
   * Generate analysis questions
   */
  private generateAnalysisQuestions(scene: Scene) {
    return [
      {
        id: "q1",
        question: "What are the primary challenges in this case?",
        type: "open_ended",
        guidingPoints: ["Consider stakeholder needs", "Identify constraints", "Note competing priorities"],
        expertResponse: "The key challenges are balancing timeline pressure with team capacity while meeting regulatory requirements."
      },
      {
        id: "q2",
        question: "Which principles from the learning content apply here?",
        type: "open_ended",
        guidingPoints: ["Reference specific frameworks", "Connect to learning outcomes", "Show practical application"],
        expertResponse: "The ABC framework applies: Acknowledge constraints, Be transparent with stakeholders, Communicate realistic timelines."
      },
      {
        id: "q3",
        question: "What would be your recommended approach?",
        type: "open_ended",
        guidingPoints: ["Prioritize actions", "Consider impact", "Show reasoning"],
        expertResponse: "Recommend phased delivery: critical features first, then iterative improvements. This balances timeline, quality, and team wellbeing."
      }
    ];
  }
  
  /**
   * Generate expert analysis
   */
  private generateExpertAnalysis(scene: Scene) {
    return {
      summary: "This case requires balancing multiple competing priorities using systematic analysis.",
      keyInsights: [
        "Stakeholder alignment is critical before proceeding",
        "Resource constraints require creative problem-solving",
        "Transparent communication prevents scope creep"
      ],
      recommendedApproach: "Use a phased delivery strategy with clear milestones and regular stakeholder check-ins",
      commonMistakes: [
        "Overpromising on timeline to please stakeholders",
        "Ignoring team capacity constraints",
        "Failing to document decisions and rationale"
      ],
      furtherReading: [
        "Framework for managing competing priorities",
        "Stakeholder communication best practices"
      ]
    };
  }
}

export default CaseStudyAnalysisBuilder;


