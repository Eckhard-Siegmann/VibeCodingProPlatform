<!--
  Events Listing Page
  Ticket: TICKET-29 | Spec: Ch.12.9, Ch.12.10 | Design: pagedesign/events_listing_design.md

  Temporal event browsing with inline registration.
  Three sections: Active Now, Upcoming, Past (with Load More).
-->
<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import { PageContainer, Card, Badge, Button, toastSuccess, toastError } from '$lib';
	import SearchBar from '$lib/components/ui/SearchBar.svelte';
	import ListFilterBar from '$lib/components/ui/ListFilterBar.svelte';
	import type { FilterConfig } from '$lib/components/ui/ListFilterBar.svelte';
	import type { EventListItem } from '$lib/server/repositories/events-public';

	let { data } = $props();

	let searchValue = $state(data.filters.search);
	let registeringEventId = $state<string | null>(null);

	// Filter config
	const filterConfig: FilterConfig[] = $derived([
		{
			key: 'location',
			label: 'Location',
			options: [
				{ value: 'all', label: 'All Locations' },
				...data.locations
			],
			defaultValue: 'all'
		},
		{
			key: 'time',
			label: 'Time Range',
			options: [
				{ value: 'all', label: 'All Time' },
				{ value: 'next_3_months', label: 'Next 3 Months' },
				{ value: 'last_6_months', label: 'Last 6 Months' },
				{ value: 'this_year', label: 'This Year' }
			],
			defaultValue: 'all'
		}
	]);

	// URL state management
	function updateUrl(params: Record<string, string>) {
		const url = new URL($page.url);
		for (const [key, value] of Object.entries(params)) {
			if (value && value !== 'all' && value !== '5') {
				url.searchParams.set(key, value);
			} else {
				url.searchParams.delete(key);
			}
		}
		goto(url.pathname + url.search, { replaceState: true, keepFocus: true, noScroll: true });
	}

	function handleSearch(query: string) {
		updateUrl({ search: query });
	}

	function handleFilterChange(key: string, value: string) {
		updateUrl({ [key]: value });
	}

	function handleClearAll() {
		searchValue = '';
		goto('/events', { replaceState: true });
	}

	function handleLoadMore() {
		const newCount = data.pastCount + 10;
		updateUrl({ pastCount: String(newCount) });
	}

	// Inline registration
	async function handleRegister(event: EventListItem) {
		if (registeringEventId) return;
		registeringEventId = event.event_id;

		try {
			const res = await fetch(`/api/events/${event.event_id}/registrations`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'register', in_presence: true })
			});
			const result = await res.json();

			if (!res.ok || !result.success) {
				toastError('Registration failed', result.error ?? 'Please try again');
				return;
			}

			if (result.waitlisted) {
				toastSuccess('Waitlisted', `You're on the waitlist for ${event.title}`);
			} else {
				toastSuccess('Registered', `You're registered for ${event.title}`);
			}

			// Refresh data to update button states
			invalidateAll();
		} catch {
			toastError('Network error', 'Please try again');
		} finally {
			registeringEventId = null;
		}
	}

	// Formatting helpers
	function formatDate(dateStr: string): string {
		const d = new Date(dateStr);
		return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	function formatTime(dateStr: string): string {
		const d = new Date(dateStr);
		return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
	}

	function formatPhase(mode: string | null): string {
		if (!mode) return 'Live';
		return mode.charAt(0).toUpperCase() + mode.slice(1);
	}

	// Registration button state
	function getRegStatus(eventId: string): 'confirmed' | 'waitlisted' | 'cancelled' | null {
		return data.userRegistrations[eventId] ?? null;
	}

	// Derived: is everything empty?
	const allEmpty = $derived(
		data.activeEvents.length === 0 &&
		data.upcomingEvents.length === 0 &&
		data.pastEvents.length === 0
	);

	const hasActiveFilters = $derived(
		data.filters.search !== '' ||
		data.filters.location !== 'all' ||
		data.filters.time !== 'all'
	);
</script>

<svelte:head>
	<title>Events | VibeCoding</title>
</svelte:head>

<PageContainer>
	<main aria-label="Events Listing">
		<!-- Page header -->
		<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
			<h1 class="text-2xl font-bold text-headers">Events</h1>
			<SearchBar
				bind:value={searchValue}
				placeholder="Search events…"
				onSearch={handleSearch}
				class="w-full md:w-72"
			/>
		</div>

		<!-- Filter bar -->
		<ListFilterBar
			filters={filterConfig}
			values={data.filters}
			onFilterChange={handleFilterChange}
			showClearAll={true}
			onClearAll={handleClearAll}
			class="mb-6 overflow-x-auto md:overflow-visible flex-nowrap md:flex-wrap"
		/>

		{#if allEmpty && !hasActiveFilters}
			<!-- Completely empty: no events in the system -->
			<div class="text-center py-16" role="status">
				<p class="text-4xl mb-4">📅</p>
				<p class="text-labels">No events have been created yet.</p>
				<p class="text-labels mt-1">Check back soon!</p>
			</div>
		{:else if allEmpty && hasActiveFilters}
			<!-- No events match filters -->
			<div class="text-center py-16" role="status">
				<p class="text-4xl mb-4">📅</p>
				<p class="text-labels">No events match your current filters.</p>
				<p class="text-labels mt-1">
					<button
						type="button"
						class="text-primary underline"
						onclick={handleClearAll}
					>Clear all filters</button>
				</p>
			</div>
		{:else}
			<!-- Active Now -->
			{#if data.activeEvents.length > 0}
				<section aria-label="Active events">
					<h2 class="text-sm font-semibold uppercase tracking-wider text-labels border-b border-secondary pb-2 mb-4 sticky top-[44px] md:top-[48px] z-10 bg-canvas">
						🔴 Active Now
						<span class="sr-only">: {data.activeEvents.length} event{data.activeEvents.length !== 1 ? 's' : ''}</span>
					</h2>

					<ul role="list" class="space-y-3">
						{#each data.activeEvents as event (event.event_id)}
							<li role="listitem">
								<a href="/event/{event.slug}" class="block no-underline group">
									<Card elevation="resting" class="p-4 md:p-5 border-l-4 border-primary bg-primary/5 transition-shadow hover:shadow-md cursor-pointer">
										<div class="flex items-start justify-between gap-3">
											<div class="flex-1 min-w-0">
												<h3 class="text-lg font-semibold text-headers group-hover:text-primary transition-colors">
													<span class="inline-block animate-pulse mr-1" aria-label="Currently active">🔴</span>
													{event.title}
												</h3>
												<p class="text-sm text-labels mt-1">
													{formatDate(event.starts_at)} · {formatTime(event.starts_at)}–{formatTime(event.planned_ends_at)}
												</p>
												<p class="text-sm text-labels">
													{event.location_name} · {event.room_name}
												</p>

												<div class="flex items-center gap-2 mt-2">
													<Badge variant="destructive">
														{formatPhase(event.current_mode)}
													</Badge>
													<span class="text-sm text-labels">
														{event.registration_count} registered
														{#if event.attendance_count}
															· {event.attendance_count} attending
														{/if}
													</span>
												</div>
											</div>

											<div class="flex flex-col items-end gap-2">
												{#if event.partner_logo_url}
													<img
														src={event.partner_logo_url}
														alt={event.partner_name}
														class="h-6 object-contain"
													/>
												{/if}
												<Button variant="default" size="sm">
													View Event →
												</Button>
											</div>
										</div>
									</Card>
								</a>
							</li>
						{/each}
					</ul>
				</section>
			{/if}

			<!-- Upcoming -->
			{#if data.upcomingEvents.length > 0}
				<section aria-label="Upcoming events">
					<h2 class="text-sm font-semibold uppercase tracking-wider text-labels border-b border-secondary pb-2 mb-4 mt-8 sticky top-[44px] md:top-[48px] z-10 bg-canvas">
						Upcoming
						<span class="sr-only">: {data.upcomingEvents.length} event{data.upcomingEvents.length !== 1 ? 's' : ''}</span>
					</h2>

					<ul role="list" class="space-y-3">
						{#each data.upcomingEvents as event (event.event_id)}
							{@const regStatus = getRegStatus(event.event_id)}
							{@const isFull = event.registration_count >= event.effective_capacity}
							<li role="listitem">
								<Card elevation="resting" class="p-4 md:p-5 transition-shadow hover:shadow-md">
									<a href="/event/{event.slug}" class="block no-underline group">
										<h3 class="text-lg font-semibold text-headers group-hover:text-primary transition-colors">
											{event.title}
										</h3>
										<p class="text-sm text-labels mt-1">
											{formatDate(event.starts_at)} · {formatTime(event.starts_at)}–{formatTime(event.planned_ends_at)}
										</p>
										<p class="text-sm text-labels">
											{event.location_name} · {event.room_name}
										</p>
										<p class="text-sm text-labels mt-1">
											{event.registration_count} registered · {event.effective_capacity} capacity
										</p>
									</a>

									<div class="flex items-center justify-between mt-3">
										<div class="flex items-center gap-2">
											{#if event.partner_logo_url}
												<img
													src={event.partner_logo_url}
													alt={event.partner_name}
													class="h-6 object-contain"
												/>
											{/if}
											{#if data.isModerator}
												<a
													href="/dashboard/moderator?event={event.event_id}"
													class="text-xs text-labels underline hover:text-headers"
												>Manage</a>
											{/if}
										</div>

										<!-- Registration button -->
										{#if regStatus === 'confirmed'}
											<a href="/event/{event.slug}">
												<Button variant="secondary" size="sm" class="text-success">
													Registered ✓
												</Button>
											</a>
										{:else if regStatus === 'waitlisted'}
											<a href="/event/{event.slug}">
												<Button variant="secondary" size="sm" class="text-warning">
													Waitlisted
												</Button>
											</a>
										{:else if isFull}
											<Button
												variant="outline"
												size="sm"
												disabled={registeringEventId === event.event_id}
												onclick={(e: MouseEvent) => { e.preventDefault(); e.stopPropagation(); handleRegister(event); }}
												aria-label="Join waitlist for {event.title}"
											>
												{registeringEventId === event.event_id ? 'Joining…' : 'Join Waitlist'}
											</Button>
										{:else}
											<Button
												variant="default"
												size="sm"
												disabled={registeringEventId === event.event_id}
												onclick={(e: MouseEvent) => { e.preventDefault(); e.stopPropagation(); handleRegister(event); }}
												aria-label="Register for {event.title}"
											>
												{registeringEventId === event.event_id ? 'Registering…' : 'Register'}
											</Button>
										{/if}
									</div>
								</Card>
							</li>
						{/each}
					</ul>
				</section>
			{:else if !hasActiveFilters}
				<section aria-label="Upcoming events">
					<h2 class="text-sm font-semibold uppercase tracking-wider text-labels border-b border-secondary pb-2 mb-4 mt-8">
						Upcoming
					</h2>
					<div class="text-center py-8" role="status">
						<p class="text-4xl mb-4">📅</p>
						<p class="text-labels">No upcoming events scheduled yet.</p>
						<p class="text-labels mt-1">Check back soon!</p>
					</div>
				</section>
			{/if}

			<!-- Past -->
			{#if data.pastEvents.length > 0 || data.pastTotal > 0}
				<section aria-label="Past events">
					<h2 class="text-sm font-semibold uppercase tracking-wider text-labels border-b border-secondary pb-2 mb-4 mt-8 sticky top-[44px] md:top-[48px] z-10 bg-canvas">
						Past
						<span class="sr-only">: {data.pastEvents.length} of {data.pastTotal} event{data.pastTotal !== 1 ? 's' : ''}</span>
					</h2>

					<ul role="list" class="space-y-3">
						{#each data.pastEvents as event (event.event_id)}
							<li role="listitem">
								<a href="/event/{event.slug}" class="block no-underline group">
									<Card elevation="flat" class="p-4 md:p-5 bg-canvas transition-shadow hover:shadow-sm cursor-pointer">
										<div class="flex items-start justify-between gap-3">
											<div class="flex-1 min-w-0">
												<h3 class="text-base font-semibold text-headers group-hover:text-primary transition-colors">
													{event.title}
												</h3>
												<p class="text-sm text-labels mt-1">
													{formatDate(event.starts_at)} · {event.location_name}
												</p>
												<p class="text-sm text-labels mt-1">
													{#if event.attendance_count}
														{event.attendance_count} attended
													{:else}
														{event.registration_count} registered
													{/if}
													{#if event.problem_count}
														· {event.problem_count} problem{event.problem_count !== 1 ? 's' : ''}
													{/if}
													{#if event.review_count}
														· {event.review_count} review{event.review_count !== 1 ? 's' : ''}
													{/if}
												</p>
											</div>

											{#if data.isModerator}
												<a
													href="/dashboard/moderator?event={event.event_id}"
													class="text-xs text-labels underline hover:text-headers"
													onclick={(e: MouseEvent) => e.stopPropagation()}
												>Manage</a>
											{/if}
										</div>
									</Card>
								</a>
							</li>
						{/each}
					</ul>

					<!-- Load More button -->
					{#if data.pastCount < data.pastTotal}
						<div class="text-center mt-6">
							<Button
								variant="secondary"
								onclick={handleLoadMore}
								aria-label="Load more past events"
							>
								Load More Past Events
							</Button>
							<p class="text-xs text-labels mt-2">
								Showing {data.pastEvents.length} of {data.pastTotal} past events
							</p>
						</div>
					{/if}
				</section>
			{:else if !hasActiveFilters && data.activeEvents.length === 0 && data.upcomingEvents.length === 0}
				<!-- Only show "no past events" if there are truly no events at all -->
			{/if}
		{/if}
	</main>
</PageContainer>
