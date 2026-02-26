import { writable } from 'svelte/store';
import { browser } from '$app/environment';

interface AudioState {
	enabled: boolean;
	loaded: boolean;
}

function createAudioStore() {
	const { subscribe, set, update } = writable<AudioState>({
		enabled: false,
		loaded: false
	});

	/**
	 * Create a beep sound using Web Audio API.
	 * No audio files needed - generates tones programmatically.
	 */
	function createBeep(frequency: number, duration: number, volume: number = 0.3) {
		if (!browser) return;

		try {
			const ctx = new AudioContext();
			const oscillator = ctx.createOscillator();
			const gainNode = ctx.createGain();

			oscillator.type = 'sine';
			oscillator.frequency.value = frequency;
			oscillator.connect(gainNode);
			gainNode.connect(ctx.destination);

			gainNode.gain.value = volume;
			oscillator.start();

			setTimeout(() => {
				oscillator.stop();
				ctx.close();
			}, duration);
		} catch (err) {
			console.warn('Web Audio API not available:', err);
		}
	}

	return {
		subscribe,

		/**
		 * Load audio preference from localStorage or user settings.
		 * Call this on app initialization.
		 */
		async loadPreference() {
			if (!browser) return;

			try {
				// Load from localStorage as fallback; server hydration via
				// +layout.svelte provides the DB-backed preference (TICKET-27).
				const stored = localStorage.getItem('audio_cues_enabled');
				const enabled = stored === 'true';

				update((state) => ({
					...state,
					enabled,
					loaded: true
				}));
			} catch (err) {
				console.error('Failed to load audio preference:', err);
				update((state) => ({
					...state,
					enabled: false,
					loaded: true
				}));
			}
		},

		/**
		 * Set audio enabled/disabled and persist preference.
		 */
		setEnabled(enabled: boolean) {
			if (!browser) return;

			localStorage.setItem('audio_cues_enabled', String(enabled));
			update((state) => ({
				...state,
				enabled
			}));
		},

		/**
		 * Play timer warning sound (1 minute remaining).
		 * Uses Web Audio API - 800Hz beep, 200ms duration.
		 */
		playTimerWarning() {
			if (!this.isEnabled()) return;
			createBeep(800, 200, 0.3);
		},

		/**
		 * Play timer expired sound (time's up).
		 * Uses Web Audio API - 600Hz beep, 300ms duration.
		 */
		playTimerExpired() {
			if (!this.isEnabled()) return;
			createBeep(600, 300, 0.3);
		},

		/**
		 * Play phase change sound (pitch started, review opened, etc.).
		 * Uses Web Audio API - 700Hz beep, 150ms duration.
		 */
		playPhaseChange() {
			if (!this.isEnabled()) return;
			createBeep(700, 150, 0.25);
		},

		/**
		 * Check if audio is currently enabled.
		 */
		isEnabled(): boolean {
			let currentState: AudioState | undefined;
			const unsubscribe = subscribe((state) => {
				currentState = state;
			});
			unsubscribe();
			return currentState?.enabled ?? false;
		}
	};
}

export const audioStore = createAudioStore();
