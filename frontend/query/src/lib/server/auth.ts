// MVP: Hardcoded authenticated user
// TODO: Replace with real session-based authentication

import { getDatabase } from './db';
import { getEffectiveRole } from './repositories/teams';

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

// User identity only - NO role attribute!
// Role is contextual: determined by relationship to the resource being accessed
export function getAuthenticatedUser(cookies?: any): AuthenticatedUser {
	return {
		user_id: 'demo-user-001',
		email: 'max.mustermann@startplatz.de',
		display_name: 'Max Mustermann'
		// NOTE: No role here! Role depends on context:
		// - Accessing own problem → role = 'problem_owner'
		// - Submitting assessment → role selected in form (developer/observer/problem_owner)
		// - Moderator actions → checked via users.role in DB
	};
}

/**
 * Require valid authentication. Throws AuthError(401) if not authenticated.
 */
export function requireAuthenticated(cookies?: any): AuthenticatedUser {
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
	cookies: any,
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
export function requireModerator(cookies?: any): AuthenticatedUser {
	return requireRole(cookies, ['moderator', 'admin']);
}

/**
 * Require moderator role AND enforce objectivity constraint (Ch.18 §18.14.4).
 * A moderator who is a team member (coder) on the target problem cannot
 * make binding decisions for that problem.
 *
 * Throws AuthError(403) if the objectivity constraint is violated.
 */
export function requireModeratorForProblem(
	cookies: any,
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
	// Legacy string-based error matching (for backwards compat during migration)
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

// Check if user can access private view for a problem
// In MVP: all demo problems accessible for testing
export function canAccessPrivateView(problemCreatedByUserId: string): boolean {
	const user = getAuthenticatedUser();
	// MVP: Allow access to all demo problems for testing
	return true; // TODO: return isProblemOwner(user.user_id, problemCreatedByUserId);
}
