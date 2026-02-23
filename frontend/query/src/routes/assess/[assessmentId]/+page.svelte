<script lang="ts">
	import PageContainer from '$lib/components/layout/PageContainer.svelte';
	import Header from '$lib/components/layout/Header.svelte';
	import AssessmentForm from '$lib/components/assessment/AssessmentForm.svelte';
	import { Card } from '$lib/components/ui/card';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let assessment = $derived(data.assessment);
	let mode = $derived(assessment.time_context === 'pitch' ? 'pitch' : 'review') as 'pitch' | 'review';

	function handleSubmitSuccess() {
		// Could navigate away or show additional feedback
		console.log('Assessment submitted successfully');
	}
</script>

<svelte:head>
	<title>{assessment.problem_title} - {assessment.inventory_name}</title>
</svelte:head>

<PageContainer>
	{#if !assessment.is_open}
		<Card elevation="resting" class="text-center py-8">
			<div class="text-alert text-4xl mb-4">!</div>
			<h2 class="text-xl font-semibold text-headers mb-2">Assessment Closed</h2>
			<p class="text-labels">This assessment is no longer accepting responses.</p>
		</Card>
	{:else}
		<Header title={assessment.problem_title} subtitle={assessment.inventory_name} {mode} />

		<AssessmentForm
			assessmentId={assessment.assessment_id}
			matrix={assessment.matrix}
			timeContext={assessment.time_context}
			onSubmitSuccess={handleSubmitSuccess}
		/>
	{/if}
</PageContainer>
