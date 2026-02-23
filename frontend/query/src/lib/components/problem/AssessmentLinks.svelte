<script lang="ts">
	import type { AssessmentSummary } from '$lib/server/repositories/problems';
	import { Card, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';

	interface Props {
		assessments: AssessmentSummary[];
		isPrivateView?: boolean;
	}

	let { assessments, isPrivateView = false }: Props = $props();

	// Find assessments by type
	let selfAssessment = $derived(
		assessments.find((a) => a.inventory_key === 'problem_eval')
	);
	let pitchAssessment = $derived(
		assessments.find((a) => a.inventory_key === 'pitch_assessment')
	);
	let reviewAssessment = $derived(
		assessments.find((a) => a.inventory_key === 'review_assessment')
	);

	// Check if assessments are open (not closed)
	let isPitchOpen = $derived(pitchAssessment && !pitchAssessment.closed_at);
	let isReviewOpen = $derived(reviewAssessment && !reviewAssessment.closed_at);
</script>

<Card elevation="resting">
	<CardHeader>
		<CardTitle>Assessments</CardTitle>
	</CardHeader>

	<div class="space-y-4">
		<!-- Row 1: Rate buttons -->
		<div>
			<div class="grid grid-cols-3 gap-2 mb-2">
				<h3 class="text-sm font-medium text-labels text-center">Self-Assessment</h3>
				<h3 class="text-sm font-medium text-labels text-center">Pitch Assessment</h3>
				<h3 class="text-sm font-medium text-labels text-center">Review Assessment</h3>
			</div>
			<div class="grid grid-cols-3 gap-2">
				<!-- Self-Rate -->
				{#if selfAssessment}
					<a
						href="/assess/{selfAssessment.assessment_id}"
						class="block p-3 text-center rounded-[var(--radius-card)] bg-primary text-white font-medium hover:bg-primary-hover transition-colors"
					>
						Self-Rate
					</a>
				{:else if isPrivateView}
					<div
						class="p-3 text-center rounded-[var(--radius-card)] bg-secondary text-labels font-medium cursor-not-allowed opacity-60"
						title="Self-assessment not yet available"
					>
						Self-Rate
					</div>
				{:else}
					<div class="p-3 text-center rounded-[var(--radius-card)] bg-canvas text-labels font-medium opacity-60">
						Self-Rate
					</div>
				{/if}

				<!-- Rate Pitch -->
				{#if isPitchOpen && pitchAssessment}
					<a
						href="/assess/{pitchAssessment.assessment_id}"
						class="block p-3 text-center rounded-[var(--radius-card)] bg-primary text-white font-medium hover:bg-primary-hover transition-colors"
					>
						Rate Pitch
					</a>
				{:else}
					<div
						class="p-3 text-center rounded-[var(--radius-card)] bg-secondary text-labels font-medium cursor-not-allowed opacity-60"
						title={pitchAssessment?.closed_at ? 'Pitch assessment closed' : 'Pitch assessment not open'}
					>
						Rate Pitch
					</div>
				{/if}

				<!-- Rate Review -->
				{#if isReviewOpen && reviewAssessment}
					<a
						href="/assess/{reviewAssessment.assessment_id}"
						class="block p-3 text-center rounded-[var(--radius-card)] bg-primary text-white font-medium hover:bg-primary-hover transition-colors"
					>
						Rate Review
					</a>
				{:else}
					<div
						class="p-3 text-center rounded-[var(--radius-card)] bg-secondary text-labels font-medium cursor-not-allowed opacity-60"
						title={reviewAssessment?.closed_at ? 'Review assessment closed' : 'Review assessment not open'}
					>
						Rate Review
					</div>
				{/if}
			</div>
		</div>

		<!-- Row 2: View buttons -->
		<div>
			<div class="grid grid-cols-3 gap-2">
				<!-- View Self ratings -->
				<div class="text-center">
					{#if selfAssessment}
						<a
							href="/assess/{selfAssessment.assessment_id}/results"
							class="block p-3 rounded-[var(--radius-card)] bg-canvas hover:bg-secondary/50 transition-colors shadow-[var(--shadow-sm)]"
						>
							<div class="font-medium text-headers text-sm">View Self ratings</div>
						</a>
						<div class="text-xs text-meta mt-1">{selfAssessment.response_count} responses</div>
					{:else}
						<div class="p-3 rounded-[var(--radius-card)] bg-canvas opacity-50">
							<div class="font-medium text-labels text-sm">View Self ratings</div>
						</div>
						<div class="text-xs text-meta mt-1">0 responses</div>
					{/if}
				</div>

				<!-- View Pitch ratings -->
				<div class="text-center">
					{#if pitchAssessment}
						<a
							href="/assess/{pitchAssessment.assessment_id}/results"
							class="block p-3 rounded-[var(--radius-card)] bg-canvas hover:bg-secondary/50 transition-colors shadow-[var(--shadow-sm)]"
						>
							<div class="font-medium text-headers text-sm">View Pitch ratings</div>
						</a>
						<div class="text-xs text-meta mt-1">{pitchAssessment.response_count} responses</div>
					{:else}
						<div class="p-3 rounded-[var(--radius-card)] bg-canvas opacity-50">
							<div class="font-medium text-labels text-sm">View Pitch ratings</div>
						</div>
						<div class="text-xs text-meta mt-1">0 responses</div>
					{/if}
				</div>

				<!-- View Review ratings -->
				<div class="text-center">
					{#if reviewAssessment}
						<a
							href="/assess/{reviewAssessment.assessment_id}/results"
							class="block p-3 rounded-[var(--radius-card)] bg-canvas hover:bg-secondary/50 transition-colors shadow-[var(--shadow-sm)]"
						>
							<div class="font-medium text-headers text-sm">View Review ratings</div>
						</a>
						<div class="text-xs text-meta mt-1">{reviewAssessment.response_count} responses</div>
					{:else}
						<div class="p-3 rounded-[var(--radius-card)] bg-canvas opacity-50">
							<div class="font-medium text-labels text-sm">View Review ratings</div>
						</div>
						<div class="text-xs text-meta mt-1">0 responses</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</Card>
