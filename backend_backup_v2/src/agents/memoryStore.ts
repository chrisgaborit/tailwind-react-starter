/**
 * Memory Store - Pedagogical Pattern Learning
 * 
 * Stores and retrieves pedagogical patterns and failures to improve
 * future learning experiences and avoid repetition of mistakes.
 */

import { createClient } from '@supabase/supabase-js';
import type { MemoryStore } from '../../../packages/shared/src/types';

export class SupabaseMemoryStore implements MemoryStore {
  private supabase: any;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );
  }

  /**
   * Get similar patterns from past successful learning experiences
   */
  async getSimilarPatterns(learningRequest: any): Promise<string> {
    try {
      const { data, error } = await this.supabase
        .from('pedagogical_patterns')
        .select('*')
        .eq('content_type', this.categorizeContent(learningRequest.topic))
        .eq('audience_type', this.categorizeAudience(learningRequest.audience))
        .order('success_score', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error retrieving similar patterns:', error);
        return 'No similar patterns found.';
      }

      if (!data || data.length === 0) {
        return 'No similar patterns found.';
      }

      return data.map(pattern => 
        `SUCCESSFUL PATTERN: ${pattern.strategy} for ${pattern.content_type} with ${pattern.audience_type} - Success Score: ${pattern.success_score}`
      ).join('\n');

    } catch (error) {
      console.error('Memory store error:', error);
      return 'No similar patterns found.';
    }
  }

  /**
   * Get pedagogical failures to avoid
   */
  async getPedagogicalFailures(): Promise<string> {
    try {
      const { data, error } = await this.supabase
        .from('pedagogical_failures')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error retrieving failures:', error);
        return 'No failure patterns found.';
      }

      if (!data || data.length === 0) {
        return 'No failure patterns found.';
      }

      return data.map(failure => 
        `FAILURE TO AVOID: ${failure.failure_type} - ${failure.description}`
      ).join('\n');

    } catch (error) {
      console.error('Memory store error:', error);
      return 'No failure patterns found.';
    }
  }

  /**
   * Store successful pedagogical pattern
   */
  async storePattern(pattern: any): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('pedagogical_patterns')
        .insert({
          content_type: this.categorizeContent(pattern.learningRequest.topic),
          audience_type: this.categorizeAudience(pattern.learningRequest.audience),
          strategy: pattern.blueprint.strategy,
          learning_objectives: pattern.learningRequest.objectives,
          success_score: 1.0, // Will be updated based on feedback
          pattern_data: pattern.blueprint,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error storing pattern:', error);
      }
    } catch (error) {
      console.error('Memory store error:', error);
    }
  }

  /**
   * Store pedagogical failure for future avoidance
   */
  async storeFailure(failure: any): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('pedagogical_failures')
        .insert({
          failure_type: failure.type,
          description: failure.description,
          recommendation: failure.recommendation,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error storing failure:', error);
      }
    } catch (error) {
      console.error('Memory store error:', error);
    }
  }

  /**
   * Categorize content type for pattern matching
   */
  private categorizeContent(topic: string): string {
    const topicLower = topic.toLowerCase();
    
    if (topicLower.includes('leadership') || topicLower.includes('management')) {
      return 'leadership';
    } else if (topicLower.includes('technical') || topicLower.includes('system')) {
      return 'technical';
    } else if (topicLower.includes('compliance') || topicLower.includes('safety')) {
      return 'compliance';
    } else if (topicLower.includes('sales') || topicLower.includes('customer')) {
      return 'sales';
    } else {
      return 'general';
    }
  }

  /**
   * Categorize audience type for pattern matching
   */
  private categorizeAudience(audience: string): string {
    const audienceLower = audience.toLowerCase();
    
    if (audienceLower.includes('manager') || audienceLower.includes('leader')) {
      return 'management';
    } else if (audienceLower.includes('new') || audienceLower.includes('junior')) {
      return 'beginner';
    } else if (audienceLower.includes('senior') || audienceLower.includes('expert')) {
      return 'expert';
    } else {
      return 'intermediate';
    }
  }

  /**
   * Update pattern success score based on feedback
   */
  async updatePatternSuccess(patternId: string, successScore: number): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('pedagogical_patterns')
        .update({ success_score: successScore })
        .eq('id', patternId);

      if (error) {
        console.error('Error updating pattern success:', error);
      }
    } catch (error) {
      console.error('Memory store error:', error);
    }
  }
}
