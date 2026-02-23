<script lang="ts">
	import type { Snippet } from 'svelte';
	import { AlertDialog } from 'bits-ui';
	import { cn } from '$lib/utils';
	import AlertDialogOverlay from './alert-dialog-overlay.svelte';

	interface Props {
		children: Snippet;
		class?: string;
	}

	let { children, class: className }: Props = $props();
</script>

<AlertDialog.Portal>
	<AlertDialogOverlay />
	<AlertDialog.Content
		class={cn(
			'fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 bg-card rounded-[var(--radius-card-lg)] shadow-[var(--shadow-floating)] p-6 mx-4',
			'data-[state=open]:animate-in data-[state=closed]:animate-out',
			'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
			'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
			className
		)}
	>
		{@render children()}
	</AlertDialog.Content>
</AlertDialog.Portal>
