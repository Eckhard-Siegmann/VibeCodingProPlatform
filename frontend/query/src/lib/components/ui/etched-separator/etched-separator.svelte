<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		class?: string;
		orientation?: 'horizontal' | 'vertical';
	}

	let { class: className, orientation = 'horizontal', ...restProps }: Props = $props();
</script>

{#if orientation === 'horizontal'}
	<div class={cn('w-full', className)} role="separator" aria-orientation="horizontal" {...restProps}>
		<div class="h-px bg-[var(--color-etch-top)]"></div>
		<div class="h-px bg-[var(--color-etch-bottom)]"></div>
	</div>
{:else}
	<div
		class={cn('h-full inline-flex flex-col', className)}
		role="separator"
		aria-orientation="vertical"
		{...restProps}
	>
		<div class="w-px h-full bg-[var(--color-etch-top)]"></div>
		<div class="w-px h-full bg-[var(--color-etch-bottom)]"></div>
	</div>
{/if}
