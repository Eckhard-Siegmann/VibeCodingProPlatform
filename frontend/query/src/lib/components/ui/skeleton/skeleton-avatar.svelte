<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';

	type AvatarSize = 'sm' | 'md' | 'lg';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		size?: AvatarSize;
		class?: string;
	}

	let { size = 'md', class: className, ...restProps }: Props = $props();

	const sizeMap: Record<AvatarSize, string> = {
		sm: 'w-6 h-6',
		md: 'w-9 h-9',
		lg: 'w-12 h-12'
	};
</script>

<div
	class={cn(
		'rounded-full skeleton-shimmer',
		sizeMap[size],
		className
	)}
	role="presentation"
	aria-hidden="true"
	{...restProps}
></div>
