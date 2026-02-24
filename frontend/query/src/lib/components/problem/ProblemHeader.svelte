<script lang="ts">
	/**
	 * ProblemHeader - Problem title with owner avatar, states, and version.
	 *
	 * Per Ch.13.1 and problem_card_design.md:
	 * - Header with avatar, title, and metadata
	 * - Problem Owner displayed with InitialAvatar size="lg" (48px)
	 * - Editable title in draft mode with auto-save
	 * - State indicators and version badge
	 */
	import StateIndicators from './StateIndicators.svelte';
	import VersionBadge from './VersionBadge.svelte';
	import { InitialAvatar } from '$lib/components/ui/initial-avatar';

	interface ProblemOwner {
		userId: string;
		displayName: string;
	}

	interface Props {
		title: string;
		readinessState: string;
		actionState: string;
		majorVersion: number;
		isArchived?: boolean;
		canEdit?: boolean;
		owner?: ProblemOwner;
		onTitleUpdate?: (value: string) => Promise<boolean>;
	}

	let {
		title,
		readinessState,
		actionState,
		majorVersion,
		isArchived = false,
		canEdit = false,
		owner,
		onTitleUpdate
	}: Props = $props();

	let localTitle = $state('');
	let saveStatus = $state<'idle' | 'saving' | 'saved' | 'error'>('idle');
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	// Sync local value when prop changes externally
	$effect(() => {
		localTitle = title;
	});

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		localTitle = target.value;

		if (debounceTimer) {
			clearTimeout(debounceTimer);
		}

		debounceTimer = setTimeout(() => {
			saveTitle();
		}, 300);
	}

	async function saveTitle() {
		if (!onTitleUpdate || localTitle === title || localTitle.trim() === '') return;

		saveStatus = 'saving';

		try {
			const success = await onTitleUpdate(localTitle);
			if (success) {
				saveStatus = 'saved';
				setTimeout(() => {
					if (saveStatus === 'saved') saveStatus = 'idle';
				}, 2000);
			} else {
				saveStatus = 'error';
			}
		} catch {
			saveStatus = 'error';
		}
	}

	function handleBlur() {
		if (debounceTimer) {
			clearTimeout(debounceTimer);
			debounceTimer = null;
		}
		saveTitle();
	}
</script>

<div class="mb-6">
	<div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
		<!-- Left side: Avatar + Title -->
		<div class="flex items-start gap-3 flex-1">
			<!-- Problem Owner Avatar -->
			{#if owner}
				<InitialAvatar
					userName={owner.displayName}
					userId={owner.userId}
					size="lg"
					class="shrink-0 mt-1"
				/>
			{/if}

			<!-- Title -->
			<div class="flex-1 min-w-0">
				{#if canEdit}
					<div class="relative">
						<input
							type="text"
							value={localTitle}
							oninput={handleInput}
							onblur={handleBlur}
							class="w-full text-2xl md:text-3xl font-bold text-headers bg-transparent border-b-2 border-transparent hover:border-secondary focus:border-primary focus:outline-none transition-colors py-1"
							class:border-pending={saveStatus === 'saving'}
							class:border-success={saveStatus === 'saved'}
							class:border-alert={saveStatus === 'error'}
							required
						/>
						{#if saveStatus !== 'idle'}
							<span
								class="absolute right-0 top-1/2 -translate-y-1/2 text-xs"
								class:text-pending={saveStatus === 'saving'}
								class:text-success={saveStatus === 'saved'}
								class:text-alert={saveStatus === 'error'}
							>
								{saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Error'}
							</span>
						{/if}
					</div>
					{#if owner}
						<p class="text-sm text-labels mt-1">by {owner.displayName}</p>
					{/if}
				{:else}
					<h1 class="text-2xl md:text-3xl font-bold text-headers">{title}</h1>
					{#if owner}
						<p class="text-sm text-labels mt-1">by {owner.displayName}</p>
					{/if}
				{/if}
			</div>
		</div>

		<!-- Right side: Version badge -->
		<div class="flex items-center gap-2 shrink-0">
			<VersionBadge {majorVersion} {isArchived} />
		</div>
	</div>

	<!-- State indicators -->
	<div class="mt-3">
		<StateIndicators {readinessState} {actionState} />
	</div>
</div>
