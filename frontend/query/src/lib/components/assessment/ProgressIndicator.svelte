<script lang="ts">
	interface Props {
		answered: number;
		total: number;
		class?: string;
	}

	let { answered, total, class: className = '' }: Props = $props();

	let percentage = $derived(total > 0 ? Math.round((answered / total) * 100) : 0);
</script>

<div class="flex items-center gap-3 {className}">
	<!-- Progress bar -->
	<div class="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
		<div
			class="h-full bg-primary transition-all duration-300 ease-out rounded-full"
			style="width: {percentage}%"
			role="progressbar"
			aria-valuenow={answered}
			aria-valuemin={0}
			aria-valuemax={total}
			aria-label="Assessment progress"
		></div>
	</div>

	<!-- Text indicator -->
	<span class="text-sm text-labels whitespace-nowrap">
		{answered} of {total} answered
	</span>
</div>
