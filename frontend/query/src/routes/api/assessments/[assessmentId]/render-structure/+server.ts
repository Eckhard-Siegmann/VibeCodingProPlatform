import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	findAssessmentById,
	findInventoryById,
	findInventoryByKey,
	getInventoryItems,
	buildRenderStructure
} from '$lib/server/repositories/assessments';
import { resolveItemKeys } from '$lib/server/repositories/items';

export const GET: RequestHandler = async ({ params }) => {
	const { assessmentId } = params;

	try {
		// First, try to find assessment directly by ID
		let assessment = findAssessmentById(assessmentId);
		let inventory = assessment ? findInventoryById(assessment.inventory_id) : null;

		// If not found, try to parse as {type}-{slug} pattern for demo assessments
		if (!assessment) {
			const match = assessmentId.match(/^(pitch|review)-(\d+)$/);
			if (match) {
				const [, type, slug] = match;
				const inventoryKey = type === 'pitch' ? 'pitch_assessment' : 'review_assessment';
				inventory = findInventoryByKey(inventoryKey);

				if (!inventory) {
					throw error(500, `Inventory '${inventoryKey}' not found`);
				}

				// Try to find the assessment with this ID pattern
				assessment = findAssessmentById(assessmentId);
			}
		}

		if (!assessment || !inventory) {
			throw error(404, `Assessment '${assessmentId}' not found`);
		}

		// Get inventory items ordered by position
		const inventoryItems = getInventoryItems(inventory.inventory_id);

		if (inventoryItems.length === 0) {
			throw error(500, `No items found for inventory '${inventory.inventory_key}'`);
		}

		// Resolve item_keys to active item versions
		const itemKeys = inventoryItems.map((ii) => ii.item_key);
		const resolvedItems = resolveItemKeys(itemKeys);

		// Check if all items were resolved
		const missingKeys = itemKeys.filter((k) => !resolvedItems.has(k));
		if (missingKeys.length > 0) {
			console.warn(`Missing active items for keys: ${missingKeys.join(', ')}`);
		}

		// Build render structure per Ch.7.4
		const renderStructure = buildRenderStructure(
			assessmentId,
			inventory,
			inventoryItems,
			resolvedItems,
			assessment.problem_id,
			assessment.major_version,
			assessment.closed_at
		);

		return json(renderStructure);
	} catch (err) {
		// Re-throw SvelteKit errors
		if (err instanceof Response) throw err;
		if (
			err &&
			typeof err === 'object' &&
			'status' in err &&
			typeof (err as { status: unknown }).status === 'number'
		) {
			throw err;
		}

		console.error('Error fetching assessment render structure:', err);
		const message = err instanceof Error ? err.message : 'Unknown error';
		throw error(500, `Failed to load assessment: ${message}`);
	}
};
