import { getDatabase, generateId, nowIso } from '../db';

export interface Session {
	session_id: string;
	session_hash: string;
	user_id: string | null;
	in_presence: boolean;
	created_at: string;
	last_seen_at: string;
}

interface SessionRow {
	session_id: string;
	session_hash: string;
	user_id: string | null;
	in_presence: number; // SQLite stores booleans as 0/1
	created_at: string;
	last_seen_at: string;
}

/**
 * Find a session by its hash.
 */
export function findSessionByHash(sessionHash: string): Session | null {
	const db = getDatabase();

	const row = db
		.prepare(
			`
		SELECT session_id, session_hash, user_id, in_presence, created_at, last_seen_at
		FROM sessions
		WHERE session_hash = ?
	`
		)
		.get(sessionHash) as SessionRow | undefined;

	if (!row) return null;

	return {
		...row,
		in_presence: Boolean(row.in_presence)
	};
}

/**
 * Create a new session.
 */
export function createSession(sessionHash: string, inPresence: boolean): Session {
	const db = getDatabase();
	const now = nowIso();
	const sessionId = generateId();

	db.prepare(
		`
		INSERT INTO sessions (session_id, session_hash, user_id, in_presence, created_at, last_seen_at)
		VALUES (?, ?, NULL, ?, ?, ?)
	`
	).run(sessionId, sessionHash, inPresence ? 1 : 0, now, now);

	return {
		session_id: sessionId,
		session_hash: sessionHash,
		user_id: null,
		in_presence: inPresence,
		created_at: now,
		last_seen_at: now
	};
}

/**
 * Get or create a session by hash.
 * If session exists, update last_seen_at.
 * If not, create new session with provided in_presence value.
 */
export function getOrCreateSession(sessionHash: string, inPresence: boolean): Session {
	const existing = findSessionByHash(sessionHash);

	if (existing) {
		updateLastSeen(existing.session_id);
		return {
			...existing,
			last_seen_at: nowIso()
		};
	}

	return createSession(sessionHash, inPresence);
}

/**
 * Update the last_seen_at timestamp for a session.
 */
export function updateLastSeen(sessionId: string): void {
	const db = getDatabase();

	db.prepare(
		`
		UPDATE sessions SET last_seen_at = ? WHERE session_id = ?
	`
	).run(nowIso(), sessionId);
}
