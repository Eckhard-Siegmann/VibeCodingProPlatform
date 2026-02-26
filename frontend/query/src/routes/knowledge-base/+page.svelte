<script lang="ts">
	/**
	 * Knowledge Base — global searchable view of lessons learned.
	 *
	 * Per Ch.4.2, Ch.12.5, Ch.15.2.4, TICKET-15 and knowledge_base_design.md:
	 * - Text search across all lessons
	 * - Filter by category, event, location, valuable flag
	 * - Moderators can flag lessons as valuable
	 * - Links back to source problem cards
	 */
	import { goto, invalidateAll } from '$app/navigation';
	import { toastError, toastSuccess } from '$lib';
	import { cn } from '$lib/utils';
	import PageContainer from '$lib/components/layout/PageContainer.svelte';
	import LessonCard from '$lib/components/problem/LessonCard.svelte';
	import type { PageData } from './$types';
	import Search from '@lucide/svelte/icons/search';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import Filter from '@lucide/svelte/icons/filter';

	let { data }: { data: PageData } = $props();

	// Local reactive filter state (synced to URL on apply)
	let searchText = $state(data.filters.search ?? '');
	let selectedCategory = $state(data.filters.category ?? '');
	let selectedEvent = $state(data.filters.eventId ?? '');
	let selectedLocation = $state(data.filters.locationId ?? '');
	let valuableOnly = $state(data.filters.valuableOnly);

	// Debounce timer for search
	let searchTimer: ReturnType<typeof setTimeout> | null = null;

	function applyFilters() {
		const params = new URLSearchParams();
		if (searchText.trim()) params.set('q', searchText.trim());
		if (selectedCategory) params.set('category', selectedCategory);
		if (selectedEvent) params.set('event', selectedEvent);
		if (selectedLocation) params.set('location', selectedLocation);
		if (valuableOnly) params.set('valuable', '1');

		const query = params.toString();
		goto(`/knowledge-base${query ? '?' + query : ''}`, { replaceState: false });
	}

	function handleSearchInput() {
		if (searchTimer) clearTimeout(searchTimer);
		searchTimer = setTimeout(() => {
			applyFilters();
		}, 300);
	}

	function handleFilterChange() {
		applyFilters();
	}

	async function handleFlagValuable(lessonId: string, problemId: string) {
		try {
			const response = await fetch(`/api/problems/${problemId}/lessons/${lessonId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ valuable: true })
			});

			if (response.ok) {
				await invalidateAll();
				toastSuccess('Lesson flagged', 'Lesson marked as valuable.');
			} else {
				const err = await response.json();
				toastError('Failed to flag', err.message || 'Unknown error');
			}
		} catch (err: any) {
			toastError('Failed to flag', err.message);
		}
	}

	const categories = [
		{ value: '', label: 'All Categories' },
		{ value: 'tooling', label: 'Tooling' },
		{ value: 'architecture', label: 'Architecture' },
		{ value: 'process', label: 'Process' },
		{ value: 'gotcha', label: 'Gotcha' },
		{ value: 'performance', label: 'Performance' },
		{ value: 'testing', label: 'Testing' }
	];
</script>

<svelte:head>
	<title>Knowledge Base - VibeCoding</title>
</svelte:head>

<PageContainer>
	<!-- Page header -->
	<div class="mb-6">
		<div class="flex items-center gap-3 mb-1">
			<BookOpen class="w-6 h-6 text-primary" />
			<h1 class="text-2xl font-semibold text-headers">Knowledge Base</h1>
		</div>
		<p class="text-sm text-labels ml-9">Lessons learned across the community</p>
	</div>

	<!-- Search input -->
	<div class="relative mb-4">
		<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-meta pointer-events-none" />
		<input
			type="text"
			bind:value={searchText}
			oninput={handleSearchInput}
			placeholder="Search lessons..."
			class={cn(
				'w-full pl-10 pr-4 py-2.5 text-sm bg-card border border-secondary',
				'rounded-[var(--radius-card)] text-headers placeholder:text-meta',
				'focus:outline-none focus:ring-2 focus:ring-primary/50'
			)}
		/>
		{#if searchText}
			<button
				type="button"
				onclick={() => { searchText = ''; applyFilters(); }}
				class="absolute right-3 top-1/2 -translate-y-1/2 text-meta hover:text-headers text-lg leading-none"
				aria-label="Clear search"
			>×</button>
		{/if}
	</div>

	<!-- Filter bar -->
	<div class="flex flex-wrap items-center gap-2 mb-5">
		<Filter class="w-4 h-4 text-meta shrink-0" />

		<!-- Category -->
		<select
			bind:value={selectedCategory}
			onchange={handleFilterChange}
			class={cn(
				'px-2 py-1.5 text-xs rounded-[var(--radius-card)]',
				'border border-secondary bg-card text-headers',
				'focus:outline-none focus:ring-2 focus:ring-primary/50'
			)}
		>
			{#each categories as cat}
				<option value={cat.value}>{cat.label}</option>
			{/each}
		</select>

		<!-- Event -->
		{#if data.eventsWithLessons.length > 0}
			<select
				bind:value={selectedEvent}
				onchange={handleFilterChange}
				class={cn(
					'px-2 py-1.5 text-xs rounded-[var(--radius-card)]',
					'border border-secondary bg-card text-headers',
					'focus:outline-none focus:ring-2 focus:ring-primary/50'
				)}
			>
				<option value="">All Events</option>
				{#each data.eventsWithLessons as event}
					<option value={event.id}>{event.name}</option>
				{/each}
			</select>
		{/if}

		<!-- Location -->
		{#if data.locationsWithLessons.length > 0}
			<select
				bind:value={selectedLocation}
				onchange={handleFilterChange}
				class={cn(
					'px-2 py-1.5 text-xs rounded-[var(--radius-card)]',
					'border border-secondary bg-card text-headers',
					'focus:outline-none focus:ring-2 focus:ring-primary/50'
				)}
			>
				<option value="">All Locations</option>
				{#each data.locationsWithLessons as loc}
					<option value={loc.id}>{loc.name}</option>
				{/each}
			</select>
		{/if}

		<!-- Valuable only -->
		<label class="inline-flex items-center gap-1.5 cursor-pointer">
			<input
				type="checkbox"
				bind:checked={valuableOnly}
				onchange={handleFilterChange}
				class="w-4 h-4 rounded border-secondary text-primary focus:ring-2 focus:ring-primary/50"
			/>
			<span class="text-xs text-labels">Valuable only</span>
		</label>
	</div>

	<!-- Results header -->
	<p class="text-sm text-meta mb-4">
		{data.lessons.length === 0 ? 'No lessons found' : `${data.lessons.length} lesson${data.lessons.length === 1 ? '' : 's'}`}
	</p>

	<!-- Lessons list -->
	{#if data.lessons.length === 0}
		<div class="py-16 text-center">
			<p class="text-4xl mb-4">💡</p>
			<p class="text-sm font-medium text-headers mb-1">No lessons found</p>
			<p class="text-xs text-meta">
				{data.filters.search || data.filters.category || data.filters.eventId || data.filters.locationId || data.filters.valuableOnly
					? 'Try adjusting your filters or search terms.'
					: 'Lessons are captured after working on problems during events.'}
			</p>
		</div>
	{:else}
		<div class="space-y-4">
			{#each data.lessons as lesson (lesson.lessonId)}
				<div class="space-y-1">
					<!-- Lesson card -->
					<LessonCard
						lesson={{
							lessonId: lesson.lessonId,
							category: lesson.category ?? 'tooling',
							content: lesson.content,
							tags: lesson.tags,
							authorName: lesson.authorName,
							authorId: lesson.authorId,
							eventName: lesson.eventName,
							createdAt: lesson.createdAt,
							valuable: lesson.valuable
						}}
						canFlagValuable={data.canFlagValuable}
						canEdit={false}
						onFlagValuable={() => handleFlagValuable(lesson.lessonId, lesson.problemId)}
					/>

					<!-- Problem link -->
					<div class="px-1">
						<a
							href="/problem/{lesson.problemSlug}"
							class="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
						>
							<span>→</span>
							<span>{lesson.problemTitle}</span>
							<span class="text-meta">(v{lesson.majorVersion})</span>
							{#if lesson.locationName}
								<span class="text-meta">· {lesson.locationName}</span>
							{/if}
						</a>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</PageContainer>
