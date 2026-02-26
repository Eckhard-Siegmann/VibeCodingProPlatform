<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import PageContainer from '$lib/components/layout/PageContainer.svelte';
	import Header from '$lib/components/layout/Header.svelte';
	import AssessmentForm from '$lib/components/assessment/AssessmentForm.svelte';
	import { Card } from '$lib/components/ui/card';
	import { Clock } from '@lucide/svelte';
	import { cn } from '$lib/utils';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let assessment = $derived(data.assessment);
	let mode = $derived(assessment.time_context === 'pitch' ? 'pitch' : 'review') as 'pitch' | 'review';

	// Countdown timer state
	let countdownDisplay = $state<string | null>(null);
	let countdownSeconds = $state(0);
	let assessmentClosed = $state(false);

	// Real-time countdown ticker (Ch.14 §14.5.1)
	$effect(() => {
		if (!assessment.timer_ends_at || !assessment.is_open) return;

		const interval = setInterval(() => {
			const diff = new Date(assessment.timer_ends_at!).getTime() - Date.now();
			if (diff <= 0) {
				countdownDisplay = '0:00';
				countdownSeconds = 0;
			} else {
				countdownSeconds = Math.floor(diff / 1000);
				const mins = Math.floor(countdownSeconds / 60);
				const secs = countdownSeconds % 60;
				countdownDisplay = `${mins}:${secs.toString().padStart(2, '0')}`;
			}
		}, 1000);

		return () => clearInterval(interval);
	});

	// Poll for assessment closure every 5s (detect moderator closing mid-session)
	$effect(() => {
		if (!assessment.is_open || assessmentClosed) return;

		const interval = setInterval(async () => {
			try {
				const res = await fetch(`/api/assessments/${assessment.assessment_id}/render-structure`);
				if (!res.ok) return;
				const result = await res.json();
				if (!result.is_open) {
					assessmentClosed = true;
					clearInterval(interval);
				}
			} catch {
				// Silently ignore polling failures
			}
		}, 5000);

		return () => clearInterval(interval);
	});

	function handleSubmitSuccess() {
		console.log('Assessment submitted successfully');
	}
</script>

<svelte:head>
	<title>{assessment.problem_title} - {assessment.inventory_name}</title>
</svelte:head>

<PageContainer>
	{#if !assessment.is_open || assessmentClosed}
		<Card elevation="resting" class="text-center py-8">
			<div class="text-alert text-4xl mb-4">!</div>
			<h2 class="text-xl font-semibold text-headers mb-2">Assessment Closed</h2>
			<p class="text-labels">This assessment is no longer accepting responses.</p>
			<a href="/dashboard" class="inline-block mt-4 text-primary hover:underline text-sm">
				Back to Dashboard
			</a>
		</Card>
	{:else}
		<Header title={assessment.problem_title} subtitle={assessment.inventory_name} {mode} />

		<!-- Countdown Timer Bar (Ch.14 §14.5.1) -->
		{#if countdownDisplay !== null}
			<div class={cn(
				'flex items-center justify-center gap-2 py-2 px-4 rounded-lg mb-4 text-sm font-medium',
				countdownSeconds <= 60 && countdownSeconds > 0
					? 'bg-alert/10 text-alert animate-pulse'
					: countdownSeconds <= 150
						? 'bg-warning-bg text-warning'
						: 'bg-primary/5 text-primary'
			)}>
				<Clock class="w-4 h-4" />
				<span class="font-mono font-semibold">{countdownDisplay}</span>
				<span>remaining</span>
			</div>
		{/if}

		<AssessmentForm
			assessmentId={assessment.assessment_id}
			matrix={assessment.matrix}
			timeContext={assessment.time_context}
			onSubmitSuccess={handleSubmitSuccess}
		/>
	{/if}
</PageContainer>
