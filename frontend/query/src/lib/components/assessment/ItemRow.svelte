<script lang="ts">
	import ButtonScale from '$lib/components/rating/ButtonScale.svelte';
	import Card from '$lib/components/ui/Card.svelte';

	interface ScaleHeader {
		rating_value: number;
		label: string;
	}

	interface Item {
		item_id: string;
		item_key: string;
		short_label: string;
		full_text: string;
		max_rating: number;
	}

	interface Props {
		item: Item;
		headers: ScaleHeader[];
		value: number | null;
		disabled?: boolean;
		index: number;
		onchange: (itemId: string, value: number) => void;
	}

	let { item, headers, value, disabled = false, index, onchange }: Props = $props();

	function handleChange(newValue: number) {
		onchange(item.item_id, newValue);
	}

	// Alternate row background
	let isEven = $derived(index % 2 === 0);
</script>

<!-- Mobile: Card layout -->
<div class="md:hidden">
	<Card class="mb-3 {isEven ? 'bg-card' : 'bg-canvas/50'}">
		<div class="mb-3">
			<h3 class="font-medium text-headers text-base">{item.short_label}</h3>
			<p class="text-sm text-labels mt-1">{item.full_text}</p>
		</div>

		<ButtonScale
			name={item.item_id}
			{headers}
			{value}
			{disabled}
			onchange={handleChange}
			ariaLabel={item.short_label}
		/>
	</Card>
</div>

<!-- Desktop: Table row layout -->
<div
	class="hidden md:flex items-start gap-4 py-4 px-3 rounded-lg
		{isEven ? 'bg-card' : 'bg-canvas/30'}"
>
	<!-- Item label and description -->
	<div class="flex-shrink-0 w-1/3 pr-4">
		<h3 class="font-medium text-headers text-sm">{item.short_label}</h3>
		<p class="text-xs text-labels mt-1 line-clamp-2">{item.full_text}</p>
	</div>

	<!-- Rating scale -->
	<div class="flex-1">
		<ButtonScale
			name={item.item_id}
			{headers}
			{value}
			{disabled}
			onchange={handleChange}
			ariaLabel={item.short_label}
		/>
	</div>
</div>
