import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { registerLocalUser, emailExists, validatePassword } from '$lib/server/repositories/auth';
import { createSession } from '$lib/server/session';
import { sendConfirmationEmail } from '$lib/server/email';

export const load: PageServerLoad = async ({ url }) => {
	return {
		redirect: url.searchParams.get('redirect') ?? '/'
	};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const displayName = data.get('display_name')?.toString().trim() ?? '';
		const email = data.get('email')?.toString().trim() ?? '';
		const password = data.get('password')?.toString() ?? '';
		const acceptTerms = data.get('accept_terms') === 'on';
		const getInfoletter = data.get('get_infoletter') === 'on';
		const redirectTo = data.get('redirect')?.toString() ?? '/';

		// Validation
		const errors: Record<string, string> = {};

		if (!displayName || displayName.length < 2) {
			errors.display_name = 'Display name must be at least 2 characters.';
		}

		if (!email) {
			errors.email = 'Email is required.';
		} else if (emailExists(email)) {
			errors.email = 'This email is already registered.';
		}

		const pwValidation = validatePassword(password);
		if (!pwValidation.valid) {
			errors.password = pwValidation.errors[0];
		}

		if (!acceptTerms) {
			errors.terms = 'You must accept the Terms & Conditions.';
		}

		if (Object.keys(errors).length > 0) {
			return fail(400, {
				errors,
				displayName,
				email,
				getInfoletter
			});
		}

		// Create user
		try {
			const { userId, confirmationHash } = await registerLocalUser({
				email,
				displayName,
				password,
				acceptTerms,
				getInfoletter
			});

			// Send confirmation email (ADR 005: Brevo in prod, console in dev)
			await sendConfirmationEmail(email, displayName, confirmationHash);

			// Create session — user can log in immediately (login_enabled = TRUE)
			const userAgent = request.headers.get('user-agent') ?? undefined;
			createSession(userId, cookies, false, userAgent);

			// Redirect to confirmation pending page
			redirect(303, `/register/success?email=${encodeURIComponent(email)}`);
		} catch (err) {
			return fail(500, {
				error: 'Registration failed. Please try again.',
				displayName,
				email,
				getInfoletter
			});
		}
	}
};
