<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';
	import type { Toast as ToastType, ToastVariant } from '$lib/stores/toast';
	import { toastStore } from '$lib/stores/toast';
	import X from '@lucide/svelte/icons/x';
	import Check from '@lucide/svelte/icons/check';
	import AlertCircle from '@lucide/svelte/icons/alert-circle';
	import AlertTriangle from '@lucide/svelte/icons/alert-triangle';
	import Info from '@lucide/svelte/icons/info';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		toast: ToastType;
		class?: string;
	}

	let { toast, class: className, ...restProps }: Props = $props();

	const variantConfig: Record<
		ToastVariant,
		{ bg: string; border: string; iconColor: string; icon: typeof Check }
	> = {
		success: {
			bg: 'bg-success/10',
			border: 'border-success/30',
			iconColor: 'text-success',
			icon: Check
		},
		error: {
			bg: 'bg-alert/10',
			border: 'border-alert/30',
			iconColor: 'text-alert',
			icon: AlertCircle
		},
		warning: {
			bg: 'bg-warning-bg',
			border: 'border-warning/30',
			iconColor: 'text-warning',
			icon: AlertTriangle
		},
		info: {
			bg: 'bg-primary/10',
			border: 'border-primary/30',
			iconColor: 'text-primary',
			icon: Info
		}
	};

	const config = $derived(variantConfig[toast.variant]);
	const Icon = $derived(config.icon);

	function dismiss() {
		toastStore.removeToast(toast.id);
	}

	// Swipe to dismiss handling
	let startX = $state(0);
	let currentX = $state(0);
	let isDragging = $state(false);

	function handleTouchStart(e: TouchEvent) {
		startX = e.touches[0].clientX;
		currentX = 0;
		isDragging = true;
	}

	function handleTouchMove(e: TouchEvent) {
		if (!isDragging) return;
		const diff = e.touches[0].clientX - startX;
		// Only allow swipe right
		currentX = Math.max(0, diff);
	}

	function handleTouchEnd() {
		if (currentX > 100) {
			dismiss();
		}
		currentX = 0;
		isDragging = false;
	}
</script>

<div
	role="alert"
	aria-live={toast.variant === 'error' ? 'assertive' : 'polite'}
	class={cn(
		'flex items-start gap-3 p-4 rounded-[var(--radius-card)] border shadow-[var(--shadow-floating)]',
		'bg-card',
		config.border,
		'w-[var(--toast-width-mobile)] sm:w-[var(--toast-width)]',
		'transition-transform duration-200 ease-out',
		className
	)}
	style="transform: translateX({currentX}px)"
	ontouchstart={handleTouchStart}
	ontouchmove={handleTouchMove}
	ontouchend={handleTouchEnd}
	{...restProps}
>
	<!-- Icon -->
	<div class={cn('shrink-0 mt-0.5', config.iconColor)}>
		<Icon class="w-5 h-5" aria-hidden="true" />
	</div>

	<!-- Content -->
	<div class="flex-1 min-w-0">
		<p class="font-medium text-headers">{toast.title}</p>
		{#if toast.message}
			<p class="text-sm text-labels mt-0.5">{toast.message}</p>
		{/if}
	</div>

	<!-- Dismiss button -->
	<button
		type="button"
		onclick={dismiss}
		class={cn(
			'shrink-0 p-1 -m-1 rounded-[var(--radius-card)]',
			'text-meta hover:text-headers hover:bg-canvas',
			'transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center'
		)}
		aria-label="Dismiss notification"
	>
		<X class="w-4 h-4" aria-hidden="true" />
	</button>
</div>
