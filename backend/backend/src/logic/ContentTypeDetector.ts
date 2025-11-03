// backend/src/logic/ContentTypeDetector.ts

/**
 * Content Type Detector - Phase 5 Week 2
 * 
 * Analyzes learning context to determine optimal interaction types.
 * Uses rule-based logic with keyword analysis and domain detection.
 * 
 * Future enhancement: Add LLM-based analysis for complex content.
 */

export interface ContentDetectionInput {
  topic: string;
  learningOutcomes: string[];
  context?: string;
  audience?: string;
  duration?: number;
}

export interface ContentDetectionResult {
  primaryType: string;
  fallbackTypes: string[];
  reasoning: string;
  contentDomain: 'procedural' | 'emotional' | 'compliance' | 'product' | 'safety' | 'technical' | 'leadership';
  recommendedInteractions: string[];
  narrativeTone: 'directive' | 'empathetic' | 'authoritative' | 'inspirational' | 'cautionary';
  confidence: number; // 0-1
}

/**
 * Domain keyword mappings for content classification
 */
const DOMAIN_KEYWORDS = {
  procedural: ['steps', 'process', 'procedure', 'workflow', 'how to', 'method', 'sequence', 'instructions'],
  emotional: ['communication', 'leadership', 'conflict', 'difficult', 'empathy', 'relationship', 'team', 'feedback'],
  compliance: ['policy', 'regulation', 'requirement', 'mandatory', 'compliance', 'legal', 'standard', 'obligation'],
  product: ['feature', 'system', 'software', 'tool', 'platform', 'interface', 'application', 'product'],
  safety: ['safety', 'hazard', 'risk', 'emergency', 'health', 'accident', 'injury', 'prevention'],
  technical: ['technical', 'data', 'analysis', 'system', 'code', 'configure', 'troubleshoot', 'implement'],
  leadership: ['leadership', 'management', 'decision', 'strategy', 'vision', 'influence', 'motivate', 'coach']
};

/**
 * Interaction type recommendations by domain
 */
const DOMAIN_INTERACTION_MAP: Record<string, string[]> = {
  procedural: ['procedural_demo', 'timeline_sequencing', 'decision_tree', 'single_select_quiz'],
  emotional: ['conversation_simulator', 'branching_scenario', 'reflection_journal', 'scenario_simulation'],
  compliance: ['timeline_sequencing', 'single_select_quiz', 'multi_select_quiz', 'case_study_analysis'],
  product: ['hotspot_exploration', 'procedural_demo', 'click_to_reveal', 'video_analysis'],
  safety: ['branching_scenario', 'case_study_analysis', 'decision_tree', 'timeline_sequencing'],
  technical: ['procedural_demo', 'decision_tree', 'click_to_reveal', 'case_study_analysis'],
  leadership: ['conversation_simulator', 'branching_scenario', 'case_study_analysis', 'reflection_journal']
};

/**
 * Detect content types and recommend interaction patterns
 */
export function detectContentTypes(input: ContentDetectionInput): ContentDetectionResult {
  console.log('🔍 ContentTypeDetector: Analyzing content...');
  console.log(`   📚 Topic: ${input.topic}`);
  console.log(`   🎯 Outcomes: ${input.learningOutcomes.length}`);

  // Combine all text for analysis
  const fullText = [
    input.topic,
    ...input.learningOutcomes,
    input.context || '',
    input.audience || ''
  ].join(' ').toLowerCase();

  // Score each domain
  const domainScores: Record<string, number> = {};
  
  Object.entries(DOMAIN_KEYWORDS).forEach(([domain, keywords]) => {
    let score = 0;
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = fullText.match(regex);
      score += matches ? matches.length : 0;
    });
    domainScores[domain] = score;
  });

  // Find primary and secondary domains
  const sortedDomains = Object.entries(domainScores)
    .sort(([, a], [, b]) => b - a)
    .filter(([, score]) => score > 0);

  const primaryDomain = sortedDomains[0]?.[0] || 'technical';
  const secondaryDomain = sortedDomains[1]?.[0];

  console.log(`   🎯 Primary Domain: ${primaryDomain} (score: ${domainScores[primaryDomain]})`);
  if (secondaryDomain) {
    console.log(`   🎯 Secondary Domain: ${secondaryDomain} (score: ${domainScores[secondaryDomain]})`);
  }

  // Get recommended interactions for primary domain
  const recommendedInteractions = DOMAIN_INTERACTION_MAP[primaryDomain] || 
                                  DOMAIN_INTERACTION_MAP.technical;

  // Add secondary domain interactions if applicable
  if (secondaryDomain && domainScores[secondaryDomain] >= domainScores[primaryDomain] * 0.5) {
    const secondaryInteractions = DOMAIN_INTERACTION_MAP[secondaryDomain] || [];
    recommendedInteractions.push(...secondaryInteractions.slice(0, 2));
  }

  // Remove duplicates and limit to top 6
  const uniqueInteractions = Array.from(new Set(recommendedInteractions)).slice(0, 6);

  // Determine narrative tone based on domain
  const narrativeTone = determineNarrativeTone(primaryDomain as any);

  // Calculate confidence based on score strength
  const maxScore = Math.max(...Object.values(domainScores));
  const confidence = maxScore > 0 ? Math.min(maxScore / 10, 1) : 0.5;

  // Build reasoning
  const reasoning = buildReasoning(
    input.topic,
    primaryDomain as any,
    secondaryDomain,
    domainScores[primaryDomain],
    domainScores[secondaryDomain || '']
  );

  console.log(`   💡 Recommended Interactions: ${uniqueInteractions.slice(0, 3).join(', ')}...`);
  console.log(`   📊 Confidence: ${(confidence * 100).toFixed(0)}%`);

  return {
    primaryType: uniqueInteractions[0],
    fallbackTypes: uniqueInteractions.slice(1),
    reasoning,
    contentDomain: primaryDomain as any,
    recommendedInteractions: uniqueInteractions,
    narrativeTone,
    confidence
  };
}

/**
 * Determine narrative tone based on content domain
 */
function determineNarrativeTone(
  domain: 'procedural' | 'emotional' | 'compliance' | 'product' | 'safety' | 'technical' | 'leadership'
): 'directive' | 'empathetic' | 'authoritative' | 'inspirational' | 'cautionary' {
  const toneMap = {
    procedural: 'directive' as const,
    emotional: 'empathetic' as const,
    compliance: 'authoritative' as const,
    product: 'directive' as const,
    safety: 'cautionary' as const,
    technical: 'directive' as const,
    leadership: 'inspirational' as const
  };

  return toneMap[domain] || 'directive';
}

/**
 * Build human-readable reasoning
 */
function buildReasoning(
  topic: string,
  primaryDomain: string,
  secondaryDomain: string | undefined,
  primaryScore: number,
  secondaryScore: number
): string {
  let reasoning = `Topic "${topic}" is primarily ${primaryDomain}-focused`;
  
  if (secondaryDomain && secondaryScore >= primaryScore * 0.5) {
    reasoning += ` with significant ${secondaryDomain} elements`;
  }
  
  reasoning += `. ${getDomainCharacteristics(primaryDomain)}`;
  
  return reasoning;
}

/**
 * Get domain characteristics description
 */
function getDomainCharacteristics(domain: string): string {
  const characteristics: Record<string, string> = {
    procedural: 'Best suited for step-by-step demonstrations, timelines, and guided practice.',
    emotional: 'Requires empathetic scenarios, conversation practice, and reflection activities.',
    compliance: 'Benefits from sequenced timelines, knowledge checks, and case study analysis.',
    product: 'Works well with interactive explorations, hotspots, and procedural demos.',
    safety: 'Needs branching scenarios showing consequences and decision trees for critical situations.',
    technical: 'Suited for procedural demos, decision trees, and hands-on practice.',
    leadership: 'Requires conversation simulators, branching scenarios, and reflective activities.'
  };

  return characteristics[domain] || 'Suitable for general interactive learning approaches.';
}

/**
 * Analyze Bloom's level distribution in outcomes
 */
export function analyzeBloomDistribution(outcomes: string[]): {
  levels: Record<string, number>;
  dominant: string;
  recommendation: string;
} {
  const bloomKeywords = {
    remember: ['remember', 'recall', 'identify', 'list', 'define', 'name'],
    understand: ['understand', 'explain', 'describe', 'summarize', 'interpret', 'classify'],
    apply: ['apply', 'implement', 'use', 'demonstrate', 'execute', 'solve'],
    analyze: ['analyze', 'compare', 'contrast', 'examine', 'categorize', 'differentiate'],
    evaluate: ['evaluate', 'assess', 'judge', 'critique', 'justify', 'recommend'],
    create: ['create', 'design', 'develop', 'generate', 'construct', 'formulate']
  };

  const levels: Record<string, number> = {
    remember: 0,
    understand: 0,
    apply: 0,
    analyze: 0,
    evaluate: 0,
    create: 0
  };

  outcomes.forEach(outcome => {
    const outcomeLower = outcome.toLowerCase();
    Object.entries(bloomKeywords).forEach(([level, keywords]) => {
      keywords.forEach(keyword => {
        if (outcomeLower.includes(keyword)) {
          levels[level]++;
        }
      });
    });
  });

  const sortedLevels = Object.entries(levels)
    .sort(([, a], [, b]) => b - a)
    .filter(([, count]) => count > 0);

  const dominant = sortedLevels[0]?.[0] || 'apply';
  
  const recommendation = getBloomRecommendation(dominant);

  return {
    levels,
    dominant,
    recommendation
  };
}

/**
 * Get interaction recommendations based on dominant Bloom level
 */
function getBloomRecommendation(level: string): string {
  const recommendations: Record<string, string> = {
    remember: 'Use click-to-reveal and single-select quizzes for foundational knowledge.',
    understand: 'Use examples, comparisons, and multi-select quizzes to build comprehension.',
    apply: 'Use procedural demos, scenarios, and hands-on practice for skill development.',
    analyze: 'Use case studies, decision trees, and analytical activities for critical thinking.',
    evaluate: 'Use branching scenarios, peer review, and judgment activities.',
    create: 'Use open-ended projects, simulations, and creative activities.'
  };

  return recommendations[level] || 'Use varied interaction types aligned with learning objectives.';
}

export default detectContentTypes;


