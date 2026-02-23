<script lang="ts">
	import { cn } from '$lib/utils';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';

	type ButtonVariant = 'ghost' | 'outline';

	interface Props {
		label?: string;
		variant?: ButtonVariant;
		href?: string;
		onclick?: () => void;
		class?: string;
	}

	let {
		label = 'Back',
		href,
		onclick,
		variant = 'ghost',
		class: className
	}: Props = $props();

	const variantStyles: Record<ButtonVariant, string> = {
		ghost: 'bg-transparent text-headers hover:bg-canvas',
		outline: 'bg-transparent text-headers border border-secondary-dark hover:bg-canvas'
	};

	const baseStyles = $derived(
		cn(
			'inline-flex items-center gap-2 font-medium rounded-[var(--radius-card)]',
			'transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
			// Mobile: Full touch target
			'min-h-[44px] px-3 md:min-h-[36px] md:px-2',
			'text-sm',
			variantStyles[variant],
			className
		)
	);

	function handleClick() {
		if (onclick) {
			onclick();
		} else if (typeof window !== 'undefined') {
			window.history.back();
		}
	}
</script>

{#if href}
	<a {href} class={baseStyles}>
		<ArrowLeft class="w-4 h-4" aria-hidden="true" />
		<span>{label}</span>
	</a>
{:else}
	<button type="button" class={baseStyles} onclick={handleClick}>
		<ArrowLeft class="w-4 h-4" aria-hidden="true" />
		<span>{label}</span>
	</button>
{/if}
