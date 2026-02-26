/**
 * GET/POST /api/admin/locations
 * List and create locations.
 * Spec: Ch.17.4 (Location Management) | Auth: Admin-only
 */

import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { requireRole, handleAuthError } from '$lib/server/auth';
import { listLocations, createLocation } from '$lib/server/repositories/admin-infrastructure';

const CreateLocationSchema = z.object({
	name: z.string().min(1).max(200),
	address: z.string().min(1).max(500),
	city: z.string().min(1).max(100)
});

export const GET: RequestHandler = async ({ cookies }) => {
	try {
		requireRole(cookies, ['admin']);
	} catch (err) {
		const { body, status } = handleAuthError(err);
		return json(body, { status });
	}

	const locations = listLocations();
	return json({ success: true, locations });
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

	const parsed = CreateLocationSchema.safeParse(body);
	if (!parsed.success) {
		return json(
			{ success: false, error: parsed.error.issues[0]?.message },
			{ status: 400 }
		);
	}

	try {
		const locationId = createLocation(parsed.data);
		return json({ success: true, location_id: locationId }, { status: 201 });
	} catch (err: any) {
		console.error('[LOCATION] Create error:', err);
		return json({ success: false, error: err.message }, { status: 500 });
	}
};
