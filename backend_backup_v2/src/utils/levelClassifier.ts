// backend/src/utils/levelClassifier.ts

export type LevelDetection = {
  detectedLevel: 'Level 1: Passive' | 'Level 2: Limited Interactivity' | 'Level 3: Complex Interactivity';
  metrics: {
    sceneCount: number;
    interactionCount: number;
    knowledgeCheckCount: number;
    branchingCount: number;
    complexInteractionCount: number;
    simpleInteractionCount: number;
  };
  reasons: string[];
};

const SIMPLE_TYPES = [
  'none', 'click-to-reveal', 'click to reveal', 'reveal', 'reflection', 'short answer',
  'hotspot (simple)', 'hotspot', 'button', 'carousel'
].map(s => s.toLowerCase());

const KNOWLEDGE_CHECK_HINTS = [
  'mcq', 'mrq', 'knowledge check', 'quiz', 'question', 'true/false', 'multiple choice'
].map(s => s.toLowerCase());

const COMPLEX_TYPES = [
  'drag-and-drop', 'drag & drop', 'drag drop', 'simulation', 'branching', 'scenario-based',
  'simulated conversation', 'role-play', 'branch', 'multi-step', 'guided practice'
].map(s => s.toLowerCase());

const lc = (x?: string) => (x || '').toLowerCase();

function isKnowledgeCheck(interactionType: string, interactionDescription: string): boolean {
  const blob = `${interactionType} ${interactionDescription}`.toLowerCase();
  return KNOWLEDGE_CHECK_HINTS.some(k => blob.includes(k));
}

function isComplex(interactionType: string, interactionDescription: string): boolean {
  const blob = `${interactionType} ${interactionDescription}`.toLowerCase();
  return COMPLEX_TYPES.some(k => blob.includes(k));
}

function isSimple(interactionType: string): boolean {
  const t = lc(interactionType);
  return SIMPLE_TYPES.some(s => t.includes(s));
}

function hasBranching(interactionType: string, interactionDescription: string): boolean {
  const blob = `${interactionType} ${interactionDescription}`.toLowerCase();
  return blob.includes('branch') || blob.includes('branching') || blob.includes('path');
}

/**
 * Classify storyboard level from scenes[] content.
 * Lightweight rules of thumb:
 * - L1: ≤2 simple interactions total, 0 branching, KC <=2
 * - L2: 3–6 interactions, ≥2 KCs, no branching required, complex interactions optional
 * - L3: branching present OR ≥5 interactions with ≥1 complex type AND ≥4 KCs
 */
export function classifyStoryboard(storyboard: any): LevelDetection {
  const scenes = Array.isArray(storyboard?.scenes) ? storyboard.scenes : [];
  const sceneCount = scenes.length;

  let interactionCount = 0;
  let knowledgeCheckCount = 0;
  let branchingCount = 0;
  let complexInteractionCount = 0;
  let simpleInteractionCount = 0;

  for (const s of scenes) {
    const type = lc(s?.interactionType || '');
    const desc = lc(s?.interactionDescription || '');

    if (type || desc) interactionCount++;
    if (isKnowledgeCheck(type, desc)) knowledgeCheckCount++;
    if (hasBranching(type, desc)) branchingCount++;
    if (isComplex(type, desc)) complexInteractionCount++;
    if (isSimple(type)) simpleInteractionCount++;
  }

  let detected: LevelDetection['detectedLevel'] = 'Level 1: Passive';
  const reasons: string[] = [];

  if (branchingCount > 0) {
    detected = 'Level 3: Complex Interactivity';
    reasons.push(`Branching detected in ${branchingCount} scene(s).`);
  }

  if (detected !== 'Level 3: Complex Interactivity') {
    if (interactionCount >= 5 && complexInteractionCount >= 1 && knowledgeCheckCount >= 4) {
      detected = 'Level 3: Complex Interactivity';
      reasons.push(`High interactivity (${interactionCount}), complex types (${complexInteractionCount}), and knowledge checks (${knowledgeCheckCount}).`);
    }
  }

  if (detected !== 'Level 3: Complex Interactivity') {
    if (interactionCount >= 3 && interactionCount <= 6 && knowledgeCheckCount >= 2) {
      detected = 'Level 2: Limited Interactivity';
      reasons.push(`Moderate interactivity (${interactionCount}) with knowledge checks (${knowledgeCheckCount}).`);
    }
  }

  if (detected === 'Level 1: Passive') {
    reasons.push(`Low/simple interactivity (${interactionCount}, simple=${simpleInteractionCount}), no branching, limited checks (${knowledgeCheckCount}).`);
  }

  return {
    detectedLevel: detected,
    metrics: {
      sceneCount,
      interactionCount,
      knowledgeCheckCount,
      branchingCount,
      complexInteractionCount,
      simpleInteractionCount,
    },
    reasons,
  };
}