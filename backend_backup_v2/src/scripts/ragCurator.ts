#!/usr/bin/env npx ts-node

/**
 * RAG Pedagogical Curator Script
 * 
 * Analyzes storyboard chunks and populates pedagogical intelligence metadata
 * for enhanced RAG retrieval and learning pattern recognition.
 * 
 * Usage:
 *   npx ts-node src/scripts/ragCurator.ts --dryRun
 *   npx ts-node src/scripts/ragCurator.ts
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { getRAGConfig, buildRAGQuery } from '../utils/ragConfig';

// Load environment variables
dotenv.config();

// Types for pedagogical analysis
interface PedagogicalAnalysis {
  teaching_clarity: number;
  learner_engagement: number;
  scenario_alignment: number;
  cognitive_progression: number;
  segment_type: 'teaching' | 'practice' | 'scenario' | 'assessment';
  complexity_level: 'basic' | 'intermediate' | 'advanced';
  learner_focus: 'knowledge' | 'skill' | 'reflection';
}

interface ChunkRecord {
  id: string;
  content?: string;
  metadata?: any;
  storyboard_id?: string;
  scene_no?: number;
}

interface GoldenPattern {
  pattern: string;
  works_when: string;
  avoid_when: string;
  evidence: PedagogicalAnalysis;
  terminology_bias: Record<string, any>;
}

class RAGCurator {
  private supabase: any;
  private openai: OpenAI;
  private dryRun: boolean;
  private lastRequestTime: number = 0;
  private ragConfig: any;
  private stats = {
    processed: 0,
    updated: 0,
    archived: 0,
    goldenSet: 0,
    errors: 0,
    timeouts: 0,
    retries: 0
  };

  constructor(dryRun: boolean = false) {
    this.dryRun = dryRun;
    
    // Initialize RAG configuration
    this.ragConfig = getRAGConfig();
    
    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
    }
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
    
    // Initialize OpenAI client
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      throw new Error('Missing OPENAI_API_KEY environment variable');
    }
    
    this.openai = new OpenAI({ 
      apiKey: openaiKey,
      timeout: 60000 // 60 second timeout
    });
    
    console.log(`🧠 RAG Pedagogical Curator initialized (${dryRun ? 'DRY RUN' : 'LIVE MODE'})`);
    console.log('✅ Connected to Supabase');
    console.log(`📚 Using RAG table: ${this.ragConfig.targetTable}`);
  }

  /**
   * Rate limiter to ensure 1 request per second
   */
  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minInterval = 1000; // 1 second
    
    if (timeSinceLastRequest < minInterval) {
      const waitTime = minInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Analyze a chunk using OpenAI to extract pedagogical metadata
   */
  private async analyzeChunk(chunk: ChunkRecord, chunkIndex: number, totalChunks: number): Promise<PedagogicalAnalysis | null> {
    try {
      const text = chunk.content || '';
      if (!text.trim()) {
        console.warn(`⚠️  Skipping chunk ${chunk.id} - no content to analyze`);
        return null;
      }

      console.log(`🔍 Analyzing chunk ${chunkIndex + 1}/${totalChunks} (ID: ${chunk.id})...`);
      
      // Apply rate limiting
      await this.rateLimit();

      const prompt = `
Analyze the following educational content for pedagogical effectiveness. Return ONLY a valid JSON object with these exact fields:

{
  "teaching_clarity": 0.85,
  "learner_engagement": 0.78,
  "scenario_alignment": 0.92,
  "cognitive_progression": 0.81,
  "segment_type": "teaching",
  "complexity_level": "intermediate",
  "learner_focus": "skill"
}

Content to analyze:
"${text.slice(0, 2000)}"

Guidelines:
- teaching_clarity: How clear and well-structured is the instructional content? (0-1)
- learner_engagement: How engaging and interactive is the content? (0-1)
- scenario_alignment: How well does it align with real-world scenarios? (0-1)
- cognitive_progression: How well does it build on previous knowledge? (0-1)
- segment_type: "teaching" | "practice" | "scenario" | "assessment"
- complexity_level: "basic" | "intermediate" | "advanced"
- learner_focus: "knowledge" | "skill" | "reflection"

Return ONLY the JSON object, no other text.`;

      // Make OpenAI API call with timeout and retry logic
      let response;
      let retryCount = 0;
      const maxRetries = 1;
      
      while (retryCount <= maxRetries) {
        try {
          response = await this.openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.1,
            max_tokens: 200
          });
          break; // Success, exit retry loop
        } catch (error: any) {
          if (error.code === 'timeout' || error.message?.includes('timeout')) {
            this.stats.timeouts++;
            if (retryCount < maxRetries) {
              console.warn(`⏰ Timeout on chunk ${chunk.id}, retrying... (attempt ${retryCount + 1}/${maxRetries + 1})`);
              this.stats.retries++;
              retryCount++;
              await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
              continue;
            } else {
              console.warn(`⏰ Timeout on chunk ${chunk.id} after ${maxRetries + 1} attempts, skipping...`);
              this.stats.errors++;
              return null;
            }
          } else {
            throw error; // Re-throw non-timeout errors
          }
        }
      }

      const analysisText = response.choices[0]?.message?.content?.trim();
      if (!analysisText) {
        throw new Error('No response from OpenAI');
      }

      // Parse JSON response
      const analysis = JSON.parse(analysisText) as PedagogicalAnalysis;
      
      // Validate the analysis
      if (typeof analysis.teaching_clarity !== 'number' || 
          typeof analysis.learner_engagement !== 'number' ||
          typeof analysis.scenario_alignment !== 'number' ||
          typeof analysis.cognitive_progression !== 'number') {
        throw new Error('Invalid analysis format from OpenAI');
      }

      return analysis;
    } catch (error) {
      console.error(`❌ Error analyzing chunk ${chunk.id}:`, error);
      this.stats.errors++;
      return null;
    }
  }

  /**
   * Update a chunk with pedagogical metadata
   */
  private async updateChunk(chunkId: string, analysis: PedagogicalAnalysis): Promise<boolean> {
    try {
      const engagementScore = (
        analysis.teaching_clarity + 
        analysis.learner_engagement + 
        analysis.scenario_alignment + 
        analysis.cognitive_progression
      ) / 4;

      if (this.dryRun) {
        console.log(`🔍 [DRY RUN] Would update chunk ${chunkId} with engagement_score: ${engagementScore.toFixed(2)}`);
        return true;
      }

      const { error } = await this.supabase
        .from(this.ragConfig.targetTable)
        .update({
          pedagogical_metadata: analysis,
          engagement_score: engagementScore
        })
        .eq('id', chunkId);

      if (error) {
        throw error;
      }

      console.log(`✅ Updated chunk ${chunkId} — engagement_score: ${engagementScore.toFixed(2)}`);
      this.stats.updated++;
      return true;
    } catch (error) {
      console.error(`❌ Error updating chunk ${chunkId}:`, error);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Save a golden pattern to pedagogical_memory
   */
  private async saveGoldenPattern(analysis: PedagogicalAnalysis, chunk: ChunkRecord): Promise<boolean> {
    try {
      const engagementScore = (
        analysis.teaching_clarity + 
        analysis.learner_engagement + 
        analysis.scenario_alignment + 
        analysis.cognitive_progression
      ) / 4;

      // Generate pattern description based on analysis
      const pattern = `High-engagement ${analysis.segment_type} content with ${analysis.complexity_level} complexity focusing on ${analysis.learner_focus}`;
      
      const worksWhen = `When teaching ${analysis.segment_type} content at ${analysis.complexity_level} level for ${analysis.learner_focus} development`;
      
      const avoidWhen = `Avoid when content lacks clear structure or when complexity doesn't match learner needs`;

      const goldenPattern: GoldenPattern = {
        pattern,
        works_when: worksWhen,
        avoid_when: avoidWhen,
        evidence: analysis,
        terminology_bias: {}
      };

      if (this.dryRun) {
        console.log(`🔍 [DRY RUN] Would save golden pattern: "${pattern}"`);
        return true;
      }

      const { error } = await this.supabase
        .from('pedagogical_memory')
        .insert(goldenPattern);

      if (error) {
        throw error;
      }

      console.log(`🌟 Added to Golden Set: "${pattern}"`);
      this.stats.goldenSet++;
      return true;
    } catch (error) {
      console.error(`❌ Error saving golden pattern:`, error);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Process a single chunk
   */
  private async processChunk(chunk: ChunkRecord, chunkIndex: number, totalChunks: number): Promise<void> {
    try {
      this.stats.processed++;
      
      // Analyze the chunk
      const analysis = await this.analyzeChunk(chunk, chunkIndex, totalChunks);
      if (!analysis) {
        return;
      }

      // Update the chunk with metadata
      await this.updateChunk(chunk.id, analysis);

      // Check if it qualifies for golden set
      const engagementScore = (
        analysis.teaching_clarity + 
        analysis.learner_engagement + 
        analysis.scenario_alignment + 
        analysis.cognitive_progression
      ) / 4;

      if (engagementScore >= 0.8) {
        await this.saveGoldenPattern(analysis, chunk);
      } else if (engagementScore < 0.7) {
        // Mark as low quality (could add archived flag if column exists)
        console.log(`📉 Low quality chunk ${chunk.id} (score: ${engagementScore.toFixed(2)})`);
        this.stats.archived++;
      }

      // Rate limiting is handled in analyzeChunk method
      
    } catch (error) {
      console.error(`❌ Error processing chunk ${chunk.id}:`, error);
      this.stats.errors++;
    }
  }

  /**
   * Main execution function
   */
  public async run(): Promise<void> {
    try {
      console.log('🚀 Starting RAG Pedagogical Curator...');
      
      // Fetch all chunks
      console.log('📥 Fetching storyboard chunks...');
      const { data: chunks, error } = await this.supabase
        .from(this.ragConfig.targetTable)
        .select('id, content, metadata, storyboard_id, scene_no')
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      if (!chunks || chunks.length === 0) {
        console.log('ℹ️  No chunks found to process');
        return;
      }

      // Limit chunks for dry run
      const chunksToProcess = this.dryRun ? chunks.slice(0, 10) : chunks;
      const totalChunks = chunksToProcess.length;
      
      console.log(`📊 Found ${chunks.length} chunks to process${this.dryRun ? ` (limited to first ${totalChunks} for dry run)` : ''}`);

      // Process each chunk
      for (let i = 0; i < chunksToProcess.length; i++) {
        const chunk = chunksToProcess[i];
        console.log(`\n🔄 Processing chunk ${i + 1}/${totalChunks} (ID: ${chunk.id})`);
        await this.processChunk(chunk, i, totalChunks);
      }

      // Print final summary
      console.log('\n🏁 RAG Curator Summary:');
      console.log(`   📊 Processed: ${this.stats.processed} chunks`);
      console.log(`   ✅ Updated: ${this.stats.updated} chunks`);
      console.log(`   📉 Archived: ${this.stats.archived} chunks`);
      console.log(`   🌟 Golden Set: ${this.stats.goldenSet} patterns`);
      console.log(`   ⏰ Timeouts: ${this.stats.timeouts} chunks`);
      console.log(`   🔄 Retries: ${this.stats.retries} attempts`);
      console.log(`   ❌ Errors: ${this.stats.errors} chunks`);
      
      if (this.dryRun) {
        console.log('\n🔍 This was a DRY RUN - no data was actually modified');
        console.log('   Run without --dryRun to apply changes');
      }

    } catch (error) {
      console.error('💥 Fatal error in RAG Curator:', error);
      process.exit(1);
    }
  }
}

/**
 * CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dryRun') || args.includes('--dry-run');
  
  console.log('🧠 RAG Pedagogical Curator');
  console.log('========================');
  
  if (dryRun) {
    console.log('🔍 Running in DRY RUN mode - no changes will be made');
  }
  
  const curator = new RAGCurator(dryRun);
  await curator.run();
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

export { RAGCurator };
