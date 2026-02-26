/**
 * Events Listing server loader.
 * Ticket: TICKET-29 | Spec: Ch.12.9, Ch.12.10 | Design: pagedesign/events_listing_design.md
 *
 * Loads events in three temporal sections (active, upcoming, past)
 * with user registration states for inline registration buttons.
 */

import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { validateSession } from '$lib/server/session';
import { getAuthenticatedUser } from '$lib/server/auth';
import {
	getActiveEventsFiltered,
	getUpcomingEventsFiltered,
	getPastEventsFiltered,
	getUserEventRegistrations,
	getEventLocations
} from '$lib/server/repositories/events-public';

export const load: PageServerLoad = async ({ url, cookies }) => {
	// Auth: require login (falls back to demo user in dev)
	const session = validateSession(cookies);
	let userId: string;
	let userRole: string;

	if (session) {
		userId = session.user_id;
		userRole = session.role;
	} else {
		// Dev mode fallback
		const demoUser = getAuthenticatedUser(cookies);
		if (demoUser.user_id === 'demo-user-001') {
			userId = demoUser.user_id;
			userRole = 'developer';
		} else {
			redirect(303, '/login?redirect=/events');
		}
	}

	// Parse URL search params
	const search = url.searchParams.get('search') || '';
	const location = url.searchParams.get('location') || 'all';
	const time = url.searchParams.get('time') || 'all';
	const pastCount = parseInt(url.searchParams.get('pastCount') || '5');

	const filterOptions = { search, location };

	// Load all three temporal sections
	const activeEvents = getActiveEventsFiltered(filterOptions);
	const upcomingEvents = getUpcomingEventsFiltered(filterOptions);
	const pastResult = getPastEventsFiltered({
		...filterOptions,
		time,
		limit: Math.max(pastCount, 1)
	});

	// Load user's registration states for button rendering
	const userRegistrations = getUserEventRegistrations(userId);

	// Load locations for filter dropdown
	const locations = getEventLocations();

	const isModerator = userRole === 'moderator' || userRole === 'admin';

	return {
		activeEvents,
		upcomingEvents,
		pastEvents: pastResult.items,
		pastTotal: pastResult.total,
		pastCount: Math.max(pastCount, 1),
		locations,
		userRegistrations,
		filters: { search, location, time },
		isModerator
	};
};
