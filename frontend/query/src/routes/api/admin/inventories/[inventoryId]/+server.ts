import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireRole, AuthError } from '$lib/server/auth';
import {
	updateInventory,
	retireInventory,
	getInventoryWithItems
} from '$lib/server/repositories/inventories';

/**
 * GET /api/admin/inventories/[inventoryId]
 * Get a single inventory with its items. Requires admin role.
 */
export const GET: RequestHandler = async ({ params, cookies }) => {
	try {
		requireRole(cookies, ['admin']);

		const inventory = getInventoryWithItems(params.inventoryId);
		if (!inventory) {
			throw error(404, 'Inventory not found');
		}

		return json({ success: true, inventory });
	} catch (err) {
		if (err instanceof AuthError) throw error(err.status, err.message);
		if (err && typeof err === 'object' && 'status' in err) throw err;
		const message = err instanceof Error ? err.message : 'Unknown error';
		throw error(500, message);
	}
};

/**
 * PUT /api/admin/inventories/[inventoryId]
 * Update inventory: retire old + create new with same key.
 * Per Ch.17.1 immutability pattern.
 */
export const PUT: RequestHandler = async ({ params, request, cookies }) => {
	try {
		requireRole(cookies, ['admin']);
		const body = await request.json();

		if (!body.name) {
			throw error(400, 'Missing required field: name');
		}

		if (!Array.isArray(body.items) || body.items.length === 0) {
			throw error(400, 'At least one item is required');
		}

		const result = updateInventory(params.inventoryId, {
			inventory_key: body.inventory_key,
			name: body.name,
			description: body.description,
			items: body.items
		});

		if (!result.success) {
			throw error(409, result.error ?? 'Failed to update inventory');
		}

		return json({ success: true, inventory_id: result.inventory_id });
	} catch (err) {
		if (err instanceof AuthError) throw error(err.status, err.message);
		if (err && typeof err === 'object' && 'status' in err) throw err;
		const message = err instanceof Error ? err.message : 'Unknown error';
		throw error(500, message);
	}
};

/**
 * DELETE /api/admin/inventories/[inventoryId]
 * Retire an inventory. Blocked if assessments reference it.
 */
export const DELETE: RequestHandler = async ({ params, cookies }) => {
	try {
		requireRole(cookies, ['admin']);

		const result = retireInventory(params.inventoryId);

		if (!result.success) {
			throw error(409, result.error ?? 'Failed to retire inventory');
		}

		return json({ success: true });
	} catch (err) {
		if (err instanceof AuthError) throw error(err.status, err.message);
		if (err && typeof err === 'object' && 'status' in err) throw err;
		const message = err instanceof Error ? err.message : 'Unknown error';
		throw error(500, message);
	}
};
