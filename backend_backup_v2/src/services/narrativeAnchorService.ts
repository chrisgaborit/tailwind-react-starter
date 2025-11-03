// Narrative Anchor Service
// Creates and manages narrative anchors for consistent character development and story cohesion

import OpenAI from "openai";

export interface NarrativeAnchor {
  characterRoster: {
    primary: {
      name: string;
      role: string;
      personality: string;
      background: string;
      motivations: string[];
      speakingStyle: string;
    };
    secondary: Array<{
      name: string;
      role: string;
      personality: string;
      background: string;
      relationshipToPrimary: string;
      speakingStyle: string;
    }>;
  };
  toneOfVoice: {
    overall: string;
    forAudience: string;
    forScenarios: string;
    forAssessments: string;
    examples: string[];
  };
  visualStyleRules: {
    imageStyle: string;
    colorPalette: string[];
    fontGuidelines: string;
    layoutPreferences: string;
    brandIntegration: string;
  };
  keyScenarios: Array<{
    title: string;
    synopsis: string;
    characters: string[];
    learningObjective: string;
    complexity: 'low' | 'medium' | 'high';
  }>;
  narrativeThemes: string[];
  companyContext: {
    name: string;
    industry: string;
    culture: string;
    policies: string[];
  };
}

/**
 * Generate a comprehensive narrative anchor document
 */
export async function generateNarrativeAnchor(
  projectScope: any,
  formData: any,
  openai: OpenAI
): Promise<NarrativeAnchor> {
  const anchorPrompt = `
You are a narrative architect creating a comprehensive anchor document for a storyboard module.

PROJECT CONTEXT:
- Company: ${formData?.company || formData?.organisationName || 'the organization'}
- Module: ${formData?.moduleName || formData?.title || 'Untitled Module'}
- Audience: ${formData?.targetAudience || 'General staff'}
- Archetype: ${projectScope.archetype}
- Duration: ${projectScope.estimatedDuration} minutes
- Interactivity: ${projectScope.interactivityDensity}

TASK: Create a detailed narrative anchor that will guide all specialist agents to maintain consistency.

OUTPUT JSON FORMAT:
{
  "characterRoster": {
    "primary": {
      "name": "Character name",
      "role": "Job title at company",
      "personality": "Detailed personality traits",
      "background": "Professional background and experience",
      "motivations": ["Key motivation 1", "Key motivation 2"],
      "speakingStyle": "How this character speaks (formal, casual, technical, etc.)"
    },
    "secondary": [
      {
        "name": "Secondary character name",
        "role": "Job title",
        "personality": "Personality traits",
        "background": "Professional background",
        "relationshipToPrimary": "How they relate to primary character",
        "speakingStyle": "Speaking style"
      }
    ]
  },
  "toneOfVoice": {
    "overall": "Overall tone for the module",
    "forAudience": "Tone specifically for this audience",
    "forScenarios": "Tone for scenario-based content",
    "forAssessments": "Tone for knowledge checks and assessments",
    "examples": ["Example phrase 1", "Example phrase 2", "Example phrase 3"]
  },
  "visualStyleRules": {
    "imageStyle": "Description of visual style for images",
    "colorPalette": ["#color1", "#color2", "#color3"],
    "fontGuidelines": "Font preferences and guidelines",
    "layoutPreferences": "Layout and design preferences",
    "brandIntegration": "How to integrate company branding"
  },
  "keyScenarios": [
    {
      "title": "Scenario title",
      "synopsis": "One-line description of the scenario",
      "characters": ["Character1", "Character2"],
      "learningObjective": "What this scenario teaches",
      "complexity": "low|medium|high"
    }
  ],
  "narrativeThemes": ["Theme 1", "Theme 2", "Theme 3"],
  "companyContext": {
    "name": "Company name",
    "industry": "Industry type",
    "culture": "Company culture description",
    "policies": ["Key policy 1", "Key policy 2"]
  }
}

CHARACTER DEVELOPMENT GUIDELINES:
- Create realistic, relatable characters with clear roles
- Ensure characters have distinct personalities and speaking styles
- Make relationships between characters meaningful and relevant
- Consider the target audience when designing character backgrounds

TONE GUIDELINES:
- Match the tone to the module type and audience
- Provide specific examples of how characters should speak
- Ensure consistency across all content types

VISUAL STYLE GUIDELINES:
- Create a cohesive visual identity
- Consider the company's brand and industry
- Ensure accessibility and professional appearance

SCENARIO GUIDELINES:
- Create 3-5 key scenarios that support learning objectives
- Vary complexity levels appropriately
- Ensure scenarios are realistic and relevant to the audience

Return ONLY the JSON object, no other text.
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: anchorPrompt }],
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) throw new Error("No response from narrative anchor generator");

    const anchor = JSON.parse(content) as NarrativeAnchor;
    
    // Validate required fields
    if (!anchor.characterRoster || !anchor.toneOfVoice || !anchor.visualStyleRules) {
      throw new Error("Invalid narrative anchor structure");
    }

    return anchor;
  } catch (error) {
    console.error("Narrative anchor generation error:", error);
    
    // Fallback anchor
    return {
      characterRoster: {
        primary: {
          name: "Alex",
          role: "Team Member",
          personality: "Professional, curious, and eager to learn",
          background: "Experienced team member with good understanding of company processes",
          motivations: ["Professional growth", "Team success", "Compliance excellence"],
          speakingStyle: "Professional yet approachable, asks thoughtful questions"
        },
        secondary: [{
          name: "Sam",
          role: "Manager",
          personality: "Supportive, knowledgeable, and experienced",
          background: "Senior manager with extensive experience in the field",
          relationshipToPrimary: "Mentor and supervisor to Alex",
          speakingStyle: "Authoritative but supportive, provides clear guidance"
        }]
      },
      toneOfVoice: {
        overall: "Professional and engaging",
        forAudience: "Clear and accessible for all skill levels",
        forScenarios: "Realistic and relatable",
        forAssessments: "Challenging but fair",
        examples: ["Let's explore this together", "What would you do in this situation?", "Great question!"]
      },
      visualStyleRules: {
        imageStyle: "Professional office environments with diverse, realistic characters",
        colorPalette: ["#1e40af", "#059669", "#dc2626"],
        fontGuidelines: "Clean, readable fonts with good contrast",
        layoutPreferences: "Clean, organized layouts with clear hierarchy",
        brandIntegration: "Subtle company branding throughout"
      },
      keyScenarios: [{
        title: "Policy Decision",
        synopsis: "Character must make a decision that tests their understanding of company policy",
        characters: ["Alex", "Sam"],
        learningObjective: "Apply policy knowledge in real situations",
        complexity: "medium"
      }],
      narrativeThemes: ["Professional growth", "Ethical decision-making", "Team collaboration"],
      companyContext: {
        name: formData?.company || "the organization",
        industry: "Professional services",
        culture: "Collaborative and values-driven",
        policies: ["Ethics and compliance", "Professional conduct"]
      }
    };
  }
}

/**
 * Get character information for a specific character
 */
export function getCharacterInfo(anchor: NarrativeAnchor, characterName: string) {
  if (anchor.characterRoster.primary.name === characterName) {
    return anchor.characterRoster.primary;
  }
  
  return anchor.characterRoster.secondary.find(char => char.name === characterName) || null;
}

/**
 * Get tone guidance for a specific content type
 */
export function getToneGuidance(anchor: NarrativeAnchor, contentType: 'scenario' | 'assessment' | 'explanation' | 'general') {
  switch (contentType) {
    case 'scenario':
      return anchor.toneOfVoice.forScenarios;
    case 'assessment':
      return anchor.toneOfVoice.forAssessments;
    case 'explanation':
      return anchor.toneOfVoice.forAudience;
    default:
      return anchor.toneOfVoice.overall;
  }
}

/**
 * Get visual style guidance
 */
export function getVisualGuidance(anchor: NarrativeAnchor) {
  return anchor.visualStyleRules;
}

/**
 * Get scenario information by title
 */
export function getScenarioInfo(anchor: NarrativeAnchor, scenarioTitle: string) {
  return anchor.keyScenarios.find(scenario => scenario.title === scenarioTitle) || null;
}












