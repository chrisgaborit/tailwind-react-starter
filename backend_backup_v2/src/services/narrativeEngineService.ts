// Narrative Engine Service
// Transforms storyboard generation from template-driven to story-driven

interface CharacterArchetype {
  id: string;
  name: string;
  role: string;
  personality: string;
  background: string;
  motivations: string[];
  speakingStyle: string;
  relationshipToProtagonist: string;
}

interface NarrativePattern {
  id: string;
  name: string;
  description: string;
  beats: string[];
  emotionalIntensity: string;
  decisionPoints: number;
}

interface EmotionalBeat {
  id: string;
  name: string;
  description: string;
  required: boolean;
  intensity: 'low' | 'medium' | 'high';
}

// CHARACTER ARCHETYPE SYSTEM
const CHARACTER_ARCHETYPES: Record<string, CharacterArchetype[]> = {
  protagonist: [
    {
      id: "The_New_Manager",
      name: "Sarah Chen",
      role: "New Team Manager",
      personality: "Eager but uncertain, wants to succeed but lacks experience",
      background: "Recently promoted from individual contributor, leading team for first time",
      motivations: ["Prove leadership capability", "Build team trust", "Deliver results"],
      speakingStyle: "Direct but questioning, seeks validation",
      relationshipToProtagonist: "Primary character facing leadership challenges"
    },
    {
      id: "The_Team_Lead",
      name: "Marcus Rodriguez",
      role: "Experienced Team Lead",
      personality: "Confident but overworked, protective of team",
      background: "5+ years leading teams, knows the ropes but struggles with delegation",
      motivations: ["Maintain team performance", "Develop others", "Balance workload"],
      speakingStyle: "Authoritative but supportive, uses team metaphors",
      relationshipToProtagonist: "Experienced peer facing similar challenges"
    },
    {
      id: "The_Specialist",
      name: "Dr. Elena Kim",
      role: "Technical Specialist",
      personality: "Detail-oriented, perfectionist, sometimes impatient",
      background: "Deep technical expertise, new to management responsibilities",
      motivations: ["Maintain quality standards", "Share knowledge", "Earn respect"],
      speakingStyle: "Precise and technical, uses data and examples",
      relationshipToProtagonist: "Expert who needs to communicate complex concepts"
    },
    {
      id: "The_Vigilant_Employee",
      name: "James Thompson",
      role: "Compliance Officer",
      personality: "Methodical, risk-aware, process-focused",
      background: "Years of compliance experience, understands regulations deeply",
      motivations: ["Prevent violations", "Protect organization", "Ensure safety"],
      speakingStyle: "Formal and procedural, cites policies and regulations",
      relationshipToProtagonist: "Guardian who must navigate complex requirements"
    },
    {
      id: "The_Developing_Coach",
      name: "Alex Morgan",
      role: "HR Business Partner",
      personality: "Empathetic, growth-oriented, relationship-focused",
      background: "Transitioning from operational HR to strategic coaching role",
      motivations: ["Develop others", "Build culture", "Drive engagement"],
      speakingStyle: "Warm and encouraging, uses coaching language",
      relationshipToProtagonist: "Guide who helps others grow and develop"
    },
    {
      id: "The_Curious_Learner",
      name: "Priya Patel",
      role: "Learning & Development Specialist",
      personality: "Inquisitive, innovative, learning-focused",
      background: "Passionate about learning design and adult education",
      motivations: ["Create effective learning", "Measure impact", "Innovate approaches"],
      speakingStyle: "Enthusiastic and questioning, uses learning terminology",
      relationshipToProtagonist: "Learning partner who explores new approaches"
    }
  ],
  mentor: [
    {
      id: "The_Experienced_Leader",
      name: "David Chen",
      role: "Senior Vice President",
      personality: "Wise, strategic, patient teacher",
      background: "20+ years leadership experience, has seen it all",
      motivations: ["Develop next generation", "Share wisdom", "Ensure success"],
      speakingStyle: "Stories and metaphors, asks probing questions",
      relationshipToProtagonist: "Wise mentor who provides guidance and perspective"
    },
    {
      id: "The_Subject_Expert",
      name: "Dr. Maria Santos",
      role: "Industry Expert",
      personality: "Knowledgeable, precise, methodical",
      background: "Deep domain expertise, consultant and trainer",
      motivations: ["Share expertise", "Ensure accuracy", "Build capability"],
      speakingStyle: "Clear and structured, uses frameworks and models",
      relationshipToProtagonist: "Expert who provides technical knowledge and frameworks"
    },
    {
      id: "The_Compliance_Officer",
      name: "Robert Kim",
      role: "Chief Compliance Officer",
      personality: "Thorough, risk-conscious, protective",
      background: "Legal and compliance background, understands regulations",
      motivations: ["Ensure compliance", "Protect organization", "Prevent violations"],
      speakingStyle: "Formal and authoritative, cites specific regulations",
      relationshipToProtagonist: "Guardian who ensures proper procedures and compliance"
    },
    {
      id: "The_Master_Coach",
      name: "Lisa Johnson",
      role: "Executive Coach",
      personality: "Insightful, challenging, supportive",
      background: "Certified coach with corporate and individual experience",
      motivations: ["Unlock potential", "Drive performance", "Build relationships"],
      speakingStyle: "Questioning and reflective, uses coaching techniques",
      relationshipToProtagonist: "Coach who helps develop leadership and interpersonal skills"
    },
    {
      id: "The_Technical_Guru",
      name: "Michael Zhang",
      role: "Principal Engineer",
      personality: "Brilliant, innovative, sometimes impatient",
      background: "Technical architect with deep system knowledge",
      motivations: ["Solve complex problems", "Share knowledge", "Drive innovation"],
      speakingStyle: "Technical and direct, uses diagrams and examples",
      relationshipToProtagonist: "Technical mentor who provides deep expertise and guidance"
    }
  ],
  challenge: [
    {
      id: "The_Resistant_Colleague",
      name: "Tom Wilson",
      role: "Senior Team Member",
      personality: "Skeptical, change-resistant, experienced",
      background: "Long-tenured employee who prefers status quo",
      motivations: ["Maintain current processes", "Avoid disruption", "Protect team"],
      speakingStyle: "Defensive and questioning, challenges new approaches",
      relationshipToProtagonist: "Obstacle who resists change and new methods"
    },
    {
      id: "The_Complex_Case",
      name: "The Urgent Project",
      role: "High-Stakes Challenge",
      personality: "Demanding, time-sensitive, high-visibility",
      background: "Critical business initiative with tight deadlines",
      motivations: ["Deliver on time", "Meet quality standards", "Satisfy stakeholders"],
      speakingStyle: "Urgent and demanding, creates pressure",
      relationshipToProtagonist: "Challenge that tests new skills and approaches"
    },
    {
      id: "The_Urgent_Crisis",
      name: "The System Outage",
      role: "Crisis Situation",
      personality: "Urgent, high-pressure, problem-solving focused",
      background: "Critical system failure requiring immediate response",
      motivations: ["Restore service", "Minimize impact", "Prevent recurrence"],
      speakingStyle: "Urgent and direct, focuses on solutions",
      relationshipToProtagonist: "Crisis that requires immediate application of new skills"
    },
    {
      id: "The_Skeptical_Client",
      name: "Jennifer Adams",
      role: "External Client",
      personality: "Demanding, results-focused, relationship-oriented",
      background: "Key client with high expectations and specific requirements",
      motivations: ["Get value", "Maintain relationship", "See results"],
      speakingStyle: "Direct and results-focused, asks tough questions",
      relationshipToProtagonist: "External stakeholder who validates new approaches"
    }
  ]
};

// NARRATIVE PATTERNS
const NARRATIVE_PATTERNS: Record<string, NarrativePattern> = {
  transformation_arc: {
    id: "transformation_arc",
    name: "The Hero's Journey",
    description: "Classic transformation from struggle to mastery",
    beats: [
      "STRUGGLE: Protagonist faces real workplace challenge",
      "LEARNING: Mentor teaches relevant concept/skill", 
      "PRACTICE: Protagonist applies learning in safe scenario",
      "BREAKTHROUGH: Protagonist succeeds with new approach",
      "MASTERY: Protagonist handles complex variation"
    ],
    emotionalIntensity: "high",
    decisionPoints: 3
  },
  problem_solving_arc: {
    id: "problem_solving_arc",
    name: "The Problem-Solving Journey",
    description: "Systematic approach to solving complex problems",
    beats: [
      "CRISIS: Urgent problem emerges",
      "ANALYSIS: Systematic investigation of root causes",
      "SOLUTION: Application of proven methodology",
      "RESULTS: Measurable improvement demonstrated"
    ],
    emotionalIntensity: "medium",
    decisionPoints: 2
  },
  compliance_journey: {
    id: "compliance_journey",
    name: "The Compliance Journey",
    description: "Navigating complex regulations and requirements",
    beats: [
      "AWARENESS: Recognize compliance requirement",
      "UNDERSTANDING: Learn specific regulations and procedures",
      "APPLICATION: Apply knowledge in real scenarios",
      "MASTERY: Handle complex compliance situations"
    ],
    emotionalIntensity: "medium",
    decisionPoints: 2
  },
  leadership_development: {
    id: "leadership_development",
    name: "The Leadership Journey",
    description: "Developing from individual contributor to leader",
    beats: [
      "CHALLENGE: Face leadership situation",
      "REFLECTION: Understand leadership principles",
      "PRACTICE: Apply leadership skills",
      "GROWTH: Handle advanced leadership challenges"
    ],
    emotionalIntensity: "high",
    decisionPoints: 4
  }
};

// EMOTIONAL BEATS
const EMOTIONAL_BEATS: Record<string, EmotionalBeat[]> = {
  compliance: [
    { id: "urgency", name: "Urgency", description: "Create sense of immediate need", required: true, intensity: "high" },
    { id: "vigilance", name: "Vigilance", description: "Build awareness and attention to detail", required: true, intensity: "medium" },
    { id: "prevention", name: "Prevention", description: "Focus on avoiding problems", required: true, intensity: "medium" }
  ],
  leadership: [
    { id: "frustration", name: "Frustration", description: "Show struggle with current approach", required: true, intensity: "high" },
    { id: "insight", name: "Insight", description: "Reveal new understanding", required: true, intensity: "high" },
    { id: "influence", name: "Influence", description: "Demonstrate positive impact on others", required: true, intensity: "high" }
  ],
  technical: [
    { id: "confusion", name: "Confusion", description: "Show complexity and challenge", required: true, intensity: "medium" },
    { id: "clarity", name: "Clarity", description: "Reveal clear understanding", required: true, intensity: "high" },
    { id: "proficiency", name: "Proficiency", description: "Demonstrate mastery", required: true, intensity: "high" }
  ],
  soft_skills: [
    { id: "disconnection", name: "Disconnection", description: "Show relationship challenges", required: true, intensity: "high" },
    { id: "understanding", name: "Understanding", description: "Reveal empathy and insight", required: true, intensity: "high" },
    { id: "connection", name: "Connection", description: "Demonstrate improved relationships", required: true, intensity: "high" }
  ]
};

// INTERACTIVITY UPGRADES
const INTERACTIVITY_UPGRADES = {
  replace_passive: [
    "click_to_reveal",
    "tabbed_content", 
    "static_mcq",
    "information_dump",
    "passive_reading"
  ],
  with_active: [
    "branching_decisions_with_consequences",
    "choose_your_approach_scenarios",
    "progressive_challenge_sequences", 
    "real_time_feedback_loops",
    "scenario_based_choices",
    "consequence_tracking"
  ],
  decision_density: "minimum_1_meaningful_choice_every_3_scenes"
};

// MAIN NARRATIVE ENGINE FUNCTIONS

/**
 * Selects appropriate character archetypes based on Module Type (single classification)
 */
export function selectCharacterArchetypes(
  moduleType: string,
  complexityLevel: string
): {
  protagonist: CharacterArchetype;
  mentor: CharacterArchetype;
  challenge: CharacterArchetype;
} {
  // Selection rules based on Module Type (single classification system)
  const selectionRules: Record<string, string[]> = {
    "Compliance & Ethics": ["The_Vigilant_Employee", "The_Compliance_Officer"],
    "Leadership & Coaching": ["The_New_Manager", "The_Experienced_Leader"],
    "Sales & Customer Service": ["The_Curious_Learner", "The_Subject_Expert"],
    "Technical & Systems": ["The_Specialist", "The_Technical_Guru"],
    "Health & Safety": ["The_Vigilant_Employee", "The_Compliance_Officer"],
    "Onboarding & Culture": ["The_Curious_Learner", "The_Subject_Expert"],
    "Product Knowledge": ["The_Specialist", "The_Technical_Guru"],
    "Professional Skills": ["The_Developing_Coach", "The_Master_Coach"]
  };

  // Get archetype IDs based on Module Type
  const archetypeIds = selectionRules[moduleType] || selectionRules["Leadership & Coaching"];
  console.log(`[DEBUG] Module Type: ${moduleType}, Archetype IDs: ${archetypeIds.join(', ')}`);
  
  // Select protagonist and mentor based on archetype IDs
  const protagonistId = archetypeIds[0]; // First ID is protagonist
  const mentorId = archetypeIds[1]; // Second ID is mentor
  console.log(`[DEBUG] Protagonist ID: ${protagonistId}, Mentor ID: ${mentorId}`);
  
  const protagonist = CHARACTER_ARCHETYPES.protagonist.find(c => 
    c.id === protagonistId
  ) || CHARACTER_ARCHETYPES.protagonist[0];
  
  const mentor = CHARACTER_ARCHETYPES.mentor.find(c => 
    c.id === mentorId
  ) || CHARACTER_ARCHETYPES.mentor[0];

  // Select appropriate challenge based on Module Type
  const challengeSelection: Record<string, string> = {
    "Compliance & Ethics": "The_Urgent_Crisis",
    "Leadership & Coaching": "The_Resistant_Colleague", 
    "Sales & Customer Service": "The_Skeptical_Client",
    "Technical & Systems": "The_Complex_Case",
    "Health & Safety": "The_Urgent_Crisis",
    "Onboarding & Culture": "The_Complex_Case",
    "Product Knowledge": "The_Complex_Case",
    "Professional Skills": "The_Resistant_Colleague"
  };

  const challengeId = challengeSelection[moduleType] || "The_Complex_Case";
  const challenge = CHARACTER_ARCHETYPES.challenge.find(c => c.id === challengeId) || 
                   CHARACTER_ARCHETYPES.challenge[0];

  return { protagonist, mentor, challenge };
}

/**
 * Selects appropriate narrative pattern based on Module Type (single classification)
 */
export function selectNarrativePattern(
  moduleType: string,
  complexityLevel: string
): NarrativePattern {
  // Pattern selection logic based on Module Type
  if (moduleType === "Compliance & Ethics" || moduleType === "Health & Safety") {
    return NARRATIVE_PATTERNS.compliance_journey;
  } else if (moduleType === "Leadership & Coaching") {
    return NARRATIVE_PATTERNS.leadership_development;
  } else if (moduleType === "Technical & Systems" || moduleType === "Product Knowledge") {
    return NARRATIVE_PATTERNS.problem_solving_arc;
  } else {
    return NARRATIVE_PATTERNS.transformation_arc;
  }
}

/**
 * Gets emotional beats for specific Module Type
 */
export function getEmotionalBeats(moduleType: string): EmotionalBeat[] {
  const topicMap: Record<string, string> = {
    "Compliance & Ethics": "compliance",
    "Health & Safety": "compliance",
    "Leadership & Coaching": "leadership", 
    "Technical & Systems": "technical",
    "Product Knowledge": "technical",
    "Sales & Customer Service": "soft_skills",
    "Onboarding & Culture": "soft_skills",
    "Professional Skills": "soft_skills"
  };
  
  const beatType = topicMap[moduleType] || "soft_skills";
  return EMOTIONAL_BEATS[beatType] || EMOTIONAL_BEATS.soft_skills;
}

/**
 * Generates narrative-driven scene content
 */
export function generateNarrativeScene(
  sceneIndex: number,
  totalScenes: number,
  characters: { protagonist: CharacterArchetype; mentor: CharacterArchetype; challenge: CharacterArchetype },
  pattern: NarrativePattern,
  emotionalBeats: EmotionalBeat[],
  businessContext: any,
  learningObjective: string
): {
  sceneTitle: string;
  narrativeHook: string;
  characterDialogue: string;
  emotionalBeat: string;
  decisionPoint: string;
  consequence: string;
} {
  const beatIndex = Math.floor((sceneIndex / totalScenes) * pattern.beats.length);
  const currentBeat = pattern.beats[beatIndex];
  const emotionalBeat = emotionalBeats[beatIndex % emotionalBeats.length];

  // Generate scene-specific content
  const sceneTitle = `${currentBeat.split(':')[0]}: ${characters.protagonist.name}'s Challenge`;
  
  const narrativeHook = `In this scene, ${characters.protagonist.name} (${characters.protagonist.role}) faces a critical moment: ${currentBeat.split(':')[1].trim()}. The situation requires immediate action and the stakes are high.`;

  const characterDialogue = generateCharacterDialogue(
    characters,
    currentBeat,
    emotionalBeat,
    businessContext
  );

  const decisionPoint = generateDecisionPoint(
    characters,
    currentBeat,
    businessContext,
    learningObjective
  );

  const consequence = generateConsequence(
    decisionPoint,
    characters,
    businessContext
  );

  return {
    sceneTitle,
    narrativeHook,
    characterDialogue,
    emotionalBeat: emotionalBeat.description,
    decisionPoint,
    consequence
  };
}

/**
 * Generates character dialogue based on context
 */
function generateCharacterDialogue(
  characters: { protagonist: CharacterArchetype; mentor: CharacterArchetype; challenge: CharacterArchetype },
  currentBeat: string,
  emotionalBeat: EmotionalBeat,
  businessContext: any
): string {
  const { protagonist, mentor, challenge } = characters;
  
  return `
**${protagonist.name} (${protagonist.role}):** "${protagonist.speakingStyle} I need to handle this situation, but I'm not sure about the best approach. The pressure is really on here."

**${mentor.name} (${mentor.role}):** "${mentor.speakingStyle} I understand your concern. Let me share what I've learned from similar situations. The key is to focus on ${emotionalBeat.name.toLowerCase()} - ${emotionalBeat.description}."

**${challenge.name} (${challenge.role}):** "${challenge.speakingStyle} ${challenge.motivations[0]}. We need to see results, and we need them now. What's your plan?"
  `.trim();
}

/**
 * Generates decision point for interactive engagement
 */
function generateDecisionPoint(
  characters: { protagonist: CharacterArchetype; mentor: CharacterArchetype; challenge: CharacterArchetype },
  currentBeat: string,
  businessContext: any,
  learningObjective: string
): string {
  return `
**Decision Point:** ${characters.protagonist.name} must choose how to respond to this challenge. The decision will impact the team's performance and the business outcome.

**Options:**
1. **Take immediate action** - Respond quickly but risk making mistakes
2. **Seek more information** - Gather additional context before deciding  
3. **Collaborate with the team** - Involve others in the decision-making process
4. **Apply the new approach** - Use the learning from this module

**Consider:** How will this choice align with ${learningObjective} and drive the ${businessContext.targetImprovement}% improvement goal?
  `.trim();
}

/**
 * Generates consequence based on decision
 */
function generateConsequence(
  decisionPoint: string,
  characters: { protagonist: CharacterArchetype; mentor: CharacterArchetype; challenge: CharacterArchetype },
  businessContext: any
): string {
  return `
**Consequence Tracking:**
- **Team Performance Impact:** Your decision will directly affect team productivity
- **Business Metric:** This choice influences the ${businessContext.primaryGoal} goal
- **Learning Application:** Demonstrates mastery of the new approach
- **Relationship Impact:** Affects trust and collaboration with ${characters.challenge.name}

**Measurement:** This decision will be tracked against the success definition: "${businessContext.successDefinition}"
  `.trim();
}

/**
 * Upgrades interactivity from passive to active
 */
export function upgradeInteractivity(
  currentInteractivity: string,
  narrativeContext: any
): string {
  const upgrades = INTERACTIVITY_UPGRADES;
  
  // Replace passive elements with active ones
  let upgraded = currentInteractivity;
  
  upgrades.replace_passive.forEach(passive => {
    if (upgraded.includes(passive)) {
      const activeReplacement = upgrades.with_active[Math.floor(Math.random() * upgrades.with_active.length)];
      upgraded = upgraded.replace(passive, activeReplacement);
    }
  });

  // Ensure decision density
  if (!upgraded.includes("decision") && !upgraded.includes("choice")) {
    upgraded += "\n\n**Interactive Decision:** " + upgrades.with_active[0];
  }

  return upgraded;
}

export {
  CHARACTER_ARCHETYPES,
  NARRATIVE_PATTERNS,
  EMOTIONAL_BEATS,
  INTERACTIVITY_UPGRADES
};
