<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { cn } from '$lib/utils';
	import { getColor } from '$lib/utils/colors';
	import {
		Chart,
		LineController,
		LineElement,
		PointElement,
		CategoryScale,
		LinearScale
	} from 'chart.js';

	// Register Chart.js components
	Chart.register(LineController, LineElement, PointElement, CategoryScale, LinearScale);

	interface Props {
		values: number[];
		color?: string;
		width?: number;
		height?: number;
		class?: string;
	}

	let {
		values,
		color, // Will be set dynamically from CSS var
		width = 60,
		height = 20,
		class: className
	}: Props = $props();

	// Default color from CSS custom property
	let defaultColor = $state('#2680F1'); // Fallback

	$effect(() => {
		if (browser && !color) {
			defaultColor = getColor('color-primary', '#2680F1');
		}
	});

	// Use provided color or default
	const lineColor = $derived(color ?? defaultColor);

	let canvasElement: HTMLCanvasElement;
	let chartInstance: Chart | null = null;

	function createChart() {
		if (!canvasElement || values.length === 0) return;

		// Destroy existing chart
		if (chartInstance) {
			chartInstance.destroy();
			chartInstance = null;
		}

		const ctx = canvasElement.getContext('2d');
		if (!ctx) return;

		// Generate labels (just indices, not displayed)
		const labels = values.map((_, i) => String(i));

		chartInstance = new Chart(ctx, {
			type: 'line',
			data: {
				labels,
				datasets: [
					{
						data: values,
						borderColor: lineColor,
						borderWidth: 1.5,
						fill: false,
						tension: 0.3,
						pointRadius: 0,
						pointHoverRadius: 0
					}
				]
			},
			options: {
				responsive: false,
				maintainAspectRatio: false,
				animation: false, // No animation for sparklines
				interaction: {
					mode: 'nearest',
					intersect: false
				},
				plugins: {
					legend: {
						display: false
					},
					tooltip: {
						enabled: false // No tooltips for sparklines
					}
				},
				scales: {
					x: {
						display: false // No axes for sparklines
					},
					y: {
						display: false // No axes for sparklines
					}
				},
				elements: {
					line: {
						borderJoinStyle: 'round'
					}
				}
			}
		});
	}

	// Reactive update when data changes
	$effect(() => {
		if (chartInstance && values) {
			chartInstance.data.labels = values.map((_, i) => String(i));
			chartInstance.data.datasets[0].data = values;
			chartInstance.data.datasets[0].borderColor = color;
			chartInstance.update('none');
		} else if (values && values.length > 0) {
			createChart();
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
	class={cn('inline-block', className)}
	style="width: {width}px; height: {height}px;"
>
	<canvas
		bind:this={canvasElement}
		width={width}
		height={height}
		style="width: {width}px; height: {height}px;"
	></canvas>
</div>
