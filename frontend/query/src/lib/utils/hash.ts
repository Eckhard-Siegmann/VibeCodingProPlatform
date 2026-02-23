/**
 * Hash utilities for deterministic mapping and session identification.
 *
 * Used for:
 * - Avatar color assignment (deterministic from user_id)
 * - Session hash generation (for anonymous session tracking)
 */

/**
 * Simple 32-bit hash function for deterministic mapping.
 * Uses DJB2 algorithm variant.
 *
 * @param value - String to hash
 * @returns Signed 32-bit integer hash
 *
 * @example
 * simpleHash("user-123") // -1234567890
 * simpleHash("user-123") // Always returns same value
 */
export function simpleHash(value: string): number {
	let hash = 0;
	for (let i = 0; i < value.length; i++) {
		hash = (hash << 5) - hash + value.charCodeAt(i);
		hash = hash & hash; // Convert to 32-bit integer
	}
	return hash;
}

/**
 * Convert hash number to zero-padded hex string.
 *
 * @param hash - Hash number (can be negative, will use absolute value)
 * @param padding - Number of hex characters (default 8)
 * @returns Hex string like "0000a4f2"
 *
 * @example
 * hashToHex(12345678) // "00bc614e"
 * hashToHex(-12345678, 6) // "bc614e"
 */
export function hashToHex(hash: number, padding: number = 8): string {
	return Math.abs(hash).toString(16).padStart(padding, '0');
}
