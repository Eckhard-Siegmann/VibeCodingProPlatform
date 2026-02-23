import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { findProblemById } from '$lib/server/repositories/problems';
import { getChatMessage, addReaction, removeReaction } from '$lib/server/repositories/chat';
import { getAuthenticatedUser } from '$lib/server/auth';
import { z } from 'zod';

// ============================================================================
// POST /api/problems/[problemId]/chat/[messageId]/reactions
// Add a reaction to a message
// ============================================================================

const AddReactionSchema = z.object({
	emoji: z.string().min(1).max(10) // Emoji can be multi-byte
});

export const POST: RequestHandler = async ({ params, request }) => {
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
	let body: z.infer<typeof AddReactionSchema>;
	try {
		const rawBody = await request.json();
		body = AddReactionSchema.parse(rawBody);
	} catch (err) {
		if (err instanceof z.ZodError) {
			throw error(400, `Validation error: ${err.errors.map(e => e.message).join(', ')}`);
		}
		throw error(400, 'Invalid request body');
	}

	try {
		const result = addReaction(messageId, user.user_id, body.emoji);

		if (!result.success) {
			throw error(400, result.error ?? 'Failed to add reaction');
		}

		return json({
			success: true
		});
	} catch (err) {
		if (err instanceof Error && 'status' in err) {
			throw err; // Re-throw SvelteKit errors
		}
		console.error('Failed to add reaction:', err);
		throw error(500, 'Failed to add reaction');
	}
};

// ============================================================================
// DELETE /api/problems/[problemId]/chat/[messageId]/reactions
// Remove a reaction from a message
// ============================================================================

const RemoveReactionSchema = z.object({
	emoji: z.string().min(1).max(10)
});

export const DELETE: RequestHandler = async ({ params, request }) => {
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
	let body: z.infer<typeof RemoveReactionSchema>;
	try {
		const rawBody = await request.json();
		body = RemoveReactionSchema.parse(rawBody);
	} catch (err) {
		if (err instanceof z.ZodError) {
			throw error(400, `Validation error: ${err.errors.map(e => e.message).join(', ')}`);
		}
		throw error(400, 'Invalid request body');
	}

	try {
		const result = removeReaction(messageId, user.user_id, body.emoji);

		return json({
			success: result.success
		});
	} catch (err) {
		console.error('Failed to remove reaction:', err);
		throw error(500, 'Failed to remove reaction');
	}
};
