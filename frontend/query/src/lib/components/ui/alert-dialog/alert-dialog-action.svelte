<script lang="ts">
	import type { Snippet } from 'svelte';
	import { AlertDialog } from 'bits-ui';
	import { cn } from '$lib/utils';

	interface Props {
		children: Snippet;
		class?: string;
		variant?: 'default' | 'destructive';
		onclick?: () => void;
	}

	let { children, class: className, variant = 'default', onclick }: Props = $props();

	const variantMap = {
		default:
			'bg-primary text-white hover:bg-primary-hover',
		destructive:
			'bg-alert text-white hover:bg-alert/90'
	};
</script>

<AlertDialog.Action
	class={cn(
		'inline-flex items-center justify-center font-medium rounded-[var(--radius-card)] px-4 py-2 min-h-[44px] text-base transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
		variantMap[variant],
		className
	)}
	{onclick}
>
	{@render children()}
</AlertDialog.Action>
