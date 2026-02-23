/**
 * Avatar utility functions for initial-based avatars.
 * Provides deterministic color assignment and initial extraction.
 */

import { simpleHash } from './hash';

const AVATAR_COLORS = [
	'var(--color-avatar-1)', // Red
	'var(--color-avatar-2)', // Blue
	'var(--color-avatar-3)', // Green
	'var(--color-avatar-4)', // Amber
	'var(--color-avatar-5)', // Purple
	'var(--color-avatar-6)', // Pink
	'var(--color-avatar-7)', // Cyan
	'var(--color-avatar-8)' // Lime
] as const;

/**
 * Extract initials from a user's display name.
 * Takes first letter of first name and first letter of last name.
 * Falls back to first two characters if no space.
 *
 * @example
 * getInitials("Max Mustermann") // "MM"
 * getInitials("Eva") // "EV"
 * getInitials("") // "?"
 */
export function getInitials(name: string): string {
	if (!name || name.trim() === '') {
		return '?';
	}

	const trimmed = name.trim();
	const parts = trimmed.split(/\s+/);

	if (parts.length >= 2) {
		// First name + Last name: "Max Mustermann" → "MM"
		return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
	} else {
		// Single word: Take first two characters
		return trimmed.substring(0, 2).toUpperCase();
	}
}

/**
 * Get deterministic avatar color from user ID.
 * Hashes the userId and maps to one of 8 avatar colors.
 * Same userId always returns same color.
 *
 * @param userId - User UUID or ID string
 * @returns CSS variable for avatar color
 *
 * @example
 * getAvatarColor("abc-123") // "var(--color-avatar-3)"
 */
export function getAvatarColor(userId: string): string {
	if (!userId) {
		return AVATAR_COLORS[0];
	}

	// Map to color index (0-7) using deterministic hash
	const index = Math.abs(simpleHash(userId)) % AVATAR_COLORS.length;
	return AVATAR_COLORS[index];
}

/**
 * Get raw avatar color value (for background-color style).
 * Useful when you need the actual hex value instead of CSS variable.
 */
export function getAvatarColorValue(userId: string): string {
	const colorVar = getAvatarColor(userId);
	const index = AVATAR_COLORS.indexOf(colorVar as (typeof AVATAR_COLORS)[number]);

	const colorValues = [
		'#EF4444', // Red
		'#3B82F6', // Blue
		'#10B981', // Green
		'#F59E0B', // Amber
		'#8B5CF6', // Purple
		'#EC4899', // Pink
		'#06B6D4', // Cyan
		'#84CC16' // Lime
	];

	return colorValues[index] || colorValues[0];
}
