import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireRole, AuthError } from '$lib/server/auth';
import {
	updateSoftCatalogEntry,
	updateEmoji,
	updateContributionWeight,
	updateContributionAction,
	updateReviewWeight,
	updateReviewWeightMeta,
	toggleCatalogActive
} from '$lib/server/repositories/catalogs';

const VALID_TYPES = [
	'problem_types',
	'emojis',
	'lesson_categories',
	'contribution_weights',
	'review_weights'
];

/**
 * PATCH /api/admin/catalogs/[catalogType]/[key]
 * Update a catalog entry. Requires admin role.
 *
 * Body fields depend on catalog type:
 * - Soft catalogs: { display_name, description?, sort_order }
 * - Emojis: { display_name, sort_order }
 * - Contribution weights: { current_points } and/or { display_name, description }
 * - Review weights: { weight_multiplier } and/or { display_name, description }
 * - All types: { is_active } for toggling active/inactive
 */
export const PATCH: RequestHandler = async ({ params, request, cookies }) => {
	try {
		requireRole(cookies, ['admin']);

		const { catalogType, key } = params;
		if (!VALID_TYPES.includes(catalogType)) {
			throw error(400, `Invalid catalog type: ${catalogType}`);
		}

		const body = await request.json();

		// Handle active toggle (works for all catalog types)
		if ('is_active' in body && typeof body.is_active === 'boolean') {
			const result = toggleCatalogActive(catalogType, key, body.is_active);
			if (!result.success) {
				throw error(404, result.error ?? 'Entry not found');
			}
			return json({ success: true });
		}

		let result;
		switch (catalogType) {
			case 'emojis': {
				if (!body.display_name || body.sort_order == null) {
					throw error(400, 'Missing required fields: display_name, sort_order');
				}
				result = updateEmoji(key, {
					display_name: body.display_name,
					sort_order: body.sort_order
				});
				break;
			}
			case 'contribution_weights': {
				// Weight update
				if ('current_points' in body) {
					if (typeof body.current_points !== 'number' || body.current_points < 0) {
						throw error(400, 'current_points must be a non-negative number');
					}
					result = updateContributionWeight(key, body.current_points);
				}
				// Metadata update
				else if (body.display_name) {
					result = updateContributionAction(key, {
						display_name: body.display_name,
						description: body.description
					});
				} else {
					throw error(400, 'Provide current_points or display_name');
				}
				break;
			}
			case 'review_weights': {
				// Weight update
				if ('weight_multiplier' in body) {
					if (typeof body.weight_multiplier !== 'number' || body.weight_multiplier <= 0) {
						throw error(400, 'weight_multiplier must be a positive number');
					}
					result = updateReviewWeight(key, body.weight_multiplier);
				}
				// Metadata update
				else if (body.display_name) {
					result = updateReviewWeightMeta(key, {
						display_name: body.display_name,
						description: body.description
					});
				} else {
					throw error(400, 'Provide weight_multiplier or display_name');
				}
				break;
			}
			default: {
				// Soft catalogs (problem_types, lesson_categories)
				if (!body.display_name || body.sort_order == null) {
					throw error(400, 'Missing required fields: display_name, sort_order');
				}
				result = updateSoftCatalogEntry(catalogType, key, {
					display_name: body.display_name,
					description: body.description,
					sort_order: body.sort_order
				});
			}
		}

		if (!result.success) {
			throw error(404, result.error ?? 'Entry not found');
		}

		return json({ success: true });
	} catch (err) {
		if (err instanceof AuthError) throw error(err.status, err.message);
		if (err && typeof err === 'object' && 'status' in err) throw err;
		const message = err instanceof Error ? err.message : 'Unknown error';
		throw error(500, message);
	}
};
