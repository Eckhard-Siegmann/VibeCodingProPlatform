// MVP: Hardcoded authenticated user
// TODO: Replace with real session-based authentication

// User identity only - NO role attribute!
// Role is contextual: determined by relationship to the resource being accessed
export function getAuthenticatedUser() {
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
