import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { findProblemById } from '$lib/server/repositories/problems';
import {
	getResourceById,
	updateResource,
	deleteResource,
	approveResource,
	rejectResource
} from '$lib/server/repositories/resources';
import { getAuthenticatedUser, hasElevatedRights } from '$lib/server/auth';
import { getDatabase } from '$lib/server/db';
import { z } from 'zod';

// ============================================================================
// PATCH /api/problems/[problemId]/resources/[resourceId]
// Update a resource (title and/or URL), or approve/reject
// ============================================================================

const UpdateResourceSchema = z.object({
	url: z.string().url('Must be a valid URL').optional(),
	title: z.string().min(1).max(200).optional(),
	action: z.enum(['approve', 'reject']).optional()
});

export const PATCH: RequestHandler = async ({ params, request }) => {
	const { problemId, resourceId } = params;

	const user = getAuthenticatedUser();

	const problem = findProblemById(problemId);
	if (!problem) {
		throw error(404, 'Problem not found');
	}

	const resource = getResourceById(resourceId);
	if (!resource || resource.problem_id !== problemId) {
		throw error(404, 'Resource not found');
	}

	let body: z.infer<typeof UpdateResourceSchema>;
	try {
		const rawBody = await request.json();
		body = UpdateResourceSchema.parse(rawBody);
	} catch (err) {
		if (err instanceof z.ZodError) {
			throw error(400, `Validation error: ${err.issues.map((e: z.ZodIssue) => e.message).join(', ')}`);
		}
		throw error(400, 'Invalid request body');
	}

	const isElevated = hasElevatedRights(
		user.user_id,
		problem.created_by_user_id,
		problem.deputy_owner_user_id
	);

	// Handle approve/reject actions (PO/Deputy only per Ch.6.2)
	if (body.action === 'approve') {
		if (!isElevated) {
			throw error(403, 'Only the Problem Owner can approve suggestions');
		}
		const result = approveResource(resourceId, user.user_id);
		return json({ success: result.success, action: 'approved' });
	}

	if (body.action === 'reject') {
		if (!isElevated) {
			throw error(403, 'Only the Problem Owner can reject suggestions');
		}
		const result = rejectResource(resourceId);
		return json({ success: result.success, action: 'rejected' });
	}

	// Handle field update (PO/Deputy or resource author)
	const canEdit = isElevated || resource.added_by_user_id === user.user_id;
	if (!canEdit) {
		throw error(403, 'Not authorized to edit this resource');
	}

	try {
		const result = updateResource(resourceId, {
			url: body.url,
			title: body.title
		});
		return json({ success: result.success });
	} catch (err) {
		console.error('Failed to update resource:', err);
		throw error(500, 'Failed to update resource');
	}
};

// ============================================================================
// DELETE /api/problems/[problemId]/resources/[resourceId]
// Delete a resource (PO/Deputy or resource author)
// ============================================================================

export const DELETE: RequestHandler = async ({ params }) => {
	const { problemId, resourceId } = params;

	const user = getAuthenticatedUser();

	const problem = findProblemById(problemId);
	if (!problem) {
		throw error(404, 'Problem not found');
	}

	const resource = getResourceById(resourceId);
	if (!resource || resource.problem_id !== problemId) {
		throw error(404, 'Resource not found');
	}

	const isElevated = hasElevatedRights(
		user.user_id,
		problem.created_by_user_id,
		problem.deputy_owner_user_id
	);

	const canDelete = isElevated || resource.added_by_user_id === user.user_id;
	if (!canDelete) {
		throw error(403, 'Not authorized to delete this resource');
	}

	try {
		const result = deleteResource(resourceId);
		return json({ success: result.success });
	} catch (err) {
		console.error('Failed to delete resource:', err);
		throw error(500, 'Failed to delete resource');
	}
};
