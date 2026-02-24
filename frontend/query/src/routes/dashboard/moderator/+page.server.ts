import { getEventQueue } from '$lib/server/repositories/queue';
import { getLiveContext } from '$lib/server/repositories/events';
import { getDatabase } from '$lib/server/db';
import { getAuthenticatedUser } from '$lib/server/auth';
import { error } from '@sveltejs/kit';

export async function load({ cookies }) {
    const user = getAuthenticatedUser(cookies);
    if (!user) {
        throw error(401, 'Unauthorized');
    }

    // MVP: hardcode event ID
    const eventId = 'event-feb-2026';

    // 1. Queue problems
    const queue = getEventQueue(eventId);

    // 2. Live context
    const liveContext = getLiveContext(eventId);

    // 3. Backlog problems
    const db = getDatabase();
    const backlogProblems = db.prepare(`
		SELECT 
			p.problem_id, 
			p.public_slug as slug, 
			pv.title, 
			u.display_name as owner_display_name,
			p.current_readiness_state, 
			p.created_at as submitted_at
		FROM problems p
		JOIN problem_versions pv ON p.problem_id = pv.problem_id AND pv.is_current = 1
		JOIN users u ON p.created_by_user_id = u.user_id
		WHERE p.current_readiness_state IN ('submitted', 'needs_changes') 
			AND p.current_action_state = 'backlog'
		ORDER BY p.created_at DESC
		LIMIT 20
	`).all() as any[];

    // 4. Recent decisions for event
    const recentDecisions = db.prepare(`
		SELECT 
			d.decision_id, 
			d.decision_type, 
			d.created_at,
			pv.title as problem_title,
			u.display_name as actor_display_name,
			p.public_slug as problem_slug
		FROM decisions d
		JOIN problems p ON d.problem_id = p.problem_id
		JOIN problem_versions pv ON d.problem_id = pv.problem_id AND d.major_version = pv.major_version
		JOIN users u ON d.actor_user_id = u.user_id
		WHERE d.event_id = ?
		ORDER BY d.created_at DESC
		LIMIT 10
	`).all(eventId) as any[];

    return {
        eventId,
        queue,
        liveContext,
        backlogProblems,
        recentDecisions
    };
}
