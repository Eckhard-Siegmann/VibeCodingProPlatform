import { getDatabase, generateId, nowIso } from '../db';

// ============================================================================
// Types
// ============================================================================

export interface ProblemWithViewType {
	problem_id: string;
	created_by_user_id: string;
	public_slug: string;
	private_slug: string;
	created_at: string;
	archived_at: string | null;
	current_major_version: number;
	current_readiness_state: string;
	current_action_state: string;
	view_type: 'public' | 'private';
}

export interface ProblemVersion {
	problem_version_id: string;
	problem_id: string;
	major_version: number;
	title: string;
	description: string;
	value_statement: string | null;
	repo_url_primary: string;
	repo_url_secondary: string | null;
	task_count: number;
	created_at: string;
	created_by_user_id: string;
	commit_message: string | null;
	is_current: boolean;
}

export interface Decision {
	decision_id: string;
	problem_id: string;
	major_version: number;
	minor_version: number | null;
	event_id: string | null;
	decision_type: string;
	decision_display_name: string;
	category: string;
	is_binding: boolean;
	actor_user_id: string;
	actor_display_name: string;
	authority_reference: string | null;
	rationale: string | null;
	created_at: string;
}

export interface AssessmentSummary {
	assessment_id: string;
	inventory_key: string;
	inventory_name: string;
	opened_at: string;
	closed_at: string | null;
	response_count: number;
}

// ============================================================================
// Row types (internal, for SQLite boolean conversion)
// ============================================================================

interface ProblemRow {
	problem_id: string;
	created_by_user_id: string;
	public_slug: string;
	private_slug: string;
	created_at: string;
	archived_at: string | null;
	current_major_version: number;
	current_readiness_state: string;
	current_action_state: string;
	view_type: 'public' | 'private';
}

interface ProblemVersionRow {
	problem_version_id: string;
	problem_id: string;
	major_version: number;
	title: string;
	description: string;
	value_statement: string | null;
	repo_url_primary: string;
	repo_url_secondary: string | null;
	task_count: number;
	created_at: string;
	created_by_user_id: string;
	commit_message: string | null;
	is_current: number;
}

interface DecisionRow {
	decision_id: string;
	problem_id: string;
	major_version: number;
	minor_version: number | null;
	event_id: string | null;
	decision_type: string;
	decision_display_name: string;
	category: string;
	is_binding: number;
	actor_user_id: string;
	actor_display_name: string;
	authority_reference: string | null;
	rationale: string | null;
	created_at: string;
}

interface AssessmentRow {
	assessment_id: string;
	inventory_key: string;
	inventory_name: string;
	opened_at: string;
	closed_at: string | null;
	response_count: number;
}

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Find a problem by slug (checks both public_slug and private_slug).
 * Returns the problem with view_type indicating which slug matched.
 */
export function findProblemBySlug(slug: string): ProblemWithViewType | null {
	const db = getDatabase();

	const row = db
		.prepare(
			`
		SELECT
			p.problem_id,
			p.created_by_user_id,
			p.public_slug,
			p.private_slug,
			p.created_at,
			p.archived_at,
			p.current_major_version,
			p.current_readiness_state,
			p.current_action_state,
			CASE
				WHEN p.public_slug = ? THEN 'public'
				WHEN p.private_slug = ? THEN 'private'
			END as view_type
		FROM problems p
		WHERE p.public_slug = ? OR p.private_slug = ?
		LIMIT 1
	`
		)
		.get(slug, slug, slug, slug) as ProblemRow | undefined;

	return row ?? null;
}

/**
 * Get all versions for a problem, ordered by major_version DESC.
 */
export function getProblemVersions(problemId: string): ProblemVersion[] {
	const db = getDatabase();

	const rows = db
		.prepare(
			`
		SELECT
			problem_version_id,
			problem_id,
			major_version,
			title,
			description,
			value_statement,
			repo_url_primary,
			repo_url_secondary,
			task_count,
			created_at,
			created_by_user_id,
			commit_message,
			is_current
		FROM problem_versions
		WHERE problem_id = ?
		ORDER BY major_version DESC
	`
		)
		.all(problemId) as ProblemVersionRow[];

	return rows.map((row) => ({
		...row,
		is_current: Boolean(row.is_current)
	}));
}

/**
 * Get the current (is_current=1) version for a problem.
 */
export function getCurrentVersion(problemId: string): ProblemVersion | null {
	const db = getDatabase();

	const row = db
		.prepare(
			`
		SELECT
			problem_version_id,
			problem_id,
			major_version,
			title,
			description,
			value_statement,
			repo_url_primary,
			repo_url_secondary,
			task_count,
			created_at,
			created_by_user_id,
			commit_message,
			is_current
		FROM problem_versions
		WHERE problem_id = ? AND is_current = 1
	`
		)
		.get(problemId) as ProblemVersionRow | undefined;

	if (!row) return null;

	return {
		...row,
		is_current: Boolean(row.is_current)
	};
}

/**
 * Get a specific version by problem ID and major version number.
 */
export function getProblemVersion(
	problemId: string,
	majorVersion: number
): ProblemVersion | null {
	const db = getDatabase();

	const row = db
		.prepare(
			`
		SELECT
			problem_version_id,
			problem_id,
			major_version,
			title,
			description,
			value_statement,
			repo_url_primary,
			repo_url_secondary,
			task_count,
			created_at,
			created_by_user_id,
			commit_message,
			is_current
		FROM problem_versions
		WHERE problem_id = ? AND major_version = ?
	`
		)
		.get(problemId, majorVersion) as ProblemVersionRow | undefined;

	if (!row) return null;

	return {
		...row,
		is_current: Boolean(row.is_current)
	};
}

/**
 * Get decision history for a problem, ordered by created_at DESC.
 * Joins with users and decision_type_catalog to get display names.
 */
export function getDecisionHistory(problemId: string): Decision[] {
	const db = getDatabase();

	const rows = db
		.prepare(
			`
		SELECT
			d.decision_id,
			d.problem_id,
			d.major_version,
			d.minor_version,
			d.event_id,
			d.decision_type,
			dtc.display_name as decision_display_name,
			dtc.category,
			d.is_binding,
			d.actor_user_id,
			u.display_name as actor_display_name,
			d.authority_reference,
			d.rationale,
			d.created_at
		FROM decisions d
		JOIN users u ON d.actor_user_id = u.user_id
		JOIN decision_type_catalog dtc ON d.decision_type = dtc.type_key
		WHERE d.problem_id = ?
		ORDER BY d.created_at DESC
	`
		)
		.all(problemId) as DecisionRow[];

	return rows.map((row) => ({
		...row,
		is_binding: Boolean(row.is_binding)
	}));
}

/**
 * Get assessments for a problem with response counts.
 */
export function getAssessmentsForProblem(problemId: string): AssessmentSummary[] {
	const db = getDatabase();

	const rows = db
		.prepare(
			`
		SELECT
			a.assessment_id,
			i.inventory_key,
			i.name as inventory_name,
			a.opened_at,
			a.closed_at,
			(SELECT COUNT(*) FROM responses r
			 WHERE r.assessment_id = a.assessment_id
			 AND r.superseded_at IS NULL) as response_count
		FROM assessments a
		JOIN inventories i ON a.inventory_id = i.inventory_id
		WHERE a.problem_id = ?
		ORDER BY a.opened_at DESC
	`
		)
		.all(problemId) as AssessmentRow[];

	return rows;
}

// ============================================================================
// Mutation Functions
// ============================================================================

/**
 * Update problem version fields (only works in draft state).
 */
export function updateProblemVersion(
	versionId: string,
	data: Partial<{
		title: string;
		description: string;
		value_statement: string;
		repo_url_primary: string;
		repo_url_secondary: string | null;
		task_count: number;
	}>
): { success: boolean; updated_fields: string[] } {
	const db = getDatabase();

	// Build dynamic UPDATE query
	const fields: string[] = [];
	const values: unknown[] = [];

	if (data.title !== undefined) {
		fields.push('title = ?');
		values.push(data.title);
	}
	if (data.description !== undefined) {
		fields.push('description = ?');
		values.push(data.description);
	}
	if (data.value_statement !== undefined) {
		fields.push('value_statement = ?');
		values.push(data.value_statement);
	}
	if (data.repo_url_primary !== undefined) {
		fields.push('repo_url_primary = ?');
		values.push(data.repo_url_primary);
	}
	if (data.repo_url_secondary !== undefined) {
		fields.push('repo_url_secondary = ?');
		values.push(data.repo_url_secondary);
	}
	if (data.task_count !== undefined) {
		fields.push('task_count = ?');
		values.push(data.task_count);
	}

	if (fields.length === 0) {
		return { success: true, updated_fields: [] };
	}

	values.push(versionId);

	const result = db
		.prepare(`UPDATE problem_versions SET ${fields.join(', ')} WHERE problem_version_id = ?`)
		.run(...values);

	return {
		success: result.changes > 0,
		updated_fields: Object.keys(data).filter((k) => data[k as keyof typeof data] !== undefined)
	};
}

/**
 * Submit a problem (transitions draft → submitted).
 */
export function submitProblem(
	problemId: string,
	majorVersion: number,
	actorUserId: string
): { success: boolean; decision_id: string } {
	const db = getDatabase();
	const decisionId = generateId();
	const now = nowIso();

	const transaction = db.transaction(() => {
		// Create decision
		db.prepare(
			`
			INSERT INTO decisions (
				decision_id, problem_id, major_version, decision_type,
				is_binding, actor_user_id, created_at
			) VALUES (?, ?, ?, 'problem_submitted', 1, ?, ?)
		`
		).run(decisionId, problemId, majorVersion, actorUserId, now);

		// Update problem state
		db.prepare(
			`
			UPDATE problems
			SET current_readiness_state = 'submitted'
			WHERE problem_id = ?
		`
		).run(problemId);
	});

	transaction();

	return { success: true, decision_id: decisionId };
}

/**
 * Create a new major version (copies current content).
 */
export function createNewVersion(
	problemId: string,
	actorUserId: string,
	commitMessage?: string
): { success: boolean; version_id: string; major_version: number } {
	const db = getDatabase();
	const versionId = generateId();
	const decisionId = generateId();
	const now = nowIso();

	// Get current version
	const currentVersion = getCurrentVersion(problemId);
	if (!currentVersion) {
		throw new Error('No current version found');
	}

	const newMajorVersion = currentVersion.major_version + 1;

	const transaction = db.transaction(() => {
		// Mark old version as not current
		db.prepare(
			`
			UPDATE problem_versions
			SET is_current = 0
			WHERE problem_id = ? AND is_current = 1
		`
		).run(problemId);

		// Create new version
		db.prepare(
			`
			INSERT INTO problem_versions (
				problem_version_id, problem_id, major_version,
				title, description, value_statement,
				repo_url_primary, repo_url_secondary, task_count,
				created_at, created_by_user_id, commit_message, is_current
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
		`
		).run(
			versionId,
			problemId,
			newMajorVersion,
			currentVersion.title,
			currentVersion.description,
			currentVersion.value_statement,
			currentVersion.repo_url_primary,
			currentVersion.repo_url_secondary,
			currentVersion.task_count,
			now,
			actorUserId,
			commitMessage ?? null
		);

		// Update problem
		db.prepare(
			`
			UPDATE problems
			SET current_major_version = ?,
			    current_readiness_state = 'draft'
			WHERE problem_id = ?
		`
		).run(newMajorVersion, problemId);

		// Create decision
		db.prepare(
			`
			INSERT INTO decisions (
				decision_id, problem_id, major_version, decision_type,
				is_binding, actor_user_id, rationale, created_at
			) VALUES (?, ?, ?, 'problem_updated', 1, ?, ?, ?)
		`
		).run(decisionId, problemId, newMajorVersion, actorUserId, commitMessage ?? null, now);
	});

	transaction();

	return { success: true, version_id: versionId, major_version: newMajorVersion };
}

/**
 * Clone a problem (creates new problem with new slugs).
 */
export function cloneProblem(
	sourceProblemId: string,
	actorUserId: string
): { success: boolean; problem_id: string; public_slug: string; private_slug: string } {
	const db = getDatabase();
	const newProblemId = generateId();
	const newVersionId = generateId();
	const decisionId = generateId();
	const now = nowIso();

	// Get source problem and version
	const sourceVersion = getCurrentVersion(sourceProblemId);
	if (!sourceVersion) {
		throw new Error('Source problem has no current version');
	}

	// Generate new slugs (MVP: increment numeric pattern)
	const maxSlugRow = db
		.prepare(
			`
		SELECT MAX(CAST(public_slug AS INTEGER)) as max_slug
		FROM problems
		WHERE public_slug GLOB '[0-9]*'
	`
		)
		.get() as { max_slug: number | null } | undefined;

	const nextNum = (maxSlugRow?.max_slug ?? 0) + 1;
	const publicSlug = String(nextNum);
	const privateSlug = String(nextNum) + String(nextNum).slice(-1); // e.g., 4 -> 44, 44 -> 444

	const transaction = db.transaction(() => {
		// Create new problem
		db.prepare(
			`
			INSERT INTO problems (
				problem_id, created_by_user_id, public_slug, private_slug,
				created_at, current_major_version, current_readiness_state, current_action_state
			) VALUES (?, ?, ?, ?, ?, 1, 'draft', 'backlog')
		`
		).run(newProblemId, actorUserId, publicSlug, privateSlug, now);

		// Create new version
		db.prepare(
			`
			INSERT INTO problem_versions (
				problem_version_id, problem_id, major_version,
				title, description, value_statement,
				repo_url_primary, repo_url_secondary, task_count,
				created_at, created_by_user_id, commit_message, is_current
			) VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
		`
		).run(
			newVersionId,
			newProblemId,
			sourceVersion.title + ' (Clone)',
			sourceVersion.description,
			sourceVersion.value_statement,
			sourceVersion.repo_url_primary,
			sourceVersion.repo_url_secondary,
			sourceVersion.task_count,
			now,
			actorUserId,
			'Cloned from ' + sourceProblemId
		);

		// Create decision on new problem
		db.prepare(
			`
			INSERT INTO decisions (
				decision_id, problem_id, major_version, decision_type,
				is_binding, actor_user_id, rationale, created_at
			) VALUES (?, ?, 1, 'problem_cloned', 1, ?, ?, ?)
		`
		).run(decisionId, newProblemId, actorUserId, 'Cloned from ' + sourceProblemId, now);
	});

	transaction();

	return {
		success: true,
		problem_id: newProblemId,
		public_slug: publicSlug,
		private_slug: privateSlug
	};
}

/**
 * Find a problem by its ID.
 */
export function findProblemById(problemId: string): ProblemWithViewType | null {
	const db = getDatabase();

	const row = db
		.prepare(
			`
		SELECT
			problem_id,
			created_by_user_id,
			public_slug,
			private_slug,
			created_at,
			archived_at,
			current_major_version,
			current_readiness_state,
			current_action_state,
			'public' as view_type
		FROM problems
		WHERE problem_id = ?
	`
		)
		.get(problemId) as ProblemRow | undefined;

	return row ?? null;
}
