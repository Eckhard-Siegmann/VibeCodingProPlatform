import { getDatabase } from '../db';

export interface Item {
	item_id: string;
	item_key: string;
	short_label: string;
	full_text: string;
	max_rating: number;
	label_min: string | null;
	label_low_mid: string | null;
	label_mid: string | null;
	label_high_mid: string | null;
	label_max: string | null;
	created_at: string;
	retired_at: string | null;
}

/**
 * Find the active (non-retired) item for a given item_key.
 * Per Ch.7.2: At any point in time, exactly one active Item exists per Item Key.
 */
export function findActiveItemByKey(itemKey: string): Item | null {
	const db = getDatabase();

	const row = db
		.prepare(
			`
		SELECT item_id, item_key, short_label, item_text AS full_text, max_rating,
		       label_min, label_low_mid, label_mid, label_high_mid, label_max,
		       created_at, retired_at
		FROM items
		WHERE item_key = ? AND retired_at IS NULL
	`
		)
		.get(itemKey) as Item | undefined;

	return row ?? null;
}

/**
 * Find an item by its concrete item_id.
 * Used when storing/retrieving responses (which reference the exact item version).
 */
export function findItemById(itemId: string): Item | null {
	const db = getDatabase();

	const row = db
		.prepare(
			`
		SELECT item_id, item_key, short_label, item_text AS full_text, max_rating,
		       label_min, label_low_mid, label_mid, label_high_mid, label_max,
		       created_at, retired_at
		FROM items
		WHERE item_id = ?
	`
		)
		.get(itemId) as Item | undefined;

	return row ?? null;
}

/**
 * Get all active items.
 * Returns items ordered by item_key for consistency.
 */
export function getAllActiveItems(): Item[] {
	const db = getDatabase();

	return db
		.prepare(
			`
		SELECT item_id, item_key, short_label, item_text AS full_text, max_rating,
		       label_min, label_low_mid, label_mid, label_high_mid, label_max,
		       created_at, retired_at
		FROM items
		WHERE retired_at IS NULL
		ORDER BY item_key
	`
		)
		.all() as Item[];
}

/**
 * Resolve multiple item_keys to their active item versions.
 * Returns a map of item_key -> Item for efficient lookup.
 */
export function resolveItemKeys(itemKeys: string[]): Map<string, Item> {
	const db = getDatabase();
	const result = new Map<string, Item>();

	if (itemKeys.length === 0) return result;

	// Build placeholders for IN clause
	const placeholders = itemKeys.map(() => '?').join(',');

	const rows = db
		.prepare(
			`
		SELECT item_id, item_key, short_label, item_text AS full_text, max_rating,
		       label_min, label_low_mid, label_mid, label_high_mid, label_max,
		       created_at, retired_at
		FROM items
		WHERE item_key IN (${placeholders}) AND retired_at IS NULL
	`
		)
		.all(...itemKeys) as Item[];

	for (const row of rows) {
		result.set(row.item_key, row);
	}

	return result;
}
