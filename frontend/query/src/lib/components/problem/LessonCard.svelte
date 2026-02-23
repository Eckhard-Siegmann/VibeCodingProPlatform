<script lang="ts">
	/**
	 * LessonCard - Individual lesson learned display.
	 *
	 * Per Ch.13.1 and problem_card_design.md:
	 * - Category badge with date and author
	 * - Content text
	 * - Tags with # prefix
	 * - Valuable flag toggle (for PO and moderators)
	 */
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';
	import { Badge } from '$lib/components/ui/badge';
	import Star from '@lucide/svelte/icons/star';

	export type LessonCategory =
		| 'tooling'
		| 'architecture'
		| 'process'
		| 'gotcha'
		| 'performance'
		| 'testing';

	export interface Lesson {
		lessonId: string;
		category: LessonCategory;
		content: string;
		tags: string[];
		authorName: string;
		authorId: string;
		eventName?: string;
		createdAt: string;
		valuable: boolean;
	}

	interface Props extends HTMLAttributes<HTMLDivElement> {
		lesson: Lesson;
		canFlagValuable?: boolean;
		canEdit?: boolean;
		onFlagValuable?: (lessonId: string) => void;
		onEdit?: (lessonId: string) => void;
		class?: string;
	}

	let {
		lesson,
		canFlagValuable = false,
		canEdit = false,
		onFlagValuable,
		onEdit,
		class: className,
		...restProps
	}: Props = $props();

	// Category to display label and color
	const categoryConfig: Record<LessonCategory, { label: string; color: string }> = {
		tooling: { label: 'Tooling', color: 'bg-primary/10 text-primary' },
		architecture: { label: 'Architecture', color: 'bg-purple-bg text-purple' },
		process: { label: 'Process', color: 'bg-success/10 text-success' },
		gotcha: { label: 'Gotcha', color: 'bg-alert/10 text-alert' },
		performance: { label: 'Performance', color: 'bg-warning-bg text-warning' },
		testing: { label: 'Testing', color: 'bg-cyan-100 text-cyan-700' }
	};

	const config = $derived(
		categoryConfig[lesson.category] ?? { label: 'Other', color: 'bg-canvas text-labels' }
	);

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function handleFlagClick() {
		onFlagValuable?.(lesson.lessonId);
	}

	function handleEditClick() {
		onEdit?.(lesson.lessonId);
	}
</script>

<div
	class={cn(
		'p-4 bg-card rounded-[var(--radius-card)] border border-secondary shadow-[var(--shadow-sm)]',
		lesson.valuable && 'ring-1 ring-pending/30',
		className
	)}
	{...restProps}
>
	<!-- Header row: Category badge, date, author -->
	<div class="flex flex-wrap items-center gap-2 mb-2">
		<span
			class={cn(
				'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
				config.color
			)}
		>
			{config.label}
		</span>
		<span class="text-xs text-meta">
			{formatDate(lesson.createdAt)}
		</span>
		<span class="text-xs text-meta">&#8226;</span>
		<span class="text-xs text-headers font-medium">{lesson.authorName}</span>
		{#if lesson.eventName}
			<span class="text-xs text-meta">@ {lesson.eventName}</span>
		{/if}
	</div>

	<!-- Content -->
	<p class="text-sm text-headers leading-relaxed mb-3">{lesson.content}</p>

	<!-- Footer row: Tags and valuable flag -->
	<div class="flex flex-wrap items-center justify-between gap-2">
		<!-- Tags -->
		{#if lesson.tags.length > 0}
			<div class="flex flex-wrap gap-1">
				{#each lesson.tags as tag}
					<span class="text-xs text-meta">#{tag}</span>
				{/each}
			</div>
		{:else}
			<div></div>
		{/if}

		<!-- Actions -->
		<div class="flex items-center gap-2">
			{#if canEdit}
				<button
					type="button"
					onclick={handleEditClick}
					class="text-xs text-primary hover:underline"
				>
					Edit
				</button>
			{/if}

			{#if canFlagValuable}
				<button
					type="button"
					onclick={handleFlagClick}
					class={cn(
						'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors',
						lesson.valuable
							? 'bg-pending/20 text-pending'
							: 'bg-canvas text-meta hover:bg-pending/10 hover:text-pending'
					)}
					title={lesson.valuable ? 'Remove valuable flag' : 'Flag as valuable'}
				>
					<Star class={cn('w-3 h-3', lesson.valuable && 'fill-current')} />
					Valuable
				</button>
			{:else if lesson.valuable}
				<span
					class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-pending/20 text-pending"
				>
					<Star class="w-3 h-3 fill-current" />
					Valuable
				</span>
			{/if}
		</div>
	</div>
</div>
