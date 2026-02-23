<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';

	interface Props {
		canSubmit: boolean;
		submitting: boolean;
		answeredCount: number;
		totalCount: number;
		onsubmit: () => void;
	}

	let { canSubmit, submitting, answeredCount, totalCount, onsubmit }: Props = $props();

	let skippedCount = $derived(totalCount - answeredCount);
</script>

<div class="mt-8 pt-6 border-t border-etch-top">
	{#if skippedCount > 0 && canSubmit}
		<p class="text-sm text-labels mb-4">
			{skippedCount} item{skippedCount !== 1 ? 's' : ''} will be skipped (not rated)
		</p>
	{/if}

	<div class="flex flex-col sm:flex-row gap-3 items-center">
		<Button
			type="button"
			variant="default"
			size="lg"
			fullWidth
			disabled={!canSubmit || submitting}
			onclick={onsubmit}
		>
			{#if submitting}
				<LoadingSpinner size="sm" class="mr-2" />
				Submitting...
			{:else}
				Submit Assessment
			{/if}
		</Button>

		{#if !canSubmit}
			<p class="text-sm text-alert">Please select your role before submitting</p>
		{/if}
	</div>
</div>
