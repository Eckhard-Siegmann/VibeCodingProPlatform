/**
 * GET/POST /api/admin/events
 * List and create events.
 * Spec: Ch.17.3 (Event Management) | Auth: Admin/Moderator
 */

import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { requireModerator, handleAuthError } from '$lib/server/auth';
import { listEventsForAdmin, createEvent } from '$lib/server/repositories/admin-events';

const CreateEventSchema = z.object({
	title: z.string().min(1).max(300),
	description: z.string().max(5000).optional(),
	partner_id: z.string().uuid(),
	room_id: z.string().uuid(),
	host_user_id: z.string().uuid(),
	co_host_1_user_id: z.string().uuid().optional().or(z.literal('')),
	co_host_2_user_id: z.string().uuid().optional().or(z.literal('')),
	starts_at: z.string().min(1),
	planned_ends_at: z.string().min(1),
	website_url: z.string().url().optional().or(z.literal('')),
	linkedin_url: z.string().url().optional().or(z.literal('')),
	x_post_url: z.string().url().optional().or(z.literal('')),
	image_url: z.string().url().optional().or(z.literal('')),
	overbooking_factor: z.number().min(1.0).max(2.0).optional()
});

export const GET: RequestHandler = async ({ cookies }) => {
	try {
		requireModerator(cookies);
	} catch (err) {
		const { body, status } = handleAuthError(err);
		return json(body, { status });
	}

	const events = listEventsForAdmin();
	return json({ success: true, events });
};

export const POST: RequestHandler = async ({ request, cookies }) => {
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

	const parsed = CreateEventSchema.safeParse(body);
	if (!parsed.success) {
		return json(
			{ success: false, error: parsed.error.issues[0]?.message },
			{ status: 400 }
		);
	}

	try {
		// Clean empty strings to undefined
		const data = {
			...parsed.data,
			co_host_1_user_id: parsed.data.co_host_1_user_id || undefined,
			co_host_2_user_id: parsed.data.co_host_2_user_id || undefined,
			website_url: parsed.data.website_url || undefined,
			linkedin_url: parsed.data.linkedin_url || undefined,
			x_post_url: parsed.data.x_post_url || undefined,
			image_url: parsed.data.image_url || undefined
		};
		const eventId = createEvent(data);
		return json({ success: true, event_id: eventId }, { status: 201 });
	} catch (err: any) {
		console.error('[EVENT] Create error:', err);
		return json({ success: false, error: err.message }, { status: 500 });
	}
};
