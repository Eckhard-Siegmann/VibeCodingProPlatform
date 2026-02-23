<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { cn } from '$lib/utils';
	import { getProblemColors, getColorTokens } from '$lib/utils/colors';
	import {
		Chart,
		LineController,
		LineElement,
		PointElement,
		CategoryScale,
		LinearScale,
		Tooltip,
		Legend
	} from 'chart.js';

	// Register Chart.js components
	Chart.register(LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

	interface Dataset {
		label: string;
		data: number[];
		borderColor?: string;
		backgroundColor?: string;
		fill?: boolean;
		tension?: number;
		pointRadius?: number;
		pointHoverRadius?: number;
	}

	interface Props {
		labels: string[];
		datasets: Dataset[];
		height?: number;
		showLegend?: boolean;
		yAxisLabel?: string;
		xAxisLabel?: string;
		yMin?: number;
		yMax?: number;
		class?: string;
	}

	let {
		labels,
		datasets,
		height = 300,
		showLegend = true,
		yAxisLabel,
		xAxisLabel,
		yMin,
		yMax,
		class: className
	}: Props = $props();

	let canvasElement: HTMLCanvasElement;
	let chartInstance: Chart | null = null;
	let containerWidth = $state(0);

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
			return '#2680F1'; // Primary blue fallback
		}
		return problemColors[index % problemColors.length];
	}

	// Check for reduced motion preference
	function prefersReducedMotion(): boolean {
		if (typeof window === 'undefined') return false;
		return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}

	// Responsive legend position: below on mobile, right on desktop
	function getLegendPosition(): 'bottom' | 'right' {
		if (typeof window === 'undefined') return 'bottom';
		return containerWidth < 768 ? 'bottom' : 'right';
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
			borderColor: ds.borderColor ?? getColor(index),
			backgroundColor: ds.backgroundColor ?? `${getColor(index)}20`,
			fill: ds.fill ?? false,
			tension: ds.tension ?? 0.3,
			pointRadius: ds.pointRadius ?? 4,
			pointHoverRadius: ds.pointHoverRadius ?? 6
		}));

		chartInstance = new Chart(ctx, {
			type: 'line',
			data: {
				labels,
				datasets: coloredDatasets
			},
			options: {
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
						position: getLegendPosition(),
						labels: {
							color: colorTokens?.headers ?? '#192A4B',
							font: {
								family: 'system-ui, sans-serif'
							},
							usePointStyle: true,
							pointStyle: 'circle'
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
								const value = context.parsed.y ?? 0;
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
						min: yMin,
						max: yMax
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
				borderColor: ds.borderColor ?? getColor(index),
				backgroundColor: ds.backgroundColor ?? `${getColor(index)}20`,
				fill: ds.fill ?? false,
				tension: ds.tension ?? 0.3,
				pointRadius: ds.pointRadius ?? 4,
				pointHoverRadius: ds.pointHoverRadius ?? 6
			}));
			chartInstance.update('none');
		}
	});

	// Update legend position on resize
	$effect(() => {
		if (chartInstance && containerWidth) {
			const newPosition = getLegendPosition();
			if (chartInstance.options.plugins?.legend) {
				chartInstance.options.plugins.legend.position = newPosition;
				chartInstance.update('none');
			}
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
	bind:clientWidth={containerWidth}
>
	<div class="min-w-[300px]" style="height: {height}px;">
		<canvas bind:this={canvasElement}></canvas>
	</div>
</div>
