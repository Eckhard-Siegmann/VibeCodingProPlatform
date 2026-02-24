<script lang="ts">
	import { cn } from '$lib/utils';
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { DataTable, type TableColumn, type TableAction } from '$lib/components/ui/data-table';
	import { InventoryEditor, type InventoryData, type InventoryItem } from '$lib/components/admin';
	import Plus from '@lucide/svelte/icons/plus';
	import Edit from '@lucide/svelte/icons/pencil';
	import Copy from '@lucide/svelte/icons/copy';
	import Archive from '@lucide/svelte/icons/archive';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';

	interface Props {
		data?: {
			inventories: (InventoryData & { is_active: boolean; item_count: number; created_at: string })[];
			availableItems: InventoryItem[];
		};
	}

	let { data }: Props = $props();

	// Demo available items
	const demoAvailableItems: InventoryItem[] = [
		{ item_key: 'correctness', short_label: 'Correctness', max_rating: 5 },
		{ item_key: 'test_support', short_label: 'Test Support', max_rating: 5 },
		{ item_key: 'code_readability', short_label: 'Code Readability', max_rating: 5 },
		{ item_key: 'simplicity', short_label: 'Simplicity', max_rating: 5 },
		{ item_key: 'elegance', short_label: 'Elegance', max_rating: 5 },
		{ item_key: 'extensibility', short_label: 'Extensibility', max_rating: 5 },
		{ item_key: 'problem_clarity', short_label: 'Problem Clarity', max_rating: 5 },
		{ item_key: 'acceptance_criteria', short_label: 'Acceptance Criteria', max_rating: 5 },
		{ item_key: 'testability', short_label: 'Testability', max_rating: 5 },
		{ item_key: 'complexity_fit', short_label: 'Complexity Fit', max_rating: 5 },
		{ item_key: 'engagement', short_label: 'Engagement', max_rating: 5 },
		{ item_key: 'cognitive_load', short_label: 'Cognitive Load', max_rating: 7 }
	];

	// Demo inventories
	const demoInventories: (InventoryData & { is_active: boolean; item_count: number; created_at: string })[] = [
		{
			inventory_id: '1',
			inventory_key: 'pitch_assessment',
			name: 'Pitch Assessment',
			description: 'Evaluate problem clarity and pitch quality',
			context: 'pitch',
			items: ['problem_clarity', 'acceptance_criteria', 'testability', 'complexity_fit', 'engagement'],
			is_active: true,
			item_count: 5,
			created_at: '2026-01-15T10:00:00Z'
		},
		{
			inventory_id: '2',
			inventory_key: 'review_assessment',
			name: 'Review Assessment',
			description: 'Evaluate solution quality after coding sprint',
			context: 'review',
			items: ['correctness', 'test_support', 'code_readability', 'simplicity', 'elegance', 'extensibility'],
			is_active: true,
			item_count: 6,
			created_at: '2026-01-15T10:05:00Z'
		},
		{
			inventory_id: '3',
			inventory_key: 'self_assessment',
			name: 'Self Assessment',
			description: 'Problem owner self-review before submission',
			context: 'self_assessment',
			items: ['problem_clarity', 'acceptance_criteria', 'testability'],
			is_active: true,
			item_count: 3,
			created_at: '2026-01-15T10:10:00Z'
		}
	];

	let inventories = $state(demoInventories);
	let availableItems = $state(demoAvailableItems);

	// Sync from server data when available
	$effect(() => {
		if (data?.inventories) inventories = data.inventories;
		if (data?.availableItems) availableItems = data.availableItems;
	});

	// Editor state
	let editorOpen = $state(false);
	let editorMode = $state<'create' | 'edit' | 'clone'>('create');
	let selectedInventory = $state<InventoryData | null>(null);

	// Show retired inventories
	let showRetired = $state(false);

	// Filtered inventories
	const filteredInventories = $derived(() => {
		if (showRetired) {
			return inventories;
		}
		return inventories.filter((inv) => inv.is_active !== false);
	});

	// Format date
	function formatDate(isoString: string): string {
		return new Date(isoString).toLocaleDateString('en-GB', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});
	}

	// Get context label
	function getContextLabel(context?: string): string {
		switch (context) {
			case 'pitch':
				return 'Pitch';
			case 'review':
				return 'Review';
			case 'self_assessment':
				return 'Self Assessment';
			case 'problem_evaluation':
				return 'Problem Evaluation';
			default:
				return 'General';
		}
	}

	// Table columns
	const columns: TableColumn<InventoryData>[] = [
		{
			key: 'name',
			header: 'Name',
			primary: true
		},
		{
			key: 'inventory_key',
			header: 'Key',
			hideInCard: true
		},
		{
			key: 'context',
			header: 'Context',
			render: contextSnippet
		},
		{
			key: 'item_count',
			header: 'Items',
			accessor: (row) => `${row.item_count} items`
		},
		{
			key: 'is_active',
			header: 'Status',
			render: statusSnippet
		}
	];

	// Table actions
	const actions: TableAction<InventoryData>[] = [
		{
			label: 'Edit',
			icon: editIconSnippet,
			onclick: (row) => openEditor('edit', row)
		},
		{
			label: 'Clone',
			icon: cloneIconSnippet,
			onclick: (row) => openEditor('clone', row)
		},
		{
			label: 'Retire',
			icon: archiveIconSnippet,
			onclick: (row) => handleRetire(row),
			variant: 'destructive',
			hidden: (row) => row.is_active === false
		}
	];

	// Open editor
	function openEditor(mode: 'create' | 'edit' | 'clone', inventory?: InventoryData) {
		editorMode = mode;
		selectedInventory = inventory ?? null;
		editorOpen = true;
	}

	// Handle save
	async function handleSave(inventoryData: InventoryData) {
		console.log('Saving inventory:', inventoryData);
		// In production, this would call the API
		editorOpen = false;
	}

	// Handle retire
	async function handleRetire(inventory: InventoryData) {
		console.log('Retiring inventory:', inventory.inventory_key);
		// In production, this would call the API
	}
</script>

{#snippet contextSnippet({ value, row }: { value: unknown; row: InventoryData & { context?: string } })}
	<Badge variant="secondary">{getContextLabel(row.context)}</Badge>
{/snippet}

{#snippet statusSnippet({ value, row }: { value: unknown; row: { is_active: boolean } })}
	{#if row.is_active !== false}
		<Badge variant="ready">Active</Badge>
	{:else}
		<Badge variant="draft">Retired</Badge>
	{/if}
{/snippet}

{#snippet editIconSnippet()}
	<Edit class="w-4 h-4" />
{/snippet}

{#snippet cloneIconSnippet()}
	<Copy class="w-4 h-4" />
{/snippet}

{#snippet archiveIconSnippet()}
	<Archive class="w-4 h-4" />
{/snippet}

{#snippet emptyStateSnippet()}
	<div class="py-12 text-center">
		<p class="text-meta">No inventories found.</p>
		<Button variant="default" onclick={() => openEditor('create')} class="mt-4">
			Create your first inventory
		</Button>
	</div>
{/snippet}

<svelte:head>
	<title>Inventory Management | Admin | VibeCoding</title>
</svelte:head>

<div class="min-h-screen bg-viewport">
	<div class="max-w-7xl mx-auto px-4 py-6 md:py-8">
		<!-- Header -->
		<div class="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
			<div class="flex items-center gap-4">
				<a
					href="/admin"
					class="p-2 rounded-[var(--radius-card)] hover:bg-canvas transition-colors"
					title="Back to Admin"
				>
					<ArrowLeft class="w-5 h-5 text-meta" />
				</a>
				<div>
					<h1 class="text-2xl md:text-3xl font-bold text-headers">Inventory Management</h1>
					<p class="text-meta">Assemble and manage evaluation inventories</p>
				</div>
			</div>

			<div class="flex gap-2">
				<Button
					variant="secondary"
					onclick={() => showRetired = !showRetired}
				>
					{showRetired ? 'Hide Retired' : 'Show Retired'}
				</Button>
				<Button variant="default" onclick={() => openEditor('create')}>
					<Plus class="w-4 h-4 mr-2" />
					Create Inventory
				</Button>
			</div>
		</div>

		<!-- Info Card -->
		<Card elevation="resting" class="mb-6">
			<CardContent class="py-3">
				<p class="text-sm text-meta">
					Inventories are ordered collections of items used for assessments.
					Changing an inventory retires the current version and creates a new one.
					Existing assessments retain their historical inventory version.
				</p>
			</CardContent>
		</Card>

		<!-- Inventories Table -->
		<Card elevation="resting">
			<CardContent>
				<DataTable
					data={filteredInventories()}
					{columns}
					{actions}
					sortable
					emptyState={emptyStateSnippet}
				/>
			</CardContent>
		</Card>
	</div>
</div>

<!-- Inventory Editor Dialog -->
<InventoryEditor
	bind:open={editorOpen}
	inventory={selectedInventory}
	{availableItems}
	mode={editorMode}
	onSave={handleSave}
	onCancel={() => editorOpen = false}
/>
