<script lang="ts" generics="T">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';
	import type { TableColumn, TableAction } from './types';

	interface Props {
		row: T;
		columns: TableColumn<T>[];
		actions?: TableAction<T>[];
		selected?: boolean;
		onclick?: (row: T) => void;
		class?: string;
	}

	let {
		row,
		columns,
		actions = [],
		selected = false,
		onclick,
		class: className
	}: Props = $props();

	// Get cell value
	function getCellValue(column: TableColumn<T>, row: T): unknown {
		if (column.accessor) {
			return column.accessor(row);
		}
		return (row as Record<string, unknown>)[column.key];
	}

	// Find primary column for card title
	const primaryColumn = $derived(columns.find((col) => col.primary) || columns[0]);
	const secondaryColumns = $derived(
		columns.filter((col) => !col.primary && col !== columns[0] && !col.hideInCard)
	);

	// Filter visible actions
	const visibleActions = $derived(actions.filter((action) => !action.hidden?.(row)));

	function handleClick() {
		onclick?.(row);
	}

	const isClickable = $derived(!!onclick);
	const baseClasses = $derived(
		cn(
			'bg-card rounded-[var(--radius-card)] border p-4',
			'transition-all',
			selected ? 'border-primary shadow-[var(--shadow-md)]' : 'border-secondary',
			isClickable && 'cursor-pointer hover:border-primary/50 hover:shadow-[var(--shadow-sm)]',
			className
		)
	);
</script>

{#snippet cardContent()}
	<div class="flex items-start justify-between gap-3">
		<!-- Primary content -->
		<div class="flex-1 min-w-0">
			<!-- Primary field (title) -->
			{#if primaryColumn}
				<div class="font-medium text-headers truncate">
					{#if primaryColumn.render}
						{@render primaryColumn.render({ value: getCellValue(primaryColumn, row), row })}
					{:else}
						{getCellValue(primaryColumn, row)}
					{/if}
				</div>
			{/if}

			<!-- Secondary fields -->
			{#if secondaryColumns.length > 0}
				<div class="mt-2 space-y-1">
					{#each secondaryColumns as column (column.key)}
						<div class="flex items-center gap-2 text-sm">
							<span class="text-meta flex-shrink-0">{column.header}:</span>
							<span class="text-labels truncate">
								{#if column.render}
									{@render column.render({ value: getCellValue(column, row), row })}
								{:else}
									{getCellValue(column, row) ?? '-'}
								{/if}
							</span>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Actions -->
		{#if visibleActions.length > 0}
			<div class="flex items-center gap-1 flex-shrink-0">
				{#each visibleActions as action (action.label)}
					<button
						type="button"
						onclick={(e) => {
							e.stopPropagation();
							action.onclick(row);
						}}
						class={cn(
							'p-2 rounded-[var(--radius-card)] min-h-[44px] min-w-[44px]',
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
			</div>
		{/if}
	</div>
{/snippet}

{#if isClickable}
	<button
		type="button"
		onclick={handleClick}
		class={cn(baseClasses, 'w-full text-left')}
	>
		{@render cardContent()}
	</button>
{:else}
	<article class={baseClasses}>
		{@render cardContent()}
	</article>
{/if}
