<script lang="ts">
	import type { Snippet } from 'svelte';
	import { AlertDialog } from 'bits-ui';
	import { cn } from '$lib/utils';
	import { Button } from '$lib/components/ui/button';
	import Info from '@lucide/svelte/icons/info';
	import HelpCircle from '@lucide/svelte/icons/help-circle';
	import Lightbulb from '@lucide/svelte/icons/lightbulb';

	type InfoDialogVariant = 'info' | 'help' | 'tip';

	interface Props {
		open: boolean;
		title: string;
		content: string | Snippet;
		dismissLabel?: string;
		variant?: InfoDialogVariant;
		onDismiss?: () => void;
		onOpenChange?: (open: boolean) => void;
		class?: string;
	}

	let {
		open = $bindable(),
		title,
		content,
		dismissLabel = 'Got it',
		variant = 'info',
		onDismiss,
		onOpenChange,
		class: className
	}: Props = $props();

	const variantConfig: Record<
		InfoDialogVariant,
		{ icon: typeof Info; iconColor: string; headerBg: string }
	> = {
		info: {
			icon: Info,
			iconColor: 'text-primary',
			headerBg: 'bg-primary/5'
		},
		help: {
			icon: HelpCircle,
			iconColor: 'text-purple',
			headerBg: 'bg-purple-bg'
		},
		tip: {
			icon: Lightbulb,
			iconColor: 'text-pending',
			headerBg: 'bg-pending/10'
		}
	};

	const config = $derived(variantConfig[variant]);
	const Icon = $derived(config.icon);

	function handleOpenChange(newOpen: boolean) {
		open = newOpen;
		onOpenChange?.(newOpen);
		if (!newOpen) {
			onDismiss?.();
		}
	}

	function handleDismiss() {
		open = false;
		onDismiss?.();
	}
</script>

<AlertDialog.Root {open} onOpenChange={handleOpenChange}>
	<AlertDialog.Portal>
		<!-- Overlay -->
		<AlertDialog.Overlay
			class="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
		/>

		<!-- Content -->
		<AlertDialog.Content
			class={cn(
				// Mobile: Full screen with scroll
				'fixed inset-4 z-50 flex flex-col bg-card rounded-[var(--radius-card-lg)] shadow-[var(--shadow-floating)] overflow-hidden',
				'sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2',
				'sm:max-w-lg sm:w-full sm:max-h-[80vh]',
				// Animations
				'data-[state=open]:animate-in data-[state=closed]:animate-out',
				'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
				'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
				className
			)}
		>
			<!-- Header with icon -->
			<div class={cn('flex items-center gap-3 p-6 pb-4', config.headerBg)}>
				<div class={cn('shrink-0', config.iconColor)}>
					<Icon class="w-6 h-6" aria-hidden="true" />
				</div>
				<AlertDialog.Title class="text-lg font-semibold text-headers">
					{title}
				</AlertDialog.Title>
			</div>

			<!-- Scrollable content -->
			<div class="flex-1 overflow-y-auto px-6 py-4">
				<AlertDialog.Description>
					<div class="text-sm text-labels leading-relaxed">
						{#if typeof content === 'string'}
							<!-- Render as paragraphs for string content -->
							{#each content.split('\n\n') as paragraph}
								<p class="mb-2 last:mb-0">{paragraph}</p>
							{/each}
						{:else}
							<!-- Render snippet content -->
							{@render content()}
						{/if}
					</div>
				</AlertDialog.Description>
			</div>

			<!-- Footer - always visible at bottom -->
			<div class="flex justify-end p-6 pt-4 border-t border-secondary">
				<AlertDialog.Action>
					<Button variant="default" onclick={handleDismiss}>
						{dismissLabel}
					</Button>
				</AlertDialog.Action>
			</div>
		</AlertDialog.Content>
	</AlertDialog.Portal>
</AlertDialog.Root>
