<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Card } from '$lib/components/ui/card';

	interface Props {
		title: string;
		subtitle?: string;
		children: Snippet;
	}

	let { title, subtitle, children }: Props = $props();
</script>

<div class="min-h-screen bg-viewport flex flex-col items-center justify-center px-4 py-8">
	<Card elevation="raised" padding="lg" class="w-full max-w-md">
		<div class="text-center mb-6">
			<h1 class="text-2xl font-bold text-headers">VibeCoding</h1>
			<p class="text-sm text-labels">Professionals</p>
		</div>

		{#if subtitle}
			<p class="text-center text-sm text-labels mb-6">{subtitle}</p>
		{/if}

		{@render children()}
	</Card>

	<p class="mt-6 text-xs text-meta text-center">
		Powered by VibeCoding Community
	</p>
</div>
