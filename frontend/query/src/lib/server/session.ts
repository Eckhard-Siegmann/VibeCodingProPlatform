/**
 * Session management (ADR 007)
 *
 * Database-backed sessions with SHA-256 hashed tokens stored as HTTP-only cookies.
 * Raw token is never stored server-side.
 */

import crypto from 'crypto';
import type { Cookies } from '@sveltejs/kit';
import { getDatabase, generateId, nowIso } from './db';

const SESSION_COOKIE = 'session';
const REMEMBER_ME_DAYS = 30;
const MAX_LIFETIME_DAYS = 90;

export interface SessionUser {
	user_id: string;
	email: string;
	display_name: string;
	role: string;
	email_confirmed: boolean;
	login_enabled: boolean;
	audio_cues_enabled: boolean;
}

/** Hash a raw session token with SHA-256 for storage */
function hashToken(token: string): string {
	return crypto.createHash('sha256').update(token).digest('hex');
}

/** Generate a cryptographically random 64-char hex session token */
function generateToken(): string {
	return crypto.randomBytes(32).toString('hex');
}

/**
 * Create a new session for a user. Returns the raw token (set in cookie).
 */
export function createSession(
	userId: string,
	cookies: Cookies,
	rememberMe: boolean = false,
	userAgent?: string
): string {
	const db = getDatabase();
	const token = generateToken();
	const tokenHash = hashToken(token);
	const now = nowIso();
	const sessionId = generateId();

	// Clean up expired sessions for this user
	db.prepare(`
		DELETE FROM user_sessions
		WHERE user_id = ? AND expires_at IS NOT NULL AND expires_at < ?
	`).run(userId, now);

	const expiresAt = rememberMe
		? new Date(Date.now() + REMEMBER_ME_DAYS * 24 * 60 * 60 * 1000).toISOString()
		: null;

	db.prepare(`
		INSERT INTO user_sessions (session_id, user_id, token_hash, expires_at, created_at, last_seen_at, user_agent)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`).run(sessionId, userId, tokenHash, expiresAt, now, now, userAgent ?? null);

	// Set cookie
	const maxAge = rememberMe ? REMEMBER_ME_DAYS * 24 * 60 * 60 : undefined;
	cookies.set(SESSION_COOKIE, token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: false, // TODO: set true in production (HTTPS)
		...(maxAge ? { maxAge } : {})
	});

	return token;
}

/**
 * Validate a session from cookies. Returns the user if valid, null otherwise.
 */
export function validateSession(cookies: Cookies): SessionUser | null {
	const token = cookies.get(SESSION_COOKIE);
	if (!token) return null;

	const db = getDatabase();
	const tokenHash = hashToken(token);
	const now = nowIso();

	const row = db.prepare(`
		SELECT
			s.session_id,
			s.user_id,
			s.expires_at,
			s.created_at as session_created_at,
			u.email,
			u.display_name,
			u.role,
			u.email_confirmed,
			u.login_enabled,
			u.audio_cues_enabled
		FROM user_sessions s
		JOIN users u ON s.user_id = u.user_id
		WHERE s.token_hash = ?
	`).get(tokenHash) as any;

	if (!row) return null;

	// Check expiry
	if (row.expires_at && row.expires_at < now) {
		db.prepare('DELETE FROM user_sessions WHERE session_id = ?').run(row.session_id);
		clearSessionCookie(cookies);
		return null;
	}

	// Check max lifetime (90 days)
	const createdAt = new Date(row.session_created_at).getTime();
	const maxLifetime = MAX_LIFETIME_DAYS * 24 * 60 * 60 * 1000;
	if (Date.now() - createdAt > maxLifetime) {
		db.prepare('DELETE FROM user_sessions WHERE session_id = ?').run(row.session_id);
		clearSessionCookie(cookies);
		return null;
	}

	// Check login_enabled
	if (!row.login_enabled) {
		db.prepare('DELETE FROM user_sessions WHERE session_id = ?').run(row.session_id);
		clearSessionCookie(cookies);
		return null;
	}

	// Update last_seen_at
	db.prepare('UPDATE user_sessions SET last_seen_at = ? WHERE session_id = ?').run(now, row.session_id);

	return {
		user_id: row.user_id,
		email: row.email,
		display_name: row.display_name,
		role: row.role,
		email_confirmed: !!row.email_confirmed,
		login_enabled: !!row.login_enabled,
		audio_cues_enabled: !!row.audio_cues_enabled
	};
}

/**
 * Destroy a single session (logout).
 */
export function destroySession(cookies: Cookies): void {
	const token = cookies.get(SESSION_COOKIE);
	if (!token) return;

	const db = getDatabase();
	const tokenHash = hashToken(token);
	db.prepare('DELETE FROM user_sessions WHERE token_hash = ?').run(tokenHash);
	clearSessionCookie(cookies);
}

/**
 * Destroy all sessions for a user (logout everywhere, password change).
 */
export function destroyAllSessions(userId: string): void {
	const db = getDatabase();
	db.prepare('DELETE FROM user_sessions WHERE user_id = ?').run(userId);
}

function clearSessionCookie(cookies: Cookies): void {
	cookies.delete(SESSION_COOKIE, { path: '/' });
}
