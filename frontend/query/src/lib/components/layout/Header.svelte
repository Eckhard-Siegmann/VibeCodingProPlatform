<script lang="ts">
	interface Props {
		title: string;
		subtitle?: string;
		mode?: 'pitch' | 'review';
	}

	let { title, subtitle, mode }: Props = $props();

	const modeLabels = {
		pitch: 'Pitch Assessment',
		review: 'Review Assessment'
	};
</script>

<header class="mb-6 md:mb-8">
	{#if mode}
		<span
			class="inline-block px-3 py-1 text-sm font-medium rounded-full mb-3
			{mode === 'pitch' ? 'bg-primary/10 text-primary' : 'bg-success/10 text-success'}"
		>
			{modeLabels[mode]}
		</span>
	{/if}

	<h1 class="text-2xl md:text-3xl font-bold text-headers leading-tight">
		{title}
	</h1>

	{#if subtitle}
		<p class="mt-2 text-labels text-sm md:text-base">
			{subtitle}
		</p>
	{/if}
</header>
