import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { findProblemById, submitProblem } from '$lib/server/repositories/problems';
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

	// Check state
	if (problem.current_readiness_state !== 'draft') {
		throw error(400, 'Problem is not in draft state');
	}

	try {
		const result = submitProblem(problemId, problem.current_major_version, user.user_id);

		return json({
			success: true,
			decision_id: result.decision_id,
			new_readiness_state: 'submitted'
		});
	} catch (err) {
		console.error('Failed to submit problem:', err);
		throw error(500, 'Failed to submit problem');
	}
};
