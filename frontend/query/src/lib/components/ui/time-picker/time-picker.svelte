<script lang="ts">
	import { Clock } from '@lucide/svelte';
	import { cn } from '$lib/utils';

	interface Props {
		value?: string;
		disabled?: boolean;
		label?: string;
		min?: string;
		max?: string;
		step?: number;
		onchange?: (value: string) => void;
		class?: string;
		id?: string;
	}

	let {
		value = $bindable(''),
		disabled = false,
		label,
		min,
		max,
		step,
		onchange,
		class: className,
		id
	}: Props = $props();

	// Generate unique ID for accessibility
	const inputId = $derived(id ?? `timepicker-${Math.random().toString(36).slice(2, 9)}`);

	function handleChange(event: Event) {
		const target = event.target as HTMLInputElement;
		value = target.value;
		onchange?.(target.value);
	}

	// Format time for display (12h or 24h based on locale)
	function formatTimeDisplay(time: string): string {
		if (!time) return '';
		try {
			const [hours, minutes] = time.split(':');
			const date = new Date();
			date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
			return date.toLocaleTimeString(undefined, {
				hour: 'numeric',
				minute: '2-digit'
			});
		} catch {
			return time;
		}
	}
</script>

<div class={cn('relative', className)}>
	{#if label}
		<label for={inputId} class="block text-sm font-medium text-headers mb-1.5">
			{label}
		</label>
	{/if}

	<div class="relative">
		<input
			id={inputId}
			type="time"
			{value}
			{disabled}
			{min}
			{max}
			{step}
			onchange={handleChange}
			class={cn(
				'w-full min-h-[44px] px-3 py-2 pr-10',
				'bg-card border-2 border-secondary rounded-[var(--radius-card)]',
				'text-headers transition-colors',
				'hover:border-secondary-dark focus:outline-none focus:border-primary',
				'disabled:opacity-50 disabled:cursor-not-allowed',
				!value && 'text-meta'
			)}
		/>
		<Clock
			class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-meta pointer-events-none"
		/>
	</div>
</div>
