// backend/src/agents/CharacterGenerationAgent.ts

/**
 * Character Generation Agent
 * 
 * Creates relatable workplace characters with realistic names, roles, and challenges.
 * Characters drive narrative engagement throughout the learning experience.
 * 
 * Archetypes based on "Dealing with Difficult People" frameworks
 */

import { openaiChat } from '../services/openaiGateway';
import { safeJSONParse } from '../utils/safeJSONParse';

export interface Character {
  name: string;
  role: string;
  challenge?: string;
  personality?: string;
  archetype?: string;
  behavior?: string;
  motivation?: string;
}

export interface CharacterSet {
  protagonist: Character;
  difficultCharacters: Character[];
  supportingCharacters?: Character[];
}

export class CharacterGenerationAgent {
  
  /**
   * Generate relatable characters for learning module
   */
  async generateCharacters(
    topic: string, 
    audience: string,
    contentDomain: string
  ): Promise<CharacterSet> {
    console.log('👥 CharacterGenerationAgent: Creating characters...');
    console.log(`   📚 Topic: ${topic}`);
    console.log(`   🎭 Audience: ${audience}`);
    console.log(`   🏷️ Domain: ${contentDomain}`);

    const prompt = `
You are creating relatable workplace characters for an eLearning module.

TOPIC: ${topic}
AUDIENCE: ${audience}
CONTENT TYPE: ${contentDomain}

CREATE 3-4 REALISTIC CHARACTERS:

PROTAGONIST (The Learner):
- Name: Realistic, diverse name
- Role: Matches the ${audience} role
- Challenge: Specific struggle related to ${topic}
- Personality: Brief, humanizing description
- Make them RELATABLE - learners should think "That's me!"

DIFFICULT CHARACTERS (1-2):
Based on classic archetypes:
- The Tank (aggressive, attacking)
- The Sniper (passive-aggressive, undermining)  
- The Know-It-All (condescending, dismissive)
- The Yes Person (agrees but doesn't deliver)
- The Complainer (negative, draining)
- The Silent Type (withdrawn, uncommunicative)

For each:
- Name: Realistic name
- Archetype: Which type above
- Behavior: Specific difficult behaviors they show
- Motivation: WHY they act this way (makes them 3-dimensional)

SUPPORTING CHARACTER (1):
- Name: Realistic name
- Role: Mentor, peer, or leader
- Purpose: Provides guidance or perspective

STRICT RULES:
❌ NO markdown code blocks
❌ NO generic names like "John" or "Jane"
✅ Return ONLY valid JSON
✅ Diverse, realistic names
✅ Specific, not generic challenges
✅ 3-dimensional characters with motivations

JSON STRUCTURE (EXACT FORMAT):
{
  "protagonist": {
    "name": "[Realistic diverse name]",
    "role": "[Specific job title matching ${audience}]",
    "challenge": "[Specific struggle with ${topic}]",
    "personality": "[Brief humanizing trait]",
    "background": "[Relevant context]"
  },
  "difficultCharacters": [
    {
      "name": "[Realistic name]",
      "role": "[Their job title]",
      "archetype": "[Tank/Sniper/Know-It-All/etc.]",
      "behavior": "[Specific difficult behaviors]",
      "motivation": "[Why they act this way]",
      "impact": "[Effect on team/work]"
    }
  ],
  "supportingCharacters": [
    {
      "name": "[Realistic name]",
      "role": "[Mentor/Peer/Leader]",
      "purpose": "[How they help protagonist]",
      "personality": "[Brief description]"
    }
  ]
}
`.trim();

    try {
      const response = await openaiChat({ systemKey: 'master_blueprint', user: prompt });
      const parsed = safeJSONParse(response);

      console.log(`   ✅ Protagonist: ${parsed.protagonist.name} (${parsed.protagonist.role})`);
      console.log(`   ✅ Difficult Characters: ${parsed.difficultCharacters?.length || 0}`);
      
      if (parsed.difficultCharacters && parsed.difficultCharacters.length > 0) {
        parsed.difficultCharacters.forEach((char: Character) => {
          console.log(`      - ${char.name}: ${char.archetype}`);
        });
      }

      return {
        protagonist: parsed.protagonist,
        difficultCharacters: parsed.difficultCharacters || [],
        supportingCharacters: parsed.supportingCharacters || []
      };

    } catch (error) {
      console.error('❌ CharacterGenerationAgent error:', error);
      
      // Fallback characters
      return this.getFallbackCharacters(topic, audience);
    }
  }

  /**
   * Generate fallback characters if AI fails
   */
  private getFallbackCharacters(topic: string, audience: string): CharacterSet {
    console.log('⚠️ Using fallback character set');

    return {
      protagonist: {
        name: "Alex",
        role: audience || "Professional",
        challenge: `Learning to navigate ${topic} effectively`,
        personality: "Conscientious and eager to improve"
      },
      difficultCharacters: [
        {
          name: "Jordan",
          role: "Team Member",
          archetype: "The Tank",
          behavior: "Aggressive communication, dismissive of others' ideas",
          motivation: "Feels unheard and frustrated with pace of change"
        }
      ],
      supportingCharacters: [
        {
          name: "Sam",
          role: "Experienced Mentor",
          purpose: "Provides guidance and perspective on handling challenges",
          personality: "Patient and insightful"
        }
      ]
    };
  }

  /**
   * Get character archetypes for reference
   */
  getArchetypes(): string[] {
    return [
      "The Tank - Aggressive, attacking, intimidating",
      "The Sniper - Passive-aggressive, undermining, sarcastic",
      "The Know-It-All - Condescending, dismissive, superior",
      "The Yes Person - Agrees but doesn't follow through",
      "The Complainer - Chronically negative, energy-draining",
      "The Silent Type - Withdrawn, uncommunicative, avoidant",
      "The Procrastinator - Delays, excuses, last-minute",
      "The Micromanager - Controlling, detail-obsessed, distrusting"
    ];
  }
}

export default CharacterGenerationAgent;


