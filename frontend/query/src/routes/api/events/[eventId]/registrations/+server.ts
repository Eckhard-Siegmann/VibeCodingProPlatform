import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validateSession } from '$lib/server/session';
import {
	registerForEvent,
	cancelRegistration,
	respondToWaitlistInvite,
	getRegistrationStatus,
	getRegistrationCounts
} from '$lib/server/repositories/registrations';

/**
 * POST /api/events/[eventId]/registrations
 *
 * Body: { action: 'register' | 'cancel' | 'waitlist-respond', ... }
 */
export const POST: RequestHandler = async ({ params, request, cookies }) => {
	const { eventId } = params;

	// Require authentication
	const session = validateSession(cookies);
	if (!session) {
		return json({ success: false, error: 'Unauthorized' }, { status: 401 });
	}

	let body: Record<string, unknown>;
	try {
		body = await request.json();
	} catch {
		return json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
	}

	const action = body.action as string;

	try {
		switch (action) {
			case 'register': {
				const inPresence = body.in_presence !== false;
				const result = registerForEvent(eventId, session.user_id, inPresence);
				// Return updated counts
				const counts = getRegistrationCounts(eventId);
				const registration = getRegistrationStatus(eventId, session.user_id);
				return json({ ...result, counts, registration });
			}

			case 'cancel': {
				const result = cancelRegistration(eventId, session.user_id);
				if (!result.success) {
					return json(
						{ success: false, error: 'No active registration found' },
						{ status: 404 }
					);
				}
				const counts = getRegistrationCounts(eventId);
				return json({ success: true, counts, registration: null });
			}

			case 'waitlist-respond': {
				const accept = body.accept === true;
				const result = respondToWaitlistInvite(eventId, session.user_id, accept);
				if (!result.success) {
					return json(
						{ success: false, error: 'No active waitlist invitation found' },
						{ status: 404 }
					);
				}
				const counts = getRegistrationCounts(eventId);
				const registration = getRegistrationStatus(eventId, session.user_id);
				return json({ success: true, counts, registration });
			}

			default:
				return json(
					{ success: false, error: 'Invalid action. Use: register, cancel, waitlist-respond' },
					{ status: 400 }
				);
		}
	} catch (err) {
		console.error(`Registration API error (${action}):`, err);
		return json({ success: false, error: 'Internal server error' }, { status: 500 });
	}
};
