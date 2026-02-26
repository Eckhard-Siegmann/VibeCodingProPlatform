import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireModerator, AuthError } from '$lib/server/auth';
import { getEventReviewResults } from '$lib/server/repositories/responses';

/**
 * GET /api/events/[eventId]/review-results
 *
 * Returns aggregated review results for all closed review assessments in an event.
 * Per Ch.15.4.7: Event-level review summary for moderator dashboard.
 * Requires moderator or admin role.
 */
export const GET: RequestHandler = async ({ params, cookies }) => {
	const { eventId } = params;

	try {
		// Require moderator role (Ch.15.4.7: visible only to moderator/admin)
		requireModerator(cookies);

		const results = getEventReviewResults(eventId);

		return json({
			success: true,
			event_id: eventId,
			results
		});
	} catch (err) {
		if (err instanceof AuthError) {
			throw error(err.status, err.message);
		}
		if (
			err &&
			typeof err === 'object' &&
			'status' in err &&
			typeof (err as { status: unknown }).status === 'number'
		) {
			throw err;
		}

		console.error('Error fetching review results:', err);
		const message = err instanceof Error ? err.message : 'Unknown error';
		throw error(500, `Failed to fetch review results: ${message}`);
	}
};
