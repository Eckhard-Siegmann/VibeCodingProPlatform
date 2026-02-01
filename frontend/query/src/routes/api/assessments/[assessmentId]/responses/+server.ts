import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { SubmitResponsesSchema } from '$lib/utils/validators';

export const POST: RequestHandler = async ({ params, request }) => {
	const { assessmentId } = params;

	try {
		const body = await request.json();

		// Validate the request body
		const parsed = SubmitResponsesSchema.safeParse(body);

		if (!parsed.success) {
			throw error(400, {
				message: 'Invalid request body',
				errors: parsed.error.errors
			});
		}

		const { session_hash, role, time_context, in_presence, responses } = parsed.data;

		// Mock: Log the submission for development
		console.log('Assessment submission received:', {
			assessmentId,
			session_hash: session_hash.substring(0, 8) + '...',
			role,
			time_context,
			in_presence,
			response_count: responses.length
		});

		// Mock: Return success response
		return json(
			{
				success: true,
				assessment_id: assessmentId,
				response_count: responses.length,
				superseded_count: 0,
				created_at: new Date().toISOString()
			},
			{ status: 201 }
		);
	} catch (err) {
		if (err instanceof Response) throw err;

		console.error('Error processing submission:', err);
		throw error(500, 'Internal server error');
	}
};
