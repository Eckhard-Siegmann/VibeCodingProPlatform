import type { Actions } from './$types';
import { redirect } from '@sveltejs/kit';
import { destroySession } from '$lib/server/session';

export const actions: Actions = {
	default: async ({ cookies }) => {
		destroySession(cookies);
		redirect(303, '/login');
	}
};
