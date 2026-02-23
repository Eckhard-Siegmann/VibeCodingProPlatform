import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { findProblemById, cloneProblem } from '$lib/server/repositories/problems';
import { getAuthenticatedUser } from '$lib/server/auth';

export const POST: RequestHandler = async ({ params }) => {
	const { problemId } = params;

	// Get authenticated user
	const user = getAuthenticatedUser();

	// Find problem
	const problem = findProblemById(problemId);
	if (!problem) {
		throw error(404, 'Problem not found');
	}

	try {
		const result = cloneProblem(problemId, user.user_id);

		return json({
			success: true,
			problem_id: result.problem_id,
			public_slug: result.public_slug,
			private_slug: result.private_slug
		});
	} catch (err) {
		console.error('Failed to clone problem:', err);
		throw error(500, 'Failed to clone problem');
	}
};
