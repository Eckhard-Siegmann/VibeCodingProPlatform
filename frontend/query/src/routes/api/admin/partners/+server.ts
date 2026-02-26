/**
 * GET/POST /api/admin/partners
 * List and create partner organizations.
 * Spec: Ch.17.4 (Partner Management) | Auth: Admin-only
 */

import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { requireRole, handleAuthError } from '$lib/server/auth';
import { listPartners, createPartner } from '$lib/server/repositories/admin-infrastructure';

const CreatePartnerSchema = z.object({
	name: z.string().min(1).max(200),
	partner_type: z.enum(['coworking', 'university', 'company', 'community']),
	logo_url: z.string().url().optional().or(z.literal('')),
	website_url: z.string().url().optional().or(z.literal('')),
	contact_name: z.string().max(200).optional(),
	contact_email: z.string().email().optional().or(z.literal('')),
	description: z.string().max(2000).optional()
});

export const GET: RequestHandler = async ({ cookies }) => {
	try {
		requireRole(cookies, ['admin']);
	} catch (err) {
		const { body, status } = handleAuthError(err);
		return json(body, { status });
	}

	const partners = listPartners();
	return json({ success: true, partners });
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

	const parsed = CreatePartnerSchema.safeParse(body);
	if (!parsed.success) {
		return json(
			{ success: false, error: parsed.error.issues[0]?.message },
			{ status: 400 }
		);
	}

	try {
		const partnerId = createPartner(parsed.data);
		return json({ success: true, partner_id: partnerId }, { status: 201 });
	} catch (err: any) {
		console.error('[PARTNER] Create error:', err);
		return json({ success: false, error: err.message }, { status: 500 });
	}
};
