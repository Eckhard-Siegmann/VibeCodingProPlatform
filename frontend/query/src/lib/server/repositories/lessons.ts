import { getDatabase, generateId, nowIso } from '../db';

// ============================================================================
// Types
// ============================================================================

export interface LessonLearned {
	lesson_id: string;
	problem_id: string;
	event_id: string | null;
	user_id: string;
	content: string;
	category: string | null;
	tags: string[];
	valuable: boolean;
	created_at: string;
	edited_at: string | null;
	// Joined fields
	author_name: string;
	author_id: string;
	event_name: string | null;
}

export interface GlobalLesson extends LessonLearned {
	problem_title: string;
	problem_slug: string;
	major_version: number;
	location_name: string | null;
	location_id: string | null;
}

export interface CreateLessonInput {
	problem_id: string;
	event_id?: string;
	user_id: string;
	content: string;
	category?: string;
	tags?: string[];
}

export interface UpdateLessonInput {
	content?: string;
	category?: string;
	tags?: string[];
}

export interface GetGlobalLessonsOptions {
	search?: string | null;
	category?: string | null;
	eventId?: string | null;
	locationId?: string | null;
	valuableOnly?: boolean;
	limit?: number;
}

export interface FilterOption {
	id: string;
	name: string;
}

// ============================================================================
// Row types (internal, SQLite boolean conversion)
// ============================================================================

interface LessonRow {
	lesson_id: string;
	problem_id: string;
	event_id: string | null;
	user_id: string;
	content: string;
	category: string | null;
	tags: string | null; // JSON string
	valuable: number;
	created_at: string;
	edited_at: string | null;
	author_name: string;
	author_id: string;
	event_name: string | null;
}

interface GlobalLessonRow extends LessonRow {
	problem_title: string;
	problem_slug: string;
	major_version: number;
	location_name: string | null;
	location_id: string | null;
}

// ============================================================================
// Row conversion
// ============================================================================

function rowToLesson(row: LessonRow): LessonLearned {
	return {
		lesson_id: row.lesson_id,
		problem_id: row.problem_id,
		event_id: row.event_id,
		user_id: row.user_id,
		content: row.content,
		category: row.category,
		tags: row.tags ? JSON.parse(row.tags) : [],
		valuable: Boolean(row.valuable),
		created_at: row.created_at,
		edited_at: row.edited_at,
		author_name: row.author_name,
		author_id: row.author_id,
		event_name: row.event_name
	};
}

function rowToGlobalLesson(row: GlobalLessonRow): GlobalLesson {
	return {
		...rowToLesson(row),
		problem_title: row.problem_title,
		problem_slug: row.problem_slug,
		major_version: row.major_version,
		location_name: row.location_name,
		location_id: row.location_id
	};
}

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Get lessons learned for a specific problem.
 * Returns all lessons ordered by newest first.
 */
export function getLessonsForProblem(problemId: string): LessonLearned[] {
	const db = getDatabase();

	const query = `
		SELECT
			ll.lesson_id, ll.problem_id, ll.event_id, ll.user_id,
			ll.content, ll.category, ll.tags, ll.valuable,
			ll.created_at, ll.edited_at,
			u.display_name AS author_name,
			u.user_id AS author_id,
			e.title AS event_name
		FROM lessons_learned ll
		JOIN users u ON ll.user_id = u.user_id
		LEFT JOIN events e ON ll.event_id = e.event_id
		WHERE ll.problem_id = ?
		ORDER BY ll.created_at DESC
	`;

	const rows = db.prepare(query).all(problemId) as LessonRow[];
	return rows.map(rowToLesson);
}

/**
 * Get all lessons across the platform with optional filtering.
 * Used by the Knowledge Base page.
 */
export function getGlobalLessons(options: GetGlobalLessonsOptions = {}): GlobalLesson[] {
	const db = getDatabase();
	const { search, category, eventId, locationId, valuableOnly, limit } = options;

	const conditions: string[] = [];
	const params: (string | number)[] = [];

	if (search) {
		conditions.push('ll.content LIKE ?');
		params.push(`%${search}%`);
	}

	if (category) {
		conditions.push('ll.category = ?');
		params.push(category);
	}

	if (eventId) {
		conditions.push('ll.event_id = ?');
		params.push(eventId);
	}

	if (locationId) {
		conditions.push('loc.location_id = ?');
		params.push(locationId);
	}

	if (valuableOnly) {
		conditions.push('ll.valuable = 1');
	}

	const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

	const query = `
		SELECT
			ll.lesson_id, ll.problem_id, ll.event_id, ll.user_id,
			ll.content, ll.category, ll.tags, ll.valuable,
			ll.created_at, ll.edited_at,
			u.display_name AS author_name,
			u.user_id AS author_id,
			e.title AS event_name,
			p.public_slug AS problem_slug,
			pv.title AS problem_title,
			pv.major_version,
			loc.city AS location_name,
			loc.location_id
		FROM lessons_learned ll
		JOIN users u ON ll.user_id = u.user_id
		JOIN problems p ON ll.problem_id = p.problem_id
		JOIN problem_versions pv ON p.problem_id = pv.problem_id AND pv.is_current = 1
		LEFT JOIN events e ON ll.event_id = e.event_id
		LEFT JOIN rooms r ON e.room_id = r.room_id
		LEFT JOIN locations loc ON r.location_id = loc.location_id
		${whereClause}
		ORDER BY ll.created_at DESC
		${limit ? `LIMIT ${limit}` : ''}
	`;

	const rows = db.prepare(query).all(...params) as GlobalLessonRow[];
	return rows.map(rowToGlobalLesson);
}

/**
 * Get events that have at least one lesson learned (for filter dropdown).
 */
export function getEventsWithLessons(): FilterOption[] {
	const db = getDatabase();

	const query = `
		SELECT DISTINCT e.event_id AS id, e.title AS name
		FROM lessons_learned ll
		JOIN events e ON ll.event_id = e.event_id
		ORDER BY e.starts_at DESC
	`;

	return db.prepare(query).all() as FilterOption[];
}

/**
 * Get locations that have at least one lesson learned (for filter dropdown).
 */
export function getLocationsWithLessons(): FilterOption[] {
	const db = getDatabase();

	const query = `
		SELECT DISTINCT loc.location_id AS id, loc.city AS name
		FROM lessons_learned ll
		JOIN events e ON ll.event_id = e.event_id
		JOIN rooms r ON e.room_id = r.room_id
		JOIN locations loc ON r.location_id = loc.location_id
		ORDER BY loc.city ASC
	`;

	return db.prepare(query).all() as FilterOption[];
}

// ============================================================================
// Mutation Functions
// ============================================================================

/**
 * Create a new lesson learned.
 * Returns the created lesson ID.
 */
export function createLesson(input: CreateLessonInput): string {
	const db = getDatabase();
	const lessonId = generateId();
	const now = nowIso();

	const stmt = db.prepare(`
		INSERT INTO lessons_learned (lesson_id, problem_id, event_id, user_id, content, category, tags, valuable, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
	`);

	stmt.run(
		lessonId,
		input.problem_id,
		input.event_id ?? null,
		input.user_id,
		input.content,
		input.category ?? null,
		input.tags && input.tags.length > 0 ? JSON.stringify(input.tags) : null,
		now
	);

	return lessonId;
}

/**
 * Update an existing lesson learned.
 * Only the author can edit. Sets edited_at timestamp.
 */
export function updateLesson(lessonId: string, userId: string, input: UpdateLessonInput): boolean {
	const db = getDatabase();

	// Verify ownership
	const lesson = db
		.prepare('SELECT user_id FROM lessons_learned WHERE lesson_id = ?')
		.get(lessonId) as { user_id: string } | undefined;

	if (!lesson || lesson.user_id !== userId) {
		return false;
	}

	const sets: string[] = [];
	const params: (string | null)[] = [];

	if (input.content !== undefined) {
		sets.push('content = ?');
		params.push(input.content);
	}

	if (input.category !== undefined) {
		sets.push('category = ?');
		params.push(input.category);
	}

	if (input.tags !== undefined) {
		sets.push('tags = ?');
		params.push(input.tags.length > 0 ? JSON.stringify(input.tags) : null);
	}

	if (sets.length === 0) return true;

	sets.push('edited_at = ?');
	params.push(nowIso());
	params.push(lessonId);

	db.prepare(`UPDATE lessons_learned SET ${sets.join(', ')} WHERE lesson_id = ?`).run(...params);
	return true;
}

/**
 * Toggle the valuable flag on a lesson.
 * Only PO (of the problem) and moderators can do this.
 */
export function toggleValuable(lessonId: string): boolean {
	const db = getDatabase();

	const result = db
		.prepare(
			`UPDATE lessons_learned SET valuable = CASE WHEN valuable = 1 THEN 0 ELSE 1 END WHERE lesson_id = ?`
		)
		.run(lessonId);

	return result.changes > 0;
}

/**
 * Get a single lesson by ID.
 */
export function getLessonById(lessonId: string): LessonLearned | null {
	const db = getDatabase();

	const query = `
		SELECT
			ll.lesson_id, ll.problem_id, ll.event_id, ll.user_id,
			ll.content, ll.category, ll.tags, ll.valuable,
			ll.created_at, ll.edited_at,
			u.display_name AS author_name,
			u.user_id AS author_id,
			e.title AS event_name
		FROM lessons_learned ll
		JOIN users u ON ll.user_id = u.user_id
		LEFT JOIN events e ON ll.event_id = e.event_id
		WHERE ll.lesson_id = ?
	`;

	const row = db.prepare(query).get(lessonId) as LessonRow | undefined;
	return row ? rowToLesson(row) : null;
}

/**
 * Get the problem_id for a lesson (for authorization checks).
 */
export function getLessonProblemId(lessonId: string): string | null {
	const db = getDatabase();
	const row = db
		.prepare('SELECT problem_id FROM lessons_learned WHERE lesson_id = ?')
		.get(lessonId) as { problem_id: string } | undefined;
	return row?.problem_id ?? null;
}
