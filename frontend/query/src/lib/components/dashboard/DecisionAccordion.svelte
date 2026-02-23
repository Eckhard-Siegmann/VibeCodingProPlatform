<script lang="ts">
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import AccordionSection from '$lib/components/ui/accordion-section/accordion-section.svelte';
	import { cn } from '$lib/utils';
	import {
		CheckCircle,
		XCircle,
		RefreshCw,
		Calendar,
		Code,
		Clock,
		Trash2,
		Archive,
		Zap
	} from '@lucide/svelte';

	// Decision categories per Ch.12.5
	type DecisionCategory =
		| 'quality_gate'
		| 'event_planning'
		| 'sprint_planning'
		| 'deferral'
		| 'drop'
		| 'close'
		| 'live';

	interface DecisionButton {
		key: string;
		label: string;
		variant?: 'default' | 'destructive' | 'secondary';
	}

	interface Props {
		problemId?: string;
		problemTitle?: string;
		onDecision?: (decisionType: string) => void;
		disabled?: boolean;
		class?: string;
	}

	let { problemId, problemTitle, onDecision, disabled = false, class: className }: Props = $props();

	// Category configurations per Ch.12.5
	const categories: Array<{
		key: DecisionCategory;
		label: string;
		headerColor: string;
		icon: typeof CheckCircle;
		buttons: DecisionButton[];
	}> = [
		{
			key: 'quality_gate',
			label: 'Quality Gate',
			headerColor: 'bg-primary/10 text-primary',
			icon: CheckCircle,
			buttons: [
				{ key: 'accepted', label: 'Accept' },
				{ key: 'changes_requested', label: 'Request Changes', variant: 'secondary' },
				{ key: 'rejected', label: 'Reject', variant: 'destructive' }
			]
		},
		{
			key: 'event_planning',
			label: 'Event Planning',
			headerColor: 'bg-success/10 text-success',
			icon: Calendar,
			buttons: [
				{ key: 'selected_for_event', label: 'Select for Event' },
				{ key: 'deselected_for_event', label: 'Deselect for Event', variant: 'secondary' }
			]
		},
		{
			key: 'sprint_planning',
			label: 'Sprint Planning',
			headerColor: 'bg-purple-bg text-purple',
			icon: Code,
			buttons: [
				{ key: 'selected_for_coding', label: 'Select for Coding' },
				{ key: 'deselected_for_coding', label: 'Deselect for Coding', variant: 'secondary' }
			]
		},
		{
			key: 'deferral',
			label: 'Deferral',
			headerColor: 'bg-warning-bg text-warning',
			icon: Clock,
			buttons: [
				{ key: 'deferred_po_absent', label: 'PO Absent', variant: 'secondary' },
				{ key: 'deferred_low_priority', label: 'Low Priority', variant: 'secondary' },
				{ key: 'deferred_skipped', label: 'Skipped', variant: 'secondary' },
				{ key: 'deferred_too_complex', label: 'Too Complex', variant: 'secondary' },
				{ key: 'deferred_needs_refinement', label: 'Needs Refinement', variant: 'secondary' },
				{ key: 'deferred_future_capability', label: 'Future Capability', variant: 'secondary' }
			]
		},
		{
			key: 'drop',
			label: 'Drop',
			headerColor: 'bg-alert/10 text-alert',
			icon: Trash2,
			buttons: [
				{ key: 'dropped_low_relevance', label: 'Low Relevance', variant: 'destructive' },
				{ key: 'dropped_low_quality', label: 'Low Quality', variant: 'destructive' }
			]
		},
		{
			key: 'close',
			label: 'Close',
			headerColor: 'bg-purple-bg text-purple',
			icon: Archive,
			buttons: [
				{ key: 'closed_complete', label: 'Complete' },
				{ key: 'closed_partial', label: 'Partial', variant: 'secondary' }
			]
		},
		{
			key: 'live',
			label: 'Live Assessments',
			headerColor: 'bg-warning-bg text-warning',
			icon: Zap,
			buttons: [
				{ key: 'open_pitch', label: 'Open Pitch' },
				{ key: 'close_pitch', label: 'Close Pitch', variant: 'secondary' },
				{ key: 'open_review', label: 'Open Review' },
				{ key: 'close_review', label: 'Close Review', variant: 'secondary' }
			]
		}
	];

	let openCategory = $state<DecisionCategory | null>(null);

	function handleCategoryClick(category: DecisionCategory) {
		openCategory = openCategory === category ? null : category;
	}

	function handleDecision(decisionType: string) {
		if (disabled) return;
		onDecision?.(decisionType);
	}
</script>

<div class={cn('space-y-2', className)}>
	{#if problemTitle}
		<p class="text-sm text-labels mb-3">
			Decisions for: <span class="font-medium text-headers">{problemTitle}</span>
		</p>
	{/if}

	{#each categories as category (category.key)}
		<div class="border border-secondary rounded-[var(--radius-card)] overflow-hidden">
			<!-- Category Header -->
			<button
				type="button"
				onclick={() => handleCategoryClick(category.key)}
				class={cn(
					'w-full flex items-center justify-between p-3 text-left transition-colors',
					category.headerColor,
					openCategory === category.key ? 'rounded-t-[var(--radius-card)]' : 'rounded-[var(--radius-card)]'
				)}
				aria-expanded={openCategory === category.key}
			>
				<div class="flex items-center gap-2">
					{#if category.icon}
						{@const CategoryIcon = category.icon}
						<CategoryIcon class="w-4 h-4" />
					{/if}
					<span class="font-medium">{category.label}</span>
					<span class="text-xs opacity-75">({category.buttons.length})</span>
				</div>
				<span
					class={cn(
						'accordion-icon transition-transform',
						openCategory === category.key && 'rotate-180'
					)}
				>
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
					</svg>
				</span>
			</button>

			<!-- Category Content -->
			{#if openCategory === category.key}
				<div class="p-3 bg-card space-y-2">
					{#each category.buttons as btn (btn.key)}
						<Button
							variant={btn.variant ?? 'default'}
							fullWidth
							{disabled}
							onclick={() => handleDecision(btn.key)}
						>
							{btn.label}
						</Button>
					{/each}
				</div>
			{/if}
		</div>
	{/each}
</div>
