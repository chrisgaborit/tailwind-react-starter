/**
 * Pedagogical Pattern Library
 * 
 * This library provides structured templates for creating pedagogically sound content
 * that actually TEACHES rather than just informs.
 */

export interface PedagogicalPattern {
  name: string;
  structure: string[];
  templates: {
    [key: string]: string[];
  };
  forbiddenElements: string[];
  toneGuidance: string;
}

export interface QualityIssue {
  type: 'pedagogical_depth' | 'missing_context' | 'missing_engagement' | 'shallow_content';
  severity: 'high' | 'medium' | 'low';
  message: string;
  fix: string;
}

export const pedagogicalPatterns = {
  TEACH: {
    name: 'Concept Explanation Pattern',
    structure: [
      "WHY_IT_MATTERS",      // Context and relevance
      "CORE_CONCEPT",        // Clear definition  
      "PRINCIPLES",          // Key principles/rules
      "REAL_WORLD_ANCHOR",   // Connection to learner's world
      "REFLECTIVE_PROMPT"    // Cognitive activation
    ],
    templates: {
      WHY_IT_MATTERS: [
        "Before we dive in, let's understand why {topic} matters in your daily work...",
        "Have you ever faced a situation where {topic} made the difference between success and confusion?",
        "In today's workplace, {topic} is critical because it directly impacts {outcome}...",
        "Think about your last project - how did {topic} influence the results?"
      ],
      CORE_CONCEPT: [
        "{concept} is essentially {simple_definition} - think of it as {analogy}",
        "At its heart, {concept} means {definition}. It's like {metaphor}",
        "When we talk about {concept}, we're referring to {clear_explanation}",
        "{concept} is the practice of {action_oriented_definition}"
      ],
      PRINCIPLES: [
        "Here are the key principles that make {topic} effective:",
        "Three core principles guide successful {topic}:",
        "The foundation of {topic} rests on these essential elements:",
        "Master these principles, and you'll excel at {topic}:"
      ],
      REAL_WORLD_ANCHOR: [
        "In your role, this means {specific_application}",
        "For example, when you {workplace_scenario}, {concept} helps you {benefit}",
        "Consider how this applies to {common_situation} in your department",
        "Picture yourself in this scenario: {realistic_example}"
      ],
      REFLECTIVE_PROMPT: [
        "Think about a time when {concept} affected your work - what would you do differently now?",
        "Ask yourself: How would I apply this principle in my current role?",
        "Consider: What's one way this could change my approach to {workplace_task}?",
        "Reflect: Where have you seen {concept} succeed or fail in your experience?"
      ]
    },
    forbiddenElements: [
      "Don't just state facts without context",
      "Avoid passive voice - use 'you' and 'your'",
      "No standalone statements without explanation",
      "Avoid corporate jargon without explanation",
      "Don't assume prior knowledge"
    ],
    toneGuidance: "Conversational, supportive, and practical - like a coach explaining concepts to a colleague"
  },
  
  EXAMPLE: {
    name: 'Case Study Pattern',
    structure: [
      "CHARACTER_CONTEXT",   // Who, what situation
      "CHALLENGE_PRESENTED", // The dilemma or opportunity
      "DECISION_POINT",      // Critical choice moment
      "OUTCOME_SHOWN",       // Result of approach
      "LESSON_HIGHLIGHTED"   // Explicit learning takeaway
    ],
    templates: {
      CHARACTER_CONTEXT: [
        "Meet {character_name}, a {role} at {company}. They're facing {situation}...",
        "Consider {character_name}, who works as a {role} and recently encountered {challenge}",
        "Let's follow {character_name}, a {role} dealing with {workplace_scenario}",
        "{character_name} is a {role} who found themselves in {situation_description}"
      ],
      CHALLENGE_PRESENTED: [
        "The challenge: {specific_problem}. This created {consequences}",
        "Here's the dilemma: {problem_description}. The stakes were {impact}",
        "The situation: {challenge_details}. This affected {who_what_impacted}",
        "Faced with {challenge}, {character_name} needed to {required_action}"
      ],
      DECISION_POINT: [
        "{character_name} had to choose between {option_a} and {option_b}",
        "At this critical moment, {character_name} could {choice_1} or {choice_2}",
        "The decision point: {character_name} needed to {decision_required}",
        "Faced with this choice, {character_name} considered {options}"
      ],
      OUTCOME_SHOWN: [
        "The result: {outcome_description}. This led to {consequences}",
        "What happened: {result_details}. The impact was {effects}",
        "The outcome: {character_name} chose {decision} and {results}",
        "As a result: {outcome_summary} which {impact_on_others}"
      ],
      LESSON_HIGHLIGHTED: [
        "The key lesson: {main_learning_point}. This shows us {broader_principle}",
        "What we learn: {takeaway}. This principle applies when {application_scenario}",
        "The takeaway: {lesson}. Remember this when {when_to_apply}",
        "Key insight: {learning}. This teaches us that {broader_truth}"
      ]
    },
    forbiddenElements: [
      "Don't make characters perfect - show real struggles",
      "Avoid unrealistic scenarios that don't match audience experience",
      "No generic outcomes without specific details",
      "Don't skip the decision-making process",
      "Avoid stories without clear learning points"
    ],
    toneGuidance: "Narrative and engaging - like telling a story that your colleague experienced"
  },

  PRACTICE: {
    name: 'Application Practice Pattern',
    structure: [
      "SCENARIO_SETUP",      // Realistic situation
      "SKILL_APPLICATION",   // What to practice
      "GUIDANCE_PROVIDED",   // Support during practice
      "FEEDBACK_MECHANISM",  // How to know if doing well
      "REFLECTION_SPACE"     // Processing the experience
    ],
    templates: {
      SCENARIO_SETUP: [
        "Now let's practice. Imagine you're {role} and {situation_arises}",
        "Here's your chance to apply this. You're {character_role} facing {practice_scenario}",
        "Practice time: You're {position} and need to {action_required}",
        "Your turn: As {role}, you encounter {realistic_situation}"
      ],
      SKILL_APPLICATION: [
        "Your task: {specific_practice_activity}. Use the {concept} we just covered",
        "Apply the {skill} by {action_required}. Remember the {key_principles}",
        "Practice {technique} in this scenario: {practice_description}",
        "Now use {method} to {achieve_outcome}. Think about {considerations}"
      ],
      GUIDANCE_PROVIDED: [
        "Remember: {key_principle} is crucial here",
        "Hint: Consider {guidance_point} when making your choice",
        "Keep in mind: {important_factor} will influence your success",
        "As you practice, remember {essential_element} from our discussion"
      ],
      FEEDBACK_MECHANISM: [
        "You'll know you're on track when {success_indicator}",
        "Signs of success: {positive_outcomes}",
        "If you're struggling, consider {helpful_hint}",
        "Good practice looks like {desired_behavior}"
      ],
      REFLECTION_SPACE: [
        "After practicing, reflect: What felt natural? What was challenging?",
        "Think about: How did this practice connect to your real work?",
        "Consider: What would you do differently next time?",
        "Ask yourself: How confident do you feel applying this skill?"
      ]
    },
    forbiddenElements: [
      "Don't create unrealistic practice scenarios",
      "Avoid practice without clear success criteria",
      "No practice without reflection opportunity",
      "Don't skip the guidance and support elements",
      "Avoid abstract practice that doesn't connect to real work"
    ],
    toneGuidance: "Supportive and encouraging - like a mentor guiding hands-on learning"
  },

  ASSESSMENT: {
    name: 'Knowledge Check Pattern',
    structure: [
      "CONTEXT_REMINDER",    // Brief context setting
      "SKILL_DEMONSTRATION", // What they need to show
      "REALISTIC_SCENARIO",  // Authentic assessment context
      "CRITERIA_CLARITY",    // Clear success standards
      "FEEDBACK_OPPORTUNITY" // Learning from results
    ],
    templates: {
      CONTEXT_REMINDER: [
        "Let's check your understanding. Remember, {concept} is about {definition}",
        "Time to demonstrate what you've learned about {topic}",
        "Here's your chance to show how well you understand {concept}",
        "Let's see how you'd apply {skill} in a real situation"
      ],
      SKILL_DEMONSTRATION: [
        "Demonstrate your knowledge by {specific_assessment_task}",
        "Show your understanding by {assessment_activity}",
        "Prove your mastery through {demonstration_required}",
        "Apply your learning by {practical_application}"
      ],
      REALISTIC_SCENARIO: [
        "In this realistic scenario: {assessment_situation}",
        "Picture this workplace situation: {realistic_context}",
        "Here's what you might actually face: {authentic_scenario}",
        "Consider this real-world challenge: {practical_situation}"
      ],
      CRITERIA_CLARITY: [
        "Success means: {clear_success_criteria}",
        "You'll demonstrate mastery by: {specific_behaviors}",
        "The key indicators are: {measurable_outcomes}",
        "Look for: {observable_evidence} of understanding"
      ],
      FEEDBACK_OPPORTUNITY: [
        "After this assessment, reflect on: What did you learn about your understanding?",
        "Consider: How does this connect to your real work challenges?",
        "Think about: What areas would you like to explore further?",
        "Ask yourself: How will you apply this knowledge going forward?"
      ]
    },
    forbiddenElements: [
      "Don't create trick questions or gotcha moments",
      "Avoid assessments that don't connect to real work",
      "No assessment without clear success criteria",
      "Don't skip the learning opportunity from feedback",
      "Avoid abstract assessments that feel like school tests"
    ],
    toneGuidance: "Supportive and constructive - like a coach checking progress, not testing"
  }
};

/**
 * Pedagogical Quality Validator
 * Checks content for pedagogical depth and teaching effectiveness
 */
export const pedagogicalQualityAgent = {
  validateTeachingDepth(scene: any): QualityIssue[] {
    const issues: QualityIssue[] = [];
    const content = (scene.content || '') + ' ' + (scene.voiceover_script || '') + ' ' + (scene.narrationScript || '');
    
    // Check for shallow declarative statements
    if (this.isJustStatements(content)) {
      issues.push({
        type: 'pedagogical_depth',
        severity: 'high',
        message: 'Scene contains statements without teaching depth',
        fix: 'Add context, examples, and reflective elements'
      });
    }
    
    // Check for missing "why"
    if (!this.hasWhyItMatters(content)) {
      issues.push({
        type: 'missing_context', 
        severity: 'high',
        message: 'No explanation of why this matters to learners',
        fix: 'Add relevance and workplace context'
      });
    }
    
    // Check for reflective prompts
    if (!this.hasReflectivePrompt(content)) {
      issues.push({
        type: 'missing_engagement',
        severity: 'medium', 
        message: 'No cognitive activation or reflection',
        fix: 'Add "Think about..." or "Ask yourself..." prompt'
      });
    }

    // Check for real-world connections
    if (!this.hasRealWorldConnection(content)) {
      issues.push({
        type: 'shallow_content',
        severity: 'medium',
        message: 'Content lacks real-world application',
        fix: 'Add workplace examples and practical applications'
      });
    }
    
    return issues;
  },
  
  private isJustStatements(content: string): boolean {
    // Detect if content is just declarative statements without teaching
    const statementPatterns = [
      /should\s+be/g,
      /must\s+be/g, 
      /is\s+important/g,
      /ensures\s+that/g,
      /helps\s+to/g,
      /provides\s+[^.]*$/g
    ];
    
    const hasTeachingPatterns = content.includes('Think about') || 
                               content.includes('Ask yourself') ||
                               content.includes('For example') ||
                               content.includes('Why this matters') ||
                               content.includes('Consider') ||
                               content.includes('Imagine');
    
    const statementCount = statementPatterns.reduce((count, pattern) => {
      const matches = content.match(pattern);
      return count + (matches ? matches.length : 0);
    }, 0);
    
    return statementCount >= 2 && !hasTeachingPatterns;
  },

  private hasWhyItMatters(content: string): boolean {
    const whyPatterns = [
      /why.*matters/i,
      /important because/i,
      /critical for/i,
      /essential to/i,
      /helps you/i,
      /enables you/i,
      /allows you/i
    ];
    
    return whyPatterns.some(pattern => pattern.test(content));
  },

  private hasReflectivePrompt(content: string): boolean {
    const reflectivePatterns = [
      /think about/i,
      /ask yourself/i,
      /consider/i,
      /reflect on/i,
      /imagine/i,
      /what would you/i,
      /how would you/i
    ];
    
    return reflectivePatterns.some(pattern => pattern.test(content));
  },

  private hasRealWorldConnection(content: string): boolean {
    const realWorldPatterns = [
      /in your role/i,
      /at work/i,
      /in the workplace/i,
      /your team/i,
      /your organization/i,
      /for example/i,
      /such as/i,
      /like when/i
    ];
    
    return realWorldPatterns.some(pattern => pattern.test(content));
  },

  /**
   * Generate pedagogical instructions for a segment
   */
  generatePedagogicalInstructions(segmentType: string, learningObjective: string, audience: string): any {
    const pattern = pedagogicalPatterns[segmentType as keyof typeof pedagogicalPatterns];
    
    if (!pattern) {
      return {
        pattern: segmentType,
        required_elements: ['Ensure content is engaging and relevant'],
        forbidden_elements: ['Avoid boring or irrelevant content'],
        tone_guidance: 'Professional and clear'
      };
    }

    return {
      pattern: segmentType,
      required_elements: [
        `Use the ${pattern.name} structure: ${pattern.structure.join(', ')}`,
        ...pattern.structure.map(element => {
          const templates = pattern.templates[element];
          return templates ? `Include ${element.toLowerCase().replace(/_/g, ' ')} using phrases like: "${templates[0]}"` : '';
        }).filter(Boolean)
      ],
      forbidden_elements: pattern.forbiddenElements,
      tone_guidance: pattern.toneGuidance,
      templates: pattern.templates
    };
  }
};
