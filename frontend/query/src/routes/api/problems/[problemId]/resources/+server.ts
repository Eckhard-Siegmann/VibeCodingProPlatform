import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { findProblemById } from '$lib/server/repositories/problems';
import {
	getResourcesForProblem,
	addResource
} from '$lib/server/repositories/resources';
import { getAuthenticatedUser, hasElevatedRights } from '$lib/server/auth';
import { isTeamMember, getTeam } from '$lib/server/repositories/teams';
import { getCurrentVersion } from '$lib/server/repositories/problems';
import { getDatabase } from '$lib/server/db';
import { z } from 'zod';

// ============================================================================
// GET /api/problems/[problemId]/resources
// List all resources for a problem
// ============================================================================

export const GET: RequestHandler = async ({ params }) => {
	const { problemId } = params;

	const problem = findProblemById(problemId);
	if (!problem) {
		throw error(404, 'Problem not found');
	}

	const resources = getResourcesForProblem(problemId);

	return json({
		success: true,
		resources: resources.map((r) => ({
			resource_id: r.resource_id,
			url: r.url,
			title: r.title,
			resource_type: r.resource_type,
			added_by: r.added_by_display_name,
			approved: r.approved,
			created_at: r.created_at
		}))
	});
};

// ============================================================================
// POST /api/problems/[problemId]/resources
// Add a new resource
// Per Ch.6.2: PO/team/moderator → auto-approved; observers → pending
// ============================================================================

const AddResourceSchema = z.object({
	url: z.string().url('Must be a valid URL'),
	title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
	resource_type: z.enum(['direct', 'helpful'])
});

export const POST: RequestHandler = async ({ params, request }) => {
	const { problemId } = params;

	const user = getAuthenticatedUser();

	const problem = findProblemById(problemId);
	if (!problem) {
		throw error(404, 'Problem not found');
	}

	let body: z.infer<typeof AddResourceSchema>;
	try {
		const rawBody = await request.json();
		body = AddResourceSchema.parse(rawBody);
	} catch (err) {
		if (err instanceof z.ZodError) {
			throw error(400, `Validation error: ${err.issues.map((e: z.ZodIssue) => e.message).join(', ')}`);
		}
		throw error(400, 'Invalid request body');
	}

	// Determine auto-approval per Ch.6.2
	const isElevated = hasElevatedRights(
		user.user_id,
		problem.created_by_user_id,
		problem.deputy_owner_user_id
	);

	// Check if user is a team member
	const eventId = 'event-feb-2026'; // MVP: hardcoded event
	const team = getTeam(problemId, eventId);
	const currentVersion = getCurrentVersion(problemId);
	let isOnTeam = false;
	if (team && currentVersion) {
		const membership = isTeamMember(
			team.team_id,
			user.user_id,
			currentVersion.problem_version_id
		);
		isOnTeam = membership?.status === 'active';
	}

	// Check if moderator
	const db = getDatabase();
	const userRoleRecord = db
		.prepare('SELECT role FROM users WHERE user_id = ?')
		.get(user.user_id) as { role: string } | undefined;
	const isModerator =
		userRoleRecord?.role === 'moderator' || userRoleRecord?.role === 'admin';

	// PO, deputy, team members, and moderators get auto-approved (Ch.6.2)
	const autoApprove = isElevated || isOnTeam || isModerator;

	try {
		const result = addResource(problemId, body, user.user_id, autoApprove);

		return json({
			success: true,
			resource_id: result.resource_id,
			approved: autoApprove
		});
	} catch (err) {
		console.error('Failed to add resource:', err);
		throw error(500, 'Failed to add resource');
	}
};
