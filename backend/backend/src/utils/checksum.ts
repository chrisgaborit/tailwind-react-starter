// backend/src/utils/checksum.ts
import crypto from 'crypto';

/**
 * Generate checksum for content tracking and auditability
 */
export function hash(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
}

/**
 * Generate checksum for object (serializes to JSON first)
 */
export function hashObject(obj: any): string {
  const serialized = JSON.stringify(obj, Object.keys(obj).sort());
  return hash(serialized);
}


