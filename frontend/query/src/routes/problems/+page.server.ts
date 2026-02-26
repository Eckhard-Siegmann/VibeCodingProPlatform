/**
 * Problem Backlog server loader.
 * Ticket: TICKET-29 | Spec: Ch.12.8, Ch.12.10 | Design: pagedesign/problem_backlog_design.md
 *
 * Loads paginated, filtered problem list with moderator visibility rules.
 */

import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { validateSession } from '$lib/server/session';
import { getAuthenticatedUser } from '$lib/server/auth';
import {
	getProblemsBacklog,
	getProblemTypes,
	getLocations
} from '$lib/server/repositories/problems';

export const load: PageServerLoad = async ({ url, cookies }) => {
	// Auth: require login (falls back to demo user in dev)
	const session = validateSession(cookies);
	const user = session
		? { user_id: session.user_id, email: session.email, display_name: session.display_name, role: session.role }
		: null;

	if (!user) {
		// In dev mode, use demo user fallback
		const demoUser = getAuthenticatedUser(cookies);
		if (demoUser.user_id === 'demo-user-001') {
			// Dev mode fallback — allow with developer role
			return loadBacklog(url, demoUser.user_id, 'developer');
		}
		redirect(303, '/login?redirect=/problems');
	}

	return loadBacklog(url, user.user_id, user.role);
};

function loadBacklog(url: URL, userId: string, userRole: string) {
	// Parse URL search params
	const page = parseInt(url.searchParams.get('page') || '1');
	const search = url.searchParams.get('search') || '';
	const readiness = url.searchParams.get('readiness') || 'all';
	const action = url.searchParams.get('action') || 'all';
	const type = url.searchParams.get('type') || 'all';
	const location = url.searchParams.get('location') || 'all';
	const sort = url.searchParams.get('sort') || 'newest';
	const owner = url.searchParams.get('owner') || '';

	const isModerator = userRole === 'moderator' || userRole === 'admin';

	const result = getProblemsBacklog({
		page,
		pageSize: 20,
		search,
		readiness,
		action,
		type,
		location,
		sort,
		includeDraft: isModerator && readiness === 'draft',
		includeRejected: isModerator && readiness === 'rejected',
		includeDropped: isModerator && action === 'dropped',
		ownerUserId: owner === 'me' ? userId : undefined
	});

	const problemTypes = getProblemTypes();
	const locations = getLocations();

	return {
		problems: result.items,
		pagination: result.pagination,
		problemTypes: problemTypes.map((pt) => ({ value: pt.type_key, label: pt.display_name })),
		locations,
		filters: { readiness, action, type, location, sort, search, owner },
		isModerator
	};
}
