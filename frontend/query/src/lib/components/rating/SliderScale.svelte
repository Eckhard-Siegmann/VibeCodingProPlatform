<script lang="ts">
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

	// Derive min/max from headers
	let minRating = $derived(Math.min(...headers.map((h) => h.rating_value)));
	let maxRating = $derived(Math.max(...headers.map((h) => h.rating_value)));
	let minLabel = $derived(headers.find((h) => h.rating_value === minRating)?.label ?? String(minRating));
	let maxLabel = $derived(headers.find((h) => h.rating_value === maxRating)?.label ?? String(maxRating));

	// Internal state for the slider - use middle value if no selection yet
	let sliderValue = $derived(value ?? Math.ceil((minRating + maxRating) / 2));
	let hasValue = $derived(value !== null);

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		const newValue = parseInt(target.value, 10);
		onchange(newValue);
	}
</script>

<div class="flex flex-col gap-2 w-full" role="group" aria-label={ariaLabel}>
	<!-- Mobile: Vertical layout -->
	<div class="md:hidden">
		<div class="flex justify-between text-xs text-labels mb-1">
			<span>{minLabel}</span>
			<span>{maxLabel}</span>
		</div>
		<div class="relative">
			<input
				type="range"
				{name}
				min={minRating}
				max={maxRating}
				step="1"
				value={sliderValue}
				{disabled}
				oninput={handleInput}
				aria-label={ariaLabel}
				class="w-full h-2 rounded-full appearance-none cursor-pointer
					disabled:opacity-50 disabled:cursor-not-allowed
					{hasValue ? 'accent-primary' : 'accent-secondary-dark'}"
				style="background: linear-gradient(to right,
					{hasValue ? 'var(--color-primary)' : 'var(--color-secondary-dark)'} 0%,
					{hasValue ? 'var(--color-primary)' : 'var(--color-secondary-dark)'} {((sliderValue - minRating) / (maxRating - minRating)) * 100}%,
					var(--color-secondary) {((sliderValue - minRating) / (maxRating - minRating)) * 100}%,
					var(--color-secondary) 100%)"
			/>
		</div>
	</div>

	<!-- Desktop: Horizontal layout -->
	<div class="hidden md:flex items-center gap-4">
		<span class="text-xs text-labels flex-shrink-0 w-20 text-right">{minLabel}</span>
		<div class="flex-1 relative">
			<input
				type="range"
				{name}
				min={minRating}
				max={maxRating}
				step="1"
				value={sliderValue}
				{disabled}
				oninput={handleInput}
				aria-label={ariaLabel}
				class="w-full h-2 rounded-full appearance-none cursor-pointer
					disabled:opacity-50 disabled:cursor-not-allowed"
				style="background: linear-gradient(to right,
					{hasValue ? 'var(--color-primary)' : 'var(--color-secondary-dark)'} 0%,
					{hasValue ? 'var(--color-primary)' : 'var(--color-secondary-dark)'} {((sliderValue - minRating) / (maxRating - minRating)) * 100}%,
					var(--color-secondary) {((sliderValue - minRating) / (maxRating - minRating)) * 100}%,
					var(--color-secondary) 100%)"
			/>
		</div>
		<span class="text-xs text-labels flex-shrink-0 w-20">{maxLabel}</span>
	</div>
</div>

<style>
	/* Custom slider thumb styling */
	input[type='range']::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: var(--color-primary);
		cursor: pointer;
		border: 2px solid white;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	input[type='range']::-moz-range-thumb {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: var(--color-primary);
		cursor: pointer;
		border: 2px solid white;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	input[type='range']:disabled::-webkit-slider-thumb {
		background: var(--color-secondary-dark);
		cursor: not-allowed;
	}

	input[type='range']:disabled::-moz-range-thumb {
		background: var(--color-secondary-dark);
		cursor: not-allowed;
	}

	input[type='range']:focus-visible::-webkit-slider-thumb {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}

	input[type='range']:focus-visible::-moz-range-thumb {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}
</style>
