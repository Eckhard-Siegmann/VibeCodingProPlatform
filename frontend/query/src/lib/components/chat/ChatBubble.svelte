<script lang="ts">
	/**
	 * ChatBubble - Message bubble with alignment and variant styling.
	 *
	 * Variants:
	 * - own: Right-aligned, light blue background (current user's messages)
	 * - other: Left-aligned, white background with border (other users)
	 * - moderator: Left-aligned, lighter blue background, moderator badge
	 * - system: Center-aligned, grey background, italic text (bot/system messages)
	 *
	 * Per Chapter 26.15.1 specification.
	 */
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';
	import { Badge } from '$lib/components/ui/badge';

	type BubbleVariant = 'own' | 'other' | 'moderator' | 'system';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		variant?: BubbleVariant;
		children: Snippet;
		class?: string;
	}

	let { variant = 'other', children, class: className, ...restProps }: Props = $props();

	// Base styles for all bubbles
	const base = 'px-3 py-2 text-sm leading-relaxed break-words';

	// Variant-specific styles per Ch.26.15.1
	const variantStyles: Record<BubbleVariant, string> = {
		own: cn(
			'bg-chat-own text-headers',
			'rounded-[12px] rounded-br-none', // Square corner bottom-right
			'max-w-[75%] ml-auto' // Right-aligned
		),
		other: cn(
			'bg-card text-headers',
			'border border-secondary',
			'rounded-[12px] rounded-bl-none', // Square corner bottom-left
			'max-w-[75%] mr-auto' // Left-aligned
		),
		moderator: cn(
			'bg-chat-moderator text-headers',
			'border border-primary/30',
			'rounded-[12px] rounded-bl-none', // Square corner bottom-left
			'max-w-[75%] mr-auto' // Left-aligned
		),
		system: cn(
			'bg-canvas text-meta',
			'italic text-xs text-center',
			'rounded-[8px]',
			'mx-auto px-4 py-1.5' // Centered
		)
	};
</script>

<div class={cn(base, variantStyles[variant], className)} {...restProps}>
	{#if variant === 'moderator'}
		<div class="flex items-center gap-1.5 mb-1">
			<Badge variant="default" class="text-[10px] px-1.5 py-0">Moderator</Badge>
		</div>
	{/if}
	{@render children()}
</div>
