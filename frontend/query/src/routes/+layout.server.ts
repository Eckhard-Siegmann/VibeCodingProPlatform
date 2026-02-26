/**
 * Root layout server — provides session user data to all pages.
 * Used by EmailConfirmBanner and other layout-level auth-aware components.
 */

import type { LayoutServerLoad } from './$types';
import { validateSession } from '$lib/server/session';

export const load: LayoutServerLoad = async ({ cookies }) => {
	const session = validateSession(cookies);

	if (!session) {
		return { user: null };
	}

	return {
		user: {
			user_id: session.user_id,
			display_name: session.display_name,
			email: session.email,
			role: session.role,
			email_confirmed: session.email_confirmed,
			audio_cues_enabled: session.audio_cues_enabled
		}
	};
};
