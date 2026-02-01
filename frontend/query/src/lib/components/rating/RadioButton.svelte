<script lang="ts">
	interface Props {
		value: number;
		label: string;
		checked: boolean;
		disabled?: boolean;
		name: string;
		onselect: (value: number) => void;
	}

	let { value, label, checked, disabled = false, name, onselect }: Props = $props();

	function handleClick() {
		if (!disabled) {
			onselect(value);
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleClick();
		}
	}
</script>

<button
	type="button"
	role="radio"
	aria-checked={checked}
	aria-label={label}
	{disabled}
	tabindex={checked ? 0 : -1}
	onclick={handleClick}
	onkeydown={handleKeyDown}
	class="group flex items-center gap-3 min-h-[44px] min-w-[44px] px-3 py-2
		rounded-lg transition-colors cursor-pointer
		hover:bg-primary/5 focus-visible:bg-primary/5
		disabled:opacity-50 disabled:cursor-not-allowed
		md:flex-col md:items-center md:justify-center md:gap-1 md:px-2 md:py-3"
>
	<!-- Radio circle -->
	<span
		class="flex-shrink-0 w-5 h-5 rounded-full border-2 transition-all
			flex items-center justify-center
			{checked
			? 'border-primary bg-primary'
			: 'border-secondary-dark bg-card group-hover:border-primary/50'}"
	>
		{#if checked}
			<span class="w-2 h-2 rounded-full bg-white"></span>
		{/if}
	</span>

	<!-- Label -->
	<span
		class="text-sm text-labels group-hover:text-headers transition-colors
			{checked ? 'text-headers font-medium' : ''}"
	>
		{label}
	</span>
</button>
