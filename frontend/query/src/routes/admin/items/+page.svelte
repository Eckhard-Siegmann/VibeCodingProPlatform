<script lang="ts">
	import { cn } from '$lib/utils';
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { DataTable, type TableColumn, type TableAction } from '$lib/components/ui/data-table';
	import { ItemEditor, type ItemData } from '$lib/components/admin';
	import Plus from '@lucide/svelte/icons/plus';
	import Edit from '@lucide/svelte/icons/pencil';
	import Copy from '@lucide/svelte/icons/copy';
	import Archive from '@lucide/svelte/icons/archive';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';

	interface Props {
		data?: {
			items: ItemData[];
		};
	}

	let { data }: Props = $props();

	// Demo items
	const demoItems: (ItemData & { is_active: boolean; created_at: string })[] = [
		{
			item_id: '1',
			item_key: 'correctness',
			item_text: 'The solution meets the stated requirements (including edge cases) and behaves as intended.',
			max_rating: 5,
			label_min: 'Incorrect/misleading',
			label_low_mid: 'Partly correct',
			label_mid: 'Mostly correct',
			label_high_mid: 'Minor issues',
			label_max: 'Fully correct',
			category: 'quality',
			is_active: true,
			created_at: '2026-01-15T10:00:00Z'
		},
		{
			item_id: '2',
			item_key: 'test_support',
			item_text: 'The solution includes evidence (tests, examples, documentation) that convincingly demonstrates correctness.',
			max_rating: 5,
			label_min: 'No evidence',
			label_low_mid: 'Minimal evidence',
			label_mid: 'Some evidence',
			label_high_mid: 'Good evidence',
			label_max: 'Comprehensive evidence',
			category: 'quality',
			is_active: true,
			created_at: '2026-01-15T10:05:00Z'
		},
		{
			item_id: '3',
			item_key: 'code_readability',
			item_text: 'The code is easy to read and understand with clear naming, structure, and local reasoning.',
			max_rating: 5,
			label_min: 'Unreadable',
			label_low_mid: 'Hard to read',
			label_mid: 'Readable',
			label_high_mid: 'Clear',
			label_max: 'Crystal clear',
			category: 'quality',
			is_active: true,
			created_at: '2026-01-15T10:10:00Z'
		}
	];

	let items = $state(demoItems as ItemData[]);

	// Sync from server data when available
	$effect(() => {
		if (data?.items) items = data.items;
	});

	// Editor state
	let editorOpen = $state(false);
	let editorMode = $state<'create' | 'edit' | 'clone'>('create');
	let selectedItem = $state<ItemData | null>(null);

	// Show retired items
	let showRetired = $state(false);

	// Filtered items
	const filteredItems = $derived(() => {
		if (showRetired) {
			return items;
		}
		return items.filter((item) => item.is_active !== false);
	});

	// Format date
	function formatDate(isoString: string): string {
		return new Date(isoString).toLocaleDateString('en-GB', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});
	}

	// Table columns
	const columns: TableColumn<ItemData>[] = [
		{
			key: 'item_key',
			header: 'Key',
			primary: true
		},
		{
			key: 'item_text',
			header: 'Question',
			accessor: (row) => row.item_text.slice(0, 60) + (row.item_text.length > 60 ? '...' : '')
		},
		{
			key: 'max_rating',
			header: 'Scale',
			accessor: (row) => `${row.max_rating}-point`
		},
		{
			key: 'category',
			header: 'Category',
			hideInCard: true
		},
		{
			key: 'is_active',
			header: 'Status',
			render: statusSnippet
		}
	];

	// Table actions
	const actions: TableAction<ItemData>[] = [
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
	function openEditor(mode: 'create' | 'edit' | 'clone', item?: ItemData) {
		editorMode = mode;
		selectedItem = item ?? null;
		editorOpen = true;
	}

	// Handle save
	async function handleSave(itemData: ItemData) {
		console.log('Saving item:', itemData);
		// In production, this would call the API
		editorOpen = false;
	}

	// Handle retire
	async function handleRetire(item: ItemData) {
		console.log('Retiring item:', item.item_key);
		// In production, this would call the API
	}
</script>

{#snippet statusSnippet({ value, row }: { value: unknown; row: ItemData })}
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
		<p class="text-meta">No items found.</p>
		<Button variant="default" onclick={() => openEditor('create')} class="mt-4">
			Create your first item
		</Button>
	</div>
{/snippet}

<svelte:head>
	<title>Item Management | Admin | VibeCoding</title>
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
					<h1 class="text-2xl md:text-3xl font-bold text-headers">Item Management</h1>
					<p class="text-meta">Create and manage evaluation items</p>
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
					Create Item
				</Button>
			</div>
		</div>

		<!-- Info Card -->
		<Card elevation="resting" class="mb-6">
			<CardContent class="py-3">
				<p class="text-sm text-meta">
					Items are immutable evaluation primitives. Changing an item retires the current version
					and creates a new one, preserving historical data integrity.
				</p>
			</CardContent>
		</Card>

		<!-- Items Table -->
		<Card elevation="resting">
			<CardContent>
				<DataTable
					data={filteredItems()}
					{columns}
					{actions}
					sortable
					emptyState={emptyStateSnippet}
				/>
			</CardContent>
		</Card>
	</div>
</div>

<!-- Item Editor Dialog -->
<ItemEditor
	bind:open={editorOpen}
	item={selectedItem}
	mode={editorMode}
	onSave={handleSave}
	onCancel={() => editorOpen = false}
/>
