import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import pitchAssessment from '$lib/api/mock/data/pitch-assessment.json';
import reviewAssessment from '$lib/api/mock/data/review-assessment.json';

export const GET: RequestHandler = async ({ params }) => {
	const { assessmentId } = params;

	// Mock: Return appropriate assessment based on ID prefix
	if (assessmentId.startsWith('pitch-')) {
		return json({
			...pitchAssessment,
			assessment_id: assessmentId
		});
	}

	if (assessmentId.startsWith('review-')) {
		return json({
			...reviewAssessment,
			assessment_id: assessmentId
		});
	}

	// Default to pitch for demo purposes
	if (assessmentId === 'demo') {
		return json({
			...pitchAssessment,
			assessment_id: 'demo'
		});
	}

	throw error(404, 'Assessment not found');
};
