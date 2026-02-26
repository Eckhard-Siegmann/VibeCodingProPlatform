import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { emailExists } from '$lib/server/repositories/auth';

export const GET: RequestHandler = async ({ url }) => {
	const email = url.searchParams.get('email')?.trim();

	if (!email) {
		return json({ exists: false });
	}

	return json({ exists: emailExists(email) });
};
