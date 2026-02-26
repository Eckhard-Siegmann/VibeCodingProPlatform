import { getDatabase, nowIso } from '../db';

// ============================================================================
// Types
// ============================================================================

export interface CatalogEntry {
	key: string;
	display_name: string;
	description: string | null;
	sort_order: number;
	is_active: number; // SQLite boolean
	created_at: string;
}

export interface EmojiEntry {
	emoji: string;
	display_name: string;
	sort_order: number;
	is_active: number;
}

export interface ContributionActionEntry {
	action_key: string;
	display_name: string;
	description: string | null;
	default_points: number;
	current_points: number;
	is_active: number;
	created_at: string;
}

export interface ReviewWeightEntry {
	weight_key: string;
	display_name: string;
	weight_multiplier: number;
	description: string | null;
	is_active: number;
	created_at: string;
}

// ============================================================================
// Allowlisted catalog configuration
// Prevents SQL injection by only permitting known table/column names
// ============================================================================

type CatalogConfig = {
	table: string;
	keyColumn: string;
	hasDescription: boolean;
	hasSortOrder: boolean;
};

const CATALOG_CONFIGS: Record<string, CatalogConfig> = {
	problem_types: {
		table: 'problem_type_catalog',
		keyColumn: 'type_key',
		hasDescription: true,
		hasSortOrder: true
	},
	emojis: {
		table: 'emoji_catalog',
		keyColumn: 'emoji',
		hasDescription: false,
		hasSortOrder: true
	},
	lesson_categories: {
		table: 'lesson_category_catalog',
		keyColumn: 'category_key',
		hasDescription: true,
		hasSortOrder: true
	},
	contribution_weights: {
		table: 'contribution_action_catalog',
		keyColumn: 'action_key',
		hasDescription: true,
		hasSortOrder: false
	},
	review_weights: {
		table: 'review_weight_catalog',
		keyColumn: 'weight_key',
		hasDescription: true,
		hasSortOrder: false
	}
};

function getConfig(catalogType: string): CatalogConfig {
	const config = CATALOG_CONFIGS[catalogType];
	if (!config) {
		throw new Error(`Unknown catalog type: ${catalogType}`);
	}
	return config;
}

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Get all entries from a soft catalog (problem_types, lesson_categories).
 * Returns active first (by sort_order), then inactive.
 */
export function getSoftCatalogEntries(catalogType: string): CatalogEntry[] {
	const config = getConfig(catalogType);
	const db = getDatabase();

	const rows = db
		.prepare(
			`SELECT
				${config.keyColumn} AS key,
				display_name,
				${config.hasDescription ? 'description,' : ''}
				sort_order,
				is_active,
				created_at
			FROM ${config.table}
			ORDER BY is_active DESC, sort_order ASC`
		)
		.all() as CatalogEntry[];

	// Ensure description field exists even if column is absent
	if (!config.hasDescription) {
		return rows.map((r) => ({ ...r, description: null }));
	}
	return rows;
}

/**
 * Get all emoji catalog entries.
 */
export function getEmojiEntries(): EmojiEntry[] {
	const db = getDatabase();

	return db
		.prepare(
			`SELECT emoji, display_name, sort_order, is_active
			FROM emoji_catalog
			ORDER BY is_active DESC, sort_order ASC`
		)
		.all() as EmojiEntry[];
}

/**
 * Get all contribution action entries.
 */
export function getContributionActions(): ContributionActionEntry[] {
	const db = getDatabase();

	return db
		.prepare(
			`SELECT action_key, display_name, description, default_points, current_points, is_active, created_at
			FROM contribution_action_catalog
			ORDER BY is_active DESC, action_key ASC`
		)
		.all() as ContributionActionEntry[];
}

/**
 * Get all review weight entries.
 */
export function getReviewWeights(): ReviewWeightEntry[] {
	const db = getDatabase();

	return db
		.prepare(
			`SELECT weight_key, display_name, weight_multiplier, description, is_active, created_at
			FROM review_weight_catalog
			ORDER BY is_active DESC, weight_key ASC`
		)
		.all() as ReviewWeightEntry[];
}

// ============================================================================
// Mutation Functions
// ============================================================================

/**
 * Add a new entry to a soft catalog (problem_types, lesson_categories).
 */
export function addSoftCatalogEntry(
	catalogType: string,
	data: { key: string; display_name: string; description?: string; sort_order: number }
): { success: boolean; error?: string } {
	const config = getConfig(catalogType);
	const db = getDatabase();
	const now = nowIso();

	// Check for duplicate key
	const existing = db
		.prepare(`SELECT 1 FROM ${config.table} WHERE ${config.keyColumn} = ?`)
		.get(data.key);

	if (existing) {
		return { success: false, error: `Entry with key "${data.key}" already exists` };
	}

	if (config.hasDescription) {
		db.prepare(
			`INSERT INTO ${config.table} (${config.keyColumn}, display_name, description, sort_order, is_active, created_at)
			VALUES (?, ?, ?, ?, 1, ?)`
		).run(data.key, data.display_name, data.description ?? null, data.sort_order, now);
	} else {
		db.prepare(
			`INSERT INTO ${config.table} (${config.keyColumn}, display_name, sort_order, is_active, created_at)
			VALUES (?, ?, ?, 1, ?)`
		).run(data.key, data.display_name, data.sort_order, now);
	}

	return { success: true };
}

/**
 * Add a new emoji to the emoji catalog.
 */
export function addEmoji(data: {
	emoji: string;
	display_name: string;
	sort_order: number;
}): { success: boolean; error?: string } {
	const db = getDatabase();

	const existing = db.prepare(`SELECT 1 FROM emoji_catalog WHERE emoji = ?`).get(data.emoji);
	if (existing) {
		return { success: false, error: `Emoji "${data.emoji}" already exists` };
	}

	db.prepare(
		`INSERT INTO emoji_catalog (emoji, display_name, sort_order, is_active)
		VALUES (?, ?, ?, 1)`
	).run(data.emoji, data.display_name, data.sort_order);

	return { success: true };
}

/**
 * Add a new contribution action.
 */
export function addContributionAction(data: {
	action_key: string;
	display_name: string;
	description?: string;
	default_points: number;
	current_points: number;
}): { success: boolean; error?: string } {
	const db = getDatabase();
	const now = nowIso();

	const existing = db
		.prepare(`SELECT 1 FROM contribution_action_catalog WHERE action_key = ?`)
		.get(data.action_key);
	if (existing) {
		return { success: false, error: `Action "${data.action_key}" already exists` };
	}

	db.prepare(
		`INSERT INTO contribution_action_catalog (action_key, display_name, description, default_points, current_points, is_active, created_at)
		VALUES (?, ?, ?, ?, ?, 1, ?)`
	).run(
		data.action_key,
		data.display_name,
		data.description ?? null,
		data.default_points,
		data.current_points,
		now
	);

	return { success: true };
}

/**
 * Update a soft catalog entry's display metadata.
 */
export function updateSoftCatalogEntry(
	catalogType: string,
	key: string,
	data: { display_name: string; description?: string; sort_order: number }
): { success: boolean; error?: string } {
	const config = getConfig(catalogType);
	const db = getDatabase();

	if (config.hasDescription) {
		const result = db
			.prepare(
				`UPDATE ${config.table}
				SET display_name = ?, description = ?, sort_order = ?
				WHERE ${config.keyColumn} = ?`
			)
			.run(data.display_name, data.description ?? null, data.sort_order, key);

		if (result.changes === 0) {
			return { success: false, error: `Entry "${key}" not found` };
		}
	} else {
		const result = db
			.prepare(
				`UPDATE ${config.table}
				SET display_name = ?, sort_order = ?
				WHERE ${config.keyColumn} = ?`
			)
			.run(data.display_name, data.sort_order, key);

		if (result.changes === 0) {
			return { success: false, error: `Entry "${key}" not found` };
		}
	}

	return { success: true };
}

/**
 * Update an emoji entry's display name and sort order.
 */
export function updateEmoji(
	emoji: string,
	data: { display_name: string; sort_order: number }
): { success: boolean; error?: string } {
	const db = getDatabase();

	const result = db
		.prepare(
			`UPDATE emoji_catalog SET display_name = ?, sort_order = ? WHERE emoji = ?`
		)
		.run(data.display_name, data.sort_order, emoji);

	if (result.changes === 0) {
		return { success: false, error: `Emoji "${emoji}" not found` };
	}

	return { success: true };
}

/**
 * Update contribution action weight (current_points).
 */
export function updateContributionWeight(
	actionKey: string,
	currentPoints: number
): { success: boolean; error?: string } {
	const db = getDatabase();

	const result = db
		.prepare(
			`UPDATE contribution_action_catalog SET current_points = ? WHERE action_key = ?`
		)
		.run(currentPoints, actionKey);

	if (result.changes === 0) {
		return { success: false, error: `Action "${actionKey}" not found` };
	}

	return { success: true };
}

/**
 * Update review weight multiplier.
 */
export function updateReviewWeight(
	weightKey: string,
	multiplier: number
): { success: boolean; error?: string } {
	const db = getDatabase();

	const result = db
		.prepare(
			`UPDATE review_weight_catalog SET weight_multiplier = ? WHERE weight_key = ?`
		)
		.run(multiplier, weightKey);

	if (result.changes === 0) {
		return { success: false, error: `Weight "${weightKey}" not found` };
	}

	return { success: true };
}

/**
 * Update contribution action display metadata.
 */
export function updateContributionAction(
	actionKey: string,
	data: { display_name: string; description?: string }
): { success: boolean; error?: string } {
	const db = getDatabase();

	const result = db
		.prepare(
			`UPDATE contribution_action_catalog SET display_name = ?, description = ? WHERE action_key = ?`
		)
		.run(data.display_name, data.description ?? null, actionKey);

	if (result.changes === 0) {
		return { success: false, error: `Action "${actionKey}" not found` };
	}

	return { success: true };
}

/**
 * Update review weight display metadata.
 */
export function updateReviewWeightMeta(
	weightKey: string,
	data: { display_name: string; description?: string }
): { success: boolean; error?: string } {
	const db = getDatabase();

	const result = db
		.prepare(
			`UPDATE review_weight_catalog SET display_name = ?, description = ? WHERE weight_key = ?`
		)
		.run(data.display_name, data.description ?? null, weightKey);

	if (result.changes === 0) {
		return { success: false, error: `Weight "${weightKey}" not found` };
	}

	return { success: true };
}

/**
 * Toggle is_active for any admin-tunable catalog entry.
 */
export function toggleCatalogActive(
	catalogType: string,
	key: string,
	isActive: boolean
): { success: boolean; error?: string } {
	const config = getConfig(catalogType);
	const db = getDatabase();

	const result = db
		.prepare(
			`UPDATE ${config.table} SET is_active = ? WHERE ${config.keyColumn} = ?`
		)
		.run(isActive ? 1 : 0, key);

	if (result.changes === 0) {
		return { success: false, error: `Entry "${key}" not found` };
	}

	return { success: true };
}
