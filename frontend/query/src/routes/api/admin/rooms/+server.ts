/**
 * GET/POST /api/admin/rooms
 * List and create rooms.
 * Spec: Ch.17.4 (Room Management) | Auth: Admin-only
 */

import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { requireRole, handleAuthError } from '$lib/server/auth';
import { listRooms, createRoom } from '$lib/server/repositories/admin-infrastructure';

const CreateRoomSchema = z.object({
	location_id: z.string().uuid(),
	name: z.string().min(1).max(200),
	max_pax_tables: z.number().int().min(1),
	max_pax_no_tables: z.number().int().min(1)
});

export const GET: RequestHandler = async ({ cookies }) => {
	try {
		requireRole(cookies, ['admin']);
	} catch (err) {
		const { body, status } = handleAuthError(err);
		return json(body, { status });
	}

	const rooms = listRooms();
	return json({ success: true, rooms });
};

export const POST: RequestHandler = async ({ request, cookies }) => {
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

	const parsed = CreateRoomSchema.safeParse(body);
	if (!parsed.success) {
		return json(
			{ success: false, error: parsed.error.issues[0]?.message },
			{ status: 400 }
		);
	}

	try {
		const roomId = createRoom(parsed.data);
		return json({ success: true, room_id: roomId }, { status: 201 });
	} catch (err: any) {
		console.error('[ROOM] Create error:', err);
		return json({ success: false, error: err.message }, { status: 500 });
	}
};
