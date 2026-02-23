<script lang="ts">
	import { Button } from '$lib/components/ui/button';

	interface Props {
		showSubmit: boolean;
		showModify: boolean;
		showClone: boolean;
		disabled?: boolean;
		onSubmit: () => void;
		onModify: () => void;
		onClone: () => void;
	}

	let {
		showSubmit,
		showModify,
		showClone,
		disabled = false,
		onSubmit,
		onModify,
		onClone
	}: Props = $props();
</script>

<div class="flex flex-wrap gap-3 mt-6 pt-6 border-t border-etch-top">
	{#if showSubmit}
		<Button variant="default" {disabled} onclick={onSubmit}>
			Submit for Review
		</Button>
	{/if}

	{#if showModify}
		<Button variant="secondary" {disabled} onclick={onModify}>
			Create New Version
		</Button>
	{/if}

	{#if showClone}
		<Button variant="ghost" {disabled} onclick={onClone}>
			Clone Problem
		</Button>
	{/if}
</div>
