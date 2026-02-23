<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';
	import SkeletonCard from './skeleton-card.svelte';

	type Elevation = 'flat' | 'resting' | 'raised' | 'floating';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		count?: number;
		elevation?: Elevation;
		showHeader?: boolean;
		lines?: number;
		gap?: 'sm' | 'md' | 'lg';
		class?: string;
	}

	let {
		count = 3,
		elevation = 'resting',
		showHeader = true,
		lines = 2,
		gap = 'md',
		class: className,
		...restProps
	}: Props = $props();

	const gapMap: Record<string, string> = {
		sm: 'space-y-2',
		md: 'space-y-4',
		lg: 'space-y-6'
	};
</script>

<div
	class={cn(gapMap[gap], className)}
	role="presentation"
	aria-label="Loading content"
	{...restProps}
>
	{#each Array(count) as _, i}
		<SkeletonCard {elevation} {showHeader} {lines} />
	{/each}
</div>
