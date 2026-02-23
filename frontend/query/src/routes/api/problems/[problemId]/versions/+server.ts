import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { findProblemById, createNewVersion } from '$lib/server/repositories/problems';
import { getAuthenticatedUser } from '$lib/server/auth';

export const POST: RequestHandler = async ({ params, request }) => {
	const { problemId } = params;

	// Get authenticated user
	const user = getAuthenticatedUser();

	// Find problem
	const problem = findProblemById(problemId);
	if (!problem) {
		throw error(404, 'Problem not found');
	}

	// Parse request body
	let commitMessage: string | undefined;
	try {
		const body = await request.json();
		commitMessage = body.commit_message;
	} catch {
		// Empty body is fine
	}

	try {
		const result = createNewVersion(problemId, user.user_id, commitMessage);

		return json({
			success: true,
			version_id: result.version_id,
			major_version: result.major_version
		});
	} catch (err) {
		console.error('Failed to create new version:', err);
		throw error(500, 'Failed to create new version');
	}
};
