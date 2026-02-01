<script lang="ts">
	import { onMount } from 'svelte';
	import RoleSelector from './RoleSelector.svelte';
	import MatrixTable from './MatrixTable.svelte';
	import ProgressIndicator from './ProgressIndicator.svelte';
	import SubmitSection from './SubmitSection.svelte';
	import Separator from '$lib/components/ui/Separator.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import { responsesStore, answeredCount, canSubmit } from '$lib/stores/responses';
	import { sessionStore } from '$lib/stores/session';
	import type { Matrix, Role, TimeContext } from '$lib/utils/validators';

	interface Props {
		assessmentId: string;
		matrix: Matrix;
		timeContext: TimeContext;
		onSubmitSuccess?: () => void;
	}

	let { assessmentId, matrix, timeContext, onSubmitSuccess }: Props = $props();

	// Initialize stores
	onMount(() => {
		sessionStore.initialize();
		responsesStore.initialize(assessmentId, timeContext);
	});

	// Local reactive state from stores
	let role = $derived($responsesStore.role);
	let responses = $derived($responsesStore.responses);
	let submitting = $derived($responsesStore.submitting);
	let submitted = $derived($responsesStore.submitted);
	let error = $derived($responsesStore.error);
	let answered = $derived($answeredCount);
	let submitEnabled = $derived($canSubmit);
	let session = $derived($sessionStore);

	function handleRoleChange(newRole: Role) {
		responsesStore.setRole(newRole);
	}

	function handleResponse(itemId: string, value: number) {
		responsesStore.setResponse(itemId, value);
	}

	async function handleSubmit() {
		if (!submitEnabled || !session.initialized) return;

		responsesStore.setSubmitting(true);

		try {
			// Build the payload
			const payload = {
				session_hash: session.sessionHash,
				role: role,
				time_context: timeContext,
				in_presence: session.inPresence,
				responses: Array.from(responses.entries()).map(([item_id, rating_value]) => ({
					item_id,
					rating_value
				}))
			};

			// Submit to API
			const response = await fetch(`/api/assessments/${assessmentId}/responses`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(payload)
			});

			if (!response.ok) {
				throw new Error('Failed to submit assessment');
			}

			responsesStore.setSubmitted();
			onSubmitSuccess?.();
		} catch (err) {
			responsesStore.setError(err instanceof Error ? err.message : 'An error occurred');
		}
	}

	let totalItems = $derived(matrix.rows.length);
</script>

{#if submitted}
	<!-- Success state -->
	<Card class="text-center py-8">
		<div class="text-success text-5xl mb-4">&#10003;</div>
		<h2 class="text-xl font-semibold text-headers mb-2">Assessment Submitted</h2>
		<p class="text-labels">
			Thank you for your feedback! You rated {answered} of {totalItems} items.
		</p>
	</Card>
{:else}
	<form onsubmit={(e) => e.preventDefault()}>
		<!-- Role selection -->
		<RoleSelector value={role} onchange={handleRoleChange} disabled={submitting} />

		<Separator />

		<!-- Progress indicator -->
		<ProgressIndicator {answered} total={totalItems} class="mb-6" />

		<!-- Rating matrix -->
		<MatrixTable {matrix} {responses} disabled={submitting || !role} onresponse={handleResponse} />

		<!-- Error message -->
		{#if error}
			<div class="mt-4 p-3 bg-alert/10 border border-alert/30 rounded-lg text-alert text-sm">
				{error}
			</div>
		{/if}

		<!-- Submit section -->
		<SubmitSection
			canSubmit={submitEnabled}
			{submitting}
			answeredCount={answered}
			totalCount={totalItems}
			onsubmit={handleSubmit}
		/>
	</form>
{/if}
