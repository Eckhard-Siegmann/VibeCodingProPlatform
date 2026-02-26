import { getDatabase, nowIso } from '$lib/server/db';
import { sendEmail, logCommunication } from '$lib/server/email';
import { getRegistrationCounts, inviteNextFromWaitlist } from './registrations';
import { getCurrentTemplate, getRegisteredEmails } from './email-templates';
import { recordDecision } from './events';
import { MODE_CLOSE_DECISION } from '$lib/constants/decisions';

/**
 * Tick repository — OS-Cron automated task handlers (ADR 010).
 *
 * Called every 2-5 minutes by POST /api/internal/tick.
 * Each function handles one category of time-dependent behavior.
 *
 * TICKET-9: Scaffolded with stubs.
 * TICKET-10: Deep logic implemented.
 */

/**
 * Expire waitlist invitations where waitlist_expires_at < NOW().
 * Sets cancelled_at, logs to communications_log, then invites next person.
 * Each registration in its own transaction (partial failure is OK).
 */
export function expireWaitlistInvitations(): { expired: number } {
	const db = getDatabase();
	const now = nowIso();

	const expired = db.prepare(`
		SELECT registration_id, event_id, user_id
		FROM event_registrations
		WHERE waitlist_expires_at IS NOT NULL
		  AND waitlist_expires_at < ?
		  AND cancelled_at IS NULL
	`).all(now) as { registration_id: string; event_id: string; user_id: string }[];

	let expiredCount = 0;

	for (const reg of expired) {
		try {
			db.transaction(() => {
				// Cancel the expired invitation
				db.prepare(`
					UPDATE event_registrations
					SET cancelled_at = ?
					WHERE registration_id = ? AND cancelled_at IS NULL
				`).run(now, reg.registration_id);

				// Log to communications_log
				logCommunication({
					eventId: reg.event_id,
					type: 'waitlist_expired',
					recipientUserId: reg.user_id,
					recipientCount: null,
					subject: null,
					bodyPreview: 'Waitlist invitation expired after 24h without response',
					templateVersion: null,
					triggeredBy: 'system',
					triggeredByUserId: null
				});

				// Invite the next person on the waitlist
				inviteNextFromWaitlist(reg.event_id);
			})();

			expiredCount++;
		} catch (err) {
			console.error(`[TICK] Failed to expire waitlist registration ${reg.registration_id}:`, err);
		}
	}

	return { expired: expiredCount };
}

/**
 * Auto-invite the next person on the waitlist when a spot opens.
 * Only invites if: capacity available, no outstanding invite exists, waitlist not empty.
 * Logs to communications_log and sends email notification.
 */
export function autoInviteNextWaitlist(): { invited: number } {
	const db = getDatabase();
	const now = nowIso();

	// Find events with waitlisted users (no active invite pending)
	const eventsWithWaitlist = db.prepare(`
		SELECT DISTINCT er.event_id
		FROM event_registrations er
		WHERE er.cancelled_at IS NULL
		  AND er.waitlist_position IS NOT NULL
		  AND er.waitlist_invited_at IS NULL
	`).all() as { event_id: string }[];

	let invitedCount = 0;

	for (const { event_id: eventId } of eventsWithWaitlist) {
		try {
			// TICKET-11: Atomic transaction wraps all reads + write to prevent
			// race conditions with concurrent cancelRegistration() calls.
			// Returns invited user info on success, null if no invite should happen.
			const invited = db.transaction(() => {
				// Check if there's already an outstanding invite for this event
				const pendingInvite = db.prepare(`
					SELECT registration_id FROM event_registrations
					WHERE event_id = ? AND cancelled_at IS NULL AND waitlist_invited_at IS NOT NULL
					LIMIT 1
				`).get(eventId) as { registration_id: string } | undefined;

				if (pendingInvite) return null; // At most one active invite per event

				// Check capacity
				const counts = getRegistrationCounts(eventId);
				if (counts.registeredCount >= counts.effectiveCapacity) return null;

				// Find next waitlisted person
				const next = db.prepare(`
					SELECT er.registration_id, er.user_id, u.email, u.display_name
					FROM event_registrations er
					JOIN users u ON er.user_id = u.user_id
					WHERE er.event_id = ? AND er.cancelled_at IS NULL
					  AND er.waitlist_position IS NOT NULL AND er.waitlist_invited_at IS NULL
					ORDER BY er.waitlist_position ASC
					LIMIT 1
				`).get(eventId) as {
					registration_id: string;
					user_id: string;
					email: string;
					display_name: string;
				} | undefined;

				if (!next) return null;

				const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

				// Set invite timestamps
				db.prepare(`
					UPDATE event_registrations
					SET waitlist_invited_at = ?, waitlist_expires_at = ?
					WHERE registration_id = ?
				`).run(now, expiresAt, next.registration_id);

				// Log to communications_log (atomic with invite for audit completeness)
				const template = getCurrentTemplate(eventId);
				logCommunication({
					eventId,
					type: 'waitlist_invite',
					recipientUserId: next.user_id,
					recipientCount: null,
					subject: 'A spot has opened up! You have 24 hours to confirm',
					bodyPreview: `Waitlist invite sent to ${next.display_name}`,
					templateVersion: template?.version ?? null,
					triggeredBy: 'system',
					triggeredByUserId: null
				});

				return next;
			})();

			if (!invited) continue;

			// Email dispatch AFTER transaction commit (external side effect)
			if (invited.email) {
				// Fire-and-forget: tick is synchronous, email dispatch is async
				// Errors are logged inside sendEmail, don't block tick processing
				sendEmail({
					to: invited.email,
					toName: invited.display_name,
					subject: 'A spot has opened up! You have 24 hours to confirm',
					bodyMarkdown: `Hi ${invited.display_name},\n\nA spot has opened up at the event. You have 24 hours to confirm your attendance.\n\nPlease log in to accept or decline.`
				}).catch((err) => {
					console.error(`[TICK] Email dispatch failed for ${invited.email}:`, err);
				});
			}

			invitedCount++;
		} catch (err) {
			console.error(`[TICK] Failed to auto-invite for event ${eventId}:`, err);
		}
	}

	return { invited: invitedCount };
}

/**
 * Close expired timers in event_live_context (safety net for lazy evaluation).
 * Primary closure is lazy-on-read (Ch.14.5.1.1); this catches edge cases
 * where no client polls during the expiry window.
 *
 * Must be idempotent: only closes if current_mode != 'idle'.
 * Uses recordDecision() for full side-effect chain (same pattern as
 * checkAndCloseExpiredTimer in events.ts:91-131).
 */
export function closeExpiredTimers(): { closed: number } {
	const db = getDatabase();
	const now = nowIso();

	const expired = db.prepare(`
		SELECT c.event_id, c.current_mode, c.current_problem_id, e.host_user_id
		FROM event_live_context c
		JOIN events e ON c.event_id = e.event_id
		WHERE c.timer_ends_at IS NOT NULL
		  AND c.timer_ends_at < ?
		  AND c.current_mode != 'idle'
		  AND c.current_problem_id IS NOT NULL
	`).all(now) as {
		event_id: string;
		current_mode: string;
		current_problem_id: string;
		host_user_id: string;
	}[];

	let closedCount = 0;

	for (const ctx of expired) {
		try {
			const closeDecision = MODE_CLOSE_DECISION[ctx.current_mode];
			if (!closeDecision) continue;

			const result = recordDecision({
				eventId: ctx.event_id,
				problemId: ctx.current_problem_id,
				decisionType: closeDecision,
				actorUserId: ctx.host_user_id,
				rationale: 'Timer expired (auto-closed by cron tick)'
			});

			if (result.success) closedCount++;
		} catch (err) {
			console.error(`[TICK] Failed to close timer for event ${ctx.event_id}:`, err);
		}
	}

	return { closed: closedCount };
}

/**
 * Check if any events are starting within 24 hours and flag them.
 * Sets reminder_due = 1 on the events table.
 * Does NOT send emails — moderator does that manually (ADR 010 human-in-the-loop).
 */
export function checkReminderDue(): { flagged: number } {
	const db = getDatabase();
	const now = nowIso();
	const in24h = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

	const result = db
		.prepare(
			`UPDATE events
		 SET reminder_due = 1
		 WHERE starts_at <= ?
		   AND starts_at > ?
		   AND reminder_due = 0
		   AND reminder_sent_at IS NULL`
		)
		.run(in24h, now);

	return { flagged: result.changes };
}
