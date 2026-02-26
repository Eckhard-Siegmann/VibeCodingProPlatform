import { getDatabase, generateId, nowIso } from '../db';

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
	category: string | null;
	internal_notes: string | null;
	created_at: string;
	retired_at: string | null;
}

/** Column list for consistent SELECT queries */
const ITEM_COLUMNS = `item_id, item_key, short_label, item_text AS full_text, max_rating,
	label_min, label_low_mid, label_mid, label_high_mid, label_max,
	category, internal_notes, created_at, retired_at`;

// ============================================================================
// Read Functions
// ============================================================================

/**
 * Find the active (non-retired) item for a given item_key.
 * Per Ch.7.2: At any point in time, exactly one active Item exists per Item Key.
 */
export function findActiveItemByKey(itemKey: string): Item | null {
	const db = getDatabase();
	const row = db
		.prepare(`SELECT ${ITEM_COLUMNS} FROM items WHERE item_key = ? AND retired_at IS NULL`)
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
		.prepare(`SELECT ${ITEM_COLUMNS} FROM items WHERE item_id = ?`)
		.get(itemId) as Item | undefined;
	return row ?? null;
}

/**
 * Get all active items ordered by item_key.
 */
export function getAllActiveItems(): Item[] {
	const db = getDatabase();
	return db
		.prepare(`SELECT ${ITEM_COLUMNS} FROM items WHERE retired_at IS NULL ORDER BY item_key`)
		.all() as Item[];
}

/**
 * Get all items (active + retired) for admin views.
 * Active items first, then retired, both groups ordered by item_key.
 */
export function getAllItems(): Item[] {
	const db = getDatabase();
	return db
		.prepare(
			`SELECT ${ITEM_COLUMNS} FROM items
			ORDER BY (CASE WHEN retired_at IS NULL THEN 0 ELSE 1 END), item_key`
		)
		.all() as Item[];
}

// ── Paginated Listing (TICKET-30) ────────────────────────────────────

export interface ItemListParams {
	page: number;
	pageSize: number;
	search: string;
	status: string;
	sort: string;
}

export interface PaginatedItemResult {
	items: Item[];
	pagination: {
		page: number;
		pageSize: number;
		totalItems: number;
		totalPages: number;
	};
}

/**
 * Get items with server-side pagination, search, and status filtering.
 * Spec: Ch.17.1, Ch.12.10 | Ticket: TICKET-30
 */
export function getAllItemsPaginated(params: ItemListParams): PaginatedItemResult {
	const db = getDatabase();

	const conditions: string[] = [];
	const args: (string | number)[] = [];

	// Search by item_key or short_label
	if (params.search) {
		conditions.push('(i.item_key LIKE ? COLLATE NOCASE OR i.short_label LIKE ? COLLATE NOCASE OR i.item_text LIKE ? COLLATE NOCASE)');
		const term = `%${params.search}%`;
		args.push(term, term, term);
	}

	// Status filter
	if (params.status === 'active') {
		conditions.push('i.retired_at IS NULL');
	} else if (params.status === 'retired') {
		conditions.push('i.retired_at IS NOT NULL');
	}

	const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

	// Sort
	let orderBy = '(CASE WHEN i.retired_at IS NULL THEN 0 ELSE 1 END), i.item_key';
	switch (params.sort) {
		case 'key_asc': orderBy = 'i.item_key COLLATE NOCASE ASC'; break;
		case 'key_desc': orderBy = 'i.item_key COLLATE NOCASE DESC'; break;
		case 'newest': orderBy = 'i.created_at DESC'; break;
		case 'oldest': orderBy = 'i.created_at ASC'; break;
	}

	// Count
	const countRow = db.prepare(`SELECT COUNT(*) AS cnt FROM items i ${whereClause}`).get(...args) as { cnt: number };
	const totalItems = countRow.cnt;

	const pageSize = Math.min(Math.max(params.pageSize, 1), 100);
	const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
	const page = Math.min(Math.max(params.page, 1), totalPages || 1);
	const offset = (page - 1) * pageSize;

	const rows = db.prepare(`
		SELECT ${ITEM_COLUMNS}
		FROM items i
		${whereClause}
		ORDER BY ${orderBy}
		LIMIT ? OFFSET ?
	`).all(...args, pageSize, offset) as Item[];

	return {
		items: rows,
		pagination: { page, pageSize, totalItems, totalPages }
	};
}

/**
 * Resolve multiple item_keys to their active item versions.
 */
export function resolveItemKeys(itemKeys: string[]): Map<string, Item> {
	const db = getDatabase();
	const result = new Map<string, Item>();
	if (itemKeys.length === 0) return result;

	const placeholders = itemKeys.map(() => '?').join(',');
	const rows = db
		.prepare(
			`SELECT ${ITEM_COLUMNS} FROM items
			WHERE item_key IN (${placeholders}) AND retired_at IS NULL`
		)
		.all(...itemKeys) as Item[];

	for (const row of rows) {
		result.set(row.item_key, row);
	}
	return result;
}

// ============================================================================
// Validation Functions (Ch.17.1 — retirement constraints)
// ============================================================================

/**
 * Check if any item with this key has recorded responses.
 * Used to block retirement when historical data exists.
 */
export function hasResponsesForItemKey(itemKey: string): boolean {
	const db = getDatabase();
	const row = db
		.prepare(
			`SELECT 1 FROM responses r
			JOIN items i ON r.item_id = i.item_id
			WHERE i.item_key = ? LIMIT 1`
		)
		.get(itemKey);
	return !!row;
}

/**
 * Check if an item_key is referenced by any active inventory.
 */
export function isItemInActiveInventory(itemKey: string): boolean {
	const db = getDatabase();
	const row = db
		.prepare(
			`SELECT 1 FROM inventory_items ii
			JOIN inventories inv ON ii.inventory_id = inv.inventory_id
			WHERE ii.item_key = ? AND inv.retired_at IS NULL LIMIT 1`
		)
		.get(itemKey);
	return !!row;
}

// ============================================================================
// Mutation Functions (Ch.17.1, Ch.17.2 — immutability pattern)
// ============================================================================

export interface CreateItemInput {
	item_key: string;
	short_label: string;
	item_text: string;
	max_rating: number;
	label_min: string;
	label_low_mid: string;
	label_mid: string;
	label_high_mid: string;
	label_max: string;
	category?: string;
	internal_notes?: string;
}

/**
 * Create a new item. Fails if an active item with same key already exists.
 */
export function createItem(input: CreateItemInput): { success: boolean; item_id?: string; error?: string } {
	const db = getDatabase();

	const existing = findActiveItemByKey(input.item_key);
	if (existing) {
		return { success: false, error: `Active item with key "${input.item_key}" already exists` };
	}

	const itemId = generateId();
	const now = nowIso();

	db.prepare(
		`INSERT INTO items (item_id, item_key, short_label, item_text, max_rating,
			label_min, label_low_mid, label_mid, label_high_mid, label_max,
			category, internal_notes, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
	).run(
		itemId, input.item_key, input.short_label, input.item_text, input.max_rating,
		input.label_min, input.label_low_mid, input.label_mid, input.label_high_mid, input.label_max,
		input.category ?? null, input.internal_notes ?? null, now
	);

	return { success: true, item_id: itemId };
}

/**
 * Update an item: retire the old version + create a new one with same item_key.
 * Per Ch.17.2: atomic, preserves key continuity.
 */
export function updateItem(
	oldItemId: string,
	input: CreateItemInput
): { success: boolean; item_id?: string; error?: string } {
	const db = getDatabase();

	const oldItem = findItemById(oldItemId);
	if (!oldItem) {
		return { success: false, error: `Item "${oldItemId}" not found` };
	}
	if (oldItem.retired_at !== null) {
		return { success: false, error: 'Cannot update an already retired item' };
	}

	const newItemId = generateId();
	const now = nowIso();

	const tx = db.transaction(() => {
		// Retire old version
		db.prepare(`UPDATE items SET retired_at = ? WHERE item_id = ?`).run(now, oldItemId);

		// Create new version with same item_key
		db.prepare(
			`INSERT INTO items (item_id, item_key, short_label, item_text, max_rating,
				label_min, label_low_mid, label_mid, label_high_mid, label_max,
				category, internal_notes, created_at)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		).run(
			newItemId, oldItem.item_key, input.short_label, input.item_text, input.max_rating,
			input.label_min, input.label_low_mid, input.label_mid, input.label_high_mid, input.label_max,
			input.category ?? null, input.internal_notes ?? null, now
		);
	});
	tx();

	return { success: true, item_id: newItemId };
}

/**
 * Retire an item. Per Ch.17.1: blocked if item is in an active inventory or has responses.
 */
export function retireItem(itemId: string): { success: boolean; error?: string } {
	const db = getDatabase();

	const item = findItemById(itemId);
	if (!item) {
		return { success: false, error: 'Item not found' };
	}
	if (item.retired_at !== null) {
		return { success: false, error: 'Item is already retired' };
	}

	if (isItemInActiveInventory(item.item_key)) {
		return { success: false, error: 'Cannot retire: item is referenced by an active inventory' };
	}

	if (hasResponsesForItemKey(item.item_key)) {
		return { success: false, error: 'Cannot retire: item has recorded responses' };
	}

	const now = nowIso();
	db.prepare(`UPDATE items SET retired_at = ? WHERE item_id = ?`).run(now, itemId);

	return { success: true };
}
