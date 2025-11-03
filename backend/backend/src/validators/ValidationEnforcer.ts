// backend/src/validators/ValidationEnforcer.ts
import crypto from 'crypto';
import { z } from 'zod';
import { ValidationResult, ValidationError } from '../types/storyboardTypes';

/**
 * ValidationEnforcer - The "Quality Gatekeeper"
 * 
 * Validates AI output against strict schemas, retries on failure.
 * Ensures all generated content meets quality standards before acceptance.
 * 
 * Integration: Wraps all AI agent calls for quality enforcement
 */
export class ValidationEnforcer {
  private readonly maxRetries = 3;
  private readonly validationLog: Array<{ timestamp: string; checksum: string; result: string }> = [];
  
  constructor() {
    console.log('🛡️ ValidationEnforcer initialized - Quality gatekeeper active');
  }

  /**
   * Validate content against schema with retry logic
   * 
   * @param content - AI-generated content to validate
   * @param zodSchema - Zod schema for validation
   * @param maxRetries - Maximum retry attempts (default: 3)
   * @returns ValidationResult with success/failure details
   */
  async validateAndRetry(
    content: string,
    zodSchema: z.ZodSchema,
    maxRetries: number = this.maxRetries
  ): Promise<ValidationResult> {
    const timestamp = new Date().toISOString();
    const checksum = this.generateChecksum(content);
    const failures: string[] = [];
    let attempts = 0;
    let lastValidContent = content;

    console.log(`🛡️ ValidationEnforcer: Starting validation`);
    console.log(`   🔐 Content Checksum: ${checksum}`);
    console.log(`   📊 Max Retries: ${maxRetries}`);

    // Validation attempt loop
    while (attempts < maxRetries) {
      attempts++;
      console.log(`   🔄 Attempt ${attempts}/${maxRetries}`);

      try {
        // Parse and validate content
        const parsedContent = this.parseContent(content);
        const validationResult = zodSchema.safeParse(parsedContent);

        if (validationResult.success) {
          // Validation successful
          const successResult: ValidationResult = {
            isValid: true,
            content: JSON.stringify(validationResult.data),
            attempts,
            failures: [],
            checksum: this.generateChecksum(JSON.stringify(validationResult.data)),
            timestamp,
            validationSchema: zodSchema.description || 'Unknown schema'
          };

          this.logValidation('SUCCESS', checksum, `Validated after ${attempts} attempts`);
          console.log(`   ✅ Validation successful after ${attempts} attempts`);
          
          return successResult;
        } else {
          // Validation failed - collect error details
          const errorDetails = this.extractValidationErrors(validationResult.error);
          failures.push(...errorDetails);
          
          console.log(`   ❌ Validation failed on attempt ${attempts}`);
          console.log(`   📋 Errors: ${errorDetails.join(', ')}`);
          
          // If not the last attempt, prepare for retry
          if (attempts < maxRetries) {
            console.log(`   🔄 Preparing for retry...`);
            // In a real implementation, you would trigger regeneration here
            // For now, we'll simulate by modifying the content slightly
            content = this.simulateRegeneration(content, errorDetails);
            lastValidContent = content;
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';
        failures.push(`Parse error: ${errorMessage}`);
        console.log(`   💥 Parse error on attempt ${attempts}: ${errorMessage}`);
        
        if (attempts < maxRetries) {
          content = this.simulateRegeneration(content, [errorMessage]);
          lastValidContent = content;
        }
      }
    }

    // All attempts failed - return structured error
    const errorResult: ValidationError = {
      error: `Validation failed after ${attempts} attempts`,
      attempts,
      lastAttemptContent: lastValidContent,
      failures: [...new Set(failures)], // Remove duplicates
      validationSchema: zodSchema.description || 'Unknown schema',
      guidance: 'Please revise the teaching prompt or escalate to a human reviewer.',
      checksum: this.generateChecksum(lastValidContent),
      timestamp
    };

    this.logValidation('FAILED', checksum, `Failed after ${attempts} attempts: ${failures.join('; ')}`);
    console.log(`   💥 Validation failed after ${attempts} attempts`);
    console.log(`   📋 Final errors: ${failures.join('; ')}`);

    // Return as ValidationResult with isValid: false
    return {
      isValid: false,
      content: JSON.stringify(errorResult),
      attempts,
      failures: [...new Set(failures)],
      checksum: this.generateChecksum(JSON.stringify(errorResult)),
      timestamp,
      validationSchema: zodSchema.description || 'Unknown schema',
      guidance: 'Please revise the teaching prompt or escalate to a human reviewer.'
    };
  }

  /**
   * Parse content (JSON or other formats)
   */
  private parseContent(content: string): any {
    try {
      // Try to parse as JSON first
      return JSON.parse(content);
    } catch {
      // If not JSON, return as string for schema validation
      return { content };
    }
  }

  /**
   * Extract detailed validation errors from Zod error
   */
  private extractValidationErrors(error: z.ZodError): string[] {
    return error.errors.map(err => {
      const path = err.path.length > 0 ? err.path.join('.') : 'root';
      return `${path}: ${err.message}`;
    });
  }

  /**
   * Simulate content regeneration (placeholder for actual regeneration logic)
   */
  private simulateRegeneration(content: string, errors: string[]): string {
    // In a real implementation, this would trigger the AI agent to regenerate
    // For now, we'll just add a timestamp to simulate change
    const timestamp = new Date().toISOString();
    return content.replace(/timestamp/g, `regenerated-${timestamp}`);
  }

  /**
   * Generate checksum for content tracking
   */
  private generateChecksum(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
  }

  /**
   * Log validation attempt for audit trail
   */
  private logValidation(result: 'SUCCESS' | 'FAILED', checksum: string, details: string): void {
    this.validationLog.push({
      timestamp: new Date().toISOString(),
      checksum,
      result: `${result}: ${details}`
    });

    // Keep only last 100 entries to prevent memory issues
    if (this.validationLog.length > 100) {
      this.validationLog.shift();
    }
  }

  /**
   * Get validation statistics
   */
  getValidationStats(): { total: number; success: number; failed: number; successRate: number } {
    const total = this.validationLog.length;
    const success = this.validationLog.filter(log => log.result.startsWith('SUCCESS')).length;
    const failed = total - success;
    const successRate = total > 0 ? (success / total) * 100 : 0;

    return { total, success, failed, successRate };
  }

  /**
   * Get recent validation log
   */
  getRecentLogs(count: number = 10): Array<{ timestamp: string; checksum: string; result: string }> {
    return this.validationLog.slice(-count);
  }
}


