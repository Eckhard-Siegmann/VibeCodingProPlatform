<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { toastError, toastSuccess } from '$lib';
	import PageContainer from '$lib/components/layout/PageContainer.svelte';
	import ProblemCard from '$lib/components/problem/ProblemCard.svelte';
	import FormDialog from '$lib/components/ui/form-dialog/form-dialog.svelte';
	import type { PageData } from './$types';
	import type { LessonCategory } from '$lib/components/problem/LessonCard.svelte';

	let { data }: { data: PageData } = $props();

	// ── Add Lesson dialog state (Ch.13.1, Ch.26, TICKET-15) ──────────
	let showAddLessonDialog = $state(false);
	let lessonContent = $state('');
	let lessonCategory = $state<LessonCategory | ''>('');
	let lessonTags = $state('');

	function openAddLessonDialog() {
		lessonContent = '';
		lessonCategory = '';
		lessonTags = '';
		showAddLessonDialog = true;
	}

	async function submitLesson() {
		const tags = lessonTags
			.split(',')
			.map((t) => t.trim())
			.filter(Boolean);

		const response = await fetch(`/api/problems/${data.problem.problem_id}/lessons`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				content: lessonContent,
				category: lessonCategory || undefined,
				tags: tags.length ? tags : undefined,
				event_id: data.eventId
			})
		});

		if (response.ok) {
			await invalidateAll();
			toastSuccess('Lesson captured', 'Your insight has been saved.');
		} else {
			const err = await response.json();
			toastError('Failed to save lesson', err.message || 'Unknown error');
			throw new Error(err.message); // Keep dialog open on error
		}
	}

	async function handleFlagValuable(lessonId: string) {
		try {
			const response = await fetch(
				`/api/problems/${data.problem.problem_id}/lessons/${lessonId}`,
				{
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ valuable: true })
				}
			);

			if (response.ok) {
				await invalidateAll();
			} else {
				const err = await response.json();
				toastError('Failed to flag lesson', err.message || 'Unknown error');
			}
		} catch (err: any) {
			toastError('Failed to flag lesson', err.message);
		}
	}

	// ── Adaptive chat polling (ADR 008) ──────────────────────────────
	// 3s during active events, 10s otherwise, paused when tab hidden.

	let pollInterval: ReturnType<typeof setInterval> | null = null;
	let isTabVisible = $state(true);

	function getPollIntervalMs(): number {
		// Ch.14, TICKET-27: 3s during active events, 10s otherwise
		const mode = data.liveContext?.currentMode;
		if (mode === 'pitch' || mode === 'review') {
			return 3_000;
		}
		return 10_000;
	}

	function startPolling() {
		stopPolling();
		if (!isTabVisible) return;

		const intervalMs = getPollIntervalMs();
		pollInterval = setInterval(async () => {
			if (!isTabVisible) return;
			try {
				await invalidateAll();
			} catch {
				// Silently swallow poll errors
			}
		}, intervalMs);
	}

	function stopPolling() {
		if (pollInterval) {
			clearInterval(pollInterval);
			pollInterval = null;
		}
	}

	function handleVisibilityChange() {
		isTabVisible = !document.hidden;
		if (isTabVisible) {
			// Catch-up poll on tab return (ADR 008)
			invalidateAll().catch(() => {});
			startPolling();
		} else {
			stopPolling();
		}
	}

	// Start polling on mount; restart when live mode changes (TICKET-27)
	$effect(() => {
		// Track liveContext.currentMode to re-run when it changes
		const _mode = data.liveContext?.currentMode;

		if (typeof document !== 'undefined') {
			document.addEventListener('visibilitychange', handleVisibilityChange);
			startPolling();
		}

		return () => {
			stopPolling();
			if (typeof document !== 'undefined') {
				document.removeEventListener('visibilitychange', handleVisibilityChange);
			}
		};
	});

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

	async function handleModeratorDecision(decisionType: string, rationale?: string) {
		const response = await fetch(`/api/events/${data.eventId}/decisions`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				problem_id: data.problem.problem_id,
				decision_type: decisionType,
				rationale,
				timer_duration_minutes: decisionType.includes('opened') ? 5 : undefined
			})
		});

		if (response.ok) {
			await invalidateAll();
			toastSuccess('Decision recorded', decisionType.replace(/_/g, ' '));
		} else {
			const error = await response.json();
			toastError('Failed to record decision', error.error || 'Unknown error');
		}
	}

	// ── Team action handlers (Ch.13.3, Ch.31.7) ────────────────────────

	async function teamAction(action: string, extra?: Record<string, unknown>) {
		const response = await fetch(`/api/problems/${data.problem.problem_id}/team`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action, event_id: data.eventId, ...extra })
		});

		if (!response.ok) {
			const err = await response.json();
			throw new Error(err.message || 'Team action failed');
		}
		return response.json();
	}

	async function handleJoinTeam() {
		try {
			await teamAction('join');
			await invalidateAll();
			toastSuccess('Team joined', 'You are now part of the team.');
		} catch (err: any) {
			toastError('Failed to join team', err.message);
		}
	}

	async function handleRetireFromTeam() {
		try {
			await teamAction('retire');
			await invalidateAll();
			toastSuccess('Retired from team', 'You can rejoin anytime.');
		} catch (err: any) {
			toastError('Failed to retire', err.message);
		}
	}

	async function handleRejoinTeam() {
		try {
			await teamAction('rejoin');
			await invalidateAll();
			toastSuccess('Rejoined team', 'Welcome back!');
		} catch (err: any) {
			toastError('Failed to rejoin', err.message);
		}
	}

	async function handleUpdateBreakout(url: string) {
		try {
			await teamAction('set_breakout_url', { url });
			await invalidateAll();
		} catch (err: any) {
			toastError('Failed to update breakout URL', err.message);
		}
	}

	// ── Resource action handlers (Ch.6.2, Ch.13.2) ─────────────────────

	async function handleAddResource(resourceType: 'direct' | 'helpful') {
		const title = prompt('Resource title:');
		if (!title) return;
		const url = prompt('Resource URL:');
		if (!url) return;

		try {
			const response = await fetch(`/api/problems/${data.problem.problem_id}/resources`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title, url, resource_type: resourceType })
			});

			if (response.ok) {
				await invalidateAll();
				toastSuccess('Resource added', 'Resource has been added successfully.');
			} else {
				const err = await response.json();
				toastError('Failed to add resource', err.message || 'Unknown error');
			}
		} catch (err: any) {
			toastError('Failed to add resource', err.message);
		}
	}

	async function handleEditResource(resourceId: string) {
		const title = prompt('New title:');
		if (!title) return;
		const url = prompt('New URL:');
		if (!url) return;

		try {
			const response = await fetch(
				`/api/problems/${data.problem.problem_id}/resources/${resourceId}`,
				{
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ title, url })
				}
			);

			if (response.ok) {
				await invalidateAll();
			} else {
				const err = await response.json();
				toastError('Failed to edit resource', err.message || 'Unknown error');
			}
		} catch (err: any) {
			toastError('Failed to edit resource', err.message);
		}
	}

	async function handleDeleteResource(resourceId: string) {
		if (!confirm('Delete this resource?')) return;

		try {
			const response = await fetch(
				`/api/problems/${data.problem.problem_id}/resources/${resourceId}`,
				{ method: 'DELETE' }
			);

			if (response.ok) {
				await invalidateAll();
				toastSuccess('Resource deleted', 'Resource has been removed.');
			} else {
				const err = await response.json();
				toastError('Failed to delete resource', err.message || 'Unknown error');
			}
		} catch (err: any) {
			toastError('Failed to delete resource', err.message);
		}
	}

	async function handleApproveResource(resourceId: string) {
		try {
			const response = await fetch(
				`/api/problems/${data.problem.problem_id}/resources/${resourceId}`,
				{
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ action: 'approve' })
				}
			);

			if (response.ok) {
				await invalidateAll();
				toastSuccess('Resource approved', 'Suggestion has been approved.');
			} else {
				const err = await response.json();
				toastError('Failed to approve', err.message || 'Unknown error');
			}
		} catch (err: any) {
			toastError('Failed to approve', err.message);
		}
	}

	async function handleRejectResource(resourceId: string) {
		try {
			const response = await fetch(
				`/api/problems/${data.problem.problem_id}/resources/${resourceId}`,
				{
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ action: 'reject' })
				}
			);

			if (response.ok) {
				await invalidateAll();
				toastSuccess('Suggestion rejected', 'Suggestion has been removed.');
			} else {
				const err = await response.json();
				toastError('Failed to reject', err.message || 'Unknown error');
			}
		} catch (err: any) {
			toastError('Failed to reject', err.message);
		}
	}

	// ── Chat action handlers (Ch.31.4, TICKET-13) ────────────────────

	async function handleSendMessage(message: string, replyToId?: string) {
		try {
			const response = await fetch(`/api/problems/${data.problem.problem_id}/chat`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					content: message,
					reply_to_message_id: replyToId,
					event_id: data.eventId
				})
			});

			if (!response.ok) {
				const err = await response.json();
				toastError('Failed to send message', err.message || 'Unknown error');
				return;
			}

			await invalidateAll();
		} catch (err: any) {
			toastError('Failed to send message', err.message);
		}
	}

	async function handleReactToMessage(messageId: string, emoji: string) {
		try {
			// Try to add; if already reacted, remove
			const addResponse = await fetch(
				`/api/problems/${data.problem.problem_id}/chat/${messageId}/reactions`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ emoji })
				}
			);

			if (!addResponse.ok) {
				const err = await addResponse.json();
				// If already reacted, toggle off by deleting
				if (err.error?.includes('Already reacted')) {
					await fetch(
						`/api/problems/${data.problem.problem_id}/chat/${messageId}/reactions`,
						{
							method: 'DELETE',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({ emoji })
						}
					);
				}
			}

			await invalidateAll();
		} catch (err: any) {
			toastError('Failed to react', err.message);
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
		teamMembers={data.teamMembers}
		chatMessages={data.chatMessages}
		lessons={data.lessons}
		breakoutUrl={data.breakoutUrl}
		currentUserId={data.currentUserId}
		directResources={data.directResources}
		helpfulResources={data.helpfulResources}
		latestSnapshot={data.latestSnapshot}
		onVersionSelect={handleVersionSelect}
		onFieldUpdate={handleFieldUpdate}
		onSubmit={handleSubmit}
		onModify={handleModify}
		onClone={handleClone}
		onDecision={handleModeratorDecision}
		onJoinTeam={handleJoinTeam}
		onRetireFromTeam={handleRetireFromTeam}
		onRejoinTeam={handleRejoinTeam}
		onUpdateBreakout={handleUpdateBreakout}
		onSendMessage={handleSendMessage}
		onReactToMessage={handleReactToMessage}
		onAddResource={handleAddResource}
		onEditResource={handleEditResource}
		onDeleteResource={handleDeleteResource}
		onApproveResource={handleApproveResource}
		onRejectResource={handleRejectResource}
		onAddLesson={openAddLessonDialog}
		onFlagValuable={handleFlagValuable}
	/>
</PageContainer>

<!-- Add Lesson Dialog (Ch.13.1, Ch.26 FormDialog pattern) -->
<FormDialog
	bind:open={showAddLessonDialog}
	title="Add Lesson Learned"
	description="Capture an insight from working on this problem."
	submitLabel="Save Lesson"
	submitDisabled={!lessonContent.trim()}
	onsubmit={submitLesson}
>
	<div class="space-y-4">
		<!-- Content -->
		<div class="space-y-1.5">
			<label for="lesson-content" class="text-sm font-medium text-headers">
				Insight <span class="text-alert">*</span>
			</label>
			<textarea
				id="lesson-content"
				bind:value={lessonContent}
				placeholder="What did you learn? Be specific and actionable."
				rows={4}
				maxlength={5000}
				class="w-full px-3 py-2 text-sm bg-card border border-secondary rounded-[var(--radius-card)] text-headers placeholder:text-meta focus:outline-none focus:ring-2 focus:ring-primary/50 resize-y"
			></textarea>
			<p class="text-xs text-meta text-right">{lessonContent.length}/5000</p>
		</div>

		<!-- Category -->
		<div class="space-y-1.5">
			<label for="lesson-category" class="text-sm font-medium text-headers">Category</label>
			<select
				id="lesson-category"
				bind:value={lessonCategory}
				class="w-full px-3 py-2 text-sm bg-card border border-secondary rounded-[var(--radius-card)] text-headers focus:outline-none focus:ring-2 focus:ring-primary/50"
			>
				<option value="">No category</option>
				<option value="tooling">Tooling</option>
				<option value="architecture">Architecture</option>
				<option value="process">Process</option>
				<option value="gotcha">Gotcha</option>
				<option value="performance">Performance</option>
				<option value="testing">Testing</option>
			</select>
		</div>

		<!-- Tags -->
		<div class="space-y-1.5">
			<label for="lesson-tags" class="text-sm font-medium text-headers">Tags</label>
			<input
				id="lesson-tags"
				type="text"
				bind:value={lessonTags}
				placeholder="prompting, optimization, caching (comma-separated)"
				class="w-full px-3 py-2 text-sm bg-card border border-secondary rounded-[var(--radius-card)] text-headers placeholder:text-meta focus:outline-none focus:ring-2 focus:ring-primary/50"
			/>
			<p class="text-xs text-meta">Separate tags with commas</p>
		</div>
	</div>
</FormDialog>
