import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { findProblemById } from '$lib/server/repositories/problems';
import { getLessonsForProblem, createLesson } from '$lib/server/repositories/lessons';
import { getAuthenticatedUser } from '$lib/server/auth';
import { z } from 'zod';

// ============================================================================
// GET /api/problems/[problemId]/lessons
// Fetch all lessons for a problem
// ============================================================================

export const GET: RequestHandler = async ({ params }) => {
	const { problemId } = params;

	const problem = findProblemById(problemId);
	if (!problem) {
		throw error(404, 'Problem not found');
	}

	try {
		const lessons = getLessonsForProblem(problemId);
		return json({ success: true, lessons });
	} catch (err) {
		console.error('Failed to fetch lessons:', err);
		throw error(500, 'Failed to fetch lessons');
	}
};

// ============================================================================
// POST /api/problems/[problemId]/lessons
// Create a new lesson learned (any authenticated user, Ch.13.1)
// ============================================================================

const CreateLessonSchema = z.object({
	content: z.string().min(1, 'Content is required').max(5000, 'Content must be under 5000 characters'),
	category: z
		.enum(['tooling', 'architecture', 'process', 'gotcha', 'performance', 'testing'])
		.optional(),
	tags: z.array(z.string().max(50)).max(10).optional(),
	event_id: z.string().optional()
});

export const POST: RequestHandler = async ({ params, request, cookies }) => {
	const { problemId } = params;

	const user = getAuthenticatedUser(cookies);

	const problem = findProblemById(problemId);
	if (!problem) {
		throw error(404, 'Problem not found');
	}

	let body: z.infer<typeof CreateLessonSchema>;
	try {
		const rawBody = await request.json();
		body = CreateLessonSchema.parse(rawBody);
	} catch (err) {
		if (err instanceof z.ZodError) {
			throw error(400, `Validation error: ${err.issues.map((e: z.ZodIssue) => e.message).join(', ')}`);
		}
		throw error(400, 'Invalid request body');
	}

	try {
		const lessonId = createLesson({
			problem_id: problemId,
			event_id: body.event_id,
			user_id: user.user_id,
			content: body.content,
			category: body.category,
			tags: body.tags
		});

		return json({ success: true, lesson_id: lessonId }, { status: 201 });
	} catch (err) {
		console.error('Failed to create lesson:', err);
		throw error(500, 'Failed to create lesson');
	}
};
