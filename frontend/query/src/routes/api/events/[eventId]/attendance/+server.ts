/**
 * GET/POST /api/events/:eventId/attendance
 * Get attendee list and toggle individual attendance.
 * Spec: Ch.29.5 (Capacity Management), Ch.12.4 (Moderator Dashboard)
 * Auth: Moderator/Admin
 */

import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { requireModerator, handleAuthError } from '$lib/server/auth';
import { getEventAttendees, getEventAttendeesPaginated, setAttendance, getShowUpStats } from '$lib/server/repositories/attendance';

const ToggleAttendanceSchema = z.object({
	user_id: z.string().uuid(),
	showed_up: z.boolean()
});

const PaginatedQuerySchema = z.object({
	limit: z.coerce.number().int().min(1).max(100).default(50),
	offset: z.coerce.number().int().min(0).default(0),
	search: z.string().optional().default(''),
	mode: z.string().optional().default(''),
	status: z.string().optional().default('')
});

export const GET: RequestHandler = async ({ params, url, cookies }) => {
	try {
		requireModerator(cookies);
	} catch (err) {
		const { body, status } = handleAuthError(err);
		return json(body, { status });
	}

	// If pagination params present, use paginated query (TICKET-33 "Load More")
	const limitParam = url.searchParams.get('limit');
	if (limitParam) {
		const parsed = PaginatedQuerySchema.safeParse({
			limit: url.searchParams.get('limit') ?? undefined,
			offset: url.searchParams.get('offset') ?? undefined,
			search: url.searchParams.get('search') ?? undefined,
			mode: url.searchParams.get('mode') ?? undefined,
			status: url.searchParams.get('status') ?? undefined
		});

		if (!parsed.success) {
			return json(
				{ success: false, error: parsed.error.issues[0]?.message },
				{ status: 400 }
			);
		}

		const result = getEventAttendeesPaginated({
			eventId: params.eventId,
			search: parsed.data.search,
			mode: parsed.data.mode,
			status: parsed.data.status,
			limit: parsed.data.limit,
			offset: parsed.data.offset
		});

		return json({ success: true, items: result.items, totalItems: result.totalItems });
	}

	// Legacy: return all attendees (used by CSV export and mark-all refresh)
	const attendees = getEventAttendees(params.eventId);
	const stats = getShowUpStats(params.eventId);
	return json({ success: true, attendees, stats });
};

export const POST: RequestHandler = async ({ params, request, cookies }) => {
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

	const parsed = ToggleAttendanceSchema.safeParse(body);
	if (!parsed.success) {
		return json(
			{ success: false, error: parsed.error.issues[0]?.message },
			{ status: 400 }
		);
	}

	try {
		setAttendance(params.eventId, parsed.data.user_id, parsed.data.showed_up);
		const stats = getShowUpStats(params.eventId);
		return json({ success: true, stats });
	} catch (err: any) {
		console.error('[ATTENDANCE] Toggle error:', err);
		return json({ success: false, error: err.message }, { status: 500 });
	}
};
