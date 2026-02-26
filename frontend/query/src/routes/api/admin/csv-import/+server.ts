/**
 * POST /api/admin/csv-import
 * Bulk-import users from CSV rows.
 * Spec: Ch.17.5 (CSV Import), Ch.30.4 (Import Logic)
 * Auth: Admin-only
 */

import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { requireRole, handleAuthError } from '$lib/server/auth';
import { importCsvUsers } from '$lib/server/repositories/admin-users';
import { sendOnboardingOtpEmail } from '$lib/server/email';

const CsvRowSchema = z.object({
	email: z.string().min(1),
	display_name: z.string().min(1),
	event_slug: z.string().optional(),
	in_presence: z.boolean().optional()
});

const ImportPayloadSchema = z.object({
	rows: z.array(CsvRowSchema).min(1).max(500)
});

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

	const parsed = ImportPayloadSchema.safeParse(body);
	if (!parsed.success) {
		return json(
			{ success: false, error: 'Invalid payload: ' + parsed.error.issues[0]?.message },
			{ status: 400 }
		);
	}

	try {
		const result = await importCsvUsers(parsed.data.rows);

		// Send onboarding OTP emails (ADR 005: Brevo in prod, console in dev)
		for (const { email, otp, displayName } of result.otpUsers) {
			await sendOnboardingOtpEmail(email, displayName, otp);
		}

		return json({
			success: true,
			total: result.total,
			created: result.created,
			existing: result.existing,
			registered: result.registered,
			errors: result.errors
		});
	} catch (err) {
		console.error('[CSV-IMPORT] Error:', err);
		return json({ success: false, error: 'Import failed due to a server error.' }, { status: 500 });
	}
};
