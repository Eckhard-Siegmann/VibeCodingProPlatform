<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Filter } from '@lucide/svelte';
	import { cn } from '$lib/utils';
	import FilterBottomSheet from './filter-bottom-sheet.svelte';

	export interface FilterConfig {
		key: string;
		type: 'dropdown' | 'checkbox' | 'search' | 'dateRange';
		label?: string;
		placeholder?: string;
		options?: { value: string; label: string }[];
	}

	interface Props {
		filters?: FilterConfig[];
		activeCount?: number;
		children: Snippet;
		mobileChildren?: Snippet;
		onApply?: () => void;
		onReset?: () => void;
		class?: string;
	}

	let {
		filters = [],
		activeCount = 0,
		children,
		mobileChildren,
		onApply,
		onReset,
		class: className
	}: Props = $props();

	let mobileOpen = $state(false);

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

	function handleMobileApply() {
		onApply?.();
		mobileOpen = false;
	}
</script>

<div class={cn('w-full', className)}>
	<!-- Desktop: Inline filters -->
	<div class="hidden md:flex md:items-center md:gap-3 md:flex-wrap">
		{@render children()}
	</div>

	<!-- Mobile: Filter button + Bottom sheet -->
	<div class="md:hidden">
		<button
			type="button"
			onclick={() => (mobileOpen = true)}
			class={cn(
				'inline-flex items-center gap-2 px-4 py-2',
				'min-h-[44px]',
				'bg-card border border-secondary rounded-[var(--radius-card)]',
				'text-sm font-medium text-headers',
				'hover:border-secondary-dark transition-colors',
				'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
			)}
		>
			<Filter class="w-4 h-4" />
			<span>Filters</span>
			{#if activeCount > 0}
				<span
					class={cn(
						'px-1.5 py-0.5 min-w-[20px]',
						'bg-primary text-white text-xs font-medium rounded-full',
						'flex items-center justify-center'
					)}
				>
					{activeCount}
				</span>
			{/if}
		</button>

		<FilterBottomSheet
			bind:open={mobileOpen}
			onApply={handleMobileApply}
			{onReset}
		>
			{#if mobileChildren}
				{@render mobileChildren()}
			{:else}
				{@render children()}
			{/if}
		</FilterBottomSheet>
	</div>
</div>
