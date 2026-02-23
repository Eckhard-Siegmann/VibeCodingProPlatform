// Application configuration constants

/**
 * Best Practices Guide URL
 * Points to problem creation guide in the repository
 */
export const BEST_PRACTICES_URL = '/docs/problem-creation-best-practices';

/**
 * API Configuration
 */
export const API_BASE = '/api';

export const API_TIMEOUTS = {
	default: 30000, // 30s for most requests
	upload: 120000, // 2min for file uploads
	polling: 3000 // 3s for live event polling
} as const;

/**
 * Feature Flags (MVP)
 */
export const FEATURES = {
	authentication: false, // MVP uses demo mode
	chatPolling: true, // Real-time chat updates
	eventContext: false, // TODO: Full event context integration
	richTextEditor: false, // Future: Markdown editor for descriptions
	search: false // Future: Full-text search
} as const;

/**
 * UI Constants
 */
export const UI_LIMITS = {
	chatMessageMaxLength: 2000, // Per Ch.31
	toastMaxVisible: 3, // Per Ch.26.11.12
	pollInterval: {
		activeEvent: 3000, // 3s during live events
		idleEvent: 10000 // 10s when no active event
	}
} as const;
