<!--
  Problem Backlog Page
  Ticket: TICKET-29 | Spec: Ch.12.8, Ch.12.10 | Design: pagedesign/problem_backlog_design.md

  Community-wide problem discovery with filtering, search, sorting, and pagination.
  Moderators see additional filter options (draft, rejected, dropped).
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { PageContainer, Card, Badge, Button } from '$lib';
	import type { BadgeVariant } from '$lib/components/ui/badge/badge.svelte';
	import SearchBar from '$lib/components/ui/SearchBar.svelte';
	import ListFilterBar from '$lib/components/ui/ListFilterBar.svelte';
	import Pagination from '$lib/components/ui/Pagination.svelte';
	import type { FilterConfig } from '$lib/components/ui/ListFilterBar.svelte';

	let { data } = $props();

	// Initialize local filter state from server data
	let searchValue = $state(data.filters.search);

	// Build filter configuration
	const baseReadinessOptions = [
		{ value: 'all', label: 'All Readiness' },
		{ value: 'submitted', label: 'Submitted' },
		{ value: 'needs_changes', label: 'Needs Changes' },
		{ value: 'ready', label: 'Ready' }
	];

	const moderatorReadinessOptions = [
		...baseReadinessOptions,
		{ value: '', label: '', separator: true },
		{ value: 'draft', label: 'Draft' },
		{ value: 'rejected', label: 'Rejected' }
	];

	const baseActionOptions = [
		{ value: 'all', label: 'All Actions' },
		{ value: 'backlog', label: 'Backlog' },
		{ value: 'selected_for_event', label: 'Selected for Event' },
		{ value: 'selected_for_coding', label: 'Selected for Coding' },
		{ value: 'deferred', label: 'Deferred' },
		{ value: 'closed', label: 'Closed' }
	];

	const moderatorActionOptions = [
		...baseActionOptions,
		{ value: '', label: '', separator: true },
		{ value: 'dropped', label: 'Dropped' }
	];

	const filterConfig: FilterConfig[] = $derived([
		{
			key: 'readiness',
			label: 'Readiness',
			options: data.isModerator ? moderatorReadinessOptions : baseReadinessOptions,
			defaultValue: 'all'
		},
		{
			key: 'action',
			label: 'Action State',
			options: data.isModerator ? moderatorActionOptions : baseActionOptions,
			defaultValue: 'all'
		},
		{
			key: 'type',
			label: 'Problem Type',
			options: [
				{ value: 'all', label: 'All Types' },
				...data.problemTypes
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
				{ value: 'newest', label: 'Newest First' },
				{ value: 'oldest', label: 'Oldest First' },
				{ value: 'most_reviewed', label: 'Most Reviewed' },
				{ value: 'alpha', label: 'Alphabetical' }
			],
			defaultValue: 'newest'
		}
	]);

	// URL state management
	function updateUrl(params: Record<string, string>, pushState = false) {
		const url = new URL($page.url);

		// Apply all params
		for (const [key, value] of Object.entries(params)) {
			if (value && value !== 'all' && value !== 'newest' && value !== '1') {
				url.searchParams.set(key, value);
			} else {
				url.searchParams.delete(key);
			}
		}

		goto(url.pathname + url.search, {
			replaceState: !pushState,
			keepFocus: true,
			noScroll: true
		});
	}

	function handleSearch(query: string) {
		updateUrl({ search: query, page: '1' });
	}

	function handleFilterChange(key: string, value: string) {
		updateUrl({ [key]: value, page: '1' });
	}

	function handleClearAll() {
		searchValue = '';
		goto('/problems', { replaceState: true });
	}

	function handlePageChange(newPage: number) {
		updateUrl({ page: String(newPage) }, true);
		// Scroll to top of list
		document.querySelector('[data-problem-list]')?.scrollIntoView({ behavior: 'smooth' });
	}

	// Format state labels
	function formatState(state: string): string {
		return state.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
	}

	// Results count text
	const startItem = $derived((data.pagination.page - 1) * data.pagination.pageSize + 1);
	const endItem = $derived(Math.min(data.pagination.page * data.pagination.pageSize, data.pagination.totalItems));

	const hasActiveFilters = $derived(
		data.filters.readiness !== 'all' ||
		data.filters.action !== 'all' ||
		data.filters.type !== 'all' ||
		data.filters.location !== 'all' ||
		data.filters.sort !== 'newest' ||
		data.filters.search !== '' ||
		data.filters.owner === 'me'
	);

	const hasAnyProblems = $derived(data.pagination.totalItems > 0 || hasActiveFilters);
</script>

<svelte:head>
	<title>Problems | VibeCoding</title>
</svelte:head>

<PageContainer>
	<main aria-label="Problem Backlog">
		<!-- Page header with search -->
		<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
			<h1 class="text-2xl font-bold text-headers">
				{data.filters.owner === 'me' ? 'My Problems' : 'Problems'}
			</h1>
			<SearchBar
				bind:value={searchValue}
				placeholder="Search problems…"
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
			class="mb-4 overflow-x-auto md:overflow-visible flex-nowrap md:flex-wrap"
		/>

		<!-- Results count -->
		{#if data.problems.length > 0}
			<p class="text-sm text-labels mb-4" aria-live="polite">
				{#if data.filters.search}
					{data.pagination.totalItems} problem{data.pagination.totalItems !== 1 ? 's' : ''} matching "{data.filters.search}"
				{:else}
					Showing {startItem}–{endItem} of {data.pagination.totalItems} problem{data.pagination.totalItems !== 1 ? 's' : ''}
				{/if}
			</p>
		{/if}

		<!-- Problem list -->
		<div data-problem-list>
			{#if data.problems.length > 0}
				<ul role="list" class="space-y-3">
					{#each data.problems as problem (problem.problem_id)}
						<li role="listitem">
							<a
								href="/problem/{problem.slug}"
								class="block no-underline group"
							>
								<Card elevation="resting" class="p-4 md:p-5 transition-shadow hover:shadow-md cursor-pointer">
									<!-- Classification badge -->
									{#if problem.problem_type}
										<Badge variant="secondary" class="mb-2 capitalize">
											{formatState(problem.problem_type)}
										</Badge>
									{/if}

									<!-- Title -->
									<h2 class="text-lg font-semibold text-headers group-hover:text-primary transition-colors">
										{problem.title}
									</h2>

									<!-- Owner -->
									<p class="text-sm text-labels">{problem.owner_display_name}</p>

									<!-- State badges -->
									<div class="flex items-center gap-2 mt-1">
										<Badge variant={problem.readiness_state as BadgeVariant}>
											{formatState(problem.readiness_state)}
										</Badge>
										<Badge variant={problem.action_state as BadgeVariant}>
											{formatState(problem.action_state)}
										</Badge>
									</div>

									<!-- Description excerpt -->
									{#if problem.short_description}
										<p class="text-sm text-body line-clamp-2 mt-2">
											{problem.short_description}{problem.short_description.length >= 120 ? '…' : ''}
										</p>
									{/if}

									<!-- Metadata row -->
									<div class="flex items-center flex-wrap gap-3 text-xs text-labels mt-3">
										{#if problem.star_count > 0}
											<span>{'⭐'.repeat(Math.min(problem.star_count, 3))}</span>
										{/if}
										{#if problem.review_count > 0}
											<span>{problem.review_count} review{problem.review_count !== 1 ? 's' : ''}</span>
										{/if}
										<span>v{problem.current_version}</span>
										{#if problem.event_title}
											<span class="bg-canvas px-2 py-0.5 rounded-full">
												{problem.event_title}
											</span>
										{/if}
									</div>
								</Card>
							</a>
						</li>
					{/each}
				</ul>
			{:else if hasAnyProblems}
				<!-- No results matching filters -->
				<div class="text-center py-16" role="status">
					<p class="text-4xl mb-4">📋</p>
					<p class="text-labels">No problems match your current filters.</p>
					<p class="text-labels mt-1">
						Try adjusting your search or filters, or
						<button
							type="button"
							class="text-primary underline"
							onclick={handleClearAll}
						>clear all filters</button>.
					</p>
				</div>
			{:else}
				<!-- No problems exist -->
				<div class="text-center py-16" role="status">
					<p class="text-4xl mb-4">📋</p>
					<p class="text-labels">No problems have been submitted yet.</p>
					<p class="text-labels mt-1">Be the first to create one!</p>
					<div class="mt-4">
						<Button onclick={() => goto('/problem/new')}>
							Create New Problem
						</Button>
					</div>
				</div>
			{/if}
		</div>

		<!-- Pagination -->
		<Pagination
			page={data.pagination.page}
			pageSize={data.pagination.pageSize}
			totalItems={data.pagination.totalItems}
			totalPages={data.pagination.totalPages}
			onPageChange={handlePageChange}
		/>
	</main>
</PageContainer>
