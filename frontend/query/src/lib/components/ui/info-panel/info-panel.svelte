<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';
	import { AccordionSection } from '$lib/components/ui/accordion-section';
	import Info from '@lucide/svelte/icons/info';

	type InfoPanelVariant = 'info' | 'warning' | 'success' | 'tip';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		title: string;
		children: Snippet;
		variant?: InfoPanelVariant;
		collapsible?: boolean;
		defaultOpen?: boolean;
		icon?: Snippet;
		class?: string;
	}

	let {
		title,
		children,
		variant = 'info',
		collapsible = false,
		defaultOpen = true,
		icon,
		class: className,
		...restProps
	}: Props = $props();

	const variantStyles: Record<InfoPanelVariant, { bg: string; border: string; icon: string }> = {
		info: {
			bg: 'bg-primary/5',
			border: 'border-primary/20',
			icon: 'text-primary'
		},
		warning: {
			bg: 'bg-warning-bg',
			border: 'border-warning/30',
			icon: 'text-warning'
		},
		success: {
			bg: 'bg-success/5',
			border: 'border-success/30',
			icon: 'text-success'
		},
		tip: {
			bg: 'bg-purple-bg',
			border: 'border-purple/20',
			icon: 'text-purple'
		}
	};

	const styles = $derived(variantStyles[variant]);
</script>

{#if collapsible}
	<AccordionSection {title} {defaultOpen} class={className} {...restProps}>
		<div class={cn('flex gap-3', styles.bg, 'p-4 rounded-[var(--radius-card)]')}>
			{#if icon}
				{@render icon()}
			{:else}
				<Info class={cn('w-5 h-5 shrink-0 mt-0.5', styles.icon)} aria-hidden="true" />
			{/if}
			<div class="text-sm text-headers">
				{@render children()}
			</div>
		</div>
	</AccordionSection>
{:else}
	<div
		class={cn(
			'flex gap-3 p-4 rounded-[var(--radius-card)] border',
			styles.bg,
			styles.border,
			className
		)}
		role="note"
		{...restProps}
	>
		{#if icon}
			{@render icon()}
		{:else}
			<Info class={cn('w-5 h-5 shrink-0 mt-0.5', styles.icon)} aria-hidden="true" />
		{/if}
		<div class="flex-1">
			<h4 class="font-medium text-headers mb-1">{title}</h4>
			<div class="text-sm text-labels">
				{@render children()}
			</div>
		</div>
	</div>
{/if}
