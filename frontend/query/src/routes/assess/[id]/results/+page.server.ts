import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	findAssessmentById,
	findInventoryById,
	getProblemTitle
} from '$lib/server/repositories/assessments';
import {
	getAggregatedStatsByItem,
	getResponseCount,
	getRespondentRoles,
	type ItemStats,
	type ResponseFilters
} from '$lib/server/repositories/responses';
import { getAuthenticatedUser } from '$lib/server/auth';
import { getDatabase } from '$lib/server/db';

export interface ResultsData {
	assessment_id: string;
	inventory_key: string;
	inventory_name: string;
	problem_id: string | null;
	problem_title: string;
	major_version: number | null;
	time_context: 'pitch' | 'review';
	is_open: boolean;
	response_count: number;
	available_roles: string[];
	items: ItemStats[];
	filters: {
		role: string | null;
		in_presence: boolean | null;
	};
}

export const load: PageServerLoad = async ({ params, url, cookies }) => {
	const { id: assessmentId } = params;

	// Get user role for CSV export visibility (admin-only per Ch.15.3.4)
	const user = getAuthenticatedUser(cookies);
	const db = getDatabase();
	const userRow = db.prepare('SELECT role FROM users WHERE user_id = ?').get(user.user_id) as { role: string } | undefined;
	const isAdmin = userRow?.role === 'admin';

	// Parse filter query params
	const roleFilter = url.searchParams.get('role');
	const inPresenceParam = url.searchParams.get('in_presence');
	const inPresenceFilter =
		inPresenceParam === 'true' ? true : inPresenceParam === 'false' ? false : null;

	try {
		// Load assessment
		const assessment = findAssessmentById(assessmentId);
		if (!assessment) {
			throw error(404, 'Assessment not found');
		}

		// Load inventory
		const inventory = findInventoryById(assessment.inventory_id);
		if (!inventory) {
			throw error(500, 'Inventory not found for assessment');
		}

		// Get problem title
		let problemTitle = 'Assessment Results';
		if (assessment.problem_id && assessment.major_version) {
			problemTitle =
				getProblemTitle(assessment.problem_id, assessment.major_version) ?? 'Unknown Problem';
		}

		// Determine time context from inventory key
		const timeContext: 'pitch' | 'review' = inventory.inventory_key.includes('review')
			? 'review'
			: 'pitch';

		// Build filters for aggregation
		const filters: ResponseFilters = {};
		if (roleFilter) {
			filters.role = roleFilter;
		}
		if (inPresenceFilter !== null) {
			filters.in_presence = inPresenceFilter;
		}

		// Get aggregated statistics
		const items = getAggregatedStatsByItem(assessmentId, filters);

		// Get total response count (unfiltered)
		const responseCount = getResponseCount(assessmentId);

		// Get available roles for filter dropdown
		const availableRoles = getRespondentRoles(assessmentId);

		const resultsData: ResultsData = {
			assessment_id: assessmentId,
			inventory_key: inventory.inventory_key,
			inventory_name: inventory.name,
			problem_id: assessment.problem_id,
			problem_title: problemTitle,
			major_version: assessment.major_version,
			time_context: timeContext,
			is_open: assessment.closed_at === null,
			response_count: responseCount,
			available_roles: availableRoles,
			items,
			filters: {
				role: roleFilter,
				in_presence: inPresenceFilter
			}
		};

		return {
			results: resultsData,
			isAdmin
		};
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) throw err;

		console.error('Error loading results:', err);
		throw error(500, 'Failed to load assessment results');
	}
};
