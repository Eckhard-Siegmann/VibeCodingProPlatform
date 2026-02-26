/**
 * Activity feed pagination API.
 * Ticket: TICKET-36 | Spec: Ch.12.10, dashboard_design.md v1.1.0
 *
 * GET /api/dashboard/activity?offset=10&limit=10
 * Returns next batch of activity items for "Load More" append pagination.
 * Max 50 items total (server-side cap).
 * Timeframe: last 7 days.
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { z } from 'zod';
import { getAuthenticatedUser } from '$lib/server/auth';
import { getUserActivityFeed } from '$lib/server/repositories/dashboard';

const MAX_TOTAL = 50;

const QuerySchema = z.object({
	limit: z.coerce.number().int().min(1).max(100).default(10),
	offset: z.coerce.number().int().min(0).default(0)
});

export const GET: RequestHandler = async ({ url, cookies }) => {
	const user = getAuthenticatedUser(cookies);
	if (!user || user.user_id === 'demo-user-001') {
		// In dev mode, allow demo user fallback
	}

	const parsed = QuerySchema.safeParse({
		limit: url.searchParams.get('limit') ?? undefined,
		offset: url.searchParams.get('offset') ?? undefined
	});

	if (!parsed.success) {
		return json(
			{ items: [], totalCount: 0, error: parsed.error.issues[0]?.message },
			{ status: 400 }
		);
	}

	const { limit, offset } = parsed.data;

	// Server-side cap: never return items beyond position 50
	const effectiveLimit = Math.min(limit, MAX_TOTAL - offset);
	if (effectiveLimit <= 0) {
		return json({ items: [], totalCount: 0 });
	}

	const result = getUserActivityFeed(user.user_id, effectiveLimit, offset);

	return json({
		items: result.items,
		totalCount: Math.min(result.totalCount, MAX_TOTAL)
	});
};
