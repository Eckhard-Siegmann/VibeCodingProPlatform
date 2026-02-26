/**
 * Event Notification Utility (Ch.14.5.2, ADR 008)
 *
 * Maps live context state changes detected via polling to toast notifications
 * and audio cue actions. Compares previous and current state to determine
 * what transition occurred and returns the appropriate notification config.
 */

import type { ToastVariant } from '$lib/stores/toast';

export interface LiveContextSnapshot {
	currentMode: string; // 'idle' | 'pitch' | 'review'
	currentProblemTitle: string | null;
	timerEndsAt: string | null;
}

export interface NotificationAction {
	toast: {
		variant: ToastVariant;
		title: string;
		message?: string;
	};
	audio?: 'phaseChange' | 'timerWarning' | 'timerExpired';
}

/**
 * Compare previous and current live context to determine phase transition notifications.
 * Returns null if no notification-worthy change occurred.
 *
 * Per Ch.14.5.2 notification table:
 * - Pitch opened → info toast + phaseChange sound
 * - Pitch closed → info toast
 * - Review opened → info toast + phaseChange sound
 * - Review closed → info toast
 * - Mode changed to idle → info toast
 */
export function detectPhaseTransition(
	prev: LiveContextSnapshot,
	next: LiveContextSnapshot
): NotificationAction | null {
	if (prev.currentMode === next.currentMode) return null;

	const problemTitle = next.currentProblemTitle || prev.currentProblemTitle || 'Unknown';

	// Pitch opened
	if (next.currentMode === 'pitch' && prev.currentMode !== 'pitch') {
		return {
			toast: {
				variant: 'info',
				title: `Pitch started: ${problemTitle}`,
				message: 'Vote now!'
			},
			audio: 'phaseChange'
		};
	}

	// Review opened
	if (next.currentMode === 'review' && prev.currentMode !== 'review') {
		return {
			toast: {
				variant: 'info',
				title: `Review opened: ${problemTitle}`,
				message: 'Share your evaluation'
			},
			audio: 'phaseChange'
		};
	}

	// Pitch closed (pitch → idle)
	if (prev.currentMode === 'pitch' && next.currentMode === 'idle') {
		return {
			toast: {
				variant: 'success',
				title: 'Pitch closed',
				message: `Voting on "${problemTitle}" has ended`
			}
		};
	}

	// Review closed (review → idle)
	if (prev.currentMode === 'review' && next.currentMode === 'idle') {
		return {
			toast: {
				variant: 'success',
				title: 'Review closed',
				message: `Review of "${problemTitle}" has ended`
			}
		};
	}

	// Generic mode change fallback
	return {
		toast: {
			variant: 'info',
			title: `Phase changed to ${next.currentMode}`
		}
	};
}

/**
 * Timer threshold state tracker.
 * Tracks whether the 60s warning and 0s expiry audio cues have been fired
 * for the current timer session. Resets when timer changes.
 */
export class TimerAudioTracker {
	private warningFired = false;
	private expiredFired = false;
	private lastTimerEndsAt: string | null = null;

	/**
	 * Check countdown seconds and return audio action if a threshold was crossed.
	 * Returns null if no audio should play.
	 */
	check(timerEndsAt: string | null, countdownSeconds: number): 'timerWarning' | 'timerExpired' | null {
		// Reset tracking if timer changed (new phase opened)
		if (timerEndsAt !== this.lastTimerEndsAt) {
			this.warningFired = false;
			this.expiredFired = false;
			this.lastTimerEndsAt = timerEndsAt;
		}

		if (!timerEndsAt) return null;

		// Timer expired (0 seconds)
		if (countdownSeconds <= 0 && !this.expiredFired) {
			this.expiredFired = true;
			return 'timerExpired';
		}

		// Timer warning (60 seconds remaining)
		if (countdownSeconds <= 60 && countdownSeconds > 0 && !this.warningFired) {
			this.warningFired = true;
			return 'timerWarning';
		}

		return null;
	}

	/** Reset tracker state (e.g., when navigating away). */
	reset() {
		this.warningFired = false;
		this.expiredFired = false;
		this.lastTimerEndsAt = null;
	}
}
