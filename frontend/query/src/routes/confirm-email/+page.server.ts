import type { PageServerLoad, Actions } from './$types';
import { confirmEmail, regenerateConfirmationHash, findUserById } from '$lib/server/repositories/auth';
import { sendConfirmationEmail } from '$lib/server/email';
import { validateSession } from '$lib/server/session';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url }) => {
	const hash = url.searchParams.get('hash');

	if (!hash) {
		return { status: 'invalid' as const };
	}

	const result = confirmEmail(hash);
	return { status: result.status };
};

export const actions: Actions = {
	resend: async ({ cookies }) => {
		const session = validateSession(cookies);
		if (!session) {
			return fail(401, { error: 'You must be logged in to resend confirmation.' });
		}

		const hash = regenerateConfirmationHash(session.user_id);
		if (!hash) {
			return fail(400, { error: 'Email is already confirmed.' });
		}

		// Send confirmation email (ADR 005: Brevo in prod, console in dev)
		const user = findUserById(session.user_id);
		if (user) {
			await sendConfirmationEmail(user.email, user.display_name, hash);
		}

		return { resent: true };
	}
};
