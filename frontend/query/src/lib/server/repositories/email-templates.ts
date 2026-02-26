/**
 * Email template repository — versioned templates per event (Ch.16.6, Ch.19.3.9).
 *
 * Templates are immutable once created; edits produce new versions.
 * Only one version per event has is_current = 1.
 */

import { getDatabase, generateId, nowIso } from '../db';

// ── Types ───────────────────────────────────────────────────────────

export interface EmailTemplate {
	template_id: string;
	event_id: string;
	version: number;
	subject: string;
	body_markdown: string;
	created_at: string;
	created_by_user_id: string;
	created_by_display_name?: string;
	is_current: boolean;
}

export interface RegisteredRecipient {
	user_id: string;
	email: string;
	display_name: string;
}

// ── Internal row types ──────────────────────────────────────────────

interface TemplateRow {
	template_id: string;
	event_id: string;
	version: number;
	subject: string;
	body_markdown: string;
	created_at: string;
	created_by_user_id: string;
	created_by_display_name?: string;
	is_current: number;
}

interface RecipientRow {
	user_id: string;
	email: string;
	display_name: string;
}

// ── Read operations ─────────────────────────────────────────────────

/**
 * Get the current (latest) template for an event.
 */
export function getCurrentTemplate(eventId: string): EmailTemplate | null {
	const db = getDatabase();

	const row = db.prepare(`
		SELECT t.*, u.display_name AS created_by_display_name
		FROM event_email_templates t
		JOIN users u ON t.created_by_user_id = u.user_id
		WHERE t.event_id = ? AND t.is_current = 1
	`).get(eventId) as TemplateRow | undefined;

	if (!row) return null;

	return {
		...row,
		is_current: !!row.is_current
	};
}

/**
 * Get full version history for an event's templates, newest first.
 */
export function getTemplateHistory(eventId: string): EmailTemplate[] {
	const db = getDatabase();

	const rows = db.prepare(`
		SELECT t.*, u.display_name AS created_by_display_name
		FROM event_email_templates t
		JOIN users u ON t.created_by_user_id = u.user_id
		WHERE t.event_id = ?
		ORDER BY t.version DESC
	`).all(eventId) as TemplateRow[];

	return rows.map((row) => ({
		...row,
		is_current: !!row.is_current
	}));
}

/**
 * Create a new template version. Marks previous versions as not current.
 */
export function createTemplateVersion(
	eventId: string,
	subject: string,
	bodyMarkdown: string,
	userId: string
): EmailTemplate {
	const db = getDatabase();

	return db.transaction(() => {
		// Find max version for this event
		const maxRow = db.prepare(`
			SELECT COALESCE(MAX(version), 0) AS max_version
			FROM event_email_templates
			WHERE event_id = ?
		`).get(eventId) as { max_version: number };

		const newVersion = maxRow.max_version + 1;

		// Unset current on all existing
		db.prepare(`
			UPDATE event_email_templates SET is_current = 0 WHERE event_id = ?
		`).run(eventId);

		// Insert new version
		const templateId = generateId();
		const now = nowIso();

		db.prepare(`
			INSERT INTO event_email_templates
			(template_id, event_id, version, subject, body_markdown, created_at, created_by_user_id, is_current)
			VALUES (?, ?, ?, ?, ?, ?, ?, 1)
		`).run(templateId, eventId, newVersion, subject, bodyMarkdown, now, userId);

		return {
			template_id: templateId,
			event_id: eventId,
			version: newVersion,
			subject,
			body_markdown: bodyMarkdown,
			created_at: now,
			created_by_user_id: userId,
			is_current: true
		};
	})();
}

/**
 * Ensure a default V1 template exists for an event. No-op if one exists.
 */
export function ensureDefaultTemplate(eventId: string, userId: string): void {
	const existing = getCurrentTemplate(eventId);
	if (existing) return;

	createTemplateVersion(
		eventId,
		'Reminder: {{event_title}} starts soon!',
		`Hi {{display_name}},\n\nThis is a reminder that **{{event_title}}** is starting soon.\n\n**When:** {{starts_at}}\n**Where:** {{location}}\n\nWe look forward to seeing you there!\n\nBest,\nThe VibeCoding Team`,
		userId
	);
}

/**
 * Get all registered (non-cancelled) users with emails for an event.
 */
export function getRegisteredEmails(eventId: string): RegisteredRecipient[] {
	const db = getDatabase();

	const rows = db.prepare(`
		SELECT u.user_id, u.email, u.display_name
		FROM event_registrations er
		JOIN users u ON er.user_id = u.user_id
		WHERE er.event_id = ? AND er.cancelled_at IS NULL AND u.email IS NOT NULL
		ORDER BY u.display_name
	`).all(eventId) as RecipientRow[];

	return rows;
}
