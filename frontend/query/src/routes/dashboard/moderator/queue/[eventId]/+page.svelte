<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { tick } from 'svelte';
	import PageContainer from '$lib/components/layout/PageContainer.svelte';
	import { Card } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import BackButton from '$lib/components/ui/back-button/back-button.svelte';
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
	import SearchBar from '$lib/components/ui/SearchBar.svelte';
	import ListFilterBar from '$lib/components/ui/ListFilterBar.svelte';
	import type { FilterConfig } from '$lib/components/ui/ListFilterBar.svelte';
	import { toastSuccess, toastError } from '$lib/stores/toast';
	import {
		ChevronUp,
		ChevronDown,
		Plus,
		X,
		Calendar,
		FileText,
		ArrowRight
	} from '@lucide/svelte';
	import type { AvailableProblem } from '$lib/server/repositories/queue';

	let { data } = $props();

	const eventId = $derived(data.eventId);
	const eventTitle = $derived(data.eventTitle);
	const eventDate = $derived(data.eventDate);
	const locationName = $derived(data.locationName);
	const queue = $derived(data.queue);

	// ── Available Problems state (Load More pattern) ──────────────────
	let displayedProblems = $state<AvailableProblem[]>([]);
	let totalAvailable = $state(0);
	let currentOffset = $state(0);
	let loadingMore = $state(false);

	// Search and filter state (component-level, NOT URL-persisted)
	let searchQuery = $state('');
	let filterValues = $state<Record<string, string>>({ problemType: '' });

	// Initialize from server data
	$effect(() => {
		displayedProblems = data.availableProblems.items;
		totalAvailable = data.availableProblems.totalItems;
		currentOffset = data.availableProblems.items.length;
	});

	// Filter config for ListFilterBar
	const problemTypeFilters: FilterConfig[] = [
		{
			key: 'problemType',
			label: 'Type',
			options: [
				{ value: '', label: 'All Types' },
				{ value: 'greenfield', label: 'Greenfield' },
				{ value: 'brownfield', label: 'Brownfield' },
				{ value: 'explorative', label: 'Explorative' },
				{ value: 'advanced_greenfield', label: 'Advanced Greenfield' },
				{ value: 'reverse_engineering', label: 'Reverse Engineering' },
				{ value: 'other', label: 'Other' }
			],
			defaultValue: ''
		}
	];

	// Selection state for batch add
	let selectedIds = $state<Set<string>>(new Set());

	// Loading states
	let addingIds = $state<Set<string>>(new Set());
	let removingId = $state<string | null>(null);
	let reordering = $state(false);

	// Confirm dialog state
	let confirmOpen = $state(false);
	let confirmProblemId = $state<string | null>(null);
	let confirmProblemTitle = $state('');

	// ── Fetch available problems from API ─────────────────────────────
	async function fetchAvailableProblems(opts: {
		search: string;
		problemType: string;
		limit: number;
		offset: number;
		append?: boolean;
	}) {
		const params = new URLSearchParams();
		if (opts.search) params.set('search', opts.search);
		if (opts.problemType) params.set('type', opts.problemType);
		params.set('limit', String(opts.limit));
		params.set('offset', String(opts.offset));

		const res = await fetch(`/api/events/${eventId}/available-problems?${params}`);
		if (!res.ok) {
			toastError('Error', 'Failed to load available problems');
			return;
		}

		const result = await res.json();
		if (opts.append) {
			displayedProblems = [...displayedProblems, ...result.items];
		} else {
			displayedProblems = result.items;
			// Clear selections that are no longer visible after a fresh search/filter
			const visibleIds = new Set(result.items.map((p: AvailableProblem) => p.problem_id));
			selectedIds = new Set([...selectedIds].filter((id) => visibleIds.has(id)));
		}
		totalAvailable = result.totalItems;
		currentOffset = opts.append
			? currentOffset + result.items.length
			: result.items.length;
	}

	// ── Search handler ────────────────────────────────────────────────
	function handleSearch(query: string) {
		searchQuery = query;
		fetchAvailableProblems({
			search: query,
			problemType: filterValues.problemType,
			limit: 20,
			offset: 0
		});
	}

	// ── Filter handler ────────────────────────────────────────────────
	function handleFilterChange(key: string, value: string) {
		filterValues = { ...filterValues, [key]: value };
		fetchAvailableProblems({
			search: searchQuery,
			problemType: key === 'problemType' ? value : filterValues.problemType,
			limit: 20,
			offset: 0
		});
	}

	// ── Load More handler ─────────────────────────────────────────────
	async function loadMore() {
		loadingMore = true;
		try {
			await fetchAvailableProblems({
				search: searchQuery,
				problemType: filterValues.problemType,
				limit: 20,
				offset: currentOffset,
				append: true
			});
		} finally {
			loadingMore = false;
		}
	}

	// ── Selection ─────────────────────────────────────────────────────
	function toggleSelection(problemId: string) {
		const next = new Set(selectedIds);
		if (next.has(problemId)) {
			next.delete(problemId);
		} else {
			next.add(problemId);
		}
		selectedIds = next;
	}

	// ── Queue operations ──────────────────────────────────────────────
	async function addToQueue(problemId: string) {
		addingIds = new Set([...addingIds, problemId]);
		try {
			const res = await fetch(`/api/events/${eventId}/decisions`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					problem_id: problemId,
					decision_type: 'selected_for_event'
				})
			});
			const result = await res.json();
			if (result.success) {
				selectedIds = new Set([...selectedIds].filter((id) => id !== problemId));
				// Remove from displayed list and update count
				displayedProblems = displayedProblems.filter((p) => p.problem_id !== problemId);
				totalAvailable = Math.max(0, totalAvailable - 1);
				currentOffset = Math.max(0, currentOffset - 1);
				await invalidateAll();
			} else {
				toastError('Error', result.error || 'Failed to add problem to queue');
			}
		} catch {
			toastError('Error', 'Network request failed');
		} finally {
			const next = new Set(addingIds);
			next.delete(problemId);
			addingIds = next;
		}
	}

	async function addSelectedToQueue() {
		const ids = [...selectedIds];
		for (const id of ids) {
			await addToQueue(id);
		}
		if (ids.length > 0) {
			toastSuccess('Queue Updated', `${ids.length} problem(s) added to event queue`);
		}
	}

	function confirmRemove(problemId: string, title: string) {
		confirmProblemId = problemId;
		confirmProblemTitle = title;
		confirmOpen = true;
	}

	async function removeFromQueue() {
		if (!confirmProblemId) return;
		const problemId = confirmProblemId;
		confirmOpen = false;
		removingId = problemId;

		try {
			const res = await fetch(`/api/events/${eventId}/decisions`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					problem_id: problemId,
					decision_type: 'deselected_for_event'
				})
			});
			const result = await res.json();
			if (result.success) {
				toastSuccess('Removed', 'Problem removed from event queue');
				await invalidateAll();
				// Refresh the available problems to reflect the removed item returning to backlog
				await fetchAvailableProblems({
					search: searchQuery,
					problemType: filterValues.problemType,
					limit: Math.max(currentOffset, 20),
					offset: 0
				});
			} else {
				toastError('Error', result.error || 'Failed to remove problem');
			}
		} catch {
			toastError('Error', 'Network request failed');
		} finally {
			removingId = null;
		}
	}

	async function moveInQueue(problemId: string, direction: 'up' | 'down') {
		if (!queue || reordering) return;

		const currentIndex = queue.findIndex((q: any) => q.problem_id === problemId);
		if (currentIndex === -1) return;
		if (direction === 'up' && currentIndex === 0) return;
		if (direction === 'down' && currentIndex === queue.length - 1) return;

		const orderedIds = queue.map((q: any) => q.problem_id);
		const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
		const temp = orderedIds[currentIndex];
		orderedIds[currentIndex] = orderedIds[swapIndex];
		orderedIds[swapIndex] = temp;

		reordering = true;
		try {
			const res = await fetch(`/api/events/${eventId}/queue`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ordered_problem_ids: orderedIds })
			});
			if (res.ok) {
				await invalidateAll();
				// Scroll moved item into view after DOM update
				tick().then(() => {
					const el = document.querySelector(`[data-problem-id="${problemId}"]`);
					el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
				});
			} else {
				toastError('Reorder Failed', 'Could not update queue order');
			}
		} catch {
			toastError('Error', 'Failed to communicate with server');
		} finally {
			reordering = false;
		}
	}

	function formatDate(iso: string): string {
		try {
			return new Date(iso).toLocaleDateString('en-US', {
				weekday: 'long',
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			});
		} catch {
			return iso;
		}
	}
</script>

<svelte:head>
	<title>Plan Queue — {eventTitle} — VibeCoding</title>
</svelte:head>

<PageContainer>
	<!-- Header -->
	<header class="mb-6">
		<BackButton href="/dashboard/moderator" label="Back to Dashboard" />
		<div class="mt-3">
			<h1 class="text-2xl md:text-3xl font-bold text-headers flex items-center gap-2">
				<Calendar class="w-6 h-6 text-success" />
				Plan Queue
			</h1>
			<p class="text-labels mt-1">{eventTitle}</p>
			{#if eventDate || locationName}
				<p class="text-sm text-meta">
					{#if eventDate}{formatDate(eventDate)}{/if}
					{#if eventDate && locationName} · {/if}
					{#if locationName}{locationName}{/if}
				</p>
			{/if}
			<div class="flex gap-4 mt-2 text-sm text-labels">
				<span>Queue: <strong class="text-headers">{queue?.length ?? 0}</strong> problems</span>
				<span
					>Available: <strong class="text-headers">{totalAvailable}</strong> problems</span
				>
			</div>
		</div>
	</header>

	<!-- Main Content: Desktop side-by-side, Mobile stacked -->
	<div class="grid gap-6 lg:grid-cols-2">
		<!-- Event Queue (shown first on both mobile and desktop) -->
		<section class="order-1" aria-label="Event queue, ordered by pitch priority">
			<h2 class="text-lg font-semibold text-headers mb-3">
				Event Queue ({queue?.length ?? 0})
			</h2>

			{#if queue?.length === 0}
				<Card padding="md" class="text-center text-meta py-8 border-dashed">
					<Calendar class="w-8 h-8 text-secondary mx-auto mb-2" />
					<p>No problems in the event queue yet.</p>
					<p class="text-sm mt-2">Select problems from the Available list to add them.</p>
				</Card>
			{:else}
				<div class="lg:max-h-[calc(100vh-var(--height-topbar-desktop,56px)-120px)] lg:overflow-y-auto space-y-2">
					{#each queue || [] as problem, idx (problem.problem_id)}
						<Card
							elevation="resting"
							padding="sm"
							class={removingId === problem.problem_id ? 'opacity-50' : ''}
							data-problem-id={problem.problem_id}
						>
							<div class="flex items-center gap-2">
								<!-- Reorder controls -->
								<div class="flex flex-col gap-0.5 flex-shrink-0">
									<button
										onclick={() => moveInQueue(problem.problem_id, 'up')}
										disabled={idx === 0 || reordering}
										class="p-1.5 text-meta hover:text-primary disabled:opacity-30 rounded hover:bg-canvas"
										aria-label="Move {problem.title} up"
									>
										<ChevronUp class="w-4 h-4" />
									</button>
									<div
										class="text-center text-xs font-bold text-headers bg-canvas rounded px-1.5 py-0.5"
										aria-label="Position {idx + 1} of {queue.length}"
									>
										{idx + 1}
									</div>
									<button
										onclick={() => moveInQueue(problem.problem_id, 'down')}
										disabled={idx === queue.length - 1 || reordering}
										class="p-1.5 text-meta hover:text-primary disabled:opacity-30 rounded hover:bg-canvas"
										aria-label="Move {problem.title} down"
									>
										<ChevronDown class="w-4 h-4" />
									</button>
								</div>

								<!-- Problem info -->
								<div class="flex-1 min-w-0">
									<div class="flex items-start justify-between gap-2">
										<div class="min-w-0">
											<a
												href="/problem/{problem.problem_id}"
												class="font-semibold text-headers hover:text-primary truncate block"
											>
												{problem.title}
											</a>
											<p class="text-sm text-labels">{problem.owner_display_name}</p>
										</div>
										<div class="flex gap-1 flex-shrink-0 flex-wrap">
											<Badge variant={problem.current_readiness_state as any}>
												{problem.current_readiness_state.replace(/_/g, ' ')}
											</Badge>
											<Badge variant="selected_for_event">
												{problem.queue_state}
											</Badge>
										</div>
									</div>
								</div>

								<!-- Remove button -->
								<button
									onclick={() => confirmRemove(problem.problem_id, problem.title)}
									disabled={removingId === problem.problem_id}
									class="p-2 text-meta hover:text-alert rounded hover:bg-alert/10 flex-shrink-0"
									aria-label="Remove {problem.title} from queue"
								>
									<X class="w-4 h-4" />
								</button>
							</div>
						</Card>
					{/each}
				</div>
			{/if}
		</section>

		<!-- Available Problems -->
		<section class="order-2" aria-label="Available problems for event selection">
			<h2 class="text-lg font-semibold text-headers mb-3">
				Available Problems ({totalAvailable})
			</h2>

			<!-- Search and Filter (always visible even when no results) -->
			<div class="space-y-2 mb-3">
				<SearchBar
					value={searchQuery}
					placeholder="Search problems..."
					onSearch={handleSearch}
				/>
				<ListFilterBar
					filters={problemTypeFilters}
					values={filterValues}
					onFilterChange={handleFilterChange}
					showClearAll={true}
					onClearAll={() => {
						filterValues = { problemType: '' };
						fetchAvailableProblems({
							search: searchQuery,
							problemType: '',
							limit: 20,
							offset: 0
						});
					}}
				/>
			</div>

			{#if displayedProblems.length === 0 && totalAvailable === 0}
				<Card padding="md" class="text-center text-meta py-8 border-dashed">
					<FileText class="w-8 h-8 text-secondary mx-auto mb-2" />
					{#if searchQuery || filterValues.problemType}
						<p>No problems match your search or filter.</p>
						<p class="text-sm mt-2">
							Try a different search term or clear the filters.
						</p>
					{:else}
						<p>No ready problems available.</p>
						<p class="text-sm mt-2">
							Problems must pass the quality gate before they can be selected for events.
						</p>
					{/if}
				</Card>
			{:else}
				<!-- Problem list with checkboxes -->
				<Card elevation="resting" padding="none">
					<ul class="divide-y divide-secondary">
						{#each displayedProblems as problem (problem.problem_id)}
							{@const isSelected = selectedIds.has(problem.problem_id)}
							{@const isAdding = addingIds.has(problem.problem_id)}
							<li
								class="p-3 hover:bg-canvas/50 transition-colors {isAdding ? 'opacity-50' : ''}"
							>
								<label class="flex items-center gap-3 cursor-pointer">
									<input
										type="checkbox"
										checked={isSelected}
										disabled={isAdding}
										onchange={() => toggleSelection(problem.problem_id)}
										class="w-5 h-5 rounded border-secondary text-primary focus:ring-primary/30
											   flex-shrink-0"
									/>
									<div class="flex-1 min-w-0">
										<div class="flex items-start justify-between gap-2">
											<div class="min-w-0">
												<span class="font-medium text-headers block truncate">
													{problem.title}
												</span>
												<span class="text-sm text-labels">{problem.owner_display_name}</span>
											</div>
											<div class="flex gap-1 flex-shrink-0">
												<Badge variant="ready">Ready</Badge>
												{#if problem.problem_type}
													<Badge variant="outline">{problem.problem_type}</Badge>
												{/if}
											</div>
										</div>
									</div>
								</label>
							</li>
						{/each}
					</ul>
				</Card>

				<!-- Load More button -->
				{#if displayedProblems.length < totalAvailable}
					<div class="mt-3">
						<Button
							variant="outline"
							class="w-full"
							onclick={loadMore}
							disabled={loadingMore}
						>
							{#if loadingMore}Loading...{:else}
								Load 20 more (showing {displayedProblems.length} of {totalAvailable})
							{/if}
						</Button>
					</div>
				{/if}

				<!-- Add selected button -->
				{#if selectedIds.size > 0}
					<div class="mt-3">
						<Button
							variant="default"
							class="w-full"
							onclick={addSelectedToQueue}
							disabled={addingIds.size > 0}
						>
							<Plus class="w-4 h-4 mr-1" />
							Add {selectedIds.size} Selected to Queue
							<ArrowRight class="w-4 h-4 ml-1" />
						</Button>
					</div>
				{/if}
			{/if}
		</section>
	</div>
</PageContainer>

<!-- Confirm Remove Dialog -->
<ConfirmDialog
	bind:open={confirmOpen}
	title="Remove from Event Queue?"
	message="'{confirmProblemTitle}' will be returned to the backlog. This records a deselected_for_event decision."
	confirmLabel="Remove"
	variant="danger"
	onConfirm={removeFromQueue}
	onCancel={() => {
		confirmOpen = false;
		confirmProblemId = null;
	}}
/>
