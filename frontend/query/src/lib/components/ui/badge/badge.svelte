<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';

	export type BadgeVariant =
		| 'default'
		| 'secondary'
		| 'outline'
		| 'destructive'
		// Readiness states
		| 'draft'
		| 'submitted'
		| 'needs_changes'
		| 'ready'
		| 'rejected'
		// Action states
		| 'backlog'
		| 'selected_for_event'
		| 'selected_for_coding'
		| 'deferred'
		| 'dropped'
		| 'closed';

	type BadgeSize = 'default' | 'large';

	interface Props extends HTMLAttributes<HTMLSpanElement> {
		children: Snippet;
		variant?: BadgeVariant;
		size?: BadgeSize;
		class?: string;
	}

	let {
		children,
		variant = 'default',
		size = 'default',
		class: className,
		...restProps
	}: Props = $props();

	const variantMap: Record<BadgeVariant, string> = {
		// Generic
		default: 'bg-primary/10 text-primary',
		secondary: 'bg-secondary text-labels',
		outline: 'bg-transparent border border-secondary-dark text-labels',
		destructive: 'bg-alert/10 text-alert',

		// Readiness states
		draft: 'bg-canvas text-meta',
		submitted: 'bg-amber-100 text-amber-700',
		needs_changes: 'bg-warning-bg text-warning',
		ready: 'bg-green-100 text-success',
		rejected: 'bg-red-100 text-alert',

		// Action states
		backlog: 'bg-canvas text-labels',
		selected_for_event: 'bg-blue-100 text-primary',
		selected_for_coding: 'bg-purple-bg text-purple',
		deferred: 'bg-warning-bg text-warning',
		dropped: 'bg-red-100 text-alert',
		closed: 'bg-green-100 text-success'
	};

	const sizeMap: Record<BadgeSize, string> = {
		default: 'text-xs px-2.5 py-0.5',
		large: 'text-base px-4 py-1 font-semibold'
	};
</script>

<span
	class={cn(
		'inline-flex items-center rounded-full font-medium transition-colors',
		sizeMap[size],
		variantMap[variant],
		className
	)}
	{...restProps}
>
	{@render children()}
</span>
