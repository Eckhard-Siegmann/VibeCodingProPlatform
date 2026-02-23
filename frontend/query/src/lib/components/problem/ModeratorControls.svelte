<script lang="ts">
	/**
	 * ModeratorControls - Decision accordion for moderator actions.
	 *
	 * Per Ch.13.4 and problem_card_design.md:
	 * - Single-click decisions grouped by category
	 * - Color-coded category headers
	 * - Comment input for decisions requiring rationale
	 * - Mobile: Accordion by 7 categories
	 * - Full-width buttons (44px height)
	 *
	 * Re-exports and wraps the DecisionAccordion from moderation folder
	 * with problem-specific context.
	 */
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';
	import { Card, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { AccordionSection } from '$lib/components/ui/accordion-section';
	import { Button } from '$lib/components/ui/button';
	import Shield from '@lucide/svelte/icons/shield';
	import Calendar from '@lucide/svelte/icons/calendar';
	import Code from '@lucide/svelte/icons/code';
	import Clock from '@lucide/svelte/icons/clock';
	import Trash from '@lucide/svelte/icons/trash-2';
	import CheckCircle from '@lucide/svelte/icons/check-circle';
	import Play from '@lucide/svelte/icons/play';

	export interface DecisionType {
		decisionType: string;
		label: string;
		description?: string;
		requiresComment?: boolean;
	}

	export interface DecisionCategory {
		key: string;
		label: string;
		color: 'blue' | 'green' | 'purple' | 'yellow' | 'red' | 'orange';
		icon: typeof Shield;
		decisions: DecisionType[];
	}

	interface Props extends HTMLAttributes<HTMLDivElement> {
		problemId: string;
		currentReadinessState: string;
		currentActionState: string;
		onDecision: (decisionType: string, comment?: string) => void | Promise<void>;
		disabled?: boolean;
		class?: string;
	}

	let {
		problemId,
		currentReadinessState,
		currentActionState,
		onDecision,
		disabled = false,
		class: className,
		...restProps
	}: Props = $props();

	// Track which category accordion is open
	let openCategory = $state<string | null>(null);
	let commentText = $state('');
	let pendingDecision = $state<DecisionType | null>(null);

	// Decision categories with their decisions
	const categories: DecisionCategory[] = [
		{
			key: 'quality_gate',
			label: 'Quality Gate',
			color: 'blue',
			icon: Shield,
			decisions: [
				{ decisionType: 'accepted', label: 'Accept', description: 'Problem meets criteria' },
				{
					decisionType: 'needs_changes',
					label: 'Request Changes',
					description: 'Needs refinement',
					requiresComment: true
				},
				{
					decisionType: 'rejected',
					label: 'Reject',
					description: 'Does not meet criteria',
					requiresComment: true
				}
			]
		},
		{
			key: 'event_planning',
			label: 'Event Planning',
			color: 'green',
			icon: Calendar,
			decisions: [
				{ decisionType: 'selected_for_event', label: 'Select for Event', description: 'Add to agenda' },
				{ decisionType: 'deselected_from_event', label: 'Deselect from Event', description: 'Remove from event' }
			]
		},
		{
			key: 'sprint',
			label: 'Sprint Planning',
			color: 'purple',
			icon: Code,
			decisions: [
				{ decisionType: 'selected_for_coding', label: 'Select for Coding', description: 'Start sprint' },
				{ decisionType: 'deselected_from_coding', label: 'Deselect from Coding', description: 'Cancel sprint' }
			]
		},
		{
			key: 'deferral',
			label: 'Deferral',
			color: 'yellow',
			icon: Clock,
			decisions: [
				{ decisionType: 'deferred_po_absent', label: 'PO Absent' },
				{ decisionType: 'deferred_low_priority', label: 'Low Priority' },
				{ decisionType: 'deferred_skipped', label: 'Skipped' },
				{ decisionType: 'deferred_too_complex', label: 'Too Complex', requiresComment: true },
				{ decisionType: 'deferred_needs_refinement', label: 'Needs Refinement', requiresComment: true },
				{ decisionType: 'deferred_future_capability', label: 'Future Capability' }
			]
		},
		{
			key: 'drop',
			label: 'Drop',
			color: 'red',
			icon: Trash,
			decisions: [
				{ decisionType: 'dropped_low_relevance', label: 'Low Relevance' },
				{ decisionType: 'dropped_low_quality', label: 'Low Quality', requiresComment: true }
			]
		},
		{
			key: 'close',
			label: 'Close',
			color: 'purple',
			icon: CheckCircle,
			decisions: [
				{ decisionType: 'closed_complete', label: 'Complete', description: 'Fully completed' },
				{ decisionType: 'closed_partial', label: 'Partial', description: 'Partially completed', requiresComment: true }
			]
		},
		{
			key: 'live',
			label: 'Live Assessments',
			color: 'orange',
			icon: Play,
			decisions: [
				{ decisionType: 'pitch_opened', label: 'Open Pitch' },
				{ decisionType: 'pitch_closed', label: 'Close Pitch' },
				{ decisionType: 'review_opened', label: 'Open Review' },
				{ decisionType: 'review_closed', label: 'Close Review' }
			]
		}
	];

	// Color mapping for buttons
	const colorMap: Record<string, { bg: string; hover: string; header: string }> = {
		blue: { bg: 'bg-primary', hover: 'hover:bg-primary-hover', header: 'bg-primary/10' },
		green: { bg: 'bg-success', hover: 'hover:bg-success/90', header: 'bg-success/10' },
		purple: { bg: 'bg-purple', hover: 'hover:bg-purple/90', header: 'bg-purple-bg' },
		yellow: { bg: 'bg-pending', hover: 'hover:bg-pending/90', header: 'bg-pending/10' },
		red: { bg: 'bg-alert', hover: 'hover:bg-alert/90', header: 'bg-alert/10' },
		orange: { bg: 'bg-warning', hover: 'hover:bg-warning/90', header: 'bg-warning-bg' }
	};

	// Check if a decision is available based on current state
	function isDecisionAvailable(decision: DecisionType): boolean {
		switch (decision.decisionType) {
			case 'accepted':
			case 'needs_changes':
			case 'rejected':
				return currentReadinessState === 'submitted' || currentReadinessState === 'needs_changes';
			case 'selected_for_event':
				return currentReadinessState === 'ready' && currentActionState === 'backlog';
			case 'deselected_from_event':
				return currentActionState === 'selected_for_event';
			case 'selected_for_coding':
				return currentActionState === 'selected_for_event';
			case 'deselected_from_coding':
				return currentActionState === 'selected_for_coding';
			case 'pitch_opened':
			case 'pitch_closed':
			case 'review_opened':
			case 'review_closed':
				return currentActionState === 'selected_for_event' || currentActionState === 'selected_for_coding';
			default:
				return currentActionState !== 'closed' && currentActionState !== 'dropped';
		}
	}

	// Count available decisions in a category
	function getAvailableCount(category: DecisionCategory): number {
		return category.decisions.filter((d) => isDecisionAvailable(d)).length;
	}

	// Handle decision click
	function handleDecisionClick(decision: DecisionType) {
		if (decision.requiresComment) {
			pendingDecision = decision;
			commentText = '';
		} else {
			onDecision(decision.decisionType);
		}
	}

	// Confirm decision with comment
	function confirmWithComment() {
		if (pendingDecision) {
			onDecision(pendingDecision.decisionType, commentText.trim() || undefined);
			pendingDecision = null;
			commentText = '';
		}
	}

	// Cancel pending
	function cancelPending() {
		pendingDecision = null;
		commentText = '';
	}
</script>

<Card elevation="resting" class={className} {...restProps}>
	<CardHeader>
		<CardTitle>Moderator Decisions</CardTitle>
	</CardHeader>

	<div class="px-4 md:px-5 pb-4 md:pb-5 space-y-2">
		{#each categories as category (category.key)}
			{@const colors = colorMap[category.color]}
			{@const Icon = category.icon}
			{@const availableCount = getAvailableCount(category)}

			<div
				class={cn(
					'border rounded-[var(--radius-card)] overflow-hidden',
					openCategory === category.key ? 'border-secondary' : 'border-secondary/50'
				)}
			>
				<!-- Category Header (clickable) -->
				<button
					type="button"
					onclick={() => (openCategory = openCategory === category.key ? null : category.key)}
					class={cn(
						'w-full flex items-center justify-between p-3',
						'transition-colors cursor-pointer',
						colors.header,
						'hover:opacity-90'
					)}
				>
					<div class="flex items-center gap-2">
						<Icon class={cn('w-4 h-4', `text-${category.color === 'yellow' ? 'pending' : category.color}`)} />
						<span class="font-medium text-headers">{category.label}</span>
						<span class="text-xs px-1.5 py-0.5 rounded-full bg-white/50 text-meta">
							{availableCount}/{category.decisions.length}
						</span>
					</div>
					<svg
						class={cn(
							'w-4 h-4 text-meta transition-transform',
							openCategory === category.key && 'rotate-180'
						)}
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
					</svg>
				</button>

				<!-- Category Decisions -->
				{#if openCategory === category.key}
					<div class="p-3 bg-card space-y-2">
						{#each category.decisions as decision (decision.decisionType)}
							{@const isAvailable = isDecisionAvailable(decision)}
							{@const isPending = pendingDecision?.decisionType === decision.decisionType}

							{#if isPending}
								<!-- Comment input mode -->
								<div class="p-3 bg-canvas rounded-[var(--radius-card)] space-y-3">
									<p class="text-sm font-medium text-headers">
										{decision.label}: Add a comment
									</p>
									<textarea
										bind:value={commentText}
										rows={2}
										placeholder="Reason for this decision..."
										class={cn(
											'w-full px-3 py-2',
											'bg-card border-2 border-secondary rounded-[var(--radius-card)]',
											'text-headers placeholder:text-meta resize-y',
											'focus:outline-none focus:border-primary'
										)}
									></textarea>
									<div class="flex gap-2">
										<Button variant="secondary" size="sm" onclick={cancelPending}>
											Cancel
										</Button>
										<Button
											variant="default"
											size="sm"
											onclick={confirmWithComment}
											class={cn(colors.bg, colors.hover, 'text-white')}
										>
											Confirm
										</Button>
									</div>
								</div>
							{:else}
								<!-- Decision button -->
								<button
									type="button"
									onclick={() => handleDecisionClick(decision)}
									disabled={disabled || !isAvailable}
									class={cn(
										'w-full flex items-center justify-between p-3 min-h-[44px]',
										'rounded-[var(--radius-card)] transition-all text-left',
										isAvailable
											? cn(colors.bg, colors.hover, 'text-white shadow-sm')
											: 'bg-canvas text-meta cursor-not-allowed opacity-50'
									)}
								>
									<span class="font-medium">{decision.label}</span>
									{#if decision.description}
										<span class={cn('text-xs', isAvailable ? 'opacity-80' : 'text-meta')}>
											{decision.description}
										</span>
									{/if}
								</button>
							{/if}
						{/each}
					</div>
				{/if}
			</div>
		{/each}

		<!-- Current State Indicator -->
		<div class="mt-4 p-3 bg-canvas rounded-[var(--radius-card)]">
			<p class="text-xs text-meta">
				Current State:
				<span class="font-medium text-headers">{currentReadinessState}</span> /
				<span class="font-medium text-headers">{currentActionState}</span>
			</p>
		</div>
	</div>
</Card>
