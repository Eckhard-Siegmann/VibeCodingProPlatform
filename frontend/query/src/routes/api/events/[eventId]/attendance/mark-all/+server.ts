/**
 * POST /api/events/:eventId/attendance/mark-all
 * Mark all in-presence registrants as showed_up.
 * Spec: Ch.12.4 (Moderator Dashboard) | Auth: Moderator/Admin
 */

import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { requireModerator, handleAuthError } from '$lib/server/auth';
import { markAllPresent, getShowUpStats } from '$lib/server/repositories/attendance';

export const POST: RequestHandler = async ({ params, cookies }) => {
	try {
		requireModerator(cookies);
	} catch (err) {
		const { body, status } = handleAuthError(err);
		return json(body, { status });
	}

	try {
		const marked = markAllPresent(params.eventId);
		const stats = getShowUpStats(params.eventId);
		return json({ success: true, marked, stats });
	} catch (err: any) {
		console.error('[ATTENDANCE] Mark-all error:', err);
		return json({ success: false, error: err.message }, { status: 500 });
	}
};
