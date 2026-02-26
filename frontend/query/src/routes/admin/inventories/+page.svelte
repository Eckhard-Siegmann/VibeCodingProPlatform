<!--
  Admin Inventory Management — server-side pagination, search, filtering.
  Spec: Ch.17.1, Ch.12.10 | Design: pagedesign/admin_interfaces_design.md | Ticket: TICKET-30
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { cn } from '$lib/utils';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import SearchBar from '$lib/components/ui/SearchBar.svelte';
	import ListFilterBar from '$lib/components/ui/ListFilterBar.svelte';
	import Pagination from '$lib/components/ui/Pagination.svelte';
	import type { FilterConfig } from '$lib/components/ui/ListFilterBar.svelte';
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
	import { InventoryEditor, type InventoryData, type InventoryItem } from '$lib/components/admin';
	import Plus from '@lucide/svelte/icons/plus';
	import Edit from '@lucide/svelte/icons/pencil';
	import Copy from '@lucide/svelte/icons/copy';
	import Archive from '@lucide/svelte/icons/archive';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';

	type InventoryRow = InventoryData & { is_active: boolean; item_count: number; created_at: string; retired_at?: string | null };

	let { data } = $props();

	let searchValue = $state(data.filters.search);

	// Editor state
	let editorOpen = $state(false);
	let editorMode = $state<'create' | 'edit' | 'clone'>('create');
	let selectedInventory = $state<InventoryData | null>(null);

	// Retire confirmation state
	let retireConfirmOpen = $state(false);
	let retireTarget = $state<InventoryRow | null>(null);
	let retireError = $state('');

	// Status message
	let statusMessage = $state('');

	// Filter configuration
	const filterConfig: FilterConfig[] = [
		{
			key: 'status',
			label: 'Status',
			options: [
				{ value: 'all', label: 'All Inventories' },
				{ value: 'active', label: 'Active' },
				{ value: 'retired', label: 'Retired' }
			],
			defaultValue: 'all'
		},
		{
			key: 'sort',
			label: 'Sort',
			options: [
				{ value: 'default', label: 'Active First' },
				{ value: 'name_asc', label: 'Name A–Z' },
				{ value: 'name_desc', label: 'Name Z–A' },
				{ value: 'newest', label: 'Newest First' },
				{ value: 'items', label: 'Most Items' }
			],
			defaultValue: 'default'
		}
	];

	// URL state management
	function updateUrl(params: Record<string, string>, options?: { resetPage?: boolean; pushState?: boolean }) {
		const url = new URL($page.url);
		for (const [key, value] of Object.entries(params)) {
			if (value && value !== 'all' && value !== 'default' && value !== '1' && value !== '') {
				url.searchParams.set(key, value);
			} else {
				url.searchParams.delete(key);
			}
		}
		if (options?.resetPage) {
			url.searchParams.delete('page');
		}
		goto(url.pathname + url.search, {
			replaceState: !options?.pushState,
			keepFocus: true,
			noScroll: true
		});
	}

	function handleSearch(query: string) {
		updateUrl({ search: query }, { resetPage: true });
	}

	function handleFilterChange(key: string, value: string) {
		updateUrl({ [key]: value }, { resetPage: true });
	}

	function handleClearAll() {
		searchValue = '';
		goto('/admin/inventories', { replaceState: true });
	}

	function handlePageChange(newPage: number) {
		updateUrl({ page: String(newPage) }, { pushState: true });
	}

	// Editor
	function openEditor(mode: 'create' | 'edit' | 'clone', inventory?: InventoryData) {
		editorMode = mode;
		selectedInventory = inventory ?? null;
		editorOpen = true;
	}

	async function handleSave(inventoryData: InventoryData) {
		try {
			let res: Response;

			if (editorMode === 'edit' && inventoryData.inventory_id) {
				res = await fetch(`/api/admin/inventories/${inventoryData.inventory_id}`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(inventoryData)
				});
			} else if (editorMode === 'clone' && selectedInventory?.inventory_id) {
				res = await fetch(`/api/admin/inventories/${selectedInventory.inventory_id}/clone`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(inventoryData)
				});
			} else {
				res = await fetch('/api/admin/inventories', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(inventoryData)
				});
			}

			const result = await res.json();
			if (!res.ok) {
				statusMessage = `Error: ${result.message ?? result.error ?? 'Failed to save inventory'}`;
				return;
			}

			editorOpen = false;
			statusMessage = editorMode === 'edit'
				? 'Inventory updated (old version retired, new version created)'
				: editorMode === 'clone'
					? 'Inventory cloned successfully'
					: 'Inventory created successfully';
			goto($page.url.pathname + $page.url.search, { invalidateAll: true });
		} catch (err) {
			statusMessage = `Error: ${err instanceof Error ? err.message : 'Unknown error'}`;
		}
	}

	// Retire
	function confirmRetire(inventory: InventoryRow) {
		retireTarget = inventory;
		retireError = '';
		retireConfirmOpen = true;
	}

	async function handleRetire() {
		if (!retireTarget?.inventory_id) return;

		try {
			const res = await fetch(`/api/admin/inventories/${retireTarget.inventory_id}`, { method: 'DELETE' });
			const result = await res.json();
			if (!res.ok) {
				retireError = result.message ?? result.error ?? 'Failed to retire inventory';
				return;
			}

			retireConfirmOpen = false;
			statusMessage = `Inventory "${retireTarget.name}" retired successfully`;
			goto($page.url.pathname + $page.url.search, { invalidateAll: true });
		} catch (err) {
			retireError = err instanceof Error ? err.message : 'Unknown error';
		}
	}

	const hasActiveFilters = $derived(
		data.filters.search !== '' ||
		data.filters.status !== 'all' ||
		data.filters.sort !== 'default'
	);
</script>

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

			<Button variant="default" onclick={() => openEditor('create')}>
				<Plus class="w-4 h-4 mr-2" />
				Create Inventory
			</Button>
		</div>

		<!-- Status Message -->
		{#if statusMessage}
			<div class={cn(
				'mb-4 p-3 rounded-[var(--radius-card)] text-sm',
				statusMessage.startsWith('Error')
					? 'bg-alert/10 text-alert border border-alert/20'
					: 'bg-success/10 text-success border border-success/20'
			)}>
				{statusMessage}
				<button class="float-right font-bold" onclick={() => statusMessage = ''}>×</button>
			</div>
		{/if}

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

		<!-- Search + Filters -->
		<div class="space-y-3 mb-6">
			<SearchBar
				bind:value={searchValue}
				placeholder="Search by name…"
				onSearch={handleSearch}
				class="w-full md:w-80"
			/>
			<ListFilterBar
				filters={filterConfig}
				values={data.filters}
				onFilterChange={handleFilterChange}
				showClearAll={true}
				onClearAll={handleClearAll}
				class="overflow-x-auto md:overflow-visible flex-nowrap md:flex-wrap"
			/>
		</div>

		<!-- Results count -->
		{#if data.inventories.length > 0}
			<p class="text-sm text-labels mb-4" aria-live="polite">
				Showing {(data.pagination.page - 1) * data.pagination.pageSize + 1}–{Math.min(data.pagination.page * data.pagination.pageSize, data.pagination.totalItems)} of {data.pagination.totalItems} inventor{data.pagination.totalItems !== 1 ? 'ies' : 'y'}
			</p>
		{/if}

		<!-- Inventories List -->
		<Card elevation="resting">
			<CardContent>
				{#if data.inventories.length > 0}
					<!-- Desktop: table -->
					<div class="hidden md:block overflow-x-auto">
						<table class="w-full text-sm">
							<thead>
								<tr class="border-b border-secondary">
									<th class="text-left py-3 px-2 text-labels font-medium">Name</th>
									<th class="text-left py-3 px-2 text-labels font-medium">Key</th>
									<th class="text-left py-3 px-2 text-labels font-medium">Items</th>
									<th class="text-left py-3 px-2 text-labels font-medium">Status</th>
									<th class="py-3 px-2"></th>
								</tr>
							</thead>
							<tbody>
								{#each data.inventories as inv (inv.inventory_id)}
									<tr class="border-b border-secondary/50 hover:bg-canvas/50 transition-colors">
										<td class="py-3 px-2 font-medium text-headers">{inv.name}</td>
										<td class="py-3 px-2 text-labels font-mono text-xs">{inv.inventory_key}</td>
										<td class="py-3 px-2 text-body">{inv.item_count} items</td>
										<td class="py-3 px-2">
											{#if inv.is_active}
												<Badge variant="ready">Active</Badge>
											{:else}
												<Badge variant="draft">Retired</Badge>
											{/if}
										</td>
										<td class="py-3 px-2">
											<div class="flex items-center gap-1">
												<button
													onclick={() => openEditor('edit', inv)}
													class="p-1.5 rounded hover:bg-canvas text-labels hover:text-headers transition-colors"
													title="Edit"
												>
													<Edit class="w-4 h-4" />
												</button>
												<button
													onclick={() => openEditor('clone', inv)}
													class="p-1.5 rounded hover:bg-canvas text-labels hover:text-headers transition-colors"
													title="Clone"
												>
													<Copy class="w-4 h-4" />
												</button>
												{#if inv.is_active}
													<button
														onclick={() => confirmRetire(inv)}
														class="p-1.5 rounded hover:bg-canvas text-labels hover:text-alert transition-colors"
														title="Retire"
													>
														<Archive class="w-4 h-4" />
													</button>
												{/if}
											</div>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>

					<!-- Mobile: cards -->
					<div class="md:hidden space-y-3">
						{#each data.inventories as inv (inv.inventory_id)}
							<div class="p-3 rounded-[var(--radius-card)] border border-secondary/50">
								<div class="flex items-start justify-between gap-2">
									<div class="min-w-0">
										<p class="font-medium text-headers">{inv.name}</p>
										<p class="text-xs text-labels font-mono">{inv.inventory_key}</p>
									</div>
									<div class="flex items-center gap-1 flex-shrink-0">
										<button onclick={() => openEditor('edit', inv)} class="p-2 rounded hover:bg-canvas text-labels" title="Edit">
											<Edit class="w-4 h-4" />
										</button>
										<button onclick={() => openEditor('clone', inv)} class="p-2 rounded hover:bg-canvas text-labels" title="Clone">
											<Copy class="w-4 h-4" />
										</button>
									</div>
								</div>
								<div class="flex items-center gap-2 mt-2">
									{#if inv.is_active}
										<Badge variant="ready">Active</Badge>
									{:else}
										<Badge variant="draft">Retired</Badge>
									{/if}
									<span class="text-xs text-labels">{inv.item_count} items</span>
								</div>
							</div>
						{/each}
					</div>
				{:else if hasActiveFilters}
					<div class="py-12 text-center">
						<p class="text-meta">No inventories match your current filters.</p>
						<p class="text-sm text-meta mt-1">
							<button type="button" class="text-primary underline" onclick={handleClearAll}>Clear all filters</button>
						</p>
					</div>
				{:else}
					<div class="py-12 text-center">
						<p class="text-meta">No inventories found.</p>
						<Button variant="default" onclick={() => openEditor('create')} class="mt-4">
							Create your first inventory
						</Button>
					</div>
				{/if}
			</CardContent>
		</Card>

		<!-- Pagination -->
		<Pagination
			page={data.pagination.page}
			pageSize={data.pagination.pageSize}
			totalItems={data.pagination.totalItems}
			totalPages={data.pagination.totalPages}
			onPageChange={handlePageChange}
		/>
	</div>
</div>

<!-- Inventory Editor Dialog -->
<InventoryEditor
	bind:open={editorOpen}
	inventory={selectedInventory}
	availableItems={data.availableItems}
	mode={editorMode}
	onSave={handleSave}
	onCancel={() => editorOpen = false}
/>

<!-- Retire Confirmation Dialog -->
{#if retireTarget}
	<ConfirmDialog
		bind:open={retireConfirmOpen}
		title="Retire Inventory"
		message={retireError
			? `Are you sure you want to retire "${retireTarget.name}"?\n\n${retireError}`
			: `Are you sure you want to retire "${retireTarget.name}"? This inventory will no longer be available for new assessments.`}
		confirmLabel="Retire"
		variant="danger"
		onConfirm={handleRetire}
		onCancel={() => retireConfirmOpen = false}
	/>
{/if}
