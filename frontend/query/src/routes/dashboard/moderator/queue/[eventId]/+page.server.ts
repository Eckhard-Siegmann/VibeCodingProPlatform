import { getEventQueue, getAvailableBacklog } from '$lib/server/repositories/queue';
import { getAuthenticatedUser } from '$lib/server/auth';
import { getDatabase } from '$lib/server/db';
import { error } from '@sveltejs/kit';

interface EventRow {
	title: string;
	starts_at: string;
	location_name: string;
	room_name: string;
}

export async function load({ params, cookies }) {
	const user = getAuthenticatedUser(cookies);
	if (!user) {
		throw error(401, 'Unauthorized');
	}

	const { eventId } = params;
	const db = getDatabase();

	// 1. Event info
	const eventInfo = db
		.prepare(
			`
		SELECT
			e.title,
			e.starts_at,
			l.name AS location_name,
			r.name AS room_name
		FROM events e
		LEFT JOIN rooms r ON e.room_id = r.room_id
		LEFT JOIN locations l ON r.location_id = l.location_id
		WHERE e.event_id = ?
	`
		)
		.get(eventId) as EventRow | undefined;

	if (!eventInfo) {
		throw error(404, 'Event not found');
	}

	// 2. Current queue (ordered by position_index)
	const queue = getEventQueue(eventId);

	// 3. Available problems: first 20 ("Load More" pattern, initial batch)
	const availableResult = getAvailableBacklog({ limit: 20, offset: 0 });

	return {
		eventId,
		eventTitle: eventInfo.title,
		eventDate: eventInfo.starts_at,
		locationName: eventInfo.location_name
			? `${eventInfo.location_name}${eventInfo.room_name ? ` — ${eventInfo.room_name}` : ''}`
			: '',
		queue,
		availableProblems: { items: availableResult.items, totalItems: availableResult.totalItems }
	};
}
