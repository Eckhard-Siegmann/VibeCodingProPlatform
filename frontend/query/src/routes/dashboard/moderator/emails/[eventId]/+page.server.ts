import { getAuthenticatedUser } from '$lib/server/auth';
import {
	getCurrentTemplate,
	getTemplateHistory,
	ensureDefaultTemplate
} from '$lib/server/repositories/email-templates';
import { getRegistrationCounts } from '$lib/server/repositories/registrations';
import { getDatabase } from '$lib/server/db';
import { error } from '@sveltejs/kit';

export async function load({ params, cookies }) {
	const user = getAuthenticatedUser(cookies);
	if (!user) {
		throw error(401, 'Unauthorized');
	}

	const { eventId } = params;
	const db = getDatabase();

	// Event info for page title
	const eventInfo = db
		.prepare(`SELECT title FROM events WHERE event_id = ?`)
		.get(eventId) as { title: string } | undefined;

	if (!eventInfo) {
		throw error(404, 'Event not found');
	}

	// Ensure default template exists
	ensureDefaultTemplate(eventId, user.user_id);

	// Current template + full history
	const currentTemplate = getCurrentTemplate(eventId);
	const templateHistory = getTemplateHistory(eventId);

	// Recipient count for display
	const registrationCounts = getRegistrationCounts(eventId);

	return {
		eventId,
		eventTitle: eventInfo.title,
		currentTemplate,
		templateHistory,
		recipientCount: registrationCounts.registeredCount + registrationCounts.waitlistCount
	};
}
