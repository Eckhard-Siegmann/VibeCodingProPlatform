import { json } from '@sveltejs/kit';
import { requireModerator, handleAuthError } from '$lib/server/auth';
import { getDatabase } from '$lib/server/db';

interface LogRow {
	log_id: string;
	event_id: string;
	type: string;
	recipient_user_id: string | null;
	recipient_count: number | null;
	subject: string | null;
	body_preview: string | null;
	template_version: number | null;
	triggered_by: string;
	triggered_by_user_id: string | null;
	created_at: string;
	recipient_display_name: string | null;
	triggered_by_display_name: string | null;
}

/**
 * GET /api/events/[eventId]/communications-log
 * Returns audit log entries for the event, newest first.
 * Auth: moderator or admin only.
 */
export async function GET({ params, cookies, url }) {
	try {
		requireModerator(cookies);
		const { eventId } = params;
		const limit = parseInt(url.searchParams.get('limit') ?? '50', 10);
		const typeFilter = url.searchParams.get('type');

		const db = getDatabase();

		let query = `
			SELECT
				cl.*,
				ru.display_name AS recipient_display_name,
				tu.display_name AS triggered_by_display_name
			FROM communications_log cl
			LEFT JOIN users ru ON cl.recipient_user_id = ru.user_id
			LEFT JOIN users tu ON cl.triggered_by_user_id = tu.user_id
			WHERE cl.event_id = ?
		`;
		const queryParams: (string | number)[] = [eventId];

		if (typeFilter) {
			query += ` AND cl.type = ?`;
			queryParams.push(typeFilter);
		}

		query += ` ORDER BY cl.created_at DESC LIMIT ?`;
		queryParams.push(limit);

		const rows = db.prepare(query).all(...queryParams) as LogRow[];

		return json({ entries: rows });
	} catch (error: unknown) {
		const { body, status } = handleAuthError(error);
		return json(body, { status });
	}
}
