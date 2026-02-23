<script lang="ts">
	import type { ProblemVersion } from '$lib/server/repositories/problems';

	interface Props {
		versions: ProblemVersion[];
		selectedMajorVersion: number;
		currentMajorVersion: number;
		onVersionSelect: (majorVersion: number) => void;
	}

	let { versions, selectedMajorVersion, currentMajorVersion, onVersionSelect }: Props = $props();

	let isArchived = $derived(selectedMajorVersion !== currentMajorVersion);
</script>

<div class="mb-6">
	<!-- Archive Banner -->
	{#if isArchived}
		<div
			class="mb-4 p-3 bg-amber-100 border border-amber-300 rounded-lg flex items-center justify-between"
		>
			<div class="flex items-center gap-2">
				<svg
					class="w-5 h-5 text-amber-600"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
					/>
				</svg>
				<span class="text-sm font-medium text-amber-800">
					Viewing archived version v{selectedMajorVersion}
				</span>
			</div>
			<button
				onclick={() => onVersionSelect(currentMajorVersion)}
				class="text-sm text-amber-700 hover:text-amber-900 underline"
			>
				View current version
			</button>
		</div>
	{/if}

	<!-- Version List -->
	{#if versions.length > 1}
		<div class="flex items-center gap-2 flex-wrap">
			<span class="text-sm text-labels">Versions:</span>
			{#each versions as version}
				<button
					onclick={() => onVersionSelect(version.major_version)}
					class="px-2 py-1 text-xs rounded transition-colors
						{version.major_version === selectedMajorVersion
						? 'bg-primary text-white'
						: 'bg-secondary text-labels hover:bg-secondary-dark'}"
				>
					v{version.major_version}
					{#if version.is_current}
						<span class="ml-0.5">(current)</span>
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>
