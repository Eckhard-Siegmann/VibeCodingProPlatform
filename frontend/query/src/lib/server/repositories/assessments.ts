import { getDatabase } from '../db';
import type { Item } from './items';

export interface Assessment {
	assessment_id: string;
	problem_id: string;
	major_version: number;
	minor_version: number | null;
	inventory_id: string;
	event_id: string | null;
	opened_at: string;
	closed_at: string | null;
}

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

interface InventoryRow {
	inventory_id: string;
	inventory_key: string;
	name: string;
	description: string | null;
	is_active: number;
	created_at: string;
	retired_at: string | null;
}

/**
 * Find an assessment by ID.
 */
export function findAssessmentById(assessmentId: string): Assessment | null {
	const db = getDatabase();

	const row = db
		.prepare(
			`
		SELECT assessment_id, problem_id, major_version, minor_version,
		       inventory_id, event_id, opened_at, closed_at
		FROM assessments
		WHERE assessment_id = ?
	`
		)
		.get(assessmentId) as Assessment | undefined;

	return row ?? null;
}

/**
 * Find an inventory by its key (e.g., 'pitch_assessment', 'review_assessment').
 */
export function findInventoryByKey(inventoryKey: string): Inventory | null {
	const db = getDatabase();

	const row = db
		.prepare(
			`
		SELECT inventory_id, inventory_key, name, description, is_active, created_at, retired_at
		FROM inventories
		WHERE inventory_key = ? AND is_active = 1
	`
		)
		.get(inventoryKey) as InventoryRow | undefined;

	if (!row) return null;

	return {
		...row,
		is_active: Boolean(row.is_active)
	};
}

/**
 * Find an inventory by its ID.
 */
export function findInventoryById(inventoryId: string): Inventory | null {
	const db = getDatabase();

	const row = db
		.prepare(
			`
		SELECT inventory_id, inventory_key, name, description, is_active, created_at, retired_at
		FROM inventories
		WHERE inventory_id = ?
	`
		)
		.get(inventoryId) as InventoryRow | undefined;

	if (!row) return null;

	return {
		...row,
		is_active: Boolean(row.is_active)
	};
}

/**
 * Get the item keys for an inventory, ordered by position_index.
 */
export function getInventoryItems(inventoryId: string): InventoryItemRow[] {
	const db = getDatabase();

	return db
		.prepare(
			`
		SELECT inventory_id, item_key, position_index
		FROM inventory_items
		WHERE inventory_id = ?
		ORDER BY position_index
	`
		)
		.all(inventoryId) as InventoryItemRow[];
}

/**
 * Get problem version title by problem_id and major_version
 */
export function getProblemTitle(problemId: string, majorVersion: number): string | null {
	const db = getDatabase();

	const row = db
		.prepare(
			`
		SELECT title FROM problem_versions
		WHERE problem_id = ? AND major_version = ?
	`
		)
		.get(problemId, majorVersion) as { title: string } | undefined;

	return row?.title ?? null;
}

/**
 * Build a complete render structure for an assessment.
 * Per Ch.7.4: Backend prepares render-ready JSON for the frontend.
 */
export interface RenderStructure {
	assessment_id: string;
	inventory_id: string;
	inventory_key: string;
	inventory_name: string;
	problem_id: string | null;
	problem_title: string;
	major_version: number | null;
	time_context: 'pitch' | 'review' | 'pre_event' | 'post_event' | 'late_reflection';
	is_open: boolean;
	timer_ends_at: string | null;
	render_type: 'single_matrix' | 'mixed_matrices';
	matrix: {
		max_rating: number;
		common_headers: Array<{ rating_value: number; label: string }>;
		rows: Array<{
			position_index: number;
			item_id: string;
			item_key: string;
			short_label: string;
			full_text: string;
			max_rating: number;
			current_rating: number | null;
		}>;
	};
}

/**
 * Get the timer_ends_at for an event's live context.
 * Used to include countdown info in the assessment render structure.
 */
export function getTimerForAssessment(eventId: string): string | null {
	const db = getDatabase();

	const row = db.prepare(`
		SELECT timer_ends_at
		FROM event_live_context
		WHERE event_id = ? AND current_mode != 'idle'
	`).get(eventId) as { timer_ends_at: string | null } | undefined;

	return row?.timer_ends_at ?? null;
}

/**
 * Build render structure from an inventory and its resolved items.
 * Checks scale consistency per Ch.7.4.
 */
export function buildRenderStructure(
	assessmentId: string,
	inventory: Inventory,
	inventoryItems: InventoryItemRow[],
	resolvedItems: Map<string, Item>,
	problemId: string | null = null,
	majorVersion: number | null = null,
	closedAt: string | null = null,
	timerEndsAt: string | null = null
): RenderStructure {
	// Build rows from resolved items in order
	const rows: RenderStructure['matrix']['rows'] = [];

	for (let idx = 0; idx < inventoryItems.length; idx++) {
		const ii = inventoryItems[idx];
		const item = resolvedItems.get(ii.item_key);
		if (!item) {
			console.warn(`Item key ${ii.item_key} not found in resolved items`);
			continue;
		}

		rows.push({
			position_index: ii.position_index ?? idx,
			item_id: item.item_id,
			item_key: item.item_key,
			short_label: item.short_label,
			full_text: item.full_text,
			max_rating: item.max_rating,
			current_rating: null
		});
	}

	// Check scale consistency (all items should have same max_rating)
	// Per Ch.7.4: MVP uses unified 5-point scale
	const maxRatings = [...new Set(rows.map((r) => r.max_rating))];
	const isConsistent = maxRatings.length === 1;

	if (!isConsistent) {
		console.warn(`Mixed scales detected: ${maxRatings.join(', ')}`);
	}

	// Get first item for labels (assuming all have same labels per unified scale)
	const firstItem = rows.length > 0 ? resolvedItems.get(rows[0].item_key) : null;
	const maxRating = maxRatings[0] ?? 5;

	// Build common headers from the first item's labels
	const commonHeaders: Array<{ rating_value: number; label: string }> = [];
	if (firstItem && maxRating === 5) {
		// 5-point Likert scale: all labels verbalized
		commonHeaders.push(
			{ rating_value: 1, label: firstItem.label_min ?? 'Poor' },
			{ rating_value: 2, label: firstItem.label_low_mid ?? 'Fair' },
			{ rating_value: 3, label: firstItem.label_mid ?? 'Good' },
			{ rating_value: 4, label: firstItem.label_high_mid ?? 'Very Good' },
			{ rating_value: 5, label: firstItem.label_max ?? 'Excellent' }
		);
	} else if (firstItem && maxRating === 10) {
		// 1-10 slider scale: only endpoints labeled (per spec Ch.7.3)
		for (let i = 1; i <= 10; i++) {
			if (i === 1) {
				commonHeaders.push({ rating_value: i, label: firstItem.label_min ?? 'Low' });
			} else if (i === 10) {
				commonHeaders.push({ rating_value: i, label: firstItem.label_max ?? 'High' });
			} else {
				commonHeaders.push({ rating_value: i, label: String(i) });
			}
		}
	} else {
		// Default headers for any other scale
		for (let i = 1; i <= maxRating; i++) {
			commonHeaders.push({ rating_value: i, label: String(i) });
		}
	}

	// Determine time_context from inventory_key
	let timeContext: RenderStructure['time_context'] = 'pitch';
	if (inventory.inventory_key.includes('review')) {
		timeContext = 'review';
	} else if (inventory.inventory_key.includes('pitch')) {
		timeContext = 'pitch';
	}

	// Get problem title if we have a problem
	let problemTitle = 'Assessment';
	if (problemId && majorVersion) {
		problemTitle = getProblemTitle(problemId, majorVersion) ?? 'Unknown Problem';
	}

	return {
		assessment_id: assessmentId,
		inventory_id: inventory.inventory_id,
		inventory_key: inventory.inventory_key,
		inventory_name: inventory.name,
		problem_id: problemId,
		problem_title: problemTitle,
		major_version: majorVersion,
		time_context: timeContext,
		is_open: closedAt === null,
		timer_ends_at: timerEndsAt,
		render_type: isConsistent ? 'single_matrix' : 'mixed_matrices',
		matrix: {
			max_rating: maxRating,
			common_headers: commonHeaders,
			rows
		}
	};
}
