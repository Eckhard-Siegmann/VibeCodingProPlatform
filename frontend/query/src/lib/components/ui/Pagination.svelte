<script lang="ts">
	import { cn } from '$lib/utils';
	import { Button } from '$lib/components/ui/button';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';

	interface Props {
		page: number;
		pageSize: number;
		totalItems: number;
		totalPages: number;
		onPageChange: (page: number) => void;
		class?: string;
	}

	let {
		page,
		pageSize,
		totalItems,
		totalPages,
		onPageChange,
		class: className
	}: Props = $props();

	const startItem = $derived((page - 1) * pageSize + 1);
	const endItem = $derived(Math.min(page * pageSize, totalItems));
	const hasPrev = $derived(page > 1);
	const hasNext = $derived(page < totalPages);

	/**
	 * Generate page numbers with ellipsis for large ranges.
	 * Shows: first, last, current, and 1 page on each side of current.
	 */
	function getPageNumbers(): (number | '...')[] {
		if (totalPages <= 5) {
			return Array.from({ length: totalPages }, (_, i) => i + 1);
		}

		const pages: (number | '...')[] = [];
		const around = new Set<number>();

		// Always show first and last
		around.add(1);
		around.add(totalPages);

		// Show current page and neighbors
		for (let i = Math.max(1, page - 1); i <= Math.min(totalPages, page + 1); i++) {
			around.add(i);
		}

		const sorted = [...around].sort((a, b) => a - b);

		for (let i = 0; i < sorted.length; i++) {
			if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
				pages.push('...');
			}
			pages.push(sorted[i]);
		}

		return pages;
	}
</script>

{#if totalPages > 1}
	<nav
		aria-label="Pagination"
		class={cn('flex items-center justify-between mt-6', className)}
	>
		<!-- Results count (desktop only) -->
		<span class="hidden md:block text-sm text-labels">
			Showing {startItem}–{endItem} of {totalItems}
		</span>

		<!-- Desktop: numbered page buttons -->
		<div class="hidden md:flex items-center gap-1">
			<Button
				variant="secondary"
				size="sm"
				disabled={!hasPrev}
				onclick={() => onPageChange(page - 1)}
				aria-label="Previous page"
			>
				<ChevronLeft size={16} />
				<span class="ml-1">Prev</span>
			</Button>

			{#each getPageNumbers() as p}
				{#if p === '...'}
					<span class="px-2 text-sm text-labels">…</span>
				{:else}
					<button
						type="button"
						onclick={() => onPageChange(p)}
						aria-current={p === page ? 'page' : undefined}
						class={cn(
							'min-w-[36px] h-[36px] px-2 rounded-md text-sm font-medium transition-colors',
							p === page
								? 'bg-primary text-white'
								: 'text-body hover:bg-canvas'
						)}
					>
						{p}
					</button>
				{/if}
			{/each}

			<Button
				variant="secondary"
				size="sm"
				disabled={!hasNext}
				onclick={() => onPageChange(page + 1)}
				aria-label="Next page"
			>
				<span class="mr-1">Next</span>
				<ChevronRight size={16} />
			</Button>
		</div>

		<!-- Mobile: prev/next with page indicator -->
		<div class="flex md:hidden items-center justify-between w-full">
			<Button
				variant="secondary"
				size="sm"
				disabled={!hasPrev}
				onclick={() => onPageChange(page - 1)}
				aria-label="Previous page"
			>
				<ChevronLeft size={16} />
				<span class="ml-1">Prev</span>
			</Button>

			<span class="text-sm text-labels">
				Page {page} of {totalPages}
			</span>

			<Button
				variant="secondary"
				size="sm"
				disabled={!hasNext}
				onclick={() => onPageChange(page + 1)}
				aria-label="Next page"
			>
				<span class="mr-1">Next</span>
				<ChevronRight size={16} />
			</Button>
		</div>
	</nav>
{/if}
