<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Tooltip as TooltipPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';

	interface Props {
		children: Snippet;
		content: string | Snippet;
		side?: 'top' | 'right' | 'bottom' | 'left';
		align?: 'start' | 'center' | 'end';
		delayDuration?: number;
		class?: string;
	}

	let {
		children,
		content,
		side = 'top',
		align = 'center',
		delayDuration = 200,
		class: className
	}: Props = $props();
</script>

<TooltipPrimitive.Provider>
	<TooltipPrimitive.Root {delayDuration}>
		<TooltipPrimitive.Trigger>
			{@render children()}
		</TooltipPrimitive.Trigger>

		<TooltipPrimitive.Portal>
			<TooltipPrimitive.Content
				{side}
				{align}
				sideOffset={8}
				class={cn(
					'z-50 overflow-hidden rounded-[var(--radius-card)] bg-headers px-3 py-1.5',
					'text-sm text-white shadow-[var(--shadow-floating)]',
					'animate-in fade-in-0 zoom-in-95',
					'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
					'data-[side=bottom]:slide-in-from-top-2',
					'data-[side=left]:slide-in-from-right-2',
					'data-[side=right]:slide-in-from-left-2',
					'data-[side=top]:slide-in-from-bottom-2',
					className
				)}
			>
				{#if typeof content === 'string'}
					{content}
				{:else}
					{@render content()}
				{/if}
				<TooltipPrimitive.Arrow class="fill-headers" />
			</TooltipPrimitive.Content>
		</TooltipPrimitive.Portal>
	</TooltipPrimitive.Root>
</TooltipPrimitive.Provider>
