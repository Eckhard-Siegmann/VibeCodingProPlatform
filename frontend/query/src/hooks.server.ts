/**
 * SvelteKit server hooks — OTP rate limiting for password reset requests.
 * Spec: ADR 004 (Rate limiting for password reset OTP)
 *
 * Constraints:
 * - Max 3 OTP requests per hour per email address
 * - Max 10 OTP requests per hour per IP address
 * - 60-second cooldown between requests for the same email
 * - Returns 429 Too Many Requests with Retry-After header
 *
 * Implementation: in-memory Maps, lazily cleaned on each request.
 * Resets on server restart — acceptable per Ch.18.10 threat model.
 */

import type { Handle } from '@sveltejs/kit';

interface RateEntry {
	count: number;
	firstRequest: number;
	lastRequest: number;
}

const emailLimits = new Map<string, RateEntry>();
const ipLimits = new Map<string, RateEntry>();

const HOUR_MS = 60 * 60 * 1000;
const COOLDOWN_MS = 60 * 1000;
const MAX_PER_EMAIL = 3;
const MAX_PER_IP = 10;

/** Remove entries older than 1 hour. */
function cleanup(map: Map<string, RateEntry>): void {
	const cutoff = Date.now() - HOUR_MS;
	for (const [key, entry] of map) {
		if (entry.lastRequest < cutoff) {
			map.delete(key);
		}
	}
}

/** Check and update rate limit. Returns seconds to wait, or 0 if allowed. */
function checkLimit(
	map: Map<string, RateEntry>,
	key: string,
	maxPerHour: number,
	cooldownMs: number = 0
): number {
	const now = Date.now();
	const entry = map.get(key);

	if (!entry) {
		map.set(key, { count: 1, firstRequest: now, lastRequest: now });
		return 0;
	}

	// Reset window if older than 1 hour
	if (now - entry.firstRequest > HOUR_MS) {
		map.set(key, { count: 1, firstRequest: now, lastRequest: now });
		return 0;
	}

	// Check cooldown
	if (cooldownMs > 0) {
		const elapsed = now - entry.lastRequest;
		if (elapsed < cooldownMs) {
			return Math.ceil((cooldownMs - elapsed) / 1000);
		}
	}

	// Check hourly limit
	if (entry.count >= maxPerHour) {
		const resetAt = entry.firstRequest + HOUR_MS;
		return Math.ceil((resetAt - now) / 1000);
	}

	// Allow
	entry.count++;
	entry.lastRequest = now;
	return 0;
}

export const handle: Handle = async ({ event, resolve }) => {
	// Rate limit only POST /forgot-password
	if (event.request.method === 'POST' && event.url.pathname === '/forgot-password') {
		// Lazy cleanup
		cleanup(emailLimits);
		cleanup(ipLimits);

		// Extract email from form data (clone request to read body without consuming it)
		const cloned = event.request.clone();
		try {
			const formData = await cloned.formData();
			const email = formData.get('email')?.toString().trim().toLowerCase() ?? '';
			const ip = event.getClientAddress();

			if (email) {
				// Check email-based limits (with 60s cooldown)
				const emailWait = checkLimit(emailLimits, email, MAX_PER_EMAIL, COOLDOWN_MS);
				if (emailWait > 0) {
					return new Response(
						JSON.stringify({ success: false, error: 'Too many requests. Please wait before trying again.' }),
						{
							status: 429,
							headers: {
								'Content-Type': 'application/json',
								'Retry-After': String(emailWait)
							}
						}
					);
				}
			}

			// Check IP-based limits (no cooldown, just hourly cap)
			const ipWait = checkLimit(ipLimits, ip, MAX_PER_IP);
			if (ipWait > 0) {
				return new Response(
					JSON.stringify({ success: false, error: 'Too many requests from this address. Please try again later.' }),
					{
						status: 429,
						headers: {
							'Content-Type': 'application/json',
							'Retry-After': String(ipWait)
						}
					}
				);
			}
		} catch {
			// If we can't parse form data, let the request through
			// (the form action will handle validation)
		}
	}

	return resolve(event);
};
