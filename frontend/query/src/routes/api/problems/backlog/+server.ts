/**
 * GET /api/problems/backlog
 * Paginated pending review backlog for moderator dashboard "Load More" pattern.
 * Spec: Ch.12.5, Ch.12.10, moderator_dashboard_design.md §Pending Review Backlog
 * Auth: Moderator/Admin
 */

import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { requireModerator, handleAuthError } from '$lib/server/auth';
import { getPendingReviewBacklog } from '$lib/server/repositories/problems';

const QuerySchema = z.object({
	limit: z.coerce.number().int().min(1).max(100).default(10),
	offset: z.coerce.number().int().min(0).default(0),
	type: z.string().optional().default(''),
	age: z.string().optional().default('')
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
		type: url.searchParams.get('type') ?? undefined,
		age: url.searchParams.get('age') ?? undefined
	});

	if (!parsed.success) {
		return json(
			{ success: false, error: parsed.error.issues[0]?.message },
			{ status: 400 }
		);
	}

	const { limit, offset, type, age } = parsed.data;

	const result = getPendingReviewBacklog({ limit, offset, type, age });

	return json({
		success: true,
		items: result.items,
		totalItems: result.totalItems
	});
};
