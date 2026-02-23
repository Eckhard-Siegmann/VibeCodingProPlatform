<script lang="ts">
	import { Checkbox as CheckboxPrimitive } from 'bits-ui';
	import { Check } from '@lucide/svelte';
	import { cn } from '$lib/utils';

	interface Props {
		checked?: boolean;
		label: string;
		disabled?: boolean;
		onchange?: (checked: boolean) => void;
		class?: string;
	}

	let {
		checked = $bindable(false),
		label,
		disabled = false,
		onchange,
		class: className
	}: Props = $props();

	function handleCheckedChange(newChecked: boolean | 'indeterminate') {
		if (newChecked !== 'indeterminate') {
			checked = newChecked;
			onchange?.(newChecked);
		}
	}
</script>

<label
	class={cn(
		'inline-flex items-center gap-2 cursor-pointer select-none',
		disabled && 'cursor-not-allowed opacity-50',
		className
	)}
>
	<CheckboxPrimitive.Root
		bind:checked
		{disabled}
		onCheckedChange={handleCheckedChange}
		class={cn(
			'relative flex-shrink-0 h-5 w-5 rounded border-2 transition-colors',
			'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
			checked
				? 'bg-primary border-primary'
				: 'bg-card border-secondary-dark hover:border-primary/50'
		)}
	>
		{#snippet children({ checked: isChecked })}
			{#if isChecked}
				<Check class="absolute inset-0 m-auto w-3 h-3 text-white" strokeWidth={3} />
			{/if}
		{/snippet}
	</CheckboxPrimitive.Root>

	<span class="text-sm text-headers">{label}</span>
</label>
