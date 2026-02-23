<script lang="ts">
	import type { ProblemVersion } from '$lib/server/repositories/problems';
	import { Card, CardHeader, CardTitle } from '$lib/components/ui/card';
	import EditableField from './EditableField.svelte';

	interface Props {
		version: ProblemVersion;
		canEdit?: boolean;
		onFieldUpdate?: (field: string, value: string | number) => Promise<boolean>;
	}

	let { version, canEdit = false, onFieldUpdate }: Props = $props();

	async function handleUpdate(field: string, value: string | number): Promise<boolean> {
		if (!onFieldUpdate) return false;
		return await onFieldUpdate(field, value);
	}
</script>

<div class="space-y-4">
	<!-- Description Section -->
	<Card elevation="resting">
		<CardHeader>
			<CardTitle>Description</CardTitle>
		</CardHeader>
		{#if canEdit}
			<EditableField
				value={version.description}
				field="description"
				type="textarea"
				required={true}
				onUpdate={handleUpdate}
			/>
		{:else}
			<div class="text-labels whitespace-pre-wrap">{version.description}</div>
		{/if}
	</Card>

	<!-- Value Statement Section -->
	<Card elevation="resting">
		<CardHeader>
			<CardTitle>Value Statement</CardTitle>
		</CardHeader>
		{#if canEdit}
			<EditableField
				value={version.value_statement ?? ''}
				field="value_statement"
				type="textarea"
				placeholder="Why is this problem valuable? What business or learning goal does it serve?"
				onUpdate={handleUpdate}
			/>
		{:else if version.value_statement}
			<div class="text-labels whitespace-pre-wrap">{version.value_statement}</div>
		{:else}
			<div class="text-meta italic">No value statement provided</div>
		{/if}
	</Card>

	<!-- Repository & Metadata Section -->
	<Card elevation="resting">
		<CardHeader>
			<CardTitle>Repository & Details</CardTitle>
		</CardHeader>

		{#if canEdit}
			<div class="space-y-4">
				<EditableField
					value={version.repo_url_primary}
					field="repo_url_primary"
					label="Primary Repository URL"
					type="url"
					required={true}
					placeholder="https://github.com/..."
					onUpdate={handleUpdate}
				/>

				<EditableField
					value={version.repo_url_secondary ?? ''}
					field="repo_url_secondary"
					label="Secondary URL (optional)"
					type="url"
					placeholder="Documentation, demo, or related link"
					onUpdate={handleUpdate}
				/>

				<EditableField
					value={version.task_count}
					field="task_count"
					label="Task Count"
					type="number"
					min={1}
					required={true}
					onUpdate={handleUpdate}
				/>

				<div>
					<span class="text-sm font-medium text-labels">Version Created</span>
					<p class="mt-1 text-headers">
						{new Date(version.created_at).toLocaleDateString('en-US', {
							year: 'numeric',
							month: 'short',
							day: 'numeric',
							hour: '2-digit',
							minute: '2-digit'
						})}
					</p>
				</div>
			</div>
		{:else}
			<dl class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<!-- Primary Repository -->
				<div>
					<dt class="text-sm font-medium text-labels">Primary Repository</dt>
					<dd class="mt-1">
						<a
							href={version.repo_url_primary}
							target="_blank"
							rel="noopener noreferrer"
							class="text-primary hover:text-primary-hover hover:underline break-all"
						>
							{version.repo_url_primary}
						</a>
					</dd>
				</div>

				<!-- Secondary Repository -->
				{#if version.repo_url_secondary}
					<div>
						<dt class="text-sm font-medium text-labels">Secondary URL</dt>
						<dd class="mt-1">
							<a
								href={version.repo_url_secondary}
								target="_blank"
								rel="noopener noreferrer"
								class="text-primary hover:text-primary-hover hover:underline break-all"
							>
								{version.repo_url_secondary}
							</a>
						</dd>
					</div>
				{/if}

				<!-- Task Count -->
				<div>
					<dt class="text-sm font-medium text-labels">Task Count</dt>
					<dd class="mt-1 text-headers">{version.task_count}</dd>
				</div>

				<!-- Created At -->
				<div>
					<dt class="text-sm font-medium text-labels">Version Created</dt>
					<dd class="mt-1 text-headers">
						{new Date(version.created_at).toLocaleDateString('en-US', {
							year: 'numeric',
							month: 'short',
							day: 'numeric',
							hour: '2-digit',
							minute: '2-digit'
						})}
					</dd>
				</div>
			</dl>
		{/if}
	</Card>
</div>
