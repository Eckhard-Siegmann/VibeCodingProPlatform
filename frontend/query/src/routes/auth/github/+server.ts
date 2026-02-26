/**
 * GitHub OAuth initiation — redirects user to GitHub authorization page.
 * Spec: Ch.18.4 | ADR 004
 */

import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateState, getGitHubAuthorizeUrl } from '$lib/server/oauth';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const state = generateState(cookies);
	const redirectUri = `${url.origin}/auth/github/callback`;
	const authorizeUrl = getGitHubAuthorizeUrl(state, redirectUri);

	redirect(302, authorizeUrl);
};
