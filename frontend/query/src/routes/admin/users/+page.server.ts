/**
 * Admin Users page server loader — paginated, searchable, filterable.
 * Spec: Ch.17.5, Ch.12.10 | ADR 002 (SvelteKit) | Ticket: TICKET-30
 * Auth: Admin-only (requireRole).
 */

import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { requireRole } from '$lib/server/auth';
import { listUsersPaginated } from '$lib/server/repositories/admin-users';

export const load: PageServerLoad = async ({ url, cookies }) => {
	try {
		requireRole(cookies, ['admin']);
	} catch {
		throw error(403, 'Administrator role required.');
	}

	// Read URL params (Ch.12.10.4)
	const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
	const search = url.searchParams.get('search') || '';
	const role = url.searchParams.get('role') || 'all';
	const emailStatus = url.searchParams.get('emailStatus') || 'all';
	const sort = url.searchParams.get('sort') || 'newest';

	const result = listUsersPaginated({
		page,
		pageSize: 20,
		search,
		role,
		emailStatus,
		sort
	});

	return {
		users: result.items.map((u) => ({
			user_id: u.user_id,
			email: u.email,
			display_name: u.display_name,
			role: u.role as 'observer' | 'developer' | 'coding_partner' | 'problem_owner' | 'moderator' | 'admin' | 'agent',
			registered_at: u.created_at,
			email_confirmed: u.email_confirmed,
			newsletter_subscribed: u.get_infoletter,
			events_attended: u.events_attended
		})),
		pagination: result.pagination,
		filters: { search, role, emailStatus, sort }
	};
};
