<script lang="ts">
	import { cn } from '$lib/utils';
	import { Button } from '$lib/components/ui/button';
	import { Select, type SelectOption } from '$lib/components/ui/select';
	import { FormDialog } from '$lib/components/ui/form-dialog';
	import Save from '@lucide/svelte/icons/save';
	import X from '@lucide/svelte/icons/x';
	import AlertCircle from '@lucide/svelte/icons/alert-circle';

	export interface ItemData {
		item_id?: string;
		item_key: string;
		item_text: string;
		max_rating: number;
		label_min: string;
		label_low_mid: string;
		label_mid: string;
		label_high_mid: string;
		label_max: string;
		category?: string;
		internal_notes?: string;
		is_active?: boolean;
	}

	interface Props {
		item?: ItemData | null;
		open: boolean;
		mode: 'create' | 'edit' | 'clone';
		onSave: (item: ItemData) => void | Promise<void>;
		onCancel: () => void;
		class?: string;
	}

	let {
		item = null,
		open = $bindable(),
		mode,
		onSave,
		onCancel,
		class: className
	}: Props = $props();

	// Form state - initialized empty, populated by $effect below
	let itemKey = $state('');
	let itemText = $state('');
	let maxRating = $state('5');
	let labelMin = $state('');
	let labelLowMid = $state('');
	let labelMid = $state('');
	let labelHighMid = $state('');
	let labelMax = $state('');
	let category = $state('');
	let internalNotes = $state('');

	// Validation state
	let errors: Record<string, string> = $state({});

	// Reset form when item changes
	$effect(() => {
		if (open) {
			itemKey = mode === 'clone' ? '' : (item?.item_key ?? '');
			itemText = item?.item_text ?? '';
			maxRating = item?.max_rating?.toString() ?? '5';
			labelMin = item?.label_min ?? '';
			labelLowMid = item?.label_low_mid ?? '';
			labelMid = item?.label_mid ?? '';
			labelHighMid = item?.label_high_mid ?? '';
			labelMax = item?.label_max ?? '';
			category = item?.category ?? '';
			internalNotes = item?.internal_notes ?? '';
			errors = {};
		}
	});

	// Max rating options
	const maxRatingOptions: SelectOption[] = [
		{ value: '1', label: '1 - Binary (Yes/No)' },
		{ value: '2', label: '2 - Two-point' },
		{ value: '3', label: '3 - Three-point' },
		{ value: '5', label: '5 - Five-point (Likert)' },
		{ value: '7', label: '7 - Seven-point' },
		{ value: '10', label: '10 - Ten-point (Slider)' }
	];

	// Category options
	const categoryOptions: SelectOption[] = [
		{ value: '', label: 'Select category...' },
		{ value: 'quality', label: 'Quality Assessment' },
		{ value: 'clarity', label: 'Clarity & Communication' },
		{ value: 'engagement', label: 'Engagement & Impact' },
		{ value: 'technical', label: 'Technical Execution' },
		{ value: 'process', label: 'Process & Collaboration' }
	];

	// Determine which labels to show based on max_rating
	const showLabels = $derived({
		min: true,
		lowMid: parseInt(maxRating) >= 5,
		mid: parseInt(maxRating) >= 3,
		highMid: parseInt(maxRating) >= 5,
		max: true
	});

	// Validation
	function validate(): boolean {
		const newErrors: Record<string, string> = {};

		if (!itemKey.trim()) {
			newErrors.itemKey = 'Item key is required';
		} else if (!/^[a-z][a-z0-9_]*$/.test(itemKey)) {
			newErrors.itemKey = 'Item key must start with lowercase letter and contain only lowercase letters, numbers, and underscores';
		}

		if (!itemText.trim()) {
			newErrors.itemText = 'Item text is required';
		}

		if (!labelMin.trim()) {
			newErrors.labelMin = 'Minimum label is required';
		}

		if (!labelMax.trim()) {
			newErrors.labelMax = 'Maximum label is required';
		}

		if (showLabels.mid && !labelMid.trim()) {
			newErrors.labelMid = 'Middle label is required for this scale';
		}

		if (showLabels.lowMid && !labelLowMid.trim()) {
			newErrors.labelLowMid = 'Low-mid label is required for this scale';
		}

		if (showLabels.highMid && !labelHighMid.trim()) {
			newErrors.labelHighMid = 'High-mid label is required for this scale';
		}

		errors = newErrors;
		return Object.keys(newErrors).length === 0;
	}

	// Handle save
	async function handleSubmit() {
		if (!validate()) return;

		const itemData: ItemData = {
			item_id: mode === 'edit' ? item?.item_id : undefined,
			item_key: itemKey.trim(),
			item_text: itemText.trim(),
			max_rating: parseInt(maxRating),
			label_min: labelMin.trim(),
			label_low_mid: labelLowMid.trim(),
			label_mid: labelMid.trim(),
			label_high_mid: labelHighMid.trim(),
			label_max: labelMax.trim(),
			category: category || undefined,
			internal_notes: internalNotes.trim() || undefined
		};

		await onSave(itemData);
	}

	// Get title based on mode
	const dialogTitle = $derived(
		mode === 'create' ? 'Create New Item' : mode === 'clone' ? 'Clone Item' : 'Edit Item'
	);
</script>

<FormDialog
	bind:open
	title={dialogTitle}
	description={mode === 'edit'
		? 'Changing this item will retire the current version and create a new one.'
		: 'Define an evaluation item with question text, scale, and labels.'}
	submitLabel={mode === 'edit' ? 'Save Changes' : 'Create Item'}
	submitVariant={mode === 'edit' ? 'default' : 'default'}
	onsubmit={handleSubmit}
	oncancel={onCancel}
	class={className}
>
	<div class="space-y-6">
		<!-- Item Key -->
		<div class="space-y-1.5">
			<label for="item-key" class="block text-sm font-medium text-headers">
				Item Key
				{#if mode === 'edit'}
					<span class="text-meta font-normal">(locked)</span>
				{/if}
			</label>
			<input
				id="item-key"
				type="text"
				bind:value={itemKey}
				disabled={mode === 'edit'}
				placeholder="e.g., correctness, code_quality"
				class={cn(
					'w-full px-3 py-2 min-h-[44px]',
					'bg-card border-2 rounded-[var(--radius-card)]',
					'text-headers placeholder:text-meta',
					'focus:outline-none focus:border-primary',
					'disabled:bg-canvas disabled:text-meta disabled:cursor-not-allowed',
					errors.itemKey ? 'border-alert' : 'border-secondary'
				)}
			/>
			{#if errors.itemKey}
				<p class="flex items-center gap-1 text-sm text-alert">
					<AlertCircle class="w-4 h-4" />
					{errors.itemKey}
				</p>
			{/if}
			<p class="text-xs text-meta">
				Unique identifier. Use lowercase with underscores (e.g., test_support).
			</p>
		</div>

		<!-- Item Text (Question) -->
		<div class="space-y-1.5">
			<label for="item-text" class="block text-sm font-medium text-headers">
				Item Text (Question)
			</label>
			<textarea
				id="item-text"
				bind:value={itemText}
				rows={3}
				placeholder="How would you rate the correctness of this solution?"
				class={cn(
					'w-full px-3 py-2',
					'bg-card border-2 rounded-[var(--radius-card)]',
					'text-headers placeholder:text-meta resize-y',
					'focus:outline-none focus:border-primary',
					errors.itemText ? 'border-alert' : 'border-secondary'
				)}
			></textarea>
			{#if errors.itemText}
				<p class="flex items-center gap-1 text-sm text-alert">
					<AlertCircle class="w-4 h-4" />
					{errors.itemText}
				</p>
			{/if}
		</div>

		<!-- Max Rating -->
		<div class="space-y-1.5">
			<Select
				label="Scale Size (max_rating)"
				options={maxRatingOptions}
				bind:value={maxRating}
			/>
			<p class="text-xs text-meta">
				Determines how many rating options are displayed and which labels are used.
			</p>
		</div>

		<!-- Category (Optional) -->
		<div class="space-y-1.5">
			<Select
				label="Category (optional)"
				options={categoryOptions}
				bind:value={category}
			/>
		</div>

		<!-- Scale Labels Section -->
		<div class="space-y-4 pt-2 border-t border-secondary">
			<h3 class="text-sm font-medium text-headers">Scale Labels</h3>

			<!-- Label Min (always shown) -->
			<div class="space-y-1.5">
				<label for="label-min" class="block text-sm font-medium text-headers">
					Minimum Label (1)
				</label>
				<input
					id="label-min"
					type="text"
					bind:value={labelMin}
					placeholder="e.g., Poor, Incorrect, Strongly Disagree"
					class={cn(
						'w-full px-3 py-2 min-h-[44px]',
						'bg-card border-2 rounded-[var(--radius-card)]',
						'text-headers placeholder:text-meta',
						'focus:outline-none focus:border-primary',
						errors.labelMin ? 'border-alert' : 'border-secondary'
					)}
				/>
				{#if errors.labelMin}
					<p class="flex items-center gap-1 text-sm text-alert">
						<AlertCircle class="w-4 h-4" />
						{errors.labelMin}
					</p>
				{/if}
			</div>

			<!-- Label Low-Mid (shown for 5+ point scales) -->
			{#if showLabels.lowMid}
				<div class="space-y-1.5">
					<label for="label-low-mid" class="block text-sm font-medium text-headers">
						Low-Mid Label (2)
					</label>
					<input
						id="label-low-mid"
						type="text"
						bind:value={labelLowMid}
						placeholder="e.g., Fair, Partly, Disagree"
						class={cn(
							'w-full px-3 py-2 min-h-[44px]',
							'bg-card border-2 rounded-[var(--radius-card)]',
							'text-headers placeholder:text-meta',
							'focus:outline-none focus:border-primary',
							errors.labelLowMid ? 'border-alert' : 'border-secondary'
						)}
					/>
					{#if errors.labelLowMid}
						<p class="flex items-center gap-1 text-sm text-alert">
							<AlertCircle class="w-4 h-4" />
							{errors.labelLowMid}
						</p>
					{/if}
				</div>
			{/if}

			<!-- Label Mid (shown for 3+ point scales) -->
			{#if showLabels.mid}
				<div class="space-y-1.5">
					<label for="label-mid" class="block text-sm font-medium text-headers">
						Middle Label ({Math.ceil(parseInt(maxRating) / 2)})
					</label>
					<input
						id="label-mid"
						type="text"
						bind:value={labelMid}
						placeholder="e.g., Good, Neutral, Neither"
						class={cn(
							'w-full px-3 py-2 min-h-[44px]',
							'bg-card border-2 rounded-[var(--radius-card)]',
							'text-headers placeholder:text-meta',
							'focus:outline-none focus:border-primary',
							errors.labelMid ? 'border-alert' : 'border-secondary'
						)}
					/>
					{#if errors.labelMid}
						<p class="flex items-center gap-1 text-sm text-alert">
							<AlertCircle class="w-4 h-4" />
							{errors.labelMid}
						</p>
					{/if}
				</div>
			{/if}

			<!-- Label High-Mid (shown for 5+ point scales) -->
			{#if showLabels.highMid}
				<div class="space-y-1.5">
					<label for="label-high-mid" class="block text-sm font-medium text-headers">
						High-Mid Label ({parseInt(maxRating) - 1})
					</label>
					<input
						id="label-high-mid"
						type="text"
						bind:value={labelHighMid}
						placeholder="e.g., Very Good, Minor Issues, Agree"
						class={cn(
							'w-full px-3 py-2 min-h-[44px]',
							'bg-card border-2 rounded-[var(--radius-card)]',
							'text-headers placeholder:text-meta',
							'focus:outline-none focus:border-primary',
							errors.labelHighMid ? 'border-alert' : 'border-secondary'
						)}
					/>
					{#if errors.labelHighMid}
						<p class="flex items-center gap-1 text-sm text-alert">
							<AlertCircle class="w-4 h-4" />
							{errors.labelHighMid}
						</p>
					{/if}
				</div>
			{/if}

			<!-- Label Max (always shown) -->
			<div class="space-y-1.5">
				<label for="label-max" class="block text-sm font-medium text-headers">
					Maximum Label ({maxRating})
				</label>
				<input
					id="label-max"
					type="text"
					bind:value={labelMax}
					placeholder="e.g., Excellent, Fully Correct, Strongly Agree"
					class={cn(
						'w-full px-3 py-2 min-h-[44px]',
						'bg-card border-2 rounded-[var(--radius-card)]',
						'text-headers placeholder:text-meta',
						'focus:outline-none focus:border-primary',
						errors.labelMax ? 'border-alert' : 'border-secondary'
					)}
				/>
				{#if errors.labelMax}
					<p class="flex items-center gap-1 text-sm text-alert">
						<AlertCircle class="w-4 h-4" />
						{errors.labelMax}
					</p>
				{/if}
			</div>
		</div>

		<!-- Internal Notes (Optional) -->
		<div class="space-y-1.5">
			<label for="internal-notes" class="block text-sm font-medium text-headers">
				Internal Notes (optional)
			</label>
			<textarea
				id="internal-notes"
				bind:value={internalNotes}
				rows={2}
				placeholder="Notes for administrators about this item's usage or interpretation"
				class={cn(
					'w-full px-3 py-2',
					'bg-card border-2 border-secondary rounded-[var(--radius-card)]',
					'text-headers placeholder:text-meta resize-y',
					'focus:outline-none focus:border-primary'
				)}
			></textarea>
		</div>

		<!-- Warning for edit mode -->
		{#if mode === 'edit'}
			<div class="p-3 bg-warning-bg border border-warning rounded-[var(--radius-card)]">
				<p class="text-sm text-warning flex items-start gap-2">
					<AlertCircle class="w-4 h-4 mt-0.5 flex-shrink-0" />
					<span>
						Saving changes will <strong>retire</strong> the current version and create a new one.
						Existing assessments will retain the historical item version.
					</span>
				</p>
			</div>
		{/if}
	</div>
</FormDialog>
