import { getDatabase, generateId, nowIso } from '../db';

// ============================================================================
// Types
// ============================================================================

export interface ProblemResource {
	resource_id: string;
	problem_id: string;
	url: string;
	title: string;
	resource_type: 'direct' | 'helpful';
	added_by_user_id: string;
	added_by_display_name: string;
	approved: boolean;
	approved_by_user_id: string | null;
	created_at: string;
}

interface ResourceRow {
	resource_id: string;
	problem_id: string;
	url: string;
	title: string;
	resource_type: string;
	added_by_user_id: string;
	added_by_display_name: string;
	approved: number;
	approved_by_user_id: string | null;
	created_at: string;
}

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Get all resources for a problem, split by type.
 * Returns approved resources first, then pending suggestions.
 * Per Ch.19.3.24 and Ch.6.2.
 */
export function getResourcesForProblem(problemId: string): ProblemResource[] {
	const db = getDatabase();

	const rows = db
		.prepare(
			`
		SELECT
			r.resource_id,
			r.problem_id,
			r.url,
			r.title,
			r.resource_type,
			r.added_by_user_id,
			u.display_name as added_by_display_name,
			r.approved,
			r.approved_by_user_id,
			r.created_at
		FROM problem_resources r
		JOIN users u ON r.added_by_user_id = u.user_id
		WHERE r.problem_id = ?
		ORDER BY r.approved DESC, r.created_at ASC
	`
		)
		.all(problemId) as ResourceRow[];

	return rows.map((row) => ({
		...row,
		resource_type: row.resource_type as 'direct' | 'helpful',
		approved: Boolean(row.approved)
	}));
}

/**
 * Get resources filtered by type.
 */
export function getResourcesByType(
	problemId: string,
	resourceType: 'direct' | 'helpful'
): ProblemResource[] {
	return getResourcesForProblem(problemId).filter((r) => r.resource_type === resourceType);
}

// ============================================================================
// Mutation Functions
// ============================================================================

/**
 * Add a resource to a problem.
 * Per Ch.6.2: PO/team/moderator auto-approved, observers pending.
 */
export function addResource(
	problemId: string,
	data: {
		url: string;
		title: string;
		resource_type: 'direct' | 'helpful';
	},
	userId: string,
	autoApprove: boolean
): { success: boolean; resource_id: string } {
	const db = getDatabase();
	const resourceId = generateId();
	const now = nowIso();

	db.prepare(
		`
		INSERT INTO problem_resources (
			resource_id, problem_id, url, title, resource_type,
			added_by_user_id, approved, approved_by_user_id, created_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
	`
	).run(
		resourceId,
		problemId,
		data.url,
		data.title,
		data.resource_type,
		userId,
		autoApprove ? 1 : 0,
		autoApprove ? userId : null,
		now
	);

	return { success: true, resource_id: resourceId };
}

/**
 * Update an existing resource (title and/or URL).
 */
export function updateResource(
	resourceId: string,
	data: Partial<{ url: string; title: string }>
): { success: boolean } {
	const db = getDatabase();

	const fields: string[] = [];
	const values: unknown[] = [];

	if (data.url !== undefined) {
		fields.push('url = ?');
		values.push(data.url);
	}
	if (data.title !== undefined) {
		fields.push('title = ?');
		values.push(data.title);
	}

	if (fields.length === 0) {
		return { success: true };
	}

	values.push(resourceId);

	const result = db
		.prepare(`UPDATE problem_resources SET ${fields.join(', ')} WHERE resource_id = ?`)
		.run(...values);

	return { success: result.changes > 0 };
}

/**
 * Delete a resource.
 */
export function deleteResource(resourceId: string): { success: boolean } {
	const db = getDatabase();

	const result = db
		.prepare('DELETE FROM problem_resources WHERE resource_id = ?')
		.run(resourceId);

	return { success: result.changes > 0 };
}

/**
 * Approve a pending resource suggestion.
 * Per Ch.6.2: Sets approved = TRUE and records who approved.
 */
export function approveResource(
	resourceId: string,
	approverUserId: string
): { success: boolean } {
	const db = getDatabase();

	const result = db
		.prepare(
			`
		UPDATE problem_resources
		SET approved = 1, approved_by_user_id = ?
		WHERE resource_id = ? AND approved = 0
	`
		)
		.run(approverUserId, resourceId);

	return { success: result.changes > 0 };
}

/**
 * Reject a pending resource suggestion (deletes it).
 * Per Ch.6.2: Rejected suggestions are removed.
 */
export function rejectResource(resourceId: string): { success: boolean } {
	const db = getDatabase();

	const result = db
		.prepare('DELETE FROM problem_resources WHERE resource_id = ? AND approved = 0')
		.run(resourceId);

	return { success: result.changes > 0 };
}

/**
 * Get a single resource by ID (for authorization checks).
 */
export function getResourceById(resourceId: string): ProblemResource | null {
	const db = getDatabase();

	const row = db
		.prepare(
			`
		SELECT
			r.resource_id,
			r.problem_id,
			r.url,
			r.title,
			r.resource_type,
			r.added_by_user_id,
			u.display_name as added_by_display_name,
			r.approved,
			r.approved_by_user_id,
			r.created_at
		FROM problem_resources r
		JOIN users u ON r.added_by_user_id = u.user_id
		WHERE r.resource_id = ?
	`
		)
		.get(resourceId) as ResourceRow | undefined;

	if (!row) return null;

	return {
		...row,
		resource_type: row.resource_type as 'direct' | 'helpful',
		approved: Boolean(row.approved)
	};
}
