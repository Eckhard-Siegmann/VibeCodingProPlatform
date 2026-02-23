import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { findProblemById, getCurrentVersion } from '$lib/server/repositories/problems';
import {
	getChatMessages,
	postChatMessage,
	getAvailableEmojis
} from '$lib/server/repositories/chat';
import { getEffectiveRole, getTeam } from '$lib/server/repositories/teams';
import { getAuthenticatedUser } from '$lib/server/auth';
import { z } from 'zod';

// ============================================================================
// GET /api/problems/[problemId]/chat
// Fetch chat messages with optional filtering
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

	// Parse query parameters
	const majorVersionParam = url.searchParams.get('major_version');
	const includeAllVersions = url.searchParams.get('include_all_versions') === 'true';
	const teamOnly = url.searchParams.get('team_only') === 'true';

	// Determine version to filter by
	let majorVersion: number | undefined;
	if (!includeAllVersions) {
		if (majorVersionParam) {
			majorVersion = parseInt(majorVersionParam, 10);
			if (isNaN(majorVersion)) {
				throw error(400, 'Invalid major_version parameter');
			}
		} else {
			// Default to current major version
			majorVersion = problem.current_major_version;
		}
	}

	try {
		const messages = getChatMessages(problemId, {
			majorVersion,
			includeAllVersions,
			teamOnly,
			currentUserId: user.user_id
		});

		const emojis = getAvailableEmojis();

		return json({
			success: true,
			messages,
			available_emojis: emojis,
			filter: {
				major_version: majorVersion,
				include_all_versions: includeAllVersions,
				team_only: teamOnly
			}
		});
	} catch (err) {
		console.error('Failed to fetch chat messages:', err);
		throw error(500, 'Failed to fetch chat messages');
	}
};

// ============================================================================
// POST /api/problems/[problemId]/chat
// Post a new chat message
// ============================================================================

const PostMessageSchema = z.object({
	content: z.string().min(1).max(2000),
	reply_to_message_id: z.string().uuid().optional(),
	context_situation: z.enum(['pre_discussion', 'pitch_discussion', 'while_building', 'while_reviewing']).optional()
});

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
	let body: z.infer<typeof PostMessageSchema>;
	try {
		const rawBody = await request.json();
		body = PostMessageSchema.parse(rawBody);
	} catch (err) {
		if (err instanceof z.ZodError) {
			throw error(400, `Validation error: ${err.errors.map(e => e.message).join(', ')}`);
		}
		throw error(400, 'Invalid request body');
	}

	// Get user's effective role for this problem
	const effectiveRole = getEffectiveRole(problemId, user.user_id);

	// Determine context situation (default based on problem state or passed value)
	const contextSituation = body.context_situation ?? 'pre_discussion';

	// Get team if exists (for team_id on message)
	// MVP: No event context, so team lookup is simplified
	const teamId: string | null = null; // TODO: Get from event context when available

	try {
		const result = postChatMessage({
			userId: user.user_id,
			userRole: effectiveRole.role,
			problemId: problemId,
			problemVersionId: currentVersion.problem_version_id,
			majorVersion: currentVersion.major_version,
			minorVersion: null, // TODO: Get from repo snapshot if available
			eventId: null, // TODO: Get from event context
			teamId: teamId,
			contextSituation: contextSituation,
			content: body.content,
			replyToMessageId: body.reply_to_message_id
		});

		return json({
			success: true,
			message_id: result.message_id
		});
	} catch (err) {
		console.error('Failed to post chat message:', err);
		if (err instanceof Error && err.message.includes('2000 character')) {
			throw error(400, err.message);
		}
		throw error(500, 'Failed to post chat message');
	}
};
