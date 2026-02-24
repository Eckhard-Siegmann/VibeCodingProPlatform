import { json } from '@sveltejs/kit';
import { recordDecision } from '$lib/server/repositories/events';
import { requireModeratorForProblem, handleAuthError } from '$lib/server/auth';

export async function POST({ params, request, cookies }) {
    try {
        const body = await request.json();
        if (!body.problem_id || !body.decision_type) {
            return json({ success: false, error: 'problem_id and decision_type are required' }, { status: 400 });
        }

        // Ch.18 §18.14: moderator + objectivity constraint
        const user = requireModeratorForProblem(cookies, body.problem_id);

        const result = recordDecision({
            eventId: params.eventId,
            problemId: body.problem_id,
            decisionType: body.decision_type,
            actorUserId: user.user_id,
            rationale: body.rationale,
            timerDurationMinutes: body.timer_duration_minutes
        });

        if (!result.success) {
            return json(result, { status: 500 });
        }
        return json(result);
    } catch (error: any) {
        const { body, status } = handleAuthError(error);
        return json(body, { status });
    }
}
