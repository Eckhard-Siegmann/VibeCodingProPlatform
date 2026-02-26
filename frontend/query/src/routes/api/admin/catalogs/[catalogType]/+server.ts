import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireRole, AuthError } from '$lib/server/auth';
import {
	getSoftCatalogEntries,
	getEmojiEntries,
	getContributionActions,
	getReviewWeights,
	addSoftCatalogEntry,
	addEmoji,
	addContributionAction
} from '$lib/server/repositories/catalogs';

const VALID_TYPES = [
	'problem_types',
	'emojis',
	'lesson_categories',
	'contribution_weights',
	'review_weights'
];

/**
 * GET /api/admin/catalogs/[catalogType]
 * List all entries for a catalog type. Requires admin role.
 */
export const GET: RequestHandler = async ({ params, cookies }) => {
	try {
		requireRole(cookies, ['admin']);

		const { catalogType } = params;
		if (!VALID_TYPES.includes(catalogType)) {
			throw error(400, `Invalid catalog type: ${catalogType}`);
		}

		let entries;
		switch (catalogType) {
			case 'emojis':
				entries = getEmojiEntries();
				break;
			case 'contribution_weights':
				entries = getContributionActions();
				break;
			case 'review_weights':
				entries = getReviewWeights();
				break;
			default:
				entries = getSoftCatalogEntries(catalogType);
		}

		return json({ success: true, entries });
	} catch (err) {
		if (err instanceof AuthError) throw error(err.status, err.message);
		if (err && typeof err === 'object' && 'status' in err) throw err;
		const message = err instanceof Error ? err.message : 'Unknown error';
		throw error(500, message);
	}
};

/**
 * POST /api/admin/catalogs/[catalogType]
 * Add a new entry to a catalog. Requires admin role.
 */
export const POST: RequestHandler = async ({ params, request, cookies }) => {
	try {
		requireRole(cookies, ['admin']);

		const { catalogType } = params;
		if (!VALID_TYPES.includes(catalogType)) {
			throw error(400, `Invalid catalog type: ${catalogType}`);
		}

		const body = await request.json();

		let result;
		switch (catalogType) {
			case 'emojis': {
				if (!body.emoji || !body.display_name || body.sort_order == null) {
					throw error(400, 'Missing required fields: emoji, display_name, sort_order');
				}
				result = addEmoji({
					emoji: body.emoji,
					display_name: body.display_name,
					sort_order: body.sort_order
				});
				break;
			}
			case 'contribution_weights': {
				if (!body.action_key || !body.display_name || body.default_points == null || body.current_points == null) {
					throw error(400, 'Missing required fields: action_key, display_name, default_points, current_points');
				}
				result = addContributionAction({
					action_key: body.action_key,
					display_name: body.display_name,
					description: body.description,
					default_points: body.default_points,
					current_points: body.current_points
				});
				break;
			}
			case 'review_weights': {
				// Review weights are not typically added at runtime
				throw error(400, 'Adding review weight entries is not supported via this endpoint');
			}
			default: {
				// Soft catalogs (problem_types, lesson_categories)
				if (!body.key || !body.display_name || body.sort_order == null) {
					throw error(400, 'Missing required fields: key, display_name, sort_order');
				}
				// Validate key format
				if (!/^[a-z][a-z0-9_]*$/.test(body.key)) {
					throw error(400, 'Key must be lowercase letters, digits, and underscores, starting with a letter');
				}
				result = addSoftCatalogEntry(catalogType, {
					key: body.key,
					display_name: body.display_name,
					description: body.description,
					sort_order: body.sort_order
				});
			}
		}

		if (!result.success) {
			throw error(409, result.error ?? 'Failed to add entry');
		}

		return json({ success: true }, { status: 201 });
	} catch (err) {
		if (err instanceof AuthError) throw error(err.status, err.message);
		if (err && typeof err === 'object' && 'status' in err) throw err;
		const message = err instanceof Error ? err.message : 'Unknown error';
		throw error(500, message);
	}
};
