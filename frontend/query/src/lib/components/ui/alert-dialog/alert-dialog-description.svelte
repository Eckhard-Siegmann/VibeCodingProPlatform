<script lang="ts">
	import type { Snippet } from 'svelte';
	import { AlertDialog } from 'bits-ui';
	import { cn } from '$lib/utils';

	interface Props {
		children: Snippet;
		class?: string;
	}

	let { children, class: className }: Props = $props();
</script>

<AlertDialog.Description class={cn('text-sm text-labels', className)}>
	{@render children()}
</AlertDialog.Description>
