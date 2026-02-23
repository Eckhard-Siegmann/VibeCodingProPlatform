import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	findProblemById,
	getCurrentVersion,
	updateProblemVersion
} from '$lib/server/repositories/problems';

/**
 * PATCH /api/problems/[problemId]/versions/[versionId]
 *
 * Updates a problem version's editable fields.
 * Per spec Chapter 04 & 13: changes are persisted immediately on field modification
 * while the problem is in draft state.
 *
 * Guards:
 * - Problem must be in 'draft' state
 * - Version must be current (is_current = 1)
 * - Must have private view access (MVP: relaxed for testing)
 */
export const PATCH: RequestHandler = async ({ params, request }) => {
	const { problemId, versionId } = params;

	// Find problem and validate state
	const problem = findProblemById(problemId);
	if (!problem) {
		throw error(404, 'Problem not found');
	}

	// Guard: Only editable in draft state
	if (problem.current_readiness_state !== 'draft') {
		throw error(403, 'Problem is not in draft state. Create a new version to make changes.');
	}

	// Get current version and validate
	const currentVersion = getCurrentVersion(problemId);
	if (!currentVersion) {
		throw error(404, 'No current version found');
	}

	if (currentVersion.problem_version_id !== versionId) {
		throw error(403, 'Can only edit the current version');
	}

	// Parse request body
	let data: {
		title?: string;
		description?: string;
		value_statement?: string;
		repo_url_primary?: string;
		repo_url_secondary?: string | null;
		task_count?: number;
	};

	try {
		data = await request.json();
	} catch {
		throw error(400, 'Invalid JSON body');
	}

	// Validate field types
	if (data.title !== undefined && typeof data.title !== 'string') {
		throw error(400, 'title must be a string');
	}
	if (data.description !== undefined && typeof data.description !== 'string') {
		throw error(400, 'description must be a string');
	}
	if (data.value_statement !== undefined && typeof data.value_statement !== 'string') {
		throw error(400, 'value_statement must be a string');
	}
	if (data.repo_url_primary !== undefined && typeof data.repo_url_primary !== 'string') {
		throw error(400, 'repo_url_primary must be a string');
	}
	if (
		data.repo_url_secondary !== undefined &&
		data.repo_url_secondary !== null &&
		typeof data.repo_url_secondary !== 'string'
	) {
		throw error(400, 'repo_url_secondary must be a string or null');
	}
	if (data.task_count !== undefined && typeof data.task_count !== 'number') {
		throw error(400, 'task_count must be a number');
	}

	// Validate non-empty required fields
	if (data.title !== undefined && data.title.trim() === '') {
		throw error(400, 'title cannot be empty');
	}
	if (data.description !== undefined && data.description.trim() === '') {
		throw error(400, 'description cannot be empty');
	}
	if (data.repo_url_primary !== undefined && data.repo_url_primary.trim() === '') {
		throw error(400, 'repo_url_primary cannot be empty');
	}
	if (data.task_count !== undefined && data.task_count < 1) {
		throw error(400, 'task_count must be at least 1');
	}

	try {
		const result = updateProblemVersion(versionId, data);

		return json({
			success: result.success,
			updated_fields: result.updated_fields
		});
	} catch (err) {
		console.error('Failed to update problem version:', err);
		throw error(500, 'Failed to update problem version');
	}
};
