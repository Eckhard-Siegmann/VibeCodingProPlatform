<script lang="ts">
	import { Users } from '@lucide/svelte';
	import { cn } from '$lib/utils';

	interface Props {
		registered: number;
		capacity: number;
		waitlistCount?: number;
		showLabel?: boolean;
		class?: string;
	}

	let {
		registered,
		capacity,
		waitlistCount = 0,
		showLabel = true,
		class: className
	}: Props = $props();

	// Calculate percentage for color coding per Ch.29.5
	const percentage = $derived((registered / capacity) * 100);

	// Color thresholds: green <70%, yellow 70-90%, red >90%
	const colorClass = $derived.by(() => {
		if (waitlistCount > 0) {
			return 'text-purple'; // Purple for waitlisted
		}
		if (percentage > 90) {
			return 'text-alert'; // Red
		}
		if (percentage >= 70) {
			return 'text-pending'; // Yellow
		}
		return 'text-success'; // Green
	});

	// Icon background color
	const iconBgClass = $derived.by(() => {
		if (waitlistCount > 0) {
			return 'bg-purple-bg';
		}
		if (percentage > 90) {
			return 'bg-red-100';
		}
		if (percentage >= 70) {
			return 'bg-amber-100';
		}
		return 'bg-green-100';
	});
</script>

<div class={cn('inline-flex items-center gap-2', className)}>
	<span class={cn('p-1.5 rounded-full', iconBgClass)}>
		<Users class={cn('w-4 h-4', colorClass)} />
	</span>
	<span class={cn('text-sm font-medium', colorClass)}>
		{registered}/{capacity}
		{#if showLabel}
			<span class="text-labels font-normal">registered</span>
		{/if}
	</span>
	{#if waitlistCount > 0}
		<span class="text-xs text-purple bg-purple-bg px-2 py-0.5 rounded-full">
			+{waitlistCount} waitlist
		</span>
	{/if}
</div>
