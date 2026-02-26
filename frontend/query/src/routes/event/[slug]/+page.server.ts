import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { validateSession } from '$lib/server/session';
import {
	getEventBySlug,
	getRegistrationStatus,
	getRegistrationCounts,
	getEventProblems
} from '$lib/server/repositories/registrations';

export const load: PageServerLoad = async ({ params, cookies }) => {
	const { slug } = params;

	// Load event details
	const event = getEventBySlug(slug);
	if (!event) {
		error(404, 'Event not found');
	}

	// Check authentication (optional — unauthenticated users can view events)
	const session = validateSession(cookies);

	// Load registration status for authenticated user
	const registration = session
		? getRegistrationStatus(event.event_id, session.user_id)
		: null;

	// Load capacity counts
	const counts = getRegistrationCounts(event.event_id);

	// Load problem queue
	const problems = getEventProblems(event.event_id);

	// Determine event status
	const now = new Date();
	const startsAt = new Date(event.starts_at);
	const endsAt = new Date(event.planned_ends_at);
	const isPast = now > endsAt;
	const isLive = now >= startsAt && now <= endsAt;

	return {
		event: {
			...event,
			isPast,
			isLive
		},
		registration,
		counts,
		problems,
		isAuthenticated: !!session,
		user: session ? { user_id: session.user_id, display_name: session.display_name } : null
	};
};
