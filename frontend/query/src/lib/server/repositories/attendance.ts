/**
 * Attendance repository — tracking who showed up at events.
 * Spec: Ch.29.5 (Capacity Management), Ch.12.4 (Moderator Dashboard)
 * User story: M14 (Track Attendance)
 */

import { getDatabase, generateId, nowIso } from '../db';

// ── Types ────────────────────────────────────────────────────────────

export interface AttendeeRow {
	user_id: string;
	display_name: string;
	email: string;
	in_presence: number;
	registered_at: string;
	showed_up: number | null; // null = not yet recorded
}

export interface ShowUpStats {
	total_registered: number;
	in_presence_registered: number;
	remote_registered: number;
	showed_up: number;
	no_show: number;
	not_recorded: number;
	show_up_rate: number; // percentage, 0-100
}

// ── Attendee List ────────────────────────────────────────────────────

/**
 * Get all registered users for an event with their attendance status.
 * Only includes non-cancelled registrations.
 */
export function getEventAttendees(eventId: string): AttendeeRow[] {
	const db = getDatabase();

	return db.prepare(`
		SELECT
			u.user_id,
			u.display_name,
			u.email,
			er.in_presence,
			er.registered_at,
			ea.showed_up
		FROM event_registrations er
		JOIN users u ON u.user_id = er.user_id
		LEFT JOIN event_attendance ea ON ea.event_id = er.event_id AND ea.user_id = er.user_id
		WHERE er.event_id = ? AND er.cancelled_at IS NULL
		ORDER BY u.display_name ASC
	`).all(eventId) as AttendeeRow[];
}

// ── Paginated Attendee List (TICKET-33) ─────────────────────────────

export interface AttendeePageOptions {
	eventId: string;
	search?: string;
	mode?: string;   // 'in_presence' | 'remote' | '' (all)
	status?: string;  // 'checked_in' | 'not_yet' | '' (all)
	limit: number;
	offset: number;
}

export interface AttendeePageResult {
	items: AttendeeRow[];
	totalItems: number;
}

/**
 * Get paginated attendees with search and filters.
 * Spec: Ch.12.10, moderator_dashboard_design.md §Attendance Tracking
 */
export function getEventAttendeesPaginated(opts: AttendeePageOptions): AttendeePageResult {
	const db = getDatabase();

	const effectiveLimit = Math.min(Math.max(opts.limit, 1), 100);
	const effectiveOffset = Math.max(opts.offset, 0);

	const conditions: string[] = ['er.event_id = ?', 'er.cancelled_at IS NULL'];
	const params: unknown[] = [opts.eventId];

	// Search by display_name or email
	if (opts.search && opts.search.length >= 2) {
		conditions.push('(u.display_name LIKE ? COLLATE NOCASE OR u.email LIKE ? COLLATE NOCASE)');
		const like = `%${opts.search}%`;
		params.push(like, like);
	}

	// Mode filter
	if (opts.mode === 'in_presence') {
		conditions.push('er.in_presence = 1');
	} else if (opts.mode === 'remote') {
		conditions.push('er.in_presence = 0');
	}

	// Status filter
	if (opts.status === 'checked_in') {
		conditions.push('ea.showed_up = 1');
	} else if (opts.status === 'not_yet') {
		conditions.push('(ea.showed_up IS NULL OR ea.showed_up = 0)');
	}

	const whereClause = 'WHERE ' + conditions.join(' AND ');

	// Count query
	const countSql = `
		SELECT COUNT(*) AS cnt
		FROM event_registrations er
		JOIN users u ON u.user_id = er.user_id
		LEFT JOIN event_attendance ea ON ea.event_id = er.event_id AND ea.user_id = er.user_id
		${whereClause}
	`;
	const countRow = db.prepare(countSql).get(...params) as { cnt: number };

	// Data query
	const dataSql = `
		SELECT
			u.user_id,
			u.display_name,
			u.email,
			er.in_presence,
			er.registered_at,
			ea.showed_up
		FROM event_registrations er
		JOIN users u ON u.user_id = er.user_id
		LEFT JOIN event_attendance ea ON ea.event_id = er.event_id AND ea.user_id = er.user_id
		${whereClause}
		ORDER BY u.display_name ASC
		LIMIT ? OFFSET ?
	`;
	const items = db.prepare(dataSql).all(...params, effectiveLimit, effectiveOffset) as AttendeeRow[];

	return { items, totalItems: countRow.cnt };
}

// ── Toggle Attendance ────────────────────────────────────────────────

/**
 * Record or update attendance for a single user at an event.
 * Uses INSERT OR REPLACE (UNIQUE constraint on event_id + user_id).
 */
export function setAttendance(eventId: string, userId: string, showedUp: boolean): void {
	const db = getDatabase();
	const now = nowIso();

	const existing = db.prepare(
		'SELECT attendance_id FROM event_attendance WHERE event_id = ? AND user_id = ?'
	).get(eventId, userId) as { attendance_id: string } | undefined;

	if (existing) {
		db.prepare(
			'UPDATE event_attendance SET showed_up = ?, recorded_at = ? WHERE attendance_id = ?'
		).run(showedUp ? 1 : 0, now, existing.attendance_id);
	} else {
		const id = generateId();
		db.prepare(
			'INSERT INTO event_attendance (attendance_id, event_id, user_id, showed_up, recorded_at) VALUES (?, ?, ?, ?, ?)'
		).run(id, eventId, userId, showedUp ? 1 : 0, now);
	}
}

/**
 * Mark all in-presence registered users as showed_up.
 * Skips users who already have an attendance record.
 */
export function markAllPresent(eventId: string): number {
	const db = getDatabase();
	const now = nowIso();

	// Get in-presence registrants without attendance records
	const unrecorded = db.prepare(`
		SELECT er.user_id
		FROM event_registrations er
		LEFT JOIN event_attendance ea ON ea.event_id = er.event_id AND ea.user_id = er.user_id
		WHERE er.event_id = ? AND er.cancelled_at IS NULL AND er.in_presence = 1 AND ea.attendance_id IS NULL
	`).all(eventId) as { user_id: string }[];

	const insert = db.prepare(
		'INSERT INTO event_attendance (attendance_id, event_id, user_id, showed_up, recorded_at) VALUES (?, ?, ?, 1, ?)'
	);

	const tx = db.transaction(() => {
		for (const row of unrecorded) {
			insert.run(generateId(), eventId, row.user_id, now);
		}
		return unrecorded.length;
	});

	return tx();
}

// ── Stats ────────────────────────────────────────────────────────────

/**
 * Compute show-up statistics for an event.
 */
export function getShowUpStats(eventId: string): ShowUpStats {
	const db = getDatabase();

	const row = db.prepare(`
		SELECT
			COUNT(*) AS total_registered,
			SUM(CASE WHEN er.in_presence = 1 THEN 1 ELSE 0 END) AS in_presence_registered,
			SUM(CASE WHEN er.in_presence = 0 THEN 1 ELSE 0 END) AS remote_registered,
			SUM(CASE WHEN ea.showed_up = 1 THEN 1 ELSE 0 END) AS showed_up,
			SUM(CASE WHEN ea.showed_up = 0 THEN 1 ELSE 0 END) AS no_show,
			SUM(CASE WHEN ea.showed_up IS NULL THEN 1 ELSE 0 END) AS not_recorded
		FROM event_registrations er
		LEFT JOIN event_attendance ea ON ea.event_id = er.event_id AND ea.user_id = er.user_id
		WHERE er.event_id = ? AND er.cancelled_at IS NULL
	`).get(eventId) as any;

	const total = row.total_registered || 0;
	const showedUp = row.showed_up || 0;
	const recorded = showedUp + (row.no_show || 0);

	return {
		total_registered: total,
		in_presence_registered: row.in_presence_registered || 0,
		remote_registered: row.remote_registered || 0,
		showed_up: showedUp,
		no_show: row.no_show || 0,
		not_recorded: row.not_recorded || 0,
		show_up_rate: recorded > 0 ? Math.round((showedUp / recorded) * 100) : 0
	};
}
