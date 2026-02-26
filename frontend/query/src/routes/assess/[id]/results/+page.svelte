<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { cn } from '$lib/utils';
	import PageContainer from '$lib/components/layout/PageContainer.svelte';
	import Header from '$lib/components/layout/Header.svelte';
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { ResultsTable } from '$lib/components/analytics';
	import { ImprovementPriorities } from '$lib/components/analytics';
	import { BarChart, LineChart } from '$lib/components/charts';
	import type { Priority, PriorityLevel } from '$lib/components/analytics';
	import type { ItemResult } from '$lib/components/analytics';
	import type { ResultsData } from './+page.server';
	import { ArrowLeft, Filter, BarChart3, Table, TrendingUp, Download } from '@lucide/svelte';
	import { generateCsv, downloadCsv, csvFilename } from '$lib/utils/csv';

	interface PageData {
		results: ResultsData;
		isAdmin: boolean;
	}

	let { data }: { data: PageData } = $props();

	// View mode: table or chart
	let viewMode = $state<'table' | 'chart'>('table');

	// Filter state - initialized null, synced from data
	let selectedRole = $state<string | null>(null);
	let selectedPresence = $state<boolean | null>(null);
	let showFilters = $state(false);

	// Sync filters from URL/data
	$effect(() => {
		selectedRole = data.results.filters.role;
		selectedPresence = data.results.filters.in_presence;
	});

	// Transform item stats to ResultsTable format
	const tableResults: ItemResult[] = $derived(
		data.results.items.map((item) => ({
			item_key: item.item_key,
			short_label: item.short_label,
			n: item.n,
			mean: item.mean,
			sd: item.sd,
			min: item.min,
			max: item.max
		}))
	);

	// Transform item stats to priorities format for ImprovementPriorities
	const priorities: Priority[] = $derived(
		data.results.items.map((item) => {
			let level: PriorityLevel;
			let suggestion: string;

			if (item.mean < 3.0) {
				level = 'needs_attention';
				suggestion = getSuggestion(item.item_key, 'low');
			} else if (item.mean <= 3.5) {
				level = 'improvement';
				suggestion = getSuggestion(item.item_key, 'medium');
			} else {
				level = 'strength';
				suggestion = getSuggestion(item.item_key, 'high');
			}

			return {
				item: item.short_label,
				score: item.mean,
				level,
				suggestion
			};
		})
	);

	// Generate contextual suggestions based on item
	function getSuggestion(itemKey: string, level: 'low' | 'medium' | 'high'): string {
		const suggestions: Record<string, Record<string, string>> = {
			correctness: {
				low: 'Review requirements coverage and edge case handling',
				medium: 'Verify remaining edge cases and boundary conditions',
				high: 'Excellent requirements coverage - maintain current approach'
			},
			test_support: {
				low: 'Add explicit test scenarios and acceptance criteria',
				medium: 'Consider adding more edge case tests',
				high: 'Strong test coverage - continue good practices'
			},
			readability: {
				low: 'Improve naming conventions and code structure',
				medium: 'Consider additional comments for complex logic',
				high: 'Code is clear and well-structured'
			},
			simplicity: {
				low: 'Remove unnecessary complexity and refactor',
				medium: 'Look for opportunities to simplify',
				high: 'Appropriately simple solution'
			},
			elegance: {
				low: 'Review language idioms and patterns',
				medium: 'Consider more idiomatic approaches',
				high: 'Elegant use of language features'
			},
			extensibility: {
				low: 'Consider future change scenarios in design',
				medium: 'Review extensibility for likely changes',
				high: 'Well-prepared for future changes'
			}
		};

		// Find matching suggestion or use generic
		for (const key of Object.keys(suggestions)) {
			if (itemKey.toLowerCase().includes(key)) {
				return suggestions[key][level];
			}
		}

		// Generic suggestions
		const generic: Record<string, string> = {
			low: 'This area needs attention - review feedback for specific issues',
			medium: 'Room for improvement - consider refinements',
			high: 'Strong performance - maintain current approach'
		};
		return generic[level];
	}

	// Chart data for bar chart
	const chartLabels = $derived(data.results.items.map((item) => item.short_label));
	const chartDatasets = $derived([
		{
			label: 'Mean Score',
			data: data.results.items.map((item) => item.mean)
		}
	]);

	// Apply filters
	function applyFilters() {
		const params = new URLSearchParams();
		if (selectedRole) {
			params.set('role', selectedRole);
		}
		if (selectedPresence !== null) {
			params.set('in_presence', String(selectedPresence));
		}

		const queryString = params.toString();
		goto(`/assess/${data.results.assessment_id}/results${queryString ? '?' + queryString : ''}`);
	}

	// Clear filters
	function clearFilters() {
		selectedRole = null;
		selectedPresence = null;
		goto(`/assess/${data.results.assessment_id}/results`);
	}

	// Check if any filters are active
	const hasActiveFilters = $derived(
		data.results.filters.role !== null || data.results.filters.in_presence !== null
	);

	// Back navigation
	function goBack() {
		// Try to go to problem page if we have problem_id, otherwise assessment
		if (data.results.problem_id) {
			goto(`/problem/${data.results.problem_id}`);
		} else {
			history.back();
		}
	}

	// CSV export (admin-only, Ch.15.3.4)
	function exportCsv() {
		const headers = ['Item', 'N', 'Mean', 'SD', 'Min', 'Max'];
		const rows = data.results.items.map((item) => [
			item.short_label,
			item.n,
			item.mean.toFixed(1),
			item.sd.toFixed(1),
			item.min,
			item.max
		]);
		const csv = generateCsv(headers, rows);
		downloadCsv(csv, csvFilename('rating_results'));
	}
</script>

<PageContainer>
	<!-- Header with back button -->
	<div class="mb-6">
		<button
			onclick={goBack}
			class="flex items-center gap-2 text-primary hover:text-primary-hover mb-4 transition-colors"
		>
			<ArrowLeft class="w-4 h-4" />
			<span class="text-sm">Back to Problem</span>
		</button>

		<Header
			title={data.results.problem_title}
			subtitle={`${data.results.inventory_name} Results`}
			mode={data.results.time_context}
		/>

		<!-- Assessment status -->
		<div class="flex items-center gap-3 mt-3">
			<Badge variant={data.results.is_open ? 'submitted' : 'closed'}>
				{data.results.is_open ? 'Open' : 'Closed'}
			</Badge>
			<span class="text-sm text-labels">
				{data.results.response_count} response{data.results.response_count !== 1 ? 's' : ''}
			</span>
		</div>
	</div>

	{#if data.results.items.length === 0}
		<!-- Empty state -->
		<Card elevation="resting" padding="lg">
			<div class="text-center py-8">
				<div class="text-4xl mb-4">📊</div>
				<h3 class="text-lg font-semibold text-headers mb-2">No Results Yet</h3>
				<p class="text-labels">
					Results will appear here after participants have submitted their assessments.
				</p>
			</div>
		</Card>
	{:else}
		<!-- Filter bar -->
		<Card elevation="resting" padding="sm" class="mb-6">
			<div class="flex flex-col md:flex-row md:items-center gap-4">
				<!-- Mobile: Filter toggle button -->
				<button
					onclick={() => (showFilters = !showFilters)}
					class="md:hidden flex items-center gap-2 text-primary"
				>
					<Filter class="w-4 h-4" />
					<span>Filters</span>
					{#if hasActiveFilters}
						<Badge variant="default" size="default">Active</Badge>
					{/if}
				</button>

				<!-- Filter controls (hidden on mobile unless expanded) -->
				<div class={cn('flex-1 space-y-3 md:space-y-0 md:flex md:items-center md:gap-4', !showFilters && 'hidden md:flex')}>
					<!-- Role filter -->
					<div class="flex items-center gap-2">
						<label for="role-filter" class="text-sm text-labels whitespace-nowrap">Role:</label>
						<select
							id="role-filter"
							bind:value={selectedRole}
							class="flex-1 md:w-32 px-3 py-2 text-sm bg-card border border-secondary rounded-[var(--radius-card)] focus:outline-none focus:ring-2 focus:ring-primary/50"
						>
							<option value={null}>All roles</option>
							{#each data.results.available_roles as role}
								<option value={role}>{role}</option>
							{/each}
						</select>
					</div>

					<!-- Presence filter -->
					<div class="flex items-center gap-2">
						<label for="presence-filter" class="text-sm text-labels whitespace-nowrap"
							>Location:</label
						>
						<select
							id="presence-filter"
							bind:value={selectedPresence}
							class="flex-1 md:w-32 px-3 py-2 text-sm bg-card border border-secondary rounded-[var(--radius-card)] focus:outline-none focus:ring-2 focus:ring-primary/50"
						>
							<option value={null}>All locations</option>
							<option value={true}>In presence</option>
							<option value={false}>Remote</option>
						</select>
					</div>

					<!-- Apply / Clear buttons -->
					<div class="flex items-center gap-2">
						<Button variant="default" size="sm" onclick={applyFilters}>Apply</Button>
						{#if hasActiveFilters}
							<Button variant="ghost" size="sm" onclick={clearFilters}>Clear</Button>
						{/if}
					</div>
				</div>

				<!-- View toggle + CSV export (always visible) -->
				<div class="flex items-center gap-1 border-l border-secondary pl-4">
					<button
						onclick={() => (viewMode = 'table')}
						class={cn(
							'p-2 rounded-[var(--radius-card)] transition-colors',
							viewMode === 'table' ? 'bg-primary/10 text-primary' : 'text-labels hover:bg-canvas'
						)}
						title="Table view"
					>
						<Table class="w-4 h-4" />
					</button>
					<button
						onclick={() => (viewMode = 'chart')}
						class={cn(
							'p-2 rounded-[var(--radius-card)] transition-colors',
							viewMode === 'chart' ? 'bg-primary/10 text-primary' : 'text-labels hover:bg-canvas'
						)}
						title="Chart view"
					>
						<BarChart3 class="w-4 h-4" />
					</button>
					{#if data.isAdmin}
						<Button variant="outline" size="sm" onclick={exportCsv} class="ml-2">
							<Download class="w-4 h-4 mr-1" />
							CSV
						</Button>
					{/if}
				</div>
			</div>
		</Card>

		<!-- Active filters indicator -->
		{#if hasActiveFilters}
			<div class="mb-4 text-sm text-labels">
				<span class="font-medium">Active filters:</span>
				{#if data.results.filters.role}
					<Badge variant="secondary" class="ml-2">{data.results.filters.role}</Badge>
				{/if}
				{#if data.results.filters.in_presence !== null}
					<Badge variant="secondary" class="ml-2">
						{data.results.filters.in_presence ? 'In presence' : 'Remote'}
					</Badge>
				{/if}
			</div>
		{/if}

		<!-- Results display -->
		{#if viewMode === 'table'}
			<!-- Table view -->
			<Card elevation="resting" padding="md" class="mb-6">
				<CardHeader>
					<CardTitle>Item Statistics</CardTitle>
				</CardHeader>
				<CardContent>
					<ResultsTable results={tableResults} />
				</CardContent>
			</Card>
		{:else}
			<!-- Chart view -->
			<Card elevation="resting" padding="md" class="mb-6">
				<CardHeader>
					<CardTitle>Score Distribution</CardTitle>
				</CardHeader>
				<CardContent>
					<BarChart
						labels={chartLabels}
						datasets={chartDatasets}
						height={300}
						yAxisLabel="Mean Score"
						showLegend={false}
					/>
				</CardContent>
			</Card>
		{/if}

		<!-- Improvement priorities -->
		<Card elevation="resting" padding="md" class="mb-6">
			<CardContent>
				<ImprovementPriorities {priorities} maxScore={5} />
			</CardContent>
		</Card>

		<!-- High SD warning -->
		{@const highSdItems = data.results.items.filter((item) => item.sd > 1.5)}
		{#if highSdItems.length > 0}
			<Card elevation="flat" padding="md" class="bg-warning-bg border-l-4 border-warning">
				<div class="flex items-start gap-3">
					<TrendingUp class="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
					<div>
						<h4 class="font-medium text-headers mb-1">High Disagreement Detected</h4>
						<p class="text-sm text-labels">
							The following items have high standard deviation (SD &gt; 1.5), indicating reviewers
							disagreed. This might indicate ambiguity to address:
						</p>
						<ul class="mt-2 text-sm text-labels list-disc list-inside">
							{#each highSdItems as item}
								<li>
									<span class="font-medium">{item.short_label}</span>
									<span class="text-meta">(SD: {item.sd.toFixed(1)})</span>
								</li>
							{/each}
						</ul>
					</div>
				</div>
			</Card>
		{/if}
	{/if}
</PageContainer>
