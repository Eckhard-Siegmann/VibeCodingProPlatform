<script lang="ts">
	import { Card } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { AlertTriangle, CheckCircle, Mail } from '@lucide/svelte';

	interface Props {
		reminderDue: boolean;
		reminderSentAt: string | null;
		eventTitle: string;
		onSendReminder?: () => void;
	}

	let { reminderDue, reminderSentAt, eventTitle, onSendReminder }: Props = $props();

	const sentDate = $derived(
		reminderSentAt ? new Date(reminderSentAt).toLocaleString() : null
	);
</script>

{#if reminderDue && !reminderSentAt}
	<!-- Amber warning: reminder not yet sent -->
	<Card padding="md" class="border-2 border-warning/50 bg-warning/5">
		<div class="flex items-start gap-3">
			<AlertTriangle class="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
			<div class="flex-1 min-w-0">
				<div class="flex items-center gap-2 flex-wrap">
					<h3 class="font-semibold text-headers">Event starts in less than 24 hours</h3>
					<Badge variant="draft">Reminder Not Sent</Badge>
				</div>
				<p class="text-sm text-labels mt-1">
					<strong>{eventTitle}</strong> is approaching. Consider sending a reminder to registered participants.
				</p>
			</div>
			{#if onSendReminder}
				<Button variant="default" size="sm" onclick={onSendReminder} class="flex-shrink-0">
					<Mail class="w-4 h-4 mr-1" />
					Send Now
				</Button>
			{/if}
		</div>
	</Card>
{:else if reminderSentAt}
	<!-- Green confirmation: reminder sent -->
	<Card padding="md" class="border border-success/30 bg-success/5">
		<div class="flex items-center gap-3">
			<CheckCircle class="w-5 h-5 text-success flex-shrink-0" />
			<div class="flex-1">
				<h3 class="font-medium text-headers">Reminder sent</h3>
				<p class="text-sm text-labels">Broadcast dispatched on {sentDate}</p>
			</div>
			<Badge variant="ready">Sent</Badge>
		</div>
	</Card>
{/if}
