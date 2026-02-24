import { json } from '@sveltejs/kit';
import { getEventQueue, addToQueue, reorderQueue } from '$lib/server/repositories/queue';
import { requireModerator, handleAuthError } from '$lib/server/auth';

export async function GET({ params }) {
    try {
        const queue = getEventQueue(params.eventId);
        return json({ success: true, data: queue });
    } catch (error: any) {
        return json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST({ params, request, cookies }) {
    try {
        const user = requireModerator(cookies);

        const body = await request.json();
        if (!body.problem_id) {
            return json({ success: false, error: 'problem_id is required' }, { status: 400 });
        }

        const result = addToQueue(params.eventId, body.problem_id, body.queue_state);
        if (!result.success) {
            return json(result, { status: 500 });
        }
        return json(result);
    } catch (error: any) {
        const { body, status } = handleAuthError(error);
        return json(body, { status });
    }
}

export async function PATCH({ params, request, cookies }) {
    try {
        const user = requireModerator(cookies);

        const body = await request.json();
        if (!body.ordered_problem_ids || !Array.isArray(body.ordered_problem_ids)) {
            return json({ success: false, error: 'ordered_problem_ids must be an array' }, { status: 400 });
        }

        const result = reorderQueue(params.eventId, body.ordered_problem_ids);
        if (!result.success) {
            return json(result, { status: 500 });
        }
        return json(result);
    } catch (error: any) {
        const { body, status } = handleAuthError(error);
        return json(body, { status });
    }
}
