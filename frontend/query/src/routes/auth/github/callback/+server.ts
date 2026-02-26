/**
 * GitHub OAuth callback — exchanges code for token, resolves account.
 * Spec: Ch.18.4 | ADR 004 (7-step flow, account linking)
 */

import { redirect, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validateState, getGitHubProfile, setPendingOAuth } from '$lib/server/oauth';
import { findUserByGitHubId, findUserByEmail, linkOAuthProvider } from '$lib/server/repositories/auth';
import { createSession } from '$lib/server/session';

export const GET: RequestHandler = async ({ url, cookies, request }) => {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const oauthError = url.searchParams.get('error');

	// User cancelled or provider error
	if (oauthError) {
		redirect(303, '/login?error=oauth_cancelled');
	}

	if (!code) {
		redirect(303, '/login?error=oauth_no_code');
	}

	// CSRF check
	if (!validateState(cookies, state)) {
		redirect(303, '/login?error=oauth_state_mismatch');
	}

	let profile;
	try {
		const redirectUri = `${url.origin}/auth/github/callback`;
		profile = await getGitHubProfile(code, redirectUri);
	} catch (err) {
		console.error('GitHub OAuth error:', err);
		redirect(303, '/login?error=oauth_failed');
	}

	const userAgent = request.headers.get('user-agent') ?? undefined;

	// Step 4a: Check if user already linked via github_id
	const existingByProvider = findUserByGitHubId(profile.providerUserId);
	if (existingByProvider) {
		createSession(existingByProvider.user_id, cookies, false, userAgent);
		redirect(303, '/');
	}

	// Step 4b: Check if email matches an existing account → link
	const existingByEmail = findUserByEmail(profile.email);
	if (existingByEmail) {
		linkOAuthProvider(existingByEmail.user_id, 'github', profile.providerUserId);
		createSession(existingByEmail.user_id, cookies, false, userAgent);
		redirect(303, '/');
	}

	// Step 4c: New user → send to completion form for T&C
	setPendingOAuth(cookies, {
		provider: 'github',
		providerUserId: profile.providerUserId,
		email: profile.email,
		displayName: profile.displayName
	});
	redirect(303, '/auth/complete');
};
