import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { findProblemById } from '$lib/server/repositories/problems';
import { editChatMessage, softDeleteMessage, getChatMessage } from '$lib/server/repositories/chat';
import { getEffectiveRole } from '$lib/server/repositories/teams';
import { getAuthenticatedUser } from '$lib/server/auth';
import { z } from 'zod';

// ============================================================================
// PATCH /api/problems/[problemId]/chat/[messageId]
// Edit a chat message (only allowed within 15 minutes)
// ============================================================================

const EditMessageSchema = z.object({
	content: z.string().min(1).max(2000)
});

export const PATCH: RequestHandler = async ({ params, request }) => {
	const { problemId, messageId } = params;

	// Get authenticated user
	const user = getAuthenticatedUser();

	// Find problem
	const problem = findProblemById(problemId);
	if (!problem) {
		throw error(404, 'Problem not found');
	}

	// Verify message exists and belongs to this problem
	const message = getChatMessage(messageId);
	if (!message || message.problem_id !== problemId) {
		throw error(404, 'Message not found');
	}

	// Parse request body
	let body: z.infer<typeof EditMessageSchema>;
	try {
		const rawBody = await request.json();
		body = EditMessageSchema.parse(rawBody);
	} catch (err) {
		if (err instanceof z.ZodError) {
			throw error(400, `Validation error: ${err.issues.map((e: z.ZodIssue) => e.message).join(', ')}`);
		}
		throw error(400, 'Invalid request body');
	}

	try {
		const result = editChatMessage(messageId, body.content, user.user_id);

		if (!result.success) {
			throw error(400, result.error ?? 'Failed to edit message');
		}

		return json({
			success: true
		});
	} catch (err) {
		if (err instanceof Error && 'status' in err) {
			throw err; // Re-throw SvelteKit errors
		}
		console.error('Failed to edit chat message:', err);
		throw error(500, 'Failed to edit chat message');
	}
};

// ============================================================================
// DELETE /api/problems/[problemId]/chat/[messageId]
// Soft delete a chat message
// ============================================================================

export const DELETE: RequestHandler = async ({ params }) => {
	const { problemId, messageId } = params;

	// Get authenticated user
	const user = getAuthenticatedUser();

	// Find problem
	const problem = findProblemById(problemId);
	if (!problem) {
		throw error(404, 'Problem not found');
	}

	// Verify message exists and belongs to this problem
	const message = getChatMessage(messageId);
	if (!message || message.problem_id !== problemId) {
		throw error(404, 'Message not found');
	}

	// Check if user is a moderator (for this problem)
	const effectiveRole = getEffectiveRole(problemId, user.user_id);
	const isModerator = effectiveRole.role === 'moderator' || effectiveRole.role === 'admin';

	try {
		const result = softDeleteMessage(messageId, user.user_id, isModerator);

		if (!result.success) {
			throw error(403, result.error ?? 'Not authorized to delete this message');
		}

		return json({
			success: true
		});
	} catch (err) {
		if (err instanceof Error && 'status' in err) {
			throw err; // Re-throw SvelteKit errors
		}
		console.error('Failed to delete chat message:', err);
		throw error(500, 'Failed to delete chat message');
	}
};
