/**
 * Post-OAuth completion — new users accept T&C and finalize registration.
 * Spec: Ch.18.4, Ch.18.6 | ADR 004 (Post-OAuth Completion)
 */

import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { getPendingOAuth, clearPendingOAuth } from '$lib/server/oauth';
import { registerOAuthUser, emailExists } from '$lib/server/repositories/auth';
import { createSession } from '$lib/server/session';

export const load: PageServerLoad = async ({ cookies }) => {
	const pending = getPendingOAuth(cookies);
	if (!pending) {
		redirect(303, '/login?error=oauth_expired');
	}
	return {
		provider: pending.provider,
		email: pending.email,
		displayName: pending.displayName
	};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const pending = getPendingOAuth(cookies);
		if (!pending) {
			redirect(303, '/login?error=oauth_expired');
		}

		const data = await request.formData();
		const displayName = data.get('display_name')?.toString().trim() ?? pending.displayName;
		const acceptTerms = data.get('accept_terms') === 'on';
		const getInfoletter = data.get('get_infoletter') === 'on';

		// Validation
		const errors: Record<string, string> = {};

		if (!displayName || displayName.length < 2) {
			errors.display_name = 'Display name must be at least 2 characters.';
		}

		if (!acceptTerms) {
			errors.terms = 'You must accept the Terms & Conditions.';
		}

		if (Object.keys(errors).length > 0) {
			return fail(400, {
				errors,
				displayName,
				getInfoletter
			});
		}

		// Race condition: email may have been registered while user was on this page
		if (emailExists(pending.email)) {
			clearPendingOAuth(cookies);
			return fail(409, {
				error: 'This email was registered while you were completing setup.',
				displayName,
				getInfoletter
			});
		}

		// Create user
		try {
			const userId = registerOAuthUser({
				email: pending.email,
				displayName,
				provider: pending.provider,
				providerUserId: pending.providerUserId,
				acceptTerms,
				getInfoletter
			});

			clearPendingOAuth(cookies);
			const userAgent = request.headers.get('user-agent') ?? undefined;
			createSession(userId, cookies, false, userAgent);

			redirect(303, '/');
		} catch (err) {
			console.error('OAuth registration error:', err);
			return fail(500, {
				error: 'Registration failed. Please try again.',
				displayName,
				getInfoletter
			});
		}
	}
};
