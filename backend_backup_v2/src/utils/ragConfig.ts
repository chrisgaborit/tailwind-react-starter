/**
 * RAG Configuration Utility
 * 
 * Centralized configuration for RAG table selection and filtering
 * Supports environment-based table selection and archived content filtering
 */

export interface RAGConfig {
  targetTable: string;
  ignoreArchived: boolean;
}

/**
 * Get RAG configuration from environment variables
 */
export function getRAGConfig(): RAGConfig {
  const targetTable = process.env.RAG_TARGET_TABLE || 'storyboard_chunks_v2';
  const ignoreArchived = process.env.RAG_IGNORE_ARCHIVED !== 'false'; // Default to true
  
  console.log(`📚 Using RAG table: ${targetTable}`);
  
  return {
    targetTable,
    ignoreArchived
  };
}

/**
 * Build Supabase query with RAG configuration
 */
export function buildRAGQuery(supabase: any, config: RAGConfig) {
  console.log('🔍 Debugging Supabase client:', {
    hasSupabase: !!supabase,
    hasFrom: !!supabase?.from,
    targetTable: config.targetTable,
    supabaseType: typeof supabase,
    supabaseKeys: supabase ? Object.keys(supabase) : 'null'
  });
  
  if (!supabase) {
    throw new Error('Supabase client is not initialized');
  }
  
  if (!supabase.from) {
    throw new Error('Supabase client is missing the "from" method');
  }
  
  let query = supabase.from(config.targetTable);
  console.log('🔍 Query builder type:', typeof query, 'Has eq method:', typeof query?.eq);
  
  if (config.ignoreArchived) {
    if (typeof query.eq === 'function') {
      query = query.eq('is_archived', false);
    } else {
      console.warn('⚠️ Query builder missing .eq method, skipping archived filter');
    }
  }
  
  return query;
}

/**
 * Build RAG query with additional filters
 */
export function buildRAGQueryWithFilters(
  supabase: any, 
  config: RAGConfig, 
  additionalFilters: Record<string, any> = {}
) {
  try {
    let query = buildRAGQuery(supabase, config);
    
    // Apply additional filters
    Object.entries(additionalFilters).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (typeof query.eq === 'function') {
          query = query.eq(key, value);
        } else {
          console.warn(`Query builder missing .eq method for key: ${key}`);
        }
      }
    });
    
    return query;
  } catch (error) {
    console.error('Error building RAG query with filters:', error);
    throw error;
  }
}

/**
 * Get RAG table name for logging
 */
export function getRAGTableName(): string {
  return process.env.RAG_TARGET_TABLE || 'storyboard_chunks_v2';
}

