/**
 * POST /api/admin/users/[userId]/promote
 * Promote a user to moderator or admin role.
 * Spec: Ch.17.5 (Role Management), Ch.18.7 (Role Escalation)
 * Auth: Admin-only
 */

import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { requireRole, handleAuthError } from '$lib/server/auth';
import { promoteUser } from '$lib/server/repositories/admin-users';

const PromoteSchema = z.object({
	role: z.enum(['moderator', 'admin'])
});

export const POST: RequestHandler = async ({ params, request, cookies }) => {
	try {
		requireRole(cookies, ['admin']);
	} catch (err) {
		const { body, status } = handleAuthError(err);
		return json(body, { status });
	}

	const { userId } = params;

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
	}

	const parsed = PromoteSchema.safeParse(body);
	if (!parsed.success) {
		return json(
			{ success: false, error: 'Invalid payload: role must be "moderator" or "admin".' },
			{ status: 400 }
		);
	}

	const result = promoteUser(userId, parsed.data.role);

	if (!result.success) {
		return json({ success: false, error: result.error }, { status: 400 });
	}

	return json({ success: true });
};
