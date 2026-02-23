<script lang="ts">
	import { Card } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import CapacityIndicator from '$lib/components/registration/CapacityIndicator.svelte';
	import { cn } from '$lib/utils';
	import { formatDate, formatTime } from '$lib/utils/date-formatting';
	import { Calendar, MapPin, Building2 } from '@lucide/svelte';

	export interface EventCardData {
		id: string;
		slug: string;
		title: string;
		description?: string;
		startsAt: Date | string;
		plannedEndsAt?: Date | string;
		imageUrl?: string;
		location: {
			name: string;
			city: string;
		};
		partner: {
			name: string;
			logoUrl?: string;
		};
		capacity: number;
		registeredCount: number;
		waitlistCount?: number;
		// For past events
		isPast?: boolean;
		problemsCount?: number;
		participantsCount?: number;
	}

	interface Props {
		event: EventCardData;
		href?: string;
		variant?: 'default' | 'compact';
		class?: string;
	}

	let { event, href, variant = 'default', class: className }: Props = $props();

	const startDate = $derived(
		typeof event.startsAt === 'string' ? new Date(event.startsAt) : event.startsAt
	);

	const formattedDate = $derived(formatDate(startDate));
	const formattedTime = $derived(formatTime(startDate));
</script>

{#if href}
	<a {href} class="block group">
		<Card
			elevation="resting"
			padding="none"
			class={cn(
				'overflow-hidden transition-all group-hover:shadow-[var(--shadow-md)]',
				className
			)}
		>
			{@render cardContent()}
		</Card>
	</a>
{:else}
	<Card elevation="resting" padding="none" class={cn('overflow-hidden', className)}>
		{@render cardContent()}
	</Card>
{/if}

{#snippet cardContent()}
	<!-- Event Image -->
	{#if variant === 'default'}
		<div class="relative aspect-[16/9] bg-gradient-to-br from-primary/10 to-primary/5">
			{#if event.imageUrl}
				<img
					src={event.imageUrl}
					alt={event.title}
					class="w-full h-full object-cover"
				/>
			{:else}
				<!-- Auto-generated placeholder with partner logo -->
				<div class="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
					{#if event.partner.logoUrl}
						<img
							src={event.partner.logoUrl}
							alt={event.partner.name}
							class="h-12 w-auto object-contain mb-3 opacity-75"
						/>
					{:else}
						<Building2 class="w-12 h-12 text-primary/40 mb-3" />
					{/if}
					<p class="text-sm font-medium text-primary/60">{event.partner.name}</p>
				</div>
			{/if}

			<!-- Past event overlay -->
			{#if event.isPast}
				<div class="absolute inset-0 bg-canvas/60">
					<div class="absolute top-2 right-2">
						<Badge variant="secondary">Past Event</Badge>
					</div>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Event Content -->
	<div class={cn('p-4', variant === 'compact' && 'flex items-start gap-4')}>
		{#if variant === 'compact'}
			<!-- Compact date display -->
			<div class="flex-shrink-0 text-center bg-canvas rounded-lg p-2 min-w-[56px]">
				<div class="text-2xl font-bold text-headers">{startDate.getDate()}</div>
				<div class="text-xs text-labels uppercase">
					{startDate.toLocaleDateString('en-US', { month: 'short' })}
				</div>
			</div>
		{/if}

		<div class="flex-1 space-y-2">
			<!-- Title -->
			<h3
				class={cn(
					'font-semibold text-headers line-clamp-2 group-hover:text-primary transition-colors',
					variant === 'default' ? 'text-lg' : 'text-base'
				)}
			>
				{event.title}
			</h3>

			<!-- Meta info -->
			<div class="flex flex-wrap gap-x-4 gap-y-1 text-sm text-labels">
				{#if variant === 'default'}
					<span class="inline-flex items-center gap-1.5">
						<Calendar class="w-4 h-4" />
						{formattedDate} at {formattedTime}
					</span>
				{:else}
					<span class="inline-flex items-center gap-1.5">
						<Calendar class="w-4 h-4" />
						{formattedTime}
					</span>
				{/if}

				<span class="inline-flex items-center gap-1.5">
					<MapPin class="w-4 h-4" />
					{event.location.city}
				</span>
			</div>

			<!-- Capacity or Past Event Stats -->
			{#if event.isPast}
				<p class="text-sm text-meta">
					{event.problemsCount ?? 0} problems tackled,
					{event.participantsCount ?? 0} participants
				</p>
			{:else}
				<CapacityIndicator
					registered={event.registeredCount}
					capacity={event.capacity}
					waitlistCount={event.waitlistCount}
					showLabel={variant === 'default'}
				/>
			{/if}
		</div>
	</div>
{/snippet}
