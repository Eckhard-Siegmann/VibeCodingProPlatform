import { json } from '@sveltejs/kit';
import { requireModerator, handleAuthError } from '$lib/server/auth';
import { getDatabase, nowIso } from '$lib/server/db';
import { sendEmail, logCommunication } from '$lib/server/email';
import { getCurrentTemplate, getRegisteredEmails } from '$lib/server/repositories/email-templates';

/**
 * POST /api/events/[eventId]/broadcast
 * Send broadcast email to all registered participants.
 * Auth: moderator or admin only.
 */
export async function POST({ params, cookies }) {
	try {
		const user = requireModerator(cookies);
		const { eventId } = params;

		const template = getCurrentTemplate(eventId);
		if (!template) {
			return json({ success: false, error: 'No email template exists for this event' }, { status: 400 });
		}

		const recipients = getRegisteredEmails(eventId);
		if (recipients.length === 0) {
			return json({ success: false, error: 'No registered participants to send to' }, { status: 400 });
		}

		// Send email to each recipient (ADR 005: Brevo in prod, console in dev)
		for (const recipient of recipients) {
			await sendEmail({
				to: recipient.email,
				toName: recipient.display_name,
				subject: template.subject,
				bodyMarkdown: template.body_markdown
			});
		}

		// Log to communications_log
		logCommunication({
			eventId,
			type: 'broadcast_manual',
			recipientUserId: null,
			recipientCount: recipients.length,
			subject: template.subject,
			bodyPreview: template.body_markdown.substring(0, 500),
			templateVersion: template.version,
			triggeredBy: 'moderator',
			triggeredByUserId: user.user_id
		});

		// Update reminder_sent_at on the event
		const db = getDatabase();
		db.prepare(`
			UPDATE events SET reminder_sent_at = ? WHERE event_id = ?
		`).run(nowIso(), eventId);

		return json({ success: true, recipientCount: recipients.length });
	} catch (error: unknown) {
		const { body, status } = handleAuthError(error);
		return json(body, { status });
	}
}
