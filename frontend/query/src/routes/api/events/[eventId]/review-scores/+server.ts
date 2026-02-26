/**
 * Review Scores API — weighted review scores for star award ranking.
 *
 * GET /api/events/[eventId]/review-scores
 *
 * Returns aggregated weighted scores for all coded problems at the event
 * that have a closed review assessment. Used by the star awards panel.
 *
 * Spec: Ch.33.6.4 (aggregation formula), Ch.17.9.1 (UI), Ch.19.3.37 (weights)
 */

import { json } from '@sveltejs/kit';
import { requireModerator, handleAuthError } from '$lib/server/auth';
import { getReviewScoresForEvent } from '$lib/server/repositories/recognition';

export async function GET({ params, cookies }) {
	try {
		requireModerator(cookies);
		const scores = getReviewScoresForEvent(params.eventId);
		return json({ success: true, data: scores });
	} catch (error: unknown) {
		const { body, status } = handleAuthError(error);
		return json(body, { status });
	}
}
