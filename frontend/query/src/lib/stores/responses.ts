import { writable, derived } from 'svelte/store';
import type { Role, TimeContext } from '$lib/utils/validators';

interface ResponsesState {
	assessmentId: string;
	role: Role | null;
	timeContext: TimeContext;
	responses: Map<string, number>;
	touched: Set<string>;
	submitting: boolean;
	submitted: boolean;
	error: string | null;
}

function createResponsesStore() {
	const { subscribe, set, update } = writable<ResponsesState>({
		assessmentId: '',
		role: null,
		timeContext: 'pitch',
		responses: new Map(),
		touched: new Set(),
		submitting: false,
		submitted: false,
		error: null
	});

	return {
		subscribe,

		initialize(assessmentId: string, timeContext: TimeContext) {
			update((state) => ({
				...state,
				assessmentId,
				timeContext,
				responses: new Map(),
				touched: new Set(),
				submitting: false,
				submitted: false,
				error: null
			}));
		},

		setRole(role: Role) {
			update((state) => ({ ...state, role }));
		},

		setResponse(itemId: string, value: number) {
			update((state) => {
				const responses = new Map(state.responses);
				const touched = new Set(state.touched);

				responses.set(itemId, value);
				touched.add(itemId);

				return { ...state, responses, touched };
			});
		},

		setSubmitting(submitting: boolean) {
			update((state) => ({ ...state, submitting, error: null }));
		},

		setSubmitted() {
			update((state) => ({ ...state, submitted: true, submitting: false }));
		},

		setError(error: string) {
			update((state) => ({ ...state, error, submitting: false }));
		},

		reset() {
			set({
				assessmentId: '',
				role: null,
				timeContext: 'pitch',
				responses: new Map(),
				touched: new Set(),
				submitting: false,
				submitted: false,
				error: null
			});
		}
	};
}

export const responsesStore = createResponsesStore();

// Derived store for answered count
export const answeredCount = derived(responsesStore, ($state) => $state.responses.size);

// Derived store for whether form can be submitted
export const canSubmit = derived(responsesStore, ($state) => $state.role !== null && !$state.submitting);
