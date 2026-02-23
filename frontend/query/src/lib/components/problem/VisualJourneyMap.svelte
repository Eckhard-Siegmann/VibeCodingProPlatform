<script lang="ts">
	/**
	 * VisualJourneyMap - Dual-state progression diagram.
	 *
	 * Per Ch.13.6.1 and problem_card_design.md:
	 * - Shows the problem's path through readiness + action journeys
	 * - Current state highlighted (filled circle)
	 * - Past states shown as passed through
	 * - Future states as outline
	 * - Collapsible on mobile
	 */
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';
	import { AccordionSection } from '$lib/components/ui/accordion-section';

	type ReadinessState = 'draft' | 'submitted' | 'needs_changes' | 'ready' | 'rejected';
	type ActionState =
		| 'backlog'
		| 'selected_for_event'
		| 'selected_for_coding'
		| 'deferred'
		| 'dropped'
		| 'closed';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		currentReadiness: ReadinessState;
		currentAction: ActionState;
		collapsible?: boolean;
		class?: string;
	}

	let {
		currentReadiness,
		currentAction,
		collapsible = true,
		class: className,
		...restProps
	}: Props = $props();

	// Readiness journey states in order
	const readinessJourney: {
		state: ReadinessState;
		label: string;
		mainPath: boolean;
	}[] = [
		{ state: 'draft', label: 'Draft', mainPath: true },
		{ state: 'submitted', label: 'Submitted', mainPath: true },
		{ state: 'needs_changes', label: 'Changes', mainPath: false },
		{ state: 'ready', label: 'Ready', mainPath: true },
		{ state: 'rejected', label: 'Rejected', mainPath: false }
	];

	// Action journey states in order
	const actionJourney: {
		state: ActionState;
		label: string;
		mainPath: boolean;
	}[] = [
		{ state: 'backlog', label: 'Backlog', mainPath: true },
		{ state: 'selected_for_event', label: 'Selected', mainPath: true },
		{ state: 'selected_for_coding', label: 'Coding', mainPath: true },
		{ state: 'closed', label: 'Closed', mainPath: true },
		{ state: 'deferred', label: 'Deferred', mainPath: false },
		{ state: 'dropped', label: 'Dropped', mainPath: false }
	];

	// Determine state status (past, current, future)
	function getReadinessStatus(
		state: ReadinessState
	): 'past' | 'current' | 'future' {
		const mainPathOrder: ReadinessState[] = ['draft', 'submitted', 'ready'];
		const currentIndex = mainPathOrder.indexOf(currentReadiness);
		const stateIndex = mainPathOrder.indexOf(state);

		if (state === currentReadiness) return 'current';

		// Special cases for non-main-path states
		if (state === 'needs_changes') {
			return currentReadiness === 'needs_changes' ? 'current' : 'future';
		}
		if (state === 'rejected') {
			return currentReadiness === 'rejected' ? 'current' : 'future';
		}

		if (currentIndex === -1 || stateIndex === -1) return 'future';
		return stateIndex < currentIndex ? 'past' : 'future';
	}

	function getActionStatus(state: ActionState): 'past' | 'current' | 'future' {
		const mainPathOrder: ActionState[] = [
			'backlog',
			'selected_for_event',
			'selected_for_coding',
			'closed'
		];
		const currentIndex = mainPathOrder.indexOf(currentAction);
		const stateIndex = mainPathOrder.indexOf(state);

		if (state === currentAction) return 'current';

		// Special cases for non-main-path states
		if (state === 'deferred') {
			return currentAction === 'deferred' ? 'current' : 'future';
		}
		if (state === 'dropped') {
			return currentAction === 'dropped' ? 'current' : 'future';
		}

		if (currentIndex === -1 || stateIndex === -1) return 'future';
		return stateIndex < currentIndex ? 'past' : 'future';
	}

	// Status to visual mapping
	function getStatusClasses(status: 'past' | 'current' | 'future'): string {
		switch (status) {
			case 'current':
				return 'bg-primary text-white border-primary';
			case 'past':
				return 'bg-success/20 text-success border-success';
			case 'future':
				return 'bg-transparent text-meta border-secondary';
		}
	}

	function getCircleClasses(status: 'past' | 'current' | 'future'): string {
		switch (status) {
			case 'current':
				return 'bg-primary border-primary';
			case 'past':
				return 'bg-success border-success';
			case 'future':
				return 'bg-transparent border-secondary';
		}
	}
</script>

{#snippet journeyContent()}
	<div class="space-y-4">
		<!-- Readiness Journey -->
		<div>
			<p class="text-xs font-medium text-labels mb-2 uppercase tracking-wide">
				Readiness Journey
			</p>
			<div class="flex flex-wrap items-center gap-1">
				{#each readinessJourney.filter((s) => s.mainPath) as step, index}
					{@const status = getReadinessStatus(step.state)}
					{#if index > 0}
						<span class="text-meta text-xs px-1">→</span>
					{/if}
					<div
						class={cn(
							'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border',
							getStatusClasses(status)
						)}
					>
						<span
							class={cn(
								'w-2 h-2 rounded-full border',
								getCircleClasses(status)
							)}
						></span>
						{step.label}
					</div>
				{/each}
			</div>
			<!-- Non-main-path states shown below -->
			<div class="flex flex-wrap items-center gap-2 mt-1 ml-6">
				{#each readinessJourney.filter((s) => !s.mainPath) as step}
					{@const status = getReadinessStatus(step.state)}
					<div class="flex items-center gap-1 text-xs text-meta">
						<span>↘</span>
						<div
							class={cn(
								'inline-flex items-center gap-1 px-2 py-0.5 rounded-full border',
								getStatusClasses(status)
							)}
						>
							<span
								class={cn(
									'w-2 h-2 rounded-full border',
									getCircleClasses(status)
								)}
							></span>
							{step.label}
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Action Journey -->
		<div>
			<p class="text-xs font-medium text-labels mb-2 uppercase tracking-wide">
				Action Journey
			</p>
			<div class="flex flex-wrap items-center gap-1">
				{#each actionJourney.filter((s) => s.mainPath) as step, index}
					{@const status = getActionStatus(step.state)}
					{#if index > 0}
						<span class="text-meta text-xs px-1">→</span>
					{/if}
					<div
						class={cn(
							'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border',
							getStatusClasses(status)
						)}
					>
						<span
							class={cn(
								'w-2 h-2 rounded-full border',
								getCircleClasses(status)
							)}
						></span>
						{step.label}
					</div>
				{/each}
			</div>
			<!-- Non-main-path states shown below -->
			<div class="flex flex-wrap items-center gap-2 mt-1 ml-6">
				{#each actionJourney.filter((s) => !s.mainPath) as step}
					{@const status = getActionStatus(step.state)}
					<div class="flex items-center gap-1 text-xs text-meta">
						<span>↘</span>
						<div
							class={cn(
								'inline-flex items-center gap-1 px-2 py-0.5 rounded-full border',
								getStatusClasses(status)
							)}
						>
							<span
								class={cn(
									'w-2 h-2 rounded-full border',
									getCircleClasses(status)
								)}
							></span>
							{step.label}
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
{/snippet}

<div class={cn('', className)} {...restProps}>
	{#if collapsible}
		<!-- Mobile: Collapsible -->
		<div class="md:hidden">
			<AccordionSection title="State Journey" defaultOpen={false}>
				{@render journeyContent()}
			</AccordionSection>
		</div>
		<!-- Desktop: Always visible -->
		<div class="hidden md:block p-4 bg-canvas/50 rounded-[var(--radius-card)]">
			{@render journeyContent()}
		</div>
	{:else}
		<div class="p-4 bg-canvas/50 rounded-[var(--radius-card)]">
			{@render journeyContent()}
		</div>
	{/if}
</div>
