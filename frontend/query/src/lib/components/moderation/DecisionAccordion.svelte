<script lang="ts">
	import { cn } from '$lib/utils';
	import { Button } from '$lib/components/ui/button';
	import { AccordionSection } from '$lib/components/ui/accordion-section';
	import Shield from '@lucide/svelte/icons/shield';
	import Calendar from '@lucide/svelte/icons/calendar';
	import Code from '@lucide/svelte/icons/code';
	import Clock from '@lucide/svelte/icons/clock';
	import Trash from '@lucide/svelte/icons/trash-2';
	import CheckCircle from '@lucide/svelte/icons/check-circle';
	import Play from '@lucide/svelte/icons/play';

	export interface DecisionType {
		decision_type: string;
		label: string;
		description?: string;
		requiresComment?: boolean;
	}

	export interface DecisionCategory {
		key: string;
		label: string;
		color: 'blue' | 'green' | 'purple' | 'yellow' | 'red' | 'orange';
		decisions: DecisionType[];
	}

	interface Props {
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
		class: className
	}: Props = $props();

	// Track which accordion is open (only one at a time)
	let openCategory = $state<string | null>(null);

	// Comment input for decisions that require it
	let commentText = $state('');
	let pendingDecision = $state<string | null>(null);

	// Decision categories per Ch.17.8.3 and Ch.26.12.3
	const categories: DecisionCategory[] = [
		{
			key: 'quality_gate',
			label: 'Quality Gate',
			color: 'blue',
			decisions: [
				{ decision_type: 'accepted', label: 'Accept', description: 'Problem meets criteria' },
				{
					decision_type: 'needs_changes',
					label: 'Request Changes',
					description: 'Needs refinement',
					requiresComment: true
				},
				{
					decision_type: 'rejected',
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
			decisions: [
				{ decision_type: 'selected_for_event', label: 'Select for Event', description: 'Add to event agenda' },
				{ decision_type: 'deselected_from_event', label: 'Deselect from Event', description: 'Remove from event' }
			]
		},
		{
			key: 'sprint',
			label: 'Sprint Planning',
			color: 'purple',
			decisions: [
				{ decision_type: 'selected_for_coding', label: 'Select for Coding', description: 'Start sprint' },
				{ decision_type: 'deselected_from_coding', label: 'Deselect from Coding', description: 'Cancel sprint' }
			]
		},
		{
			key: 'deferral',
			label: 'Deferral',
			color: 'yellow',
			decisions: [
				{ decision_type: 'deferred_po_absent', label: 'PO Absent', description: 'Problem owner not present' },
				{ decision_type: 'deferred_low_priority', label: 'Low Priority', description: 'Other problems take precedence' },
				{ decision_type: 'deferred_skipped', label: 'Skipped', description: 'Skipped during event' },
				{ decision_type: 'deferred_too_complex', label: 'Too Complex', description: 'Needs simpler scope', requiresComment: true },
				{ decision_type: 'deferred_needs_refinement', label: 'Needs Refinement', description: 'Acceptance criteria unclear', requiresComment: true },
				{ decision_type: 'deferred_future_capability', label: 'Future Capability', description: 'Requires features not yet available' }
			]
		},
		{
			key: 'drop',
			label: 'Drop',
			color: 'red',
			decisions: [
				{ decision_type: 'dropped_low_relevance', label: 'Low Relevance', description: 'No longer relevant' },
				{ decision_type: 'dropped_low_quality', label: 'Low Quality', description: 'Quality issues', requiresComment: true }
			]
		},
		{
			key: 'close',
			label: 'Close',
			color: 'purple',
			decisions: [
				{ decision_type: 'closed_complete', label: 'Complete', description: 'Fully completed' },
				{ decision_type: 'closed_partial', label: 'Partial', description: 'Partially completed', requiresComment: true }
			]
		},
		{
			key: 'live',
			label: 'Live Assessments',
			color: 'orange',
			decisions: [
				{ decision_type: 'pitch_opened', label: 'Open Pitch', description: 'Start pitch voting' },
				{ decision_type: 'pitch_closed', label: 'Close Pitch', description: 'End pitch voting' },
				{ decision_type: 'review_opened', label: 'Open Review', description: 'Start review voting' },
				{ decision_type: 'review_closed', label: 'Close Review', description: 'End review voting' }
			]
		}
	];

	// Color mapping for category headers and buttons
	const colorMap: Record<string, { header: string; button: string; text: string }> = {
		blue: {
			header: 'bg-primary/10',
			button: 'bg-primary hover:bg-primary-hover text-white',
			text: 'text-primary'
		},
		green: {
			header: 'bg-success/10',
			button: 'bg-success hover:bg-success/90 text-white',
			text: 'text-success'
		},
		purple: {
			header: 'bg-purple-bg',
			button: 'bg-purple hover:bg-purple/90 text-white',
			text: 'text-purple'
		},
		yellow: {
			header: 'bg-pending/10',
			button: 'bg-pending hover:bg-pending/90 text-white',
			text: 'text-pending'
		},
		red: {
			header: 'bg-alert/10',
			button: 'bg-alert hover:bg-alert/90 text-white',
			text: 'text-alert'
		},
		orange: {
			header: 'bg-warning-bg',
			button: 'bg-warning hover:bg-warning/90 text-white',
			text: 'text-warning'
		}
	};

	// Category icons
	const categoryIcons: Record<string, typeof Shield> = {
		quality_gate: Shield,
		event_planning: Calendar,
		sprint: Code,
		deferral: Clock,
		drop: Trash,
		close: CheckCircle,
		live: Play
	};

	// Check if a decision is available based on current state
	function isDecisionAvailable(decision: DecisionType): boolean {
		// This is a simplified check - in production, use the decision_state_effects table
		switch (decision.decision_type) {
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
				// Deferral, drop, close decisions
				return currentActionState !== 'closed' && currentActionState !== 'dropped';
		}
	}

	// Handle accordion toggle
	function handleAccordionToggle(categoryKey: string, isOpen: boolean) {
		openCategory = isOpen ? categoryKey : null;
	}

	// Handle decision click
	function handleDecisionClick(decision: DecisionType) {
		if (decision.requiresComment) {
			pendingDecision = decision.decision_type;
			commentText = '';
		} else {
			onDecision(decision.decision_type);
		}
	}

	// Confirm decision with comment
	function confirmDecisionWithComment() {
		if (pendingDecision) {
			onDecision(pendingDecision, commentText.trim() || undefined);
			pendingDecision = null;
			commentText = '';
		}
	}

	// Cancel pending decision
	function cancelPendingDecision() {
		pendingDecision = null;
		commentText = '';
	}
</script>

<div class={cn('space-y-2', className)}>
	<h3 class="text-sm font-medium text-headers mb-3">Moderator Decisions</h3>

	{#each categories as category (category.key)}
		{@const colors = colorMap[category.color]}
		{@const Icon = categoryIcons[category.key]}
		{@const availableCount = category.decisions.filter((d) => isDecisionAvailable(d)).length}

		<div
			class={cn(
				'border rounded-[var(--radius-card)] overflow-hidden',
				openCategory === category.key ? 'border-secondary' : 'border-secondary/50'
			)}
		>
			<!-- Category Header -->
			<button
				type="button"
				onclick={() => handleAccordionToggle(category.key, openCategory !== category.key)}
				class={cn(
					'w-full flex items-center justify-between p-3',
					'transition-colors cursor-pointer',
					colors.header,
					'hover:opacity-90'
				)}
			>
				<div class="flex items-center gap-2">
					<Icon class={cn('w-4 h-4', colors.text)} />
					<span class={cn('font-medium', colors.text)}>{category.label}</span>
					<span class="text-xs px-1.5 py-0.5 rounded-full bg-white/50 text-meta">
						{availableCount}/{category.decisions.length}
					</span>
				</div>
				<svg
					class={cn(
						'w-4 h-4 transition-transform',
						colors.text,
						openCategory === category.key && 'rotate-180'
					)}
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
				</svg>
			</button>

			<!-- Category Content -->
			{#if openCategory === category.key}
				<div class="p-3 bg-card space-y-2">
					{#each category.decisions as decision (decision.decision_type)}
						{@const isAvailable = isDecisionAvailable(decision)}
						{@const isPending = pendingDecision === decision.decision_type}

						{#if isPending}
							<!-- Comment input for decisions that require it -->
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
									<Button
										variant="secondary"
										size="sm"
										onclick={cancelPendingDecision}
									>
										Cancel
									</Button>
									<Button
										variant="default"
										size="sm"
										onclick={confirmDecisionWithComment}
										class={colors.button}
									>
										Confirm
									</Button>
								</div>
							</div>
						{:else}
							<button
								type="button"
								onclick={() => handleDecisionClick(decision)}
								disabled={disabled || !isAvailable}
								class={cn(
									'w-full flex items-center justify-between p-3 min-h-[44px]',
									'rounded-[var(--radius-card)] transition-all',
									'text-left',
									isAvailable
										? cn(colors.button, 'shadow-sm')
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
			Current State: <span class="font-medium text-headers">{currentReadinessState}</span> /
			<span class="font-medium text-headers">{currentActionState}</span>
		</p>
	</div>
</div>
