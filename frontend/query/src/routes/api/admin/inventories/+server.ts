import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireRole, AuthError } from '$lib/server/auth';
import {
	getAllInventoriesWithCounts,
	createInventory
} from '$lib/server/repositories/inventories';
import { getAllActiveItems } from '$lib/server/repositories/items';

/**
 * GET /api/admin/inventories
 * List all inventories with item counts + available items. Requires admin role.
 */
export const GET: RequestHandler = async ({ cookies }) => {
	try {
		requireRole(cookies, ['admin']);
		const inventories = getAllInventoriesWithCounts();
		const availableItems = getAllActiveItems().map((item) => ({
			item_key: item.item_key,
			short_label: item.short_label,
			max_rating: item.max_rating
		}));
		return json({ success: true, inventories, availableItems });
	} catch (err) {
		if (err instanceof AuthError) throw error(err.status, err.message);
		if (err && typeof err === 'object' && 'status' in err) throw err;
		const message = err instanceof Error ? err.message : 'Unknown error';
		throw error(500, message);
	}
};

/**
 * POST /api/admin/inventories
 * Create a new inventory. Requires admin role.
 */
export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		requireRole(cookies, ['admin']);
		const body = await request.json();

		if (!body.inventory_key || !body.name) {
			throw error(400, 'Missing required fields: inventory_key, name');
		}

		if (!/^[a-z][a-z0-9_]*$/.test(body.inventory_key)) {
			throw error(400, 'inventory_key must start with lowercase letter and contain only lowercase letters, numbers, and underscores');
		}

		if (!Array.isArray(body.items) || body.items.length === 0) {
			throw error(400, 'At least one item is required');
		}

		const result = createInventory({
			inventory_key: body.inventory_key,
			name: body.name,
			description: body.description,
			items: body.items
		});

		if (!result.success) {
			throw error(409, result.error ?? 'Failed to create inventory');
		}

		return json({ success: true, inventory_id: result.inventory_id }, { status: 201 });
	} catch (err) {
		if (err instanceof AuthError) throw error(err.status, err.message);
		if (err && typeof err === 'object' && 'status' in err) throw err;
		const message = err instanceof Error ? err.message : 'Unknown error';
		throw error(500, message);
	}
};
