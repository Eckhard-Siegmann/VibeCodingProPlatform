/**
 * Participant Dashboard server loader.
 * Ticket: TICKET-3 | Spec: Ch.12.4 | Design: pagedesign/dashboard_design.md
 *
 * Loads personalised dashboard data:
 *  - user's problems, registered events, stats
 *  - live event context & open assessment (if any)
 *  - recent activity feed
 */

import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { validateSession } from '$lib/server/session';
import { getAuthenticatedUser } from '$lib/server/auth';
import {
	getUserProblems,
	getUserRegisteredEvents,
	getUserStats,
	getUserActivityFeed,
	getOpenAssessmentForUser,
	getLiveEventForUser
} from '$lib/server/repositories/dashboard';
import { getPersonalContributions } from '$lib/server/repositories/recognition';

export const load: PageServerLoad = async ({ cookies }) => {
	// Strict auth: redirect to login if no real session (demo fallback for dev)
	const session = validateSession(cookies);
	const user = session
		? { user_id: session.user_id, email: session.email, display_name: session.display_name }
		: getAuthenticatedUser(cookies);

	if (!user) {
		redirect(303, '/login?redirect=/dashboard');
	}

	// 1. User's problems (bounded: max 5, with total count)
	const myProblemsResult = getUserProblems(user.user_id, 5);

	// 2. User's registered events (bounded: max 4, 2 upcoming + 2 recent past)
	const myEventsResult = getUserRegisteredEvents(user.user_id, 4);

	// 3. Aggregated stats
	const stats = getUserStats(user.user_id);

	// 4. Live event context
	const liveEvent = getLiveEventForUser(user.user_id);

	// 5. Open assessment (if live event active)
	let openAssessment = null;
	if (liveEvent) {
		openAssessment = getOpenAssessmentForUser(user.user_id, liveEvent.eventId);
	}

	// 6. Activity feed (initial 10 items, with total count for Load More)
	const recentActivityResult = getUserActivityFeed(user.user_id, 10, 0);

	// 7. Personal contributions (points breakdown + recent awards)
	const personalContributions = getPersonalContributions(user.user_id);

	return {
		user: {
			user_id: user.user_id,
			display_name: user.display_name
		},
		myProblems: myProblemsResult.items,
		myProblemsTotal: myProblemsResult.totalCount,
		myEvents: myEventsResult.items,
		myEventsTotal: myEventsResult.totalCount,
		stats,
		liveEvent,
		openAssessment,
		recentActivity: {
			items: recentActivityResult.items,
			totalCount: recentActivityResult.totalCount
		},
		personalContributions
	};
};
