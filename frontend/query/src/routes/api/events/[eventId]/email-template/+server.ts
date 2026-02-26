import { json } from '@sveltejs/kit';
import { requireModerator, handleAuthError } from '$lib/server/auth';
import {
	getCurrentTemplate,
	getTemplateHistory,
	createTemplateVersion
} from '$lib/server/repositories/email-templates';

/**
 * GET /api/events/[eventId]/email-template
 * Returns current template + version history.
 */
export async function GET({ params, cookies }) {
	try {
		requireModerator(cookies);
		const { eventId } = params;

		const current = getCurrentTemplate(eventId);
		const history = getTemplateHistory(eventId);

		return json({ current, history });
	} catch (error: unknown) {
		const { body, status } = handleAuthError(error);
		return json(body, { status });
	}
}

/**
 * PUT /api/events/[eventId]/email-template
 * Create a new template version. Body: { subject, body_markdown }
 */
export async function PUT({ params, request, cookies }) {
	try {
		const user = requireModerator(cookies);
		const { eventId } = params;

		const body = await request.json();
		if (!body.subject || !body.body_markdown) {
			return json(
				{ success: false, error: 'subject and body_markdown are required' },
				{ status: 400 }
			);
		}

		const template = createTemplateVersion(
			eventId,
			body.subject,
			body.body_markdown,
			user.user_id
		);

		return json({ success: true, template });
	} catch (error: unknown) {
		const { body, status } = handleAuthError(error);
		return json(body, { status });
	}
}
