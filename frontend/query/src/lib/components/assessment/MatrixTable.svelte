<script lang="ts">
	import ItemRow from './ItemRow.svelte';
	import ScaleLabels from '$lib/components/rating/ScaleLabels.svelte';

	interface ScaleHeader {
		rating_value: number;
		label: string;
	}

	interface Item {
		position_index: number;
		item_id: string;
		item_key: string;
		short_label: string;
		full_text: string;
		max_rating: number;
		current_rating: number | null;
	}

	interface Matrix {
		max_rating: number;
		common_headers: ScaleHeader[];
		rows: Item[];
	}

	interface Props {
		matrix: Matrix;
		responses: Map<string, number | null>;
		disabled?: boolean;
		onresponse: (itemId: string, value: number) => void;
	}

	let { matrix, responses, disabled = false, onresponse }: Props = $props();
</script>

<div class="space-y-2">
	<!-- Desktop: Column headers -->
	<div class="hidden md:flex items-end gap-4 pb-2 border-b border-etch-top">
		<div class="flex-shrink-0 w-1/3 pr-4">
			<span class="text-sm font-medium text-headers">Criteria</span>
		</div>
		<div class="flex-1">
			<ScaleLabels headers={matrix.common_headers} />
		</div>
	</div>

	<!-- Items -->
	<div class="space-y-1">
		{#each matrix.rows as item, index (item.item_id)}
			<ItemRow
				{item}
				headers={matrix.common_headers}
				value={responses.get(item.item_id) ?? item.current_rating}
				{disabled}
				{index}
				onchange={onresponse}
			/>
		{/each}
	</div>
</div>
