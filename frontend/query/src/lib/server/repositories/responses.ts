import { getDatabase, generateId, nowIso } from '../db';

export interface Response {
	response_id: string;
	assessment_id: string;
	item_id: string;
	user_id: string;
	role: string;
	time_context: string;
	in_presence: boolean;
	rating_value: number | null;
	review_weight_key: string | null;
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
 * - user_id is NOT NULL (Ch.9.3: mandatory authentication)
 * - review_weight_key set server-side for review assessments (Ch.14.2)
 */
export function submitResponses(
	assessmentId: string,
	userId: string,
	role: string,
	timeContext: string,
	inPresence: boolean,
	responses: ResponseInput[],
	reviewWeightKey: string | null = null
): SubmissionResult {
	const db = getDatabase();
	const now = nowIso();
	const responseIds: string[] = [];
	let supersededCount = 0;

	// Use transaction for atomicity
	const submitTransaction = db.transaction(() => {
		for (const input of responses) {
			const responseId = generateId();

			// Check for existing non-superseded response for this assessment/user/item
			const existing = db
				.prepare(
					`
				SELECT response_id
				FROM responses
				WHERE assessment_id = ?
				  AND user_id = ?
				  AND item_id = ?
				  AND superseded_at IS NULL
			`
				)
				.get(assessmentId, userId, input.item_id) as { response_id: string } | undefined;

			// Insert new response FIRST (so the FK reference exists)
			db.prepare(
				`
				INSERT INTO responses (
					response_id, assessment_id, item_id, user_id,
					role, time_context, in_presence, rating_value,
					review_weight_key, created_at,
					superseded_at, superseded_by_response_id
				)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL)
			`
			).run(
				responseId,
				assessmentId,
				input.item_id,
				userId,
				role,
				timeContext,
				inPresence ? 1 : 0,
				input.rating_value,
				reviewWeightKey,
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
 * Get current (non-superseded) responses for an assessment and user.
 */
export function getCurrentResponses(assessmentId: string, userId: string): Response[] {
	const db = getDatabase();

	const rows = db
		.prepare(
			`
		SELECT response_id, assessment_id, item_id, user_id,
		       role, time_context, in_presence, rating_value,
		       review_weight_key, created_at,
		       superseded_at, superseded_by_response_id
		FROM responses
		WHERE assessment_id = ?
		  AND user_id = ?
		  AND superseded_at IS NULL
		ORDER BY created_at
	`
		)
		.all(assessmentId, userId) as Array<{
		response_id: string;
		assessment_id: string;
		item_id: string;
		user_id: string;
		role: string;
		time_context: string;
		in_presence: number;
		rating_value: number | null;
		review_weight_key: string | null;
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
		SELECT response_id, assessment_id, item_id, user_id,
		       role, time_context, in_presence, rating_value,
		       review_weight_key, created_at,
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
		user_id: string;
		role: string;
		time_context: string;
		in_presence: number;
		rating_value: number | null;
		review_weight_key: string | null;
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
 *
 * Items are bounded by inventory definition (typically 6-8 items, max ~20).
 * No pagination needed — see results_analytics_design.md §"Per-Item Results Table"
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
 * Get total response count for an assessment (current, non-superseded, distinct users).
 */
export function getResponseCount(assessmentId: string): number {
	const db = getDatabase();

	const row = db
		.prepare(
			`
		SELECT COUNT(DISTINCT user_id) as count
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

/**
 * Determine review_weight_key based on time_context and role.
 * Per Ch.14.2 and Ch.9.5.5:
 * - agent role overrides time_context → 'agent_review' (0.5x)
 * - time_context 'review' → 'live_review' (1.0x)
 * - time_context 'post_event' or 'late_reflection' → 'post_event_review' (1.5x)
 * - non-review assessments → null
 */
export function determineReviewWeightKey(
	inventoryKey: string,
	role: string,
	timeContext: string
): string | null {
	// Only review assessments get weight keys
	if (inventoryKey !== 'review_assessment') {
		return null;
	}

	// Agent role overrides time context
	if (role === 'agent') {
		return 'agent_review';
	}

	// Map time context to weight key
	switch (timeContext) {
		case 'review':
			return 'live_review';
		case 'post_event':
		case 'late_reflection':
			return 'post_event_review';
		default:
			return 'live_review'; // Fallback for unexpected time contexts
	}
}

/**
 * Get weighted aggregated statistics for review results across an event.
 * Per Ch.15.4.7: Event-level review summary for moderator dashboard.
 * Applies review_weight_catalog multipliers.
 */
export interface EventReviewResult {
	problem_id: string;
	problem_title: string;
	problem_slug: string;
	assessment_id: string;
	response_count: number;
	weighted_average: number;
	item_means: number[];
	rank: number;
}

export function getEventReviewResults(eventId: string): EventReviewResult[] {
	const db = getDatabase();

	// Meta items excluded from overall score per Ch.15.4.7
	const META_ITEM_KEYS = ['engagement_intensity', 'cognitive_ease'];

	// Find all review assessments for this event (closed ones)
	const assessments = db
		.prepare(
			`
		SELECT
			a.assessment_id,
			a.problem_id,
			pv.title as problem_title,
			p.slug as problem_slug
		FROM assessments a
		JOIN inventories inv ON a.inventory_id = inv.inventory_id
		JOIN problems p ON a.problem_id = p.problem_id
		JOIN problem_versions pv ON a.problem_id = pv.problem_id AND a.major_version = pv.major_version
		WHERE a.event_id = ?
		  AND inv.inventory_key = 'review_assessment'
		  AND a.closed_at IS NOT NULL
		ORDER BY a.closed_at
	`
		)
		.all(eventId) as Array<{
		assessment_id: string;
		problem_id: string;
		problem_title: string;
		problem_slug: string;
	}>;

	if (assessments.length === 0) return [];

	const results: Omit<EventReviewResult, 'rank'>[] = [];

	for (const assessment of assessments) {
		// Get per-item weighted stats
		const itemStats = db
			.prepare(
				`
			SELECT
				i.item_key,
				i.short_label,
				COUNT(r.rating_value) as n,
				SUM(r.rating_value * COALESCE(rwc.weight_multiplier, 1.0)) as weighted_sum,
				SUM(COALESCE(rwc.weight_multiplier, 1.0)) as weight_total
			FROM responses r
			JOIN items i ON r.item_id = i.item_id
			LEFT JOIN review_weight_catalog rwc ON r.review_weight_key = rwc.weight_key
			WHERE r.assessment_id = ?
			  AND r.superseded_at IS NULL
			  AND r.rating_value IS NOT NULL
			GROUP BY i.item_key
			ORDER BY i.short_label
		`
			)
			.all(assessment.assessment_id) as Array<{
			item_key: string;
			short_label: string;
			n: number;
			weighted_sum: number;
			weight_total: number;
		}>;

		// Get distinct reviewer count
		const countRow = db
			.prepare(
				`
			SELECT COUNT(DISTINCT user_id) as count
			FROM responses
			WHERE assessment_id = ?
			  AND superseded_at IS NULL
		`
			)
			.get(assessment.assessment_id) as { count: number };

		// Calculate per-item weighted means
		const scoringItems: number[] = [];
		const allItemMeans: number[] = [];

		for (const item of itemStats) {
			const weightedMean = item.weight_total > 0 ? item.weighted_sum / item.weight_total : 0;
			allItemMeans.push(weightedMean);

			// Exclude meta items from overall score
			if (!META_ITEM_KEYS.includes(item.item_key)) {
				scoringItems.push(weightedMean);
			}
		}

		// Overall weighted average (mean of scoring item means)
		const weightedAverage =
			scoringItems.length > 0
				? scoringItems.reduce((sum, v) => sum + v, 0) / scoringItems.length
				: 0;

		results.push({
			problem_id: assessment.problem_id,
			problem_title: assessment.problem_title,
			problem_slug: assessment.problem_slug,
			assessment_id: assessment.assessment_id,
			response_count: countRow.count,
			weighted_average: Math.round(weightedAverage * 100) / 100,
			item_means: allItemMeans.map((m) => Math.round(m * 100) / 100)
		});
	}

	// Sort by weighted_average descending and assign ranks
	results.sort((a, b) => b.weighted_average - a.weighted_average);

	// Safety cap: return at most 21 results so UI can detect overflow (>20)
	// per moderator_dashboard_design.md §"Review Results Summary → List Bounds"
	const capped = results.slice(0, 21);

	return capped.map((r, i) => ({
		...r,
		rank: i + 1
	}));
}

/**
 * Get aggregated statistics for pitch results across an event.
 * Per Ch.15 (Event-Level Pitch Results): simple averages, no weighting,
 * no ranking, sorted by pitch order (queue position).
 */
export interface EventPitchResult {
	problem_id: string;
	problem_title: string;
	problem_slug: string;
	assessment_id: string;
	response_count: number;
	overall_average: number;
	item_means: number[];
}

export function getEventPitchResults(eventId: string): EventPitchResult[] {
	const db = getDatabase();

	// Find all closed pitch assessments for this event
	const assessments = db
		.prepare(
			`
		SELECT
			a.assessment_id,
			a.problem_id,
			pv.title as problem_title,
			p.slug as problem_slug,
			COALESCE(epq.position_index, 999) as position_index
		FROM assessments a
		JOIN inventories inv ON a.inventory_id = inv.inventory_id
		JOIN problems p ON a.problem_id = p.problem_id
		JOIN problem_versions pv ON a.problem_id = pv.problem_id AND a.major_version = pv.major_version
		LEFT JOIN event_problem_queue epq ON a.event_id = epq.event_id AND a.problem_id = epq.problem_id
		WHERE a.event_id = ?
		  AND inv.inventory_key = 'pitch_assessment'
		  AND a.closed_at IS NOT NULL
		ORDER BY COALESCE(epq.position_index, 999), a.opened_at
	`
		)
		.all(eventId) as Array<{
		assessment_id: string;
		problem_id: string;
		problem_title: string;
		problem_slug: string;
		position_index: number;
	}>;

	if (assessments.length === 0) return [];

	const results: EventPitchResult[] = [];

	for (const assessment of assessments) {
		// Get per-item simple (unweighted) stats
		const itemStats = db
			.prepare(
				`
			SELECT
				i.item_key,
				i.short_label,
				COUNT(r.rating_value) as n,
				AVG(r.rating_value) as mean_val
			FROM responses r
			JOIN items i ON r.item_id = i.item_id
			WHERE r.assessment_id = ?
			  AND r.superseded_at IS NULL
			  AND r.rating_value IS NOT NULL
			GROUP BY i.item_key
			ORDER BY i.short_label
		`
			)
			.all(assessment.assessment_id) as Array<{
			item_key: string;
			short_label: string;
			n: number;
			mean_val: number;
		}>;

		// Get distinct respondent count
		const countRow = db
			.prepare(
				`
			SELECT COUNT(DISTINCT user_id) as count
			FROM responses
			WHERE assessment_id = ?
			  AND superseded_at IS NULL
		`
			)
			.get(assessment.assessment_id) as { count: number };

		// Calculate per-item means (all items — no meta exclusion for pitch)
		const itemMeans = itemStats.map((item) => Math.round(item.mean_val * 100) / 100);

		// Overall average = mean of per-item means
		const overallAverage =
			itemMeans.length > 0
				? Math.round((itemMeans.reduce((sum, v) => sum + v, 0) / itemMeans.length) * 100) / 100
				: 0;

		results.push({
			problem_id: assessment.problem_id,
			problem_title: assessment.problem_title,
			problem_slug: assessment.problem_slug,
			assessment_id: assessment.assessment_id,
			response_count: countRow.count,
			overall_average: overallAverage,
			item_means: itemMeans
		});
	}

	// Sorted by pitch order (already sorted by position_index in SQL)
	// Safety cap: return at most 21 results so UI can detect overflow (>20)
	// per moderator_dashboard_design.md §"Pitch Results Summary → List Bounds"
	return results.slice(0, 21);
}
