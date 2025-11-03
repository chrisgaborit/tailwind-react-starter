// backend/src/utils/safeJSONParse.ts

/**
 * Safe JSON Parser for AI Responses
 * 
 * Handles multiple response formats from OpenAI:
 * 1. Markdown-wrapped JSON (```json ... ```)
 * 2. Raw JSON strings
 * 3. JSON with comments
 * 4. Malformed JSON with trailing commas
 * 
 * Returns parsed object or throws descriptive error.
 */

interface ParseResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  rawInput?: string;
}

/**
 * Extract and parse JSON from various response formats
 */
export function safeJSONParse<T = any>(response: string): T {
  if (!response || typeof response !== 'string') {
    throw new Error('Invalid input: response must be a non-empty string');
  }

  const trimmed = response.trim();
  
  // Strategy 1: Try direct parse first (fastest path)
  try {
    return JSON.parse(trimmed);
  } catch (directError) {
    console.log('📝 Direct JSON parse failed, trying extraction strategies...');
  }

  // Strategy 2: Extract from markdown code blocks
  const markdownMatches = [
    /```json\s*([\s\S]*?)\s*```/,
    /```\s*([\s\S]*?)\s*```/,
    /`([\s\S]*?)`/
  ];

  for (const pattern of markdownMatches) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      try {
        const extracted = match[1].trim();
        console.log('✅ Extracted JSON from markdown block');
        return JSON.parse(extracted);
      } catch (error) {
        console.log('⚠️ Markdown extraction found content but parse failed');
      }
    }
  }

  // Strategy 3: Remove comments and try parse
  try {
    const withoutComments = trimmed
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove /* */ comments
      .replace(/\/\/.*/g, ''); // Remove // comments
    
    console.log('✅ Removed comments, attempting parse');
    return JSON.parse(withoutComments);
  } catch (error) {
    console.log('⚠️ Comment removal strategy failed');
  }

  // Strategy 4: Fix common JSON errors
  try {
    const fixed = trimmed
      .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
      .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":') // Quote unquoted keys
      .replace(/:\s*'([^']*)'/g, ': "$1"'); // Replace single quotes with double
    
    console.log('✅ Applied JSON fixes, attempting parse');
    return JSON.parse(fixed);
  } catch (error) {
    console.log('⚠️ JSON fix strategy failed');
  }

  // Strategy 5: Find JSON objects/arrays in text
  const jsonPatterns = [
    /(\{[\s\S]*\})/,  // Find first { ... }
    /(\[[\s\S]*\])/   // Find first [ ... ]
  ];

  for (const pattern of jsonPatterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      try {
        console.log('✅ Extracted JSON object from text');
        return JSON.parse(match[1]);
      } catch (error) {
        console.log('⚠️ Pattern extraction failed');
      }
    }
  }

  // All strategies failed - throw comprehensive error
  const errorPreview = trimmed.substring(0, 200);
  throw new Error(
    `Failed to parse JSON after trying all extraction strategies.\n` +
    `Preview: ${errorPreview}...\n` +
    `Length: ${trimmed.length} characters`
  );
}

/**
 * Safe parse with detailed result (doesn't throw)
 */
export function safeJSONParseWithResult<T = any>(response: string): ParseResult<T> {
  try {
    const data = safeJSONParse<T>(response);
    return {
      success: true,
      data
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      rawInput: response.substring(0, 500)
    };
  }
}

/**
 * Parse with fallback value
 */
export function safeJSONParseOrDefault<T = any>(response: string, defaultValue: T): T {
  try {
    return safeJSONParse<T>(response);
  } catch (error) {
    console.warn('⚠️ JSON parse failed, returning default value:', error);
    return defaultValue;
  }
}

/**
 * Validate parsed object has required keys
 */
export function parseAndValidate<T = any>(
  response: string, 
  requiredKeys: string[]
): T {
  const parsed = safeJSONParse<T>(response);
  
  const missing = requiredKeys.filter(key => !(key in (parsed as any)));
  
  if (missing.length > 0) {
    throw new Error(
      `Parsed JSON is missing required keys: ${missing.join(', ')}\n` +
      `Available keys: ${Object.keys(parsed as any).join(', ')}`
    );
  }
  
  return parsed;
}

export default safeJSONParse;


