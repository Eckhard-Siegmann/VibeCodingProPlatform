/**
 * GET /api/events/:eventId/available-problems
 * Paginated available backlog problems for queue planning.
 * Spec: Ch.12.5, Ch.12.10, queue_planning_design.md
 * Auth: Moderator/Admin
 */

import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { requireModerator, handleAuthError } from '$lib/server/auth';
import { getAvailableBacklog } from '$lib/server/repositories/queue';

const QuerySchema = z.object({
	limit: z.coerce.number().int().min(1).max(100).default(20),
	offset: z.coerce.number().int().min(0).default(0),
	search: z.string().optional().default(''),
	type: z.string().optional().default('')
});

export const GET: RequestHandler = async ({ url, cookies }) => {
	try {
		requireModerator(cookies);
	} catch (err) {
		const { body, status } = handleAuthError(err);
		return json(body, { status });
	}

	const parsed = QuerySchema.safeParse({
		limit: url.searchParams.get('limit') ?? undefined,
		offset: url.searchParams.get('offset') ?? undefined,
		search: url.searchParams.get('search') ?? undefined,
		type: url.searchParams.get('type') ?? undefined
	});

	if (!parsed.success) {
		return json(
			{ success: false, error: parsed.error.issues[0]?.message },
			{ status: 400 }
		);
	}

	const { limit, offset, search, type } = parsed.data;

	const result = getAvailableBacklog({
		search: search || undefined,
		problemType: type || undefined,
		limit,
		offset
	});

	return json({ items: result.items, totalItems: result.totalItems });
};
