<script lang="ts">
	import { onMount } from 'svelte';
	import RoleSelector from './RoleSelector.svelte';
	import PresenceModeSelector from './PresenceModeSelector.svelte';
	import MatrixTable from './MatrixTable.svelte';
	import ProgressIndicator from './ProgressIndicator.svelte';
	import SubmitSection from './SubmitSection.svelte';
	import { Card } from '$lib/components/ui/card';
	import { responsesStore, answeredCount, canSubmit } from '$lib/stores/responses';
	import { sessionStore } from '$lib/stores/session';
	import { toastSuccess } from '$lib/stores/toast';
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

	function handlePresenceChange(inPresence: boolean) {
		sessionStore.setInPresence(inPresence);
	}

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

			const data = await response.json();

			// Fire milestone toasts for any first-time achievements (Ch.33.2)
			if (data.milestones && Array.isArray(data.milestones)) {
				for (const ms of data.milestones) {
					toastSuccess(ms.title, ms.message);
				}
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
	<!-- Success state with card elevation for emphasis -->
	<Card elevation="resting" class="text-center py-8">
		<div class="text-success text-5xl mb-4">&#10003;</div>
		<h2 class="text-xl font-semibold text-headers mb-2">Assessment Submitted</h2>
		<p class="text-labels">
			Thank you for your feedback! You rated {answered} of {totalItems} items.
		</p>
	</Card>
{:else}
	<!-- Form wrapped in Card for depth on canvas -->
	<Card elevation="resting">
		<form onsubmit={(e) => e.preventDefault()}>
			<!-- Participation mode selection (Ch.9.5.3, U15) -->
			<PresenceModeSelector value={session.inPresence} onchange={handlePresenceChange} disabled={submitting} />

			<!-- Role selection -->
			<RoleSelector value={role} onchange={handleRoleChange} disabled={submitting} />

			<!-- Divider using spacing instead of Separator (shadows-only approach) -->
			<div class="py-4"></div>

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
	</Card>
{/if}
