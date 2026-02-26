import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { setPasswordWithOtp, validatePassword } from '$lib/server/repositories/auth';
import { destroyAllSessions, createSession } from '$lib/server/session';

export const load: PageServerLoad = async ({ url }) => {
	return {
		email: url.searchParams.get('email') ?? ''
	};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const email = data.get('email')?.toString().trim() ?? '';
		const otp = data.get('otp')?.toString().trim() ?? '';
		const newPassword = data.get('new_password')?.toString() ?? '';
		const confirmPassword = data.get('confirm_password')?.toString() ?? '';

		// Validation
		if (!email || !otp) {
			return fail(400, {
				error: 'Email and one-time password are required.',
				email
			});
		}

		if (newPassword !== confirmPassword) {
			return fail(400, {
				error: 'Passwords do not match.',
				email,
				field: 'confirm_password'
			});
		}

		const pwValidation = validatePassword(newPassword);
		if (!pwValidation.valid) {
			return fail(400, {
				error: pwValidation.errors[0],
				email,
				field: 'new_password'
			});
		}

		// Set password
		const result = await setPasswordWithOtp(email, otp, newPassword);

		if (!result.success) {
			return fail(401, {
				error: result.error,
				email
			});
		}

		// Clear all old sessions, create new one
		destroyAllSessions(result.userId!);
		const userAgent = request.headers.get('user-agent') ?? undefined;
		createSession(result.userId!, cookies, false, userAgent);

		redirect(303, '/');
	}
};
