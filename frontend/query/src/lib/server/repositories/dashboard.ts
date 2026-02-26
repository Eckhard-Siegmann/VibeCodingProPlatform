/**
 * Dashboard repository — queries for the participant dashboard.
 * Ticket: TICKET-3
 * Spec: Ch.12.4, pagedesign/dashboard_design.md
 */

import { getDatabase } from '../db';

// ── Types ───────────────────────────────────────────────────────────

export interface UserProblem {
	id: string;
	slug: string;
	title: string;
	readinessState: string;
	actionState: string;
	updatedAt: string;
}

export interface UserEvent {
	id: string;
	slug: string;
	title: string;
	startsAt: string;
	plannedEndsAt: string;
	locationName: string;
	locationCity: string;
	partnerName: string;
	capacity: number;
	registeredCount: number;
}

export interface UserStats {
	eventsAttended: number;
	problemsCreated: number;
	assessmentsCompleted: number;
	points: number;
	stars: number;
}

export interface UserActivityItem {
	id: string;
	type: string;
	title: string;
	description: string | null;
	actorId: string;
	actorDisplayName: string;
	problemTitle: string | null;
	problemSlug: string | null;
	timestamp: string;
}

export interface OpenAssessmentRow {
	assessmentId: string;
	type: 'pitch' | 'review';
	problemTitle: string;
	problemSlug: string;
	description: string;
	closesAt: string | null;
	userCompleted: boolean;
}

export interface LiveEventRow {
	eventId: string;
	eventTitle: string;
	currentMode: 'idle' | 'pitch' | 'review';
	currentProblemTitle: string | null;
	currentProblemSlug: string | null;
	timerEndsAt: string | null;
}

// ── Queries ─────────────────────────────────────────────────────────

/**
 * Get problems created by a user with their current version title and states.
 * Owner sees private_slug (for editing).
 * Returns bounded list with total count for dashboard preview.
 */
export function getUserProblems(userId: string, limit = 5): { items: UserProblem[]; totalCount: number } {
	const db = getDatabase();

	const countRow = db.prepare(`
		SELECT COUNT(*) as cnt
		FROM problems
		WHERE created_by_user_id = ? AND archived_at IS NULL
	`).get(userId) as { cnt: number };

	const rows = db.prepare(`
		SELECT
			p.problem_id,
			p.private_slug,
			pv.title,
			p.current_readiness_state,
			p.current_action_state,
			pv.created_at as version_created_at
		FROM problems p
		JOIN problem_versions pv ON p.problem_id = pv.problem_id AND pv.is_current = 1
		WHERE p.created_by_user_id = ?
		  AND p.archived_at IS NULL
		ORDER BY pv.created_at DESC
		LIMIT ?
	`).all(userId, limit) as Array<{
		problem_id: string;
		private_slug: string;
		title: string;
		current_readiness_state: string;
		current_action_state: string;
		version_created_at: string;
	}>;

	return {
		items: rows.map(r => ({
			id: r.problem_id,
			slug: r.private_slug,
			title: r.title,
			readinessState: r.current_readiness_state,
			actionState: r.current_action_state,
			updatedAt: r.version_created_at
		})),
		totalCount: countRow.cnt
	};
}

/**
 * Get events the user is registered for (not cancelled).
 * Returns bounded list: 2 upcoming + 2 most recent past (max 4 by default).
 * Includes total count for "Browse All Events" link.
 */
export function getUserRegisteredEvents(userId: string, limit = 4): { items: UserEvent[]; totalCount: number } {
	const db = getDatabase();

	const countRow = db.prepare(`
		SELECT COUNT(*) as cnt
		FROM event_registrations
		WHERE user_id = ? AND cancelled_at IS NULL
	`).get(userId) as { cnt: number };

	// Fetch upcoming events (starts_at >= now, ascending) and past events (starts_at < now, descending)
	// then combine the bounded results
	const halfLimit = Math.ceil(limit / 2);

	const upcomingRows = db.prepare(`
		SELECT
			e.event_id, e.slug, e.title, e.starts_at, e.planned_ends_at,
			l.name as location_name, l.city as location_city,
			pa.name as partner_name, r.max_pax_tables as capacity,
			(SELECT COUNT(*) FROM event_registrations er2
			 WHERE er2.event_id = e.event_id AND er2.cancelled_at IS NULL) as registered_count
		FROM event_registrations er
		JOIN events e ON er.event_id = e.event_id
		JOIN rooms r ON e.room_id = r.room_id
		JOIN locations l ON r.location_id = l.location_id
		JOIN partners pa ON e.partner_id = pa.partner_id
		WHERE er.user_id = ? AND er.cancelled_at IS NULL
		  AND e.starts_at >= datetime('now')
		ORDER BY e.starts_at ASC
		LIMIT ?
	`).all(userId, halfLimit) as Array<{
		event_id: string; slug: string; title: string; starts_at: string;
		planned_ends_at: string; location_name: string; location_city: string;
		partner_name: string; capacity: number; registered_count: number;
	}>;

	const remainingSlots = limit - upcomingRows.length;
	const pastRows = remainingSlots > 0 ? db.prepare(`
		SELECT
			e.event_id, e.slug, e.title, e.starts_at, e.planned_ends_at,
			l.name as location_name, l.city as location_city,
			pa.name as partner_name, r.max_pax_tables as capacity,
			(SELECT COUNT(*) FROM event_registrations er2
			 WHERE er2.event_id = e.event_id AND er2.cancelled_at IS NULL) as registered_count
		FROM event_registrations er
		JOIN events e ON er.event_id = e.event_id
		JOIN rooms r ON e.room_id = r.room_id
		JOIN locations l ON r.location_id = l.location_id
		JOIN partners pa ON e.partner_id = pa.partner_id
		WHERE er.user_id = ? AND er.cancelled_at IS NULL
		  AND e.starts_at < datetime('now')
		ORDER BY e.starts_at DESC
		LIMIT ?
	`).all(userId, remainingSlots) as typeof upcomingRows : [];

	const combined = [...upcomingRows, ...pastRows];

	const mapRow = (r: typeof combined[0]) => ({
		id: r.event_id,
		slug: r.slug,
		title: r.title,
		startsAt: r.starts_at,
		plannedEndsAt: r.planned_ends_at,
		locationName: r.location_name,
		locationCity: r.location_city,
		partnerName: r.partner_name,
		capacity: r.capacity,
		registeredCount: r.registered_count
	});

	return {
		items: combined.map(mapRow),
		totalCount: countRow.cnt
	};
}

/**
 * Compute aggregated stats for a user.
 */
export function getUserStats(userId: string): UserStats {
	const db = getDatabase();

	const eventsAttended = (db.prepare(`
		SELECT COUNT(*) as cnt
		FROM event_registrations
		WHERE user_id = ? AND cancelled_at IS NULL
	`).get(userId) as { cnt: number }).cnt;

	const problemsCreated = (db.prepare(`
		SELECT COUNT(*) as cnt
		FROM problems
		WHERE created_by_user_id = ? AND archived_at IS NULL
	`).get(userId) as { cnt: number }).cnt;

	const assessmentsCompleted = (db.prepare(`
		SELECT COUNT(DISTINCT assessment_id) as cnt
		FROM responses
		WHERE user_id = ? AND superseded_at IS NULL
	`).get(userId) as { cnt: number }).cnt;

	const points = (db.prepare(`
		SELECT COALESCE(SUM(points_awarded), 0) as total
		FROM contribution_points
		WHERE user_id = ?
	`).get(userId) as { total: number }).total;

	const stars = (db.prepare(`
		SELECT COALESCE(SUM(stars_awarded), 0) as total
		FROM star_awards
		WHERE user_id = ?
	`).get(userId) as { total: number }).total;

	return { eventsAttended, problemsCreated, assessmentsCompleted, points, stars };
}

/**
 * Get recent activity feed for a user: decisions on their problems,
 * team joins, and other relevant events.
 * Returns bounded list with total count for "Load More" pagination.
 * Timeframe: last 7 days.
 */
export function getUserActivityFeed(userId: string, limit = 10, offset = 0): { items: UserActivityItem[]; totalCount: number } {
	const db = getDatabase();

	const countRow = db.prepare(`
		SELECT COUNT(*) as cnt
		FROM decisions d
		JOIN problems p ON d.problem_id = p.problem_id
		WHERE p.created_by_user_id = ?
		  AND d.created_at > datetime('now', '-7 days')
	`).get(userId) as { cnt: number };

	// Decisions on user's problems (others acting on their problems)
	const rows = db.prepare(`
		SELECT
			d.decision_id as id,
			d.decision_type as type,
			dtc.display_name as title,
			d.rationale as description,
			d.actor_user_id as actor_id,
			u.display_name as actor_display_name,
			pv.title as problem_title,
			p.public_slug as problem_slug,
			d.created_at as timestamp
		FROM decisions d
		JOIN problems p ON d.problem_id = p.problem_id
		JOIN problem_versions pv ON d.problem_id = pv.problem_id AND d.major_version = pv.major_version
		JOIN users u ON d.actor_user_id = u.user_id
		JOIN decision_type_catalog dtc ON d.decision_type = dtc.type_key
		WHERE p.created_by_user_id = ?
		  AND d.created_at > datetime('now', '-7 days')
		ORDER BY d.created_at DESC
		LIMIT ? OFFSET ?
	`).all(userId, limit, offset) as Array<{
		id: string;
		type: string;
		title: string;
		description: string | null;
		actor_id: string;
		actor_display_name: string;
		problem_title: string | null;
		problem_slug: string | null;
		timestamp: string;
	}>;

	return {
		items: rows.map(r => ({
			id: r.id,
			type: r.type,
			title: r.title,
			description: r.description,
			actorId: r.actor_id,
			actorDisplayName: r.actor_display_name,
			problemTitle: r.problem_title,
			problemSlug: r.problem_slug,
			timestamp: r.timestamp
		})),
		totalCount: countRow.cnt
	};
}

/**
 * Get open assessment for a user at a given event, if any.
 * Checks if the user has already responded.
 */
export function getOpenAssessmentForUser(
	userId: string,
	eventId: string
): OpenAssessmentRow | null {
	const db = getDatabase();

	const row = db.prepare(`
		SELECT
			a.assessment_id,
			i.inventory_key,
			pv.title as problem_title,
			p.public_slug as problem_slug,
			pv.description as description,
			c.timer_ends_at as closes_at,
			(SELECT COUNT(*) FROM responses r
			 WHERE r.assessment_id = a.assessment_id
			   AND r.user_id = ?
			   AND r.superseded_at IS NULL) as user_response_count
		FROM assessments a
		JOIN inventories i ON a.inventory_id = i.inventory_id
		JOIN problems p ON a.problem_id = p.problem_id
		JOIN problem_versions pv ON a.problem_id = pv.problem_id AND pv.is_current = 1
		LEFT JOIN event_live_context c ON a.event_id = c.event_id
		WHERE a.event_id = ?
		  AND a.closed_at IS NULL
		ORDER BY a.opened_at DESC
		LIMIT 1
	`).get(userId, eventId) as {
		assessment_id: string;
		inventory_key: string;
		problem_title: string;
		problem_slug: string;
		description: string;
		closes_at: string | null;
		user_response_count: number;
	} | undefined;

	if (!row) return null;

	const type = row.inventory_key.includes('review') ? 'review' as const : 'pitch' as const;

	return {
		assessmentId: row.assessment_id,
		type,
		problemTitle: row.problem_title,
		problemSlug: row.problem_slug,
		description: row.description,
		closesAt: row.closes_at,
		userCompleted: row.user_response_count > 0
	};
}

/**
 * Get the current open assessment for an event (not user-specific).
 * Used by moderator dashboard to provide real assessment IDs.
 */
export function getOpenAssessmentForEvent(eventId: string): {
	assessmentId: string;
	type: 'pitch' | 'review';
	problemTitle: string;
	problemSlug: string;
} | null {
	const db = getDatabase();

	const row = db.prepare(`
		SELECT
			a.assessment_id,
			i.inventory_key,
			pv.title as problem_title,
			p.public_slug as problem_slug
		FROM assessments a
		JOIN inventories i ON a.inventory_id = i.inventory_id
		JOIN problems p ON a.problem_id = p.problem_id
		JOIN problem_versions pv ON a.problem_id = pv.problem_id AND pv.is_current = 1
		WHERE a.event_id = ?
		  AND a.closed_at IS NULL
		ORDER BY a.opened_at DESC
		LIMIT 1
	`).get(eventId) as {
		assessment_id: string;
		inventory_key: string;
		problem_title: string;
		problem_slug: string;
	} | undefined;

	if (!row) return null;

	return {
		assessmentId: row.assessment_id,
		type: row.inventory_key.includes('review') ? 'review' : 'pitch',
		problemTitle: row.problem_title,
		problemSlug: row.problem_slug
	};
}

/**
 * Get live event context for a user — finds events the user is registered for
 * that have an active live context.
 */
export function getLiveEventForUser(userId: string): LiveEventRow | null {
	const db = getDatabase();

	const row = db.prepare(`
		SELECT
			e.event_id,
			e.title as event_title,
			c.current_mode,
			pv.title as current_problem_title,
			p.public_slug as current_problem_slug,
			c.timer_ends_at
		FROM event_registrations er
		JOIN events e ON er.event_id = e.event_id
		JOIN event_live_context c ON e.event_id = c.event_id
		LEFT JOIN problems p ON c.current_problem_id = p.problem_id
		LEFT JOIN problem_versions pv ON p.problem_id = pv.problem_id AND pv.is_current = 1
		WHERE er.user_id = ?
		  AND er.cancelled_at IS NULL
		  AND c.current_mode != 'idle'
		  AND e.starts_at <= datetime('now')
		  AND e.planned_ends_at >= datetime('now')
		ORDER BY e.starts_at DESC
		LIMIT 1
	`).get(userId) as {
		event_id: string;
		event_title: string;
		current_mode: 'idle' | 'pitch' | 'review';
		current_problem_title: string | null;
		current_problem_slug: string | null;
		timer_ends_at: string | null;
	} | undefined;

	if (!row) return null;

	return {
		eventId: row.event_id,
		eventTitle: row.event_title,
		currentMode: row.current_mode,
		currentProblemTitle: row.current_problem_title,
		currentProblemSlug: row.current_problem_slug,
		timerEndsAt: row.timer_ends_at
	};
}
