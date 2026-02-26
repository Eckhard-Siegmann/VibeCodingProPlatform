import { getDatabase } from '../db';

// ============================================================================
// Types
// ============================================================================

export interface PublicEventRow {
	event_id: string;
	slug: string;
	title: string;
	description: string | null;
	starts_at: string;
	planned_ends_at: string;
	image_url: string | null;
	overbooking_factor: number;
	partner_name: string;
	partner_logo_url: string | null;
	room_name: string;
	room_capacity: number;
	location_name: string;
	location_city: string;
	registered_count: number;
	waitlist_count: number;
}

export interface PastEventRow extends PublicEventRow {
	problems_count: number;
	participants_count: number;
}

export interface ContributorRow {
	user_id: string;
	display_name: string;
	points: number;
	stars: number;
	contribution_count: number;
}

export interface PlatformStats {
	totalEvents: number;
	totalParticipants: number;
	totalProblems: number;
	activeLocations: number;
}

// ============================================================================
// Queries
// ============================================================================

/**
 * Get upcoming events (starts_at > now) with registration counts.
 * Joins partners, rooms, locations. Sorted by starts_at ASC.
 */
export function getUpcomingEvents(limit = 6): PublicEventRow[] {
	const db = getDatabase();
	const now = new Date().toISOString();

	const rows = db.prepare(`
		SELECT
			e.event_id,
			e.slug,
			e.title,
			e.description,
			e.starts_at,
			e.planned_ends_at,
			e.image_url,
			e.overbooking_factor,
			p.name AS partner_name,
			p.logo_url AS partner_logo_url,
			r.name AS room_name,
			r.max_pax_tables AS room_capacity,
			l.name AS location_name,
			l.city AS location_city,
			COALESCE((
				SELECT COUNT(*)
				FROM event_registrations er
				WHERE er.event_id = e.event_id
				  AND er.cancelled_at IS NULL
				  AND er.waitlist_position IS NULL
			), 0) AS registered_count,
			COALESCE((
				SELECT COUNT(*)
				FROM event_registrations er
				WHERE er.event_id = e.event_id
				  AND er.cancelled_at IS NULL
				  AND er.waitlist_position IS NOT NULL
			), 0) AS waitlist_count
		FROM events e
		JOIN partners p ON p.partner_id = e.partner_id
		JOIN rooms r ON r.room_id = e.room_id
		JOIN locations l ON l.location_id = r.location_id
		WHERE e.starts_at > ?
		ORDER BY e.starts_at ASC
		LIMIT ?
	`).all(now, limit) as PublicEventRow[];

	return rows;
}

/**
 * Get past events (starts_at <= now) with participant and problem counts.
 * Sorted by starts_at DESC (most recent first).
 */
export function getPastEvents(limit = 6): PastEventRow[] {
	const db = getDatabase();
	const now = new Date().toISOString();

	const rows = db.prepare(`
		SELECT
			e.event_id,
			e.slug,
			e.title,
			e.description,
			e.starts_at,
			e.planned_ends_at,
			e.image_url,
			e.overbooking_factor,
			p.name AS partner_name,
			p.logo_url AS partner_logo_url,
			r.name AS room_name,
			r.max_pax_tables AS room_capacity,
			l.name AS location_name,
			l.city AS location_city,
			COALESCE((
				SELECT COUNT(*)
				FROM event_registrations er
				WHERE er.event_id = e.event_id
				  AND er.cancelled_at IS NULL
				  AND er.waitlist_position IS NULL
			), 0) AS registered_count,
			COALESCE((
				SELECT COUNT(*)
				FROM event_registrations er
				WHERE er.event_id = e.event_id
				  AND er.cancelled_at IS NULL
				  AND er.waitlist_position IS NOT NULL
			), 0) AS waitlist_count,
			COALESCE((
				SELECT COUNT(*)
				FROM event_problem_queue epq
				WHERE epq.event_id = e.event_id
			), 0) AS problems_count,
			COALESCE((
				SELECT COUNT(DISTINCT er2.user_id)
				FROM event_registrations er2
				WHERE er2.event_id = e.event_id
				  AND er2.cancelled_at IS NULL
			), 0) AS participants_count
		FROM events e
		JOIN partners p ON p.partner_id = e.partner_id
		JOIN rooms r ON r.room_id = e.room_id
		JOIN locations l ON l.location_id = r.location_id
		WHERE e.starts_at <= ?
		ORDER BY e.starts_at DESC
		LIMIT ?
	`).all(now, limit) as PastEventRow[];

	return rows;
}

/**
 * Get top contributors for the contributor wall.
 * Aggregates contribution_points and star_awards.
 * Falls back to problem/assessment counts if no points data exists.
 * Only includes users with show_on_contributor_wall = 1.
 */
export function getTopContributors(limit = 10): ContributorRow[] {
	const db = getDatabase();

	// Check if contribution_points table has any data
	const pointsExist = db.prepare(
		`SELECT COUNT(*) AS cnt FROM contribution_points`
	).get() as { cnt: number };

	if (pointsExist.cnt > 0) {
		// Use the contributor_wall_6week view (SQLite, rolling 6-week window)
		return db.prepare(`
			SELECT user_id, display_name, total_points AS points, total_stars AS stars, contribution_count
			FROM contributor_wall_6week
			LIMIT ?
		`).all(limit) as ContributorRow[];
	}

	// Fallback: use problem and assessment counts as proxy for contributions
	const rows = db.prepare(`
		SELECT
			u.user_id,
			u.display_name,
			(
				COALESCE((
					SELECT COUNT(*) FROM problems pr WHERE pr.created_by_user_id = u.user_id
				), 0)
				+
				COALESCE((
					SELECT COUNT(DISTINCT r.assessment_id)
					FROM responses r
					WHERE r.user_id = u.user_id
				), 0)
			) AS points,
			0 AS stars,
			(
				COALESCE((
					SELECT COUNT(*) FROM problems pr WHERE pr.created_by_user_id = u.user_id
				), 0)
				+
				COALESCE((
					SELECT COUNT(DISTINCT r.assessment_id)
					FROM responses r
					WHERE r.user_id = u.user_id
				), 0)
			) AS contribution_count
		FROM users u
		WHERE u.show_on_contributor_wall = 1
		  AND u.role != 'agent'
		  AND (
			EXISTS (SELECT 1 FROM problems pr WHERE pr.created_by_user_id = u.user_id)
			OR EXISTS (SELECT 1 FROM responses r WHERE r.user_id = u.user_id)
		  )
		ORDER BY points DESC, u.display_name ASC
		LIMIT ?
	`).all(limit) as ContributorRow[];

	return rows;
}

// ============================================================================
// Events Listing Functions (TICKET-29, Ch.12.9)
// ============================================================================

export interface EventListItem {
	event_id: string;
	slug: string;
	title: string;
	description: string | null;
	starts_at: string;
	planned_ends_at: string;
	location_name: string;
	room_name: string;
	city: string;
	partner_name: string;
	partner_logo_url: string | null;
	registration_count: number;
	effective_capacity: number;
	attendance_count: number | null;
	problem_count: number | null;
	review_count: number | null;
	current_mode: string | null;
	current_problem_title: string | null;
}

interface EventFilterOptions {
	search: string;
	location: string;
}

/**
 * Build common WHERE conditions and JOINs for event listing queries.
 */
function buildEventFilters(options: EventFilterOptions): { conditions: string[]; params: unknown[] } {
	const conditions: string[] = [];
	const params: unknown[] = [];

	if (options.location !== 'all') {
		conditions.push('l.city = ? COLLATE NOCASE');
		params.push(options.location);
	}

	if (options.search.length >= 2) {
		conditions.push('(e.title LIKE ? COLLATE NOCASE OR e.description LIKE ? COLLATE NOCASE OR l.name LIKE ? COLLATE NOCASE OR p.name LIKE ? COLLATE NOCASE)');
		const like = `%${options.search}%`;
		params.push(like, like, like, like);
	}

	return { conditions, params };
}

/**
 * Shared SELECT columns for event listing queries.
 */
const EVENT_LIST_COLUMNS = `
	e.event_id,
	e.slug,
	e.title,
	e.description,
	e.starts_at,
	e.planned_ends_at,
	p.name AS partner_name,
	p.logo_url AS partner_logo_url,
	r.name AS room_name,
	CAST(r.max_pax_tables * e.overbooking_factor AS INTEGER) AS effective_capacity,
	l.name AS location_name,
	l.city,
	COALESCE((
		SELECT COUNT(*)
		FROM event_registrations er
		WHERE er.event_id = e.event_id
		  AND er.cancelled_at IS NULL
		  AND er.waitlist_position IS NULL
	), 0) AS registration_count,
	COALESCE((
		SELECT COUNT(*)
		FROM event_registrations er
		WHERE er.event_id = e.event_id
		  AND er.cancelled_at IS NULL
		  AND er.waitlist_position IS NOT NULL
	), 0) AS waitlist_count
`;

const EVENT_LIST_JOINS = `
	FROM events e
	JOIN partners p ON p.partner_id = e.partner_id
	JOIN rooms r ON r.room_id = e.room_id
	JOIN locations l ON l.location_id = r.location_id
`;

/**
 * Get currently active events (started but not ended).
 * Includes live context info. Spec: Ch.12.9.3.
 */
export function getActiveEventsFiltered(options: EventFilterOptions): EventListItem[] {
	const db = getDatabase();
	const now = new Date().toISOString();
	const { conditions, params } = buildEventFilters(options);

	conditions.unshift('e.starts_at <= ?', 'e.planned_ends_at >= ?');
	params.unshift(now, now);

	const whereClause = 'WHERE ' + conditions.join(' AND ');

	const rows = db.prepare(`
		SELECT
			${EVENT_LIST_COLUMNS},
			COALESCE((
				SELECT COUNT(DISTINCT ea.user_id)
				FROM event_attendance ea
				WHERE ea.event_id = e.event_id
			), 0) AS attendance_count,
			NULL AS problem_count,
			NULL AS review_count,
			(
				SELECT elc.current_mode
				FROM event_live_context elc
				WHERE elc.event_id = e.event_id
			) AS current_mode,
			(
				SELECT pv.title
				FROM event_live_context elc2
				JOIN problem_versions pv ON pv.problem_id = elc2.current_problem_id AND pv.is_current = 1
				WHERE elc2.event_id = e.event_id AND elc2.current_problem_id IS NOT NULL
			) AS current_problem_title
		${EVENT_LIST_JOINS}
		${whereClause}
		ORDER BY e.starts_at ASC
	`).all(...params) as EventListItem[];

	return rows;
}

/**
 * Get upcoming events (not yet started) with optional filters.
 * Spec: Ch.12.9.3 — sorted by start time ascending (nearest first).
 */
export function getUpcomingEventsFiltered(options: EventFilterOptions): EventListItem[] {
	const db = getDatabase();
	const now = new Date().toISOString();
	const { conditions, params } = buildEventFilters(options);

	conditions.unshift('e.starts_at > ?');
	params.unshift(now);

	const whereClause = 'WHERE ' + conditions.join(' AND ');

	const rows = db.prepare(`
		SELECT
			${EVENT_LIST_COLUMNS},
			NULL AS attendance_count,
			NULL AS problem_count,
			NULL AS review_count,
			NULL AS current_mode,
			NULL AS current_problem_title
		${EVENT_LIST_JOINS}
		${whereClause}
		ORDER BY e.starts_at ASC
	`).all(...params) as EventListItem[];

	return rows;
}

/**
 * Get past events (ended) with summary statistics.
 * Spec: Ch.12.9.3 — sorted by start time descending (most recent first).
 * Uses LIMIT for "Load More" pattern.
 */
export function getPastEventsFiltered(
	options: EventFilterOptions & { time: string; limit: number }
): { items: EventListItem[]; total: number } {
	const db = getDatabase();
	const now = new Date().toISOString();
	const { conditions, params } = buildEventFilters(options);

	conditions.unshift('e.planned_ends_at < ?');
	params.unshift(now);

	// Time range filter
	if (options.time !== 'all') {
		const dateNow = new Date();
		let cutoff: Date;
		switch (options.time) {
			case 'next_3_months':
				cutoff = new Date(dateNow);
				cutoff.setMonth(cutoff.getMonth() + 3);
				conditions.push('e.starts_at <= ?');
				params.push(cutoff.toISOString());
				break;
			case 'last_6_months':
				cutoff = new Date(dateNow);
				cutoff.setMonth(cutoff.getMonth() - 6);
				conditions.push('e.starts_at >= ?');
				params.push(cutoff.toISOString());
				break;
			case 'this_year':
				conditions.push("strftime('%Y', e.starts_at) = ?");
				params.push(String(dateNow.getFullYear()));
				break;
		}
	}

	const whereClause = 'WHERE ' + conditions.join(' AND ');

	// Count query
	const countParams = [...params];
	const countRow = db.prepare(`
		SELECT COUNT(*) AS total
		${EVENT_LIST_JOINS}
		${whereClause}
	`).get(...countParams) as { total: number };

	// Data query
	const dataParams = [...params, options.limit];
	const items = db.prepare(`
		SELECT
			${EVENT_LIST_COLUMNS},
			COALESCE((
				SELECT COUNT(DISTINCT ea.user_id)
				FROM event_attendance ea
				WHERE ea.event_id = e.event_id
			), 0) AS attendance_count,
			COALESCE((
				SELECT COUNT(*)
				FROM event_problem_queue epq
				WHERE epq.event_id = e.event_id
			), 0) AS problem_count,
			COALESCE((
				SELECT COUNT(DISTINCT resp.user_id)
				FROM responses resp
				JOIN assessments asmt ON asmt.assessment_id = resp.assessment_id
				WHERE asmt.event_id = e.event_id
				AND resp.superseded_at IS NULL
			), 0) AS review_count,
			NULL AS current_mode,
			NULL AS current_problem_title
		${EVENT_LIST_JOINS}
		${whereClause}
		ORDER BY e.starts_at DESC
		LIMIT ?
	`).all(...dataParams) as EventListItem[];

	return { items, total: countRow.total };
}

/**
 * Get all of a user's event registrations for rendering button states.
 * Returns a record of eventId → status.
 */
export function getUserEventRegistrations(
	userId: string
): Record<string, 'confirmed' | 'waitlisted' | 'cancelled'> {
	const db = getDatabase();

	const rows = db.prepare(`
		SELECT
			event_id,
			CASE
				WHEN cancelled_at IS NOT NULL THEN 'cancelled'
				WHEN waitlist_position IS NOT NULL THEN 'waitlisted'
				ELSE 'confirmed'
			END AS status
		FROM event_registrations
		WHERE user_id = ?
	`).all(userId) as Array<{ event_id: string; status: 'confirmed' | 'waitlisted' | 'cancelled' }>;

	const result: Record<string, 'confirmed' | 'waitlisted' | 'cancelled'> = {};
	for (const row of rows) {
		// Only keep the most relevant status (non-cancelled takes precedence)
		if (!result[row.event_id] || row.status !== 'cancelled') {
			result[row.event_id] = row.status;
		}
	}

	return result;
}

/**
 * Get all locations for filter dropdowns (Events Listing).
 */
export function getEventLocations(): Array<{ value: string; label: string }> {
	const db = getDatabase();
	return db.prepare(`
		SELECT DISTINCT l.city AS value, l.name AS label
		FROM locations l
		JOIN rooms r ON r.location_id = l.location_id
		JOIN events e ON e.room_id = r.room_id
		ORDER BY l.city ASC
	`).all() as Array<{ value: string; label: string }>;
}

/**
 * Get platform-wide stats for the landing page.
 */
export function getPlatformStats(): PlatformStats {
	const db = getDatabase();

	const totalEvents = (db.prepare(
		`SELECT COUNT(*) AS cnt FROM events`
	).get() as { cnt: number }).cnt;

	const totalParticipants = (db.prepare(
		`SELECT COUNT(DISTINCT user_id) AS cnt FROM event_registrations WHERE cancelled_at IS NULL`
	).get() as { cnt: number }).cnt;

	const totalProblems = (db.prepare(
		`SELECT COUNT(*) AS cnt FROM problems WHERE archived_at IS NULL`
	).get() as { cnt: number }).cnt;

	const activeLocations = (db.prepare(
		`SELECT COUNT(DISTINCT l.location_id) AS cnt
		 FROM locations l
		 JOIN rooms r ON r.location_id = l.location_id
		 JOIN events e ON e.room_id = r.room_id`
	).get() as { cnt: number }).cnt;

	return { totalEvents, totalParticipants, totalProblems, activeLocations };
}
