/**
 * PATCH /api/admin/partners/:partnerId
 * Update a partner organization.
 * Spec: Ch.17.4 (Partner Management) | Auth: Admin-only
 */

import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { requireRole, handleAuthError } from '$lib/server/auth';
import { updatePartner } from '$lib/server/repositories/admin-infrastructure';

const UpdatePartnerSchema = z.object({
	name: z.string().min(1).max(200).optional(),
	partner_type: z.enum(['coworking', 'university', 'company', 'community']).optional(),
	logo_url: z.string().url().optional().or(z.literal('')),
	website_url: z.string().url().optional().or(z.literal('')),
	contact_name: z.string().max(200).optional(),
	contact_email: z.string().email().optional().or(z.literal('')),
	description: z.string().max(2000).optional()
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

	const parsed = UpdatePartnerSchema.safeParse(body);
	if (!parsed.success) {
		return json(
			{ success: false, error: parsed.error.issues[0]?.message },
			{ status: 400 }
		);
	}

	try {
		const updated = updatePartner(params.partnerId, parsed.data);
		if (!updated) {
			return json({ success: false, error: 'Partner not found.' }, { status: 404 });
		}
		return json({ success: true });
	} catch (err: any) {
		console.error('[PARTNER] Update error:', err);
		return json({ success: false, error: err.message }, { status: 500 });
	}
};
