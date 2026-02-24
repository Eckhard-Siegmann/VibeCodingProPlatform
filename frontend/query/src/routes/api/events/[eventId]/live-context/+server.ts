import { json } from '@sveltejs/kit';
import { getLiveContext } from '$lib/server/repositories/events';
import { handleAuthError } from '$lib/server/auth';

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
