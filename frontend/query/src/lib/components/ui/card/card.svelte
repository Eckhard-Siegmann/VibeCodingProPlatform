<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		children: Snippet;
		class?: string;
		padding?: 'none' | 'sm' | 'md' | 'lg';
		elevation?: 'flat' | 'resting' | 'raised' | 'floating';
	}

	let {
		children,
		class: className,
		padding = 'md',
		elevation = 'resting',
		...restProps
	}: Props = $props();

	const paddingMap: Record<string, string> = {
		none: '',
		sm: 'p-3',
		md: 'p-4 md:p-5',
		lg: 'p-5 md:p-6'
	};

	const elevationMap: Record<string, string> = {
		flat: '',
		resting: 'shadow-[var(--shadow-card)]',
		raised: 'shadow-[var(--shadow-md)]',
		floating: 'shadow-[var(--shadow-floating)]'
	};
</script>

<div
	class={cn(
		'bg-card rounded-[var(--radius-card)]',
		elevationMap[elevation],
		paddingMap[padding],
		className
	)}
	{...restProps}
>
	{@render children()}
</div>
