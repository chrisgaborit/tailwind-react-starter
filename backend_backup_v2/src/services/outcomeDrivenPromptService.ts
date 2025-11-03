/**
 * Outcome-Driven Prompt Service
 * 
 * Enhances existing prompt generation with Learn-See-Do-Apply framework integration:
 * - Injects learning outcomes, business impact, and category into every agent prompt
 * - Provides phase-specific instructions for each scene generation
 * - Ensures specialists receive current phase and targeted learning outcome references
 * - Requires branching scenarios for APPLY phase that touch all outcomes
 */

import { StoryboardModule, LearningOutcome, PedagogyPhase, ProjectMetadata } from '../../types';

export interface OutcomeDrivenPromptArgs {
  formData: Record<string, any>;
  learningOutcomes?: LearningOutcome[];
  projectMetadata?: ProjectMetadata;
  currentPhase?: PedagogyPhase;
  targetedOutcomes?: string[]; // array of LO ids for current scene
  options?: {
    aiModel?: string;
    idMethod?: string;
    ragContext?: string;
    durationMins?: number;
  };
}

export interface PhaseSpecificInstructions {
  phase: PedagogyPhase;
  objectives: string[];
  contentGuidelines: string[];
  interactionRequirements: string[];
  assessmentRules: string[];
  characterGuidelines: string[];
}

export class OutcomeDrivenPromptService {
  private readonly LEADERSHIP_CATEGORIES = ['Leadership', 'Soft Skills'];

  /**
   * Main entry point: builds enhanced prompts with Learn-See-Do-Apply framework
   */
  public buildOutcomeDrivenPrompts(args: OutcomeDrivenPromptArgs): {
    systemPrompt: string;
    userPrompt: string;
    phaseInstructions?: PhaseSpecificInstructions;
  } {
    const { formData, learningOutcomes, projectMetadata, currentPhase, targetedOutcomes, options } = args;
    
    // Check if this is a Leadership/Soft Skills module
    const category = projectMetadata?.category || formData.moduleType || 'Unknown';
    const isLeadershipModule = this.LEADERSHIP_CATEGORIES.includes(category);

    if (!isLeadershipModule) {
      // Return standard prompts for non-leadership modules
      return this.buildStandardPrompts(args);
    }

    // Build enhanced prompts for Leadership/Soft Skills modules
    const systemPrompt = this.buildEnhancedSystemPrompt(learningOutcomes, projectMetadata);
    const userPrompt = this.buildEnhancedUserPrompt(args);
    const phaseInstructions = currentPhase ? this.getPhaseSpecificInstructions(currentPhase, targetedOutcomes) : undefined;

    return {
      systemPrompt,
      userPrompt,
      phaseInstructions
    };
  }

  /**
   * Build enhanced system prompt with framework integration
   */
  private buildEnhancedSystemPrompt(
    learningOutcomes?: LearningOutcome[], 
    projectMetadata?: ProjectMetadata
  ): string {
    const basePrompt = [
      "You are a senior Learning Experience Designer producing professional eLearning storyboards using the Outcome-Driven Learn-See-Do-Apply framework.",
      "Output MUST be valid JSON matching the provided schema. Do NOT include markdown fences or commentary.",
      "Optimise for AI production: extreme specificity, semantic labels, exact copy, interactivity logic, xAPI hints, accessibility, timing, style, media prompts.",
    ];

    if (learningOutcomes && learningOutcomes.length > 0) {
      basePrompt.push(
        "",
        "LEARNING OUTCOMES FOUNDATION:",
        "Every scene must directly support one or more of these measurable learning outcomes:",
        ...learningOutcomes.map(lo => `• ${lo.verb.toUpperCase()}: ${lo.text}`)
      );
    }

    if (projectMetadata?.businessImpact) {
      basePrompt.push(
        "",
        "BUSINESS IMPACT FOCUS:",
        `This module addresses: ${projectMetadata.businessImpact}`,
        "Ensure business relevance is referenced in early learner scenes (Scenes 3-4)."
      );
    }

    basePrompt.push(
      "",
      "LEARN-SEE-DO-APPLY FRAMEWORK RULES:",
      "• LEARN: Teach concepts concisely; answer what/why",
      "• SEE: Show annotated examples with consistent characters (Alex, Jordan, Sarah Chen)",
      "• DO: Provide guided then independent practice with rich feedback",
      "• APPLY: Create capstone branching scenarios synthesizing all outcomes",
      "",
      "SEQUENCE ENFORCEMENT:",
      "• Internal pages (TOC + Pronunciations) must come first",
      "• Scene 3 (first learner scene) gets templateType: 'LEARNER_START'",
      "• No assessment items in LEARN/SEE phases",
      "• Progressive complexity: DO/APPLY must escalate (guided → independent; low → high ambiguity)",
      "",
      "CONTENT ARCHITECTURE:",
      "• Concept Limit: Max 3-5 core concepts for ~20 minutes",
      "• No Redundant Re-listing: Introduce framework once in LEARN; apply it in later phases",
      "• Character Consistency: Use established characters (Alex, Jordan, Sarah Chen)",
      "• Feedback Quality: Practice scenes must include explanatory feedback ('why', not just correct/incorrect)"
    );

    return basePrompt.join("\n");
  }

  /**
   * Build enhanced user prompt with framework context
   */
  private buildEnhancedUserPrompt(args: OutcomeDrivenPromptArgs): string {
    const { formData, learningOutcomes, projectMetadata, currentPhase, targetedOutcomes, options } = args;
    
    const {
      moduleName,
      moduleType,
      complexityLevel,
      tone,
      outputLanguage,
      organisationName,
      targetAudience,
      fonts,
      colours,
      logoUrl,
      content,
      brandGuidelines,
    } = formData;

    const idMethod = options?.idMethod || "Learn-See-Do-Apply Framework";
    const duration = options?.durationMins ?? 20;
    const rag = options?.ragContext?.trim();

    const brand = {
      name: organisationName || "Client",
      colours: (colours || "").split(",").map((s: string) => s.trim()).filter(Boolean),
      fonts: (fonts || "").split(",").map((s: string) => s.trim()).filter(Boolean),
      logoUrl: logoUrl || undefined,
      tone: tone || "Professional & Clear",
    };

    const instruction = [
      "Create a complete storyboard module using the Learn-See-Do-Apply framework.",
      "Follow the chosen instructional design process:",
      `• ID Method: ${idMethod}`,
      "Respect the requested complexity level; include realistic interactivities and knowledge checks.",
      "VOICEOVER must be full, natural, and paced for narration—not bullet summaries.",
      "For interactivities: provide user flows, scoring, completion logic, and xAPI logging hints.",
      "For visuals: provide media prompts + visual composition + alt text.",
      "Accessibility: include captioning, focus order, and contrast notes.",
      "Timing: add estimatedTimeSec per scene; total should align with requested duration.",
      "Style: align with brand colours/fonts; call out CTAs and highlighted elements.",
    ];

    // Add phase-specific instructions if current phase is specified
    if (currentPhase && targetedOutcomes) {
      const phaseInstructions = this.getPhaseSpecificInstructions(currentPhase, targetedOutcomes);
      instruction.push(
        "",
        `CURRENT PHASE: ${currentPhase.toUpperCase()}`,
        ...phaseInstructions.objectives,
        "",
        "PHASE-SPECIFIC REQUIREMENTS:",
        ...phaseInstructions.contentGuidelines,
        ...phaseInstructions.interactionRequirements,
        ...phaseInstructions.assessmentRules
      );
    }

    // Add learning outcomes context
    if (learningOutcomes && learningOutcomes.length > 0) {
      instruction.push(
        "",
        "LEARNING OUTCOMES TO SUPPORT:",
        ...learningOutcomes.map(lo => `• ${lo.verb.toUpperCase()}: ${lo.text}`)
      );
    }

    // Add business impact context
    if (projectMetadata?.businessImpact) {
      instruction.push(
        "",
        "BUSINESS IMPACT TO ADDRESS:",
        projectMetadata.businessImpact
      );
    }

    return JSON.stringify({
      instruction: instruction.join("\n"),
      metadata: {
        moduleName,
        moduleType,
        level: complexityLevel,
        tone,
        language: outputLanguage || "English (UK)",
        targetAudience,
        durationMins: duration,
        brand,
        learningOutcomes: learningOutcomes?.map(lo => ({ id: lo.id, verb: lo.verb, text: lo.text })),
        projectMetadata,
        currentPhase,
        targetedOutcomes
      },
      inputs: {
        sourceContent: content || "",
        brandGuidelines: brandGuidelines || "",
        ragContext: rag || null,
      },
    }, null, 2);
  }

  /**
   * Get phase-specific instructions for scene generation
   */
  private getPhaseSpecificInstructions(
    phase: PedagogyPhase, 
    targetedOutcomes?: string[]
  ): PhaseSpecificInstructions {
    const instructions: Record<PedagogyPhase, PhaseSpecificInstructions> = {
      LEARN: {
        phase: 'LEARN',
        objectives: [
          "Teach core concepts and principles clearly",
          "Answer 'what' and 'why' questions",
          "Establish foundation knowledge"
        ],
        contentGuidelines: [
          "Use clear, concise explanations",
          "Avoid complex scenarios or assessments",
          "Focus on concept introduction and understanding",
          "Include visual aids and examples to support learning"
        ],
        interactionRequirements: [
          "Use simple interactions: Click & Reveal, Tabs, or Accordion",
          "Avoid complex branching or decision-making",
          "Focus on information presentation and concept reinforcement"
        ],
        assessmentRules: [
          "NO knowledge checks or assessments in LEARN phase",
          "Focus on concept introduction only",
          "Save assessment for DO and APPLY phases"
        ],
        characterGuidelines: [
          "Introduce characters (Alex, Jordan, Sarah Chen) as examples",
          "Use characters to illustrate concepts, not complex scenarios",
          "Keep character interactions simple and educational"
        ]
      },
      SEE: {
        phase: 'SEE',
        objectives: [
          "Demonstrate concepts in action",
          "Show 'how' through annotated examples",
          "Provide clear models of correct application"
        ],
        contentGuidelines: [
          "Use detailed, annotated examples",
          "Show step-by-step processes",
          "Highlight key decision points and rationale",
          "Use consistent characters in realistic scenarios"
        ],
        interactionRequirements: [
          "Use interactive examples: Hotspots, Timeline, or Stepper",
          "Allow learners to explore examples at their own pace",
          "Provide clear annotations and explanations"
        ],
        assessmentRules: [
          "NO knowledge checks or assessments in SEE phase",
          "Focus on observation and understanding",
          "Use examples to reinforce learning, not test it"
        ],
        characterGuidelines: [
          "Use established characters (Alex, Jordan, Sarah Chen) in examples",
          "Show characters applying concepts correctly",
          "Provide clear annotations of character actions and decisions"
        ]
      },
      DO: {
        phase: 'DO',
        objectives: [
          "Provide guided practice opportunities",
          "Allow learners to apply concepts with support",
          "Build confidence through structured practice"
        ],
        contentGuidelines: [
          "Start with guided practice, progress to independent practice",
          "Provide immediate, detailed feedback",
          "Include explanatory feedback ('why' not just correct/incorrect)",
          "Escalate complexity within the DO phase"
        ],
        interactionRequirements: [
          "Use practice-focused interactions: Scenario, Drag & Drop, or MCQ",
          "Provide multiple attempts with feedback",
          "Include branching for different practice paths",
          "Ensure feedback explains reasoning"
        ],
        assessmentRules: [
          "Include formative assessments with detailed feedback",
          "Focus on practice and skill building",
          "Provide multiple opportunities for success",
          "Use feedback to guide learning, not just evaluate"
        ],
        characterGuidelines: [
          "Use characters in practice scenarios",
          "Show characters making decisions and receiving feedback",
          "Demonstrate both correct and incorrect approaches with explanations"
        ]
      },
      APPLY: {
        phase: 'APPLY',
        objectives: [
          "Create capstone scenarios synthesizing all outcomes",
          "Challenge learners with complex, realistic situations",
          "Enable transfer to real-world application"
        ],
        contentGuidelines: [
          "Create complex, branching scenarios",
          "Integrate multiple learning outcomes",
          "Present ambiguous, real-world situations",
          "Require synthesis of all learned concepts"
        ],
        interactionRequirements: [
          "Use complex branching scenarios",
          "Include multiple decision points and consequences",
          "Provide comprehensive feedback and reflection opportunities",
          "Allow exploration of different approaches and outcomes"
        ],
        assessmentRules: [
          "Include summative assessments that test all outcomes",
          "Use complex scenarios that require synthesis",
          "Provide comprehensive feedback on performance",
          "Include reflection on learning and application"
        ],
        characterGuidelines: [
          "Use characters in complex, realistic scenarios",
          "Show characters facing challenging situations",
          "Demonstrate transfer of learning to new contexts",
          "Include multiple character perspectives and approaches"
        ]
      }
    };

    return instructions[phase];
  }

  /**
   * Build standard prompts for non-leadership modules
   */
  private buildStandardPrompts(args: OutcomeDrivenPromptArgs): {
    systemPrompt: string;
    userPrompt: string;
  } {
    // Use existing prompt structure for non-leadership modules
    const systemPrompt = [
      "You are a senior Learning Experience Designer producing professional eLearning storyboards.",
      "Output MUST be valid JSON matching the provided schema. Do NOT include markdown fences or commentary.",
      "Optimise for AI production: extreme specificity, semantic labels, exact copy, interactivity logic, xAPI hints, accessibility, timing, style, media prompts.",
    ].join("\n");

    const userPrompt = this.buildEnhancedUserPrompt(args);

    return { systemPrompt, userPrompt };
  }

  /**
   * Generate specialist agent prompts with phase and outcome context
   */
  public buildSpecialistAgentPrompt(
    agentType: 'scoper' | 'narrative' | 'specialist',
    args: OutcomeDrivenPromptArgs
  ): string {
    const { learningOutcomes, projectMetadata, currentPhase, targetedOutcomes } = args;
    
    const baseInstructions = {
      scoper: [
        "You are a Learning Experience Scoper specializing in the Learn-See-Do-Apply framework.",
        "Your role is to define 3-5 measurable learning outcomes using Bloom's taxonomy verbs.",
        "Use this template for each outcome:",
        "By the end of this module, learners will be able to:",
        "1. [VERB] [SPECIFIC SKILL] in/when [CONTEXT]",
        "2. [VERB] [SPECIFIC SKILL] when [SITUATION]", 
        "3. [VERB] [SPECIFIC SKILL] to achieve [RESULT]",
        "",
        "Requirements:",
        "• Use Bloom's taxonomy verbs: remember, understand, apply, analyze, evaluate, create",
        "• Make outcomes specific and measurable",
        "• Include context and situation details",
        "• Ensure outcomes align with business impact"
      ],
      narrative: [
        "You are a Narrative Architect specializing in the Learn-See-Do-Apply framework.",
        "Your role is to create engaging narratives that support learning outcomes across all phases.",
        "Use consistent characters: Alex (experienced professional), Jordan (mid-level manager), Sarah Chen (new team member).",
        "Ensure narratives progress through: LEARN → SEE → DO → APPLY",
        "Create scenarios that directly support the specified learning outcomes."
      ],
      specialist: [
        "You are a Content Specialist working within the Learn-See-Do-Apply framework.",
        `Current phase: ${currentPhase?.toUpperCase() || 'Not specified'}`,
        "Your role is to create content that supports the targeted learning outcomes for this specific phase.",
        "Follow phase-specific guidelines and ensure content aligns with the overall learning progression."
      ]
    };

    let prompt = baseInstructions[agentType].join("\n");

    // Add learning outcomes context
    if (learningOutcomes && learningOutcomes.length > 0) {
      prompt += "\n\nLEARNING OUTCOMES TO SUPPORT:\n";
      learningOutcomes.forEach(lo => {
        prompt += `• ${lo.verb.toUpperCase()}: ${lo.text}\n`;
      });
    }

    // Add business impact context
    if (projectMetadata?.businessImpact) {
      prompt += `\nBUSINESS IMPACT TO ADDRESS:\n${projectMetadata.businessImpact}\n`;
    }

    // Add phase-specific context for specialists
    if (agentType === 'specialist' && currentPhase && targetedOutcomes) {
      const phaseInstructions = this.getPhaseSpecificInstructions(currentPhase, targetedOutcomes);
      prompt += `\nPHASE-SPECIFIC REQUIREMENTS:\n`;
      prompt += phaseInstructions.objectives.join("\n") + "\n";
      prompt += phaseInstructions.contentGuidelines.join("\n") + "\n";
    }

    return prompt;
  }
}

// Export singleton instance
export const outcomeDrivenPromptService = new OutcomeDrivenPromptService();

