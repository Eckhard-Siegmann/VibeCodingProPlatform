import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { SubmitResponsesSchema } from '$lib/utils/validators';
import { getAuthenticatedUser, AuthError } from '$lib/server/auth';
import { findAssessmentById, findInventoryById } from '$lib/server/repositories/assessments';
import { submitResponses, determineReviewWeightKey } from '$lib/server/repositories/responses';
import { getEffectiveRole } from '$lib/server/repositories/teams';
import { getDatabase } from '$lib/server/db';
import { nowIso } from '$lib/server/db';
import { awardContributionPoints, checkAndAwardMilestone } from '$lib/server/repositories/recognition';

export const POST: RequestHandler = async ({ params, request, cookies }) => {
	const { assessmentId } = params;

	try {
		const body = await request.json();

		// Validate the request body
		const parsed = SubmitResponsesSchema.safeParse(body);

		if (!parsed.success) {
			throw error(400, `Invalid request body: ${parsed.error.issues.map((i) => i.message).join(', ')}`);
		}

		const { role, time_context, in_presence, responses } = parsed.data;

		// Authenticate user (Ch.9.3: mandatory authentication, user_id NOT NULL)
		const user = getAuthenticatedUser(cookies);
		if (!user) {
			throw error(401, 'Authentication required');
		}

		// Verify assessment exists
		const assessment = findAssessmentById(assessmentId);
		if (!assessment) {
			throw error(404, `Assessment '${assessmentId}' not found`);
		}

		// Guard: reject submissions to closed assessments (Ch.14 §14.1)
		if (assessment.closed_at) {
			throw error(409, 'Assessment is closed — no further responses accepted');
		}

		// Load inventory to determine type (review vs pitch)
		const inventory = findInventoryById(assessment.inventory_id);
		if (!inventory) {
			throw error(500, 'Inventory not found for assessment');
		}

		// Review COI check (Ch.14.2, Ch.18 §18.14.5):
		// PO and active team members cannot submit review assessments for their own problem
		if (inventory.inventory_key === 'review_assessment' && assessment.problem_id) {
			const db = getDatabase();

			// Check if user is the Problem Owner
			const problem = db
				.prepare('SELECT created_by FROM problems WHERE problem_id = ?')
				.get(assessment.problem_id) as { created_by: string } | undefined;

			if (problem && problem.created_by === user.user_id) {
				throw error(
					403,
					'Conflict of interest: cannot review your own problem'
				);
			}

			// Check if user is an active team member (any role: po, po_deputy, coder)
			const effectiveRole = getEffectiveRole(assessment.problem_id, user.user_id);
			if (effectiveRole.is_team_member && effectiveRole.member_status === 'active') {
				throw error(
					403,
					'Conflict of interest: team members cannot review their own problem'
				);
			}
		}

		// Determine review_weight_key (Ch.14.2, Ch.9.5.5)
		const reviewWeightKey = determineReviewWeightKey(
			inventory.inventory_key,
			role,
			time_context
		);

		// Submit responses to database
		// Per Ch.9: responses reference concrete item_id, locked to exact version at response time
		const result = submitResponses(
			assessmentId,
			user.user_id,
			role,
			time_context,
			in_presence,
			responses.map((r) => ({
				item_id: r.item_id,
				rating_value: r.rating_value
			})),
			reviewWeightKey
		);

		console.log('Assessment submission persisted:', {
			assessmentId,
			user_id: user.user_id.substring(0, 8) + '...',
			role,
			time_context,
			in_presence,
			review_weight_key: reviewWeightKey,
			response_count: result.response_count,
			superseded_count: result.superseded_count
		});

		// Contribution points (Ch.33.6.3): award review_assessment_completed for review inventories
		const milestones: Array<{ key: string; title: string; message: string }> = [];
		if (inventory.inventory_key === 'review_assessment' && result.response_ids.length > 0) {
			awardContributionPoints(
				user.user_id,
				'review_assessment_completed',
				'response',
				result.response_ids[0],
				assessment.event_id ?? null
			);
			const ms = checkAndAwardMilestone(user.user_id, 'first_assessment_completed', null, null);
			if (ms) milestones.push(ms);
		}

		return json(
			{
				success: true,
				assessment_id: assessmentId,
				response_count: result.response_count,
				superseded_count: result.superseded_count,
				created_at: nowIso(),
				milestones // client fires toast for each new milestone
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
		// Handle AuthError
		if (err instanceof AuthError) {
			throw error(err.status, err.message);
		}

		console.error('Error processing submission:', err);
		const message = err instanceof Error ? err.message : 'Unknown error';
		throw error(500, `Failed to submit responses: ${message}`);
	}
};
