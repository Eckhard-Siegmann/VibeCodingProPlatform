/**
 * Date and time formatting utilities.
 * Centralized formatting for consistent display across the platform.
 */

/**
 * Format date as "Feb 3, 2026"
 */
export function formatDate(date: Date | string): string {
	const d = typeof date === 'string' ? new Date(date) : date;
	return d.toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	});
}

/**
 * Format time as "14:32" (24-hour format)
 */
export function formatTime(date: Date | string): string {
	const d = typeof date === 'string' ? new Date(date) : date;
	return d.toLocaleTimeString('en-US', {
		hour: '2-digit',
		minute: '2-digit',
		hour12: false
	});
}

/**
 * Format date and time as "Feb 3, 2026 14:32"
 */
export function formatDateTime(date: Date | string): string {
	return `${formatDate(date)} ${formatTime(date)}`;
}

/**
 * Format relative time like "2m ago", "3h ago", "yesterday"
 * Falls back to absolute date for older timestamps.
 */
export function formatRelative(date: Date | string): string {
	const d = typeof date === 'string' ? new Date(date) : date;
	const now = new Date();
	const diffMs = now.getTime() - d.getTime();
	const diffSec = Math.floor(diffMs / 1000);
	const diffMin = Math.floor(diffSec / 60);
	const diffHour = Math.floor(diffMin / 60);
	const diffDay = Math.floor(diffHour / 24);

	if (diffSec < 60) {
		return 'just now';
	} else if (diffMin < 60) {
		return `${diffMin}m ago`;
	} else if (diffHour < 24) {
		return `${diffHour}h ago`;
	} else if (diffDay === 1) {
		return `Yesterday ${formatTime(d)}`;
	} else if (diffDay < 7) {
		return `${diffDay}d ago`;
	} else {
		// Older than 7 days: show full date
		return formatDate(d);
	}
}

/**
 * Format with custom format string (simple implementation).
 * For more complex formatting, consider using date-fns or similar.
 *
 * Supported tokens:
 * - YYYY: Full year
 * - MM: Month (01-12)
 * - DD: Day (01-31)
 * - HH: Hour (00-23)
 * - mm: Minute (00-59)
 */
export function formatCustom(date: Date | string, format: string): string {
	const d = typeof date === 'string' ? new Date(date) : date;

	const tokens: Record<string, string> = {
		YYYY: d.getFullYear().toString(),
		MM: String(d.getMonth() + 1).padStart(2, '0'),
		DD: String(d.getDate()).padStart(2, '0'),
		HH: String(d.getHours()).padStart(2, '0'),
		mm: String(d.getMinutes()).padStart(2, '0')
	};

	let result = format;
	for (const [token, value] of Object.entries(tokens)) {
		result = result.replace(new RegExp(token, 'g'), value);
	}

	return result;
}

/**
 * European format for system messages in chat: "DD.MM.YYYY HH:MM"
 * Used in WhatsApp-style system messages per Ch.31.7
 */
export function formatSystemMessage(date: Date | string): string {
	return formatCustom(date, 'DD.MM.YYYY HH:mm');
}
