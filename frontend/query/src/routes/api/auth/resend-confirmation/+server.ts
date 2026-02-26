/**
 * Resend email confirmation link.
 * Spec: Ch.18.5, auth_pages_design.md
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAuthenticatedUser } from '$lib/server/auth';
import { regenerateConfirmationHash } from '$lib/server/repositories/auth';
import { sendConfirmationEmail } from '$lib/server/email';

export const POST: RequestHandler = async ({ cookies }) => {
	const user = getAuthenticatedUser(cookies);
	if (!user) {
		throw error(401, 'Authentication required');
	}

	const hash = regenerateConfirmationHash(user.user_id);
	if (!hash) {
		// Already confirmed or user not found
		return json({ success: true, message: 'Email already confirmed.' });
	}

	// Send confirmation email (ADR 005: Brevo in prod, console in dev)
	await sendConfirmationEmail(user.email, user.display_name, hash);

	return json({ success: true });
};
