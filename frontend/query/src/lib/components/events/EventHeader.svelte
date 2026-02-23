<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { InitialAvatar } from '$lib/components/ui/initial-avatar';
	import { cn } from '$lib/utils';
	import { formatDate, formatTime } from '$lib/utils/date-formatting';
	import {
		Calendar,
		MapPin,
		Clock,
		Building2,
		ExternalLink,
		Linkedin,
		Twitter
	} from '@lucide/svelte';

	export interface EventHost {
		id: string;
		displayName: string;
	}

	export interface EventHeaderData {
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
			address: string;
		};
		room?: {
			name: string;
		};
		partner: {
			name: string;
			logoUrl?: string;
		};
		host: EventHost;
		coHost1?: EventHost | null;
		coHost2?: EventHost | null;
		websiteUrl?: string | null;
		linkedinUrl?: string | null;
		xPostUrl?: string | null;
		isPast?: boolean;
		isLive?: boolean;
	}

	interface Props {
		event: EventHeaderData;
		class?: string;
	}

	let { event, class: className }: Props = $props();

	const startDate = $derived(
		typeof event.startsAt === 'string' ? new Date(event.startsAt) : event.startsAt
	);
	const endDate = $derived(
		event.plannedEndsAt
			? typeof event.plannedEndsAt === 'string'
				? new Date(event.plannedEndsAt)
				: event.plannedEndsAt
			: null
	);

	// Calculate duration
	const duration = $derived.by(() => {
		if (!endDate) return null;
		const diffMs = endDate.getTime() - startDate.getTime();
		const hours = Math.floor(diffMs / (1000 * 60 * 60));
		const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

		if (hours > 0 && minutes > 0) {
			return `${hours}h ${minutes}m`;
		} else if (hours > 0) {
			return `${hours}h`;
		}
		return `${minutes}m`;
	});

	const hosts = $derived([event.host, event.coHost1, event.coHost2].filter(Boolean) as EventHost[]);
</script>

<header class={cn('space-y-6', className)}>
	<!-- Event Image -->
	<div class="relative aspect-[21/9] rounded-[var(--radius-card)] overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5">
		{#if event.imageUrl}
			<img src={event.imageUrl} alt={event.title} class="w-full h-full object-cover" />
		{:else}
			<!-- Auto-generated placeholder -->
			<div class="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
				{#if event.partner.logoUrl}
					<img
						src={event.partner.logoUrl}
						alt={event.partner.name}
						class="h-16 md:h-24 w-auto object-contain mb-4 opacity-75"
					/>
				{:else}
					<Building2 class="w-16 h-16 md:w-24 md:h-24 text-primary/40 mb-4" />
				{/if}
				<p class="text-lg font-medium text-primary/60">{event.partner.name}</p>
			</div>
		{/if}

		<!-- Status badges -->
		<div class="absolute top-4 right-4 flex gap-2">
			{#if event.isLive}
				<Badge variant="destructive" size="large">
					<span class="inline-block w-2 h-2 bg-white rounded-full animate-pulse mr-2"></span>
					LIVE
				</Badge>
			{:else if event.isPast}
				<Badge variant="secondary" size="large">Past Event</Badge>
			{/if}
		</div>
	</div>

	<!-- Event Info -->
	<div class="space-y-4">
		<!-- Title and Partner -->
		<div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
			<div>
				<h1 class="text-2xl md:text-3xl font-bold text-headers">{event.title}</h1>
				<p class="text-labels mt-1">Hosted by {event.partner.name}</p>
			</div>

			<!-- External Links -->
			{#if event.websiteUrl || event.linkedinUrl || event.xPostUrl}
				<div class="flex gap-3">
					{#if event.websiteUrl}
						<a
							href={event.websiteUrl}
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
						>
							<ExternalLink class="w-4 h-4" />
							Website
						</a>
					{/if}
					{#if event.linkedinUrl}
						<a
							href={event.linkedinUrl}
							target="_blank"
							rel="noopener noreferrer"
							class="text-primary hover:text-primary-hover"
							aria-label="LinkedIn"
						>
							<Linkedin class="w-5 h-5" />
						</a>
					{/if}
					{#if event.xPostUrl}
						<a
							href={event.xPostUrl}
							target="_blank"
							rel="noopener noreferrer"
							class="text-primary hover:text-primary-hover"
							aria-label="X/Twitter"
						>
							<Twitter class="w-5 h-5" />
						</a>
					{/if}
				</div>
			{/if}
		</div>

		<!-- Date, Time, Location Grid -->
		<div class="grid gap-4 md:grid-cols-3">
			<!-- Date & Time -->
			<div class="flex items-start gap-3">
				<div class="p-2 rounded-lg bg-primary/10">
					<Calendar class="w-5 h-5 text-primary" />
				</div>
				<div>
					<p class="text-sm text-labels">Date & Time</p>
					<p class="font-medium text-headers">{formatDate(startDate)}</p>
					<p class="text-sm text-headers">
						{formatTime(startDate)}
						{#if endDate}
							- {formatTime(endDate)}
						{/if}
					</p>
				</div>
			</div>

			<!-- Duration -->
			{#if duration}
				<div class="flex items-start gap-3">
					<div class="p-2 rounded-lg bg-primary/10">
						<Clock class="w-5 h-5 text-primary" />
					</div>
					<div>
						<p class="text-sm text-labels">Duration</p>
						<p class="font-medium text-headers">{duration}</p>
					</div>
				</div>
			{/if}

			<!-- Location -->
			<div class="flex items-start gap-3">
				<div class="p-2 rounded-lg bg-primary/10">
					<MapPin class="w-5 h-5 text-primary" />
				</div>
				<div>
					<p class="text-sm text-labels">Location</p>
					<p class="font-medium text-headers">{event.location.name}</p>
					<p class="text-sm text-headers">
						{event.location.address}, {event.location.city}
						{#if event.room}
							<br /><span class="text-labels">Room: {event.room.name}</span>
						{/if}
					</p>
				</div>
			</div>
		</div>

		<!-- Hosts -->
		<div>
			<p class="text-sm text-labels mb-2">
				{hosts.length === 1 ? 'Host' : 'Hosts'}
			</p>
			<div class="flex flex-wrap gap-3">
				{#each hosts as host, index (host.id)}
					<div class="inline-flex items-center gap-2 bg-canvas rounded-full py-1 px-3">
						<InitialAvatar userName={host.displayName} userId={host.id} size="sm" />
						<span class="text-sm font-medium text-headers">{host.displayName}</span>
						{#if index === 0}
							<Badge variant="default" class="text-[10px] px-1.5 py-0">Host</Badge>
						{/if}
					</div>
				{/each}
			</div>
		</div>

		<!-- Description -->
		{#if event.description}
			<div class="pt-2">
				<h2 class="text-lg font-semibold text-headers mb-2">About This Event</h2>
				<div class="prose prose-sm max-w-none text-labels">
					{event.description}
				</div>
			</div>
		{/if}
	</div>
</header>
