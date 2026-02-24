import { getDatabase, generateId, nowIso } from '../db';

export interface QueueItem {
	queue_id: string;
	event_id: string;
	problem_id: string;
	queue_state: string;
	position_index: number;
	added_at: string;
	updated_at: string;
}

export interface QueueItemWithProblem extends QueueItem {
	title: string;
	owner_display_name: string;
	current_readiness_state: string;
	current_action_state: string;
	current_major_version: number;
	problem_type: string;
}

/**
 * Gets the current ordered queue for an event
 */
export function getEventQueue(eventId: string): QueueItemWithProblem[] {
	const db = getDatabase();

	const query = `
		SELECT 
			q.queue_id, q.event_id, q.problem_id, q.queue_state, q.position_index, q.added_at, q.updated_at,
			pv.title,
			u.display_name as owner_display_name,
			p.current_readiness_state, p.current_action_state, p.current_major_version, p.problem_type
		FROM event_problem_queue q
		JOIN problems p ON q.problem_id = p.problem_id
		JOIN problem_versions pv ON p.problem_id = pv.problem_id AND pv.is_current = 1
		JOIN users u ON p.created_by_user_id = u.user_id
		WHERE q.event_id = ?
		ORDER BY q.position_index ASC
	`;

	return db.prepare(query).all(eventId) as QueueItemWithProblem[];
}

/**
 * Adds a problem to the end of the event queue
 */
export function addToQueue(
	eventId: string,
	problemId: string,
	queueState = 'candidate'
): { success: boolean; queue_id?: string; error?: string } {
	const db = getDatabase();

	try {
        // First check if it's already in the queue
        const existing = db.prepare('SELECT queue_id FROM event_problem_queue WHERE event_id = ? AND problem_id = ?').get(eventId, problemId) as {queue_id: string} | undefined;
        if (existing) {
            return { success: true, queue_id: existing.queue_id }; // Already in queue, consider it a success
        }

		// Get max position_index to append to the end
		const maxPosResult = db
			.prepare('SELECT MAX(position_index) as max_pos FROM event_problem_queue WHERE event_id = ?')
			.get(eventId) as { max_pos: number | null };

		const nextPos = (maxPosResult.max_pos ?? 0) + 1;
		const queueId = generateId();
		const now = nowIso();

		db.prepare(
			`
			INSERT INTO event_problem_queue 
			(queue_id, event_id, problem_id, queue_state, position_index, added_at, updated_at)
			VALUES (?, ?, ?, ?, ?, ?, ?)
		`
		).run(queueId, eventId, problemId, queueState, nextPos, now, now);

		return { success: true, queue_id: queueId };
	} catch (err: any) {
		console.error('Error adding to queue:', err);
		return { success: false, error: err.message };
	}
}

/**
 * Inner removal logic without its own transaction.
 * Safe to call inside an existing db.transaction() block.
 */
export function removeFromQueueRaw(eventId: string, problemId: string): boolean {
	const db = getDatabase();
	const now = nowIso();

	const item = db
		.prepare(
			'SELECT position_index FROM event_problem_queue WHERE event_id = ? AND problem_id = ?'
		)
		.get(eventId, problemId) as { position_index: number } | undefined;

	if (!item) {
		return true; // Was not in queue
	}

	db.prepare('DELETE FROM event_problem_queue WHERE event_id = ? AND problem_id = ?').run(
		eventId,
		problemId
	);

	// Compact remaining by shifting down items that were after this one
	db.prepare(
		`
		UPDATE event_problem_queue
		SET position_index = position_index - 1, updated_at = ?
		WHERE event_id = ? AND position_index > ?
	`
	).run(now, eventId, item.position_index);

	return true;
}

/**
 * Removes a problem from the queue and compacts the remaining position indices.
 * Wraps removeFromQueueRaw in its own transaction for standalone use.
 */
export function removeFromQueue(
	eventId: string,
	problemId: string
): { success: boolean; error?: string } {
	const db = getDatabase();

	try {
		const result = db.transaction(() => removeFromQueueRaw(eventId, problemId))();
		return { success: result };
	} catch (err: any) {
		console.error('Error removing from queue:', err);
		return { success: false, error: err.message };
	}
}

/**
 * Updates the state of an item in the queue
 */
export function updateQueueState(
	eventId: string,
	problemId: string,
	newState: string
): { success: boolean; error?: string } {
	const db = getDatabase();

	try {
		const result = db
			.prepare(
				`
			UPDATE event_problem_queue 
			SET queue_state = ?, updated_at = ?
			WHERE event_id = ? AND problem_id = ?
		`
			)
			.run(newState, nowIso(), eventId, problemId);

		return { success: result.changes > 0 };
	} catch (err: any) {
		console.error('Error updating queue state:', err);
		return { success: false, error: err.message };
	}
}

/**
 * Reorders the queue based on an array of problem IDs
 */
export function reorderQueue(
	eventId: string,
	orderedProblemIds: string[]
): { success: boolean; error?: string } {
	const db = getDatabase();

	try {
		db.transaction(() => {
			const now = nowIso();
			const stmt = db.prepare(`
				UPDATE event_problem_queue 
				SET position_index = ?, updated_at = ?
				WHERE event_id = ? AND problem_id = ?
			`);

			// Update each item with its new 1-based index
			orderedProblemIds.forEach((problemId, index) => {
				stmt.run(index + 1, now, eventId, problemId);
			});
		})();

		return { success: true };
	} catch (err: any) {
		console.error('Error reordering queue:', err);
		return { success: false, error: err.message };
	}
}
