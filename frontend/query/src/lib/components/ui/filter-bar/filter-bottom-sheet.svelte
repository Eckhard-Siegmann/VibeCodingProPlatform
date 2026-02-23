<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Dialog } from 'bits-ui';
	import { X } from '@lucide/svelte';
	import { cn } from '$lib/utils';

	interface Props {
		open?: boolean;
		title?: string;
		children: Snippet;
		onApply?: () => void;
		onReset?: () => void;
		onOpenChange?: (open: boolean) => void;
		class?: string;
	}

	let {
		open = $bindable(false),
		title = 'Filters',
		children,
		onApply,
		onReset,
		onOpenChange,
		class: className
	}: Props = $props();

	function handleOpenChange(isOpen: boolean) {
		open = isOpen;
		onOpenChange?.(isOpen);
	}

	function handleApply() {
		onApply?.();
		open = false;
	}

	function handleReset() {
		onReset?.();
	}
</script>

<Dialog.Root bind:open onOpenChange={handleOpenChange}>
	<Dialog.Portal>
		<Dialog.Overlay
			class={cn(
				'fixed inset-0 z-50 bg-black/50',
				'data-[state=open]:animate-in data-[state=closed]:animate-out',
				'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0'
			)}
		/>

		<Dialog.Content
			class={cn(
				'fixed inset-x-0 bottom-0 z-50',
				'bg-card rounded-t-[var(--radius-card-lg)]',
				'shadow-[var(--shadow-floating)]',
				'max-h-[85vh] flex flex-col',
				'data-[state=open]:animate-in data-[state=closed]:animate-out',
				'data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
				'duration-200',
				className
			)}
		>
			<!-- Header -->
			<div class="flex items-center justify-between px-4 py-3 border-b border-secondary">
				<Dialog.Title class="text-lg font-semibold text-headers">
					{title}
				</Dialog.Title>
				<Dialog.Close
					class={cn(
						'p-2 -mr-2 rounded-[var(--radius-card)]',
						'min-h-[44px] min-w-[44px]',
						'flex items-center justify-center',
						'text-meta hover:bg-canvas hover:text-headers',
						'transition-colors',
						'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
					)}
					aria-label="Close"
				>
					<X class="w-5 h-5" />
				</Dialog.Close>
			</div>

			<!-- Content -->
			<div class="flex-1 overflow-y-auto px-4 py-4">
				<div class="space-y-4">
					{@render children()}
				</div>
			</div>

			<!-- Footer -->
			<div class="flex items-center gap-3 px-4 py-4 border-t border-secondary bg-canvas/50">
				{#if onReset}
					<button
						type="button"
						onclick={handleReset}
						class={cn(
							'flex-1 px-4 py-2 min-h-[44px]',
							'bg-transparent border border-secondary-dark rounded-[var(--radius-card)]',
							'text-sm font-medium text-headers',
							'hover:bg-canvas transition-colors',
							'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
						)}
					>
						Reset
					</button>
				{/if}
				<button
					type="button"
					onclick={handleApply}
					class={cn(
						'flex-1 px-4 py-2 min-h-[44px]',
						'bg-primary rounded-[var(--radius-card)]',
						'text-sm font-medium text-white',
						'hover:bg-primary-hover transition-colors',
						'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
					)}
				>
					Apply Filters
				</button>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
