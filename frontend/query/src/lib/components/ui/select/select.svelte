<script lang="ts">
	import { Select as SelectPrimitive } from 'bits-ui';
	import { ChevronDown, Check, Search } from '@lucide/svelte';
	import { cn } from '$lib/utils';

	export interface SelectOption {
		value: string;
		label: string;
		disabled?: boolean;
	}

	interface Props {
		options: SelectOption[];
		value?: string;
		placeholder?: string;
		disabled?: boolean;
		searchable?: boolean;
		label?: string;
		onchange?: (value: string) => void;
		class?: string;
	}

	let {
		options,
		value = $bindable(),
		placeholder = 'Select an option',
		disabled = false,
		searchable,
		label,
		onchange,
		class: className
	}: Props = $props();

	let open = $state(false);
	let searchQuery = $state('');

	// Auto-enable search for lists >10 items
	const isSearchable = $derived(searchable ?? options.length > 10);

	const filteredOptions = $derived(
		isSearchable && searchQuery
			? options.filter((opt) => opt.label.toLowerCase().includes(searchQuery.toLowerCase()))
			: options
	);

	const selectedOption = $derived(options.find((opt) => opt.value === value));

	function handleSelect(optionValue: string) {
		value = optionValue;
		onchange?.(optionValue);
		open = false;
		searchQuery = '';
	}

	function handleOpenChange(isOpen: boolean) {
		open = isOpen;
		if (!isOpen) {
			searchQuery = '';
		}
	}
</script>

<div class={cn('relative', className)}>
	{#if label}
		<span class="block text-sm font-medium text-headers mb-1.5">
			{label}
		</span>
	{/if}

	<SelectPrimitive.Root
		type="single"
		bind:open
		onOpenChange={handleOpenChange}
		{disabled}
	>
		<SelectPrimitive.Trigger
			class={cn(
				'flex items-center justify-between w-full min-h-[44px] px-3 py-2',
				'bg-card border-2 border-secondary rounded-[var(--radius-card)]',
				'text-left text-headers transition-colors',
				'hover:border-secondary-dark focus-visible:outline-none focus-visible:border-primary',
				'disabled:opacity-50 disabled:cursor-not-allowed',
				!selectedOption && 'text-meta'
			)}
		>
			<span class="truncate">
				{selectedOption?.label ?? placeholder}
			</span>
			<ChevronDown
				class={cn(
					'w-4 h-4 text-meta transition-transform flex-shrink-0 ml-2',
					open && 'rotate-180'
				)}
			/>
		</SelectPrimitive.Trigger>

		<SelectPrimitive.Portal>
			<SelectPrimitive.Content
				class={cn(
					'z-50 min-w-[8rem] w-[var(--bits-select-trigger-width)]',
					'bg-card rounded-[var(--radius-card)] shadow-[var(--shadow-floating)]',
					'border border-secondary overflow-hidden',
					'data-[state=open]:animate-in data-[state=closed]:animate-out',
					'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
					'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
					'data-[side=bottom]:slide-in-from-top-2',
					'data-[side=top]:slide-in-from-bottom-2'
				)}
				sideOffset={4}
			>
				{#if isSearchable}
					<div class="p-2 border-b border-secondary">
						<div class="relative">
							<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-meta" />
							<input
								type="text"
								bind:value={searchQuery}
								placeholder="Search..."
								class={cn(
									'w-full pl-9 pr-3 py-2 min-h-[40px]',
									'bg-canvas border border-secondary rounded-[var(--radius-card)]',
									'text-sm text-headers placeholder:text-meta',
									'focus:outline-none focus:border-primary'
								)}
							/>
						</div>
					</div>
				{/if}

				<SelectPrimitive.Viewport class="p-1 max-h-[300px] overflow-y-auto">
					{#if filteredOptions.length === 0}
						<div class="py-3 px-4 text-sm text-meta text-center">
							No options found
						</div>
					{:else}
						{#each filteredOptions as option (option.value)}
							<SelectPrimitive.Item
								value={option.value}
								label={option.label}
								disabled={option.disabled}
								class={cn(
									'relative flex items-center min-h-[44px] md:min-h-[40px] px-3 py-2 pr-8',
									'text-sm text-headers rounded-[calc(var(--radius-card)-4px)]',
									'cursor-pointer select-none outline-none',
									'data-[highlighted]:bg-canvas',
									'data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed',
									value === option.value && 'bg-primary/5'
								)}
								onclick={() => handleSelect(option.value)}
							>
								<span class="truncate">{option.label}</span>
								{#if value === option.value}
									<Check class="absolute right-3 w-4 h-4 text-primary" />
								{/if}
							</SelectPrimitive.Item>
						{/each}
					{/if}
				</SelectPrimitive.Viewport>
			</SelectPrimitive.Content>
		</SelectPrimitive.Portal>
	</SelectPrimitive.Root>
</div>
