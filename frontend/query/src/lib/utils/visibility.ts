/**
 * Page Visibility Utility (ADR 008)
 *
 * Pauses all polling when the tab is hidden to eliminate unnecessary server load.
 * Fires a catch-up callback on tab restore for instant state synchronization.
 *
 * Per ADR 008 §Background/Idle Context:
 * - document.hidden === true → all data polling COMPLETELY PAUSED
 * - On visibilitychange back to visible → immediate catch-up poll
 */

import { browser } from '$app/environment';

/**
 * Create a visibility-aware polling interval.
 * Returns a cleanup function to stop the interval and remove the listener.
 *
 * @param callback - The polling function to call at each interval
 * @param intervalMs - Polling interval in milliseconds
 * @param onResume - Optional callback fired once when tab becomes visible again (catch-up poll)
 */
export function createVisibilityAwareInterval(
	callback: () => void,
	intervalMs: number,
	onResume?: () => void
): () => void {
	if (!browser) return () => {};

	let intervalId: ReturnType<typeof setInterval> | null = null;

	function startPolling() {
		if (intervalId !== null) return;
		intervalId = setInterval(callback, intervalMs);
	}

	function stopPolling() {
		if (intervalId !== null) {
			clearInterval(intervalId);
			intervalId = null;
		}
	}

	function handleVisibilityChange() {
		if (document.hidden) {
			stopPolling();
		} else {
			// Catch-up poll on tab restore
			if (onResume) {
				onResume();
			} else {
				callback();
			}
			startPolling();
		}
	}

	// Start polling immediately if tab is visible
	if (!document.hidden) {
		startPolling();
	}

	document.addEventListener('visibilitychange', handleVisibilityChange);

	// Return cleanup function
	return () => {
		stopPolling();
		document.removeEventListener('visibilitychange', handleVisibilityChange);
	};
}
