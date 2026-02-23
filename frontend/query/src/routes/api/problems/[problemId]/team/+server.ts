import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { findProblemById, getCurrentVersion } from '$lib/server/repositories/problems';
import {
	getOrCreateTeam,
	getTeam,
	getActiveTeamMembers,
	joinTeam,
	retireFromTeam,
	rejoinTeam,
	setBreakoutRoomUrl,
	setSolutionRepoUrl,
	ensurePOInTeam,
	isTeamMember
} from '$lib/server/repositories/teams';
import { getAuthenticatedUser } from '$lib/server/auth';
import { z } from 'zod';

// Bot user for system messages (should be seeded in database)
const SYSTEM_BOT = {
	userId: 'system-bot',
	role: 'agent'
};

// ============================================================================
// GET /api/problems/[problemId]/team
// Get team members for the current problem version
// ============================================================================

export const GET: RequestHandler = async ({ params, url }) => {
	const { problemId } = params;

	// Get authenticated user
	const user = getAuthenticatedUser();

	// Find problem
	const problem = findProblemById(problemId);
	if (!problem) {
		throw error(404, 'Problem not found');
	}

	// MVP: No event context, use hardcoded event ID or null
	const eventId = url.searchParams.get('event_id');
	if (!eventId) {
		// Return empty team if no event specified
		return json({
			success: true,
			team: null,
			members: [],
			current_user_membership: null
		});
	}

	const team = getTeam(problemId, eventId);
	if (!team) {
		return json({
			success: true,
			team: null,
			members: [],
			current_user_membership: null
		});
	}

	const currentVersion = getCurrentVersion(problemId);
	if (!currentVersion) {
		throw error(500, 'Problem has no current version');
	}

	const members = getActiveTeamMembers(team.team_id);
	const currentUserMembership = isTeamMember(
		team.team_id,
		user.user_id,
		currentVersion.problem_version_id
	);

	return json({
		success: true,
		team: {
			team_id: team.team_id,
			breakout_room_url: team.breakout_room_url
		},
		members,
		current_user_membership: currentUserMembership
	});
};

// ============================================================================
// POST /api/problems/[problemId]/team
// Team actions: join, retire, rejoin, set_breakout_url, set_solution_url
// ============================================================================

const TeamActionSchema = z.discriminatedUnion('action', [
	z.object({
		action: z.literal('join'),
		event_id: z.string().uuid()
	}),
	z.object({
		action: z.literal('retire'),
		event_id: z.string().uuid()
	}),
	z.object({
		action: z.literal('rejoin'),
		event_id: z.string().uuid()
	}),
	z.object({
		action: z.literal('set_breakout_url'),
		event_id: z.string().uuid(),
		url: z.string().url().nullable()
	}),
	z.object({
		action: z.literal('set_solution_url'),
		event_id: z.string().uuid(),
		url: z.string().url().nullable()
	})
]);

export const POST: RequestHandler = async ({ params, request }) => {
	const { problemId } = params;

	// Get authenticated user
	const user = getAuthenticatedUser();

	// Find problem
	const problem = findProblemById(problemId);
	if (!problem) {
		throw error(404, 'Problem not found');
	}

	// Get current version
	const currentVersion = getCurrentVersion(problemId);
	if (!currentVersion) {
		throw error(500, 'Problem has no current version');
	}

	// Parse request body
	let body: z.infer<typeof TeamActionSchema>;
	try {
		const rawBody = await request.json();
		body = TeamActionSchema.parse(rawBody);
	} catch (err) {
		if (err instanceof z.ZodError) {
			throw error(400, `Validation error: ${err.errors.map(e => e.message).join(', ')}`);
		}
		throw error(400, 'Invalid request body');
	}

	// Get or create team
	const team = getOrCreateTeam(problemId, body.event_id);

	// Ensure PO is in team (automatically added when team is accessed)
	ensurePOInTeam(team.team_id, problem.created_by_user_id, currentVersion.problem_version_id);

	// Common chat context for system messages
	const chatContext = {
		problemId: problemId,
		majorVersion: currentVersion.major_version,
		eventId: body.event_id,
		contextSituation: 'while_building' as const,
		botUserId: SYSTEM_BOT.userId,
		botRole: SYSTEM_BOT.role
	};

	try {
		switch (body.action) {
			case 'join': {
				const result = joinTeam(
					team.team_id,
					user.user_id,
					currentVersion.problem_version_id,
					chatContext
				);

				if (!result.success) {
					throw error(400, result.error ?? 'Failed to join team');
				}

				return json({ success: true, action: 'joined' });
			}

			case 'retire': {
				const result = retireFromTeam(
					team.team_id,
					user.user_id,
					currentVersion.problem_version_id,
					chatContext
				);

				if (!result.success) {
					throw error(400, result.error ?? 'Failed to retire from team');
				}

				return json({ success: true, action: 'retired' });
			}

			case 'rejoin': {
				const result = rejoinTeam(
					team.team_id,
					user.user_id,
					currentVersion.problem_version_id,
					chatContext
				);

				if (!result.success) {
					throw error(400, result.error ?? 'Failed to rejoin team');
				}

				return json({ success: true, action: 'rejoined' });
			}

			case 'set_breakout_url': {
				setBreakoutRoomUrl(team.team_id, body.url);
				return json({ success: true, action: 'breakout_url_updated' });
			}

			case 'set_solution_url': {
				setSolutionRepoUrl(
					team.team_id,
					user.user_id,
					currentVersion.problem_version_id,
					body.url
				);
				return json({ success: true, action: 'solution_url_updated' });
			}

			default:
				throw error(400, 'Unknown action');
		}
	} catch (err) {
		if (err instanceof Error && 'status' in err) {
			throw err; // Re-throw SvelteKit errors
		}
		console.error('Team action failed:', err);
		throw error(500, 'Team action failed');
	}
};
