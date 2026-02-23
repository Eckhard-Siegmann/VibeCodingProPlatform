<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';
	import SkeletonText from './skeleton-text.svelte';

	type Elevation = 'flat' | 'resting' | 'raised' | 'floating';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		elevation?: Elevation;
		lines?: number;
		showHeader?: boolean;
		class?: string;
	}

	let {
		elevation = 'resting',
		lines = 3,
		showHeader = true,
		class: className,
		...restProps
	}: Props = $props();

	const elevationMap: Record<Elevation, string> = {
		flat: '',
		resting: 'shadow-[var(--shadow-card)]',
		raised: 'shadow-[var(--shadow-md)]',
		floating: 'shadow-[var(--shadow-floating)]'
	};
</script>

<div
	class={cn(
		'bg-card rounded-[var(--radius-card)] p-4 md:p-5',
		elevationMap[elevation],
		className
	)}
	role="presentation"
	aria-hidden="true"
	{...restProps}
>
	{#if showHeader}
		<div class="flex items-center gap-3 mb-4">
			<div class="w-10 h-10 rounded-full skeleton-shimmer"></div>
			<div class="flex-1 space-y-2">
				<SkeletonText width="1/2" height="md" />
				<SkeletonText width="1/4" height="sm" />
			</div>
		</div>
	{/if}

	<div class="space-y-2">
		{#each Array(lines) as _, i}
			<SkeletonText
				width={i === lines - 1 ? '3/4' : 'full'}
				height="sm"
			/>
		{/each}
	</div>
</div>
