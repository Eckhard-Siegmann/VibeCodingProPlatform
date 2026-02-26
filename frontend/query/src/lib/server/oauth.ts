/**
 * OAuth utility functions for GitHub and LinkedIn providers.
 * Spec: Ch.18.4 | ADR 004 (Authentication Providers)
 *
 * Handles state generation/validation (CSRF protection),
 * token exchange, and user profile fetching.
 */

import crypto from 'crypto';
import { env } from '$env/dynamic/private';
import type { Cookies } from '@sveltejs/kit';

const STATE_COOKIE = 'oauth_state';
const PENDING_COOKIE = 'oauth_pending';
const STATE_MAX_AGE = 600; // 10 minutes
const PENDING_MAX_AGE = 600; // 10 minutes

// ── Types ────────────────────────────────────────────────────────────

export interface OAuthProfile {
	provider: 'github' | 'linkedin';
	providerUserId: string;
	email: string;
	displayName: string;
}

export interface OAuthPendingData {
	provider: 'github' | 'linkedin';
	providerUserId: string;
	email: string;
	displayName: string;
}

// ── State (CSRF) ─────────────────────────────────────────────────────

/** Generate a random state string and set it as an HTTP-only cookie. */
export function generateState(cookies: Cookies): string {
	const state = crypto.randomBytes(32).toString('hex');
	cookies.set(STATE_COOKIE, state, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: false, // TODO: true in production
		maxAge: STATE_MAX_AGE
	});
	return state;
}

/** Validate the state parameter against the cookie. Clears cookie after check. */
export function validateState(cookies: Cookies, stateParam: string | null): boolean {
	const stored = cookies.get(STATE_COOKIE);
	cookies.delete(STATE_COOKIE, { path: '/' });
	if (!stored || !stateParam) return false;
	return stored === stateParam;
}

// ── Pending OAuth data cookie ────────────────────────────────────────

/** Store OAuth profile data for the post-OAuth completion form. */
export function setPendingOAuth(cookies: Cookies, data: OAuthPendingData): void {
	cookies.set(PENDING_COOKIE, JSON.stringify(data), {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: false, // TODO: true in production
		maxAge: PENDING_MAX_AGE
	});
}

/** Read and clear the pending OAuth data. Returns null if absent/invalid. */
export function getPendingOAuth(cookies: Cookies): OAuthPendingData | null {
	const raw = cookies.get(PENDING_COOKIE);
	if (!raw) return null;
	try {
		return JSON.parse(raw) as OAuthPendingData;
	} catch {
		return null;
	}
}

export function clearPendingOAuth(cookies: Cookies): void {
	cookies.delete(PENDING_COOKIE, { path: '/' });
}

// ── GitHub OAuth ─────────────────────────────────────────────────────

function getGitHubConfig() {
	return {
		clientId: env.GITHUB_CLIENT_ID ?? '',
		clientSecret: env.GITHUB_CLIENT_SECRET ?? ''
	};
}

/** Build the GitHub authorization URL. */
export function getGitHubAuthorizeUrl(state: string, redirectUri: string): string {
	const { clientId } = getGitHubConfig();
	const params = new URLSearchParams({
		client_id: clientId,
		redirect_uri: redirectUri,
		scope: 'read:user user:email',
		state
	});
	return `https://github.com/login/oauth/authorize?${params}`;
}

/** Exchange GitHub authorization code for access token. */
async function exchangeGitHubCode(code: string, redirectUri: string): Promise<string> {
	const { clientId, clientSecret } = getGitHubConfig();
	const res = await fetch('https://github.com/login/oauth/access_token', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json'
		},
		body: JSON.stringify({
			client_id: clientId,
			client_secret: clientSecret,
			code,
			redirect_uri: redirectUri
		})
	});
	const data = await res.json();
	if (data.error) throw new Error(`GitHub token error: ${data.error_description || data.error}`);
	return data.access_token;
}

/** Fetch GitHub user profile and primary verified email. */
export async function getGitHubProfile(code: string, redirectUri: string): Promise<OAuthProfile> {
	const token = await exchangeGitHubCode(code, redirectUri);

	// Fetch user info
	const userRes = await fetch('https://api.github.com/user', {
		headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
	});
	const user = await userRes.json();

	// Fetch emails — pick primary verified
	const emailsRes = await fetch('https://api.github.com/user/emails', {
		headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
	});
	const emails = await emailsRes.json();
	const primary = emails.find((e: any) => e.primary && e.verified) ?? emails[0];

	if (!primary?.email) throw new Error('GitHub account has no verified email');

	return {
		provider: 'github',
		providerUserId: String(user.id),
		email: primary.email,
		displayName: user.name || user.login || primary.email.split('@')[0]
	};
}

// ── LinkedIn OAuth ───────────────────────────────────────────────────

function getLinkedInConfig() {
	return {
		clientId: env.LINKEDIN_CLIENT_ID ?? '',
		clientSecret: env.LINKEDIN_CLIENT_SECRET ?? ''
	};
}

/** Build the LinkedIn authorization URL. */
export function getLinkedInAuthorizeUrl(state: string, redirectUri: string): string {
	const { clientId } = getLinkedInConfig();
	const params = new URLSearchParams({
		response_type: 'code',
		client_id: clientId,
		redirect_uri: redirectUri,
		scope: 'openid profile email',
		state
	});
	return `https://www.linkedin.com/oauth/v2/authorization?${params}`;
}

/** Exchange LinkedIn authorization code for access token. */
async function exchangeLinkedInCode(code: string, redirectUri: string): Promise<string> {
	const { clientId, clientSecret } = getLinkedInConfig();
	const params = new URLSearchParams({
		grant_type: 'authorization_code',
		code,
		redirect_uri: redirectUri,
		client_id: clientId,
		client_secret: clientSecret
	});
	const res = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: params.toString()
	});
	const data = await res.json();
	if (data.error) throw new Error(`LinkedIn token error: ${data.error_description || data.error}`);
	return data.access_token;
}

/** Fetch LinkedIn user profile via OpenID Connect userinfo endpoint. */
export async function getLinkedInProfile(code: string, redirectUri: string): Promise<OAuthProfile> {
	const token = await exchangeLinkedInCode(code, redirectUri);

	const res = await fetch('https://api.linkedin.com/v2/userinfo', {
		headers: { Authorization: `Bearer ${token}` }
	});
	const data = await res.json();

	if (!data.email) throw new Error('LinkedIn account has no email');

	return {
		provider: 'linkedin',
		providerUserId: data.sub,
		email: data.email,
		displayName: data.name || data.email.split('@')[0]
	};
}
