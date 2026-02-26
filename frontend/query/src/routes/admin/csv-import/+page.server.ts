/**
 * Admin CSV Import page server loader.
 * Loads available events for the event_slug dropdown.
 * Spec: Ch.17.5 | Auth: Admin-only
 */

import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { requireRole } from '$lib/server/auth';
import { getDatabase } from '$lib/server/db';

export const load: PageServerLoad = async ({ cookies }) => {
	try {
		requireRole(cookies, ['admin']);
	} catch {
		throw error(403, 'Administrator role required.');
	}

	const db = getDatabase();
	const events = db.prepare(`
		SELECT slug AS event_slug, title
		FROM events
		ORDER BY starts_at DESC
		LIMIT 50
	`).all() as Array<{ event_slug: string; title: string }>;

	return { events };
};
