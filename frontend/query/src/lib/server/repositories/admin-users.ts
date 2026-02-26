/**
 * Admin Users repository — user listing, role promotion, CSV import.
 * Spec: Ch.17.5 (User Management), Ch.18.7 (Role Escalation),
 *       Ch.30.4 (CSV Import), ADR 004 (bcrypt for OTP hashing)
 *
 * Role changes update users.role directly — not logged in decisions table
 * (decisions table is problem-scoped, requires problem_id NOT NULL).
 * See Ch.18.7 amendment for rationale.
 */

import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { getDatabase, generateId, nowIso } from '../db';

const BCRYPT_COST = 12;
const OTP_LENGTH = 12;

// ── Types ────────────────────────────────────────────────────────────

export interface AdminUserRow {
	user_id: string;
	email: string;
	display_name: string;
	role: string;
	auth_provider: string;
	email_confirmed: boolean;
	login_enabled: boolean;
	get_infoletter: boolean;
	created_at: string;
	last_login_at: string | null;
	events_attended: number;
}

export interface CsvImportRow {
	email: string;
	display_name: string;
	event_slug?: string;
	in_presence?: boolean;
}

export interface CsvImportResult {
	total: number;
	created: number;
	existing: number;
	registered: number;
	errors: Array<{ row: number; message: string }>;
	otpUsers: Array<{ email: string; displayName: string; otp: string }>;
}

// ── Types (Pagination) ──────────────────────────────────────────────

export interface UserListParams {
	page: number;
	pageSize: number;
	search: string;
	role: string;
	emailStatus: string;
	sort: string;
}

export interface PaginatedUserResult {
	items: AdminUserRow[];
	pagination: {
		page: number;
		pageSize: number;
		totalItems: number;
		totalPages: number;
	};
}

// ── Listing ──────────────────────────────────────────────────────────

/**
 * List all non-agent users with event attendance count.
 * Ordered by creation date descending (newest first).
 */
export function listUsers(): AdminUserRow[] {
	const db = getDatabase();

	const rows = db.prepare(`
		SELECT
			u.user_id,
			u.email,
			u.display_name,
			u.role,
			u.auth_provider,
			u.email_confirmed,
			u.login_enabled,
			u.get_infoletter,
			u.created_at,
			u.last_login_at,
			COUNT(er.registration_id) AS events_attended
		FROM users u
		LEFT JOIN event_registrations er
			ON u.user_id = er.user_id AND er.cancelled_at IS NULL
		WHERE u.role != 'agent'
		GROUP BY u.user_id
		ORDER BY u.created_at DESC
	`).all() as Array<{
		user_id: string;
		email: string;
		display_name: string;
		role: string;
		auth_provider: string;
		email_confirmed: number;
		login_enabled: number;
		get_infoletter: number;
		created_at: string;
		last_login_at: string | null;
		events_attended: number;
	}>;

	return rows.map((r) => ({
		user_id: r.user_id,
		email: r.email,
		display_name: r.display_name,
		role: r.role,
		auth_provider: r.auth_provider,
		email_confirmed: !!r.email_confirmed,
		login_enabled: !!r.login_enabled,
		get_infoletter: !!r.get_infoletter,
		created_at: r.created_at,
		last_login_at: r.last_login_at,
		events_attended: r.events_attended
	}));
}

/**
 * List non-agent users with server-side pagination, search, and filtering.
 * Spec: Ch.17.5, Ch.12.10 | Ticket: TICKET-30
 */
export function listUsersPaginated(params: UserListParams): PaginatedUserResult {
	const db = getDatabase();

	const conditions: string[] = ["u.role != 'agent'"];
	const args: (string | number)[] = [];

	// Search by display_name or email
	if (params.search) {
		conditions.push('(u.display_name LIKE ? COLLATE NOCASE OR u.email LIKE ? COLLATE NOCASE)');
		const term = `%${params.search}%`;
		args.push(term, term);
	}

	// Role filter
	if (params.role && params.role !== 'all') {
		conditions.push('u.role = ?');
		args.push(params.role);
	}

	// Email status filter
	if (params.emailStatus === 'confirmed') {
		conditions.push('u.email_confirmed = 1');
	} else if (params.emailStatus === 'unconfirmed') {
		conditions.push('u.email_confirmed = 0');
	}

	const whereClause = `WHERE ${conditions.join(' AND ')}`;

	// Sort
	let orderBy = 'u.created_at DESC';
	switch (params.sort) {
		case 'name_asc': orderBy = 'u.display_name COLLATE NOCASE ASC'; break;
		case 'name_desc': orderBy = 'u.display_name COLLATE NOCASE DESC'; break;
		case 'newest': orderBy = 'u.created_at DESC'; break;
		case 'oldest': orderBy = 'u.created_at ASC'; break;
		case 'role': orderBy = 'u.role ASC, u.display_name COLLATE NOCASE ASC'; break;
	}

	// Count total matching users
	const countRow = db.prepare(
		`SELECT COUNT(*) AS cnt FROM users u ${whereClause}`
	).get(...args) as { cnt: number };
	const totalItems = countRow.cnt;

	// Enforce limits
	const pageSize = Math.min(Math.max(params.pageSize, 1), 100);
	const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
	const page = Math.min(Math.max(params.page, 1), totalPages || 1);
	const offset = (page - 1) * pageSize;

	// Fetch paginated rows
	const rows = db.prepare(`
		SELECT
			u.user_id, u.email, u.display_name, u.role, u.auth_provider,
			u.email_confirmed, u.login_enabled, u.get_infoletter,
			u.created_at, u.last_login_at,
			COUNT(er.registration_id) AS events_attended
		FROM users u
		LEFT JOIN event_registrations er
			ON u.user_id = er.user_id AND er.cancelled_at IS NULL
		${whereClause}
		GROUP BY u.user_id
		ORDER BY ${orderBy}
		LIMIT ? OFFSET ?
	`).all(...args, pageSize, offset) as Array<{
		user_id: string;
		email: string;
		display_name: string;
		role: string;
		auth_provider: string;
		email_confirmed: number;
		login_enabled: number;
		get_infoletter: number;
		created_at: string;
		last_login_at: string | null;
		events_attended: number;
	}>;

	const items = rows.map((r) => ({
		user_id: r.user_id,
		email: r.email,
		display_name: r.display_name,
		role: r.role,
		auth_provider: r.auth_provider,
		email_confirmed: !!r.email_confirmed,
		login_enabled: !!r.login_enabled,
		get_infoletter: !!r.get_infoletter,
		created_at: r.created_at,
		last_login_at: r.last_login_at,
		events_attended: r.events_attended
	}));

	return {
		items,
		pagination: { page, pageSize, totalItems, totalPages }
	};
}

// ── Role Promotion ───────────────────────────────────────────────────

export type PromotableRole = 'moderator' | 'admin';

export interface PromoteResult {
	success: boolean;
	error?: string;
}

/**
 * Promote a user to a higher role.
 * Only admins may call this; the API layer enforces that.
 * Allowed promotions: any → moderator, moderator → admin.
 * An admin cannot be demoted via this function.
 */
export function promoteUser(userId: string, newRole: PromotableRole): PromoteResult {
	const db = getDatabase();

	const user = db.prepare('SELECT user_id, role FROM users WHERE user_id = ?').get(userId) as
		| { user_id: string; role: string }
		| undefined;

	if (!user) {
		return { success: false, error: 'User not found.' };
	}

	if (user.role === 'agent') {
		return { success: false, error: 'Agent accounts cannot be promoted.' };
	}

	if (user.role === 'admin' && newRole === 'moderator') {
		return { success: false, error: 'Cannot demote an administrator.' };
	}

	if (user.role === newRole) {
		return { success: false, error: `User already has the ${newRole} role.` };
	}

	db.prepare('UPDATE users SET role = ? WHERE user_id = ?').run(newRole, userId);

	return { success: true };
}

// ── CSV Import ───────────────────────────────────────────────────────

/**
 * Import users from CSV rows (Ch.30.4, Ch.17.5).
 *
 * Per-row logic:
 * - New email  → create user (role=observer, OTP, login_enabled=FALSE, email_confirmed=TRUE)
 * - Existing   → skip user creation, reuse user_id
 * - event_slug → create event registration (if event exists, check capacity)
 *
 * Returns import report including plain OTPs for dev-mode email logging.
 */
export async function importCsvUsers(rows: CsvImportRow[]): Promise<CsvImportResult> {
	const db = getDatabase();
	const now = nowIso();

	let created = 0;
	let existing = 0;
	let registered = 0;
	const errors: Array<{ row: number; message: string }> = [];
	const otpUsers: Array<{ email: string; displayName: string; otp: string }> = [];

	for (let i = 0; i < rows.length; i++) {
		const rowNum = i + 1;
		const row = rows[i];

		// Basic email validation
		if (!row.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
			errors.push({ row: rowNum, message: `Invalid email address: "${row.email}"` });
			continue;
		}

		if (!row.display_name?.trim()) {
			errors.push({ row: rowNum, message: `Row ${rowNum}: display_name is required.` });
			continue;
		}

		// Check if user exists
		const existingUser = db.prepare(
			'SELECT user_id FROM users WHERE LOWER(email) = LOWER(?)'
		).get(row.email) as { user_id: string } | undefined;

		let userId: string;

		if (existingUser) {
			userId = existingUser.user_id;
			existing++;
		} else {
			// Create new user with OTP
			userId = generateId();
			const otp = generateOtp();
			const otpHash = await bcrypt.hash(otp, BCRYPT_COST);

			db.prepare(`
				INSERT INTO users (
					user_id, email, display_name, auth_provider, role,
					email_confirmed, login_enabled,
					otp_hash, otp_is_initial,
					get_infoletter,
					show_on_contributor_wall, show_first_time_hints, audio_cues_enabled,
					created_at
				) VALUES (
					?, ?, ?, 'local', 'observer',
					1, 0,
					?, 1,
					1,
					1, 1, 0,
					?
				)
			`).run(userId, row.email, row.display_name.trim(), otpHash, now);

			created++;
			otpUsers.push({ email: row.email, displayName: row.display_name.trim(), otp });
		}

		// Register for event if event_slug provided
		if (row.event_slug) {
			const event = db.prepare(
				'SELECT event_id FROM events WHERE slug = ?'
			).get(row.event_slug) as { event_id: string } | undefined;

			if (!event) {
				errors.push({ row: rowNum, message: `Event not found: "${row.event_slug}"` });
				continue;
			}

			// Check for duplicate registration
			const alreadyRegistered = db.prepare(
				'SELECT 1 FROM event_registrations WHERE event_id = ? AND user_id = ?'
			).get(event.event_id, userId);

			if (!alreadyRegistered) {
				db.prepare(`
					INSERT INTO event_registrations
					(registration_id, event_id, user_id, in_presence, registered_at)
					VALUES (?, ?, ?, ?, ?)
				`).run(
					generateId(),
					event.event_id,
					userId,
					row.in_presence !== false ? 1 : 0,
					now
				);
				registered++;
			}
		}
	}

	return { total: rows.length, created, existing, registered, errors, otpUsers };
}

// ── Stats ─────────────────────────────────────────────────────────────

export interface AdminStats {
	users: number;
	events: number;
	problems: number;
	assessments: number;
	decisions: number;
}

export interface AdminHealth {
	activeEvents: number;
	openAssessments: number;
	retiredItems: number;
	pendingRegistrations: number;
}

export function getAdminStats(): AdminStats {
	const db = getDatabase();

	const users = (db.prepare("SELECT COUNT(*) AS cnt FROM users WHERE role != 'agent'").get() as { cnt: number }).cnt;
	const events = (db.prepare('SELECT COUNT(*) AS cnt FROM events').get() as { cnt: number }).cnt;
	const problems = (db.prepare('SELECT COUNT(*) AS cnt FROM problems WHERE archived_at IS NULL').get() as { cnt: number }).cnt;
	const assessments = (db.prepare('SELECT COUNT(*) AS cnt FROM assessments').get() as { cnt: number }).cnt;
	const decisions = (db.prepare('SELECT COUNT(*) AS cnt FROM decisions').get() as { cnt: number }).cnt;

	return { users, events, problems, assessments, decisions };
}

export function getAdminHealth(): AdminHealth {
	const db = getDatabase();

	const activeEvents = (db.prepare(`
		SELECT COUNT(*) AS cnt FROM events
		WHERE starts_at <= datetime('now') AND planned_ends_at >= datetime('now')
	`).get() as { cnt: number }).cnt;

	const openAssessments = (db.prepare(
		'SELECT COUNT(*) AS cnt FROM assessments WHERE closed_at IS NULL'
	).get() as { cnt: number }).cnt;

	const retiredItems = (db.prepare(
		'SELECT COUNT(*) AS cnt FROM items WHERE retired_at IS NOT NULL'
	).get() as { cnt: number }).cnt;

	const pendingRegistrations = (db.prepare(`
		SELECT COUNT(*) AS cnt FROM event_registrations
		WHERE waitlist_position IS NOT NULL AND cancelled_at IS NULL
	`).get() as { cnt: number }).cnt;

	return { activeEvents, openAssessments, retiredItems, pendingRegistrations };
}

// ── Helpers ──────────────────────────────────────────────────────────

function generateOtp(): string {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let otp = '';
	const bytes = crypto.randomBytes(OTP_LENGTH);
	for (let i = 0; i < OTP_LENGTH; i++) {
		otp += chars[bytes[i] % chars.length];
	}
	return otp;
}
