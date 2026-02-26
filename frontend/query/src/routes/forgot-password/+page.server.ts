import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { generatePasswordResetOtp, findUserByEmail } from '$lib/server/repositories/auth';
import { sendPasswordResetEmail } from '$lib/server/email';

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const email = data.get('email')?.toString().trim() ?? '';

		if (!email) {
			return fail(400, { error: 'Email is required.', email });
		}

		// Generate OTP (returns null if email not found — but we don't reveal that)
		const otp = await generatePasswordResetOtp(email);

		// Send OTP via email (ADR 005: Brevo in prod, console in dev)
		if (otp) {
			// Look up display name for personalization (best-effort)
			const user = findUserByEmail(email);
			await sendPasswordResetEmail(email, user?.display_name ?? '', otp);
		}

		// Always show success (prevent email enumeration)
		return { success: true, email };
	}
};
