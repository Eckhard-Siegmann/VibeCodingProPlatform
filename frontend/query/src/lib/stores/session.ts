import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { getOrCreateSessionId, hashSessionId } from '$lib/utils/session-id';

interface SessionState {
	sessionId: string;
	sessionHash: string;
	inPresence: boolean;
	initialized: boolean;
}

function createSessionStore() {
	const { subscribe, set, update } = writable<SessionState>({
		sessionId: '',
		sessionHash: '',
		inPresence: true, // Default to in-presence for event context
		initialized: false
	});

	return {
		subscribe,

		async initialize() {
			if (!browser) return;

			try {
				const sessionId = getOrCreateSessionId();
				const sessionHash = await hashSessionId(sessionId);

				update((state) => ({
					...state,
					sessionId,
					sessionHash,
					initialized: true
				}));
			} catch (err) {
				console.error('Session initialization failed:', err);
				// Set initialized anyway with fallback values for dev
				update((state) => ({
					...state,
					sessionId: 'fallback-' + Date.now(),
					sessionHash: 'fallback-hash-' + Date.now(),
					initialized: true
				}));
			}
		},

		setInPresence(inPresence: boolean) {
			update((state) => ({ ...state, inPresence }));
		},

		reset() {
			set({
				sessionId: '',
				sessionHash: '',
				inPresence: true,
				initialized: false
			});
		}
	};
}

export const sessionStore = createSessionStore();
