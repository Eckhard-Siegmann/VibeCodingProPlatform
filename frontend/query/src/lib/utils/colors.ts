/**
 * Color utilities for accessing CSS custom properties.
 * Avoids hardcoding colors in components.
 */

/**
 * Get CSS custom property value from document root.
 */
function getCSSVar(name: string): string {
	if (typeof document === 'undefined') {
		// SSR fallback
		return '#000000';
	}
	return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/**
 * Get problem color palette (8 colors for charts).
 * These colors are assigned to problems in pitch order.
 */
export function getProblemColors(): string[] {
	return [
		getCSSVar('--color-problem-1'), // Red
		getCSSVar('--color-problem-2'), // Blue
		getCSSVar('--color-problem-3'), // Green
		getCSSVar('--color-problem-4'), // Yellow
		getCSSVar('--color-problem-5'), // Orange
		getCSSVar('--color-problem-6'), // Cyan
		getCSSVar('--color-problem-7'), // Magenta
		getCSSVar('--color-problem-8') // Lime
	];
}

/**
 * Get avatar color palette (8 colors for user avatars).
 * Used for deterministic color assignment based on user_id hash.
 */
export function getAvatarColors(): string[] {
	return [
		getCSSVar('--color-avatar-1'), // Red
		getCSSVar('--color-avatar-2'), // Blue
		getCSSVar('--color-avatar-3'), // Green
		getCSSVar('--color-avatar-4'), // Amber
		getCSSVar('--color-avatar-5'), // Purple
		getCSSVar('--color-avatar-6'), // Pink
		getCSSVar('--color-avatar-7'), // Cyan
		getCSSVar('--color-avatar-8') // Lime
	];
}

/**
 * Get all design tokens for charts and components.
 * Returns hex values from CSS custom properties.
 */
export function getColorTokens() {
	return {
		headers: getCSSVar('--color-headers'),
		labels: getCSSVar('--color-labels'),
		meta: getCSSVar('--color-meta'),
		primary: getCSSVar('--color-primary'),
		secondary: getCSSVar('--color-secondary'),
		success: getCSSVar('--color-success'),
		alert: getCSSVar('--color-alert'),
		pending: getCSSVar('--color-pending'),
		warning: getCSSVar('--color-warning'),
		card: getCSSVar('--color-card'),
		canvas: getCSSVar('--color-canvas'),
		viewport: getCSSVar('--color-viewport')
	};
}

/**
 * Get color with fallback for SSR.
 *
 * @param token - CSS custom property name (with or without -- prefix)
 * @param fallback - Fallback color if SSR or token not found
 */
export function getColor(token: string, fallback: string = '#000000'): string {
	if (typeof document === 'undefined') {
		return fallback;
	}
	const varName = token.startsWith('--') ? token : `--${token}`;
	return getCSSVar(varName) || fallback;
}
