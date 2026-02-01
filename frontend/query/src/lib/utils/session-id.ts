import { browser } from '$app/environment';

const SESSION_KEY = 'meetup_session_id';

/**
 * Get or create a session ID stored in localStorage.
 * Returns empty string on server side.
 */
export function getOrCreateSessionId(): string {
	if (!browser) return '';

	let sessionId = localStorage.getItem(SESSION_KEY);

	if (!sessionId) {
		sessionId = crypto.randomUUID();
		localStorage.setItem(SESSION_KEY, sessionId);
	}

	return sessionId;
}

/**
 * Hash a session ID using SHA-256.
 * Returns the hash as a hex string.
 */
export async function hashSessionId(sessionId: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(sessionId);
	const hashBuffer = await crypto.subtle.digest('SHA-256', data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Get the hashed session ID for API requests.
 */
export async function getSessionHash(): Promise<string> {
	const sessionId = getOrCreateSessionId();
	if (!sessionId) return '';
	return hashSessionId(sessionId);
}
