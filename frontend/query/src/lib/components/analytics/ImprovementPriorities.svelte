<script lang="ts">
	import { cn } from '$lib/utils';

	export type PriorityLevel = 'needs_attention' | 'improvement' | 'strength';

	export interface Priority {
		item: string;
		score: number;
		level: PriorityLevel;
		suggestion: string;
	}

	interface Props {
		priorities: Priority[];
		maxScore?: number;
		class?: string;
	}

	let {
		priorities,
		maxScore = 5,
		class: className
	}: Props = $props();

	// Sort by score ascending (lowest scores first = most important to improve)
	const sortedPriorities = $derived(
		[...priorities].sort((a, b) => {
			// Sort by level first (needs_attention > improvement > strength)
			const levelOrder: Record<PriorityLevel, number> = {
				needs_attention: 0,
				improvement: 1,
				strength: 2
			};
			const levelDiff = levelOrder[a.level] - levelOrder[b.level];
			if (levelDiff !== 0) return levelDiff;
			// Then by score ascending within same level
			return a.score - b.score;
		})
	);

	// Level configuration
	const levelConfig: Record<PriorityLevel, { icon: string; color: string; textColor: string; bgColor: string; label: string }> = {
		needs_attention: {
			icon: '\uD83D\uDD34', // red circle emoji
			color: 'text-alert',
			textColor: 'text-alert',
			bgColor: 'bg-alert/10',
			label: 'Needs Attention'
		},
		improvement: {
			icon: '\uD83D\uDFE1', // yellow circle emoji
			color: 'text-pending',
			textColor: 'text-pending',
			bgColor: 'bg-pending/10',
			label: 'Room for Improvement'
		},
		strength: {
			icon: '\uD83D\uDFE2', // green circle emoji
			color: 'text-success',
			textColor: 'text-success',
			bgColor: 'bg-success/10',
			label: 'Strength'
		}
	};

	// Calculate level from score if not provided
	function getLevelFromScore(score: number, maxScore: number): PriorityLevel {
		const ratio = score / maxScore;
		if (ratio < 0.6) return 'needs_attention'; // < 3.0 on 5-point scale
		if (ratio <= 0.7) return 'improvement';    // 3.0-3.5 on 5-point scale
		return 'strength';                          // > 3.5 on 5-point scale
	}

	// Format score
	function formatScore(score: number): string {
		return score.toFixed(1);
	}
</script>

<div class={cn('space-y-4', className)}>
	<h3 class="text-lg font-semibold text-headers">Improvement Priorities</h3>

	{#if sortedPriorities.length === 0}
		<p class="text-labels text-sm">No assessment data available yet.</p>
	{:else}
		<div class="space-y-3">
			{#each sortedPriorities as priority, index}
				{@const config = levelConfig[priority.level]}
				<div class={cn(
					'rounded-[var(--radius-card)] p-4 border-l-4',
					priority.level === 'needs_attention' && 'border-l-alert bg-alert/5',
					priority.level === 'improvement' && 'border-l-pending bg-pending/5',
					priority.level === 'strength' && 'border-l-success bg-success/5'
				)}>
					<div class="flex items-start gap-3">
						<span class="text-lg flex-shrink-0" role="img" aria-label={config.label}>
							{config.icon}
						</span>
						<div class="flex-1 min-w-0">
							<div class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
								<span class="font-semibold text-headers">
									{priority.item}
								</span>
								<span class={cn('text-sm font-medium', config.textColor)}>
									({formatScore(priority.score)}/{maxScore})
								</span>
							</div>
							<p class="text-sm text-labels mt-1">
								{priority.suggestion}
							</p>
						</div>
						<span class={cn(
							'hidden sm:inline-flex px-2 py-0.5 text-xs font-medium rounded-full',
							config.bgColor,
							config.textColor
						)}>
							#{index + 1}
						</span>
					</div>
				</div>
			{/each}
		</div>

		<!-- Legend -->
		<div class="mt-6 pt-4 border-t border-secondary/50">
			<p class="text-xs text-meta mb-2">Priority Levels:</p>
			<div class="flex flex-wrap gap-4 text-xs">
				<div class="flex items-center gap-1.5">
					<span role="img" aria-hidden="true">{levelConfig.needs_attention.icon}</span>
					<span class="text-labels">&lt; 3.0 (Needs Attention)</span>
				</div>
				<div class="flex items-center gap-1.5">
					<span role="img" aria-hidden="true">{levelConfig.improvement.icon}</span>
					<span class="text-labels">3.0-3.5 (Improvement)</span>
				</div>
				<div class="flex items-center gap-1.5">
					<span role="img" aria-hidden="true">{levelConfig.strength.icon}</span>
					<span class="text-labels">&gt; 3.5 (Strength)</span>
				</div>
			</div>
		</div>
	{/if}
</div>
