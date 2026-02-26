/**
 * Email service layer — Brevo REST API dispatch + communications_log writer.
 *
 * ADR 005: Two dispatch patterns:
 *   1. Transactional (templateId + params) — auth flows
 *   2. Event (generic wrapper template + moderator content) — broadcasts, invites
 *
 * Dev mode: When BREVO_API_KEY is not set, logs to console only.
 * Always writes to communications_log for audit trail regardless of mode.
 */

import { env } from '$env/dynamic/private';
import { getDatabase, generateId, nowIso } from './db';

// ── Brevo Configuration ─────────────────────────────────────────────

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

function getBrevoConfig() {
	return {
		apiKey: env.BREVO_API_KEY ?? '',
		senderEmail: env.BREVO_SENDER_EMAIL ?? 'noreply@vibecoding.events',
		senderName: env.BREVO_SENDER_NAME ?? 'VibeCoding Community',
		templateEmailConfirmation: env.BREVO_TEMPLATE_EMAIL_CONFIRMATION
			? parseInt(env.BREVO_TEMPLATE_EMAIL_CONFIRMATION, 10)
			: null,
		templatePasswordReset: env.BREVO_TEMPLATE_PASSWORD_RESET
			? parseInt(env.BREVO_TEMPLATE_PASSWORD_RESET, 10)
			: null,
		templateOnboardingOtp: env.BREVO_TEMPLATE_ONBOARDING_OTP
			? parseInt(env.BREVO_TEMPLATE_ONBOARDING_OTP, 10)
			: null,
		templateEventGeneric: env.BREVO_TEMPLATE_EVENT_GENERIC
			? parseInt(env.BREVO_TEMPLATE_EVENT_GENERIC, 10)
			: null,
		origin: env.ORIGIN ?? 'http://localhost:5173'
	};
}

function isBrevoEnabled(): boolean {
	return !!env.BREVO_API_KEY;
}

// ── Types ───────────────────────────────────────────────────────────

export type CommunicationType =
	| 'broadcast_manual'
	| 'waitlist_invite'
	| 'waitlist_expired'
	| 'reminder_manual';

export interface CommLogEntry {
	eventId: string;
	type: CommunicationType;
	recipientUserId: string | null;
	recipientCount: number | null;
	subject: string | null;
	bodyPreview: string | null;
	templateVersion: number | null;
	triggeredBy: 'system' | 'moderator';
	triggeredByUserId: string | null;
}

export interface SendEmailParams {
	to: string;
	toName?: string;
	subject: string;
	bodyMarkdown: string;
}

interface BrevoRecipient {
	email: string;
	name?: string;
}

interface BrevoPayload {
	to: BrevoRecipient[];
	templateId: number;
	params: Record<string, string>;
	headers?: Record<string, string>;
	sender?: { email: string; name: string };
}

// ── Low-level Brevo API call ────────────────────────────────────────

/**
 * Send a request to the Brevo transactional email API.
 * Returns true on success, false on failure (logs error).
 */
async function callBrevoApi(payload: BrevoPayload): Promise<boolean> {
	const config = getBrevoConfig();

	try {
		const response = await fetch(BREVO_API_URL, {
			method: 'POST',
			headers: {
				'accept': 'application/json',
				'content-type': 'application/json',
				'api-key': config.apiKey
			},
			body: JSON.stringify({
				sender: payload.sender ?? {
					email: config.senderEmail,
					name: config.senderName
				},
				to: payload.to,
				templateId: payload.templateId,
				params: payload.params,
				headers: payload.headers
			})
		});

		if (!response.ok) {
			const errorBody = await response.text();
			console.error(
				`[BREVO] API error ${response.status}: ${errorBody}`,
				`templateId=${payload.templateId}`,
				`to=${payload.to[0]?.email}`
			);
			return false;
		}

		return true;
	} catch (err) {
		console.error('[BREVO] Network error:', err);
		return false;
	}
}

// ── Dev-mode logging ────────────────────────────────────────────────

function logDevEmail(label: string, to: string, toName: string | undefined, params: Record<string, string>): void {
	console.log(`[EMAIL-DEV] ${label}`);
	console.log(`[EMAIL-DEV] To: ${to} (${toName ?? 'unknown'})`);
	for (const [key, value] of Object.entries(params)) {
		if (key.startsWith('_')) continue; // skip internal params
		const display = value.length > 120 ? value.substring(0, 120) + '...' : value;
		console.log(`[EMAIL-DEV]   ${key}: ${display}`);
	}
	console.log('[EMAIL-DEV] ---');
}

// ── Transactional Email Dispatch (Pattern 1) ────────────────────────

/**
 * Send email confirmation link after self-registration.
 * Brevo template receives: confirmation_url, display_name
 */
export async function sendConfirmationEmail(
	to: string,
	displayName: string,
	confirmationHash: string
): Promise<boolean> {
	const config = getBrevoConfig();
	const confirmationUrl = `${config.origin}/confirm-email?hash=${confirmationHash}`;
	const params = {
		confirmation_url: confirmationUrl,
		display_name: displayName,
		_idempotency_key: `confirm:${confirmationHash.substring(0, 8)}`
	};

	if (!isBrevoEnabled() || !config.templateEmailConfirmation) {
		logDevEmail('Email Confirmation', to, displayName, params);
		console.log(`[EMAIL-DEV] Confirmation link: ${confirmationUrl}`);
		return true;
	}

	return callBrevoApi({
		to: [{ email: to, name: displayName }],
		templateId: config.templateEmailConfirmation,
		params
	});
}

/**
 * Send password reset OTP.
 * Brevo template receives: otp_code, display_name
 */
export async function sendPasswordResetEmail(
	to: string,
	displayName: string,
	otpCode: string
): Promise<boolean> {
	const params = {
		otp_code: otpCode,
		display_name: displayName,
		_idempotency_key: `reset:${Date.now().toString(36)}`
	};

	if (!isBrevoEnabled() || !getBrevoConfig().templatePasswordReset) {
		logDevEmail('Password Reset OTP', to, displayName, params);
		console.log(`[EMAIL-DEV] OTP: ${otpCode}`);
		return true;
	}

	return callBrevoApi({
		to: [{ email: to, name: displayName }],
		templateId: getBrevoConfig().templatePasswordReset!,
		params
	});
}

/**
 * Send onboarding OTP for CSV-imported users.
 * Brevo template receives: otp_code, set_password_url, display_name
 */
export async function sendOnboardingOtpEmail(
	to: string,
	displayName: string,
	otpCode: string
): Promise<boolean> {
	const config = getBrevoConfig();
	const setPasswordUrl = `${config.origin}/set-password?email=${encodeURIComponent(to)}`;
	const params = {
		otp_code: otpCode,
		set_password_url: setPasswordUrl,
		display_name: displayName,
		_idempotency_key: `onboard:${to}`
	};

	if (!isBrevoEnabled() || !config.templateOnboardingOtp) {
		logDevEmail('Onboarding OTP', to, displayName, params);
		console.log(`[EMAIL-DEV] OTP: ${otpCode}`);
		console.log(`[EMAIL-DEV] Set-password link: ${setPasswordUrl}`);
		return true;
	}

	return callBrevoApi({
		to: [{ email: to, name: displayName }],
		templateId: config.templateOnboardingOtp,
		params
	});
}

// ── Event Email Dispatch (Pattern 2) ────────────────────────────────

/**
 * Send an event-related email using the generic wrapper template.
 * The wrapper template receives subject_line + body_content as params,
 * and handles all visual layout (header, footer, unsubscribe).
 *
 * Used for: broadcasts, waitlist invites, reminders.
 * Backwards-compatible with the old sendEmail() signature.
 */
export async function sendEmail(params: SendEmailParams): Promise<boolean> {
	const config = getBrevoConfig();
	const templateParams = {
		subject_line: params.subject,
		body_content: params.bodyMarkdown,
		display_name: params.toName ?? ''
	};

	if (!isBrevoEnabled() || !config.templateEventGeneric) {
		console.log(`[EMAIL-DEV] To: ${params.to} (${params.toName ?? 'unknown'})`);
		console.log(`[EMAIL-DEV] Subject: ${params.subject}`);
		console.log(`[EMAIL-DEV] Body:\n${params.bodyMarkdown.substring(0, 200)}...`);
		console.log('[EMAIL-DEV] ---');
		return true;
	}

	return callBrevoApi({
		to: [{ email: params.to, name: params.toName }],
		templateId: config.templateEventGeneric,
		params: templateParams
	});
}

// ── Communications log ──────────────────────────────────────────────

/**
 * Write an immutable audit entry to communications_log.
 * Returns the log_id of the new entry.
 */
export function logCommunication(entry: CommLogEntry): string {
	const db = getDatabase();
	const logId = generateId();
	const now = nowIso();

	db.prepare(`
		INSERT INTO communications_log
		(log_id, event_id, type, recipient_user_id, recipient_count, subject, body_preview, template_version, triggered_by, triggered_by_user_id, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`).run(
		logId,
		entry.eventId,
		entry.type,
		entry.recipientUserId,
		entry.recipientCount,
		entry.subject,
		entry.bodyPreview ? entry.bodyPreview.substring(0, 500) : null,
		entry.templateVersion,
		entry.triggeredBy,
		entry.triggeredByUserId,
		now
	);

	return logId;
}
