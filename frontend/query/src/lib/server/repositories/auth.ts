/**
 * Authentication repository — registration, login, password management, email confirmation.
 * Spec: Ch. 18, Ch. 30 | ADR 004 (bcrypt), ADR 007 (sessions)
 */

import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { getDatabase, generateId, nowIso } from '../db';

const BCRYPT_COST = 12;
const OTP_LENGTH = 12;
const CONFIRM_HASH_LENGTH = 64;
const CONFIRM_VALIDITY_HOURS = 24;

// ── Types ────────────────────────────────────────────────────────────

export interface UserRow {
	user_id: string;
	email: string;
	display_name: string;
	password_hash: string | null;
	role: string;
	email_confirmed: number;
	login_enabled: number;
	otp_hash: string | null;
	otp_is_initial: number;
	terms_accepted_at: string | null;
}

// ── Lookup ───────────────────────────────────────────────────────────

export function findUserByEmail(email: string): UserRow | null {
	const db = getDatabase();
	return db.prepare(`
		SELECT user_id, email, display_name, password_hash, role,
		       email_confirmed, login_enabled, otp_hash, otp_is_initial, terms_accepted_at
		FROM users WHERE LOWER(email) = LOWER(?)
	`).get(email) as UserRow | null;
}

export function findUserById(userId: string): UserRow | null {
	const db = getDatabase();
	return db.prepare(`
		SELECT user_id, email, display_name, password_hash, role,
		       email_confirmed, login_enabled, otp_hash, otp_is_initial, terms_accepted_at
		FROM users WHERE user_id = ?
	`).get(userId) as UserRow | null;
}

export function emailExists(email: string): boolean {
	const db = getDatabase();
	const row = db.prepare('SELECT 1 FROM users WHERE LOWER(email) = LOWER(?)').get(email);
	return !!row;
}

// ── Registration ─────────────────────────────────────────────────────

export interface RegisterInput {
	email: string;
	displayName: string;
	password: string;
	acceptTerms: boolean;
	getInfoletter: boolean;
}

/**
 * Register a new user with email + password (self-registration).
 * Sets login_enabled = TRUE, email_confirmed = FALSE.
 * Returns user_id and confirmation hash for email.
 */
export async function registerLocalUser(input: RegisterInput): Promise<{
	userId: string;
	confirmationHash: string;
}> {
	const db = getDatabase();
	const userId = generateId();
	const now = nowIso();

	// Hash password with bcrypt
	const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);

	// Generate email confirmation hash
	const confirmationHash = crypto.randomBytes(CONFIRM_HASH_LENGTH / 2).toString('hex');
	const confirmExpiresAt = new Date(
		Date.now() + CONFIRM_VALIDITY_HOURS * 60 * 60 * 1000
	).toISOString();

	db.prepare(`
		INSERT INTO users (
			user_id, email, display_name, password_hash, auth_provider, role,
			email_confirmed, email_confirm_hash, email_confirm_expires_at,
			login_enabled, get_infoletter, terms_accepted_at,
			show_on_contributor_wall, show_first_time_hints, audio_cues_enabled,
			created_at
		) VALUES (?, ?, ?, ?, 'local', 'observer',
			0, ?, ?,
			1, ?, ?,
			1, 1, 0,
			?)
	`).run(
		userId,
		input.email,
		input.displayName,
		passwordHash,
		confirmationHash,
		confirmExpiresAt,
		input.getInfoletter ? 1 : 0,
		input.acceptTerms ? now : null,
		now
	);

	return { userId, confirmationHash };
}

// ── Login ────────────────────────────────────────────────────────────

export interface LoginResult {
	success: boolean;
	userId?: string;
	error?: string;
	otpPending?: boolean;
}

/**
 * Verify email + password credentials.
 * Returns userId on success, error message on failure.
 */
export async function verifyCredentials(email: string, password: string): Promise<LoginResult> {
	const user = findUserByEmail(email);

	if (!user) {
		return { success: false, error: 'Invalid email or password.' };
	}

	if (!user.login_enabled) {
		if (user.otp_is_initial) {
			return { success: false, error: 'You need to set your password first.', otpPending: true };
		}
		return { success: false, error: 'This account has been deactivated. Contact an administrator.' };
	}

	if (!user.password_hash) {
		// OTP pending (password invalidated by reset) — login_enabled is TRUE but no password set
		if (user.otp_hash) {
			return { success: false, error: 'You need to set your password first.', otpPending: true };
		}
		return { success: false, error: 'This account uses OAuth. Please sign in with GitHub or LinkedIn.' };
	}

	const valid = await bcrypt.compare(password, user.password_hash);
	if (!valid) {
		return { success: false, error: 'Invalid email or password.' };
	}

	// Update last_login_at
	const db = getDatabase();
	db.prepare('UPDATE users SET last_login_at = ? WHERE user_id = ?').run(nowIso(), user.user_id);

	return { success: true, userId: user.user_id };
}

// ── OTP & Password Reset ────────────────────────────────────────────

/**
 * Generate OTP for password reset. Returns the raw OTP (to send via email).
 */
export async function generatePasswordResetOtp(email: string): Promise<string | null> {
	const user = findUserByEmail(email);
	if (!user) return null; // Don't reveal email existence

	const otp = generateOtp();
	const otpHash = await bcrypt.hash(otp, BCRYPT_COST);

	const db = getDatabase();
	db.prepare(`
		UPDATE users SET otp_hash = ?, otp_is_initial = 1, password_hash = NULL WHERE user_id = ?
	`).run(otpHash, user.user_id);

	return otp;
}

/**
 * Verify OTP and set new password.
 * Returns success/error.
 */
export async function setPasswordWithOtp(
	email: string,
	otp: string,
	newPassword: string
): Promise<{ success: boolean; userId?: string; error?: string }> {
	const user = findUserByEmail(email);
	if (!user || !user.otp_hash) {
		return { success: false, error: 'Invalid one-time password. Please check your email and try again.' };
	}

	const valid = await bcrypt.compare(otp, user.otp_hash);
	if (!valid) {
		return { success: false, error: 'Invalid one-time password. Please check your email and try again.' };
	}

	const passwordHash = await bcrypt.hash(newPassword, BCRYPT_COST);
	const db = getDatabase();
	db.prepare(`
		UPDATE users
		SET password_hash = ?, otp_hash = NULL, otp_is_initial = 0, login_enabled = 1
		WHERE user_id = ?
	`).run(passwordHash, user.user_id);

	return { success: true, userId: user.user_id };
}

// ── Email Confirmation ──────────────────────────────────────────────

export interface ConfirmResult {
	status: 'confirmed' | 'expired' | 'invalid' | 'already_confirmed';
	userId?: string;
}

/**
 * Confirm email using the hash from confirmation link.
 */
export function confirmEmail(hash: string): ConfirmResult {
	const db = getDatabase();
	const now = nowIso();

	const user = db.prepare(`
		SELECT user_id, email_confirmed, email_confirm_expires_at
		FROM users WHERE email_confirm_hash = ?
	`).get(hash) as { user_id: string; email_confirmed: number; email_confirm_expires_at: string | null } | undefined;

	if (!user) {
		// Check if already confirmed (hash was cleared)
		return { status: 'invalid' };
	}

	if (user.email_confirmed) {
		return { status: 'already_confirmed', userId: user.user_id };
	}

	if (user.email_confirm_expires_at && user.email_confirm_expires_at < now) {
		return { status: 'expired', userId: user.user_id };
	}

	// Confirm
	db.prepare(`
		UPDATE users
		SET email_confirmed = 1, email_confirm_hash = NULL, email_confirm_expires_at = NULL
		WHERE user_id = ?
	`).run(user.user_id);

	return { status: 'confirmed', userId: user.user_id };
}

/**
 * Regenerate email confirmation hash for a user.
 * Returns the new hash (for sending email).
 */
export function regenerateConfirmationHash(userId: string): string | null {
	const db = getDatabase();
	const user = db.prepare('SELECT email_confirmed FROM users WHERE user_id = ?').get(userId) as { email_confirmed: number } | undefined;

	if (!user || user.email_confirmed) return null;

	const confirmationHash = crypto.randomBytes(CONFIRM_HASH_LENGTH / 2).toString('hex');
	const confirmExpiresAt = new Date(
		Date.now() + CONFIRM_VALIDITY_HOURS * 60 * 60 * 1000
	).toISOString();

	db.prepare(`
		UPDATE users SET email_confirm_hash = ?, email_confirm_expires_at = ?
		WHERE user_id = ?
	`).run(confirmationHash, confirmExpiresAt, userId);

	return confirmationHash;
}

// ── Password Change ──────────────────────────────────────────────────

/**
 * Change a user's password after verifying their current password.
 * Per Ch.18.9: all sessions are destroyed after password change.
 */
export async function changePassword(
	userId: string,
	currentPassword: string,
	newPassword: string
): Promise<{ success: boolean; error?: string }> {
	const db = getDatabase();

	const user = db.prepare(
		'SELECT password_hash, login_enabled FROM users WHERE user_id = ?'
	).get(userId) as { password_hash: string | null; login_enabled: number } | undefined;

	if (!user) {
		return { success: false, error: 'User not found.' };
	}

	if (!user.password_hash) {
		return { success: false, error: 'Password change is not available for OAuth accounts.' };
	}

	const valid = await bcrypt.compare(currentPassword, user.password_hash);
	if (!valid) {
		return { success: false, error: 'Incorrect current password.' };
	}

	const newHash = await bcrypt.hash(newPassword, BCRYPT_COST);
	db.prepare('UPDATE users SET password_hash = ? WHERE user_id = ?').run(newHash, userId);

	return { success: true };
}

// ── Newsletter Toggle ────────────────────────────────────────────────

/**
 * Toggle newsletter subscription for a user (Ch.30.6).
 */
export function setNewsletterPreference(userId: string, subscribe: boolean): void {
	const db = getDatabase();
	db.prepare('UPDATE users SET get_infoletter = ? WHERE user_id = ?').run(
		subscribe ? 1 : 0,
		userId
	);
}

/**
 * Get current newsletter preference for a user.
 */
export function getNewsletterPreference(userId: string): boolean | null {
	const db = getDatabase();
	const row = db.prepare('SELECT get_infoletter FROM users WHERE user_id = ?').get(userId) as
		| { get_infoletter: number }
		| undefined;
	if (!row) return null;
	return !!row.get_infoletter;
}

/**
 * Toggle audio cues preference for a user (Ch.14.5.1, TICKET-27).
 */
export function setAudioCuesPreference(userId: string, enabled: boolean): void {
	const db = getDatabase();
	db.prepare('UPDATE users SET audio_cues_enabled = ? WHERE user_id = ?').run(
		enabled ? 1 : 0,
		userId
	);
}

/**
 * Get current audio cues preference for a user.
 */
export function getAudioCuesPreference(userId: string): boolean | null {
	const db = getDatabase();
	const row = db.prepare('SELECT audio_cues_enabled FROM users WHERE user_id = ?').get(userId) as
		| { audio_cues_enabled: number }
		| undefined;
	if (!row) return null;
	return !!row.audio_cues_enabled;
}

// ── Password Validation ─────────────────────────────────────────────

export interface PasswordValidation {
	valid: boolean;
	errors: string[];
}

export function validatePassword(password: string): PasswordValidation {
	const errors: string[] = [];

	if (password.length < 10) errors.push('Must be at least 10 characters');
	if (!/[A-Z]/.test(password)) errors.push('Must contain an uppercase letter');
	if (!/[a-z]/.test(password)) errors.push('Must contain a lowercase letter');
	if (!/\d/.test(password)) errors.push('Must contain a number');

	return { valid: errors.length === 0, errors };
}

// ── OAuth ────────────────────────────────────────────────────────────

/**
 * Find a user by their GitHub user ID.
 */
export function findUserByGitHubId(githubId: string): UserRow | null {
	const db = getDatabase();
	return db.prepare(`
		SELECT user_id, email, display_name, password_hash, role,
		       email_confirmed, login_enabled, otp_hash, otp_is_initial, terms_accepted_at
		FROM users WHERE github_id = ?
	`).get(githubId) as UserRow | null;
}

/**
 * Find a user by their LinkedIn user ID.
 */
export function findUserByLinkedInId(linkedinId: string): UserRow | null {
	const db = getDatabase();
	return db.prepare(`
		SELECT user_id, email, display_name, password_hash, role,
		       email_confirmed, login_enabled, otp_hash, otp_is_initial, terms_accepted_at
		FROM users WHERE linkedin_id = ?
	`).get(linkedinId) as UserRow | null;
}

/**
 * Link an OAuth provider to an existing account (ADR 004: account linking).
 * Sets the provider-specific ID and updates auth_provider if user was local-only.
 */
export function linkOAuthProvider(
	userId: string,
	provider: 'github' | 'linkedin',
	providerUserId: string
): void {
	const db = getDatabase();
	const column = provider === 'github' ? 'github_id' : 'linkedin_id';
	db.prepare(`UPDATE users SET ${column} = ? WHERE user_id = ?`).run(providerUserId, userId);

	// If user was OAuth-only from the other provider, keep auth_provider as-is.
	// If user was local, they now have an OAuth link too — auth_provider stays 'local'.
	// OAuth users implicitly have confirmed email (identity provider is trusted).
	db.prepare(`UPDATE users SET email_confirmed = 1 WHERE user_id = ?`).run(userId);
}

export interface OAuthRegisterInput {
	email: string;
	displayName: string;
	provider: 'github' | 'linkedin';
	providerUserId: string;
	acceptTerms: boolean;
	getInfoletter: boolean;
}

/**
 * Register a new user via OAuth (ADR 004).
 * email_confirmed = TRUE (identity provider is trusted).
 * No password hash. login_enabled = TRUE.
 */
export function registerOAuthUser(input: OAuthRegisterInput): string {
	const db = getDatabase();
	const userId = generateId();
	const now = nowIso();
	const column = input.provider === 'github' ? 'github_id' : 'linkedin_id';

	db.prepare(`
		INSERT INTO users (
			user_id, email, display_name, password_hash, auth_provider, role,
			${column},
			email_confirmed, login_enabled, get_infoletter, terms_accepted_at,
			show_on_contributor_wall, show_first_time_hints, audio_cues_enabled,
			created_at
		) VALUES (?, ?, ?, NULL, ?, 'observer',
			?,
			1, 1, ?, ?,
			1, 1, 0,
			?)
	`).run(
		userId,
		input.email,
		input.displayName,
		input.provider,
		input.providerUserId,
		input.getInfoletter ? 1 : 0,
		input.acceptTerms ? now : null,
		now
	);

	return userId;
}

// ── Helpers ──────────────────────────────────────────────────────────

function generateOtp(): string {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let otp = '';
	const bytes = crypto.randomBytes(OTP_LENGTH);
	for (let i = 0; i < OTP_LENGTH; i++) {
		otp += chars[bytes[i] % chars.length];
	}
	return otp;
}
