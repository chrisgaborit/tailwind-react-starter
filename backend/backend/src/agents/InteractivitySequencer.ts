// backend/src/agents/InteractivitySequencer.ts
import { INTERACTIVITY_CATALOG } from '../library/interactivityCatalog';
import { hash, hashObject } from '../utils/checksum';
import { SceneMetadata, InteractivityDecision, InteractivityType } from '../types/storyboardTypes';

/**
 * InteractivitySequencer - Intelligent Interactivity Selection
 * 
 * Selects the best-fit interactivity for each scene based on:
 * - Bloom's level
 * - Instructional purpose
 * - Module level (1-4)
 * - Scene position
 * - Prior interactivity types (novelty)
 * - Cognitive load balance
 * 
 * Side-effect free, reusable, fully auditable with checksum logging.
 */
export class InteractivitySequencer {
  // Scoring weights (sum = 100%)
  private readonly WEIGHTS = {
    bloomAlignment: 0.40,      // 40% - Primary instructional effectiveness
    novelty: 0.25,             // 25% - Engagement through variety
    cognitiveLoadBalance: 0.20, // 20% - Prevent overload
    moduleLevelFit: 0.10,      // 10% - Complexity progression
    purposeAlignment: 0.05     // 5% - Scene intent
  };

  // Cognitive load thresholds by module level
  private readonly LOAD_THRESHOLDS: Record<number, string[]> = {
    1: ["low"],
    2: ["low", "medium"],
    3: ["medium", "high"],
    4: ["high"]
  };

  // Novelty window size
  private readonly NOVELTY_WINDOW = 3;

  constructor() {
    console.log('🎮 InteractivitySequencer initialized - Intelligent interactivity selection active');
  }

  /**
   * Select best-fit interactivity for a scene
   * 
   * @param sceneMeta - Scene metadata including Bloom level, module level, etc.
   * @returns InteractivityDecision with selected type, justification, and alternatives
   */
  selectInteractivityForScene(sceneMeta: SceneMetadata): InteractivityDecision {
    const timestamp = new Date().toISOString();
    const inputChecksum = hashObject(sceneMeta);

    console.log(`🎮 InteractivitySequencer: Selecting interactivity for scene ${sceneMeta.sceneNumber}`);
    console.log(`   🔐 Input Checksum: ${inputChecksum}`);
    console.log(`   🧠 Bloom Level: ${sceneMeta.bloomLevel || 'not specified'}`);
    console.log(`   📊 Module Level: ${sceneMeta.moduleLevel || 'not specified'}`);
    console.log(`   🎯 Purpose: ${sceneMeta.instructionalPurpose || 'not specified'}`);

    // Step 1: Normalize and validate inputs
    const normalizedMeta = this.normalizeSceneMetadata(sceneMeta);

    // Step 2: Filter candidates by hard constraints
    const candidates = this.filterCandidates(normalizedMeta);

    if (candidates.length === 0) {
      console.log(`   ⚠️ No candidates found - using fallback strategy`);
      return this.fallbackSelection(normalizedMeta, timestamp, inputChecksum);
    }

    console.log(`   ✅ Found ${candidates.length} candidate interactivities`);

    // Step 3: Score all candidates
    const scoredCandidates = candidates.map(candidate => ({
      candidate,
      score: this.scoreCandidate(candidate, normalizedMeta),
      breakdown: this.getScoreBreakdown(candidate, normalizedMeta)
    }));

    // Step 4: Sort by score (descending)
    scoredCandidates.sort((a, b) => b.score - a.score);

    // Step 5: Select winner
    const winner = scoredCandidates[0];
    const alternatives = scoredCandidates.slice(1, 4).map(item => ({
      type: item.candidate.id,
      score: item.score,
      reason: item.breakdown.summary
    }));

    const decision: InteractivityDecision = {
      interactivityType: winner.candidate.id,
      justification: this.generateJustification(winner.candidate, winner.breakdown, normalizedMeta),
      suggestedTemplate: winner.candidate.templateRef,
      score: winner.score,
      alternativeOptions: alternatives,
      checksum: hash(JSON.stringify({ winner: winner.candidate.id, score: winner.score, input: inputChecksum })),
      timestamp
    };

    console.log(`   🏆 Selected: ${decision.interactivityType} (score: ${winner.score.toFixed(2)})`);
    console.log(`   📋 Justification: ${decision.justification}`);
    console.log(`   🔐 Decision Checksum: ${decision.checksum}`);

    return decision;
  }

  /**
   * Normalize and validate scene metadata
   */
  private normalizeSceneMetadata(meta: SceneMetadata): Required<SceneMetadata> {
    return {
      sceneNumber: meta.sceneNumber,
      bloomLevel: this.normalizeBloomLevel(meta.bloomLevel),
      instructionalPurpose: meta.instructionalPurpose || 'foundation',
      moduleLevel: meta.moduleLevel || 2,
      previousInteractivities: meta.previousInteractivities || [],
      cognitiveLoad: meta.cognitiveLoad || 'medium'
    };
  }

  /**
   * Normalize Bloom level to lowercase
   */
  private normalizeBloomLevel(level?: string): "remember" | "understand" | "apply" | "analyze" | "evaluate" | "create" {
    if (!level) return 'understand';
    
    const normalized = level.trim().toLowerCase();
    const validLevels = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'];
    
    if (validLevels.includes(normalized)) {
      return normalized as any;
    }
    
    console.log(`   ⚠️ Invalid Bloom level "${level}" - defaulting to "understand"`);
    return 'understand';
  }

  /**
   * Filter candidates by hard constraints
   */
  private filterCandidates(meta: Required<SceneMetadata>): InteractivityType[] {
    // Step 1: Filter by Bloom level
    let candidates = INTERACTIVITY_CATALOG.filter(item => 
      item.bloomLevels.includes(meta.bloomLevel)
    );

    console.log(`   🔍 After Bloom filter (${meta.bloomLevel}): ${candidates.length} candidates`);

    // Step 2: Filter by module level
    candidates = candidates.filter(item => 
      item.moduleLevels.includes(meta.moduleLevel)
    );

    console.log(`   🔍 After module level filter (${meta.moduleLevel}): ${candidates.length} candidates`);

    // Step 3: Filter by cognitive load threshold
    const allowedLoads = this.LOAD_THRESHOLDS[meta.moduleLevel] || ['low', 'medium'];
    candidates = candidates.filter(item => 
      allowedLoads.includes(item.cognitiveLoad)
    );

    console.log(`   🔍 After cognitive load filter (${allowedLoads.join(', ')}): ${candidates.length} candidates`);

    // Step 4: Remove recently used types (if enough candidates remain)
    const recentTypes = meta.previousInteractivities.slice(-this.NOVELTY_WINDOW);
    const withoutRecent = candidates.filter(item => 
      !recentTypes.includes(item.id)
    );

    // Only apply novelty filter if we have enough alternatives
    if (withoutRecent.length >= 2) {
      candidates = withoutRecent;
      console.log(`   🔍 After novelty filter (avoiding ${recentTypes.length} recent): ${candidates.length} candidates`);
    } else {
      console.log(`   ⚠️ Skipping novelty filter - insufficient alternatives`);
    }

    return candidates;
  }

  /**
   * Score a candidate interactivity
   */
  private scoreCandidate(candidate: InteractivityType, meta: Required<SceneMetadata>): number {
    let score = 0;

    // 1. Bloom alignment (40%)
    score += this.scoreBloomAlignment(candidate, meta) * this.WEIGHTS.bloomAlignment;

    // 2. Novelty (25%)
    score += this.scoreNovelty(candidate, meta) * this.WEIGHTS.novelty;

    // 3. Cognitive load balance (20%)
    score += this.scoreCognitiveLoadBalance(candidate, meta) * this.WEIGHTS.cognitiveLoadBalance;

    // 4. Module level fit (10%)
    score += this.scoreModuleLevelFit(candidate, meta) * this.WEIGHTS.moduleLevelFit;

    // 5. Purpose alignment (5%)
    score += this.scorePurposeAlignment(candidate, meta) * this.WEIGHTS.purposeAlignment;

    return score;
  }

  /**
   * Score Bloom level alignment (0-100)
   */
  private scoreBloomAlignment(candidate: InteractivityType, meta: Required<SceneMetadata>): number {
    // Perfect match = 100, compatible = 70, marginal = 40
    if (candidate.bloomLevels.includes(meta.bloomLevel)) {
      // Check if it's an optimal match (primary supported level)
      const primaryLevel = candidate.bloomLevels[0];
      return primaryLevel === meta.bloomLevel ? 100 : 85;
    }
    return 0; // Should not happen due to filtering
  }

  /**
   * Score novelty to avoid repetition (0-100)
   */
  private scoreNovelty(candidate: InteractivityType, meta: Required<SceneMetadata>): number {
    const recentTypes = meta.previousInteractivities.slice(-this.NOVELTY_WINDOW);
    
    // Check if type was used recently
    const lastUsedIndex = recentTypes.lastIndexOf(candidate.id);
    
    if (lastUsedIndex === -1) {
      // Not used recently - excellent novelty
      return 100;
    }
    
    // Apply recency penalty based on how recent
    const recencyFromEnd = recentTypes.length - 1 - lastUsedIndex;
    
    if (recencyFromEnd === 0) {
      // Most recent (last scene)
      return 30;
    } else if (recencyFromEnd === 1) {
      // Second most recent
      return 50;
    } else {
      // Third most recent
      return 70;
    }
  }

  /**
   * Score cognitive load balance (0-100)
   */
  private scoreCognitiveLoadBalance(candidate: InteractivityType, meta: Required<SceneMetadata>): number {
    const allowedLoads = this.LOAD_THRESHOLDS[meta.moduleLevel] || ['low', 'medium'];
    
    // Exact match with current scene load
    if (candidate.cognitiveLoad === meta.cognitiveLoad) {
      return 100;
    }
    
    // Compatible but not exact match
    if (allowedLoads.includes(candidate.cognitiveLoad)) {
      return 80;
    }
    
    // Should not happen due to filtering
    return 0;
  }

  /**
   * Score module level fit (0-100)
   */
  private scoreModuleLevelFit(candidate: InteractivityType, meta: Required<SceneMetadata>): number {
    if (candidate.moduleLevels.includes(meta.moduleLevel)) {
      // Check if it's optimal for this level
      const optimalLevels = candidate.moduleLevels.slice(0, 2); // First 2 are usually optimal
      return optimalLevels.includes(meta.moduleLevel) ? 100 : 80;
    }
    return 0; // Should not happen due to filtering
  }

  /**
   * Score instructional purpose alignment (0-100)
   */
  private scorePurposeAlignment(candidate: InteractivityType, meta: Required<SceneMetadata>): number {
    if (candidate.instructionalPurposes.includes(meta.instructionalPurpose)) {
      // Check if it's the primary purpose
      const primaryPurpose = candidate.instructionalPurposes[0];
      return primaryPurpose === meta.instructionalPurpose ? 100 : 85;
    }
    return 50; // Neutral if not explicitly aligned
  }

  /**
   * Get detailed score breakdown for a candidate
   */
  private getScoreBreakdown(candidate: InteractivityType, meta: Required<SceneMetadata>): {
    bloom: number;
    novelty: number;
    cognitiveLoad: number;
    moduleLevel: number;
    purpose: number;
    summary: string;
  } {
    const bloom = this.scoreBloomAlignment(candidate, meta);
    const novelty = this.scoreNovelty(candidate, meta);
    const cognitiveLoad = this.scoreCognitiveLoadBalance(candidate, meta);
    const moduleLevel = this.scoreModuleLevelFit(candidate, meta);
    const purpose = this.scorePurposeAlignment(candidate, meta);

    const summary = `Bloom:${bloom.toFixed(0)} Novelty:${novelty.toFixed(0)} Load:${cognitiveLoad.toFixed(0)} Level:${moduleLevel.toFixed(0)} Purpose:${purpose.toFixed(0)}`;

    return { bloom, novelty, cognitiveLoad, moduleLevel, purpose, summary };
  }

  /**
   * Generate human-readable justification
   */
  private generateJustification(
    candidate: InteractivityType, 
    breakdown: ReturnType<typeof this.getScoreBreakdown>, 
    meta: Required<SceneMetadata>
  ): string {
    const reasons: string[] = [];

    // Highlight strongest factors
    if (breakdown.bloom >= 85) {
      reasons.push(`optimal for "${meta.bloomLevel}" level`);
    }
    
    if (breakdown.novelty >= 80) {
      reasons.push('provides fresh engagement (not recently used)');
    }
    
    if (breakdown.cognitiveLoad >= 90) {
      reasons.push(`matches ${meta.cognitiveLoad} cognitive load`);
    }
    
    if (candidate.instructionalPurposes.includes(meta.instructionalPurpose)) {
      reasons.push(`supports ${meta.instructionalPurpose} goal`);
    }

    if (reasons.length === 0) {
      return `Best available match for current scene requirements`;
    }

    return `Best match: ${reasons.join('; ')}`;
  }

  /**
   * Fallback selection when no candidates match
   */
  private fallbackSelection(
    meta: Required<SceneMetadata>, 
    timestamp: string, 
    inputChecksum: string
  ): InteractivityDecision {
    console.log(`   🔄 Applying fallback strategy...`);

    // Fallback hierarchy: Click-to-Reveal → Single Select Quiz → None
    const fallbackOptions = ['click_to_reveal', 'single_select_quiz'];
    
    for (const fallbackId of fallbackOptions) {
      const fallback = INTERACTIVITY_CATALOG.find(item => item.id === fallbackId);
      if (fallback) {
        console.log(`   ✅ Fallback selected: ${fallbackId}`);
        return {
          interactivityType: fallback.id,
          justification: `Fallback selection: no exact match found for ${meta.bloomLevel} at module level ${meta.moduleLevel}. Using ${fallback.name} as safe default.`,
          suggestedTemplate: fallback.templateRef,
          score: 50,
          checksum: hash(JSON.stringify({ fallback: fallbackId, input: inputChecksum })),
          timestamp
        };
      }
    }

    // Ultimate fallback: None
    console.log(`   ⚠️ No fallback available - defaulting to "None"`);
    return {
      interactivityType: 'None',
      justification: 'No suitable interactivity found for current scene requirements.',
      suggestedTemplate: 'none',
      score: 0,
      checksum: hash(JSON.stringify({ fallback: 'none', input: inputChecksum })),
      timestamp
    };
  }

  /**
   * Get sequencer configuration for debugging
   */
  getConfiguration(): {
    weights: typeof this.WEIGHTS;
    loadThresholds: typeof this.LOAD_THRESHOLDS;
    noveltyWindow: number;
    catalogSize: number;
  } {
    return {
      weights: { ...this.WEIGHTS },
      loadThresholds: { ...this.LOAD_THRESHOLDS },
      noveltyWindow: this.NOVELTY_WINDOW,
      catalogSize: INTERACTIVITY_CATALOG.length
    };
  }
}

// CommonJS export
module.exports = { InteractivitySequencer };


