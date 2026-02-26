<!--
  Admin Event Management — server-side pagination, search, filtering.
  Spec: Ch.17.3, Ch.12.10 | Design: pagedesign/admin_interfaces_design.md | Ticket: TICKET-30
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { cn } from '$lib/utils';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import SearchBar from '$lib/components/ui/SearchBar.svelte';
	import ListFilterBar from '$lib/components/ui/ListFilterBar.svelte';
	import Pagination from '$lib/components/ui/Pagination.svelte';
	import type { FilterConfig } from '$lib/components/ui/ListFilterBar.svelte';
	import {
		EventEditor,
		type EventData,
		type Partner,
		type Room,
		type User
	} from '$lib/components/admin';
	import Plus from '@lucide/svelte/icons/plus';
	import Edit from '@lucide/svelte/icons/pencil';
	import Users from '@lucide/svelte/icons/users';
	import Calendar from '@lucide/svelte/icons/calendar';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';

	interface EventWithStats extends EventData {
		partner_name: string;
		location_name: string;
		location_id: string;
		registrations: number;
		capacity: number;
		is_past: boolean;
	}

	let { data } = $props();

	let searchValue = $state(data.filters.search);

	// Editor state
	let editorOpen = $state(false);
	let editorMode = $state<'create' | 'edit'>('create');
	let selectedEvent = $state<EventData | null>(null);

	// Filter configuration
	const filterConfig: FilterConfig[] = $derived([
		{
			key: 'status',
			label: 'Status',
			options: [
				{ value: 'all', label: 'All Events' },
				{ value: 'upcoming', label: 'Upcoming' },
				{ value: 'past', label: 'Past' }
			],
			defaultValue: 'all'
		},
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
			key: 'sort',
			label: 'Sort',
			options: [
				{ value: 'date_desc', label: 'Newest First' },
				{ value: 'date_asc', label: 'Oldest First' },
				{ value: 'title_asc', label: 'Title A–Z' },
				{ value: 'registrations', label: 'Most Registrations' }
			],
			defaultValue: 'date_desc'
		}
	]);

	// URL state management
	function updateUrl(params: Record<string, string>, options?: { resetPage?: boolean; pushState?: boolean }) {
		const url = new URL($page.url);
		for (const [key, value] of Object.entries(params)) {
			if (value && value !== 'all' && value !== 'date_desc' && value !== '1' && value !== '') {
				url.searchParams.set(key, value);
			} else {
				url.searchParams.delete(key);
			}
		}
		if (options?.resetPage) {
			url.searchParams.delete('page');
		}
		goto(url.pathname + url.search, {
			replaceState: !options?.pushState,
			keepFocus: true,
			noScroll: true
		});
	}

	function handleSearch(query: string) {
		updateUrl({ search: query }, { resetPage: true });
	}

	function handleFilterChange(key: string, value: string) {
		updateUrl({ [key]: value }, { resetPage: true });
	}

	function handleClearAll() {
		searchValue = '';
		goto('/admin/events', { replaceState: true });
	}

	function handlePageChange(newPage: number) {
		updateUrl({ page: String(newPage) }, { pushState: true });
	}

	// Format helpers
	function formatDate(isoString: string): string {
		return new Date(isoString).toLocaleDateString('en-GB', {
			weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
		});
	}

	function formatTime(isoString: string): string {
		return new Date(isoString).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
	}

	// Editor
	function openEditor(mode: 'create' | 'edit', event?: EventData) {
		editorMode = mode;
		selectedEvent = event ?? null;
		editorOpen = true;
	}

	async function handleSave(eventData: EventData) {
		const isEdit = editorMode === 'edit' && eventData.event_id;
		const url = isEdit ? `/api/admin/events/${eventData.event_id}` : '/api/admin/events';
		const method = isEdit ? 'PATCH' : 'POST';

		try {
			const res = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(eventData)
			});
			const result = await res.json();
			if (!result.success) {
				console.error('Save failed:', result.error);
				return;
			}
			editorOpen = false;
			goto($page.url.pathname + $page.url.search, { invalidateAll: true });
		} catch (err) {
			console.error('Save error:', err);
		}
	}

	const hasActiveFilters = $derived(
		data.filters.search !== '' ||
		data.filters.status !== 'all' ||
		data.filters.location !== 'all' ||
		data.filters.sort !== 'date_desc'
	);

	// Stats from full data
	const upcomingCount = $derived(data.events.filter((e: EventWithStats) => !e.is_past).length);
	const pastCount = $derived(data.events.filter((e: EventWithStats) => e.is_past).length);
	const totalRegistrations = $derived(data.events.reduce((sum: number, e: EventWithStats) => sum + e.registrations, 0));
</script>

<svelte:head>
	<title>Event Management | Admin | VibeCoding</title>
</svelte:head>

<div class="min-h-screen bg-viewport">
	<div class="max-w-7xl mx-auto px-4 py-6 md:py-8">
		<!-- Header -->
		<div class="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
			<div class="flex items-center gap-4">
				<a
					href="/admin"
					class="p-2 rounded-[var(--radius-card)] hover:bg-canvas transition-colors"
					title="Back to Admin"
				>
					<ArrowLeft class="w-5 h-5 text-meta" />
				</a>
				<div>
					<h1 class="text-2xl md:text-3xl font-bold text-headers">Event Management</h1>
					<p class="text-meta">Create and manage community events</p>
				</div>
			</div>

			<Button variant="default" onclick={() => openEditor('create')}>
				<Plus class="w-4 h-4 mr-2" />
				Create Event
			</Button>
		</div>

		<!-- Stats -->
		<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
			<Card elevation="resting">
				<CardContent class="py-3 text-center">
					<p class="text-2xl font-bold text-headers">{upcomingCount}</p>
					<p class="text-sm text-meta">Upcoming</p>
				</CardContent>
			</Card>
			<Card elevation="resting">
				<CardContent class="py-3 text-center">
					<p class="text-2xl font-bold text-headers">{pastCount}</p>
					<p class="text-sm text-meta">Past</p>
				</CardContent>
			</Card>
			<Card elevation="resting">
				<CardContent class="py-3 text-center">
					<p class="text-2xl font-bold text-primary">{totalRegistrations}</p>
					<p class="text-sm text-meta">Total Registrations</p>
				</CardContent>
			</Card>
			<Card elevation="resting">
				<CardContent class="py-3 text-center">
					<p class="text-2xl font-bold text-headers">{data.pagination.totalItems}</p>
					<p class="text-sm text-meta">Total Events</p>
				</CardContent>
			</Card>
		</div>

		<!-- Search + Filters -->
		<div class="space-y-3 mb-6">
			<SearchBar
				bind:value={searchValue}
				placeholder="Search events…"
				onSearch={handleSearch}
				class="w-full md:w-80"
			/>
			<ListFilterBar
				filters={filterConfig}
				values={data.filters}
				onFilterChange={handleFilterChange}
				showClearAll={true}
				onClearAll={handleClearAll}
				class="overflow-x-auto md:overflow-visible flex-nowrap md:flex-wrap"
			/>
		</div>

		<!-- Results count -->
		{#if data.events.length > 0}
			<p class="text-sm text-labels mb-4" aria-live="polite">
				Showing {(data.pagination.page - 1) * data.pagination.pageSize + 1}–{Math.min(data.pagination.page * data.pagination.pageSize, data.pagination.totalItems)} of {data.pagination.totalItems} event{data.pagination.totalItems !== 1 ? 's' : ''}
			</p>
		{/if}

		<!-- Events List -->
		<Card elevation="resting">
			<CardContent>
				{#if data.events.length > 0}
					<!-- Desktop: table -->
					<div class="hidden md:block overflow-x-auto">
						<table class="w-full text-sm">
							<thead>
								<tr class="border-b border-secondary">
									<th class="text-left py-3 px-2 text-labels font-medium">Event</th>
									<th class="text-left py-3 px-2 text-labels font-medium">Date</th>
									<th class="text-left py-3 px-2 text-labels font-medium">Location</th>
									<th class="text-left py-3 px-2 text-labels font-medium">Registrations</th>
									<th class="text-left py-3 px-2 text-labels font-medium">Status</th>
									<th class="py-3 px-2"></th>
								</tr>
							</thead>
							<tbody>
								{#each data.events as event (event.event_id)}
									{@const percentage = event.capacity > 0 ? Math.round((event.registrations / event.capacity) * 100) : 0}
									<tr class="border-b border-secondary/50 hover:bg-canvas/50 transition-colors">
										<td class="py-3 px-2 font-medium text-headers">{event.title}</td>
										<td class="py-3 px-2">
											<p class="text-headers">{formatDate(event.starts_at)}</p>
											<p class="text-xs text-meta">{formatTime(event.starts_at)}</p>
										</td>
										<td class="py-3 px-2 text-body">{event.location_name}</td>
										<td class="py-3 px-2">
											<div class="flex items-center gap-2">
												<span class="text-headers">{event.registrations}/{event.capacity}</span>
												<Badge variant={percentage >= 90 ? 'destructive' : percentage >= 70 ? 'secondary' : 'outline'}>
													{percentage}%
												</Badge>
											</div>
										</td>
										<td class="py-3 px-2">
											{#if event.is_past}
												<Badge variant="draft">Past</Badge>
											{:else}
												<Badge variant="ready">Upcoming</Badge>
											{/if}
										</td>
										<td class="py-3 px-2">
											<button
												onclick={() => openEditor('edit', event)}
												class="p-1.5 rounded hover:bg-canvas text-labels hover:text-headers transition-colors"
												title="Edit event"
												aria-label="Edit {event.title}"
											>
												<Edit class="w-4 h-4" />
											</button>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>

					<!-- Mobile: cards -->
					<div class="md:hidden space-y-3">
						{#each data.events as event (event.event_id)}
							{@const percentage = event.capacity > 0 ? Math.round((event.registrations / event.capacity) * 100) : 0}
							<div class="p-3 rounded-[var(--radius-card)] border border-secondary/50">
								<div class="flex items-start justify-between gap-2">
									<div class="min-w-0">
										<p class="font-medium text-headers">{event.title}</p>
										<p class="text-sm text-labels">{formatDate(event.starts_at)} · {event.location_name}</p>
									</div>
									<button
										onclick={() => openEditor('edit', event)}
										class="p-2 rounded hover:bg-canvas text-labels hover:text-headers transition-colors flex-shrink-0"
										title="Edit"
									>
										<Edit class="w-4 h-4" />
									</button>
								</div>
								<div class="flex items-center gap-2 mt-2">
									{#if event.is_past}
										<Badge variant="draft">Past</Badge>
									{:else}
										<Badge variant="ready">Upcoming</Badge>
									{/if}
									<span class="text-sm text-labels">{event.registrations}/{event.capacity} ({percentage}%)</span>
								</div>
							</div>
						{/each}
					</div>
				{:else if hasActiveFilters}
					<div class="py-12 text-center">
						<Calendar class="w-12 h-12 text-meta mx-auto mb-4" />
						<p class="text-meta">No events match your current filters.</p>
						<p class="text-sm text-meta mt-1">
							<button type="button" class="text-primary underline" onclick={handleClearAll}>Clear all filters</button>
						</p>
					</div>
				{:else}
					<div class="py-12 text-center">
						<Calendar class="w-12 h-12 text-meta mx-auto mb-4" />
						<p class="text-meta">No events found.</p>
						<Button variant="default" onclick={() => openEditor('create')} class="mt-4">
							Create your first event
						</Button>
					</div>
				{/if}
			</CardContent>
		</Card>

		<!-- Pagination -->
		<Pagination
			page={data.pagination.page}
			pageSize={data.pagination.pageSize}
			totalItems={data.pagination.totalItems}
			totalPages={data.pagination.totalPages}
			onPageChange={handlePageChange}
		/>
	</div>
</div>

<!-- Event Editor Dialog -->
<EventEditor
	bind:open={editorOpen}
	event={selectedEvent}
	partners={data.partners}
	rooms={data.rooms}
	moderators={data.moderators}
	mode={editorMode}
	onSave={handleSave}
	onCancel={() => (editorOpen = false)}
/>
