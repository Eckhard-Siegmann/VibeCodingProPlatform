import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { SubmitResponsesSchema } from '$lib/utils/validators';
import { getOrCreateSession } from '$lib/server/repositories/sessions';
import { findAssessmentById } from '$lib/server/repositories/assessments';
import { submitResponses } from '$lib/server/repositories/responses';
import { nowIso } from '$lib/server/db';

export const POST: RequestHandler = async ({ params, request }) => {
	const { assessmentId } = params;

	try {
		const body = await request.json();

		// Validate the request body
		const parsed = SubmitResponsesSchema.safeParse(body);

		if (!parsed.success) {
			throw error(400, {
				message: 'Invalid request body',
				errors: parsed.error.issues
			});
		}

		const { session_hash, role, time_context, in_presence, responses } = parsed.data;

		// Verify assessment exists
		const assessment = findAssessmentById(assessmentId);
		if (!assessment) {
			throw error(404, `Assessment '${assessmentId}' not found`);
		}

		// Get or create session
		const session = getOrCreateSession(session_hash, in_presence);

		// Submit responses to database
		// Per Ch.9: responses reference concrete item_id, locked to exact version at response time
		const result = submitResponses(
			assessmentId,
			session.session_id,
			role,
			time_context,
			in_presence,
			responses.map((r) => ({
				item_id: r.item_id,
				rating_value: r.rating_value
			}))
		);

		console.log('Assessment submission persisted:', {
			assessmentId,
			session_id: session.session_id.substring(0, 8) + '...',
			role,
			time_context,
			in_presence,
			response_count: result.response_count,
			superseded_count: result.superseded_count
		});

		return json(
			{
				success: true,
				assessment_id: assessmentId,
				response_count: result.response_count,
				superseded_count: result.superseded_count,
				created_at: nowIso()
			},
			{ status: 201 }
		);
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

		console.error('Error processing submission:', err);
		const message = err instanceof Error ? err.message : 'Unknown error';
		throw error(500, `Failed to submit responses: ${message}`);
	}
};
