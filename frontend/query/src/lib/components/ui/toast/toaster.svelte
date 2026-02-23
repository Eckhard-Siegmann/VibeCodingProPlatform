<script lang="ts">
	// Toaster - Root provider component for toast notifications.
	// Add to root +layout.svelte to enable toast notifications across the app.
	// Usage: import { toastSuccess, toastError } from '$lib/stores/toast';

	import ToastQueue from './toast-queue.svelte';

	interface Props {
		class?: string;
	}

	let { class: className }: Props = $props();
</script>

<ToastQueue class={className} />
