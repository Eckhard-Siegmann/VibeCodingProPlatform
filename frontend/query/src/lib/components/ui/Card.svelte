<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
		class?: string;
		padding?: 'none' | 'sm' | 'md' | 'lg';
	}

	let { children, class: className = '', padding = 'md' }: Props = $props();

	const paddingClasses = {
		none: '',
		sm: 'p-3',
		md: 'p-4 md:p-5',
		lg: 'p-5 md:p-6'
	};
</script>

<div
	class="bg-card rounded-[var(--radius-card)] shadow-[var(--shadow-card)] {paddingClasses[
		padding
	]} {className}"
>
	{@render children()}
</div>
