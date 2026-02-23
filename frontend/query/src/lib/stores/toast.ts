import { writable, derived } from 'svelte/store';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
	id: string;
	variant: ToastVariant;
	title: string;
	message?: string;
	duration: number; // milliseconds
	createdAt: number; // timestamp
}

interface ToastState {
	toasts: Toast[];
}

function createToastStore() {
	const { subscribe, update } = writable<ToastState>({
		toasts: []
	});

	let idCounter = 0;

	return {
		subscribe,

		/**
		 * Add a new toast notification.
		 * Returns toast ID for manual dismissal if needed.
		 */
		addToast(config: {
			variant: ToastVariant;
			title: string;
			message?: string;
			duration?: number;
		}): string {
			const id = `toast-${Date.now()}-${idCounter++}`;

			// Default durations per spec
			const defaultDuration = {
				success: 3000,
				error: 5000,
				info: 4000,
				warning: 4000
			}[config.variant];

			const toast: Toast = {
				id,
				variant: config.variant,
				title: config.title,
				message: config.message,
				duration: config.duration ?? defaultDuration,
				createdAt: Date.now()
			};

			update((state) => ({
				toasts: [...state.toasts, toast]
			}));

			// Auto-dismiss after duration
			setTimeout(() => {
				this.removeToast(id);
			}, toast.duration);

			return id;
		},

		/**
		 * Remove a specific toast by ID.
		 */
		removeToast(id: string) {
			update((state) => ({
				toasts: state.toasts.filter((t) => t.id !== id)
			}));
		},

		/**
		 * Clear all toasts immediately.
		 */
		clearAll() {
			update(() => ({
				toasts: []
			}));
		}
	};
}

export const toastStore = createToastStore();

/**
 * Derived store: Visible toasts (max 3 per spec)
 */
export const visibleToasts = derived(toastStore, ($state) => $state.toasts.slice(-3));

/**
 * Helper function: Add success toast
 */
export function toastSuccess(title: string, message?: string) {
	return toastStore.addToast({ variant: 'success', title, message });
}

/**
 * Helper function: Add error toast
 */
export function toastError(title: string, message?: string) {
	return toastStore.addToast({ variant: 'error', title, message });
}

/**
 * Helper function: Add info toast
 */
export function toastInfo(title: string, message?: string) {
	return toastStore.addToast({ variant: 'info', title, message });
}

/**
 * Helper function: Add warning toast
 */
export function toastWarning(title: string, message?: string) {
	return toastStore.addToast({ variant: 'warning', title, message });
}
