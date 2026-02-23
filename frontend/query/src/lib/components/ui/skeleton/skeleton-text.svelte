<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		width?: 'full' | '3/4' | '1/2' | '1/4' | string;
		height?: 'sm' | 'md' | 'lg';
		class?: string;
	}

	let { width = 'full', height = 'md', class: className, ...restProps }: Props = $props();

	const widthMap: Record<string, string> = {
		full: 'w-full',
		'3/4': 'w-3/4',
		'1/2': 'w-1/2',
		'1/4': 'w-1/4'
	};

	const heightMap: Record<string, string> = {
		sm: 'h-3',
		md: 'h-4',
		lg: 'h-6'
	};

	// If width is not in map, treat it as custom class
	const widthClass = $derived(widthMap[width] ?? width);
	const heightClass = $derived(heightMap[height]);
</script>

<div
	class={cn(
		'rounded skeleton-shimmer',
		widthClass,
		heightClass,
		className
	)}
	role="presentation"
	aria-hidden="true"
	{...restProps}
></div>
