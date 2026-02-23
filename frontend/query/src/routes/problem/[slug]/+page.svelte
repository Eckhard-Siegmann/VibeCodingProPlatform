<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { toastError, toastSuccess } from '$lib';
	import PageContainer from '$lib/components/layout/PageContainer.svelte';
	import ProblemCard from '$lib/components/problem/ProblemCard.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function handleVersionSelect(majorVersion: number) {
		// Update URL with version query param
		const url = new URL(window.location.href);
		if (majorVersion === data.problem.current_major_version) {
			url.searchParams.delete('v');
		} else {
			url.searchParams.set('v', String(majorVersion));
		}
		goto(url.toString(), { replaceState: true });
	}

	async function handleSubmit() {
		const response = await fetch(`/api/problems/${data.problem.problem_id}/submit`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({})
		});

		if (response.ok) {
			// Refresh page data
			await invalidateAll();
			toastSuccess('Problem submitted', 'Your problem is now under review.');
		} else {
			const error = await response.json();
			toastError('Failed to submit problem', error.message || 'Unknown error');
		}
	}

	async function handleModify() {
		const response = await fetch(`/api/problems/${data.problem.problem_id}/versions`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({})
		});

		if (response.ok) {
			// Refresh page data
			await invalidateAll();
			toastSuccess('New version created', 'You can now edit this version.');
		} else {
			const error = await response.json();
			toastError('Failed to create version', error.message || 'Unknown error');
		}
	}

	async function handleClone() {
		const response = await fetch(`/api/problems/${data.problem.problem_id}/clone`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({})
		});

		if (response.ok) {
			const result = await response.json();
			toastSuccess('Problem cloned', 'Redirecting to your new problem...');
			// Redirect to the new problem's private URL
			goto(`/problem/${result.private_slug}`);
		} else {
			const error = await response.json();
			toastError('Failed to clone problem', error.message || 'Unknown error');
		}
	}

	async function handleFieldUpdate(field: string, value: string | number): Promise<boolean> {
		const response = await fetch(
			`/api/problems/${data.problem.problem_id}/versions/${data.currentVersion.problem_version_id}`,
			{
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ [field]: value })
			}
		);

		if (response.ok) {
			// Update local data to reflect change without full page reload
			// The component will handle local state; this just confirms persistence
			return true;
		} else {
			console.error('Failed to update field:', field);
			return false;
		}
	}
</script>

<svelte:head>
	<title>{data.currentVersion.title} - Problem Card</title>
</svelte:head>

<PageContainer>
	<ProblemCard
		problem={data.problem}
		currentVersion={data.currentVersion}
		versions={data.versions}
		decisions={data.decisions}
		assessments={data.assessments}
		flags={data.flags}
		isArchivedView={data.isArchivedView}
		selectedMajorVersion={data.selectedMajorVersion}
		onVersionSelect={handleVersionSelect}
		onFieldUpdate={handleFieldUpdate}
		onSubmit={handleSubmit}
		onModify={handleModify}
		onClone={handleClone}
	/>
</PageContainer>
