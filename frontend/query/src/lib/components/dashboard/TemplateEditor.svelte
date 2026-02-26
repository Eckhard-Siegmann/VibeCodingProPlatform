<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { Card, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
	import { toastSuccess, toastError } from '$lib/stores/toast';
	import { Save, Send, ChevronDown, ChevronUp, History } from '@lucide/svelte';

	interface Template {
		template_id: string;
		event_id: string;
		version: number;
		subject: string;
		body_markdown: string;
		created_at: string;
		created_by_user_id: string;
		is_current: boolean;
	}

	interface Props {
		eventId: string;
		template: Template | null;
		recipientCount: number;
		expanded?: boolean;
	}

	let { eventId, template, recipientCount, expanded = false }: Props = $props();

	let subject = $state(template?.subject ?? '');
	let bodyMarkdown = $state(template?.body_markdown ?? '');
	let isExpanded = $state(expanded);
	let saving = $state(false);
	let sending = $state(false);
	let confirmOpen = $state(false);

	// Sync from props when template changes
	$effect(() => {
		if (template) {
			subject = template.subject;
			bodyMarkdown = template.body_markdown;
		}
	});

	const hasChanges = $derived(
		subject !== (template?.subject ?? '') || bodyMarkdown !== (template?.body_markdown ?? '')
	);

	async function saveTemplate() {
		if (!subject.trim() || !bodyMarkdown.trim()) {
			toastError('Validation', 'Subject and body are required');
			return;
		}

		saving = true;
		try {
			const res = await fetch(`/api/events/${eventId}/email-template`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ subject, body_markdown: bodyMarkdown })
			});
			const result = await res.json();
			if (result.success) {
				toastSuccess('Template saved', `Version ${result.template.version} created`);
				invalidateAll();
			} else {
				toastError('Save failed', result.error || 'Unknown error');
			}
		} catch {
			toastError('Error', 'Network request failed');
		} finally {
			saving = false;
		}
	}

	async function sendBroadcast() {
		sending = true;
		confirmOpen = false;
		try {
			// Save any unsaved changes first
			if (hasChanges) {
				await saveTemplate();
			}

			const res = await fetch(`/api/events/${eventId}/broadcast`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' }
			});
			const result = await res.json();
			if (result.success) {
				toastSuccess('Broadcast sent', `Email sent to ${result.recipientCount} participants`);
				invalidateAll();
			} else {
				toastError('Send failed', result.error || 'Unknown error');
			}
		} catch {
			toastError('Error', 'Network request failed');
		} finally {
			sending = false;
		}
	}
</script>

<Card elevation="resting" padding="none">
	<button
		type="button"
		onclick={() => (isExpanded = !isExpanded)}
		class="w-full p-4 flex items-center justify-between text-left hover:bg-canvas/50 transition-colors"
	>
		<div>
			<h3 class="font-semibold text-headers">
				Email Template {template ? `(v${template.version})` : ''}
			</h3>
			<div class="flex items-center gap-2">
				<p class="text-sm text-labels">Compose and send broadcast emails to participants</p>
				<a
					href={`/dashboard/moderator/emails/${eventId}`}
					class="text-xs text-primary hover:underline inline-flex items-center gap-1"
					onclick={(e) => e.stopPropagation()}
				>
					<History class="w-3 h-3" />
					View History
				</a>
			</div>
		</div>
		{#if isExpanded}
			<ChevronUp class="w-5 h-5 text-meta" />
		{:else}
			<ChevronDown class="w-5 h-5 text-meta" />
		{/if}
	</button>

	{#if isExpanded}
		<div class="px-4 pb-4 space-y-4 border-t border-secondary">
			<div class="pt-4">
				<label for="template-subject" class="block text-sm font-medium text-labels mb-1">Subject</label>
				<input
					id="template-subject"
					type="text"
					bind:value={subject}
					class="w-full px-3 py-2 text-sm bg-canvas border border-secondary rounded-[var(--radius-card)] text-headers focus:outline-none focus:ring-2 focus:ring-primary"
					placeholder="Email subject line..."
				/>
			</div>

			<div>
				<label for="template-body" class="block text-sm font-medium text-labels mb-1">
					Body (Markdown)
				</label>
				<textarea
					id="template-body"
					bind:value={bodyMarkdown}
					rows={8}
					class="w-full px-3 py-2 text-sm bg-canvas border border-secondary rounded-[var(--radius-card)] text-headers font-mono focus:outline-none focus:ring-2 focus:ring-primary resize-y"
					placeholder="Email body in markdown..."
				></textarea>
			</div>

			<div class="flex items-center justify-between flex-wrap gap-2">
				<p class="text-xs text-meta">
					{recipientCount} registered participant{recipientCount !== 1 ? 's' : ''}
				</p>
				<div class="flex gap-2">
					<Button
						variant="secondary"
						size="sm"
						onclick={saveTemplate}
						disabled={saving || !hasChanges}
					>
						<Save class="w-4 h-4 mr-1" />
						{saving ? 'Saving...' : 'Save New Version'}
					</Button>
					<Button
						variant="default"
						size="sm"
						onclick={() => (confirmOpen = true)}
						disabled={sending || recipientCount === 0}
					>
						<Send class="w-4 h-4 mr-1" />
						{sending ? 'Sending...' : 'Send Broadcast'}
					</Button>
				</div>
			</div>
		</div>
	{/if}
</Card>

<ConfirmDialog
	bind:open={confirmOpen}
	title="Send Broadcast Email"
	message={`Send this email to ${recipientCount} registered participant${recipientCount !== 1 ? 's' : ''}? This action will be logged.`}
	confirmLabel="Send"
	cancelLabel="Cancel"
	onConfirm={sendBroadcast}
	onCancel={() => (confirmOpen = false)}
/>
