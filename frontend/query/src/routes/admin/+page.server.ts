/**
 * Admin overview page server loader.
 * Loads real system stats and health indicators.
 * Spec: Ch.17, A15
 * Auth: Admin-only
 */

import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { requireRole } from '$lib/server/auth';
import { getAdminStats, getAdminHealth } from '$lib/server/repositories/admin-users';

export const load: PageServerLoad = async ({ cookies }) => {
	try {
		requireRole(cookies, ['admin']);
	} catch {
		throw error(403, 'Administrator role required.');
	}

	return {
		stats: getAdminStats(),
		health: getAdminHealth()
	};
};
