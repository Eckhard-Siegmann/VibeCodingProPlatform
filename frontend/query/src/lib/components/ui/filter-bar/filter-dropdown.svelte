<script lang="ts">
	import { Select as SelectPrimitive } from 'bits-ui';
	import { ChevronDown, Check } from '@lucide/svelte';
	import { cn } from '$lib/utils';

	export interface FilterOption {
		value: string;
		label: string;
	}

	interface Props {
		options: FilterOption[];
		value?: string;
		label?: string;
		placeholder?: string;
		disabled?: boolean;
		onchange?: (value: string) => void;
		class?: string;
	}

	let {
		options,
		value = $bindable(''),
		label,
		placeholder = 'All',
		disabled = false,
		onchange,
		class: className
	}: Props = $props();

	let open = $state(false);

	const selectedOption = $derived(options.find((opt) => opt.value === value));

	function handleSelect(optionValue: string) {
		value = optionValue;
		onchange?.(optionValue);
		open = false;
	}
</script>

<div class={cn('relative', className)}>
	<SelectPrimitive.Root
		type="single"
		bind:open
		{disabled}
	>
		<SelectPrimitive.Trigger
			class={cn(
				'inline-flex items-center gap-2 px-3 py-1.5',
				'min-h-[36px] min-w-[100px]',
				'bg-card border border-secondary rounded-[var(--radius-card)]',
				'text-sm text-headers transition-colors',
				'hover:border-secondary-dark focus-visible:outline-none focus-visible:border-primary',
				'disabled:opacity-50 disabled:cursor-not-allowed'
			)}
		>
			{#if label}
				<span class="text-meta">{label}:</span>
			{/if}
			<span class="truncate">
				{selectedOption?.label ?? placeholder}
			</span>
			<ChevronDown
				class={cn(
					'w-3.5 h-3.5 text-meta transition-transform flex-shrink-0',
					open && 'rotate-180'
				)}
			/>
		</SelectPrimitive.Trigger>

		<SelectPrimitive.Portal>
			<SelectPrimitive.Content
				class={cn(
					'z-50 min-w-[8rem] w-[var(--bits-select-trigger-width)]',
					'bg-card rounded-[var(--radius-card)] shadow-[var(--shadow-floating)]',
					'border border-secondary overflow-hidden py-1',
					'data-[state=open]:animate-in data-[state=closed]:animate-out',
					'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
					'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
					'data-[side=bottom]:slide-in-from-top-2',
					'data-[side=top]:slide-in-from-bottom-2'
				)}
				sideOffset={4}
			>
				<SelectPrimitive.Viewport class="max-h-[200px] overflow-y-auto">
					{#each options as option (option.value)}
						<SelectPrimitive.Item
							value={option.value}
							label={option.label}
							class={cn(
								'relative flex items-center px-3 py-2 pr-8',
								'text-sm text-headers',
								'cursor-pointer select-none outline-none',
								'data-[highlighted]:bg-canvas',
								value === option.value && 'bg-primary/5'
							)}
							onclick={() => handleSelect(option.value)}
						>
							<span class="truncate">{option.label}</span>
							{#if value === option.value}
								<Check class="absolute right-3 w-3.5 h-3.5 text-primary" />
							{/if}
						</SelectPrimitive.Item>
					{/each}
				</SelectPrimitive.Viewport>
			</SelectPrimitive.Content>
		</SelectPrimitive.Portal>
	</SelectPrimitive.Root>
</div>
