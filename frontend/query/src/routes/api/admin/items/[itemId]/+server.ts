import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireRole, AuthError } from '$lib/server/auth';
import { updateItem, retireItem } from '$lib/server/repositories/items';

/**
 * PUT /api/admin/items/[itemId]
 * Update an item: retires the old version and creates a new one with same key.
 * Per Ch.17.2 immutability pattern.
 */
export const PUT: RequestHandler = async ({ params, request, cookies }) => {
	try {
		requireRole(cookies, ['admin']);
		const body = await request.json();

		if (!body.short_label || !body.item_text || !body.max_rating) {
			throw error(400, 'Missing required fields: short_label, item_text, max_rating');
		}

		if (!body.label_min || !body.label_max) {
			throw error(400, 'label_min and label_max are required');
		}

		const result = updateItem(params.itemId, {
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
			throw error(409, result.error ?? 'Failed to update item');
		}

		return json({ success: true, item_id: result.item_id });
	} catch (err) {
		if (err instanceof AuthError) throw error(err.status, err.message);
		if (err && typeof err === 'object' && 'status' in err) throw err;
		const message = err instanceof Error ? err.message : 'Unknown error';
		throw error(500, message);
	}
};

/**
 * DELETE /api/admin/items/[itemId]
 * Retire an item. Per Ch.17.1: blocked if referenced by inventory or has responses.
 */
export const DELETE: RequestHandler = async ({ params, cookies }) => {
	try {
		requireRole(cookies, ['admin']);

		const result = retireItem(params.itemId);

		if (!result.success) {
			throw error(409, result.error ?? 'Failed to retire item');
		}

		return json({ success: true });
	} catch (err) {
		if (err instanceof AuthError) throw error(err.status, err.message);
		if (err && typeof err === 'object' && 'status' in err) throw err;
		const message = err instanceof Error ? err.message : 'Unknown error';
		throw error(500, message);
	}
};
