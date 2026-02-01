<script lang="ts">
	interface ScaleHeader {
		rating_value: number;
		label: string;
	}

	interface Props {
		headers: ScaleHeader[];
		class?: string;
	}

	let { headers, class: className = '' }: Props = $props();
</script>

<!-- Desktop-only column headers for matrix table -->
<div class="hidden md:flex gap-2 lg:gap-3 text-center text-xs text-meta font-medium {className}">
	{#each headers as header (header.rating_value)}
		<div class="flex-1 min-w-[44px] px-2 truncate" title={header.label}>
			{header.label}
		</div>
	{/each}
</div>
