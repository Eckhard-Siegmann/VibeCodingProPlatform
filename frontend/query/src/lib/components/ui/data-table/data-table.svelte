<script lang="ts" generics="T">
	import type { Snippet } from 'svelte';
	import { ChevronUp, ChevronDown, MoreVertical } from '@lucide/svelte';
	import { cn } from '$lib/utils';
	import TableCard from './table-card.svelte';
	import type { TableColumn, TableAction } from './types';

	type SortDirection = 'asc' | 'desc' | null;

	interface Props {
		data: T[];
		columns: TableColumn<T>[];
		actions?: TableAction<T>[];
		sortable?: boolean;
		sortKey?: string;
		sortDirection?: SortDirection;
		onSort?: (key: string, direction: SortDirection) => void;
		onRowClick?: (row: T) => void;
		selectedRow?: T | null;
		emptyState?: Snippet;
		loading?: boolean;
		class?: string;
	}

	let {
		data,
		columns,
		actions = [],
		sortable = false,
		sortKey = $bindable(''),
		sortDirection = $bindable(null),
		onSort,
		onRowClick,
		selectedRow = null,
		emptyState,
		loading = false,
		class: className
	}: Props = $props();

	// Detect if we're on mobile (< 768px)
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

	// Get cell value
	function getCellValue(column: TableColumn<T>, row: T): unknown {
		if (column.accessor) {
			return column.accessor(row);
		}
		return (row as Record<string, unknown>)[column.key];
	}

	// Handle sort click
	function handleSort(key: string) {
		if (!sortable) return;

		let newDirection: SortDirection;
		if (sortKey !== key) {
			newDirection = 'asc';
		} else if (sortDirection === 'asc') {
			newDirection = 'desc';
		} else if (sortDirection === 'desc') {
			newDirection = null;
		} else {
			newDirection = 'asc';
		}

		sortKey = key;
		sortDirection = newDirection;
		onSort?.(key, newDirection);
	}

	// Filter visible actions for a row
	function getVisibleActions(row: T): TableAction<T>[] {
		return actions.filter((action) => !action.hidden?.(row));
	}

	// Check if a row is selected
	function isSelected(row: T): boolean {
		return selectedRow === row;
	}
</script>

<div class={cn('w-full', className)}>
	{#if loading}
		<!-- Loading state -->
		<div class="space-y-3">
			{#each Array(3) as _, i}
				<div
					class="h-16 bg-canvas rounded-[var(--radius-card)] skeleton-shimmer"
					style="animation-delay: {i * 100}ms"
				></div>
			{/each}
		</div>
	{:else if data.length === 0}
		<!-- Empty state -->
		{#if emptyState}
			{@render emptyState()}
		{:else}
			<div class="py-12 text-center">
				<p class="text-meta">No data available</p>
			</div>
		{/if}
	{:else if isMobile}
		<!-- Mobile: Card layout -->
		<div class="space-y-3">
			{#each data as row, index (index)}
				<TableCard
					{row}
					{columns}
					{actions}
					selected={isSelected(row)}
					onclick={onRowClick}
				/>
			{/each}
		</div>
	{:else}
		<!-- Desktop: Table layout -->
		<div class="overflow-x-auto">
			<table class="w-full">
				<thead>
					<tr class="border-b border-secondary">
						{#each columns as column (column.key)}
							<th
								class={cn(
									'px-4 py-3 text-left text-sm font-medium text-meta',
									sortable && 'cursor-pointer select-none hover:text-headers'
								)}
								onclick={() => sortable && handleSort(column.key)}
							>
								<div class="flex items-center gap-1">
									<span>{column.header}</span>
									{#if sortable && sortKey === column.key}
										{#if sortDirection === 'asc'}
											<ChevronUp class="w-4 h-4" />
										{:else if sortDirection === 'desc'}
											<ChevronDown class="w-4 h-4" />
										{/if}
									{/if}
								</div>
							</th>
						{/each}
						{#if actions.length > 0}
							<th class="px-4 py-3 w-12">
								<span class="sr-only">Actions</span>
							</th>
						{/if}
					</tr>
				</thead>
				<tbody>
					{#each data as row, index (index)}
						<tr
							class={cn(
								'border-b border-secondary/50 transition-colors',
								index % 2 === 0 ? 'bg-card' : 'bg-canvas/30',
								onRowClick && 'cursor-pointer hover:bg-canvas',
								isSelected(row) && 'bg-primary/5'
							)}
							onclick={() => onRowClick?.(row)}
						>
							{#each columns as column (column.key)}
								<td class="px-4 py-3 text-sm text-headers">
									{#if column.render}
										{@render column.render({ value: getCellValue(column, row), row })}
									{:else}
										{getCellValue(column, row) ?? '-'}
									{/if}
								</td>
							{/each}
							{#if actions.length > 0}
								{@const visibleActions = getVisibleActions(row)}
								<td class="px-4 py-3">
									{#if visibleActions.length > 0}
										<div class="flex items-center justify-end gap-1">
											{#each visibleActions.slice(0, 2) as action (action.label)}
												<button
													type="button"
													onclick={(e) => {
														e.stopPropagation();
														action.onclick(row);
													}}
													class={cn(
														'p-2 rounded-[var(--radius-card)] min-h-[40px] min-w-[40px]',
														'flex items-center justify-center',
														'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
														action.variant === 'destructive'
															? 'text-alert hover:bg-alert/10'
															: 'text-meta hover:bg-canvas'
													)}
													title={action.label}
												>
													{#if action.icon}
														{@render action.icon()}
													{:else}
														<span class="text-xs">{action.label}</span>
													{/if}
												</button>
											{/each}
											{#if visibleActions.length > 2}
												<button
													type="button"
													class={cn(
														'p-2 rounded-[var(--radius-card)] min-h-[40px] min-w-[40px]',
														'flex items-center justify-center',
														'text-meta hover:bg-canvas',
														'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
													)}
													title="More actions"
												>
													<MoreVertical class="w-4 h-4" />
												</button>
											{/if}
										</div>
									{/if}
								</td>
							{/if}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
