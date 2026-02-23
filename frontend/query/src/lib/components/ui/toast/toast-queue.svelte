<script lang="ts">
	import { cn } from '$lib/utils';
	import { visibleToasts } from '$lib/stores/toast';
	import Toast from './toast.svelte';

	interface Props {
		class?: string;
	}

	let { class: className }: Props = $props();
</script>

{#if $visibleToasts.length > 0}
	<div
		class={cn(
			'fixed z-50 flex flex-col gap-[var(--toast-gap)]',
			'top-[var(--toast-offset)] right-[var(--toast-offset)]',
			'sm:right-[var(--toast-offset)]',
			'left-4 right-4 sm:left-auto',
			className
		)}
		role="region"
		aria-label="Notifications"
	>
		{#each $visibleToasts as toast (toast.id)}
			<div
				class="animate-in slide-in-from-right duration-200 ease-out"
			>
				<Toast {toast} />
			</div>
		{/each}
	</div>
{/if}
