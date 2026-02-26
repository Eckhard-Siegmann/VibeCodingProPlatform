<script lang="ts">
	import { cn } from '$lib/utils';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { BarChart3, ChevronDown, ChevronUp, Download } from '@lucide/svelte';
	import { generateCsv, downloadCsv, csvFilename } from '$lib/utils/csv';

	export interface PitchResult {
		problem_id: string;
		problem_title: string;
		problem_slug: string;
		assessment_id: string;
		response_count: number;
		overall_average: number;
		item_means: number[];
	}

	interface Props {
		results: PitchResult[];
		collapsed?: boolean;
		showCsvExport?: boolean;
	}

	let { results, collapsed = false, showCsvExport = false }: Props = $props();

	let isCollapsed = $state(collapsed);

	// List bounds: cap at 20 problems (moderator_dashboard_design.md §List Bounds)
	const MAX_DISPLAY = 20;
	const displayedResults = $derived(results.slice(0, MAX_DISPLAY));
	const hasOverflow = $derived(results.length > MAX_DISPLAY);

	// Mini sparkline as inline SVG (bar chart of item_means)
	function sparklinePath(means: number[]): string {
		if (means.length === 0) return '';
		const w = 80;
		const h = 20;
		const barWidth = w / means.length;
		const maxVal = 5;

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
		const headers = ['Problem', 'N', 'Average'];
		const rows = results.map((r) => [r.problem_title, r.response_count, r.overall_average.toFixed(1)]);
		const csv = generateCsv(headers, rows);
		downloadCsv(csv, csvFilename('pitch_results'));
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
				<BarChart3 class="w-5 h-5 text-primary" />
				Pitch Results ({results.length})
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
				<div class="hidden md:grid grid-cols-[1fr_4rem_4rem_6rem] gap-2 px-4 py-2 bg-canvas text-xs font-medium text-meta uppercase tracking-wide border-b border-secondary">
					<div>Problem</div>
					<div class="text-center">N</div>
					<div class="text-center">Avg</div>
					<div class="text-center">Items</div>
				</div>

				<!-- Table rows -->
				<ul class="divide-y divide-secondary">
					{#each displayedResults as result (result.problem_id)}
						<li>
							<a
								href={`/assess/${result.assessment_id}/results`}
								class="grid grid-cols-[1fr_3rem_3.5rem] md:grid-cols-[1fr_4rem_4rem_6rem] gap-2 px-4 py-3 hover:bg-canvas/50 transition-colors items-center"
							>
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

								<!-- Overall average -->
								<div class="text-center text-sm font-semibold text-headers">
									{result.overall_average.toFixed(1)}
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

				<!-- Overflow message (TICKET-35: list bounds, no "View all" for pitch) -->
				{#if hasOverflow}
					<div class="px-4 py-2 bg-warning/5 text-sm text-labels border-t border-secondary">
						<span>Showing top {MAX_DISPLAY} of {results.length} pitched problems.</span>
					</div>
				{/if}

				<!-- Footer -->
				<div class="px-4 py-2 bg-canvas text-xs text-meta border-t border-secondary flex items-center justify-between">
					<span>N = distinct respondents · Avg = mean of item means · No ranking (pitch informs discussion)</span>
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
{/if}
