// backend/src/logic/NarrativeOrchestrator.ts

/**
 * Narrative Orchestrator - Phase 5 Week 2
 * 
 * Injects narrative structure into learning content using:
 * - Protagonist/character creation
 * - Emotional stakes identification
 * - Story arc development
 * - Hook generation
 * 
 * Transforms dry instructional content into engaging stories.
 */

export interface NarrativeInput {
  title: string;
  content: string;
  learningOutcome: string;
  audience?: string;
  contentDomain?: string;
}

export interface NarrativeStructure {
  hook: string;
  character: {
    name: string;
    role: string;
    challenge: string;
    relatable: boolean;
  };
  emotionalStakes: string;
  narrativeReframe: string;
  storyArc: {
    opening: string;
    conflict: string;
    resolution: string;
  };
  engagementHooks: string[];
}

/**
 * Inject narrative structure into scene content
 */
export function injectNarrativeStructure(input: NarrativeInput): NarrativeStructure {
  console.log('📖 NarrativeOrchestrator: Creating story structure...');
  console.log(`   🎯 Outcome: ${input.learningOutcome.substring(0, 50)}...`);

  // Generate character based on audience and learning outcome
  const character = generateCharacter(input);
  
  // Create emotional hook
  const hook = generateHook(input, character);
  
  // Identify emotional stakes
  const emotionalStakes = identifyEmotionalStakes(input, character);
  
  // Reframe content with narrative lens
  const narrativeReframe = reframeWithNarrative(input, character);
  
  // Build story arc
  const storyArc = buildStoryArc(input, character);
  
  // Generate engagement hooks
  const engagementHooks = generateEngagementHooks(input);

  console.log(`   👤 Character: ${character.name} (${character.role})`);
  console.log(`   🎣 Hook: ${hook.substring(0, 60)}...`);
  console.log(`   💡 Stakes: ${emotionalStakes.substring(0, 60)}...`);

  return {
    hook,
    character,
    emotionalStakes,
    narrativeReframe,
    storyArc,
    engagementHooks
  };
}

/**
 * Generate relatable character for the narrative
 */
function generateCharacter(input: NarrativeInput): NarrativeStructure['character'] {
  // Extract role from audience
  const role = extractRole(input.audience || 'professional');
  
  // Generate name based on role
  const name = generateRealisticName(role);
  
  // Create challenge from learning outcome
  const challenge = extractChallenge(input.learningOutcome);

  return {
    name,
    role,
    challenge,
    relatable: true
  };
}

/**
 * Extract role from audience description
 */
function extractRole(audience: string): string {
  const audienceLower = audience.toLowerCase();
  
  const roleMap: Record<string, string> = {
    manager: 'Team Manager',
    leader: 'Team Leader',
    supervisor: 'Supervisor',
    analyst: 'Data Analyst',
    developer: 'Developer',
    designer: 'Designer',
    engineer: 'Engineer',
    sales: 'Sales Professional',
    support: 'Support Specialist',
    hr: 'HR Professional'
  };

  for (const [key, value] of Object.entries(roleMap)) {
    if (audienceLower.includes(key)) {
      return value;
    }
  }

  return 'Professional';
}

/**
 * Generate realistic name for character
 */
function generateRealisticName(role: string): string {
  const names = {
    manager: ['Sarah', 'James', 'Maria', 'David'],
    leader: ['Alex', 'Jordan', 'Sam', 'Taylor'],
    analyst: ['Chris', 'Morgan', 'Casey', 'Jamie'],
    professional: ['Pat', 'Robin', 'Kelly', 'Drew']
  };

  const roleKey = role.toLowerCase().includes('manager') ? 'manager' :
                  role.toLowerCase().includes('leader') ? 'leader' :
                  role.toLowerCase().includes('analyst') ? 'analyst' : 'professional';

  const nameList = names[roleKey as keyof typeof names] || names.professional;
  return nameList[Math.floor(Math.random() * nameList.length)];
}

/**
 * Extract challenge from learning outcome
 */
function extractChallenge(outcome: string): string {
  const outcomeLower = outcome.toLowerCase();
  
  // Extract the core skill/topic
  const verbs = ['identify', 'apply', 'understand', 'analyze', 'evaluate', 'create', 'demonstrate'];
  let challenge = outcome;
  
  verbs.forEach(verb => {
    if (outcomeLower.includes(verb)) {
      challenge = outcome.substring(outcome.toLowerCase().indexOf(verb) + verb.length).trim();
    }
  });

  return `Struggling with ${challenge}`;
}

/**
 * Generate emotional hook that draws learners in
 */
function generateHook(input: NarrativeInput, character: NarrativeStructure['character']): string {
  const topic = input.learningOutcome || input.title;
  
  const hookTemplates = [
    `Have you ever felt overwhelmed when ${topic.toLowerCase()}?`,
    `Imagine you're ${character.name}, facing a situation where ${topic.toLowerCase()} is critical.`,
    `What would you do if ${topic.toLowerCase()} was the key to your success?`,
    `${character.name} thought they knew ${topic.toLowerCase()}—until everything went wrong.`,
    `Picture this: You're ${character.name}, and ${character.challenge}.`
  ];

  // Select hook based on content domain
  const hookIndex = input.contentDomain === 'emotional' ? 1 :
                   input.contentDomain === 'safety' ? 3 :
                   input.contentDomain === 'leadership' ? 4 : 0;

  return hookTemplates[hookIndex] || hookTemplates[0];
}

/**
 * Identify emotional stakes for the learner
 */
function identifyEmotionalStakes(input: NarrativeInput, character: NarrativeStructure['character']): string {
  const domain = input.contentDomain || 'technical';
  
  const stakesTemplates: Record<string, string> = {
    procedural: `If you don't master this process, errors multiply and confidence erodes.`,
    emotional: `Poor communication destroys trust, damages relationships, and creates lasting team friction.`,
    compliance: `Non-compliance risks legal consequences, reputational damage, and career impact.`,
    product: `Without proper understanding, users struggle, productivity drops, and frustration builds.`,
    safety: `Mistakes in safety can lead to serious injury, legal liability, and preventable tragedy.`,
    technical: `Technical errors create cascading failures, wasted time, and damaged credibility.`,
    leadership: `Leadership failures affect team morale, project outcomes, and organizational success.`
  };

  const personalStakes = `For ${character.name}, ${character.challenge}—and the cost of not solving it is real.`;
  const generalStakes = stakesTemplates[domain] || stakesTemplates.technical;

  return `${generalStakes} ${personalStakes}`;
}

/**
 * Reframe content with narrative perspective
 */
function reframeWithNarrative(input: NarrativeInput, character: NarrativeStructure['character']): string {
  const topic = input.learningOutcome || input.title;
  
  return `Let's reframe ${topic} as your superpower for handling daily work challenges. Just like ${character.name} discovered, mastering this skill transforms frustration into confidence, confusion into clarity, and struggle into success. This isn't just theory—it's the exact approach that helped ${character.name} turn things around.`;
}

/**
 * Build three-act story arc
 */
function buildStoryArc(input: NarrativeInput, character: NarrativeStructure['character']): NarrativeStructure['storyArc'] {
  const topic = input.learningOutcome || input.title;
  
  return {
    opening: `${character.name}, a ${character.role}, faced a challenge: ${character.challenge}. Sound familiar?`,
    conflict: `Every attempt to ${topic.toLowerCase()} led to more confusion and frustration. The old approach wasn't working.`,
    resolution: `Then ${character.name} learned a new framework—and everything changed. You're about to discover that same approach.`
  };
}

/**
 * Generate multiple engagement hooks throughout content
 */
function generateEngagementHooks(input: NarrativeInput): string[] {
  const topic = input.learningOutcome || input.title;
  
  return [
    `What if there was a simpler way to ${topic.toLowerCase()}?`,
    `Here's what most people get wrong about ${topic.toLowerCase()}...`,
    `You're about to discover the one thing that changes everything.`,
    `This single insight will transform how you approach ${topic.toLowerCase()}.`,
    `By the end of this section, you'll never look at ${topic.toLowerCase()} the same way.`
  ];
}

/**
 * Apply narrative structure to existing scene content
 */
export function enhanceSceneWithNarrative(
  scene: { title: string; narrationScript: string; onScreenText: string; learningOutcome?: string },
  input: NarrativeInput
): { title: string; narrationScript: string; onScreenText: string } {
  const narrative = injectNarrativeStructure(input);
  
  // Enhance title with character reference if appropriate
  const enhancedTitle = scene.title.includes(narrative.character.name) ? 
    scene.title : 
    `${scene.title} - ${narrative.character.name}'s Story`;
  
  // Prepend hook to narration
  const enhancedNarration = `${narrative.hook} ${scene.narrationScript}`;
  
  // Add emotional element to on-screen text
  const enhancedOST = `${narrative.engagementHooks[0]} ${scene.onScreenText}`;

  return {
    title: enhancedTitle,
    narrationScript: enhancedNarration.substring(0, 500), // Limit length
    onScreenText: enhancedOST.substring(0, 200) // Limit length
  };
}

export default injectNarrativeStructure;


