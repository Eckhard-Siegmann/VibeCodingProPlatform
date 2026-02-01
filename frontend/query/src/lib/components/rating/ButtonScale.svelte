<script lang="ts">
	import RadioButton from './RadioButton.svelte';

	interface ScaleHeader {
		rating_value: number;
		label: string;
	}

	interface Props {
		name: string;
		headers: ScaleHeader[];
		value: number | null;
		disabled?: boolean;
		onchange: (value: number) => void;
		ariaLabel?: string;
	}

	let { name, headers, value, disabled = false, onchange, ariaLabel }: Props = $props();

	function handleSelect(selectedValue: number) {
		onchange(selectedValue);
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (disabled) return;

		const currentIndex = value ? headers.findIndex((h) => h.rating_value === value) : -1;
		let newIndex = currentIndex;

		if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
			event.preventDefault();
			newIndex = currentIndex < headers.length - 1 ? currentIndex + 1 : 0;
		} else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
			event.preventDefault();
			newIndex = currentIndex > 0 ? currentIndex - 1 : headers.length - 1;
		} else if (event.key === 'Home') {
			event.preventDefault();
			newIndex = 0;
		} else if (event.key === 'End') {
			event.preventDefault();
			newIndex = headers.length - 1;
		}

		if (newIndex !== currentIndex && newIndex >= 0) {
			onchange(headers[newIndex].rating_value);
		}
	}
</script>

<!-- svelte-ignore a11y_interactive_supports_focus -->
<div
	role="radiogroup"
	aria-label={ariaLabel}
	class="flex flex-col gap-1 md:flex-row md:gap-2 lg:gap-3"
	onkeydown={handleKeyDown}
>
	{#each headers as header (header.rating_value)}
		<RadioButton
			{name}
			value={header.rating_value}
			label={header.label}
			checked={value === header.rating_value}
			{disabled}
			onselect={handleSelect}
		/>
	{/each}
</div>
