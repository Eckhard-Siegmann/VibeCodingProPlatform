<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';
	import { Button } from '$lib/components/ui/button';
	import type { EmptyStateConfig } from '$lib/config/empty-states';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		// Config-based API
		config?: EmptyStateConfig;
		// Inline API (alternative to config)
		icon?: string | Snippet;
		title?: string;
		message?: string;
		action?: {
			label: string;
			href?: string;
			onclick?: () => void;
		};
		// Styling
		size?: 'sm' | 'md' | 'lg';
		class?: string;
	}

	let {
		config,
		icon: inlineIcon,
		title: inlineTitle,
		message: inlineMessage,
		action: inlineAction,
		size = 'md',
		class: className,
		...restProps
	}: Props = $props();

	// Resolve props from config or inline
	const icon = $derived(config?.icon ?? inlineIcon);
	const title = $derived(config?.title ?? inlineTitle ?? 'Nothing here yet');
	const message = $derived(config?.message ?? inlineMessage);
	const action = $derived(config?.action ?? inlineAction);

	const sizeConfig: Record<string, { padding: string; iconSize: string; titleSize: string }> = {
		sm: {
			padding: 'py-6',
			iconSize: 'text-3xl',
			titleSize: 'text-base'
		},
		md: {
			padding: 'py-12',
			iconSize: 'text-5xl',
			titleSize: 'text-xl'
		},
		lg: {
			padding: 'py-16',
			iconSize: 'text-6xl',
			titleSize: 'text-2xl'
		}
	};

	const sizeClass = $derived(sizeConfig[size]);
</script>

<div
	class={cn(
		'flex flex-col items-center justify-center text-center',
		'bg-canvas/50 rounded-[var(--radius-card)]',
		sizeClass.padding,
		'px-6',
		className
	)}
	role="status"
	aria-label={title}
	{...restProps}
>
	<!-- Icon -->
	{#if icon}
		<div class={cn('mb-4', sizeClass.iconSize)} aria-hidden="true">
			{#if typeof icon === 'string'}
				{icon}
			{:else}
				{@render icon()}
			{/if}
		</div>
	{/if}

	<!-- Title -->
	<h3 class={cn('font-semibold text-headers mb-2', sizeClass.titleSize)}>
		{title}
	</h3>

	<!-- Message -->
	{#if message}
		<p class="text-labels text-sm max-w-sm mb-4">
			{message}
		</p>
	{/if}

	<!-- Action button -->
	{#if action}
		{#if action.href}
			<a
				href={action.href}
				class={cn(
					'inline-flex items-center justify-center font-medium rounded-[var(--radius-card)]',
					'bg-primary text-white hover:bg-primary-hover transition-colors',
					'px-4 py-2 min-h-[44px] text-base'
				)}
			>
				{action.label}
			</a>
		{:else if action.onclick}
			<Button variant="default" onclick={action.onclick}>
				{action.label}
			</Button>
		{/if}
	{/if}
</div>
