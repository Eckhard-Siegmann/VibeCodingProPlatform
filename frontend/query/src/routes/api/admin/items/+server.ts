import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireRole, AuthError } from '$lib/server/auth';
import { getAllItems, createItem } from '$lib/server/repositories/items';

/**
 * GET /api/admin/items
 * List all items (active + retired). Requires admin role.
 */
export const GET: RequestHandler = async ({ cookies }) => {
	try {
		requireRole(cookies, ['admin']);
		const items = getAllItems();
		return json({ success: true, items });
	} catch (err) {
		if (err instanceof AuthError) throw error(err.status, err.message);
		if (err && typeof err === 'object' && 'status' in err) throw err;
		const message = err instanceof Error ? err.message : 'Unknown error';
		throw error(500, message);
	}
};

/**
 * POST /api/admin/items
 * Create a new item. Requires admin role.
 */
export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		requireRole(cookies, ['admin']);
		const body = await request.json();

		// Validate required fields
		if (!body.item_key || !body.short_label || !body.item_text || !body.max_rating) {
			throw error(400, 'Missing required fields: item_key, short_label, item_text, max_rating');
		}

		// Validate item_key format
		if (!/^[a-z][a-z0-9_]*$/.test(body.item_key)) {
			throw error(400, 'item_key must start with lowercase letter and contain only lowercase letters, numbers, and underscores');
		}

		// Validate labels based on scale
		if (!body.label_min || !body.label_max) {
			throw error(400, 'label_min and label_max are required');
		}

		const result = createItem({
			item_key: body.item_key,
			short_label: body.short_label,
			item_text: body.item_text,
			max_rating: body.max_rating,
			label_min: body.label_min,
			label_low_mid: body.label_low_mid ?? '',
			label_mid: body.label_mid ?? '',
			label_high_mid: body.label_high_mid ?? '',
			label_max: body.label_max,
			category: body.category,
			internal_notes: body.internal_notes
		});

		if (!result.success) {
			throw error(409, result.error ?? 'Failed to create item');
		}

		return json({ success: true, item_id: result.item_id }, { status: 201 });
	} catch (err) {
		if (err instanceof AuthError) throw error(err.status, err.message);
		if (err && typeof err === 'object' && 'status' in err) throw err;
		const message = err instanceof Error ? err.message : 'Unknown error';
		throw error(500, message);
	}
};
