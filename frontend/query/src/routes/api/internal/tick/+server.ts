import { json } from '@sveltejs/kit';
import { CRON_BEARER_TOKEN } from '$env/static/private';
import {
	expireWaitlistInvitations,
	autoInviteNextWaitlist,
	closeExpiredTimers,
	checkReminderDue
} from '$lib/server/repositories/tick';

/**
 * OS-Cron tick endpoint (ADR 010).
 *
 * Called every 2-5 minutes by Hetzner cron:
 *   curl -X POST https://platform.example.com/api/internal/tick \
 *     -H "Authorization: Bearer <CRON_BEARER_TOKEN>"
 *
 * Executes four categories of time-dependent tasks:
 * 1. Expire stale waitlist invitations (24h window)
 * 2. Auto-invite next person on waitlist
 * 3. Close expired live event timers (safety net)
 * 4. Flag events approaching 24h for moderator reminder
 */
export async function POST({ request }) {
	// Bearer token authentication
	const authHeader = request.headers.get('authorization');
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return json({ success: false, error: 'Missing or malformed Authorization header' }, { status: 401 });
	}

	const token = authHeader.slice('Bearer '.length);
	if (token !== CRON_BEARER_TOKEN) {
		return json({ success: false, error: 'Invalid bearer token' }, { status: 401 });
	}

	// Execute tick tasks in sequence
	const results = {
		waitlist_expired: expireWaitlistInvitations(),
		waitlist_invited: autoInviteNextWaitlist(),
		timers_closed: closeExpiredTimers(),
		reminders_flagged: checkReminderDue()
	};

	return json({
		success: true,
		timestamp: new Date().toISOString(),
		results
	});
}
