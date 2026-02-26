/**
 * Account Settings page server loader and form actions.
 * Spec: Ch.18.2 (Password Policy), Ch.18.9 (Session), Ch.30.6 (Newsletter), Ch.30.10
 *       Ch.18.8.1–18.8.3 (API key management), Ch.19.3.42 (api_keys)
 * Page design: frontend/pagedesign/account_settings_design.md
 * Auth: Authenticated users only.
 */

import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { validateSession, destroyAllSessions, createSession } from '$lib/server/session';
import {
	findUserById,
	changePassword,
	validatePassword,
	setNewsletterPreference,
	getNewsletterPreference,
	setAudioCuesPreference,
	getAudioCuesPreference
} from '$lib/server/repositories/auth';
import { listApiKeys, createApiKey, revokeApiKey } from '$lib/server/repositories/api-keys';

export const load: PageServerLoad = async ({ cookies }) => {
	const session = validateSession(cookies);
	if (!session) {
		throw redirect(303, '/login?redirect=/account');
	}

	const user = findUserById(session.user_id);
	if (!user) {
		throw redirect(303, '/login');
	}

	return {
		displayName: user.display_name,
		email: user.email,
		emailConfirmed: !!user.email_confirmed,
		authProvider: 'local', // TODO: expose auth_provider from users table when needed
		getInfoletter: getNewsletterPreference(session.user_id) ?? false,
		audioCuesEnabled: getAudioCuesPreference(session.user_id) ?? false,
		apiKeys: listApiKeys(session.user_id)
	};
};

export const actions: Actions = {
	changePassword: async ({ request, cookies }) => {
		const session = validateSession(cookies);
		if (!session) {
			return fail(401, { error: 'Not authenticated.' });
		}

		const data = await request.formData();
		const currentPassword = data.get('current_password')?.toString() ?? '';
		const newPassword = data.get('new_password')?.toString() ?? '';
		const confirmPassword = data.get('confirm_password')?.toString() ?? '';

		if (!currentPassword || !newPassword || !confirmPassword) {
			return fail(400, { passwordError: 'All password fields are required.' });
		}

		if (newPassword !== confirmPassword) {
			return fail(400, { passwordError: 'New passwords do not match.' });
		}

		const pwValidation = validatePassword(newPassword);
		if (!pwValidation.valid) {
			return fail(400, { passwordError: pwValidation.errors[0] });
		}

		const result = await changePassword(session.user_id, currentPassword, newPassword);

		if (!result.success) {
			return fail(400, { passwordError: result.error });
		}

		// Destroy all sessions (force re-auth on all devices) per Ch.18.9
		destroyAllSessions(session.user_id);

		// Create a fresh session for the current device
		const userAgent = request.headers.get('user-agent') ?? undefined;
		createSession(session.user_id, cookies, false, userAgent);

		return { passwordSuccess: true };
	},

	saveNotifications: async ({ request, cookies }) => {
		const session = validateSession(cookies);
		if (!session) {
			return fail(401, { error: 'Not authenticated.' });
		}

		const data = await request.formData();
		const subscribe = data.get('get_infoletter') === 'on';
		const audioCues = data.get('audio_cues_enabled') === 'on';

		setNewsletterPreference(session.user_id, subscribe);
		setAudioCuesPreference(session.user_id, audioCues);

		return { notificationsSuccess: true };
	},

	/**
	 * Generate a new API key and auto-provision a bot user (B1, B4).
	 * Returns the plaintext key once — the UI must display it immediately.
	 */
	generateKey: async ({ request, cookies }) => {
		const session = validateSession(cookies);
		if (!session) {
			return fail(401, { error: 'Not authenticated.' });
		}

		const user = findUserById(session.user_id);
		if (!user) {
			return fail(401, { error: 'Not authenticated.' });
		}

		const data = await request.formData();
		const label = data.get('label')?.toString().trim() || undefined;

		try {
			const result = createApiKey(session.user_id, user.display_name, label);
			return {
				keyCreated: true,
				newKey: result.plaintext_key,
				displayPrefix: result.display_prefix
			};
		} catch {
			return fail(500, { keyError: 'Failed to generate API key. Please try again.' });
		}
	},

	/**
	 * Revoke an active API key (B2).
	 * The caller must own the key.
	 */
	revokeKey: async ({ request, cookies }) => {
		const session = validateSession(cookies);
		if (!session) {
			return fail(401, { error: 'Not authenticated.' });
		}

		const data = await request.formData();
		const keyId = data.get('api_key_id')?.toString() ?? '';

		if (!keyId) {
			return fail(400, { keyError: 'Missing API key ID.' });
		}

		const revoked = revokeApiKey(keyId, session.user_id);
		if (!revoked) {
			return fail(404, { keyError: 'API key not found or already revoked.' });
		}

		return { keyRevoked: true };
	}
};
