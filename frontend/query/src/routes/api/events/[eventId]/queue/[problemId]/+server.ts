import { json } from '@sveltejs/kit';
import { removeFromQueue } from '$lib/server/repositories/queue';
import { requireModerator, handleAuthError } from '$lib/server/auth';

export async function DELETE({ params, cookies }) {
    try {
        const user = requireModerator(cookies);

        const result = removeFromQueue(params.eventId, params.problemId);
        if (!result.success) {
            return json(result, { status: 500 });
        }
        return json(result);
    } catch (error: any) {
        const { body, status } = handleAuthError(error);
        return json(body, { status });
    }
}
