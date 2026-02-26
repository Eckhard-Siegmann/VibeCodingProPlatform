<script lang="ts">
	import { cn } from '$lib/utils';
	import { Card, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Star, BarChart3, ChevronDown, ChevronUp, Download } from '@lucide/svelte';
	import { generateCsv, downloadCsv, csvFilename } from '$lib/utils/csv';

	export interface ReviewResult {
		problem_id: string;
		problem_title: string;
		problem_slug: string;
		assessment_id: string;
		response_count: number;
		weighted_average: number;
		item_means: number[];
		rank: number;
	}

	interface Props {
		results: ReviewResult[];
		collapsed?: boolean;
		showCsvExport?: boolean;
	}

	let { results, collapsed = false, showCsvExport = false }: Props = $props();

	let isCollapsed = $state(collapsed);

	// List bounds: cap at 20 problems (moderator_dashboard_design.md §List Bounds)
	const MAX_DISPLAY = 20;
	const displayedResults = $derived(results.slice(0, MAX_DISPLAY));
	const hasOverflow = $derived(results.length > MAX_DISPLAY);

	// Rank badge color per design doc
	function rankClass(rank: number): string {
		switch (rank) {
			case 1:
				return 'bg-warning/10 text-warning font-bold';
			case 2:
				return 'bg-secondary/30 text-labels font-semibold';
			case 3:
				return 'bg-[#CD7F32]/10 text-[#CD7F32] font-semibold';
			default:
				return 'text-meta';
		}
	}

	// Score color per design doc thresholds
	function scoreClass(score: number): string {
		if (score >= 4.0) return 'text-success font-semibold';
		if (score < 3.0) return 'text-alert font-semibold';
		return 'text-headers font-semibold';
	}

	// Mini sparkline as inline SVG (simple bar chart of item_means)
	function sparklinePath(means: number[]): string {
		if (means.length === 0) return '';
		const w = 80;
		const h = 20;
		const barWidth = w / means.length;
		const maxVal = 5; // Scale to 5-point max for visual consistency

		return means
			.map((val, i) => {
				const barHeight = (val / maxVal) * h;
				const x = i * barWidth;
				const y = h - barHeight;
				return `<rect x="${x}" y="${y}" width="${barWidth - 1}" height="${barHeight}" rx="1" fill="currentColor" opacity="0.6"/>`;
			})
			.join('');
	}

	function exportCsv() {
		const headers = ['Rank', 'Problem', 'N', 'Weighted Score'];
		const rows = results.map((r) => [r.rank, r.problem_title, r.response_count, r.weighted_average.toFixed(1)]);
		const csv = generateCsv(headers, rows);
		downloadCsv(csv, csvFilename('review_results'));
	}
</script>

{#if results.length > 0}
	<section>
		<button
			type="button"
			onclick={() => (isCollapsed = !isCollapsed)}
			class="flex items-center justify-between w-full mb-3"
		>
			<h2 class="text-lg font-semibold text-headers flex items-center gap-2">
				<Star class="w-5 h-5 text-warning" />
				Review Results ({results.length})
			</h2>
			{#if isCollapsed}
				<ChevronDown class="w-5 h-5 text-labels" />
			{:else}
				<ChevronUp class="w-5 h-5 text-labels" />
			{/if}
		</button>

		{#if !isCollapsed}
			<Card elevation="resting" padding="none">
				<!-- Table header -->
				<div class="hidden md:grid grid-cols-[3rem_1fr_4rem_4rem_6rem] gap-2 px-4 py-2 bg-canvas text-xs font-medium text-meta uppercase tracking-wide border-b border-secondary">
					<div class="text-center">#</div>
					<div>Problem</div>
					<div class="text-center">N</div>
					<div class="text-center">Score</div>
					<div class="text-center">Items</div>
				</div>

				<!-- Table rows -->
				<ul class="divide-y divide-secondary">
					{#each displayedResults as result (result.problem_id)}
						<li>
							<a
								href={`/assess/${result.assessment_id}/results`}
								class="grid grid-cols-[3rem_1fr_3rem_3.5rem] md:grid-cols-[3rem_1fr_4rem_4rem_6rem] gap-2 px-4 py-3 hover:bg-canvas/50 transition-colors items-center"
							>
								<!-- Rank -->
								<div class="flex justify-center">
									<span
										class={cn(
											'inline-flex items-center justify-center w-7 h-7 rounded-full text-sm',
											rankClass(result.rank)
										)}
									>
										{result.rank}
									</span>
								</div>

								<!-- Problem title -->
								<div class="min-w-0">
									<p class="font-medium text-headers truncate">
										{result.problem_title}
									</p>
								</div>

								<!-- Response count -->
								<div class="text-center text-meta text-sm">
									{result.response_count}
								</div>

								<!-- Weighted average score -->
								<div class={cn('text-center text-sm', scoreClass(result.weighted_average))}>
									{result.weighted_average.toFixed(1)}
								</div>

								<!-- Sparkline (desktop only) -->
								<div class="hidden md:flex justify-center text-primary/60">
									{#if result.item_means.length > 0}
										<svg
											width="80"
											height="20"
											viewBox="0 0 80 20"
											class="text-primary"
										>
											{@html sparklinePath(result.item_means)}
										</svg>
									{:else}
										<span class="text-xs text-meta">—</span>
									{/if}
								</div>
							</a>
						</li>
					{/each}
				</ul>

				<!-- Overflow message (TICKET-35: list bounds) -->
				{#if hasOverflow}
					<div class="px-4 py-2 bg-warning/5 text-sm text-labels border-t border-secondary flex items-center justify-between">
						<span>Showing top {MAX_DISPLAY} of {results.length} reviewed problems.</span>
						{#if results[0]?.assessment_id}
							<a href={`/assess/${results[0].assessment_id}/results`} class="text-primary hover:text-primary-hover text-sm font-medium">
								View all &rarr;
							</a>
						{/if}
					</div>
				{/if}

				<!-- Footer legend -->
				<div class="px-4 py-2 bg-canvas text-xs text-meta border-t border-secondary flex items-center justify-between">
					<span>N = distinct reviewers · Score = weighted avg (excl. meta items)</span>
					{#if showCsvExport}
						<Button variant="outline" size="sm" onclick={exportCsv}>
							<Download class="w-3 h-3 mr-1" />
							CSV
						</Button>
					{/if}
				</div>
			</Card>
		{/if}
	</section>
{:else}
	<!-- Empty state: hidden entirely when no results -->
{/if}
