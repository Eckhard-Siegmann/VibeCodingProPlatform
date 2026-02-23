<script lang="ts">
	/**
	 * EditableField - Auto-save input component with visual feedback
	 *
	 * Per spec Chapter 04 & 13: Changes are persisted immediately on field modification
	 * while the problem is in draft state. Uses 300ms debounce for auto-save.
	 */

	interface Props {
		value: string | number;
		field: string;
		label?: string;
		type?: 'text' | 'textarea' | 'number' | 'url';
		placeholder?: string;
		required?: boolean;
		min?: number;
		onUpdate: (field: string, value: string | number) => Promise<boolean>;
	}

	let {
		value,
		field,
		label,
		type = 'text',
		placeholder = '',
		required = false,
		min,
		onUpdate
	}: Props = $props();

	let localValue = $state(String(value));
	let saveStatus = $state<'idle' | 'saving' | 'saved' | 'error'>('idle');
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	// Sync local value when prop changes externally
	$effect(() => {
		localValue = String(value);
	});

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement | HTMLTextAreaElement;
		localValue = target.value;

		// Clear existing timer
		if (debounceTimer) {
			clearTimeout(debounceTimer);
		}

		// Set new debounce timer (300ms per plan)
		debounceTimer = setTimeout(() => {
			saveValue();
		}, 300);
	}

	async function saveValue() {
		// Parse value based on type
		let parsedValue: string | number = localValue;
		if (type === 'number') {
			parsedValue = parseInt(localValue, 10);
			if (isNaN(parsedValue)) return;
		}

		// Don't save if value hasn't changed
		if (parsedValue === value) return;

		saveStatus = 'saving';

		try {
			const success = await onUpdate(field, parsedValue);
			if (success) {
				saveStatus = 'saved';
				// Reset to idle after showing saved status
				setTimeout(() => {
					if (saveStatus === 'saved') {
						saveStatus = 'idle';
					}
				}, 2000);
			} else {
				saveStatus = 'error';
			}
		} catch {
			saveStatus = 'error';
		}
	}

	// Handle blur to save immediately
	function handleBlur() {
		if (debounceTimer) {
			clearTimeout(debounceTimer);
			debounceTimer = null;
		}
		saveValue();
	}

	const baseInputClass =
		'w-full rounded-lg border bg-white px-3 py-2 text-headers transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

	const statusBorderClass = $derived(
		saveStatus === 'saving'
			? 'border-pending'
			: saveStatus === 'saved'
				? 'border-success'
				: saveStatus === 'error'
					? 'border-alert'
					: 'border-secondary'
	);
</script>

<div class="space-y-1">
	{#if label}
		<label for={field} class="block text-sm font-medium text-labels">
			{label}
			{#if required}<span class="text-alert">*</span>{/if}
		</label>
	{/if}

	<div class="relative">
		{#if type === 'textarea'}
			<textarea
				id={field}
				class="{baseInputClass} {statusBorderClass} min-h-[120px] resize-y"
				{placeholder}
				{required}
				value={localValue}
				oninput={handleInput}
				onblur={handleBlur}
			></textarea>
		{:else if type === 'number'}
			<input
				id={field}
				type="number"
				class="{baseInputClass} {statusBorderClass}"
				{placeholder}
				{required}
				{min}
				value={localValue}
				oninput={handleInput}
				onblur={handleBlur}
			/>
		{:else}
			<input
				id={field}
				type={type === 'url' ? 'url' : 'text'}
				class="{baseInputClass} {statusBorderClass}"
				{placeholder}
				{required}
				value={localValue}
				oninput={handleInput}
				onblur={handleBlur}
			/>
		{/if}

		<!-- Save status indicator -->
		{#if saveStatus !== 'idle'}
			<div class="absolute right-3 top-1/2 -translate-y-1/2">
				{#if saveStatus === 'saving'}
					<span class="text-xs text-pending">Saving...</span>
				{:else if saveStatus === 'saved'}
					<span class="text-xs text-success">Saved</span>
				{:else if saveStatus === 'error'}
					<span class="text-xs text-alert">Error</span>
				{/if}
			</div>
		{/if}
	</div>
</div>
