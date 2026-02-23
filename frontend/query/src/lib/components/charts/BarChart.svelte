<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { cn } from '$lib/utils';
	import { getProblemColors, getColorTokens } from '$lib/utils/colors';
	import {
		Chart,
		BarController,
		BarElement,
		CategoryScale,
		LinearScale,
		Tooltip,
		Legend
	} from 'chart.js';

	// Register Chart.js components
	Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

	interface Dataset {
		label: string;
		data: number[];
		backgroundColor?: string;
		borderColor?: string;
		borderWidth?: number;
	}

	interface Props {
		labels: string[];
		datasets: Dataset[];
		height?: number;
		horizontal?: boolean;
		showLegend?: boolean;
		legendPosition?: 'top' | 'bottom' | 'left' | 'right';
		yAxisLabel?: string;
		xAxisLabel?: string;
		class?: string;
	}

	let {
		labels,
		datasets,
		height = 300,
		horizontal = false,
		showLegend = true,
		legendPosition = 'top',
		yAxisLabel,
		xAxisLabel,
		class: className
	}: Props = $props();

	let canvasElement: HTMLCanvasElement;
	let chartInstance: Chart | null = null;

	// Colors extracted from CSS custom properties
	let problemColors = $state<string[]>([]);
	let colorTokens = $state<ReturnType<typeof getColorTokens>>();

	// Load colors on mount (client-side only)
	$effect(() => {
		if (browser) {
			problemColors = getProblemColors();
			colorTokens = getColorTokens();
		}
	});

	function getColor(index: number): string {
		if (problemColors.length === 0) {
			// Fallback during SSR or before colors load
			return '#2680F1'; // Primary blue
		}
		return problemColors[index % problemColors.length];
	}

	// Check for reduced motion preference
	function prefersReducedMotion(): boolean {
		if (typeof window === 'undefined') return false;
		return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}

	function createChart() {
		if (!canvasElement) return;

		// Destroy existing chart
		if (chartInstance) {
			chartInstance.destroy();
			chartInstance = null;
		}

		const ctx = canvasElement.getContext('2d');
		if (!ctx) return;

		// Apply default colors if not provided
		const coloredDatasets = datasets.map((ds, index) => ({
			...ds,
			backgroundColor: ds.backgroundColor ?? getColor(index),
			borderColor: ds.borderColor ?? getColor(index),
			borderWidth: ds.borderWidth ?? 0
		}));

		chartInstance = new Chart(ctx, {
			type: 'bar',
			data: {
				labels,
				datasets: coloredDatasets
			},
			options: {
				indexAxis: horizontal ? 'y' : 'x',
				responsive: true,
				maintainAspectRatio: false,
				animation: prefersReducedMotion() ? false : { duration: 300 },
				interaction: {
					mode: 'index',
					intersect: false
				},
				plugins: {
					legend: {
						display: showLegend && datasets.length > 1,
						position: legendPosition,
						labels: {
							color: colorTokens?.headers ?? '#192A4B',
							font: {
								family: 'system-ui, sans-serif'
							}
						}
					},
					tooltip: {
						enabled: true,
						backgroundColor: colorTokens?.card ?? '#FEFEFE',
						titleColor: colorTokens?.headers ?? '#192A4B',
						bodyColor: colorTokens?.labels ?? '#7B7C90',
						borderColor: colorTokens?.secondary ?? '#DCE4EA',
						borderWidth: 1,
						padding: 12,
						cornerRadius: 8,
						displayColors: true,
						callbacks: {
							label: (context) => {
								const value = context.parsed.y ?? context.parsed.x ?? 0;
								return `${context.dataset.label}: ${value.toFixed(1)}`;
							}
						}
					}
				},
				scales: {
					x: {
						title: {
							display: !!xAxisLabel,
							text: xAxisLabel ?? '',
							color: colorTokens?.labels ?? '#7B7C90'
						},
						ticks: {
							color: colorTokens?.labels ?? '#7B7C90'
						},
						grid: {
							color: colorTokens?.secondary ?? '#DCE4EA'
						}
					},
					y: {
						title: {
							display: !!yAxisLabel,
							text: yAxisLabel ?? '',
							color: colorTokens?.labels ?? '#7B7C90'
						},
						ticks: {
							color: colorTokens?.labels ?? '#7B7C90'
						},
						grid: {
							color: colorTokens?.secondary ?? '#DCE4EA'
						},
						beginAtZero: true
					}
				}
			}
		});
	}

	// Reactive update when data changes
	$effect(() => {
		if (chartInstance && labels && datasets) {
			chartInstance.data.labels = labels;
			chartInstance.data.datasets = datasets.map((ds, index) => ({
				...ds,
				backgroundColor: ds.backgroundColor ?? getColor(index),
				borderColor: ds.borderColor ?? getColor(index),
				borderWidth: ds.borderWidth ?? 0
			}));
			chartInstance.update('none');
		}
	});

	onMount(() => {
		createChart();
	});

	onDestroy(() => {
		if (chartInstance) {
			chartInstance.destroy();
			chartInstance = null;
		}
	});
</script>

<div
	class={cn('w-full overflow-x-auto', className)}
	style="touch-action: pan-y;"
>
	<div class="min-w-[300px]" style="height: {height}px;">
		<canvas bind:this={canvasElement}></canvas>
	</div>
</div>
