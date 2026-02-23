import { getDatabase, generateId, nowIso } from '../db';

export interface Response {
	response_id: string;
	assessment_id: string;
	item_id: string;
	session_id: string;
	user_id: string | null;
	role: string;
	time_context: string;
	in_presence: boolean;
	rating_value: number | null;
	created_at: string;
	superseded_at: string | null;
	superseded_by_response_id: string | null;
}

export interface ResponseInput {
	item_id: string; // Concrete item_id (UUID) - locked to exact version at response time
	rating_value: number;
}

export interface SubmissionResult {
	response_count: number;
	superseded_count: number;
	response_ids: string[];
}

/**
 * Submit responses for an assessment.
 *
 * Per Ch.9 and Ch.25:
 * - Responses reference concrete item_id (not item_key)
 * - Supersession: new responses INSERT, old marked with superseded_at
 * - All responses are append-only
 */
export function submitResponses(
	assessmentId: string,
	sessionId: string,
	role: string,
	timeContext: string,
	inPresence: boolean,
	responses: ResponseInput[]
): SubmissionResult {
	const db = getDatabase();
	const now = nowIso();
	const responseIds: string[] = [];
	let supersededCount = 0;

	// Use transaction for atomicity
	const submitTransaction = db.transaction(() => {
		for (const input of responses) {
			const responseId = generateId();

			// Check for existing non-superseded response for this assessment/session/item
			const existing = db
				.prepare(
					`
				SELECT response_id
				FROM responses
				WHERE assessment_id = ?
				  AND session_id = ?
				  AND item_id = ?
				  AND superseded_at IS NULL
			`
				)
				.get(assessmentId, sessionId, input.item_id) as { response_id: string } | undefined;

			// Insert new response FIRST (so the FK reference exists)
			db.prepare(
				`
				INSERT INTO responses (
					response_id, assessment_id, item_id, session_id, user_id,
					role, time_context, in_presence, rating_value, created_at,
					superseded_at, superseded_by_response_id
				)
				VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, NULL, NULL)
			`
			).run(
				responseId,
				assessmentId,
				input.item_id,
				sessionId,
				role,
				timeContext,
				inPresence ? 1 : 0,
				input.rating_value,
				now
			);

			// THEN mark old response as superseded (now the new response exists)
			if (existing) {
				db.prepare(
					`
					UPDATE responses
					SET superseded_at = ?, superseded_by_response_id = ?
					WHERE response_id = ?
				`
				).run(now, responseId, existing.response_id);
				supersededCount++;
			}

			responseIds.push(responseId);
		}
	});

	submitTransaction();

	return {
		response_count: responseIds.length,
		superseded_count: supersededCount,
		response_ids: responseIds
	};
}

/**
 * Get current (non-superseded) responses for an assessment and session.
 */
export function getCurrentResponses(assessmentId: string, sessionId: string): Response[] {
	const db = getDatabase();

	const rows = db
		.prepare(
			`
		SELECT response_id, assessment_id, item_id, session_id, user_id,
		       role, time_context, in_presence, rating_value, created_at,
		       superseded_at, superseded_by_response_id
		FROM responses
		WHERE assessment_id = ?
		  AND session_id = ?
		  AND superseded_at IS NULL
		ORDER BY created_at
	`
		)
		.all(assessmentId, sessionId) as Array<{
		response_id: string;
		assessment_id: string;
		item_id: string;
		session_id: string;
		user_id: string | null;
		role: string;
		time_context: string;
		in_presence: number;
		rating_value: number | null;
		created_at: string;
		superseded_at: string | null;
		superseded_by_response_id: string | null;
	}>;

	return rows.map((row) => ({
		...row,
		in_presence: Boolean(row.in_presence)
	}));
}

/**
 * Get all responses for an assessment (including superseded).
 * Useful for audit/history views.
 */
export function getAllResponses(assessmentId: string): Response[] {
	const db = getDatabase();

	const rows = db
		.prepare(
			`
		SELECT response_id, assessment_id, item_id, session_id, user_id,
		       role, time_context, in_presence, rating_value, created_at,
		       superseded_at, superseded_by_response_id
		FROM responses
		WHERE assessment_id = ?
		ORDER BY created_at
	`
		)
		.all(assessmentId) as Array<{
		response_id: string;
		assessment_id: string;
		item_id: string;
		session_id: string;
		user_id: string | null;
		role: string;
		time_context: string;
		in_presence: number;
		rating_value: number | null;
		created_at: string;
		superseded_at: string | null;
		superseded_by_response_id: string | null;
	}>;

	return rows.map((row) => ({
		...row,
		in_presence: Boolean(row.in_presence)
	}));
}

/**
 * Item statistics result.
 */
export interface ItemStats {
	item_id: string;
	item_key: string;
	short_label: string;
	n: number;
	mean: number;
	sd: number;
	min: number;
	max: number;
}

/**
 * Filter options for aggregating responses.
 */
export interface ResponseFilters {
	time_context?: string;
	role?: string;
	in_presence?: boolean;
}

/**
 * Get aggregated statistics for an assessment, grouped by item.
 * Per Ch.15.1: Calculates N, mean, SD, min, max per item.
 * Only includes current (non-superseded) responses.
 */
export function getAggregatedStatsByItem(
	assessmentId: string,
	filters: ResponseFilters = {}
): ItemStats[] {
	const db = getDatabase();

	// Build WHERE clause based on filters
	const conditions = ['r.assessment_id = ?', 'r.superseded_at IS NULL', 'r.rating_value IS NOT NULL'];
	const params: (string | number)[] = [assessmentId];

	if (filters.time_context) {
		conditions.push('r.time_context = ?');
		params.push(filters.time_context);
	}
	if (filters.role) {
		conditions.push('r.role = ?');
		params.push(filters.role);
	}
	if (filters.in_presence !== undefined) {
		conditions.push('r.in_presence = ?');
		params.push(filters.in_presence ? 1 : 0);
	}

	const whereClause = conditions.join(' AND ');

	// Query with SQLite aggregate functions
	// Note: SQLite doesn't have STDDEV, so we calculate manually with AVG and grouping
	const query = `
		SELECT
			r.item_id,
			i.item_key,
			i.short_label,
			COUNT(r.rating_value) as n,
			AVG(r.rating_value) as mean,
			MIN(r.rating_value) as min_val,
			MAX(r.rating_value) as max_val,
			-- For SD calculation, we need sum of squares
			SUM(r.rating_value * r.rating_value) as sum_sq,
			SUM(r.rating_value) as sum_val
		FROM responses r
		JOIN items i ON r.item_id = i.item_id
		WHERE ${whereClause}
		GROUP BY r.item_id
		ORDER BY i.short_label
	`;

	const rows = db.prepare(query).all(...params) as Array<{
		item_id: string;
		item_key: string;
		short_label: string;
		n: number;
		mean: number;
		min_val: number;
		max_val: number;
		sum_sq: number;
		sum_val: number;
	}>;

	return rows.map((row) => {
		// Calculate standard deviation
		// SD = sqrt(sum(x^2)/n - (sum(x)/n)^2)
		let sd = 0;
		if (row.n > 1) {
			const variance = row.sum_sq / row.n - (row.sum_val / row.n) ** 2;
			sd = Math.sqrt(Math.max(0, variance)); // Ensure no negative due to floating point
		}

		return {
			item_id: row.item_id,
			item_key: row.item_key,
			short_label: row.short_label,
			n: row.n,
			mean: row.mean,
			sd: sd,
			min: row.min_val,
			max: row.max_val
		};
	});
}

/**
 * Get total response count for an assessment (current, non-superseded).
 */
export function getResponseCount(assessmentId: string): number {
	const db = getDatabase();

	const row = db
		.prepare(
			`
		SELECT COUNT(DISTINCT session_id) as count
		FROM responses
		WHERE assessment_id = ?
		  AND superseded_at IS NULL
	`
		)
		.get(assessmentId) as { count: number } | undefined;

	return row?.count ?? 0;
}

/**
 * Get distinct roles that have responded to an assessment.
 */
export function getRespondentRoles(assessmentId: string): string[] {
	const db = getDatabase();

	const rows = db
		.prepare(
			`
		SELECT DISTINCT role
		FROM responses
		WHERE assessment_id = ?
		  AND superseded_at IS NULL
		ORDER BY role
	`
		)
		.all(assessmentId) as Array<{ role: string }>;

	return rows.map((r) => r.role);
}
