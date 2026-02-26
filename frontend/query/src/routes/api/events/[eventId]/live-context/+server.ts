import { json } from '@sveltejs/kit';
import { getLiveContext, extendTimer } from '$lib/server/repositories/events';
import { requireModerator, handleAuthError } from '$lib/server/auth';

export async function GET({ params }) {
    try {
        // getLiveContext now includes timer lazy evaluation (Ch.14 §14.5.1.1)
        const context = getLiveContext(params.eventId);
        return json({ success: true, data: context });
    } catch (error: any) {
        const { body, status } = handleAuthError(error);
        return json(body, { status });
    }
}

/**
 * PATCH: Extend or update the live timer (moderator only).
 * Timer management is non-binding — no decision recorded (Ch.14 §14.5.1).
 */
export async function PATCH({ params, request, cookies }) {
    try {
        const user = requireModerator(cookies);
        const body = await request.json();

        if (!body.timer_ends_at) {
            return json({ success: false, error: 'timer_ends_at is required' }, { status: 400 });
        }

        extendTimer(params.eventId, body.timer_ends_at);
        return json({ success: true });
    } catch (error: any) {
        const { body, status } = handleAuthError(error);
        return json(body, { status });
    }
}
