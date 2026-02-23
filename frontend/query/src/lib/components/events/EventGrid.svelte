<script lang="ts">
	import EventCard, { type EventCardData } from './EventCard.svelte';
	import EmptyState from '$lib/components/ui/empty-state/empty-state.svelte';
	import { cn } from '$lib/utils';

	interface Props {
		events: EventCardData[];
		title?: string;
		emptyTitle?: string;
		emptyMessage?: string;
		emptyAction?: { label: string; href: string };
		variant?: 'default' | 'compact';
		columns?: 1 | 2 | 3;
		class?: string;
	}

	let {
		events,
		title,
		emptyTitle = 'No events',
		emptyMessage = 'Check back soon for upcoming events.',
		emptyAction,
		variant = 'default',
		columns = 2,
		class: className
	}: Props = $props();

	const gridColsMap: Record<number, string> = {
		1: 'md:grid-cols-1',
		2: 'md:grid-cols-2',
		3: 'md:grid-cols-2 lg:grid-cols-3'
	};
</script>

<section class={cn('space-y-4', className)}>
	{#if title}
		<h2 class="text-xl font-semibold text-headers">{title}</h2>
	{/if}

	{#if events.length === 0}
		<EmptyState
			icon="📅"
			title={emptyTitle}
			message={emptyMessage}
			action={emptyAction}
		/>
	{:else}
		<div class={cn('grid gap-4', gridColsMap[columns])}>
			{#each events as event (event.id)}
				<EventCard {event} {variant} href={`/event/${event.slug}`} />
			{/each}
		</div>
	{/if}
</section>
