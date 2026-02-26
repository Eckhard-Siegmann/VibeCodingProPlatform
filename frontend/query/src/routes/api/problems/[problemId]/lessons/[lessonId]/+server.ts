import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { findProblemById } from '$lib/server/repositories/problems';
import {
	getLessonById,
	getLessonProblemId,
	updateLesson,
	toggleValuable
} from '$lib/server/repositories/lessons';
import { getAuthenticatedUser } from '$lib/server/auth';
import { getDatabase } from '$lib/server/db';
import { z } from 'zod';

// ============================================================================
// PATCH /api/problems/[problemId]/lessons/[lessonId]
// Update a lesson (author only for content; PO/moderator for valuable flag)
// ============================================================================

const UpdateLessonSchema = z.object({
	content: z.string().min(1).max(5000).optional(),
	category: z
		.enum(['tooling', 'architecture', 'process', 'gotcha', 'performance', 'testing'])
		.optional(),
	tags: z.array(z.string().max(50)).max(10).optional(),
	valuable: z.boolean().optional()
});

export const PATCH: RequestHandler = async ({ params, request, cookies }) => {
	const { problemId, lessonId } = params;

	const user = getAuthenticatedUser(cookies);

	// Verify problem exists and lesson belongs to it
	const problem = findProblemById(problemId);
	if (!problem) {
		throw error(404, 'Problem not found');
	}

	const lessonProblemId = getLessonProblemId(lessonId);
	if (!lessonProblemId || lessonProblemId !== problemId) {
		throw error(404, 'Lesson not found');
	}

	let body: z.infer<typeof UpdateLessonSchema>;
	try {
		const rawBody = await request.json();
		body = UpdateLessonSchema.parse(rawBody);
	} catch (err) {
		if (err instanceof z.ZodError) {
			throw error(400, `Validation error: ${err.issues.map((e: z.ZodIssue) => e.message).join(', ')}`);
		}
		throw error(400, 'Invalid request body');
	}

	// Handle valuable flag toggle (PO or moderator only, Ch.13.1)
	if (body.valuable !== undefined) {
		const db = getDatabase();
		const userRoleRecord = db
			.prepare('SELECT role FROM users WHERE user_id = ?')
			.get(user.user_id) as { role: string } | undefined;
		const isModerator =
			userRoleRecord?.role === 'moderator' || userRoleRecord?.role === 'admin';
		const isOwner = user.user_id === problem.created_by_user_id;
		const isDeputy =
			problem.deputy_owner_user_id !== null &&
			user.user_id === problem.deputy_owner_user_id;

		if (!isModerator && !isOwner && !isDeputy) {
			throw error(403, 'Only problem owners and moderators can flag lessons as valuable');
		}

		const toggled = toggleValuable(lessonId);
		if (!toggled) {
			throw error(500, 'Failed to toggle valuable flag');
		}

		// If only valuable was changed, return early
		if (body.content === undefined && body.category === undefined && body.tags === undefined) {
			return json({ success: true });
		}
	}

	// Handle content/category/tags update (author only, Ch.13.1)
	if (body.content !== undefined || body.category !== undefined || body.tags !== undefined) {
		const updated = updateLesson(lessonId, user.user_id, {
			content: body.content,
			category: body.category,
			tags: body.tags
		});

		if (!updated) {
			throw error(403, 'Only the lesson author can edit content');
		}
	}

	return json({ success: true });
};
