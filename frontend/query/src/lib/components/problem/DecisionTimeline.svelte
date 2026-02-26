<script lang="ts">
	import type { Decision } from '$lib/server/repositories/problems';
	import { Card, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';

	interface Props {
		decisions?: Decision[];
	}

	let { decisions = [] }: Props = $props();

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	// Category to border color mapping
	const categoryColors: Record<string, string> = {
		lifecycle: 'border-primary',
		quality_gate: 'border-success',
		planning: 'border-blue-400',
		sprint: 'border-purple',
		deferral: 'border-warning',
		drop: 'border-alert',
		close: 'border-success',
		live: 'border-primary'
	};
</script>

<Card elevation="resting">
	<CardHeader>
		<CardTitle>Decision History</CardTitle>
	</CardHeader>

	{#if decisions.length === 0}
		<p class="text-labels text-sm">No decisions recorded yet.</p>
	{:else}
		<div class="space-y-4">
			{#each decisions as decision}
				<div
					class="relative pl-4 border-l-2 {categoryColors[decision.category] ?? 'border-secondary'}"
				>
					<div class="flex flex-col gap-1">
						<div class="flex items-center gap-2 flex-wrap">
							<span class="font-medium text-headers text-sm">
								{decision.decision_display_name}
							</span>
							{#if decision.is_binding}
								<Badge variant="ready" class="text-[11px] px-1.5 py-0">
									Binding
								</Badge>
							{:else}
								<Badge variant="secondary" class="text-[11px] px-1.5 py-0">
									Recommendation
								</Badge>
							{/if}
						</div>
						<div class="text-xs text-labels">
							by {decision.actor_display_name} on v{decision.major_version}
						</div>
						<div class="text-xs text-meta">
							{formatDate(decision.created_at)}
						</div>
						{#if decision.rationale}
							<p class="text-sm text-labels mt-1 italic">"{decision.rationale}"</p>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</Card>
