<script lang="ts" module>
	export interface SoftCatalogEntry {
		key: string;
		display_name: string;
		description: string | null;
		sort_order: number;
		is_active: number;
		created_at: string;
	}

	export interface EmojiEntry {
		emoji: string;
		display_name: string;
		sort_order: number;
		is_active: number;
	}

	export interface ContributionActionEntry {
		action_key: string;
		display_name: string;
		description: string | null;
		default_points: number;
		current_points: number;
		is_active: number;
		created_at: string;
	}

	export interface ReviewWeightEntry {
		weight_key: string;
		display_name: string;
		weight_multiplier: number;
		description: string | null;
		is_active: number;
		created_at: string;
	}

	export type CatalogTab =
		| 'problem_types'
		| 'emojis'
		| 'lesson_categories'
		| 'contribution_weights'
		| 'review_weights';
</script>

<script lang="ts">
	import { cn } from '$lib/utils';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { FormDialog } from '$lib/components/ui/form-dialog';
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
	import Plus from '@lucide/svelte/icons/plus';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Power from '@lucide/svelte/icons/power';
	import PowerOff from '@lucide/svelte/icons/power-off';
	import Save from '@lucide/svelte/icons/save';

	interface Props {
		problemTypes: SoftCatalogEntry[];
		emojis: EmojiEntry[];
		lessonCategories: SoftCatalogEntry[];
		contributionWeights: ContributionActionEntry[];
		reviewWeights: ReviewWeightEntry[];
	}

	let {
		problemTypes = $bindable(),
		emojis = $bindable(),
		lessonCategories = $bindable(),
		contributionWeights = $bindable(),
		reviewWeights = $bindable()
	}: Props = $props();

	// ── Tab state ──────────────────────────────────────────────────
	let activeTab: CatalogTab = $state('problem_types');

	const tabs: { key: CatalogTab; label: string }[] = [
		{ key: 'problem_types', label: 'Problem Types' },
		{ key: 'emojis', label: 'Emojis' },
		{ key: 'lesson_categories', label: 'Lesson Categories' },
		{ key: 'contribution_weights', label: 'Contribution Weights' },
		{ key: 'review_weights', label: 'Review Weights' }
	];

	let showInactive = $state(false);

	// ── Add/Edit dialog state ──────────────────────────────────────
	let dialogOpen = $state(false);
	let dialogMode: 'add' | 'edit' = $state('add');
	let editKey = $state('');
	let formKey = $state('');
	let formDisplayName = $state('');
	let formDescription = $state('');
	let formSortOrder = $state(1);
	let formEmoji = $state('');
	let formDefaultPoints = $state(1);
	let formCurrentPoints = $state(1);
	let formWeightMultiplier = $state(1.0);
	let formError = $state('');

	// ── Confirm dialog state ───────────────────────────────────────
	let confirmOpen = $state(false);
	let confirmTitle = $state('');
	let confirmDescription = $state('');
	let confirmAction: (() => void) | null = $state(null);

	// ── Inline weight edit state ───────────────────────────────────
	let editingWeightKey = $state('');
	let editingWeightValue = $state(0);

	// ── Helpers ────────────────────────────────────────────────────
	function resetForm() {
		formKey = '';
		formDisplayName = '';
		formDescription = '';
		formSortOrder = 1;
		formEmoji = '';
		formDefaultPoints = 1;
		formCurrentPoints = 1;
		formWeightMultiplier = 1.0;
		formError = '';
		editKey = '';
	}

	function openAddDialog() {
		dialogMode = 'add';
		resetForm();

		// Auto-set sort_order to max + 1
		if (activeTab === 'problem_types') {
			formSortOrder = Math.max(0, ...problemTypes.map((e) => e.sort_order)) + 1;
		} else if (activeTab === 'lesson_categories') {
			formSortOrder = Math.max(0, ...lessonCategories.map((e) => e.sort_order)) + 1;
		} else if (activeTab === 'emojis') {
			formSortOrder = Math.max(0, ...emojis.map((e) => e.sort_order)) + 1;
		}
		dialogOpen = true;
	}

	function openEditDialog(entry: SoftCatalogEntry | EmojiEntry | ContributionActionEntry | ReviewWeightEntry) {
		dialogMode = 'edit';
		resetForm();

		if (activeTab === 'emojis') {
			const e = entry as EmojiEntry;
			editKey = e.emoji;
			formEmoji = e.emoji;
			formDisplayName = e.display_name;
			formSortOrder = e.sort_order;
		} else if (activeTab === 'contribution_weights') {
			const e = entry as ContributionActionEntry;
			editKey = e.action_key;
			formKey = e.action_key;
			formDisplayName = e.display_name;
			formDescription = e.description ?? '';
			formDefaultPoints = e.default_points;
			formCurrentPoints = e.current_points;
		} else if (activeTab === 'review_weights') {
			const e = entry as ReviewWeightEntry;
			editKey = e.weight_key;
			formDisplayName = e.display_name;
			formDescription = e.description ?? '';
			formWeightMultiplier = e.weight_multiplier;
		} else {
			const e = entry as SoftCatalogEntry;
			editKey = e.key;
			formKey = e.key;
			formDisplayName = e.display_name;
			formDescription = e.description ?? '';
			formSortOrder = e.sort_order;
		}
		dialogOpen = true;
	}

	// ── API calls ──────────────────────────────────────────────────
	async function handleSubmit() {
		formError = '';

		try {
			if (dialogMode === 'add') {
				await addEntry();
			} else {
				await editEntry();
			}
		} catch (err) {
			formError = err instanceof Error ? err.message : 'An error occurred';
			throw err; // Rethrow so FormDialog doesn't close
		}
	}

	async function addEntry() {
		let body: Record<string, unknown>;

		if (activeTab === 'emojis') {
			if (!formEmoji || !formDisplayName) {
				formError = 'Emoji and display name are required';
				throw new Error(formError);
			}
			body = { emoji: formEmoji, display_name: formDisplayName, sort_order: formSortOrder };
		} else if (activeTab === 'contribution_weights') {
			if (!formKey || !formDisplayName) {
				formError = 'Key and display name are required';
				throw new Error(formError);
			}
			body = {
				action_key: formKey,
				display_name: formDisplayName,
				description: formDescription || undefined,
				default_points: formDefaultPoints,
				current_points: formCurrentPoints
			};
		} else {
			if (!formKey || !formDisplayName) {
				formError = 'Key and display name are required';
				throw new Error(formError);
			}
			if (!/^[a-z][a-z0-9_]*$/.test(formKey)) {
				formError = 'Key must start with a letter and contain only lowercase letters, digits, and underscores';
				throw new Error(formError);
			}
			body = {
				key: formKey,
				display_name: formDisplayName,
				description: formDescription || undefined,
				sort_order: formSortOrder
			};
		}

		const res = await fetch(`/api/admin/catalogs/${activeTab}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});

		if (!res.ok) {
			const data = await res.json().catch(() => ({ message: 'Request failed' }));
			throw new Error(data.message ?? `Server error ${res.status}`);
		}

		// Reload data
		await reloadTab();
	}

	async function editEntry() {
		let body: Record<string, unknown>;

		if (activeTab === 'emojis') {
			body = { display_name: formDisplayName, sort_order: formSortOrder };
		} else if (activeTab === 'contribution_weights') {
			body = { display_name: formDisplayName, description: formDescription || undefined };
		} else if (activeTab === 'review_weights') {
			body = { display_name: formDisplayName, description: formDescription || undefined };
		} else {
			body = {
				display_name: formDisplayName,
				description: formDescription || undefined,
				sort_order: formSortOrder
			};
		}

		const res = await fetch(`/api/admin/catalogs/${activeTab}/${encodeURIComponent(editKey)}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});

		if (!res.ok) {
			const data = await res.json().catch(() => ({ message: 'Request failed' }));
			throw new Error(data.message ?? `Server error ${res.status}`);
		}

		await reloadTab();
	}

	async function toggleActive(key: string, currentlyActive: boolean) {
		const action = currentlyActive ? 'Deactivate' : 'Reactivate';
		confirmTitle = `${action} "${key}"?`;
		confirmDescription = currentlyActive
			? `This will prevent this entry from being used in new records. Existing data will not be affected.`
			: `This will make this entry available for use again.`;

		confirmAction = async () => {
			const res = await fetch(`/api/admin/catalogs/${activeTab}/${encodeURIComponent(key)}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ is_active: !currentlyActive })
			});

			if (!res.ok) {
				const data = await res.json().catch(() => ({ message: 'Request failed' }));
				console.error('Toggle failed:', data);
			}

			await reloadTab();
		};
		confirmOpen = true;
	}

	async function saveWeight(key: string, value: number, type: 'contribution' | 'review') {
		const body =
			type === 'contribution'
				? { current_points: value }
				: { weight_multiplier: value };

		const res = await fetch(`/api/admin/catalogs/${activeTab}/${encodeURIComponent(key)}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});

		if (!res.ok) {
			const data = await res.json().catch(() => ({ message: 'Request failed' }));
			console.error('Weight update failed:', data);
			return;
		}

		editingWeightKey = '';
		await reloadTab();
	}

	async function reloadTab() {
		try {
			const res = await fetch(`/api/admin/catalogs/${activeTab}`);
			if (!res.ok) return;
			const data = await res.json();

			switch (activeTab) {
				case 'problem_types':
					problemTypes = data.entries;
					break;
				case 'emojis':
					emojis = data.entries;
					break;
				case 'lesson_categories':
					lessonCategories = data.entries;
					break;
				case 'contribution_weights':
					contributionWeights = data.entries;
					break;
				case 'review_weights':
					reviewWeights = data.entries;
					break;
			}
		} catch {
			// Silently fail reload — data shown may be stale
		}
	}

	// ── Filtered data ──────────────────────────────────────────────
	let filteredProblemTypes = $derived(
		showInactive ? problemTypes : problemTypes.filter((e) => e.is_active)
	);
	let filteredEmojis = $derived(
		showInactive ? emojis : emojis.filter((e) => e.is_active)
	);
	let filteredLessonCategories = $derived(
		showInactive ? lessonCategories : lessonCategories.filter((e) => e.is_active)
	);
	let filteredContribWeights = $derived(
		showInactive ? contributionWeights : contributionWeights.filter((e) => e.is_active)
	);
	let filteredReviewWeights = $derived(
		showInactive ? reviewWeights : reviewWeights.filter((e) => e.is_active)
	);

	// Dialog title based on mode + tab
	let dialogTitle = $derived(
		dialogMode === 'add'
			? `Add ${tabs.find((t) => t.key === activeTab)?.label?.replace(/s$/, '') ?? 'Entry'}`
			: `Edit ${tabs.find((t) => t.key === activeTab)?.label?.replace(/s$/, '') ?? 'Entry'}`
	);

	// Can add new entries? (review_weights doesn't support add)
	let canAdd = $derived((activeTab as string) !== 'review_weights');
</script>

<!-- Tab Bar -->
<div class="overflow-x-auto -mx-4 px-4 mb-6">
	<div class="flex gap-1 min-w-max" role="tablist">
		{#each tabs as tab (tab.key)}
			<button
				type="button"
				role="tab"
				aria-selected={activeTab === tab.key}
				class={cn(
					'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
					'min-h-[44px] min-w-[44px]',
					activeTab === tab.key
						? 'bg-primary text-white'
						: 'bg-canvas text-labels hover:bg-secondary/50'
				)}
				onclick={() => (activeTab = tab.key)}
			>
				{tab.label}
			</button>
		{/each}
	</div>
</div>

<!-- Toolbar -->
<div class="flex items-center justify-between gap-3 mb-4 flex-wrap">
	{#if canAdd}
		<Button variant="default" onclick={openAddDialog} class="gap-2">
			<Plus class="w-4 h-4" />
			Add
		</Button>
	{:else}
		<div></div>
	{/if}

	<label class="flex items-center gap-2 text-sm text-labels cursor-pointer">
		<input type="checkbox" bind:checked={showInactive} class="rounded" />
		Show Inactive
	</label>
</div>

<!-- Content per tab -->
{#if activeTab === 'problem_types'}
	{#if filteredProblemTypes.length === 0}
		<div class="py-12 text-center text-meta">No problem types found</div>
	{:else}
		<div class="space-y-3">
			{#each filteredProblemTypes as entry (entry.key)}
				<Card elevation={entry.is_active ? 'resting' : 'flat'} class={cn(!entry.is_active && 'opacity-60')}>
					<CardContent class="flex items-start justify-between gap-4 py-4">
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2 flex-wrap">
								<code class="text-sm font-mono text-headers">{entry.key}</code>
								<Badge variant={entry.is_active ? 'ready' : 'draft'}>
									{entry.is_active ? 'Active' : 'Inactive'}
								</Badge>
							</div>
							<p class="text-sm font-medium text-headers mt-1">{entry.display_name}</p>
							{#if entry.description}
								<p class="text-xs text-meta mt-0.5">{entry.description}</p>
							{/if}
						</div>
						<div class="flex items-center gap-1 shrink-0">
							<button
								type="button"
								class="p-2 rounded-[var(--radius-card)] text-meta hover:bg-canvas min-h-[44px] min-w-[44px] flex items-center justify-center"
								title="Edit"
								onclick={() => openEditDialog(entry)}
							>
								<Pencil class="w-4 h-4" />
							</button>
							<button
								type="button"
								class={cn(
									'p-2 rounded-[var(--radius-card)] min-h-[44px] min-w-[44px] flex items-center justify-center',
									entry.is_active ? 'text-warning hover:bg-warning-bg' : 'text-success hover:bg-success/10'
								)}
								title={entry.is_active ? 'Deactivate' : 'Reactivate'}
								onclick={() => toggleActive(entry.key, !!entry.is_active)}
							>
								{#if entry.is_active}
									<PowerOff class="w-4 h-4" />
								{:else}
									<Power class="w-4 h-4" />
								{/if}
							</button>
						</div>
					</CardContent>
				</Card>
			{/each}
		</div>
	{/if}
{:else if activeTab === 'emojis'}
	{#if filteredEmojis.length === 0}
		<div class="py-12 text-center text-meta">No emojis found</div>
	{:else}
		<div class="space-y-3">
			{#each filteredEmojis as entry (entry.emoji)}
				<Card elevation={entry.is_active ? 'resting' : 'flat'} class={cn(!entry.is_active && 'opacity-60')}>
					<CardContent class="flex items-center justify-between gap-4 py-4">
						<div class="flex items-center gap-3 flex-1 min-w-0">
							<span class="text-3xl">{entry.emoji}</span>
							<div>
								<p class="text-sm font-medium text-headers">{entry.display_name}</p>
								<Badge variant={entry.is_active ? 'ready' : 'draft'} class="mt-0.5">
									{entry.is_active ? 'Active' : 'Inactive'}
								</Badge>
							</div>
						</div>
						<div class="flex items-center gap-1 shrink-0">
							<button
								type="button"
								class="p-2 rounded-[var(--radius-card)] text-meta hover:bg-canvas min-h-[44px] min-w-[44px] flex items-center justify-center"
								title="Edit"
								onclick={() => openEditDialog(entry)}
							>
								<Pencil class="w-4 h-4" />
							</button>
							<button
								type="button"
								class={cn(
									'p-2 rounded-[var(--radius-card)] min-h-[44px] min-w-[44px] flex items-center justify-center',
									entry.is_active ? 'text-warning hover:bg-warning-bg' : 'text-success hover:bg-success/10'
								)}
								title={entry.is_active ? 'Deactivate' : 'Reactivate'}
								onclick={() => toggleActive(entry.emoji, !!entry.is_active)}
							>
								{#if entry.is_active}
									<PowerOff class="w-4 h-4" />
								{:else}
									<Power class="w-4 h-4" />
								{/if}
							</button>
						</div>
					</CardContent>
				</Card>
			{/each}
		</div>
	{/if}
{:else if activeTab === 'lesson_categories'}
	{#if filteredLessonCategories.length === 0}
		<div class="py-12 text-center text-meta">No lesson categories found</div>
	{:else}
		<div class="space-y-3">
			{#each filteredLessonCategories as entry (entry.key)}
				<Card elevation={entry.is_active ? 'resting' : 'flat'} class={cn(!entry.is_active && 'opacity-60')}>
					<CardContent class="flex items-start justify-between gap-4 py-4">
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2 flex-wrap">
								<code class="text-sm font-mono text-headers">{entry.key}</code>
								<Badge variant={entry.is_active ? 'ready' : 'draft'}>
									{entry.is_active ? 'Active' : 'Inactive'}
								</Badge>
							</div>
							<p class="text-sm font-medium text-headers mt-1">{entry.display_name}</p>
							{#if entry.description}
								<p class="text-xs text-meta mt-0.5">{entry.description}</p>
							{/if}
						</div>
						<div class="flex items-center gap-1 shrink-0">
							<button
								type="button"
								class="p-2 rounded-[var(--radius-card)] text-meta hover:bg-canvas min-h-[44px] min-w-[44px] flex items-center justify-center"
								title="Edit"
								onclick={() => openEditDialog(entry)}
							>
								<Pencil class="w-4 h-4" />
							</button>
							<button
								type="button"
								class={cn(
									'p-2 rounded-[var(--radius-card)] min-h-[44px] min-w-[44px] flex items-center justify-center',
									entry.is_active ? 'text-warning hover:bg-warning-bg' : 'text-success hover:bg-success/10'
								)}
								title={entry.is_active ? 'Deactivate' : 'Reactivate'}
								onclick={() => toggleActive(entry.key, !!entry.is_active)}
							>
								{#if entry.is_active}
									<PowerOff class="w-4 h-4" />
								{:else}
									<Power class="w-4 h-4" />
								{/if}
							</button>
						</div>
					</CardContent>
				</Card>
			{/each}
		</div>
	{/if}
{:else if activeTab === 'contribution_weights'}
	{#if filteredContribWeights.length === 0}
		<div class="py-12 text-center text-meta">No contribution actions found</div>
	{:else}
		<div class="space-y-3">
			{#each filteredContribWeights as entry (entry.action_key)}
				<Card elevation={entry.is_active ? 'resting' : 'flat'} class={cn(!entry.is_active && 'opacity-60')}>
					<CardContent class="py-4">
						<div class="flex items-start justify-between gap-4">
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-2 flex-wrap">
									<code class="text-sm font-mono text-headers">{entry.action_key}</code>
									<Badge variant={entry.is_active ? 'ready' : 'draft'}>
										{entry.is_active ? 'Active' : 'Inactive'}
									</Badge>
								</div>
								<p class="text-sm font-medium text-headers mt-1">{entry.display_name}</p>
								{#if entry.description}
									<p class="text-xs text-meta mt-0.5">{entry.description}</p>
								{/if}
							</div>
							<div class="flex items-center gap-1 shrink-0">
								<button
									type="button"
									class="p-2 rounded-[var(--radius-card)] text-meta hover:bg-canvas min-h-[44px] min-w-[44px] flex items-center justify-center"
									title="Edit"
									onclick={() => openEditDialog(entry)}
								>
									<Pencil class="w-4 h-4" />
								</button>
								<button
									type="button"
									class={cn(
										'p-2 rounded-[var(--radius-card)] min-h-[44px] min-w-[44px] flex items-center justify-center',
										entry.is_active ? 'text-warning hover:bg-warning-bg' : 'text-success hover:bg-success/10'
									)}
									title={entry.is_active ? 'Deactivate' : 'Reactivate'}
									onclick={() => toggleActive(entry.action_key, !!entry.is_active)}
								>
									{#if entry.is_active}
										<PowerOff class="w-4 h-4" />
									{:else}
										<Power class="w-4 h-4" />
									{/if}
								</button>
							</div>
						</div>
						<!-- Inline weight editor -->
						<div class="flex items-center gap-3 mt-3 pt-3 border-t border-secondary/50">
							<span class="text-xs text-meta whitespace-nowrap">Default: {entry.default_points}pt</span>
							<label class="flex items-center gap-2 flex-1">
								<span class="text-xs text-labels whitespace-nowrap">Current:</span>
								<input
									type="number"
									min="0"
									value={editingWeightKey === entry.action_key ? editingWeightValue : entry.current_points}
									onfocus={() => { editingWeightKey = entry.action_key; editingWeightValue = entry.current_points; }}
									oninput={(e) => { editingWeightValue = parseInt((e.target as HTMLInputElement).value) || 0; }}
									class="w-20 px-2 py-1 text-sm border border-secondary rounded-[var(--radius-card)] bg-card text-headers"
								/>
								<span class="text-xs text-meta">pt</span>
							</label>
							{#if editingWeightKey === entry.action_key}
								<button
									type="button"
									class="p-2 rounded-[var(--radius-card)] text-primary hover:bg-primary/10 min-h-[44px] min-w-[44px] flex items-center justify-center"
									title="Save weight"
									onclick={() => saveWeight(entry.action_key, editingWeightValue, 'contribution')}
								>
									<Save class="w-4 h-4" />
								</button>
							{/if}
						</div>
					</CardContent>
				</Card>
			{/each}
		</div>
	{/if}
{:else if activeTab === 'review_weights'}
	{#if filteredReviewWeights.length === 0}
		<div class="py-12 text-center text-meta">No review weights found</div>
	{:else}
		<div class="space-y-3">
			{#each filteredReviewWeights as entry (entry.weight_key)}
				<Card elevation={entry.is_active ? 'resting' : 'flat'} class={cn(!entry.is_active && 'opacity-60')}>
					<CardContent class="py-4">
						<div class="flex items-start justify-between gap-4">
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-2 flex-wrap">
									<code class="text-sm font-mono text-headers">{entry.weight_key}</code>
									<Badge variant={entry.is_active ? 'ready' : 'draft'}>
										{entry.is_active ? 'Active' : 'Inactive'}
									</Badge>
								</div>
								<p class="text-sm font-medium text-headers mt-1">{entry.display_name}</p>
								{#if entry.description}
									<p class="text-xs text-meta mt-0.5">{entry.description}</p>
								{/if}
							</div>
							<div class="flex items-center gap-1 shrink-0">
								<button
									type="button"
									class="p-2 rounded-[var(--radius-card)] text-meta hover:bg-canvas min-h-[44px] min-w-[44px] flex items-center justify-center"
									title="Edit"
									onclick={() => openEditDialog(entry)}
								>
									<Pencil class="w-4 h-4" />
								</button>
								<button
									type="button"
									class={cn(
										'p-2 rounded-[var(--radius-card)] min-h-[44px] min-w-[44px] flex items-center justify-center',
										entry.is_active ? 'text-warning hover:bg-warning-bg' : 'text-success hover:bg-success/10'
									)}
									title={entry.is_active ? 'Deactivate' : 'Reactivate'}
									onclick={() => toggleActive(entry.weight_key, !!entry.is_active)}
								>
									{#if entry.is_active}
										<PowerOff class="w-4 h-4" />
									{:else}
										<Power class="w-4 h-4" />
									{/if}
								</button>
							</div>
						</div>
						<!-- Inline multiplier editor -->
						<div class="flex items-center gap-3 mt-3 pt-3 border-t border-secondary/50">
							<label class="flex items-center gap-2 flex-1">
								<span class="text-xs text-labels whitespace-nowrap">Multiplier:</span>
								<input
									type="number"
									min="0"
									step="0.05"
									value={editingWeightKey === entry.weight_key ? editingWeightValue : entry.weight_multiplier}
									onfocus={() => { editingWeightKey = entry.weight_key; editingWeightValue = entry.weight_multiplier; }}
									oninput={(e) => { editingWeightValue = parseFloat((e.target as HTMLInputElement).value) || 0; }}
									class="w-24 px-2 py-1 text-sm border border-secondary rounded-[var(--radius-card)] bg-card text-headers"
								/>
								<span class="text-xs text-meta">x</span>
							</label>
							{#if editingWeightKey === entry.weight_key}
								<button
									type="button"
									class="p-2 rounded-[var(--radius-card)] text-primary hover:bg-primary/10 min-h-[44px] min-w-[44px] flex items-center justify-center"
									title="Save multiplier"
									onclick={() => saveWeight(entry.weight_key, editingWeightValue, 'review')}
								>
									<Save class="w-4 h-4" />
								</button>
							{/if}
						</div>
					</CardContent>
				</Card>
			{/each}
		</div>
	{/if}
{/if}

<!-- Add/Edit Dialog -->
<FormDialog
	bind:open={dialogOpen}
	title={dialogTitle}
	submitLabel={dialogMode === 'add' ? 'Add Entry' : 'Save Changes'}
	onsubmit={handleSubmit}
>
	<div class="space-y-4">
		{#if formError}
			<div class="p-3 bg-alert/10 text-alert text-sm rounded-[var(--radius-card)]" role="alert">
				{formError}
			</div>
		{/if}

		{#if activeTab === 'emojis'}
			<!-- Emoji form -->
			{#if dialogMode === 'add'}
				<div>
					<label for="emoji-char" class="block text-sm font-medium text-labels mb-1">
						Emoji Character <span class="text-alert">*</span>
					</label>
					<input
						id="emoji-char"
						type="text"
						bind:value={formEmoji}
						class="w-full px-3 py-2 border border-secondary rounded-[var(--radius-card)] bg-card text-headers text-2xl"
						required
						aria-required="true"
						maxlength="4"
					/>
				</div>
			{/if}
			<div>
				<label for="emoji-name" class="block text-sm font-medium text-labels mb-1">
					Display Name <span class="text-alert">*</span>
				</label>
				<input
					id="emoji-name"
					type="text"
					bind:value={formDisplayName}
					class="w-full px-3 py-2 border border-secondary rounded-[var(--radius-card)] bg-card text-headers"
					required
					aria-required="true"
					maxlength="60"
				/>
			</div>
			<div>
				<label for="emoji-sort" class="block text-sm font-medium text-labels mb-1">
					Sort Order <span class="text-alert">*</span>
				</label>
				<input
					id="emoji-sort"
					type="number"
					bind:value={formSortOrder}
					min="1"
					class="w-full px-3 py-2 border border-secondary rounded-[var(--radius-card)] bg-card text-headers"
					required
					aria-required="true"
				/>
			</div>
		{:else if activeTab === 'contribution_weights'}
			<!-- Contribution action form -->
			{#if dialogMode === 'add'}
				<div>
					<label for="action-key" class="block text-sm font-medium text-labels mb-1">
						Action Key <span class="text-alert">*</span>
					</label>
					<input
						id="action-key"
						type="text"
						bind:value={formKey}
						class="w-full px-3 py-2 border border-secondary rounded-[var(--radius-card)] bg-card text-headers font-mono"
						required
						aria-required="true"
						pattern="^[a-z][a-z0-9_]*$"
						placeholder="e.g. late_review_completed"
					/>
				</div>
			{/if}
			<div>
				<label for="action-name" class="block text-sm font-medium text-labels mb-1">
					Display Name <span class="text-alert">*</span>
				</label>
				<input
					id="action-name"
					type="text"
					bind:value={formDisplayName}
					class="w-full px-3 py-2 border border-secondary rounded-[var(--radius-card)] bg-card text-headers"
					required
					aria-required="true"
					maxlength="60"
				/>
			</div>
			<div>
				<label for="action-desc" class="block text-sm font-medium text-labels mb-1">
					Description
				</label>
				<textarea
					id="action-desc"
					bind:value={formDescription}
					rows="2"
					class="w-full px-3 py-2 border border-secondary rounded-[var(--radius-card)] bg-card text-headers resize-y"
				></textarea>
			</div>
			{#if dialogMode === 'add'}
				<div class="grid grid-cols-2 gap-3">
					<div>
						<label for="default-pts" class="block text-sm font-medium text-labels mb-1">
							Default Points <span class="text-alert">*</span>
						</label>
						<input
							id="default-pts"
							type="number"
							bind:value={formDefaultPoints}
							min="0"
							class="w-full px-3 py-2 border border-secondary rounded-[var(--radius-card)] bg-card text-headers"
							required
						/>
					</div>
					<div>
						<label for="current-pts" class="block text-sm font-medium text-labels mb-1">
							Current Points <span class="text-alert">*</span>
						</label>
						<input
							id="current-pts"
							type="number"
							bind:value={formCurrentPoints}
							min="0"
							class="w-full px-3 py-2 border border-secondary rounded-[var(--radius-card)] bg-card text-headers"
							required
						/>
					</div>
				</div>
			{/if}
		{:else if activeTab === 'review_weights'}
			<!-- Review weight form (edit only) -->
			<div>
				<label for="rw-name" class="block text-sm font-medium text-labels mb-1">
					Display Name <span class="text-alert">*</span>
				</label>
				<input
					id="rw-name"
					type="text"
					bind:value={formDisplayName}
					class="w-full px-3 py-2 border border-secondary rounded-[var(--radius-card)] bg-card text-headers"
					required
					aria-required="true"
					maxlength="60"
				/>
			</div>
			<div>
				<label for="rw-desc" class="block text-sm font-medium text-labels mb-1">
					Description
				</label>
				<textarea
					id="rw-desc"
					bind:value={formDescription}
					rows="2"
					class="w-full px-3 py-2 border border-secondary rounded-[var(--radius-card)] bg-card text-headers resize-y"
				></textarea>
			</div>
		{:else}
			<!-- Soft catalog form (problem_types, lesson_categories) -->
			{#if dialogMode === 'add'}
				<div>
					<label for="entry-key" class="block text-sm font-medium text-labels mb-1">
						Key <span class="text-alert">*</span>
					</label>
					<input
						id="entry-key"
						type="text"
						bind:value={formKey}
						class="w-full px-3 py-2 border border-secondary rounded-[var(--radius-card)] bg-card text-headers font-mono"
						required
						aria-required="true"
						pattern="^[a-z][a-z0-9_]*$"
						placeholder="e.g. brownfield_legacy"
					/>
					<p class="text-xs text-meta mt-1">Lowercase letters, digits, and underscores only</p>
				</div>
			{/if}
			<div>
				<label for="entry-name" class="block text-sm font-medium text-labels mb-1">
					Display Name <span class="text-alert">*</span>
				</label>
				<input
					id="entry-name"
					type="text"
					bind:value={formDisplayName}
					class="w-full px-3 py-2 border border-secondary rounded-[var(--radius-card)] bg-card text-headers"
					required
					aria-required="true"
					maxlength="60"
				/>
			</div>
			<div>
				<label for="entry-desc" class="block text-sm font-medium text-labels mb-1">
					Description
				</label>
				<textarea
					id="entry-desc"
					bind:value={formDescription}
					rows="2"
					class="w-full px-3 py-2 border border-secondary rounded-[var(--radius-card)] bg-card text-headers resize-y"
				></textarea>
			</div>
			<div>
				<label for="entry-sort" class="block text-sm font-medium text-labels mb-1">
					Sort Order <span class="text-alert">*</span>
				</label>
				<input
					id="entry-sort"
					type="number"
					bind:value={formSortOrder}
					min="1"
					class="w-full px-3 py-2 border border-secondary rounded-[var(--radius-card)] bg-card text-headers"
					required
					aria-required="true"
				/>
			</div>
		{/if}
	</div>
</FormDialog>

<!-- Confirm Dialog for deactivation/reactivation -->
{#if confirmOpen}
	<ConfirmDialog
		bind:open={confirmOpen}
		title={confirmTitle}
		message={confirmDescription}
		confirmLabel="Confirm"
		onConfirm={() => {
			confirmAction?.();
			confirmOpen = false;
		}}
		onCancel={() => { confirmOpen = false; }}
	/>
{/if}
