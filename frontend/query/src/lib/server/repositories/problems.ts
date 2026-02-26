import { getDatabase, generateId, nowIso } from '../db';

// ============================================================================
// Types
// ============================================================================

export interface ProblemWithViewType {
	problem_id: string;
	created_by_user_id: string;
	deputy_owner_user_id: string | null;
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
	deputy_owner_user_id: string | null;
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
			p.deputy_owner_user_id,
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
 * Create a new problem with version 1 and a 'problem_created' decision.
 * All three inserts happen in a single transaction.
 */
export function createProblem(
	actorUserId: string,
	data: {
		title: string;
		description: string;
		value_statement?: string;
		problem_type?: string;
		repo_url_primary: string;
		repo_url_secondary?: string;
		task_count: number;
	}
): { success: boolean; problem_id: string; public_slug: string; private_slug: string } {
	const db = getDatabase();
	const problemId = generateId();
	const versionId = generateId();
	const decisionId = generateId();
	const now = nowIso();

	// Generate slugs (same pattern as cloneProblem)
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
	const privateSlug = String(nextNum) + String(nextNum).slice(-1);

	const transaction = db.transaction(() => {
		db.prepare(
			`
			INSERT INTO problems (
				problem_id, created_by_user_id, problem_type, public_slug, private_slug,
				created_at, current_major_version, current_readiness_state, current_action_state
			) VALUES (?, ?, ?, ?, ?, ?, 1, 'draft', 'backlog')
		`
		).run(problemId, actorUserId, data.problem_type ?? 'greenfield', publicSlug, privateSlug, now);

		db.prepare(
			`
			INSERT INTO problem_versions (
				problem_version_id, problem_id, major_version,
				title, description, value_statement,
				repo_url_primary, repo_url_secondary, task_count,
				created_at, created_by_user_id, commit_message, is_current
			) VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, 'Initial version', 1)
		`
		).run(
			versionId,
			problemId,
			data.title,
			data.description,
			data.value_statement ?? null,
			data.repo_url_primary,
			data.repo_url_secondary ?? null,
			data.task_count,
			now,
			actorUserId
		);

		db.prepare(
			`
			INSERT INTO decisions (
				decision_id, problem_id, major_version, decision_type,
				is_binding, actor_user_id, created_at
			) VALUES (?, ?, 1, 'problem_created', 1, ?, ?)
		`
		).run(decisionId, problemId, actorUserId, now);
	});

	transaction();

	return {
		success: true,
		problem_id: problemId,
		public_slug: publicSlug,
		private_slug: privateSlug
	};
}

/**
 * Get all problem type options from catalog.
 */
export function getProblemTypes(): Array<{ type_key: string; display_name: string; description: string | null }> {
	const db = getDatabase();
	return db
		.prepare(
			`SELECT type_key, display_name, description
			 FROM problem_type_catalog
			 WHERE is_active = 1
			 ORDER BY sort_order`
		)
		.all() as Array<{ type_key: string; display_name: string; description: string | null }>;
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
			deputy_owner_user_id,
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

// ============================================================================
// Repository Snapshot Functions (Ch.5.2, Ch.19.3.14)
// ============================================================================

export interface RepoSnapshot {
	snapshot_id: string;
	problem_id: string;
	major_version: number;
	minor_version: number;
	head_commit_sha: string;
	first_seen_at: string;
}

/**
 * Get the latest snapshot for a problem version.
 * Returns the most recent minor version entry (highest minor_version).
 */
export function getLatestSnapshot(
	problemId: string,
	majorVersion: number
): RepoSnapshot | null {
	const db = getDatabase();

	const row = db
		.prepare(
			`
		SELECT snapshot_id, problem_id, major_version, minor_version, head_commit_sha, first_seen_at
		FROM problem_repo_snapshots
		WHERE problem_id = ? AND major_version = ?
		ORDER BY minor_version DESC
		LIMIT 1
	`
		)
		.get(problemId, majorVersion) as RepoSnapshot | undefined;

	return row ?? null;
}

/**
 * Get all snapshots for a problem version, ordered by minor version.
 */
export function getSnapshotsForVersion(
	problemId: string,
	majorVersion: number
): RepoSnapshot[] {
	const db = getDatabase();

	return db
		.prepare(
			`
		SELECT snapshot_id, problem_id, major_version, minor_version, head_commit_sha, first_seen_at
		FROM problem_repo_snapshots
		WHERE problem_id = ? AND major_version = ?
		ORDER BY minor_version ASC
	`
		)
		.all(problemId, majorVersion) as RepoSnapshot[];
}

/**
 * Get or create a snapshot for a commit hash.
 * Per Ch.5.2: If the hash already exists for this major version, reuse it.
 * Otherwise, create a new minor version with auto-incremented index.
 */
export function getOrCreateSnapshot(
	problemId: string,
	majorVersion: number,
	headCommitSha: string
): RepoSnapshot {
	const db = getDatabase();

	// Check if this commit hash already has a snapshot
	const existing = db
		.prepare(
			`
		SELECT snapshot_id, problem_id, major_version, minor_version, head_commit_sha, first_seen_at
		FROM problem_repo_snapshots
		WHERE problem_id = ? AND major_version = ? AND head_commit_sha = ?
	`
		)
		.get(problemId, majorVersion, headCommitSha) as RepoSnapshot | undefined;

	if (existing) return existing;

	// Get next minor version number
	const maxRow = db
		.prepare(
			`
		SELECT MAX(minor_version) as max_minor
		FROM problem_repo_snapshots
		WHERE problem_id = ? AND major_version = ?
	`
		)
		.get(problemId, majorVersion) as { max_minor: number | null } | undefined;

	const nextMinor = (maxRow?.max_minor ?? 0) + 1;
	const snapshotId = generateId();
	const now = nowIso();

	db.prepare(
		`
		INSERT INTO problem_repo_snapshots (
			snapshot_id, problem_id, major_version, minor_version, head_commit_sha, first_seen_at
		) VALUES (?, ?, ?, ?, ?, ?)
	`
	).run(snapshotId, problemId, majorVersion, nextMinor, headCommitSha, now);

	return {
		snapshot_id: snapshotId,
		problem_id: problemId,
		major_version: majorVersion,
		minor_version: nextMinor,
		head_commit_sha: headCommitSha,
		first_seen_at: now
	};
}

// ============================================================================
// Backlog Listing Functions (TICKET-29, Ch.12.8)
// ============================================================================

export interface ProblemBacklogItem {
	problem_id: string;
	slug: string;
	title: string;
	owner_display_name: string;
	readiness_state: string;
	action_state: string;
	problem_type: string;
	short_description: string;
	current_version: number;
	star_count: number;
	review_count: number;
	event_title: string | null;
	event_slug: string | null;
	created_at: string;
}

export interface PaginatedResult<T> {
	items: T[];
	pagination: {
		page: number;
		pageSize: number;
		totalItems: number;
		totalPages: number;
	};
}

export interface BacklogOptions {
	page: number;
	pageSize: number;
	search: string;
	readiness: string;
	action: string;
	type: string;
	location: string;
	sort: string;
	includeDraft: boolean;
	includeRejected: boolean;
	includeDropped: boolean;
	ownerUserId?: string; // Filter to specific user's problems (owner=me)
}

/**
 * Get paginated problem backlog with filtering, search, and sorting.
 * Spec: Ch.12.8, Ch.12.10
 *
 * Visibility rules (Ch.12.8.1):
 * - Default: exclude draft, rejected readiness states and dropped action state
 * - Moderators can opt-in to see these via includeDraft/includeRejected/includeDropped
 */
export function getProblemsBacklog(opts: BacklogOptions): PaginatedResult<ProblemBacklogItem> {
	const db = getDatabase();

	const effectivePageSize = Math.min(Math.max(opts.pageSize, 1), 100);
	const effectivePage = Math.max(opts.page, 1);
	const offset = (effectivePage - 1) * effectivePageSize;

	// Build WHERE conditions
	const conditions: string[] = ['p.archived_at IS NULL'];
	const params: unknown[] = [];

	// Owner filter (dashboard "View All" link: /problems?owner=me)
	if (opts.ownerUserId) {
		conditions.push('p.created_by_user_id = ?');
		params.push(opts.ownerUserId);
	}

	// Visibility rules — readiness
	if (opts.readiness !== 'all') {
		conditions.push('p.current_readiness_state = ?');
		params.push(opts.readiness);
	} else {
		// Default: exclude draft and rejected unless moderator opted in
		const excludedReadiness: string[] = [];
		if (!opts.includeDraft) excludedReadiness.push('draft');
		if (!opts.includeRejected) excludedReadiness.push('rejected');
		if (excludedReadiness.length > 0) {
			conditions.push(`p.current_readiness_state NOT IN (${excludedReadiness.map(() => '?').join(', ')})`);
			params.push(...excludedReadiness);
		}
	}

	// Visibility rules — action
	if (opts.action !== 'all') {
		conditions.push('p.current_action_state = ?');
		params.push(opts.action);
	} else {
		if (!opts.includeDropped) {
			conditions.push("p.current_action_state != 'dropped'");
		}
	}

	// Problem type filter
	if (opts.type !== 'all') {
		conditions.push('p.problem_type = ?');
		params.push(opts.type);
	}

	// Location filter — problems associated with events at a specific location
	if (opts.location !== 'all') {
		conditions.push(`EXISTS (
			SELECT 1 FROM event_problem_queue epq
			JOIN events ev ON ev.event_id = epq.event_id
			JOIN rooms rm ON rm.room_id = ev.room_id
			JOIN locations loc ON loc.location_id = rm.location_id
			WHERE epq.problem_id = p.problem_id
			AND loc.city = ? COLLATE NOCASE
		)`);
		params.push(opts.location);
	}

	// Search — title, description, owner name
	if (opts.search.length >= 2) {
		conditions.push('(pv.title LIKE ? COLLATE NOCASE OR pv.description LIKE ? COLLATE NOCASE OR u.display_name LIKE ? COLLATE NOCASE)');
		const like = `%${opts.search}%`;
		params.push(like, like, like);
	}

	const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

	// Sort
	let orderBy: string;
	switch (opts.sort) {
		case 'oldest':
			orderBy = 'p.created_at ASC';
			break;
		case 'most_reviewed':
			orderBy = 'review_count DESC, p.created_at DESC';
			break;
		case 'alpha':
			orderBy = 'pv.title ASC COLLATE NOCASE';
			break;
		default: // newest
			orderBy = 'p.created_at DESC';
	}

	// Count query (separate for performance)
	const countParams = [...params];
	const countSql = `
		SELECT COUNT(*) AS total
		FROM problems p
		JOIN problem_versions pv ON pv.problem_id = p.problem_id AND pv.is_current = 1
		JOIN users u ON u.user_id = p.created_by_user_id
		${whereClause}
	`;
	const countRow = db.prepare(countSql).get(...countParams) as { total: number };
	const totalItems = countRow.total;
	const totalPages = Math.max(1, Math.ceil(totalItems / effectivePageSize));

	// Data query
	const dataSql = `
		SELECT
			p.problem_id,
			p.public_slug AS slug,
			pv.title,
			u.display_name AS owner_display_name,
			p.current_readiness_state AS readiness_state,
			p.current_action_state AS action_state,
			COALESCE(p.problem_type, 'greenfield') AS problem_type,
			SUBSTR(pv.description, 1, 120) AS short_description,
			p.current_major_version AS current_version,
			COALESCE((
				SELECT COUNT(*) FROM star_awards sa
				WHERE sa.problem_id = p.problem_id
			), 0) AS star_count,
			COALESCE((
				SELECT COUNT(DISTINCT r.user_id)
				FROM responses r
				JOIN assessments a ON a.assessment_id = r.assessment_id
				WHERE a.problem_id = p.problem_id
				AND r.superseded_at IS NULL
			), 0) AS review_count,
			(
				SELECT ev.title FROM event_problem_queue epq
				JOIN events ev ON ev.event_id = epq.event_id
				WHERE epq.problem_id = p.problem_id
				ORDER BY ev.starts_at DESC LIMIT 1
			) AS event_title,
			(
				SELECT ev.slug FROM event_problem_queue epq
				JOIN events ev ON ev.event_id = epq.event_id
				WHERE epq.problem_id = p.problem_id
				ORDER BY ev.starts_at DESC LIMIT 1
			) AS event_slug,
			p.created_at
		FROM problems p
		JOIN problem_versions pv ON pv.problem_id = p.problem_id AND pv.is_current = 1
		JOIN users u ON u.user_id = p.created_by_user_id
		${whereClause}
		ORDER BY ${orderBy}
		LIMIT ? OFFSET ?
	`;

	const dataParams = [...params, effectivePageSize, offset];
	const items = db.prepare(dataSql).all(...dataParams) as ProblemBacklogItem[];

	return {
		items,
		pagination: {
			page: effectivePage,
			pageSize: effectivePageSize,
			totalItems,
			totalPages
		}
	};
}

// ============================================================================
// Pending Review Backlog (TICKET-33: Moderator Dashboard scalable list)
// ============================================================================

export interface PendingBacklogItem {
	problem_id: string;
	slug: string;
	title: string;
	owner_display_name: string;
	current_readiness_state: string;
	problem_type: string;
	created_at: string;
}

export interface PendingBacklogOptions {
	limit: number;
	offset: number;
	type?: string;  // problem_type filter
	age?: string;   // 'urgent' (>7d) | 'recent' (<3d) | '' (all)
}

export interface PendingBacklogResult {
	items: PendingBacklogItem[];
	totalItems: number;
}

/**
 * Get pending review backlog with filtering and "Load More" pagination.
 * Spec: Ch.12.5, Ch.12.10 | moderator_dashboard_design.md §Pending Review Backlog
 *
 * Returns problems with readiness_state IN ('submitted', 'needs_changes')
 * and action_state = 'backlog', sorted oldest-first (FIFO).
 */
export function getPendingReviewBacklog(opts: PendingBacklogOptions): PendingBacklogResult {
	const db = getDatabase();

	const effectiveLimit = Math.min(Math.max(opts.limit, 1), 100);
	const effectiveOffset = Math.max(opts.offset, 0);

	const conditions: string[] = [
		"p.current_readiness_state IN ('submitted', 'needs_changes')",
		"p.current_action_state = 'backlog'"
	];
	const params: unknown[] = [];

	// Problem type filter
	if (opts.type && opts.type !== 'all') {
		conditions.push('p.problem_type = ?');
		params.push(opts.type);
	}

	// Age filter
	if (opts.age === 'urgent') {
		conditions.push("p.created_at < datetime('now', '-7 days')");
	} else if (opts.age === 'recent') {
		conditions.push("p.created_at > datetime('now', '-3 days')");
	}

	const whereClause = 'WHERE ' + conditions.join(' AND ');

	// Count query
	const countSql = `
		SELECT COUNT(*) AS cnt
		FROM problems p
		${whereClause}
	`;
	const countRow = db.prepare(countSql).get(...params) as { cnt: number };
	const totalItems = countRow.cnt;

	// Data query
	const dataSql = `
		SELECT
			p.problem_id,
			p.public_slug AS slug,
			pv.title,
			u.display_name AS owner_display_name,
			p.current_readiness_state,
			p.problem_type,
			p.created_at
		FROM problems p
		JOIN problem_versions pv ON p.problem_id = pv.problem_id AND pv.is_current = 1
		JOIN users u ON p.created_by_user_id = u.user_id
		${whereClause}
		ORDER BY p.created_at ASC
		LIMIT ? OFFSET ?
	`;
	const items = db.prepare(dataSql).all(...params, effectiveLimit, effectiveOffset) as PendingBacklogItem[];

	return { items, totalItems };
}

/**
 * Get all locations that have hosted events (for filter dropdowns).
 */
export function getLocations(): Array<{ value: string; label: string }> {
	const db = getDatabase();
	const rows = db.prepare(`
		SELECT DISTINCT l.city AS value, l.name AS label
		FROM locations l
		JOIN rooms r ON r.location_id = l.location_id
		JOIN events e ON e.room_id = r.room_id
		ORDER BY l.city ASC
	`).all() as Array<{ value: string; label: string }>;

	return rows;
}
