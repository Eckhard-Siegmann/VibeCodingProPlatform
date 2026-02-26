/**
 * PATCH /api/admin/rooms/:roomId
 * Update a room.
 * Spec: Ch.17.4 (Room Management) | Auth: Admin-only
 */

import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { requireRole, handleAuthError } from '$lib/server/auth';
import { updateRoom } from '$lib/server/repositories/admin-infrastructure';

const UpdateRoomSchema = z.object({
	location_id: z.string().uuid().optional(),
	name: z.string().min(1).max(200).optional(),
	max_pax_tables: z.number().int().min(1).optional(),
	max_pax_no_tables: z.number().int().min(1).optional()
});

export const PATCH: RequestHandler = async ({ params, request, cookies }) => {
	try {
		requireRole(cookies, ['admin']);
	} catch (err) {
		const { body, status } = handleAuthError(err);
		return json(body, { status });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
	}

	const parsed = UpdateRoomSchema.safeParse(body);
	if (!parsed.success) {
		return json(
			{ success: false, error: parsed.error.issues[0]?.message },
			{ status: 400 }
		);
	}

	try {
		const updated = updateRoom(params.roomId, parsed.data);
		if (!updated) {
			return json({ success: false, error: 'Room not found.' }, { status: 404 });
		}
		return json({ success: true });
	} catch (err: any) {
		console.error('[ROOM] Update error:', err);
		return json({ success: false, error: err.message }, { status: 500 });
	}
};
