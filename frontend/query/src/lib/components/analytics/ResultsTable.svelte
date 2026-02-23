<script lang="ts">
	import { cn } from '$lib/utils';
	import { SparkLine } from '$lib/components/charts';

	export interface ItemResult {
		item_key: string;
		short_label: string;
		n: number;
		mean: number;
		sd: number;
		min: number;
		max: number;
		trend?: number[]; // Optional array for sparkline visualization
	}

	interface Props {
		results: ItemResult[];
		showTrend?: boolean;
		class?: string;
	}

	let {
		results,
		showTrend = false,
		class: className
	}: Props = $props();

	// Format number to 1 decimal place
	function formatNumber(value: number): string {
		return value.toFixed(1);
	}

	// Small N warning threshold
	const SMALL_N_THRESHOLD = 5;
</script>

<div class={cn('w-full overflow-x-auto', className)}>
	<!-- Desktop table view -->
	<table class="hidden md:table w-full text-sm">
		<thead>
			<tr class="border-b border-secondary">
				<th class="py-3 px-4 text-left text-labels font-medium">Item</th>
				<th class="py-3 px-2 text-center text-labels font-medium w-16">N</th>
				<th class="py-3 px-2 text-center text-labels font-medium w-16">Mean</th>
				<th class="py-3 px-2 text-center text-labels font-medium w-16">SD</th>
				<th class="py-3 px-2 text-center text-labels font-medium w-16">Min</th>
				<th class="py-3 px-2 text-center text-labels font-medium w-16">Max</th>
				{#if showTrend}
					<th class="py-3 px-2 text-center text-labels font-medium w-20">Trend</th>
				{/if}
			</tr>
		</thead>
		<tbody>
			{#each results as result, index}
				<tr class={cn(
					'border-b border-secondary/50',
					index % 2 === 1 ? 'bg-canvas/30' : 'bg-card'
				)}>
					<td class="py-3 px-4 text-headers font-medium">
						{result.short_label}
					</td>
					<td class="py-3 px-2 text-center">
						<span class={cn(
							result.n < SMALL_N_THRESHOLD ? 'text-warning font-medium' : 'text-headers'
						)}>
							{result.n}
						</span>
						{#if result.n < SMALL_N_THRESHOLD}
							<span class="text-xs text-warning ml-1" title="Limited data - results may not be representative">*</span>
						{/if}
					</td>
					<td class="py-3 px-2 text-center text-headers font-semibold">
						{formatNumber(result.mean)}
					</td>
					<td class="py-3 px-2 text-center text-labels">
						{formatNumber(result.sd)}
					</td>
					<td class="py-3 px-2 text-center text-labels">
						{result.min}
					</td>
					<td class="py-3 px-2 text-center text-labels">
						{result.max}
					</td>
					{#if showTrend && result.trend}
						<td class="py-3 px-2 text-center">
							<SparkLine values={result.trend} width={60} height={20} />
						</td>
					{/if}
				</tr>
			{/each}
		</tbody>
	</table>

	<!-- Mobile card view -->
	<div class="md:hidden space-y-3">
		{#each results as result}
			<div class="bg-card rounded-[var(--radius-card)] p-4 shadow-[var(--shadow-card)]">
				<div class="flex justify-between items-start mb-3">
					<h3 class="font-medium text-headers">{result.short_label}</h3>
					{#if showTrend && result.trend}
						<SparkLine values={result.trend} width={60} height={20} />
					{/if}
				</div>

				<div class="grid grid-cols-5 gap-2 text-center text-sm">
					<div>
						<div class="text-meta text-xs">N</div>
						<div class={cn(
							result.n < SMALL_N_THRESHOLD ? 'text-warning font-medium' : 'text-headers'
						)}>
							{result.n}{#if result.n < SMALL_N_THRESHOLD}<span class="text-xs">*</span>{/if}
						</div>
					</div>
					<div>
						<div class="text-meta text-xs">Mean</div>
						<div class="text-headers font-semibold">{formatNumber(result.mean)}</div>
					</div>
					<div>
						<div class="text-meta text-xs">SD</div>
						<div class="text-labels">{formatNumber(result.sd)}</div>
					</div>
					<div>
						<div class="text-meta text-xs">Min</div>
						<div class="text-labels">{result.min}</div>
					</div>
					<div>
						<div class="text-meta text-xs">Max</div>
						<div class="text-labels">{result.max}</div>
					</div>
				</div>
			</div>
		{/each}
	</div>

	<!-- Small N warning note -->
	{#if results.some(r => r.n < SMALL_N_THRESHOLD)}
		<p class="mt-4 text-xs text-warning flex items-center gap-1">
			<span class="font-medium">*</span>
			<span>Limited feedback available. Results may not be representative.</span>
		</p>
	{/if}
</div>
