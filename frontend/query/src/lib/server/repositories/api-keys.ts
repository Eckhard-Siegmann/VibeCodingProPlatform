import { getDatabase, generateId, nowIso } from '$lib/server/db';
import { createHash, randomBytes } from 'crypto';

// --- Types ---

export interface ApiKeyRow {
	api_key_id: string;
	display_prefix: string;
	label: string | null;
	valid_from: string;
	valid_until: string | null;
	revoked_at: string | null;
	created_at: string;
	bot_user_id: string | null;
	bot_display_name: string | null;
	status: 'active' | 'revoked' | 'expired';
}

export interface NewApiKeyResult {
	api_key_id: string;
	display_prefix: string;
	plaintext_key: string; // returned once to the caller; never stored
}

export interface BotAuthResult {
	bot_user_id: string;
	display_name: string;
	role: string;
	owner_user_id: string;
	api_key_id: string;
}

// --- Helpers ---

function computeStatus(
	row: { revoked_at: string | null; valid_until: string | null },
	now: string
): 'active' | 'revoked' | 'expired' {
	if (row.revoked_at) return 'revoked';
	if (row.valid_until && row.valid_until <= now) return 'expired';
	return 'active';
}

// --- Queries ---

/**
 * List all API keys owned by a human user, with linked bot info.
 * Ordered newest first.
 */
export function listApiKeys(ownerUserId: string): ApiKeyRow[] {
	const db = getDatabase();
	const rows = db
		.prepare(
			`
      SELECT
        ak.api_key_id,
        ak.display_prefix,
        ak.label,
        ak.valid_from,
        ak.valid_until,
        ak.revoked_at,
        ak.created_at,
        u.user_id      AS bot_user_id,
        u.display_name AS bot_display_name
      FROM api_keys ak
      LEFT JOIN users u ON u.api_key_id = ak.api_key_id
      WHERE ak.owner_user_id = ?
      ORDER BY ak.created_at DESC
    `
		)
		.all(ownerUserId) as Omit<ApiKeyRow, 'status'>[];

	const now = nowIso();
	return rows.map((row) => ({ ...row, status: computeStatus(row, now) }));
}

/**
 * Create a new API key for a human user and atomically provision a bot user.
 * Returns the plaintext key once — caller must surface it to the user immediately.
 *
 * Key format: `mk_` + 40 lowercase hex chars = 43 chars total (Ch.18.8.1).
 * display_prefix = first 8 chars (e.g. `mk_abc12d`).
 */
export function createApiKey(
	ownerUserId: string,
	ownerDisplayName: string,
	label?: string
): NewApiKeyResult {
	const db = getDatabase();

	// Generate key: mk_ + 40 hex chars = 43 total (Ch.18.8.1)
	const rawKey = 'mk_' + randomBytes(20).toString('hex');
	const keyHash = createHash('sha256').update(rawKey).digest('hex');
	const displayPrefix = rawKey.substring(0, 8); // 'mk_XXXXX'

	const keyId = generateId();
	const botUserId = generateId();
	const now = nowIso();

	const insertKey = db.prepare(`
    INSERT INTO api_keys
      (api_key_id, owner_user_id, key_hash, display_prefix, label, valid_from, valid_until, revoked_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, ?)
  `);

	// Bot user: role=agent, no email, no password, login disabled (Ch.18.8.3)
	const insertBot = db.prepare(`
    INSERT INTO users
      (user_id, email, display_name, password_hash, auth_provider, role, is_admin,
       email_confirmed, login_enabled, get_infoletter, show_on_contributor_wall,
       show_first_time_hints, audio_cues_enabled, api_key_id, created_at)
    VALUES (?, NULL, ?, NULL, 'local', 'agent', 0, 0, 0, 0, 0, 0, 0, ?, ?)
  `);

	db.transaction(() => {
		insertKey.run(keyId, ownerUserId, keyHash, displayPrefix, label ?? null, now, now);
		insertBot.run(botUserId, `Bot of ${ownerDisplayName}`, keyId, now);
	})();

	return { api_key_id: keyId, display_prefix: displayPrefix, plaintext_key: rawKey };
}

/**
 * Revoke an API key. The caller must be the owner.
 * Returns true if the key was revoked, false if not found or already revoked.
 * Revocation is permanent (Ch.19.3.42 invariants).
 */
export function revokeApiKey(keyId: string, ownerUserId: string): boolean {
	const db = getDatabase();
	const now = nowIso();
	const result = db
		.prepare(
			`
      UPDATE api_keys
      SET revoked_at = ?
      WHERE api_key_id = ?
        AND owner_user_id = ?
        AND revoked_at IS NULL
    `
		)
		.run(now, keyId, ownerUserId);
	return result.changes > 0;
}

/**
 * Validate a raw Bearer token and return the associated bot user.
 * Used by API endpoints that accept agent authentication (Ch.18.8.2).
 * Returns null if the token is invalid, expired, or revoked.
 */
export function validateBearerToken(rawToken: string): BotAuthResult | null {
	const db = getDatabase();
	const keyHash = createHash('sha256').update(rawToken).digest('hex');
	const now = nowIso();

	const row = db
		.prepare(
			`
      SELECT
        ak.api_key_id,
        ak.owner_user_id,
        u.user_id      AS bot_user_id,
        u.display_name,
        u.role
      FROM api_keys ak
      JOIN users u ON u.api_key_id = ak.api_key_id
      WHERE ak.key_hash = ?
        AND ak.valid_from <= ?
        AND (ak.valid_until IS NULL OR ak.valid_until > ?)
        AND ak.revoked_at IS NULL
    `
		)
		.get(keyHash, now, now) as
		| {
				api_key_id: string;
				owner_user_id: string;
				bot_user_id: string;
				display_name: string;
				role: string;
		  }
		| undefined;

	if (!row) return null;

	return {
		bot_user_id: row.bot_user_id,
		display_name: row.display_name,
		role: row.role,
		owner_user_id: row.owner_user_id,
		api_key_id: row.api_key_id
	};
}
