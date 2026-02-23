<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<!-- Viewport background (#DCEBFF) is set on body in app.css -->
<div class="min-h-screen w-full flex justify-center p-4 md:p-6 lg:p-8">
	<!-- Canvas container (#F1F2F8) with graduated shadow for depth -->
	<main
		class="w-full max-w-3xl bg-canvas rounded-[var(--radius-card-lg)] shadow-[var(--shadow-card)] md:shadow-[var(--shadow-canvas)] p-4 md:p-6 lg:p-8"
	>
		{@render children()}
	</main>
</div>
