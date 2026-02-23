<script lang="ts">
	import { cn } from '$lib/utils';
	import { Button } from '$lib/components/ui/button';
	import { FormDialog } from '$lib/components/ui/form-dialog';
	import ChevronUp from '@lucide/svelte/icons/chevron-up';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import Plus from '@lucide/svelte/icons/plus';
	import Minus from '@lucide/svelte/icons/minus';
	import X from '@lucide/svelte/icons/x';
	import AlertCircle from '@lucide/svelte/icons/alert-circle';
	import Search from '@lucide/svelte/icons/search';

	export interface InventoryItem {
		item_key: string;
		short_label: string;
		max_rating: number;
	}

	export interface InventoryData {
		inventory_id?: string;
		inventory_key: string;
		name: string;
		description?: string;
		context?: string;
		items: string[]; // Array of item_keys in order
	}

	interface Props {
		inventory?: InventoryData | null;
		availableItems: InventoryItem[];
		open: boolean;
		mode: 'create' | 'edit' | 'clone';
		onSave: (inventory: InventoryData) => void | Promise<void>;
		onCancel: () => void;
		class?: string;
	}

	let {
		inventory = null,
		availableItems,
		open = $bindable(),
		mode,
		onSave,
		onCancel,
		class: className
	}: Props = $props();

	// Form state - initialized empty, populated by $effect below
	let inventoryKey = $state('');
	let name = $state('');
	let description = $state('');
	let context = $state('');
	let selectedItemKeys: string[] = $state([]);

	// UI state
	let searchQuery = $state('');
	let availableSelection: Set<string> = $state(new Set());
	let inventorySelection: Set<string> = $state(new Set());

	// Validation state
	let errors: Record<string, string> = $state({});

	// Detect mobile viewport
	let isMobile = $state(false);

	$effect(() => {
		if (typeof window !== 'undefined') {
			const checkMobile = () => {
				isMobile = window.innerWidth < 768;
			};
			checkMobile();
			window.addEventListener('resize', checkMobile);
			return () => window.removeEventListener('resize', checkMobile);
		}
	});

	// Reset form when dialog opens
	$effect(() => {
		if (open) {
			inventoryKey = mode === 'clone' ? '' : (inventory?.inventory_key ?? '');
			name = inventory?.name ?? '';
			description = inventory?.description ?? '';
			context = inventory?.context ?? '';
			selectedItemKeys = [...(inventory?.items ?? [])];
			searchQuery = '';
			availableSelection = new Set();
			inventorySelection = new Set();
			errors = {};
		}
	});

	// Compute available items (not in inventory)
	const filteredAvailableItems = $derived(() => {
		const inInventory = new Set(selectedItemKeys);
		return availableItems
			.filter((item) => !inInventory.has(item.item_key))
			.filter(
				(item) =>
					!searchQuery ||
					item.item_key.toLowerCase().includes(searchQuery.toLowerCase()) ||
					item.short_label.toLowerCase().includes(searchQuery.toLowerCase())
			);
	});

	// Compute inventory items with details
	const inventoryItems = $derived(() => {
		const itemMap = new Map(availableItems.map((item) => [item.item_key, item]));
		return selectedItemKeys
			.map((key) => itemMap.get(key))
			.filter((item): item is InventoryItem => item !== undefined);
	});

	// Context options
	const contextOptions = [
		{ value: '', label: 'Select context...' },
		{ value: 'pitch', label: 'Pitch Assessment' },
		{ value: 'review', label: 'Review Assessment' },
		{ value: 'self_assessment', label: 'Self Assessment' },
		{ value: 'problem_evaluation', label: 'Problem Evaluation' }
	];

	// Toggle selection in available list
	function toggleAvailableSelection(itemKey: string) {
		const newSelection = new Set(availableSelection);
		if (newSelection.has(itemKey)) {
			newSelection.delete(itemKey);
		} else {
			newSelection.add(itemKey);
		}
		availableSelection = newSelection;
	}

	// Toggle selection in inventory list
	function toggleInventorySelection(itemKey: string) {
		const newSelection = new Set(inventorySelection);
		if (newSelection.has(itemKey)) {
			newSelection.delete(itemKey);
		} else {
			newSelection.add(itemKey);
		}
		inventorySelection = newSelection;
	}

	// Add selected items to inventory
	function addSelectedToInventory() {
		const newKeys = [...selectedItemKeys, ...availableSelection];
		selectedItemKeys = newKeys;
		availableSelection = new Set();
	}

	// Remove selected items from inventory
	function removeSelectedFromInventory() {
		const toRemove = inventorySelection;
		selectedItemKeys = selectedItemKeys.filter((key) => !toRemove.has(key));
		inventorySelection = new Set();
	}

	// Move item up in inventory
	function moveItemUp(index: number) {
		if (index <= 0) return;
		const newKeys = [...selectedItemKeys];
		[newKeys[index - 1], newKeys[index]] = [newKeys[index], newKeys[index - 1]];
		selectedItemKeys = newKeys;
	}

	// Move item down in inventory
	function moveItemDown(index: number) {
		if (index >= selectedItemKeys.length - 1) return;
		const newKeys = [...selectedItemKeys];
		[newKeys[index], newKeys[index + 1]] = [newKeys[index + 1], newKeys[index]];
		selectedItemKeys = newKeys;
	}

	// Remove single item from inventory
	function removeItem(itemKey: string) {
		selectedItemKeys = selectedItemKeys.filter((k) => k !== itemKey);
		inventorySelection.delete(itemKey);
		inventorySelection = inventorySelection;
	}

	// Validation
	function validate(): boolean {
		const newErrors: Record<string, string> = {};

		if (!inventoryKey.trim()) {
			newErrors.inventoryKey = 'Inventory key is required';
		} else if (!/^[a-z][a-z0-9_]*$/.test(inventoryKey)) {
			newErrors.inventoryKey =
				'Must start with lowercase letter, contain only lowercase letters, numbers, and underscores';
		}

		if (!name.trim()) {
			newErrors.name = 'Name is required';
		}

		if (selectedItemKeys.length === 0) {
			newErrors.items = 'At least one item is required';
		}

		errors = newErrors;
		return Object.keys(newErrors).length === 0;
	}

	// Handle save
	async function handleSubmit() {
		if (!validate()) return;

		const inventoryData: InventoryData = {
			inventory_id: mode === 'edit' ? inventory?.inventory_id : undefined,
			inventory_key: inventoryKey.trim(),
			name: name.trim(),
			description: description.trim() || undefined,
			context: context || undefined,
			items: selectedItemKeys
		};

		await onSave(inventoryData);
	}

	// Get title based on mode
	const dialogTitle = $derived(
		mode === 'create'
			? 'Create New Inventory'
			: mode === 'clone'
				? 'Clone Inventory'
				: 'Edit Inventory'
	);
</script>

<FormDialog
	bind:open
	title={dialogTitle}
	description="Assemble an ordered set of evaluation items for assessments."
	submitLabel={mode === 'edit' ? 'Save Changes' : 'Create Inventory'}
	onsubmit={handleSubmit}
	oncancel={onCancel}
	class={cn('sm:max-w-3xl', className)}
>
	<div class="space-y-6">
		<!-- Basic Info -->
		<div class="grid gap-4 md:grid-cols-2">
			<!-- Inventory Key -->
			<div class="space-y-1.5">
				<label for="inventory-key" class="block text-sm font-medium text-headers">
					Inventory Key
					{#if mode === 'edit'}
						<span class="text-meta font-normal">(locked)</span>
					{/if}
				</label>
				<input
					id="inventory-key"
					type="text"
					bind:value={inventoryKey}
					disabled={mode === 'edit'}
					placeholder="e.g., pitch_assessment"
					class={cn(
						'w-full px-3 py-2 min-h-[44px]',
						'bg-card border-2 rounded-[var(--radius-card)]',
						'text-headers placeholder:text-meta',
						'focus:outline-none focus:border-primary',
						'disabled:bg-canvas disabled:text-meta disabled:cursor-not-allowed',
						errors.inventoryKey ? 'border-alert' : 'border-secondary'
					)}
				/>
				{#if errors.inventoryKey}
					<p class="flex items-center gap-1 text-sm text-alert">
						<AlertCircle class="w-4 h-4" />
						{errors.inventoryKey}
					</p>
				{/if}
			</div>

			<!-- Name -->
			<div class="space-y-1.5">
				<label for="inventory-name" class="block text-sm font-medium text-headers">Name</label>
				<input
					id="inventory-name"
					type="text"
					bind:value={name}
					placeholder="e.g., Pitch Assessment"
					class={cn(
						'w-full px-3 py-2 min-h-[44px]',
						'bg-card border-2 rounded-[var(--radius-card)]',
						'text-headers placeholder:text-meta',
						'focus:outline-none focus:border-primary',
						errors.name ? 'border-alert' : 'border-secondary'
					)}
				/>
				{#if errors.name}
					<p class="flex items-center gap-1 text-sm text-alert">
						<AlertCircle class="w-4 h-4" />
						{errors.name}
					</p>
				{/if}
			</div>
		</div>

		<!-- Description -->
		<div class="space-y-1.5">
			<label for="inventory-description" class="block text-sm font-medium text-headers">
				Description (optional)
			</label>
			<textarea
				id="inventory-description"
				bind:value={description}
				rows={2}
				placeholder="Purpose and usage of this inventory"
				class={cn(
					'w-full px-3 py-2',
					'bg-card border-2 border-secondary rounded-[var(--radius-card)]',
					'text-headers placeholder:text-meta resize-y',
					'focus:outline-none focus:border-primary'
				)}
			></textarea>
		</div>

		<!-- Context -->
		<div class="space-y-1.5">
			<label for="inventory-context" class="block text-sm font-medium text-headers">
				Context (optional)
			</label>
			<select
				id="inventory-context"
				bind:value={context}
				class={cn(
					'w-full px-3 py-2 min-h-[44px]',
					'bg-card border-2 border-secondary rounded-[var(--radius-card)]',
					'text-headers',
					'focus:outline-none focus:border-primary'
				)}
			>
				{#each contextOptions as option}
					<option value={option.value}>{option.label}</option>
				{/each}
			</select>
		</div>

		<!-- Shuttle Interface -->
		<div class="space-y-2 pt-2 border-t border-secondary">
			<h3 class="text-sm font-medium text-headers">
				Items
				{#if errors.items}
					<span class="text-alert font-normal ml-2">- {errors.items}</span>
				{/if}
			</h3>

			<!-- Mobile: Vertical layout -->
			<!-- Desktop: Side-by-side layout -->
			<div class={cn('gap-4', isMobile ? 'space-y-4' : 'grid grid-cols-[1fr,auto,1fr]')}>
				<!-- Available Items -->
				<div class="space-y-2">
					<div class="flex items-center justify-between">
						<span class="text-sm text-meta">Available Items ({filteredAvailableItems().length})</span>
					</div>

					<!-- Search -->
					<div class="relative">
						<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-meta" />
						<input
							type="text"
							bind:value={searchQuery}
							placeholder="Search items..."
							class={cn(
								'w-full pl-9 pr-3 py-2 min-h-[40px]',
								'bg-canvas border border-secondary rounded-[var(--radius-card)]',
								'text-sm text-headers placeholder:text-meta',
								'focus:outline-none focus:border-primary'
							)}
						/>
					</div>

					<!-- Available List -->
					<div
						class={cn(
							'border border-secondary rounded-[var(--radius-card)] overflow-hidden',
							'max-h-[200px] md:max-h-[300px] overflow-y-auto'
						)}
					>
						{#if filteredAvailableItems().length === 0}
							<div class="p-4 text-center text-sm text-meta">
								{searchQuery ? 'No items match your search' : 'All items are in the inventory'}
							</div>
						{:else}
							{#each filteredAvailableItems() as item (item.item_key)}
								<button
									type="button"
									onclick={() => toggleAvailableSelection(item.item_key)}
									class={cn(
										'w-full flex items-center gap-2 px-3 py-2 min-h-[44px]',
										'text-left text-sm transition-colors',
										'border-b border-secondary/50 last:border-b-0',
										availableSelection.has(item.item_key)
											? 'bg-primary/10 text-primary'
											: 'bg-card hover:bg-canvas text-headers'
									)}
								>
									<input
										type="checkbox"
										checked={availableSelection.has(item.item_key)}
										class="w-4 h-4 rounded border-secondary accent-primary"
										tabindex={-1}
									/>
									<span class="flex-1 truncate">{item.short_label || item.item_key}</span>
									<span class="text-xs text-meta">{item.max_rating}pt</span>
								</button>
							{/each}
						{/if}
					</div>
				</div>

				<!-- Shuttle Buttons -->
				<div
					class={cn(
						'flex gap-2',
						isMobile ? 'justify-center' : 'flex-col items-center justify-center'
					)}
				>
					<Button
						type="button"
						variant="secondary"
						size={isMobile ? 'md' : 'icon'}
						onclick={addSelectedToInventory}
						disabled={availableSelection.size === 0}
						title="Add selected items"
						class={isMobile ? 'flex-1' : ''}
					>
						{#if isMobile}
							Add Selected
						{/if}
						<ChevronDown class={cn('w-5 h-5', isMobile && 'ml-1')} />
					</Button>
					<Button
						type="button"
						variant="secondary"
						size={isMobile ? 'md' : 'icon'}
						onclick={removeSelectedFromInventory}
						disabled={inventorySelection.size === 0}
						title="Remove selected items"
						class={isMobile ? 'flex-1' : ''}
					>
						{#if isMobile}
							Remove Selected
						{/if}
						<ChevronUp class={cn('w-5 h-5', isMobile && 'ml-1')} />
					</Button>
				</div>

				<!-- Inventory Items (Ordered) -->
				<div class="space-y-2">
					<div class="flex items-center justify-between">
						<span class="text-sm text-meta">
							Inventory Items ({selectedItemKeys.length})
						</span>
					</div>

					<!-- Inventory List -->
					<div
						class={cn(
							'border border-secondary rounded-[var(--radius-card)] overflow-hidden',
							'max-h-[200px] md:max-h-[300px] overflow-y-auto',
							errors.items && 'border-alert'
						)}
					>
						{#if inventoryItems().length === 0}
							<div class="p-4 text-center text-sm text-meta">
								No items added yet. Select items from the available list.
							</div>
						{:else}
							{#each inventoryItems() as item, index (item.item_key)}
								<div
									class={cn(
										'flex items-center gap-2 px-3 py-2 min-h-[44px]',
										'border-b border-secondary/50 last:border-b-0',
										inventorySelection.has(item.item_key)
											? 'bg-primary/10'
											: 'bg-card hover:bg-canvas'
									)}
								>
									<button
										type="button"
										onclick={() => toggleInventorySelection(item.item_key)}
										class="flex items-center gap-2 flex-1 min-w-0 text-left"
									>
										<span class="text-xs text-meta w-5 text-center">{index + 1}.</span>
										<input
											type="checkbox"
											checked={inventorySelection.has(item.item_key)}
											class="w-4 h-4 rounded border-secondary accent-primary"
											tabindex={-1}
										/>
										<span class="flex-1 truncate text-sm text-headers">
											{item.short_label || item.item_key}
										</span>
									</button>

									<!-- Reorder and Remove buttons -->
									<div class="flex items-center gap-1 flex-shrink-0">
										<button
											type="button"
											onclick={() => moveItemUp(index)}
											disabled={index === 0}
											class={cn(
												'p-1.5 rounded transition-colors',
												'hover:bg-canvas disabled:opacity-30 disabled:cursor-not-allowed'
											)}
											title="Move up"
										>
											<ChevronUp class="w-4 h-4 text-meta" />
										</button>
										<button
											type="button"
											onclick={() => moveItemDown(index)}
											disabled={index === selectedItemKeys.length - 1}
											class={cn(
												'p-1.5 rounded transition-colors',
												'hover:bg-canvas disabled:opacity-30 disabled:cursor-not-allowed'
											)}
											title="Move down"
										>
											<ChevronDown class="w-4 h-4 text-meta" />
										</button>
										<button
											type="button"
											onclick={() => removeItem(item.item_key)}
											class="p-1.5 rounded transition-colors hover:bg-alert/10"
											title="Remove"
										>
											<X class="w-4 h-4 text-alert" />
										</button>
									</div>
								</div>
							{/each}
						{/if}
					</div>
				</div>
			</div>
		</div>

		<!-- Warning for edit mode -->
		{#if mode === 'edit'}
			<div class="p-3 bg-warning-bg border border-warning rounded-[var(--radius-card)]">
				<p class="text-sm text-warning flex items-start gap-2">
					<AlertCircle class="w-4 h-4 mt-0.5 flex-shrink-0" />
					<span>
						Saving changes will <strong>retire</strong> the current inventory and create a new
						version. Existing assessments will retain the historical inventory version.
					</span>
				</p>
			</div>
		{/if}
	</div>
</FormDialog>
