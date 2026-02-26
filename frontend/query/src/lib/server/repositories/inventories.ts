/**
 * Inventory repository — CRUD for inventories and inventory composition.
 * Spec: Ch.7 (concept), Ch.17.1 (admin UI), Ch.19.3.15-17 (data model)
 *
 * Inventories follow the same immutability pattern as items:
 * editing retires the old version and creates a new one with the same key.
 */

import { getDatabase, generateId, nowIso } from '../db';

// ============================================================================
// Types
// ============================================================================

export interface Inventory {
	inventory_id: string;
	inventory_key: string;
	name: string;
	description: string | null;
	is_active: boolean;
	created_at: string;
	retired_at: string | null;
}

export interface InventoryItemRow {
	inventory_id: string;
	item_key: string;
	position_index: number;
}

export interface InventoryWithItems extends Inventory {
	items: InventoryItemRow[];
	item_count: number;
}

/** Raw DB row (is_active is INTEGER in SQLite) */
interface InventoryRow {
	inventory_id: string;
	inventory_key: string;
	name: string;
	description: string | null;
	is_active: number;
	created_at: string;
	retired_at: string | null;
}

function toInventory(row: InventoryRow): Inventory {
	return { ...row, is_active: Boolean(row.is_active) };
}

// ============================================================================
// Read Functions
// ============================================================================

/**
 * Get all inventories (active + retired) for admin views.
 * Active first, then retired, both ordered by name.
 */
export function getAllInventories(): Inventory[] {
	const db = getDatabase();
	const rows = db
		.prepare(
			`SELECT inventory_id, inventory_key, name, description, is_active, created_at, retired_at
			FROM inventories
			ORDER BY (CASE WHEN retired_at IS NULL THEN 0 ELSE 1 END), name`
		)
		.all() as InventoryRow[];
	return rows.map(toInventory);
}

/**
 * Get all active inventories.
 */
export function getActiveInventories(): Inventory[] {
	const db = getDatabase();
	const rows = db
		.prepare(
			`SELECT inventory_id, inventory_key, name, description, is_active, created_at, retired_at
			FROM inventories
			WHERE retired_at IS NULL AND is_active = 1
			ORDER BY name`
		)
		.all() as InventoryRow[];
	return rows.map(toInventory);
}

/**
 * Find active inventory by key.
 */
export function findActiveInventoryByKey(inventoryKey: string): Inventory | null {
	const db = getDatabase();
	const row = db
		.prepare(
			`SELECT inventory_id, inventory_key, name, description, is_active, created_at, retired_at
			FROM inventories
			WHERE inventory_key = ? AND retired_at IS NULL`
		)
		.get(inventoryKey) as InventoryRow | undefined;
	return row ? toInventory(row) : null;
}

/**
 * Find inventory by ID (any version, including retired).
 */
export function findInventoryById(inventoryId: string): Inventory | null {
	const db = getDatabase();
	const row = db
		.prepare(
			`SELECT inventory_id, inventory_key, name, description, is_active, created_at, retired_at
			FROM inventories
			WHERE inventory_id = ?`
		)
		.get(inventoryId) as InventoryRow | undefined;
	return row ? toInventory(row) : null;
}

/**
 * Get item keys for an inventory, ordered by position_index.
 */
export function getInventoryItems(inventoryId: string): InventoryItemRow[] {
	const db = getDatabase();
	return db
		.prepare(
			`SELECT inventory_id, item_key, position_index
			FROM inventory_items
			WHERE inventory_id = ?
			ORDER BY position_index`
		)
		.all(inventoryId) as InventoryItemRow[];
}

/**
 * Get inventory with its items for admin display.
 */
export function getInventoryWithItems(inventoryId: string): InventoryWithItems | null {
	const inventory = findInventoryById(inventoryId);
	if (!inventory) return null;

	const items = getInventoryItems(inventoryId);
	return { ...inventory, items, item_count: items.length };
}

/**
 * Get all inventories with item counts for admin list views.
 */
export function getAllInventoriesWithCounts(): (Inventory & { item_count: number })[] {
	const db = getDatabase();
	const rows = db
		.prepare(
			`SELECT inv.inventory_id, inv.inventory_key, inv.name, inv.description,
				inv.is_active, inv.created_at, inv.retired_at,
				COUNT(ii.item_key) AS item_count
			FROM inventories inv
			LEFT JOIN inventory_items ii ON inv.inventory_id = ii.inventory_id
			GROUP BY inv.inventory_id
			ORDER BY (CASE WHEN inv.retired_at IS NULL THEN 0 ELSE 1 END), inv.name`
		)
		.all() as (InventoryRow & { item_count: number })[];
	return rows.map((row) => ({ ...toInventory(row), item_count: row.item_count }));
}

// ============================================================================
// Paginated Listing (TICKET-30)
// ============================================================================

export interface InventoryListParams {
	page: number;
	pageSize: number;
	search: string;
	status: string;
	sort: string;
}

export interface PaginatedInventoryResult {
	items: (Inventory & { item_count: number })[];
	pagination: {
		page: number;
		pageSize: number;
		totalItems: number;
		totalPages: number;
	};
}

/**
 * Get inventories with server-side pagination, search, and status filtering.
 * Spec: Ch.17.1, Ch.12.10 | Ticket: TICKET-30
 */
export function getAllInventoriesPaginated(params: InventoryListParams): PaginatedInventoryResult {
	const db = getDatabase();

	const conditions: string[] = [];
	const args: (string | number)[] = [];

	// Search by name or key
	if (params.search) {
		conditions.push('(inv.name LIKE ? COLLATE NOCASE OR inv.inventory_key LIKE ? COLLATE NOCASE)');
		const term = `%${params.search}%`;
		args.push(term, term);
	}

	// Status filter
	if (params.status === 'active') {
		conditions.push('inv.retired_at IS NULL');
	} else if (params.status === 'retired') {
		conditions.push('inv.retired_at IS NOT NULL');
	}

	const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

	// Sort
	let orderBy = '(CASE WHEN inv.retired_at IS NULL THEN 0 ELSE 1 END), inv.name';
	switch (params.sort) {
		case 'name_asc': orderBy = 'inv.name COLLATE NOCASE ASC'; break;
		case 'name_desc': orderBy = 'inv.name COLLATE NOCASE DESC'; break;
		case 'newest': orderBy = 'inv.created_at DESC'; break;
		case 'items': orderBy = 'item_count DESC'; break;
	}

	// Count
	const countRow = db.prepare(`SELECT COUNT(*) AS cnt FROM inventories inv ${whereClause}`).get(...args) as { cnt: number };
	const totalItems = countRow.cnt;

	const pageSize = Math.min(Math.max(params.pageSize, 1), 100);
	const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
	const page = Math.min(Math.max(params.page, 1), totalPages || 1);
	const offset = (page - 1) * pageSize;

	const rows = db.prepare(`
		SELECT inv.inventory_id, inv.inventory_key, inv.name, inv.description,
			inv.is_active, inv.created_at, inv.retired_at,
			COUNT(ii.item_key) AS item_count
		FROM inventories inv
		LEFT JOIN inventory_items ii ON inv.inventory_id = ii.inventory_id
		${whereClause}
		GROUP BY inv.inventory_id
		ORDER BY ${orderBy}
		LIMIT ? OFFSET ?
	`).all(...args, pageSize, offset) as (InventoryRow & { item_count: number })[];

	const items = rows.map((row) => ({ ...toInventory(row), item_count: row.item_count }));

	return {
		items,
		pagination: { page, pageSize, totalItems, totalPages }
	};
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Check if an inventory has any assessments referencing it.
 * Used to block retirement per Ch.17.1.
 */
export function hasAssessmentsForInventory(inventoryId: string): boolean {
	const db = getDatabase();
	const row = db
		.prepare(`SELECT 1 FROM assessments WHERE inventory_id = ? LIMIT 1`)
		.get(inventoryId);
	return !!row;
}

// ============================================================================
// Mutation Functions (Ch.17.1 — immutability pattern)
// ============================================================================

export interface CreateInventoryInput {
	inventory_key: string;
	name: string;
	description?: string;
	items: string[]; // item_keys in order
}

/**
 * Create a new inventory with composition.
 */
export function createInventory(
	input: CreateInventoryInput
): { success: boolean; inventory_id?: string; error?: string } {
	const db = getDatabase();

	const existing = findActiveInventoryByKey(input.inventory_key);
	if (existing) {
		return { success: false, error: `Active inventory with key "${input.inventory_key}" already exists` };
	}

	if (input.items.length === 0) {
		return { success: false, error: 'Inventory must contain at least one item' };
	}

	const inventoryId = generateId();
	const now = nowIso();

	const tx = db.transaction(() => {
		db.prepare(
			`INSERT INTO inventories (inventory_id, inventory_key, name, description, is_active, created_at)
			VALUES (?, ?, ?, ?, 1, ?)`
		).run(inventoryId, input.inventory_key, input.name, input.description ?? null, now);

		const insertItem = db.prepare(
			`INSERT INTO inventory_items (inventory_id, item_key, position_index)
			VALUES (?, ?, ?)`
		);
		for (let i = 0; i < input.items.length; i++) {
			insertItem.run(inventoryId, input.items[i], i);
		}
	});
	tx();

	return { success: true, inventory_id: inventoryId };
}

/**
 * Update inventory: retire old + create new with same key.
 * Per Ch.17.1: "As with Items, changing an Inventory results in retirement
 * of the previous version and creation of a new one."
 */
export function updateInventory(
	oldInventoryId: string,
	input: CreateInventoryInput
): { success: boolean; inventory_id?: string; error?: string } {
	const db = getDatabase();

	const oldInventory = findInventoryById(oldInventoryId);
	if (!oldInventory) {
		return { success: false, error: 'Inventory not found' };
	}
	if (oldInventory.retired_at !== null) {
		return { success: false, error: 'Cannot update an already retired inventory' };
	}

	if (input.items.length === 0) {
		return { success: false, error: 'Inventory must contain at least one item' };
	}

	const newInventoryId = generateId();
	const now = nowIso();

	const tx = db.transaction(() => {
		// Retire old version
		db.prepare(
			`UPDATE inventories SET retired_at = ?, is_active = 0 WHERE inventory_id = ?`
		).run(now, oldInventoryId);

		// Create new version with same inventory_key
		db.prepare(
			`INSERT INTO inventories (inventory_id, inventory_key, name, description, is_active, created_at)
			VALUES (?, ?, ?, ?, 1, ?)`
		).run(newInventoryId, oldInventory.inventory_key, input.name, input.description ?? null, now);

		// Insert new composition
		const insertItem = db.prepare(
			`INSERT INTO inventory_items (inventory_id, item_key, position_index)
			VALUES (?, ?, ?)`
		);
		for (let i = 0; i < input.items.length; i++) {
			insertItem.run(newInventoryId, input.items[i], i);
		}
	});
	tx();

	return { success: true, inventory_id: newInventoryId };
}

/**
 * Clone an inventory with a new key and name.
 * Per Ch.17.1 / User Story A6.
 */
export function cloneInventory(
	sourceInventoryId: string,
	newKey: string,
	newName: string,
	newDescription?: string
): { success: boolean; inventory_id?: string; error?: string } {
	const db = getDatabase();

	const source = findInventoryById(sourceInventoryId);
	if (!source) {
		return { success: false, error: 'Source inventory not found' };
	}

	const existing = findActiveInventoryByKey(newKey);
	if (existing) {
		return { success: false, error: `Active inventory with key "${newKey}" already exists` };
	}

	const sourceItems = getInventoryItems(sourceInventoryId);
	if (sourceItems.length === 0) {
		return { success: false, error: 'Source inventory has no items' };
	}

	const newInventoryId = generateId();
	const now = nowIso();

	const tx = db.transaction(() => {
		db.prepare(
			`INSERT INTO inventories (inventory_id, inventory_key, name, description, is_active, created_at)
			VALUES (?, ?, ?, ?, 1, ?)`
		).run(newInventoryId, newKey, newName, newDescription ?? source.description, now);

		const insertItem = db.prepare(
			`INSERT INTO inventory_items (inventory_id, item_key, position_index)
			VALUES (?, ?, ?)`
		);
		for (const item of sourceItems) {
			insertItem.run(newInventoryId, item.item_key, item.position_index);
		}
	});
	tx();

	return { success: true, inventory_id: newInventoryId };
}

/**
 * Retire an inventory. Blocked if it has assessments referencing it.
 * Per Ch.17.1 / User Story A7.
 */
export function retireInventory(
	inventoryId: string
): { success: boolean; error?: string } {
	const db = getDatabase();

	const inventory = findInventoryById(inventoryId);
	if (!inventory) {
		return { success: false, error: 'Inventory not found' };
	}
	if (inventory.retired_at !== null) {
		return { success: false, error: 'Inventory is already retired' };
	}

	if (hasAssessmentsForInventory(inventoryId)) {
		return { success: false, error: 'Cannot retire: inventory has assessments referencing it' };
	}

	const now = nowIso();
	db.prepare(
		`UPDATE inventories SET retired_at = ?, is_active = 0 WHERE inventory_id = ?`
	).run(now, inventoryId);

	return { success: true };
}
