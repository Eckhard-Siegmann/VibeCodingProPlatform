<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import PageContainer from '$lib/components/layout/PageContainer.svelte';
	import { Card, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import BackButton from '$lib/components/ui/back-button/back-button.svelte';
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
	import { toastSuccess, toastError } from '$lib/stores/toast';
	import { Save, Send, Eye, RotateCcw, X } from '@lucide/svelte';

	interface Template {
		template_id: string;
		event_id: string;
		version: number;
		subject: string;
		body_markdown: string;
		created_at: string;
		created_by_user_id: string;
		created_by_display_name?: string;
		is_current: boolean;
	}

	let { data } = $props();

	const { eventId, eventTitle, currentTemplate, templateHistory, recipientCount } = $derived(data);

	// Editor state (bound to current template)
	let subject = $state(currentTemplate?.subject ?? '');
	let bodyMarkdown = $state(currentTemplate?.body_markdown ?? '');
	let saving = $state(false);
	let sending = $state(false);
	let broadcastConfirmOpen = $state(false);

	// Preview state
	let previewVersion = $state<Template | null>(null);

	// Restore state
	let restoreConfirmOpen = $state(false);
	let restoreTarget = $state<Template | null>(null);

	// Sync editor from props when template changes
	$effect(() => {
		if (currentTemplate) {
			subject = currentTemplate.subject;
			bodyMarkdown = currentTemplate.body_markdown;
		}
	});

	const hasChanges = $derived(
		subject !== (currentTemplate?.subject ?? '') ||
			bodyMarkdown !== (currentTemplate?.body_markdown ?? '')
	);

	// ── Save new version ───────────────────────────────────────────────

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
				previewVersion = null;
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

	// ── Send broadcast ─────────────────────────────────────────────────

	async function sendBroadcast() {
		sending = true;
		broadcastConfirmOpen = false;
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

	// ── Restore from historical version ────────────────────────────────

	function startRestore(template: Template) {
		restoreTarget = template;
		restoreConfirmOpen = true;
	}

	async function confirmRestore() {
		if (!restoreTarget) return;
		restoreConfirmOpen = false;

		saving = true;
		try {
			const res = await fetch(`/api/events/${eventId}/email-template`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					subject: restoreTarget.subject,
					body_markdown: restoreTarget.body_markdown
				})
			});
			const result = await res.json();
			if (result.success) {
				toastSuccess(
					'Template restored',
					`Version ${result.template.version} created from v${restoreTarget.version}`
				);
				previewVersion = null;
				restoreTarget = null;
				invalidateAll();
			} else {
				toastError('Restore failed', result.error || 'Unknown error');
			}
		} catch {
			toastError('Error', 'Network request failed');
		} finally {
			saving = false;
		}
	}

	// ── Preview toggle ─────────────────────────────────────────────────

	function togglePreview(template: Template) {
		if (previewVersion?.template_id === template.template_id) {
			previewVersion = null;
		} else {
			previewVersion = template;
		}
	}

	function closePreview() {
		previewVersion = null;
	}

	// ── Formatting helpers ─────────────────────────────────────────────

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleString(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function truncate(str: string, len: number): string {
		return str.length > len ? str.slice(0, len) + '...' : str;
	}
</script>

<svelte:head>
	<title>Email Templates - {eventTitle} - VibeCoding</title>
</svelte:head>

<PageContainer>
	<!-- Header -->
	<header class="mb-6">
		<BackButton href="/dashboard/moderator" label="Back to Dashboard" />
		<h1 class="text-2xl md:text-3xl font-bold text-headers mt-2">Email Templates</h1>
		<p class="text-labels">{eventTitle}</p>
	</header>

	<!-- Main Grid -->
	<div class="grid gap-6 lg:grid-cols-[1fr_380px]">
		<!-- Left: Current Template Editor -->
		<section>
			<Card elevation="resting" padding="md">
				<div class="flex items-center justify-between mb-4">
					<h2 class="text-lg font-semibold text-headers">
						Current Template
						{#if currentTemplate}
							<Badge variant="ready" class="ml-2">v{currentTemplate.version}</Badge>
						{/if}
					</h2>
				</div>

				<div class="space-y-4">
					<div>
						<label for="tpl-subject" class="block text-sm font-medium text-labels mb-1"
							>Subject</label
						>
						<input
							id="tpl-subject"
							type="text"
							bind:value={subject}
							class="w-full px-3 py-2 text-sm bg-canvas border border-secondary rounded-[var(--radius-card)] text-headers focus:outline-none focus:ring-2 focus:ring-primary"
							placeholder="Email subject line..."
						/>
					</div>

					<div>
						<label for="tpl-body" class="block text-sm font-medium text-labels mb-1">
							Body (Markdown)
						</label>
						<textarea
							id="tpl-body"
							bind:value={bodyMarkdown}
							rows={10}
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
								onclick={() => (broadcastConfirmOpen = true)}
								disabled={sending || recipientCount === 0}
							>
								<Send class="w-4 h-4 mr-1" />
								{sending ? 'Sending...' : 'Send Broadcast'}
							</Button>
						</div>
					</div>
				</div>
			</Card>
		</section>

		<!-- Right: Version History -->
		<section>
			<Card elevation="resting" padding="none">
				<div class="p-4 border-b border-secondary">
					<h2 class="text-lg font-semibold text-headers">
						Version History ({templateHistory?.length ?? 0})
					</h2>
				</div>

				<ul class="divide-y divide-secondary max-h-[600px] overflow-y-auto">
					{#each templateHistory ?? [] as tpl (tpl.template_id)}
						<li class="p-4 hover:bg-canvas/50 transition-colors">
							<div class="flex items-start justify-between gap-2 mb-1">
								<div class="flex items-center gap-2">
									<span class="font-semibold text-headers text-sm">v{tpl.version}</span>
									{#if tpl.is_current}
										<Badge variant="ready">current</Badge>
									{/if}
									{#if tpl.version === 1}
										<Badge variant="outline">default</Badge>
									{/if}
								</div>
								<span class="text-xs text-meta whitespace-nowrap">
									{formatDate(tpl.created_at)}
								</span>
							</div>

							<p class="text-xs text-labels mb-1">
								by {tpl.created_by_display_name || 'Unknown'}
							</p>
							<p class="text-xs text-meta truncate mb-2">
								{truncate(tpl.subject, 50)}
							</p>

							<div class="flex gap-2">
								<Button
									variant="ghost"
									size="sm"
									onclick={() => togglePreview(tpl)}
								>
									{#if previewVersion?.template_id === tpl.template_id}
										<X class="w-3 h-3 mr-1" />
										Close
									{:else}
										<Eye class="w-3 h-3 mr-1" />
										View
									{/if}
								</Button>
								{#if !tpl.is_current}
									<Button
										variant="ghost"
										size="sm"
										onclick={() => startRestore(tpl)}
									>
										<RotateCcw class="w-3 h-3 mr-1" />
										Restore
									</Button>
								{/if}
							</div>
						</li>
					{/each}

					{#if !templateHistory?.length}
						<li class="p-4 text-center text-meta text-sm">No template versions yet.</li>
					{/if}
				</ul>
			</Card>
		</section>
	</div>

	<!-- Read-Only Preview Panel -->
	{#if previewVersion}
		<section class="mt-6">
			<Card elevation="raised" padding="md">
				<div class="flex items-start justify-between mb-4">
					<div>
						<h3 class="font-semibold text-headers">
							Version {previewVersion.version}
							{#if previewVersion.is_current}
								<Badge variant="ready" class="ml-2">current</Badge>
							{/if}
						</h3>
						<p class="text-sm text-labels">
							{formatDate(previewVersion.created_at)} — {previewVersion.created_by_display_name ||
								'Unknown'}
						</p>
					</div>
					<Button variant="ghost" size="sm" onclick={closePreview}>
						<X class="w-4 h-4" />
					</Button>
				</div>

				<div class="space-y-3">
					<div>
						<span class="text-xs font-medium text-labels">Subject</span>
						<p class="text-sm text-headers bg-canvas rounded-[var(--radius-card)] px-3 py-2 border border-secondary">
							{previewVersion.subject}
						</p>
					</div>

					<div>
						<span class="text-xs font-medium text-labels">Body</span>
						<pre class="text-sm text-headers bg-canvas rounded-[var(--radius-card)] px-3 py-2 border border-secondary whitespace-pre-wrap font-mono max-h-80 overflow-y-auto">{previewVersion.body_markdown}</pre>
					</div>
				</div>

				{#if !previewVersion.is_current}
					<div class="flex justify-end mt-4">
						<Button variant="secondary" size="sm" onclick={() => startRestore(previewVersion!)}>
							<RotateCcw class="w-4 h-4 mr-1" />
							Restore This Version
						</Button>
					</div>
				{/if}
			</Card>
		</section>
	{/if}
</PageContainer>

<!-- Broadcast confirmation dialog -->
<ConfirmDialog
	bind:open={broadcastConfirmOpen}
	title="Send Broadcast Email"
	message={`Send this email to ${recipientCount} registered participant${recipientCount !== 1 ? 's' : ''}? This action will be logged.`}
	confirmLabel="Send"
	cancelLabel="Cancel"
	onConfirm={sendBroadcast}
	onCancel={() => (broadcastConfirmOpen = false)}
/>

<!-- Restore confirmation dialog -->
<ConfirmDialog
	bind:open={restoreConfirmOpen}
	title="Restore Template Version"
	message={restoreTarget
		? `This will create a new version with the content from v${restoreTarget.version}. The current template will be preserved in the history.`
		: ''}
	confirmLabel="Restore"
	cancelLabel="Cancel"
	onConfirm={confirmRestore}
	onCancel={() => {
		restoreConfirmOpen = false;
		restoreTarget = null;
	}}
/>
