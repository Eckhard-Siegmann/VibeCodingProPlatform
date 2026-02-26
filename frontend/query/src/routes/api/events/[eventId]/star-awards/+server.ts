/**
 * Star Awards API — moderator confirms 1st/2nd/3rd place for coded problems.
 *
 * GET  /api/events/[eventId]/star-awards      — existing awards for event
 * POST /api/events/[eventId]/star-awards      — confirm star awards (moderator)
 *
 * Spec: Ch.33.6.4, Ch.17.9, pagedesign/recognition_design.md §3
 */

import { json } from '@sveltejs/kit';
import { requireModerator, handleAuthError } from '$lib/server/auth';
import {
	confirmEventStarAwards,
	getEventStarAwards
} from '$lib/server/repositories/recognition';

/**
 * GET — return existing star awards for the event.
 * Moderator only (to avoid spoilers before confirmation).
 */
export async function GET({ params, cookies }) {
	try {
		requireModerator(cookies);
		const awards = getEventStarAwards(params.eventId);
		return json({ success: true, data: awards });
	} catch (error: unknown) {
		const { body, status } = handleAuthError(error);
		return json(body, { status });
	}
}

/**
 * POST — confirm star awards for this event.
 *
 * Body:
 * {
 *   awards: Array<{ problemId: string; place: 1 | 2 | 3 }>
 * }
 *
 * All team members of each winning problem receive a star_awards record.
 * Returns any first_star_earned milestones for the awarder's UI.
 */
export async function POST({ params, request, cookies }) {
	try {
		const user = requireModerator(cookies);

		const body = await request.json();

		if (!Array.isArray(body.awards) || body.awards.length === 0) {
			return json(
				{ success: false, error: 'awards array is required and must not be empty' },
				{ status: 400 }
			);
		}

		// Validate each award entry
		for (const award of body.awards) {
			if (!award.problemId || ![1, 2, 3].includes(award.place)) {
				return json(
					{ success: false, error: 'Each award must have problemId and place (1, 2, or 3)' },
					{ status: 400 }
				);
			}
		}

		// Check for duplicate places
		const places = body.awards.map((a: { place: number }) => a.place);
		if (new Set(places).size !== places.length) {
			return json(
				{ success: false, error: 'Each place (1st, 2nd, 3rd) can only be assigned once' },
				{ status: 400 }
			);
		}

		const milestones = confirmEventStarAwards(user.user_id, params.eventId, body.awards);

		return json({
			success: true,
			milestones // client fires toast for each first_star_earned milestone
		});
	} catch (error: unknown) {
		const { body, status } = handleAuthError(error);
		return json(body, { status });
	}
}
