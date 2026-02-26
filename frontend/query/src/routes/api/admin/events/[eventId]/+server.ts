/**
 * PATCH /api/admin/events/:eventId
 * Update an event.
 * Spec: Ch.17.3 (Event Management) | Auth: Admin/Moderator
 */

import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { requireModerator, handleAuthError } from '$lib/server/auth';
import { updateEvent } from '$lib/server/repositories/admin-events';

const UpdateEventSchema = z.object({
	title: z.string().min(1).max(300).optional(),
	description: z.string().max(5000).optional(),
	partner_id: z.string().uuid().optional(),
	room_id: z.string().uuid().optional(),
	host_user_id: z.string().uuid().optional(),
	co_host_1_user_id: z.string().uuid().optional().or(z.literal('')),
	co_host_2_user_id: z.string().uuid().optional().or(z.literal('')),
	starts_at: z.string().optional(),
	planned_ends_at: z.string().optional(),
	website_url: z.string().url().optional().or(z.literal('')),
	linkedin_url: z.string().url().optional().or(z.literal('')),
	x_post_url: z.string().url().optional().or(z.literal('')),
	image_url: z.string().url().optional().or(z.literal('')),
	overbooking_factor: z.number().min(1.0).max(2.0).optional()
});

export const PATCH: RequestHandler = async ({ params, request, cookies }) => {
	try {
		requireModerator(cookies);
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

	const parsed = UpdateEventSchema.safeParse(body);
	if (!parsed.success) {
		return json(
			{ success: false, error: parsed.error.issues[0]?.message },
			{ status: 400 }
		);
	}

	try {
		const updated = updateEvent(params.eventId, parsed.data);
		if (!updated) {
			return json({ success: false, error: 'Event not found.' }, { status: 404 });
		}
		return json({ success: true });
	} catch (err: any) {
		console.error('[EVENT] Update error:', err);
		return json({ success: false, error: err.message }, { status: 500 });
	}
};
