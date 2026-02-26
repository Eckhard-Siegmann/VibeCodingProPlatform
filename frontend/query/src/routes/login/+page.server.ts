import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { verifyCredentials } from '$lib/server/repositories/auth';
import { createSession } from '$lib/server/session';

const OAUTH_ERRORS: Record<string, string> = {
	oauth_cancelled: 'Authentication was cancelled. Please try again.',
	oauth_no_code: 'Authentication failed — no authorization code received.',
	oauth_state_mismatch: 'Authentication failed — security check failed. Please try again.',
	oauth_failed: 'Authentication with the provider failed. Please try again.',
	oauth_expired: 'OAuth session expired. Please try again.'
};

export const load: PageServerLoad = async ({ url }) => {
	const oauthError = url.searchParams.get('error');
	return {
		redirect: url.searchParams.get('redirect') ?? '/',
		oauthError: oauthError ? OAUTH_ERRORS[oauthError] ?? null : null
	};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const email = data.get('email')?.toString().trim() ?? '';
		const password = data.get('password')?.toString() ?? '';
		const rememberMe = data.get('remember') === 'on';
		const redirectTo = data.get('redirect')?.toString() ?? '/';

		// Basic validation
		if (!email || !password) {
			return fail(400, {
				error: 'Email and password are required.',
				email
			});
		}

		// Verify credentials
		const result = await verifyCredentials(email, password);

		if (!result.success) {
			return fail(401, {
				error: result.error,
				email,
				otpPending: result.otpPending
			});
		}

		// Create session
		const userAgent = request.headers.get('user-agent') ?? undefined;
		createSession(result.userId!, cookies, rememberMe, userAgent);

		redirect(303, redirectTo);
	}
};
