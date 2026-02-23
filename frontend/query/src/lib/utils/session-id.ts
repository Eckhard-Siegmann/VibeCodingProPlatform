import { browser } from '$app/environment';
import { simpleHash, hashToHex } from './hash';

const SESSION_KEY = 'event_session_id';

/**
 * Get or create a session ID stored in localStorage.
 * Returns empty string on server side.
 */
export function getOrCreateSessionId(): string {
	if (!browser) return '';

	try {
		let sessionId = localStorage.getItem(SESSION_KEY);

		if (!sessionId) {
			sessionId = crypto.randomUUID();
			localStorage.setItem(SESSION_KEY, sessionId);
		}

		return sessionId;
	} catch {
		// localStorage might be blocked (private browsing, etc.)
		return 'temp-' + crypto.randomUUID();
	}
}

/**
 * Hash a session ID using SHA-256.
 * Returns the hash as a hex string.
 * Falls back to a simple hash if crypto.subtle is unavailable (non-HTTPS).
 */
export async function hashSessionId(sessionId: string): Promise<string> {
	// crypto.subtle is only available in secure contexts (HTTPS or localhost)
	if (crypto.subtle) {
		const encoder = new TextEncoder();
		const data = encoder.encode(sessionId);
		const hashBuffer = await crypto.subtle.digest('SHA-256', data);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
	}

	// Fallback: simple hash for development over HTTP
	return 'dev_' + hashToHex(simpleHash(sessionId));
}

/**
 * Get the hashed session ID for API requests.
 */
export async function getSessionHash(): Promise<string> {
	const sessionId = getOrCreateSessionId();
	if (!sessionId) return '';
	return hashSessionId(sessionId);
}
