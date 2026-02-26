import { getDatabase, generateId, nowIso } from '../db';

// ============================================================================
// Types
// ============================================================================

export interface EventDetail {
	event_id: string;
	slug: string;
	title: string;
	description: string | null;
	starts_at: string;
	planned_ends_at: string;
	image_url: string | null;
	website_url: string | null;
	linkedin_url: string | null;
	x_post_url: string | null;
	overbooking_factor: number;
	partner: {
		name: string;
		logo_url: string | null;
	};
	location: {
		name: string;
		address: string;
		city: string;
	};
	room: {
		name: string;
		max_pax_tables: number;
	};
	host: {
		id: string;
		displayName: string;
	};
	coHost1: { id: string; displayName: string } | null;
	coHost2: { id: string; displayName: string } | null;
}

export interface RegistrationStatus {
	registration_id: string;
	in_presence: boolean;
	waitlist_position: number | null;
	waitlist_invited_at: string | null;
	waitlist_expires_at: string | null;
	registered_at: string;
	cancelled_at: string | null;
}

export interface RegistrationCounts {
	registeredCount: number;
	waitlistCount: number;
	effectiveCapacity: number;
	baseCapacity: number;
}

export interface EventProblemItem {
	problem_id: string;
	public_slug: string;
	title: string;
	owner_name: string;
	readiness_state: string;
	action_state: string;
	queue_state: string;
}

// ============================================================================
// Internal row types
// ============================================================================

interface EventRow {
	event_id: string;
	slug: string;
	title: string;
	description: string | null;
	starts_at: string;
	planned_ends_at: string;
	image_url: string | null;
	website_url: string | null;
	linkedin_url: string | null;
	x_post_url: string | null;
	overbooking_factor: number;
	partner_name: string;
	partner_logo_url: string | null;
	location_name: string;
	location_address: string;
	location_city: string;
	room_name: string;
	room_max_pax_tables: number;
	host_user_id: string;
	host_display_name: string;
	co_host_1_user_id: string | null;
	co_host_1_display_name: string | null;
	co_host_2_user_id: string | null;
	co_host_2_display_name: string | null;
}

interface RegistrationRow {
	registration_id: string;
	in_presence: number;
	waitlist_position: number | null;
	waitlist_invited_at: string | null;
	waitlist_expires_at: string | null;
	registered_at: string;
	cancelled_at: string | null;
}

interface CountRow {
	count: number;
}

interface ProblemQueueRow {
	problem_id: string;
	public_slug: string;
	title: string;
	owner_name: string;
	readiness_state: string;
	action_state: string;
	queue_state: string;
}

// ============================================================================
// Read operations
// ============================================================================

/**
 * Get full event details by slug, with partner, room, location JOINs.
 */
export function getEventBySlug(slug: string): EventDetail | null {
	const db = getDatabase();

	const row = db.prepare(`
		SELECT
			e.event_id,
			e.slug,
			e.title,
			e.description,
			e.starts_at,
			e.planned_ends_at,
			e.image_url,
			e.website_url,
			e.linkedin_url,
			e.x_post_url,
			e.overbooking_factor,
			p.name AS partner_name,
			p.logo_url AS partner_logo_url,
			l.name AS location_name,
			l.address AS location_address,
			l.city AS location_city,
			r.name AS room_name,
			r.max_pax_tables AS room_max_pax_tables,
			e.host_user_id,
			host_u.display_name AS host_display_name,
			e.co_host_1_user_id,
			co1.display_name AS co_host_1_display_name,
			e.co_host_2_user_id,
			co2.display_name AS co_host_2_display_name
		FROM events e
		JOIN partners p ON e.partner_id = p.partner_id
		JOIN rooms r ON e.room_id = r.room_id
		JOIN locations l ON r.location_id = l.location_id
		JOIN users host_u ON e.host_user_id = host_u.user_id
		LEFT JOIN users co1 ON e.co_host_1_user_id = co1.user_id
		LEFT JOIN users co2 ON e.co_host_2_user_id = co2.user_id
		WHERE e.slug = ?
	`).get(slug) as EventRow | undefined;

	if (!row) return null;

	return {
		event_id: row.event_id,
		slug: row.slug,
		title: row.title,
		description: row.description,
		starts_at: row.starts_at,
		planned_ends_at: row.planned_ends_at,
		image_url: row.image_url,
		website_url: row.website_url,
		linkedin_url: row.linkedin_url,
		x_post_url: row.x_post_url,
		overbooking_factor: row.overbooking_factor,
		partner: {
			name: row.partner_name,
			logo_url: row.partner_logo_url
		},
		location: {
			name: row.location_name,
			address: row.location_address,
			city: row.location_city
		},
		room: {
			name: row.room_name,
			max_pax_tables: row.room_max_pax_tables
		},
		host: {
			id: row.host_user_id,
			displayName: row.host_display_name
		},
		coHost1: row.co_host_1_user_id
			? { id: row.co_host_1_user_id, displayName: row.co_host_1_display_name! }
			: null,
		coHost2: row.co_host_2_user_id
			? { id: row.co_host_2_user_id, displayName: row.co_host_2_display_name! }
			: null
	};
}

/**
 * Get user's current registration status for an event.
 * Returns null if user is not registered (or has cancelled).
 */
export function getRegistrationStatus(
	eventId: string,
	userId: string
): RegistrationStatus | null {
	const db = getDatabase();

	const row = db.prepare(`
		SELECT
			registration_id,
			in_presence,
			waitlist_position,
			waitlist_invited_at,
			waitlist_expires_at,
			registered_at,
			cancelled_at
		FROM event_registrations
		WHERE event_id = ? AND user_id = ? AND cancelled_at IS NULL
	`).get(eventId, userId) as RegistrationRow | undefined;

	if (!row) return null;

	// Check for expired waitlist invitation — auto-expire lazily
	if (row.waitlist_invited_at && row.waitlist_expires_at) {
		const now = new Date();
		const expires = new Date(row.waitlist_expires_at);
		if (now > expires) {
			expireWaitlistInvitation(eventId, userId);
			return null;
		}
	}

	return {
		registration_id: row.registration_id,
		in_presence: !!row.in_presence,
		waitlist_position: row.waitlist_position,
		waitlist_invited_at: row.waitlist_invited_at,
		waitlist_expires_at: row.waitlist_expires_at,
		registered_at: row.registered_at,
		cancelled_at: row.cancelled_at
	};
}

/**
 * Get registration counts for an event.
 */
export function getRegistrationCounts(eventId: string): RegistrationCounts {
	const db = getDatabase();

	// Registered (not cancelled, not on waitlist)
	const registered = db.prepare(`
		SELECT COUNT(*) AS count
		FROM event_registrations
		WHERE event_id = ? AND cancelled_at IS NULL AND waitlist_position IS NULL
		  AND waitlist_invited_at IS NULL
	`).get(eventId) as CountRow;

	// Also count those with waitlist invitations (they're confirmed-pending)
	const invited = db.prepare(`
		SELECT COUNT(*) AS count
		FROM event_registrations
		WHERE event_id = ? AND cancelled_at IS NULL AND waitlist_invited_at IS NOT NULL
	`).get(eventId) as CountRow;

	// Waitlisted (on waitlist, not cancelled, not invited)
	const waitlisted = db.prepare(`
		SELECT COUNT(*) AS count
		FROM event_registrations
		WHERE event_id = ? AND cancelled_at IS NULL AND waitlist_position IS NOT NULL
		  AND waitlist_invited_at IS NULL
	`).get(eventId) as CountRow;

	const capacity = getEffectiveCapacity(eventId);

	return {
		registeredCount: registered.count + invited.count,
		waitlistCount: waitlisted.count,
		effectiveCapacity: capacity.effective,
		baseCapacity: capacity.base
	};
}

/**
 * Get effective capacity for an event (room capacity * overbooking factor).
 * Per Ch.29.5: overbooking_capacity = base_capacity × overbooking_factor
 */
export function getEffectiveCapacity(eventId: string): { base: number; effective: number } {
	const db = getDatabase();

	const row = db.prepare(`
		SELECT
			r.max_pax_tables AS base_capacity,
			e.overbooking_factor
		FROM events e
		JOIN rooms r ON e.room_id = r.room_id
		WHERE e.event_id = ?
	`).get(eventId) as { base_capacity: number; overbooking_factor: number } | undefined;

	if (!row) return { base: 0, effective: 0 };

	return {
		base: row.base_capacity,
		effective: Math.floor(row.base_capacity * row.overbooking_factor)
	};
}

/**
 * Get problems associated with this event via event_problem_queue.
 */
export function getEventProblems(eventId: string): EventProblemItem[] {
	const db = getDatabase();

	const rows = db.prepare(`
		SELECT
			p.problem_id,
			p.public_slug,
			pv.title,
			u.display_name AS owner_name,
			p.current_readiness_state AS readiness_state,
			p.current_action_state AS action_state,
			epq.queue_state
		FROM event_problem_queue epq
		JOIN problems p ON epq.problem_id = p.problem_id
		JOIN problem_versions pv ON p.problem_id = pv.problem_id AND pv.is_current = 1
		JOIN users u ON p.created_by_user_id = u.user_id
		WHERE epq.event_id = ?
		ORDER BY epq.position_index ASC
	`).all(eventId) as ProblemQueueRow[];

	return rows;
}

// ============================================================================
// Write operations
// ============================================================================

/**
 * Register a user for an event. Auto-waitlists if capacity is full.
 * Per Ch.29.5-6: If registered_count < effective_capacity, register directly.
 * Otherwise, add to waitlist.
 */
export function registerForEvent(
	eventId: string,
	userId: string,
	inPresence: boolean
): { success: true; registration_id: string; waitlisted: boolean; waitlist_position?: number } {
	const db = getDatabase();

	return db.transaction(() => {
		// Check if user is already registered (not cancelled)
		const existing = db.prepare(`
			SELECT registration_id FROM event_registrations
			WHERE event_id = ? AND user_id = ? AND cancelled_at IS NULL
		`).get(eventId, userId) as { registration_id: string } | undefined;

		if (existing) {
			return {
				success: true as const,
				registration_id: existing.registration_id,
				waitlisted: false
			};
		}

		// Check if there's a cancelled registration we can reuse the slot
		// (UNIQUE constraint on event_id, user_id — need to handle re-registration)
		const cancelled = db.prepare(`
			SELECT registration_id FROM event_registrations
			WHERE event_id = ? AND user_id = ? AND cancelled_at IS NOT NULL
		`).get(eventId, userId) as { registration_id: string } | undefined;

		const counts = getRegistrationCounts(eventId);
		const capacityFull = counts.registeredCount >= counts.effectiveCapacity;

		const now = nowIso();
		const registrationId = generateId();

		if (cancelled) {
			// Re-registration: update the existing row
			if (capacityFull && inPresence) {
				// Add to waitlist
				const maxPos = db.prepare(`
					SELECT COALESCE(MAX(waitlist_position), 0) AS max_pos
					FROM event_registrations
					WHERE event_id = ? AND cancelled_at IS NULL AND waitlist_position IS NOT NULL
				`).get(eventId) as { max_pos: number };

				const position = maxPos.max_pos + 1;

				db.prepare(`
					UPDATE event_registrations
					SET in_presence = ?, waitlist_position = ?, waitlist_invited_at = NULL,
					    waitlist_expires_at = NULL, registered_at = ?, cancelled_at = NULL
					WHERE registration_id = ?
				`).run(inPresence ? 1 : 0, position, now, cancelled.registration_id);

				return {
					success: true as const,
					registration_id: cancelled.registration_id,
					waitlisted: true,
					waitlist_position: position
				};
			} else {
				// Direct registration
				db.prepare(`
					UPDATE event_registrations
					SET in_presence = ?, waitlist_position = NULL, waitlist_invited_at = NULL,
					    waitlist_expires_at = NULL, registered_at = ?, cancelled_at = NULL
					WHERE registration_id = ?
				`).run(inPresence ? 1 : 0, now, cancelled.registration_id);

				return {
					success: true as const,
					registration_id: cancelled.registration_id,
					waitlisted: false
				};
			}
		}

		// New registration
		if (capacityFull && inPresence) {
			// Add to waitlist
			const maxPos = db.prepare(`
				SELECT COALESCE(MAX(waitlist_position), 0) AS max_pos
				FROM event_registrations
				WHERE event_id = ? AND cancelled_at IS NULL AND waitlist_position IS NOT NULL
			`).get(eventId) as { max_pos: number };

			const position = maxPos.max_pos + 1;

			db.prepare(`
				INSERT INTO event_registrations
				(registration_id, event_id, user_id, in_presence, waitlist_position, registered_at)
				VALUES (?, ?, ?, ?, ?, ?)
			`).run(registrationId, eventId, userId, inPresence ? 1 : 0, position, now);

			return {
				success: true as const,
				registration_id: registrationId,
				waitlisted: true,
				waitlist_position: position
			};
		}

		// Direct registration
		db.prepare(`
			INSERT INTO event_registrations
			(registration_id, event_id, user_id, in_presence, registered_at)
			VALUES (?, ?, ?, ?, ?)
		`).run(registrationId, eventId, userId, inPresence ? 1 : 0, now);

		return {
			success: true as const,
			registration_id: registrationId,
			waitlisted: false
		};
	})();
}

/**
 * Cancel a registration. Auto-invites next waitlisted user.
 * Per Ch.29.6 / Ch.30.8-9: When cancelled, invite next in waitlist.
 */
export function cancelRegistration(
	eventId: string,
	userId: string
): { success: boolean } {
	const db = getDatabase();

	return db.transaction(() => {
		const now = nowIso();

		// Find active registration
		const reg = db.prepare(`
			SELECT registration_id, waitlist_position FROM event_registrations
			WHERE event_id = ? AND user_id = ? AND cancelled_at IS NULL
		`).get(eventId, userId) as { registration_id: string; waitlist_position: number | null } | undefined;

		if (!reg) {
			return { success: false };
		}

		// Mark as cancelled
		db.prepare(`
			UPDATE event_registrations SET cancelled_at = ? WHERE registration_id = ?
		`).run(now, reg.registration_id);

		// If this was a confirmed registration (not waitlisted), invite next waitlisted user
		if (reg.waitlist_position === null) {
			inviteNextFromWaitlist(eventId);
		}

		return { success: true };
	})();
}

/**
 * Respond to a waitlist invitation.
 * Accept: Clear waitlist fields, confirm registration.
 * Decline: Cancel registration, invite next.
 */
export function respondToWaitlistInvite(
	eventId: string,
	userId: string,
	accept: boolean
): { success: boolean } {
	const db = getDatabase();

	return db.transaction(() => {
		const now = nowIso();

		const reg = db.prepare(`
			SELECT registration_id, waitlist_invited_at, waitlist_expires_at
			FROM event_registrations
			WHERE event_id = ? AND user_id = ? AND cancelled_at IS NULL
			  AND waitlist_invited_at IS NOT NULL
		`).get(eventId, userId) as {
			registration_id: string;
			waitlist_invited_at: string;
			waitlist_expires_at: string;
		} | undefined;

		if (!reg) return { success: false };

		// Check if invitation has expired
		if (new Date(reg.waitlist_expires_at) < new Date()) {
			// Expired — treat as decline
			db.prepare(`
				UPDATE event_registrations SET cancelled_at = ? WHERE registration_id = ?
			`).run(now, reg.registration_id);
			inviteNextFromWaitlist(eventId);
			return { success: false };
		}

		if (accept) {
			// Confirm: clear waitlist fields
			db.prepare(`
				UPDATE event_registrations
				SET waitlist_position = NULL, waitlist_invited_at = NULL, waitlist_expires_at = NULL
				WHERE registration_id = ?
			`).run(reg.registration_id);
		} else {
			// Decline: cancel and invite next
			db.prepare(`
				UPDATE event_registrations SET cancelled_at = ? WHERE registration_id = ?
			`).run(now, reg.registration_id);
			inviteNextFromWaitlist(eventId);
		}

		return { success: true };
	})();
}

// ============================================================================
// Internal helpers
// ============================================================================

/**
 * Invite the next person on the waitlist.
 * Per Ch.29.6: Find lowest waitlist_position, set invited_at + expires_at (24h).
 */
export function inviteNextFromWaitlist(eventId: string): void {
	const db = getDatabase();
	const now = nowIso();
	const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

	const next = db.prepare(`
		SELECT registration_id FROM event_registrations
		WHERE event_id = ? AND cancelled_at IS NULL
		  AND waitlist_position IS NOT NULL AND waitlist_invited_at IS NULL
		ORDER BY waitlist_position ASC
		LIMIT 1
	`).get(eventId) as { registration_id: string } | undefined;

	if (!next) return;

	db.prepare(`
		UPDATE event_registrations
		SET waitlist_invited_at = ?, waitlist_expires_at = ?
		WHERE registration_id = ?
	`).run(now, expiresAt, next.registration_id);
}

/**
 * Expire a waitlist invitation (lazy evaluation on access).
 * Per Ch.29.6: If 24h passed without response, auto-decline and invite next.
 */
function expireWaitlistInvitation(eventId: string, userId: string): void {
	const db = getDatabase();
	const now = nowIso();

	db.transaction(() => {
		db.prepare(`
			UPDATE event_registrations SET cancelled_at = ?
			WHERE event_id = ? AND user_id = ? AND cancelled_at IS NULL
			  AND waitlist_invited_at IS NOT NULL
		`).run(now, eventId, userId);

		inviteNextFromWaitlist(eventId);
	})();
}
