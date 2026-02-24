<script lang="ts">
	/**
	 * DualStateExplanation - InfoPanel explaining readiness vs action states.
	 *
	 * Per Ch.13.6.5 and problem_card_design.md:
	 * - Expandable help panel explaining the dual-state model
	 * - Shows the difference between readiness (quality) and action (intent)
	 * - Dismissible with "Got it" button
	 */
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';
	import { Button } from '$lib/components/ui/button';
	import { AccordionSection } from '$lib/components/ui/accordion-section';
	import HelpCircle from '@lucide/svelte/icons/help-circle';
	import CheckCircle from '@lucide/svelte/icons/check-circle';
	import Play from '@lucide/svelte/icons/play';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		expanded?: boolean;
		onDismiss?: () => void;
		class?: string;
	}

	let {
		expanded = false,
		onDismiss,
		class: className,
		...restProps
	}: Props = $props();

	let isOpen = $state(false);

	// Sync with prop
	$effect(() => {
		isOpen = expanded;
	});
</script>

<div class={cn('', className)} {...restProps}>
	<AccordionSection
		title="Understanding Problem States"
		defaultOpen={expanded}
		open={isOpen}
		onToggle={(open) => (isOpen = open)}
	>
		<div class="space-y-4">
			<p class="text-sm text-labels leading-relaxed">
				Problems have <strong class="text-headers">TWO independent states</strong>:
			</p>

			<!-- Readiness State -->
			<div class="p-3 bg-canvas/50 rounded-[var(--radius-card)]">
				<div class="flex items-center gap-2 mb-2">
					<CheckCircle class="w-4 h-4 text-primary" />
					<span class="text-sm font-semibold text-headers">READINESS</span>
					<span class="text-xs text-meta">(Is it well-defined?)</span>
				</div>
				<p class="text-sm text-labels">
					Your problem's quality status - has it passed review?
				</p>
				<div class="flex items-center gap-1 mt-2 text-xs text-meta">
					<span class="px-1.5 py-0.5 rounded bg-canvas text-meta">Draft</span>
					<span>→</span>
					<span class="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">Submitted</span>
					<span>→</span>
					<span class="px-1.5 py-0.5 rounded bg-green-100 text-success">Ready</span>
				</div>
				<p class="text-xs text-meta mt-1">(or Needs Changes, Rejected)</p>
			</div>

			<!-- Action State -->
			<div class="p-3 bg-canvas/50 rounded-[var(--radius-card)]">
				<div class="flex items-center gap-2 mb-2">
					<Play class="w-4 h-4 text-purple" />
					<span class="text-sm font-semibold text-headers">ACTION</span>
					<span class="text-xs text-meta">(What's the community doing with it?)</span>
				</div>
				<p class="text-sm text-labels">
					What the community intends to do with your problem.
				</p>
				<div class="flex items-center gap-1 mt-2 text-xs text-meta">
					<span class="px-1.5 py-0.5 rounded bg-canvas text-labels">Backlog</span>
					<span>→</span>
					<span class="px-1.5 py-0.5 rounded bg-blue-100 text-primary">Selected</span>
					<span>→</span>
					<span class="px-1.5 py-0.5 rounded bg-purple-bg text-purple">Coding</span>
					<span>→</span>
					<span class="px-1.5 py-0.5 rounded bg-green-100 text-success">Closed</span>
				</div>
				<p class="text-xs text-meta mt-1">(or Deferred, Dropped)</p>
			</div>

			<!-- Key insight -->
			<div class="p-3 bg-primary/5 rounded-[var(--radius-card)] border-l-4 border-primary">
				<p class="text-sm text-headers">
					<strong>These are independent!</strong> A "Ready" problem might still be in "Backlog"
					because no event has selected it yet.
				</p>
			</div>

			{#if onDismiss}
				<div class="flex justify-end">
					<Button variant="default" size="sm" onclick={onDismiss}>
						Got it
					</Button>
				</div>
			{/if}
		</div>
	</AccordionSection>
</div>
