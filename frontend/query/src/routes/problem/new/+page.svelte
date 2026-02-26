<script lang="ts">
	import { enhance } from '$app/forms';
	import PageContainer from '$lib/components/layout/PageContainer.svelte';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft, Loader2, Plus } from '@lucide/svelte';

	let { data, form } = $props();

	let submitting = $state(false);
	let title = $state(form?.values?.title ?? '');
	let description = $state(form?.values?.description ?? '');
	let valueStatement = $state(form?.values?.value_statement ?? '');
	let problemType = $state(form?.values?.problem_type ?? 'greenfield');
	let repoUrl = $state(form?.values?.repo_url_primary ?? '');
	let taskCount = $state(form?.values?.task_count ?? '3');

	const inputClass = 'mt-1 w-full h-12 px-3 border-2 rounded-[var(--radius-card)] text-base text-headers focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors bg-card';
	const textareaClass = 'mt-1 w-full px-3 py-2 border-2 rounded-[var(--radius-card)] text-base text-headers focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors bg-card resize-y';
</script>

<svelte:head>
	<title>Create Problem - VibeCoding</title>
</svelte:head>

<PageContainer>
	<div class="max-w-2xl mx-auto">
		<!-- Header -->
		<div class="flex items-center gap-3 mb-6">
			<a href="/dashboard">
				<Button variant="ghost" size="sm">
					<ArrowLeft class="w-4 h-4" />
				</Button>
			</a>
			<h1 class="text-2xl md:text-3xl font-bold text-headers">Create Problem</h1>
		</div>

		<!-- Server error -->
		{#if form?.errors && Object.keys(form.errors).length > 0}
			<div class="mb-4 p-3 rounded-lg text-sm bg-red-50 border-l-4 border-alert text-red-800" role="alert">
				Please fix the errors below.
			</div>
		{/if}

		<Card elevation="resting" padding="lg">
			<form
				method="POST"
				use:enhance={() => {
					submitting = true;
					return async ({ update }) => {
						submitting = false;
						await update();
					};
				}}
			>
				<div class="space-y-5">
					<!-- Title -->
					<div>
						<label for="title" class="block text-sm font-medium text-headers">
							Title <span class="text-alert">*</span>
						</label>
						<input
							id="title"
							name="title"
							type="text"
							required
							minlength={5}
							maxlength={200}
							bind:value={title}
							placeholder="e.g., RAG Retrieval Quality Evaluation"
							class="{inputClass} {form?.errors?.title ? 'border-alert' : 'border-secondary'}"
						/>
						<div class="mt-1 flex justify-between">
							{#if form?.errors?.title}
								<p class="text-xs text-alert" role="alert">{form.errors.title}</p>
							{:else}
								<span></span>
							{/if}
							<span class="text-xs text-meta">{title.length}/200</span>
						</div>
					</div>

					<!-- Description -->
					<div>
						<label for="description" class="block text-sm font-medium text-headers">
							Description <span class="text-alert">*</span>
						</label>
						<textarea
							id="description"
							name="description"
							required
							minlength={20}
							maxlength={5000}
							rows={6}
							bind:value={description}
							placeholder="Describe the problem, its context, and what you're trying to achieve..."
							class="{textareaClass} {form?.errors?.description ? 'border-alert' : 'border-secondary'}"
						></textarea>
						<div class="mt-1 flex justify-between">
							{#if form?.errors?.description}
								<p class="text-xs text-alert" role="alert">{form.errors.description}</p>
							{:else}
								<span></span>
							{/if}
							<span class="text-xs text-meta">{description.length}/5000</span>
						</div>
					</div>

					<!-- Value Statement -->
					<div>
						<label for="value_statement" class="block text-sm font-medium text-headers">
							Value Statement
						</label>
						<p class="text-xs text-meta mb-1">Why does this problem matter to you? What business or personal value does solving it bring?</p>
						<textarea
							id="value_statement"
							name="value_statement"
							maxlength={2000}
							rows={3}
							bind:value={valueStatement}
							placeholder="Solving this would help me..."
							class="{textareaClass} {form?.errors?.value_statement ? 'border-alert' : 'border-secondary'}"
						></textarea>
						{#if form?.errors?.value_statement}
							<p class="mt-1 text-xs text-alert" role="alert">{form.errors.value_statement}</p>
						{/if}
					</div>

					<!-- Problem Type -->
					<div>
						<label for="problem_type" class="block text-sm font-medium text-headers">
							Problem Type
						</label>
						<select
							id="problem_type"
							name="problem_type"
							bind:value={problemType}
							class="{inputClass} border-secondary cursor-pointer"
						>
							{#each data.problemTypes as pt (pt.type_key)}
								<option value={pt.type_key}>{pt.display_name}</option>
							{/each}
						</select>
						{#if data.problemTypes.find(pt => pt.type_key === problemType)?.description}
							<p class="mt-1 text-xs text-meta">
								{data.problemTypes.find(pt => pt.type_key === problemType)?.description}
							</p>
						{/if}
					</div>

					<!-- Repository URL -->
					<div>
						<label for="repo_url_primary" class="block text-sm font-medium text-headers">
							Repository URL
						</label>
						<p class="text-xs text-meta mb-1">Link to the primary code repository (can be updated later)</p>
						<input
							id="repo_url_primary"
							name="repo_url_primary"
							type="url"
							bind:value={repoUrl}
							placeholder="https://github.com/your/repo"
							class="{inputClass} {form?.errors?.repo_url_primary ? 'border-alert' : 'border-secondary'}"
						/>
						{#if form?.errors?.repo_url_primary}
							<p class="mt-1 text-xs text-alert" role="alert">{form.errors.repo_url_primary}</p>
						{/if}
					</div>

					<!-- Task Count -->
					<div>
						<label for="task_count" class="block text-sm font-medium text-headers">
							Task Count
						</label>
						<p class="text-xs text-meta mb-1">How many sub-tasks or work items does this problem contain?</p>
						<input
							id="task_count"
							name="task_count"
							type="number"
							min={1}
							bind:value={taskCount}
							class="mt-1 w-32 h-12 px-3 border-2 rounded-[var(--radius-card)] text-base text-headers
							       focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
							       transition-colors bg-card
							       {form?.errors?.task_count ? 'border-alert' : 'border-secondary'}"
						/>
						{#if form?.errors?.task_count}
							<p class="mt-1 text-xs text-alert" role="alert">{form.errors.task_count}</p>
						{/if}
					</div>

					<!-- Info box -->
					<div class="bg-canvas/50 rounded-lg p-4">
						<p class="text-sm text-labels">
							Your problem will be created as a <strong>draft</strong>. You can continue editing it,
							then submit it for moderator review when ready.
						</p>
					</div>

					<!-- Actions -->
					<div class="flex flex-col sm:flex-row gap-3 pt-2">
						<Button type="submit" variant="default" class="h-12 text-base flex-1" disabled={submitting}>
							{#if submitting}
								<Loader2 class="w-5 h-5 mr-2 animate-spin" />
								Creating...
							{:else}
								<Plus class="w-5 h-5 mr-2" />
								Create Problem
							{/if}
						</Button>
						<a href="/dashboard" class="sm:w-auto">
							<Button variant="outline" class="h-12 text-base w-full">Cancel</Button>
						</a>
					</div>
				</div>
			</form>
		</Card>
	</div>
</PageContainer>
