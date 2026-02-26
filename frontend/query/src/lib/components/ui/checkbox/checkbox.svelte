<script lang="ts">
	import { Checkbox as CheckboxPrimitive } from 'bits-ui';
	import { Check, Minus } from '@lucide/svelte';
	import { cn } from '$lib/utils';

	interface Props {
		checked?: boolean | 'indeterminate';
		disabled?: boolean;
		name?: string;
		label?: string;
		description?: string;
		onchange?: (checked: boolean | 'indeterminate') => void;
		class?: string;
		id?: string;
	}

	let {
		checked = $bindable(false),
		disabled = false,
		name,
		label,
		description,
		onchange,
		class: className,
		id
	}: Props = $props();

	// Generate unique ID for accessibility
	const inputId = $derived(id ?? `checkbox-${Math.random().toString(36).slice(2, 9)}`);

	function handleCheckedChange(newChecked: boolean | 'indeterminate') {
		checked = newChecked;
		onchange?.(newChecked);
	}

	// Compute visual state
	const isChecked = $derived(checked === true);
	const isIndeterminate = $derived(checked === 'indeterminate');
</script>

<div class={cn('flex items-start gap-3', className)}>
	<CheckboxPrimitive.Root
		{id}
		checked={isChecked}
		indeterminate={isIndeterminate}
		{disabled}
		onCheckedChange={handleCheckedChange}
		class={cn(
			'peer relative flex-shrink-0 h-6 w-6 rounded-md border-2 transition-colors',
			'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
			'disabled:opacity-50 disabled:cursor-not-allowed',
			isChecked || isIndeterminate
				? 'bg-primary border-primary'
				: 'bg-card border-secondary-dark hover:border-primary/50'
		)}
	>
		{#snippet children({ checked: checkState, indeterminate })}
			{#if checkState}
				<Check class="absolute inset-0 m-auto w-4 h-4 text-white" strokeWidth={3} />
			{:else if indeterminate}
				<Minus class="absolute inset-0 m-auto w-4 h-4 text-white" strokeWidth={3} />
			{/if}
		{/snippet}
	</CheckboxPrimitive.Root>

	{#if label || description}
		<label
			for={inputId}
			class={cn(
				'flex flex-col gap-0.5 cursor-pointer select-none',
				disabled && 'cursor-not-allowed opacity-50'
			)}
		>
			{#if label}
				<span class="text-sm font-medium text-headers leading-tight">
					{label}
				</span>
			{/if}
			{#if description}
				<span class="text-xs text-labels leading-snug">
					{description}
				</span>
			{/if}
		</label>
	{/if}
</div>
