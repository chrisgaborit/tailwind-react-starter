// Archetype Rules Service
// Enforces archetype-specific pedagogical rules and content guidelines

// ARCHETYPE MAPPING FOR NEW MODULE TYPES
export const ARCHETYPE_MAPPING: Record<string, string> = {
  "Compliance & Ethics": "compliance_policy",
  "Leadership & Coaching": "scenario_based", 
  "Sales & Customer Service": "scenario_based",
  "Technical & Systems": "software_tutorial",
  "Health & Safety": "compliance_policy",
  "Onboarding & Culture": "concept_explainer", 
  "Product Knowledge": "software_tutorial",
  "Professional Skills": "scenario_based"
};

// ARCHETYPE-SPECIFIC RULES
export const ARCHETYPE_RULES: Record<string, {
  tone: string;
  interactions: string[];
  banned: string[];
  required: string[];
  pedagogical_approach: string;
  assessment_style: string;
  narrative_focus: string;
}> = {
  compliance_policy: {
    tone: "formal, clear, authoritative",
    interactions: ["scenario_choices", "policy_application", "case_studies"],
    banned: [], // No banned terms for compliance
    required: ["policy_reference", "clear_consequences", "reporting_procedures"],
    pedagogical_approach: "Rule-based learning with clear right/wrong answers",
    assessment_style: "Policy application with clear correct answers",
    narrative_focus: "Regulatory compliance and risk prevention"
  },
  scenario_based: {
    tone: "conversational, empathetic, practical", 
    interactions: ["character_dilemmas", "branching_scenarios", "role_plays"],
    banned: ["compliance", "incident", "breach", "violation", "non-compliance", "escalation pathway", "critical incident", "policy violation", "regulatory", "audit", "investigation"],
    required: ["character_development", "progressive_skill_building", "emotional_intelligence", "relationship_building"],
    pedagogical_approach: "Experience-based learning with emotional engagement",
    assessment_style: "Scenario-based choices with emotional intelligence focus",
    narrative_focus: "Character development and interpersonal skills"
  },
  software_tutorial: {
    tone: "clear, step-by-step, practical",
    interactions: ["simulations", "guided_practice", "challenge_tasks"],
    banned: [], // No banned terms for technical
    required: ["step_by_step_instructions", "hands_on_practice", "troubleshooting_guidance"],
    pedagogical_approach: "Procedural learning with guided practice",
    assessment_style: "Performance-based tasks and simulations",
    narrative_focus: "Technical proficiency and system mastery"
  },
  concept_explainer: {
    tone: "engaging, foundational, inspiring", 
    interactions: ["click_to_reveal", "analogies", "practical_examples"],
    banned: [], // No banned terms for onboarding
    required: ["foundational_concepts", "real_world_examples", "progressive_building"],
    pedagogical_approach: "Conceptual understanding with practical application",
    assessment_style: "Understanding checks and concept application",
    narrative_focus: "Learning and cultural integration"
  }
};

/**
 * Gets the archetype for a given Module Type
 */
export function getArchetypeForModuleType(moduleType: string): string {
  return ARCHETYPE_MAPPING[moduleType] || "scenario_based";
}

/**
 * Gets the rules for a given archetype
 */
export function getArchetypeRules(archetype: string) {
  return ARCHETYPE_RULES[archetype] || ARCHETYPE_RULES.scenario_based;
}

/**
 * Gets the rules for a given Module Type
 */
export function getModuleTypeRules(moduleType: string) {
  const archetype = getArchetypeForModuleType(moduleType);
  return getArchetypeRules(archetype);
}

/**
 * Validates content against archetype rules
 */
export function validateContentAgainstArchetype(
  content: string,
  moduleType: string
): {
  valid: boolean;
  violations: string[];
  suggestions: string[];
} {
  const rules = getModuleTypeRules(moduleType);
  const violations: string[] = [];
  const suggestions: string[] = [];

  // Check for banned terms
  const contentLower = content.toLowerCase();
  rules.banned.forEach(term => {
    if (contentLower.includes(term.toLowerCase())) {
      violations.push(`Banned term "${term}" found in ${moduleType} content`);
      suggestions.push(`Replace "${term}" with appropriate ${rules.pedagogical_approach} language`);
    }
  });

  // Check for required elements
  rules.required.forEach(requirement => {
    if (!contentLower.includes(requirement.toLowerCase())) {
      violations.push(`Missing required element "${requirement}" for ${moduleType}`);
      suggestions.push(`Add ${requirement} to align with ${rules.pedagogical_approach}`);
    }
  });

  return {
    valid: violations.length === 0,
    violations,
    suggestions
  };
}

/**
 * Generates archetype-specific prompt guidance
 */
export function generateArchetypePromptGuidance(moduleType: string): string {
  const rules = getModuleTypeRules(moduleType);
  const archetype = getArchetypeForModuleType(moduleType);
  
  return `
ARCHETYPE-SPECIFIC RULES FOR ${moduleType.toUpperCase()}:
- Archetype: ${archetype}
- Tone: ${rules.tone}
- Interactions: ${rules.interactions.join(", ")}
- Pedagogical Approach: ${rules.pedagogical_approach}
- Assessment Style: ${rules.assessment_style}
- Narrative Focus: ${rules.narrative_focus}

${rules.banned.length > 0 ? `BANNED TERMS (DO NOT USE): ${rules.banned.join(", ")}` : ""}
${rules.required.length > 0 ? `REQUIRED ELEMENTS: ${rules.required.join(", ")}` : ""}

CRITICAL: This content must follow ${rules.pedagogical_approach} principles.
  `.trim();
}

/**
 * Enforces archetype rules in scene generation
 */
export function enforceArchetypeRules(
  sceneContent: any,
  moduleType: string
): {
  content: any;
  violations: string[];
  fixed: boolean;
} {
  const rules = getModuleTypeRules(moduleType);
  const violations: string[] = [];
  let content = { ...sceneContent };
  let fixed = false;

  // Check narration script
  if (content.narrationScript) {
    const validation = validateContentAgainstArchetype(content.narrationScript, moduleType);
    if (!validation.valid) {
      violations.push(...validation.violations);
      // Auto-fix: Replace banned terms with appropriate alternatives
      let narration = content.narrationScript;
      rules.banned.forEach(term => {
        const regex = new RegExp(term, 'gi');
        if (regex.test(narration)) {
          const replacement = getArchetypeReplacement(term, rules.pedagogical_approach);
          narration = narration.replace(regex, replacement);
          fixed = true;
        }
      });
      content.narrationScript = narration;
    }
  }

  // Check on-screen text
  if (content.onScreenText?.body_text) {
    content.onScreenText.body_text.forEach((text: string, index: number) => {
      const validation = validateContentAgainstArchetype(text, moduleType);
      if (!validation.valid) {
        violations.push(...validation.violations);
        // Auto-fix: Replace banned terms
        let fixedText = text;
        rules.banned.forEach(term => {
          const regex = new RegExp(term, 'gi');
          if (regex.test(fixedText)) {
            const replacement = getArchetypeReplacement(term, rules.pedagogical_approach);
            fixedText = fixedText.replace(regex, replacement);
            fixed = true;
          }
        });
        content.onScreenText.body_text[index] = fixedText;
      }
    });
  }

  // Check knowledge check content
  if (content.knowledgeCheck?.stem) {
    const validation = validateContentAgainstArchetype(content.knowledgeCheck.stem, moduleType);
    if (!validation.valid) {
      violations.push(...validation.violations);
      // Auto-fix: Replace banned terms
      let stem = content.knowledgeCheck.stem;
      rules.banned.forEach(term => {
        const regex = new RegExp(term, 'gi');
        if (regex.test(stem)) {
          const replacement = getArchetypeReplacement(term, rules.pedagogical_approach);
          stem = stem.replace(regex, replacement);
          fixed = true;
        }
      });
      content.knowledgeCheck.stem = stem;
    }
  }

  return { content, violations, fixed };
}

/**
 * Gets appropriate replacement for banned terms
 */
function getArchetypeReplacement(bannedTerm: string, pedagogicalApproach: string): string {
  const replacements: Record<string, string> = {
    "compliance": "adherence to best practices",
    "incident": "situation",
    "breach": "gap",
    "violation": "area for improvement",
    "non-compliance": "opportunity for growth",
    "escalation pathway": "support process",
    "critical incident": "important situation",
    "policy violation": "learning opportunity",
    "regulatory": "organizational",
    "audit": "review",
    "investigation": "analysis"
  };

  return replacements[bannedTerm.toLowerCase()] || bannedTerm;
}

/**
 * Generates archetype-specific interaction recommendations
 */
export function getInteractionRecommendations(moduleType: string): string[] {
  const rules = getModuleTypeRules(moduleType);
  return rules.interactions;
}

/**
 * Generates archetype-specific tone guidance
 */
export function getToneGuidance(moduleType: string): string {
  const rules = getModuleTypeRules(moduleType);
  return rules.tone;
}

export {
  ARCHETYPE_MAPPING,
  ARCHETYPE_RULES
};












