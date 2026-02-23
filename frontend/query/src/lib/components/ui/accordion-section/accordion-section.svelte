<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		title: string;
		defaultOpen?: boolean;
		open?: boolean;
		children: Snippet;
		class?: string;
		onToggle?: (isOpen: boolean) => void;
	}

	let {
		title,
		defaultOpen = false,
		open: controlledOpen,
		children,
		class: className,
		onToggle,
		...restProps
	}: Props = $props();

	// Internal state for uncontrolled mode
	// Using a function to capture initial value
	function getInitialOpen(): boolean {
		return defaultOpen;
	}
	let internalOpen = $state(getInitialOpen());

	// Determine if controlled or uncontrolled
	const isControlled = $derived(controlledOpen !== undefined);
	const isOpen = $derived(isControlled ? controlledOpen : internalOpen);

	// Content element for height calculation
	let contentRef: HTMLDivElement | undefined = $state();
	let contentHeight = $state(0);

	// Update height when content changes
	$effect(() => {
		if (contentRef && isOpen) {
			contentHeight = contentRef.scrollHeight;
		}
	});

	function toggle() {
		const newState = !isOpen;
		if (!isControlled) {
			internalOpen = newState;
		}
		onToggle?.(newState);
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			toggle();
		}
	}

	const headerId = $derived(`accordion-header-${title.replace(/\s+/g, '-').toLowerCase()}`);
	const panelId = $derived(`accordion-panel-${title.replace(/\s+/g, '-').toLowerCase()}`);
</script>

<div class={cn('border border-secondary rounded-[var(--radius-card)] overflow-hidden', className)} {...restProps}>
	<!-- Header -->
	<button
		type="button"
		id={headerId}
		class={cn(
			'w-full flex items-center justify-between p-3 md:p-4 cursor-pointer',
			'bg-canvas hover:bg-canvas/80 transition-colors',
			'text-left text-headers font-medium',
			'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
			isOpen ? 'rounded-t-[var(--radius-card)]' : 'rounded-[var(--radius-card)]',
			isOpen && 'accordion-expanded'
		)}
		aria-expanded={isOpen}
		aria-controls={panelId}
		onclick={toggle}
		onkeydown={handleKeyDown}
	>
		<span>{title}</span>
		<ChevronDown
			class={cn('w-5 h-5 text-icon accordion-icon shrink-0', isOpen && 'rotate-180')}
			aria-hidden="true"
		/>
	</button>

	<!-- Content -->
	<div
		id={panelId}
		role="region"
		aria-labelledby={headerId}
		class="accordion-content overflow-hidden"
		style="height: {isOpen ? `${contentHeight}px` : '0px'}; opacity: {isOpen ? 1 : 0}"
	>
		<div bind:this={contentRef} class="p-4 md:p-5 bg-card">
			{@render children()}
		</div>
	</div>
</div>
