<script lang="ts">
	import { cn } from '$lib/utils';
	import Search from '@lucide/svelte/icons/search';
	import X from '@lucide/svelte/icons/x';

	interface Props {
		value: string;
		placeholder?: string;
		debounceMs?: number;
		minLength?: number;
		onSearch: (query: string) => void;
		class?: string;
	}

	let {
		value = $bindable(''),
		placeholder = 'Search…',
		debounceMs = 300,
		minLength = 2,
		onSearch,
		class: className
	}: Props = $props();

	let inputEl: HTMLInputElement | undefined = $state();
	let debounceTimer: ReturnType<typeof setTimeout> | undefined;

	function handleInput() {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			if (value.length >= minLength) {
				onSearch(value);
			} else {
				onSearch('');
			}
		}, debounceMs);
	}

	function handleClear() {
		value = '';
		clearTimeout(debounceTimer);
		onSearch('');
		inputEl?.focus();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			handleClear();
		}
	}
</script>

<div class={cn('relative', className)}>
	<Search
		size={16}
		class="absolute left-3 top-1/2 -translate-y-1/2 text-labels pointer-events-none"
	/>
	<input
		bind:this={inputEl}
		bind:value
		type="text"
		role="searchbox"
		aria-label="Search"
		{placeholder}
		oninput={handleInput}
		onkeydown={handleKeydown}
		class={cn(
			'w-full h-10 md:h-10 pl-10 pr-10',
			'bg-card border border-secondary rounded-lg',
			'text-sm text-body placeholder:text-labels',
			'focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary',
			'transition-colors'
		)}
	/>
	{#if value.length > 0}
		<button
			type="button"
			aria-label="Clear search"
			onclick={handleClear}
			class="absolute right-3 top-1/2 -translate-y-1/2 text-labels hover:text-headers p-0.5 rounded transition-colors"
		>
			<X size={16} />
		</button>
	{/if}
</div>
