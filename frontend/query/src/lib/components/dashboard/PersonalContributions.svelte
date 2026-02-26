<script lang="ts">
	import { Card, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { cn } from '$lib/utils';

	// ── Types ────────────────────────────────────────────────────────────────

	export interface ContributionBreakdown {
		actionKey: string;
		displayName: string;
		totalPoints: number;
	}

	export interface RecentAward {
		place: number;
		starsAwarded: number;
		problemTitle: string;
		problemSlug: string;
		eventName: string;
		awardedAt: string;
	}

	export interface PersonalContributionData {
		allTimePoints: number;
		recentPoints: number;
		allTimeStars: number;
		breakdown: ContributionBreakdown[];
		recentAwards: RecentAward[];
	}

	interface Props {
		data: PersonalContributionData;
		class?: string;
	}

	let { data, class: className }: Props = $props();

	// ── Helpers ──────────────────────────────────────────────────────────────

	const starString = $derived(() => {
		if (data.allTimeStars === 0) return '';
		return '★'.repeat(Math.min(data.allTimeStars, 5));
	});

	const maxBreakdownPoints = $derived(() => {
		if (data.breakdown.length === 0) return 1;
		return Math.max(...data.breakdown.map((b) => b.totalPoints));
	});

	function placeStars(starsAwarded: number): string {
		return '★'.repeat(starsAwarded);
	}

	function placeLabel(place: number): string {
		return place === 1 ? '1st' : place === 2 ? '2nd' : '3rd';
	}

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
	}

	const isEmpty = $derived(data.allTimePoints === 0 && data.allTimeStars === 0);
</script>

<Card class={className} elevation="resting">
	<CardHeader>
		<CardTitle>Your Contributions</CardTitle>
	</CardHeader>

	<div class="px-4 pb-4">
		{#if isEmpty}
			<!-- ── Empty state ─────────────────────────────────── -->
			<p class="text-sm text-labels">
				No contributions yet. Complete a review, submit a problem, or join a team to earn your first
				points.
			</p>
		{:else}
			<!-- ── Totals ──────────────────────────────────────── -->
			<div class="mb-4 flex items-start justify-between gap-4">
				<div>
					<p class="text-2xl font-bold text-headers">{data.allTimePoints} pts</p>
					<p class="text-xs text-labels">all time</p>
					{#if data.recentPoints > 0 && data.recentPoints !== data.allTimePoints}
						<p class="mt-1 text-xs text-labels">{data.recentPoints} pts (last 6 weeks)</p>
					{/if}
				</div>
				{#if data.allTimeStars > 0}
					<div class="text-right">
						<p class="text-lg font-semibold text-pending leading-none">{starString()}</p>
						<p class="mt-1 text-xs text-labels">{data.allTimeStars} star{data.allTimeStars !== 1 ? 's' : ''}</p>
					</div>
				{/if}
			</div>

			<!-- ── Breakdown ───────────────────────────────────── -->
			{#if data.breakdown.length > 0}
				<div class="border-t border-border pt-3">
					<p class="mb-2 text-xs font-medium uppercase tracking-wide text-labels">Breakdown</p>
					<div class="space-y-2">
						{#each data.breakdown as item (item.actionKey)}
							<div class="flex items-center gap-2">
								<div class="w-28 shrink-0">
									<p class="truncate text-xs text-labels">{item.displayName}</p>
								</div>
								<div class="flex flex-1 items-center gap-1">
									<!-- Simple proportional bar -->
									<div
										class="h-2 rounded-full bg-primary"
										style="width: {Math.max(
											4,
											Math.round((item.totalPoints / maxBreakdownPoints()) * 80)
										)}px"
									></div>
								</div>
								<span class="w-10 text-right text-xs font-medium text-headers">
									{item.totalPoints} pt{item.totalPoints !== 1 ? 's' : ''}
								</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- ── Recent Awards ───────────────────────────────── -->
			{#if data.recentAwards.length > 0}
				<div class="mt-3 border-t border-border pt-3">
					<p class="mb-2 text-xs font-medium uppercase tracking-wide text-labels">Recent Awards</p>
					<div class="space-y-2">
						{#each data.recentAwards as award (award.problemTitle + award.awardedAt)}
							<div class="flex items-start gap-2">
								<span class="shrink-0 text-sm text-pending leading-none"
									>{placeStars(award.starsAwarded)}</span
								>
								<div class="min-w-0">
									<a
										href="/problem/{award.problemSlug}"
										class="block truncate text-xs font-medium text-primary hover:underline"
									>
										{placeLabel(award.place)}: {award.problemTitle}
									</a>
									<p class="text-xs text-labels">
										{award.eventName} · {formatDate(award.awardedAt)}
									</p>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		{/if}
	</div>
</Card>
