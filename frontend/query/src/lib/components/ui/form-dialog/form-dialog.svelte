<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Dialog } from 'bits-ui';
	import { cn } from '$lib/utils';
	import { Button } from '$lib/components/ui/button';
	import X from '@lucide/svelte/icons/x';

	interface Props {
		open: boolean;
		title: string;
		description?: string;
		children: Snippet;
		submitLabel?: string;
		cancelLabel?: string;
		submitDisabled?: boolean;
		submitVariant?: 'default' | 'destructive';
		onsubmit: () => void | Promise<void>;
		oncancel?: () => void;
		onOpenChange?: (open: boolean) => void;
		class?: string;
	}

	let {
		open = $bindable(),
		title,
		description,
		children,
		submitLabel = 'Save',
		cancelLabel = 'Cancel',
		submitDisabled = false,
		submitVariant = 'default',
		onsubmit,
		oncancel,
		onOpenChange,
		class: className
	}: Props = $props();

	let submitting = $state(false);

	function handleOpenChange(newOpen: boolean) {
		open = newOpen;
		onOpenChange?.(newOpen);
		if (!newOpen) {
			oncancel?.();
		}
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (submitting || submitDisabled) return;

		submitting = true;
		try {
			await onsubmit();
			open = false;
		} finally {
			submitting = false;
		}
	}

	function handleCancel() {
		open = false;
		oncancel?.();
	}
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
	<Dialog.Portal>
		<!-- Overlay -->
		<Dialog.Overlay
			class="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
		/>

		<!-- Content -->
		<Dialog.Content
			class={cn(
				// Mobile: Full screen
				'fixed inset-4 z-50 flex flex-col bg-card rounded-[var(--radius-card-lg)] shadow-[var(--shadow-floating)]',
				'sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2',
				'sm:max-w-lg sm:w-full sm:max-h-[90vh]',
				// Animations
				'data-[state=open]:animate-in data-[state=closed]:animate-out',
				'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
				'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
				className
			)}
		>
			<form onsubmit={handleSubmit} class="flex flex-col h-full">
				<!-- Header -->
				<div class="flex items-start justify-between gap-4 p-6 pb-0">
					<div class="space-y-1.5">
						<Dialog.Title class="text-lg font-semibold text-headers">
							{title}
						</Dialog.Title>
						{#if description}
							<Dialog.Description class="text-sm text-labels">
								{description}
							</Dialog.Description>
						{/if}
					</div>
					<Dialog.Close
						class={cn(
							'p-2 -m-2 rounded-[var(--radius-card)] text-meta hover:text-headers hover:bg-canvas',
							'transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center'
						)}
						aria-label="Close dialog"
					>
						<X class="w-5 h-5" aria-hidden="true" />
					</Dialog.Close>
				</div>

				<!-- Form Content -->
				<div class="flex-1 overflow-y-auto p-6">
					{@render children()}
				</div>

				<!-- Footer -->
				<div class="flex items-center justify-end gap-3 p-6 pt-0 border-t border-secondary mt-auto">
					<Button type="button" variant="secondary" onclick={handleCancel} disabled={submitting}>
						{cancelLabel}
					</Button>
					<Button
						type="submit"
						variant={submitVariant}
						disabled={submitDisabled || submitting}
					>
						{#if submitting}
							<span class="animate-spin mr-2">
								<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
							</span>
						{/if}
						{submitLabel}
					</Button>
				</div>
			</form>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
