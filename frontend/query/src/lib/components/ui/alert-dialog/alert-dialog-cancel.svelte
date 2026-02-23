<script lang="ts">
	import type { Snippet } from 'svelte';
	import { AlertDialog } from 'bits-ui';
	import { cn } from '$lib/utils';

	interface Props {
		children: Snippet;
		class?: string;
		onclick?: () => void;
	}

	let { children, class: className, onclick }: Props = $props();
</script>

<AlertDialog.Cancel
	class={cn(
		'inline-flex items-center justify-center font-medium rounded-[var(--radius-card)] px-4 py-2 min-h-[44px] text-base transition-colors bg-secondary text-headers hover:bg-secondary-dark border border-secondary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
		className
	)}
	{onclick}
>
	{@render children()}
</AlertDialog.Cancel>
