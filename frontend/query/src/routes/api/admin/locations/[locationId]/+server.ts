/**
 * PATCH /api/admin/locations/:locationId
 * Update a location.
 * Spec: Ch.17.4 (Location Management) | Auth: Admin-only
 */

import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { requireRole, handleAuthError } from '$lib/server/auth';
import { updateLocation } from '$lib/server/repositories/admin-infrastructure';

const UpdateLocationSchema = z.object({
	name: z.string().min(1).max(200).optional(),
	address: z.string().min(1).max(500).optional(),
	city: z.string().min(1).max(100).optional()
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

	const parsed = UpdateLocationSchema.safeParse(body);
	if (!parsed.success) {
		return json(
			{ success: false, error: parsed.error.issues[0]?.message },
			{ status: 400 }
		);
	}

	try {
		const updated = updateLocation(params.locationId, parsed.data);
		if (!updated) {
			return json({ success: false, error: 'Location not found.' }, { status: 404 });
		}
		return json({ success: true });
	} catch (err: any) {
		console.error('[LOCATION] Update error:', err);
		return json({ success: false, error: err.message }, { status: 500 });
	}
};
