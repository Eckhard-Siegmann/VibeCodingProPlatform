/**
 * Authentication utilities — session-based identity and role checks.
 * Spec: Ch. 18 | ADR 007 (sessions)
 *
 * getAuthenticatedUser() now validates against real database sessions.
 * Falls back to demo user when no session cookie is present (development mode).
 *
 * getApiKeyUser() validates Bearer tokens for agent (bot) authentication (Ch.18.8.2).
 */

import type { Cookies } from '@sveltejs/kit';
import { getDatabase } from './db';
import { getEffectiveRole } from './repositories/teams';
import { validateSession, type SessionUser } from './session';
import { validateBearerToken } from './repositories/api-keys';

// ── Types ───────────────────────────────────────────────────────────

export interface AuthenticatedUser {
	user_id: string;
	email: string;
	display_name: string;
}

/**
 * Structured auth error with HTTP status code.
 * API routes catch this to return the correct status.
 */
export class AuthError extends Error {
	constructor(
		message: string,
		public status: 401 | 403
	) {
		super(message);
		this.name = 'AuthError';
	}
}

// ── Identity ────────────────────────────────────────────────────────

/**
 * Get authenticated user from session cookie.
 * Falls back to demo user if no session exists (development convenience).
 * Role is NOT included — role is contextual per Ch. 18.7.
 */
export function getAuthenticatedUser(cookies?: Cookies): AuthenticatedUser {
	if (cookies) {
		const session = validateSession(cookies);
		if (session) {
			return {
				user_id: session.user_id,
				email: session.email,
				display_name: session.display_name
			};
		}
	}

	// Fallback: demo user for development (no session cookie)
	return {
		user_id: 'demo-user-001',
		email: 'max.mustermann@startplatz.de',
		display_name: 'Max Mustermann'
	};
}

/**
 * Get session user with full auth fields (including email_confirmed, role).
 * Returns null if not authenticated via session.
 */
export function getSessionUser(cookies: Cookies): SessionUser | null {
	return validateSession(cookies);
}

/**
 * Require valid authentication. Throws AuthError(401) if not authenticated.
 */
export function requireAuthenticated(cookies?: Cookies): AuthenticatedUser {
	const user = getAuthenticatedUser(cookies);
	if (!user) throw new AuthError('Unauthorized', 401);
	return user;
}

// ── Role checks ─────────────────────────────────────────────────────

/**
 * Require the authenticated user to hold one of the specified roles.
 * Throws AuthError(401) if not authenticated.
 * Throws AuthError(403) if user lacks required role.
 */
export function requireRole(
	cookies: Cookies,
	requiredRoles: string[]
): AuthenticatedUser {
	const user = requireAuthenticated(cookies);

	const db = getDatabase();
	const row = db.prepare('SELECT role FROM users WHERE user_id = ?').get(user.user_id) as
		| { role: string }
		| undefined;

	if (!row || !requiredRoles.includes(row.role)) {
		throw new AuthError(
			`Forbidden: ${requiredRoles.join(' or ')} role required`,
			403
		);
	}
	return user;
}

/**
 * Require moderator or admin role.
 * Convenience wrapper around requireRole().
 */
export function requireModerator(cookies?: Cookies): AuthenticatedUser {
	return requireRole(cookies!, ['moderator', 'admin']);
}

/**
 * Require moderator role AND enforce objectivity constraint (Ch.18 §18.14.4).
 * A moderator who is a team member (coder) on the target problem cannot
 * make binding decisions for that problem.
 *
 * Throws AuthError(403) if the objectivity constraint is violated.
 */
export function requireModeratorForProblem(
	cookies: Cookies,
	problemId: string
): AuthenticatedUser {
	const user = requireModerator(cookies);

	const effective = getEffectiveRole(problemId, user.user_id);
	if (effective.is_team_member && effective.member_role === 'coder') {
		throw new AuthError(
			'Forbidden: objectivity constraint — moderator is a team member on this problem',
			403
		);
	}
	return user;
}

// ── Agent / Bearer token auth ────────────────────────────────────────

/**
 * Authenticate an agent via Bearer token in the Authorization header.
 * Returns the bot user's AuthenticatedUser if the token is valid and active.
 * Returns null if header is absent or token is invalid/revoked/expired.
 *
 * Spec: Ch.18.8.2 (Bearer Token Validation Flow), Ch.19.3.42
 */
export function getApiKeyUser(request: Request): AuthenticatedUser | null {
	const authHeader = request.headers.get('authorization');
	if (!authHeader?.startsWith('Bearer ')) return null;

	const rawToken = authHeader.slice('Bearer '.length);
	const result = validateBearerToken(rawToken);
	if (!result) return null;

	return {
		user_id: result.bot_user_id,
		email: '', // agents have no email (Ch.18.8.3)
		display_name: result.display_name
	};
}

// ── Helpers ─────────────────────────────────────────────────────────

/**
 * Standard error handler for API routes.
 * Converts AuthError to appropriate HTTP response, passes others as 500.
 */
export function handleAuthError(error: any): { body: object; status: number } {
	if (error instanceof AuthError) {
		return {
			body: { success: false, error: error.message },
			status: error.status
		};
	}
	if (error.message === 'Unauthorized') {
		return { body: { success: false, error: 'Unauthorized' }, status: 401 };
	}
	if (error.message?.startsWith('Forbidden')) {
		return { body: { success: false, error: error.message }, status: 403 };
	}
	return { body: { success: false, error: error.message }, status: 500 };
}

// Check if user is the Problem Owner for a specific problem
export function isProblemOwner(userId: string, problemCreatedByUserId: string): boolean {
	return userId === problemCreatedByUserId;
}

// Check if user is the Deputy Problem Owner
export function isDeputyOwner(userId: string, deputyOwnerUserId: string | null): boolean {
	return deputyOwnerUserId !== null && userId === deputyOwnerUserId;
}

// Check if user has elevated rights (PO or Deputy) on a problem
export function hasElevatedRights(
	userId: string,
	problemCreatedByUserId: string,
	deputyOwnerUserId: string | null
): boolean {
	return isProblemOwner(userId, problemCreatedByUserId) || isDeputyOwner(userId, deputyOwnerUserId);
}

// Check if user can access private view for a problem (PO or Deputy)
export function canAccessPrivateView(
	cookies: Cookies,
	problemCreatedByUserId: string,
	deputyOwnerUserId: string | null = null
): boolean {
	const user = getAuthenticatedUser(cookies);
	return hasElevatedRights(user.user_id, problemCreatedByUserId, deputyOwnerUserId);
}
