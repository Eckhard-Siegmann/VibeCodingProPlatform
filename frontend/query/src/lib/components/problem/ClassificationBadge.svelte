<script lang="ts">
	/**
	 * ClassificationBadge - Prominent problem type badge at top of Problem Card.
	 *
	 * Per Ch.13.1 and problem_card_design.md:
	 * - Large pill badge with distinct color per problem type
	 * - Positioned at very top of Problem Card (above header)
	 * - Uses Badge component with size="large"
	 */
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';
	import { Badge } from '$lib/components/ui/badge';

	type ProblemType =
		| 'explorative'
		| 'greenfield'
		| 'advanced_greenfield'
		| 'brownfield'
		| 'reverse_engineering'
		| 'other';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		type: ProblemType;
		class?: string;
	}

	let { type, class: className, ...restProps }: Props = $props();

	// Type to display label mapping
	const typeLabels: Record<ProblemType, string> = {
		explorative: 'Explorative',
		greenfield: 'Greenfield',
		advanced_greenfield: 'Advanced Greenfield',
		brownfield: 'Brownfield',
		reverse_engineering: 'Reverse Engineering',
		other: 'Other'
	};

	// Type to color classes mapping per problem_card_design.md
	const typeColors: Record<ProblemType, string> = {
		explorative: 'bg-purple-bg text-purple',
		greenfield: 'bg-green-100 text-success',
		advanced_greenfield: 'bg-primary/10 text-primary',
		brownfield: 'bg-warning-bg text-warning',
		reverse_engineering: 'bg-canvas text-headers',
		other: 'bg-secondary text-labels'
	};
</script>

<div class={cn('flex justify-center', className)} {...restProps}>
	<span
		class={cn(
			'inline-flex items-center rounded-[var(--radius-card)] font-bold uppercase tracking-wide',
			'px-4 py-2 text-sm',
			typeColors[type] ?? typeColors.other
		)}
	>
		{typeLabels[type] ?? 'Other'}
	</span>
</div>
