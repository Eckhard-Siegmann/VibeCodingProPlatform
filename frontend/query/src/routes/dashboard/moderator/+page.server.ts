import { getEventQueue } from '$lib/server/repositories/queue';
import { getLiveContext } from '$lib/server/repositories/events';
import { getOpenAssessmentForEvent } from '$lib/server/repositories/dashboard';
import { getDatabase } from '$lib/server/db';
import { getAuthenticatedUser } from '$lib/server/auth';
import { getRegistrationCounts } from '$lib/server/repositories/registrations';
import { getEventReviewResults, getEventPitchResults } from '$lib/server/repositories/responses';
import { getCurrentTemplate, ensureDefaultTemplate } from '$lib/server/repositories/email-templates';
import { getReviewScoresForEvent, getEventStarAwards } from '$lib/server/repositories/recognition';
import { getEventAttendeesPaginated, getShowUpStats } from '$lib/server/repositories/attendance';
import { getPendingReviewBacklog } from '$lib/server/repositories/problems';
import { error } from '@sveltejs/kit';

interface LogRow {
    log_id: string;
    type: string;
    recipient_user_id: string | null;
    recipient_count: number | null;
    subject: string | null;
    triggered_by: string;
    created_at: string;
    recipient_display_name: string | null;
    triggered_by_display_name: string | null;
}

interface ReminderRow {
    reminder_due: number;
    reminder_sent_at: string | null;
    title: string;
}

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

    // 3. Backlog problems (TICKET-33: "Load More" pattern, initial 10)
    const backlogResult = getPendingReviewBacklog({ limit: 10, offset: 0 });

    // 4. Recent decisions for event
    const db = getDatabase();
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

    // 5. Registration counts (real data, replaces mocked stats)
    const registrationCounts = getRegistrationCounts(eventId);

    // 6. Reminder status
    const reminderStatus = db.prepare(`
        SELECT reminder_due, reminder_sent_at, title
        FROM events WHERE event_id = ?
    `).get(eventId) as ReminderRow | undefined;

    // 7. Current email template (ensure default exists)
    ensureDefaultTemplate(eventId, user.user_id);
    const currentTemplate = getCurrentTemplate(eventId);

    // 8. Current open assessment (real ID for live context)
    const openAssessment = getOpenAssessmentForEvent(eventId);

    // 9. Event-level review results (Ch.15.4.7)
    const reviewResults = getEventReviewResults(eventId);

    // 9b. Event-level pitch results (Ch.15 Event-Level Pitch Results)
    const pitchResults = getEventPitchResults(eventId);

    // 10b. Star awards data (Ch.33.6.4, Ch.17.9)
    const reviewScores = getReviewScoresForEvent(eventId);
    const existingStarAwards = getEventStarAwards(eventId);

    // 10a. Attendance data (TICKET-33: paginated, initial 50)
    const attendeePage = getEventAttendeesPaginated({ eventId, limit: 50, offset: 0 });
    const showUpStats = getShowUpStats(eventId);

    // 10c. User role for CSV export visibility (Ch.15.3.4)
    const userRow = db.prepare('SELECT role FROM users WHERE user_id = ?').get(user.user_id) as { role: string } | undefined;
    const isAdmin = userRow?.role === 'admin';

    // 10. Communications log (last 20 entries)
    const communicationsLog = db.prepare(`
        SELECT
            cl.log_id,
            cl.type,
            cl.recipient_user_id,
            cl.recipient_count,
            cl.subject,
            cl.triggered_by,
            cl.created_at,
            ru.display_name AS recipient_display_name,
            tu.display_name AS triggered_by_display_name
        FROM communications_log cl
        LEFT JOIN users ru ON cl.recipient_user_id = ru.user_id
        LEFT JOIN users tu ON cl.triggered_by_user_id = tu.user_id
        WHERE cl.event_id = ?
        ORDER BY cl.created_at DESC
        LIMIT 20
    `).all(eventId) as LogRow[];

    return {
        eventId,
        queue,
        liveContext,
        backlogItems: backlogResult.items,
        backlogTotal: backlogResult.totalItems,
        recentDecisions,
        registrationCounts,
        reminderStatus: reminderStatus ? {
            reminderDue: !!reminderStatus.reminder_due,
            reminderSentAt: reminderStatus.reminder_sent_at,
            eventTitle: reminderStatus.title
        } : null,
        currentTemplate,
        communicationsLog,
        openAssessment,
        reviewResults,
        pitchResults,
        reviewScores,
        existingStarAwards,
        attendeeItems: attendeePage.items,
        attendeeTotal: attendeePage.totalItems,
        showUpStats,
        isAdmin
    };
}
