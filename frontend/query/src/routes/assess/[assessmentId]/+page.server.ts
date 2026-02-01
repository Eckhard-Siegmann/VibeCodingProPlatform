import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { RenderStructureSchema } from '$lib/utils/validators';

export const load: PageServerLoad = async ({ params, fetch }) => {
	const { assessmentId } = params;

	try {
		const response = await fetch(`/api/assessments/${assessmentId}/render-structure`);

		if (!response.ok) {
			throw error(response.status, 'Assessment not found');
		}

		const data = await response.json();

		// Validate the response structure
		const parsed = RenderStructureSchema.safeParse(data);

		if (!parsed.success) {
			console.error('Invalid render structure:', parsed.error);
			throw error(500, 'Invalid assessment data');
		}

		return {
			assessment: parsed.data
		};
	} catch (err) {
		if (err instanceof Response) throw err;

		console.error('Error loading assessment:', err);
		throw error(500, 'Failed to load assessment');
	}
};
