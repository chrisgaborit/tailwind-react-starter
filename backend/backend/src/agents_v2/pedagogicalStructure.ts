// backend/src/agents_v2/pedagogicalStructure.ts
// Proper instructional design structure following Gagné's 9 Events

export type InstructionalPhase = 
  | "Welcome" 
  | "Teach" 
  | "Practice" 
  | "Apply" 
  | "Assess" 
  | "Summary";

export interface LearningObjective {
  id: string;
  objective: string;
  bloomLevel: "Remember" | "Understand" | "Apply" | "Analyze" | "Evaluate" | "Create";
  requiresTeaching: boolean;
  requiresPractice: boolean;
  requiresApplication: boolean;
  requiresAssessment: boolean;
}

export interface PhaseTemplate {
  phase: InstructionalPhase;
  purpose: string;
  typicalScenes: string[];
  pedagogicalFunction: string;
  gagneStep: string;
  sceneCount: number;
}

export const INSTRUCTIONAL_PHASES: PhaseTemplate[] = [
  {
    phase: "Welcome",
    purpose: "Gain attention, create relevance, and build motivation",
    typicalScenes: [
      "Welcome / Hook",
      "Course introduction video or visual metaphor", 
      "Learning Outcomes (what, why, how long, benefit to learner)",
      "Optional: 'What's in it for me?' / workplace link"
    ],
    pedagogicalFunction: "Activate curiosity",
    gagneStep: "Gagné Step 1 & 2",
    sceneCount: 2
  },
  {
    phase: "Teach",
    purpose: "Introduce new concepts or skills",
    typicalScenes: [
      "Concept Explanation (definition, model, framework)",
      "Skill Demonstration (step-by-step or example)",
      "Principle Illustration (why it matters, underlying logic)"
    ],
    pedagogicalFunction: "Build cognitive understanding through explanation and example",
    gagneStep: "Gagné Step 4: Present content",
    sceneCount: 0 // Will be calculated based on learning objectives
  },
  {
    phase: "Practice",
    purpose: "Reinforce recall and understanding through interaction",
    typicalScenes: [
      "Click-to-reveal (concept reinforcement)",
      "Drag-and-drop classification",
      "Match-the-pair / sort-the-sequence",
      "Interactive infographic"
    ],
    pedagogicalFunction: "Encourage retrieval, encoding, and feedback",
    gagneStep: "Gagné Step 5–6: Guide learning and practice",
    sceneCount: 0 // Will be calculated based on learning objectives
  },
  {
    phase: "Apply",
    purpose: "Transfer knowledge to real-world contexts",
    typicalScenes: [
      "Short case vignette or customer story",
      "Branching scenario ('What would you do?')",
      "Simulation of realistic decision-making"
    ],
    pedagogicalFunction: "Apply learning in context; deepen problem-solving",
    gagneStep: "Gagné Step 7: Provide feedback and reinforcement",
    sceneCount: 0 // Will be calculated based on learning objectives
  },
  {
    phase: "Assess",
    purpose: "Verify comprehension and readiness for the next module",
    typicalScenes: [
      "Multiple-choice or true/false",
      "Scenario-based question with rationale feedback",
      "Mini-quiz with results screen"
    ],
    pedagogicalFunction: "Confirm understanding and prepare for transfer",
    gagneStep: "Gagné Step 8–9: Assess & enhance retention",
    sceneCount: 0 // Will be calculated based on learning objectives
  },
  {
    phase: "Summary",
    purpose: "Recap key takeaways and provide reflection",
    typicalScenes: [
      "Recap key takeaways",
      "Reflective question or quote",
      "Next steps or transition"
    ],
    pedagogicalFunction: "Consolidate learning and prepare for transfer",
    gagneStep: "Gagné Step 9: Enhance retention and transfer",
    sceneCount: 2
  }
];

export class PedagogicalStructureBuilder {
  
  /**
   * Build the complete instructional structure based on learning objectives
   */
  buildStructure(
    learningObjectives: string[], 
    duration: number
  ): {
    phases: PhaseTemplate[];
    totalScenes: number;
    sceneDistribution: Record<InstructionalPhase, number>;
  } {
    
    // Analyze learning objectives
    const objectives = this.analyzeObjectives(learningObjectives);
    
    // Calculate scene distribution
    const baseScenes = Math.max(8, Math.floor(duration / 5)); // 5 minutes per scene minimum
    const objectiveScenes = objectives.length * 4; // 4 scenes per objective (teach, practice, apply, assess)
    const totalScenes = Math.max(baseScenes, objectiveScenes + 4); // +4 for welcome and summary
    
    const phases = INSTRUCTIONAL_PHASES.map(phase => {
      let sceneCount = phase.sceneCount;
      
      if (phase.phase === "Teach") {
        sceneCount = objectives.filter(o => o.requiresTeaching).length;
      } else if (phase.phase === "Practice") {
        sceneCount = objectives.filter(o => o.requiresPractice).length;
      } else if (phase.phase === "Apply") {
        sceneCount = objectives.filter(o => o.requiresApplication).length;
      } else if (phase.phase === "Assess") {
        sceneCount = objectives.filter(o => o.requiresAssessment).length;
      }
      
      return { ...phase, sceneCount };
    });
    
    const sceneDistribution = phases.reduce((acc, phase) => {
      acc[phase.phase] = phase.sceneCount;
      return acc;
    }, {} as Record<InstructionalPhase, number>);
    
    return {
      phases,
      totalScenes,
      sceneDistribution
    };
  }
  
  /**
   * Analyze learning objectives to determine required phases
   */
  private analyzeObjectives(objectives: string[]): LearningObjective[] {
    return objectives.map((objective, index) => {
      const bloomLevel = this.determineBloomLevel(objective);
      
      return {
        id: `obj_${index + 1}`,
        objective,
        bloomLevel,
        requiresTeaching: true, // Always need to teach the concept
        requiresPractice: this.requiresPractice(bloomLevel),
        requiresApplication: this.requiresApplication(bloomLevel),
        requiresAssessment: true // Always assess understanding
      };
    });
  }
  
  private determineBloomLevel(objective: string): LearningObjective['bloomLevel'] {
    const obj = objective.toLowerCase();
    
    if (obj.includes('identify') || obj.includes('recognize') || obj.includes('list') || obj.includes('name')) {
      return 'Remember';
    } else if (obj.includes('understand') || obj.includes('explain') || obj.includes('describe') || obj.includes('summarize')) {
      return 'Understand';
    } else if (obj.includes('apply') || obj.includes('use') || obj.includes('demonstrate') || obj.includes('implement')) {
      return 'Apply';
    } else if (obj.includes('analyze') || obj.includes('compare') || obj.includes('contrast') || obj.includes('examine')) {
      return 'Analyze';
    } else if (obj.includes('evaluate') || obj.includes('assess') || obj.includes('judge') || obj.includes('critique')) {
      return 'Evaluate';
    } else if (obj.includes('create') || obj.includes('develop') || obj.includes('design') || obj.includes('construct')) {
      return 'Create';
    } else {
      return 'Understand'; // Default
    }
  }
  
  private requiresPractice(bloomLevel: LearningObjective['bloomLevel']): boolean {
    return ['Remember', 'Understand', 'Apply'].includes(bloomLevel);
  }
  
  private requiresApplication(bloomLevel: LearningObjective['bloomLevel']): boolean {
    return ['Apply', 'Analyze', 'Evaluate', 'Create'].includes(bloomLevel);
  }
  
  /**
   * Get the sequence of phases for storyboard generation
   */
  getPhaseSequence(): InstructionalPhase[] {
    return ['Welcome', 'Teach', 'Practice', 'Apply', 'Assess', 'Summary'];
  }
  
  /**
   * Get interaction types for each phase
   */
  getPhaseInteractions(phase: InstructionalPhase): string[] {
    switch (phase) {
      case 'Welcome':
        return ['None']; // No interactions in welcome
      case 'Teach':
        return ['None']; // Pure teaching content
      case 'Practice':
        return ['Click-to-Reveal', 'DragAndDrop-Matching', 'DragAndDrop-Sequencing'];
      case 'Apply':
        return ['Scenario', 'None']; // Scenarios and case studies
      case 'Assess':
        return ['MCQ', 'Scenario']; // Assessment interactions
      case 'Summary':
        return ['None']; // Pure summary content
      default:
        return ['None'];
    }
  }
}



