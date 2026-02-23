import { getDatabase, generateId, nowIso } from '../db';
import { postSystemMessage } from './chat';

// ============================================================================
// Types
// ============================================================================

export interface Team {
	team_id: string;
	problem_id: string;
	event_id: string;
	breakout_room_url: string | null;
	created_at: string;
}

export interface TeamMember {
	team_id: string;
	user_id: string;
	display_name: string;
	problem_version_id: string;
	major_version: number;
	member_role: 'po' | 'po_deputy' | 'coder';
	status: 'active' | 'retired';
	joined_at: string;
	retired_at: string | null;
	rejoined_at: string | null;
	solution_repo_url: string | null;
}

export interface TeamMemberWithRole extends TeamMember {
	base_role: string; // The user's global role (from users table)
}

export type EffectiveRole = {
	role: string;
	source: 'team_membership' | 'base_role';
	is_team_member: boolean;
	member_role?: 'po' | 'po_deputy' | 'coder';
	member_status?: 'active' | 'retired';
};

// ============================================================================
// Row types
// ============================================================================

interface TeamMemberRow {
	team_id: string;
	user_id: string;
	display_name: string;
	problem_version_id: string;
	major_version: number;
	member_role: string;
	status: string;
	joined_at: string;
	retired_at: string | null;
	rejoined_at: string | null;
	solution_repo_url: string | null;
	base_role?: string;
}

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Get or create a team for a problem at a event.
 */
export function getOrCreateTeam(problemId: string, eventId: string): Team {
	const db = getDatabase();

	// Try to find existing team
	const existing = db
		.prepare(
			`
		SELECT team_id, problem_id, event_id, breakout_room_url, created_at
		FROM problem_teams
		WHERE problem_id = ? AND event_id = ?
	`
		)
		.get(problemId, eventId) as Team | undefined;

	if (existing) {
		return existing;
	}

	// Create new team
	const teamId = generateId();
	const now = nowIso();

	db.prepare(
		`
		INSERT INTO problem_teams (team_id, problem_id, event_id, created_at)
		VALUES (?, ?, ?, ?)
	`
	).run(teamId, problemId, eventId, now);

	return {
		team_id: teamId,
		problem_id: problemId,
		event_id: eventId,
		breakout_room_url: null,
		created_at: now
	};
}

/**
 * Get a team by problem and event.
 */
export function getTeam(problemId: string, eventId: string): Team | null {
	const db = getDatabase();

	const row = db
		.prepare(
			`
		SELECT team_id, problem_id, event_id, breakout_room_url, created_at
		FROM problem_teams
		WHERE problem_id = ? AND event_id = ?
	`
		)
		.get(problemId, eventId) as Team | undefined;

	return row ?? null;
}

/**
 * Get team members for a specific problem version.
 */
export function getTeamMembers(teamId: string, problemVersionId: string): TeamMember[] {
	const db = getDatabase();

	const rows = db
		.prepare(
			`
		SELECT
			ptm.team_id,
			ptm.user_id,
			u.display_name,
			ptm.problem_version_id,
			pv.major_version,
			ptm.member_role,
			ptm.status,
			ptm.joined_at,
			ptm.retired_at,
			ptm.rejoined_at,
			ptm.solution_repo_url
		FROM problem_team_members ptm
		JOIN users u ON ptm.user_id = u.user_id
		JOIN problem_versions pv ON ptm.problem_version_id = pv.problem_version_id
		WHERE ptm.team_id = ? AND ptm.problem_version_id = ?
		ORDER BY
			CASE ptm.member_role
				WHEN 'po' THEN 1
				WHEN 'po_deputy' THEN 2
				WHEN 'coder' THEN 3
			END,
			ptm.joined_at ASC
	`
		)
		.all(teamId, problemVersionId) as TeamMemberRow[];

	return rows.map((row) => ({
		...row,
		member_role: row.member_role as 'po' | 'po_deputy' | 'coder',
		status: row.status as 'active' | 'retired'
	}));
}

/**
 * Get all active team members across all versions (for display).
 */
export function getActiveTeamMembers(teamId: string): TeamMemberWithRole[] {
	const db = getDatabase();

	const rows = db
		.prepare(
			`
		SELECT
			ptm.team_id,
			ptm.user_id,
			u.display_name,
			ptm.problem_version_id,
			pv.major_version,
			ptm.member_role,
			ptm.status,
			ptm.joined_at,
			ptm.retired_at,
			ptm.rejoined_at,
			ptm.solution_repo_url,
			u.role as base_role
		FROM problem_team_members ptm
		JOIN users u ON ptm.user_id = u.user_id
		JOIN problem_versions pv ON ptm.problem_version_id = pv.problem_version_id
		WHERE ptm.team_id = ? AND ptm.status = 'active'
		ORDER BY
			CASE ptm.member_role
				WHEN 'po' THEN 1
				WHEN 'po_deputy' THEN 2
				WHEN 'coder' THEN 3
			END,
			ptm.joined_at ASC
	`
		)
		.all(teamId) as TeamMemberRow[];

	return rows.map((row) => ({
		...row,
		member_role: row.member_role as 'po' | 'po_deputy' | 'coder',
		status: row.status as 'active' | 'retired',
		base_role: row.base_role!
	}));
}

/**
 * Check if a user is a member of a team for a specific version.
 */
export function isTeamMember(
	teamId: string,
	userId: string,
	problemVersionId: string
): TeamMember | null {
	const db = getDatabase();

	const row = db
		.prepare(
			`
		SELECT
			ptm.team_id,
			ptm.user_id,
			u.display_name,
			ptm.problem_version_id,
			pv.major_version,
			ptm.member_role,
			ptm.status,
			ptm.joined_at,
			ptm.retired_at,
			ptm.rejoined_at,
			ptm.solution_repo_url
		FROM problem_team_members ptm
		JOIN users u ON ptm.user_id = u.user_id
		JOIN problem_versions pv ON ptm.problem_version_id = pv.problem_version_id
		WHERE ptm.team_id = ? AND ptm.user_id = ? AND ptm.problem_version_id = ?
	`
		)
		.get(teamId, userId, problemVersionId) as TeamMemberRow | undefined;

	if (!row) return null;

	return {
		...row,
		member_role: row.member_role as 'po' | 'po_deputy' | 'coder',
		status: row.status as 'active' | 'retired'
	};
}

/**
 * Get effective role for a user on a problem.
 * Team membership as coder overrides base moderator role for that problem.
 */
export function getEffectiveRole(problemId: string, userId: string): EffectiveRole {
	const db = getDatabase();

	// Get user's base role
	const user = db
		.prepare(
			`
		SELECT role FROM users WHERE user_id = ?
	`
		)
		.get(userId) as { role: string } | undefined;

	if (!user) {
		return { role: 'observer', source: 'base_role', is_team_member: false };
	}

	// Check if user is a team member for any version of this problem
	const membership = db
		.prepare(
			`
		SELECT
			ptm.member_role,
			ptm.status
		FROM problem_team_members ptm
		JOIN problem_teams pt ON ptm.team_id = pt.team_id
		WHERE pt.problem_id = ? AND ptm.user_id = ?
		ORDER BY ptm.joined_at DESC
		LIMIT 1
	`
		)
		.get(problemId, userId) as { member_role: string; status: string } | undefined;

	if (membership) {
		// Team membership as coder overrides moderator role
		if (membership.member_role === 'coder') {
			return {
				role: 'developer', // Treated as developer, not moderator
				source: 'team_membership',
				is_team_member: true,
				member_role: membership.member_role as 'po' | 'po_deputy' | 'coder',
				member_status: membership.status as 'active' | 'retired'
			};
		}
		// PO and PO deputy keep their roles
		return {
			role: user.role,
			source: 'team_membership',
			is_team_member: true,
			member_role: membership.member_role as 'po' | 'po_deputy' | 'coder',
			member_status: membership.status as 'active' | 'retired'
		};
	}

	return { role: user.role, source: 'base_role', is_team_member: false };
}

// ============================================================================
// Mutation Functions
// ============================================================================

/**
 * Join a team as a developer.
 */
export function joinTeam(
	teamId: string,
	userId: string,
	problemVersionId: string,
	chatContext: {
		problemId: string;
		majorVersion: number;
		eventId: string | null;
		contextSituation: string;
		botUserId: string;
		botRole: string;
	}
): { success: boolean; error?: string } {
	const db = getDatabase();
	const now = nowIso();

	// Check if already a member for this version
	const existing = isTeamMember(teamId, userId, problemVersionId);
	if (existing) {
		if (existing.status === 'active') {
			return { success: false, error: 'Already a team member' };
		}
		// If retired, this should use rejoinTeam instead
		return { success: false, error: 'Use rejoin to re-activate membership' };
	}

	// Get user display name for system message
	const user = db
		.prepare(`SELECT display_name FROM users WHERE user_id = ?`)
		.get(userId) as { display_name: string } | undefined;

	if (!user) {
		return { success: false, error: 'User not found' };
	}

	db.prepare(
		`
		INSERT INTO problem_team_members (
			team_id, user_id, problem_version_id, joined_at,
			member_role, status
		) VALUES (?, ?, ?, ?, 'coder', 'active')
	`
	).run(teamId, userId, problemVersionId, now);

	// Post system message
	const timestamp = formatSystemTimestamp(new Date());
	postSystemMessage({
		problemId: chatContext.problemId,
		problemVersionId: problemVersionId,
		majorVersion: chatContext.majorVersion,
		eventId: chatContext.eventId,
		teamId: teamId,
		contextSituation: chatContext.contextSituation,
		content: `─── ${timestamp} ${user.display_name} joined ───`,
		botUserId: chatContext.botUserId,
		botRole: chatContext.botRole
	});

	return { success: true };
}

/**
 * Retire from a team.
 */
export function retireFromTeam(
	teamId: string,
	userId: string,
	problemVersionId: string,
	chatContext: {
		problemId: string;
		majorVersion: number;
		eventId: string | null;
		contextSituation: string;
		botUserId: string;
		botRole: string;
	}
): { success: boolean; error?: string } {
	const db = getDatabase();
	const now = nowIso();

	// Check membership
	const membership = isTeamMember(teamId, userId, problemVersionId);
	if (!membership) {
		return { success: false, error: 'Not a team member' };
	}
	if (membership.status === 'retired') {
		return { success: false, error: 'Already retired' };
	}
	if (membership.member_role === 'po') {
		return { success: false, error: 'Problem Owner cannot retire from team' };
	}

	// Get user display name for system message
	const user = db
		.prepare(`SELECT display_name FROM users WHERE user_id = ?`)
		.get(userId) as { display_name: string } | undefined;

	if (!user) {
		return { success: false, error: 'User not found' };
	}

	db.prepare(
		`
		UPDATE problem_team_members
		SET status = 'retired', retired_at = ?
		WHERE team_id = ? AND user_id = ? AND problem_version_id = ?
	`
	).run(now, teamId, userId, problemVersionId);

	// Post system message
	const timestamp = formatSystemTimestamp(new Date());
	postSystemMessage({
		problemId: chatContext.problemId,
		problemVersionId: problemVersionId,
		majorVersion: chatContext.majorVersion,
		eventId: chatContext.eventId,
		teamId: teamId,
		contextSituation: chatContext.contextSituation,
		content: `─── ${timestamp} ${user.display_name} retired from team ───`,
		botUserId: chatContext.botUserId,
		botRole: chatContext.botRole
	});

	return { success: true };
}

/**
 * Rejoin a team after retiring.
 */
export function rejoinTeam(
	teamId: string,
	userId: string,
	problemVersionId: string,
	chatContext: {
		problemId: string;
		majorVersion: number;
		eventId: string | null;
		contextSituation: string;
		botUserId: string;
		botRole: string;
	}
): { success: boolean; error?: string } {
	const db = getDatabase();
	const now = nowIso();

	// Check membership
	const membership = isTeamMember(teamId, userId, problemVersionId);
	if (!membership) {
		return { success: false, error: 'Not a team member (use join instead)' };
	}
	if (membership.status === 'active') {
		return { success: false, error: 'Already active' };
	}

	// Get user display name for system message
	const user = db
		.prepare(`SELECT display_name FROM users WHERE user_id = ?`)
		.get(userId) as { display_name: string } | undefined;

	if (!user) {
		return { success: false, error: 'User not found' };
	}

	db.prepare(
		`
		UPDATE problem_team_members
		SET status = 'active', rejoined_at = ?
		WHERE team_id = ? AND user_id = ? AND problem_version_id = ?
	`
	).run(now, teamId, userId, problemVersionId);

	// Post system message
	const timestamp = formatSystemTimestamp(new Date());
	postSystemMessage({
		problemId: chatContext.problemId,
		problemVersionId: problemVersionId,
		majorVersion: chatContext.majorVersion,
		eventId: chatContext.eventId,
		teamId: teamId,
		contextSituation: chatContext.contextSituation,
		content: `─── ${timestamp} ${user.display_name} rejoined the team ───`,
		botUserId: chatContext.botUserId,
		botRole: chatContext.botRole
	});

	return { success: true };
}

/**
 * Set the breakout room URL for a team.
 */
export function setBreakoutRoomUrl(
	teamId: string,
	url: string | null
): { success: boolean } {
	const db = getDatabase();

	db.prepare(
		`
		UPDATE problem_teams
		SET breakout_room_url = ?
		WHERE team_id = ?
	`
	).run(url, teamId);

	return { success: true };
}

/**
 * Update a team member's solution repo URL.
 */
export function setSolutionRepoUrl(
	teamId: string,
	userId: string,
	problemVersionId: string,
	url: string | null
): { success: boolean } {
	const db = getDatabase();

	db.prepare(
		`
		UPDATE problem_team_members
		SET solution_repo_url = ?
		WHERE team_id = ? AND user_id = ? AND problem_version_id = ?
	`
	).run(url, teamId, userId, problemVersionId);

	return { success: true };
}

/**
 * Add PO to team when team is created.
 * Called automatically when first coder joins.
 */
export function ensurePOInTeam(
	teamId: string,
	poUserId: string,
	problemVersionId: string
): void {
	const db = getDatabase();
	const now = nowIso();

	// Check if PO already in team
	const existing = isTeamMember(teamId, poUserId, problemVersionId);
	if (existing) return;

	db.prepare(
		`
		INSERT INTO problem_team_members (
			team_id, user_id, problem_version_id, joined_at,
			member_role, status
		) VALUES (?, ?, ?, ?, 'po', 'active')
	`
	).run(teamId, poUserId, problemVersionId, now);
}

/**
 * Assign a deputy PO.
 */
export function assignDeputyPO(
	teamId: string,
	userId: string,
	problemVersionId: string,
	assignedByUserId: string
): { success: boolean; error?: string } {
	const db = getDatabase();
	const now = nowIso();

	// Verify assigner is PO
	const assigner = isTeamMember(teamId, assignedByUserId, problemVersionId);
	if (!assigner || assigner.member_role !== 'po') {
		return { success: false, error: 'Only PO can assign deputy' };
	}

	// Check if user is already a member
	const existing = isTeamMember(teamId, userId, problemVersionId);

	if (existing) {
		// Update role to po_deputy
		db.prepare(
			`
			UPDATE problem_team_members
			SET member_role = 'po_deputy'
			WHERE team_id = ? AND user_id = ? AND problem_version_id = ?
		`
		).run(teamId, userId, problemVersionId);
	} else {
		// Add as new member with po_deputy role
		db.prepare(
			`
			INSERT INTO problem_team_members (
				team_id, user_id, problem_version_id, joined_at,
				member_role, status
			) VALUES (?, ?, ?, ?, 'po_deputy', 'active')
		`
		).run(teamId, userId, problemVersionId, now);
	}

	return { success: true };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format timestamp for system messages: DD.MM.YYYY HH:MM
 */
function formatSystemTimestamp(date: Date): string {
	const day = String(date.getDate()).padStart(2, '0');
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const year = date.getFullYear();
	const hours = String(date.getHours()).padStart(2, '0');
	const minutes = String(date.getMinutes()).padStart(2, '0');

	return `${day}.${month}.${year} ${hours}:${minutes}`;
}
