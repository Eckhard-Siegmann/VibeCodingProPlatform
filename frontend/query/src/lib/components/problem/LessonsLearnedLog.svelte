<script lang="ts">
	/**
	 * LessonsLearnedLog - Lessons panel with category/event filters.
	 *
	 * Per Ch.13.1 and problem_card_design.md:
	 * - Add Lesson button (authenticated users)
	 * - Category dropdown filter
	 * - Event dropdown filter
	 * - Valuable only toggle
	 * - Scrollable list of LessonCards
	 */
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardHeader, CardTitle } from '$lib/components/ui/card';
	import LessonCard, { type Lesson, type LessonCategory } from './LessonCard.svelte';
	import Plus from '@lucide/svelte/icons/plus';
	import Filter from '@lucide/svelte/icons/filter';

	interface Event {
		eventId: string;
		name: string;
	}

	interface Props extends HTMLAttributes<HTMLDivElement> {
		lessons: Lesson[];
		events?: Event[];
		canAddLesson?: boolean;
		canFlagValuable?: boolean;
		currentUserId?: string;
		onAddLesson?: () => void;
		onFlagValuable?: (lessonId: string) => void;
		onEditLesson?: (lessonId: string) => void;
		class?: string;
	}

	let {
		lessons,
		events = [],
		canAddLesson = true,
		canFlagValuable = false,
		currentUserId,
		onAddLesson,
		onFlagValuable,
		onEditLesson,
		class: className,
		...restProps
	}: Props = $props();

	// Filter state
	let selectedCategory = $state<LessonCategory | 'all'>('all');
	let selectedEventId = $state<string | 'all'>('all');
	let valuableOnly = $state(false);

	// All available categories
	const categories: { value: LessonCategory | 'all'; label: string }[] = [
		{ value: 'all', label: 'All Categories' },
		{ value: 'tooling', label: 'Tooling' },
		{ value: 'architecture', label: 'Architecture' },
		{ value: 'process', label: 'Process' },
		{ value: 'gotcha', label: 'Gotcha' },
		{ value: 'performance', label: 'Performance' },
		{ value: 'testing', label: 'Testing' }
	];

	// Filter lessons based on selections
	const filteredLessons = $derived.by(() => {
		let result = lessons;

		// Apply category filter
		if (selectedCategory !== 'all') {
			result = result.filter((l) => l.category === selectedCategory);
		}

		// Apply event filter
		if (selectedEventId !== 'all') {
			result = result.filter((l) => {
				// Match by event name if eventId not available
				const matchingEvent = events.find((e) => e.eventId === selectedEventId);
				return matchingEvent && l.eventName === matchingEvent.name;
			});
		}

		// Apply valuable filter
		if (valuableOnly) {
			result = result.filter((l) => l.valuable);
		}

		return result;
	});

	// Check if current user is author of a lesson
	function canEditLesson(lesson: Lesson): boolean {
		return Boolean(currentUserId && lesson.authorId === currentUserId);
	}
</script>

<Card elevation="resting" class={className} {...restProps}>
	<CardHeader class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
		<CardTitle>Lessons Learned</CardTitle>
		{#if canAddLesson}
			<Button variant="default" size="sm" onclick={onAddLesson}>
				<Plus class="w-4 h-4 mr-1" />
				Add Lesson
			</Button>
		{/if}
	</CardHeader>

	<!-- Filters -->
	<div class="px-4 md:px-5 pb-3 flex flex-wrap items-center gap-2">
		<Filter class="w-4 h-4 text-meta shrink-0" />

		<!-- Category filter -->
		<select
			class={cn(
				'px-2 py-1 text-xs rounded-[var(--radius-card)]',
				'border border-secondary bg-card text-headers',
				'focus:outline-none focus:ring-2 focus:ring-primary/50'
			)}
			bind:value={selectedCategory}
		>
			{#each categories as cat}
				<option value={cat.value}>{cat.label}</option>
			{/each}
		</select>

		<!-- Event filter -->
		{#if events.length > 0}
			<select
				class={cn(
					'px-2 py-1 text-xs rounded-[var(--radius-card)]',
					'border border-secondary bg-card text-headers',
					'focus:outline-none focus:ring-2 focus:ring-primary/50'
				)}
				bind:value={selectedEventId}
			>
				<option value="all">All Events</option>
				{#each events as event}
					<option value={event.eventId}>{event.name}</option>
				{/each}
			</select>
		{/if}

		<!-- Valuable only checkbox -->
		<label class="inline-flex items-center gap-1.5 cursor-pointer">
			<input
				type="checkbox"
				class={cn(
					'w-4 h-4 rounded border-secondary text-primary',
					'focus:ring-2 focus:ring-primary/50'
				)}
				bind:checked={valuableOnly}
			/>
			<span class="text-xs text-labels">Valuable only</span>
		</label>
	</div>

	<!-- Lessons list -->
	<div class="px-4 md:px-5 pb-4 md:pb-5 space-y-3 max-h-[500px] overflow-y-auto">
		{#if filteredLessons.length === 0}
			<div class="py-8 text-center">
				<p class="text-sm text-meta">
					{#if lessons.length === 0}
						No lessons yet. After working on a problem, capture what you learned.
					{:else}
						No lessons match the current filters.
					{/if}
				</p>
			</div>
		{:else}
			{#each filteredLessons as lesson (lesson.lessonId)}
				<LessonCard
					{lesson}
					{canFlagValuable}
					canEdit={canEditLesson(lesson)}
					{onFlagValuable}
					onEdit={onEditLesson}
				/>
			{/each}
		{/if}
	</div>
</Card>
