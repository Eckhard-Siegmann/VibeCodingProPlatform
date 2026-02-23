<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';
	import { getInitials, getAvatarColor } from '$lib/utils/avatar';

	type AvatarSize = 'sm' | 'md' | 'lg';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		userName: string;
		userId: string;
		size?: AvatarSize;
		online?: boolean;
		class?: string;
	}

	let {
		userName,
		userId,
		size = 'md',
		online,
		class: className,
		...restProps
	}: Props = $props();

	const initials = $derived(getInitials(userName));
	const bgColor = $derived(getAvatarColor(userId));

	const sizeMap: Record<AvatarSize, { container: string; text: string; indicator: string }> = {
		sm: {
			container: 'w-6 h-6',
			text: 'text-[10px]',
			indicator: 'w-1.5 h-1.5 right-0 bottom-0'
		},
		md: {
			container: 'w-9 h-9',
			text: 'text-xs',
			indicator: 'w-2 h-2 right-0 bottom-0'
		},
		lg: {
			container: 'w-12 h-12',
			text: 'text-sm',
			indicator: 'w-2.5 h-2.5 right-0.5 bottom-0.5'
		}
	};

	const sizeConfig = $derived(sizeMap[size]);
</script>

<div
	class={cn(
		'relative inline-flex items-center justify-center rounded-full font-medium text-white select-none',
		sizeConfig.container,
		sizeConfig.text,
		className
	)}
	style="background-color: {bgColor}"
	role="img"
	aria-label="{userName}'s avatar"
	{...restProps}
>
	{initials}

	{#if online !== undefined}
		<span
			class={cn(
				'absolute rounded-full border-2 border-card',
				sizeConfig.indicator,
				online ? 'bg-success' : 'bg-meta'
			)}
			aria-label={online ? 'Online' : 'Offline'}
		></span>
	{/if}
</div>
