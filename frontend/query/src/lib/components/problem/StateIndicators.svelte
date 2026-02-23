<script lang="ts">
	/**
	 * StateIndicators - Display readiness and action state badges with tooltips.
	 *
	 * Per Ch.13.6.2 and problem_card_design.md:
	 * - Each state badge is wrapped in a Tooltip
	 * - Tooltips explain what each state means
	 */
	import { Badge } from '$lib/components/ui/badge';
	import { Tooltip } from '$lib/components/ui/tooltip';

	interface Props {
		readinessState: string;
		actionState: string;
	}

	let { readinessState, actionState }: Props = $props();

	// Readiness state labels
	const readinessLabels: Record<string, string> = {
		draft: 'Draft',
		submitted: 'Submitted',
		needs_changes: 'Needs Changes',
		ready: 'Ready',
		rejected: 'Rejected'
	};

	// Readiness state tooltips (per Ch.13.6.2)
	const readinessTooltips: Record<string, string> = {
		draft: 'Problem is being authored. Only the PO can see it.',
		submitted: 'Submitted for review. Moderators will evaluate.',
		needs_changes: 'Feedback received. PO should update and resubmit.',
		ready: 'Quality gate passed! This problem can be pitched.',
		rejected: 'Did not pass quality review. Consider major revision.'
	};

	// Action state labels
	const actionLabels: Record<string, string> = {
		backlog: 'Backlog',
		selected_for_event: 'Selected for Event',
		selected_for_coding: 'Selected for Coding',
		deferred: 'Deferred',
		dropped: 'Dropped',
		closed: 'Closed'
	};

	// Action state tooltips (per Ch.13.6.2)
	const actionTooltips: Record<string, string> = {
		backlog: 'Available for future events. Not yet selected.',
		selected_for_event: 'Planned for an upcoming event.',
		selected_for_coding: 'Currently being worked on!',
		deferred: 'Postponed. See decision history for reason.',
		dropped: 'Removed from consideration.',
		closed: 'Completed! No further action needed.'
	};

	type BadgeVariant =
		| 'draft'
		| 'submitted'
		| 'needs_changes'
		| 'ready'
		| 'rejected'
		| 'backlog'
		| 'selected_for_event'
		| 'selected_for_coding'
		| 'deferred'
		| 'dropped'
		| 'closed';

	let readinessVariant = $derived((readinessState as BadgeVariant) ?? 'draft');
	let actionVariant = $derived((actionState as BadgeVariant) ?? 'backlog');
</script>

<div class="flex flex-wrap gap-2">
	<Tooltip
		content={readinessTooltips[readinessState] ?? 'Unknown state'}
		side="bottom"
	>
		<Badge variant={readinessVariant}>
			{readinessLabels[readinessState] ?? 'Draft'}
		</Badge>
	</Tooltip>

	<Tooltip
		content={actionTooltips[actionState] ?? 'Unknown state'}
		side="bottom"
	>
		<Badge variant={actionVariant}>
			{actionLabels[actionState] ?? 'Backlog'}
		</Badge>
	</Tooltip>
</div>
