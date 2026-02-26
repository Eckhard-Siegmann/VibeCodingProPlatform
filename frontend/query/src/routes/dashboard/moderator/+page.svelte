<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import PageContainer from '$lib/components/layout/PageContainer.svelte';
	import { Card } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import SearchBar from '$lib/components/ui/SearchBar.svelte';
	import ListFilterBar from '$lib/components/ui/ListFilterBar.svelte';
	import type { FilterConfig } from '$lib/components/ui/ListFilterBar.svelte';
	import {
		LiveBanner,
		CurrentActivity,
		ActivityFeed,
		DecisionAccordion,
		ReminderAlert,
		TemplateEditor,
		CommunicationsLog,
		ReviewResultsSummary,
		PitchResultsSummary,
		StarAwardsPanel,
		type LiveEventData,
		type OpenAssessment,
		type ActivityItem
	} from '$lib/components/dashboard';
	import { toastSuccess, toastInfo, toastError, toastWarning } from '$lib/stores/toast';
	import { audioStore } from '$lib/stores/audio';
	import { detectPhaseTransition, TimerAudioTracker, type LiveContextSnapshot } from '$lib/utils/event-notifications';
	import { createVisibilityAwareInterval } from '$lib/utils/visibility';
	import { generateCsv, downloadCsv, csvFilename } from '$lib/utils/csv';
	import {
		FileText,
		Users,
		ArrowRight,
		Clock,
		CheckCircle,
		AlertTriangle,
		Settings,
		ChevronUp,
		ChevronDown,
		Download
	} from '@lucide/svelte';

	let { data } = $props();

	// Derived from Server Load
	const { eventId, queue, liveContext, backlogItems: initialBacklogItems, backlogTotal: initialBacklogTotal, recentDecisions, registrationCounts, reminderStatus, currentTemplate, communicationsLog, openAssessment, reviewResults, pitchResults, reviewScores, existingStarAwards, attendeeItems: initialAttendeeItems, attendeeTotal: initialAttendeeTotal, showUpStats: initialShowUpStats, isAdmin } = $derived(data);

	// Transform liveContext into LiveEventData format
	const liveEvent = $derived<LiveEventData>({
		eventId: eventId,
		eventTitle: reminderStatus?.eventTitle ?? 'Demo Event 2026',
		currentPhase: (liveContext?.current_mode === 'idle' ? 'upcoming' : liveContext?.current_mode === 'pitch' ? 'pitching' : 'reviewing') as any,
		currentProblemTitle: liveContext?.problem_title || 'No active problem',
		currentProblemSlug: liveContext?.problem_slug || '',
		participantsOnline: 24, // Mock
		countdownSeconds: liveContext?.timer_ends_at ? Math.max(0, Math.floor((new Date(liveContext.timer_ends_at).getTime() - Date.now()) / 1000)) : 0,
		statusMessage: liveContext?.current_mode === 'idle' ? 'Waiting for moderator to start' : 'Live'
	});

	// Transform liveContext + real assessment into OpenAssessment format if active
	const currentOpenAssessment = $derived<OpenAssessment | undefined>(
		liveContext?.current_mode !== 'idle' && liveContext?.current_problem_id && openAssessment
			? {
					assessmentId: openAssessment.assessmentId,
					type: openAssessment.type,
					problemTitle: openAssessment.problemTitle || liveContext.problem_title || '',
					problemSlug: openAssessment.problemSlug || liveContext.problem_slug || '',
					description: `Live ${liveContext.current_mode} for ${liveContext.problem_title}`,
					closesAt: liveContext.timer_ends_at ? new Date(liveContext.timer_ends_at) : new Date(Date.now() + 600000)
			  }
			: undefined
	);

	// Transform recent decisions for activity feed
	const recentActivity = $derived<ActivityItem[]>(
		(recentDecisions || []).map((d: any) => ({
			id: d.decision_id,
			type: 'decision_made',
			title: `decision: ${d.decision_type.replace(/_/g, ' ')}`,
			actor: { id: '', displayName: d.actor_display_name },
			problemTitle: d.problem_title,
			timestamp: new Date(d.created_at),
			href: d.problem_slug ? `/problem/${d.problem_slug}` : undefined
		}))
	);

	// Selected problem for decisions
	let selectedProblemId = $state<string | null>(null);

	// Initialize selection if queue exists but nothing is selected
	$effect(() => {
		if (queue && queue.length > 0 && !selectedProblemId) {
			selectedProblemId = queue[0].problem_id;
		}
	});

	const selectedProblem = $derived(
		queue?.find((p: any) => p.problem_id === selectedProblemId) ?? null
	);

	// Timer modal state for opening pitch/review (Ch.12.5)
	let timerModalOpen = $state(false);
	let timerModalDecisionType = $state('');
	let timerDurationMinutes = $state(5);
	let timerNoLimit = $state(false);
	let decisionLoading = $state(false);

	const DURATION_OPTIONS = [
		{ value: 3, label: '3 minutes' },
		{ value: 5, label: '5 minutes' },
		{ value: 10, label: '10 minutes' },
		{ value: 15, label: '15 minutes' }
	];

	// Actions
	function handleDecision(decisionType: string, rationale?: string) {
		if (!selectedProblemId) return;

		// Intercept live "opened" decisions to show timer configuration
		if (decisionType === 'opened_for_pitch_assessment' || decisionType === 'opened_for_review') {
			timerModalDecisionType = decisionType;
			timerDurationMinutes = 5;
			timerNoLimit = false;
			timerModalOpen = true;
			return;
		}

		executeDecision(decisionType, rationale);
	}

	async function confirmTimerModal() {
		await executeDecision(
			timerModalDecisionType,
			undefined,
			timerNoLimit ? undefined : timerDurationMinutes
		);
		timerModalOpen = false;
	}

	function cancelTimerModal() {
		timerModalOpen = false;
		timerModalDecisionType = '';
	}

	async function executeDecision(decisionType: string, rationale?: string, timerMinutes?: number) {
		if (!selectedProblemId) return;
		decisionLoading = true;

		try {
			const res = await fetch(`/api/events/${eventId}/decisions`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					problem_id: selectedProblemId,
					decision_type: decisionType,
					rationale,
					timer_duration_minutes: timerMinutes
				})
			});

			const result = await res.json();
			if (result.success) {
				toastSuccess('Decision recorded', `${decisionType.replace(/_/g, ' ')} for ${selectedProblem?.title}`);
				invalidateAll();
			} else {
				toastError('Error', result.error || 'Failed to record decision');
			}
		} catch (err) {
			toastError('Error', 'Network request failed');
		} finally {
			decisionLoading = false;
		}
	}

	// Timer extend: add 5 minutes to current timer
	async function extendTimer() {
		if (!liveContext?.timer_ends_at || !liveContext?.current_problem_id) return;

		const currentEnds = new Date(liveContext.timer_ends_at);
		const newEnds = new Date(currentEnds.getTime() + 5 * 60 * 1000);
		const remainingMinutes = Math.ceil((newEnds.getTime() - Date.now()) / (60 * 1000));

		try {
			const db = await fetch(`/api/events/${eventId}/live-context`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ timer_ends_at: newEnds.toISOString() })
			});

			if (db.ok) {
				toastInfo('Timer extended', `+5 minutes added`);
				invalidateAll();
			} else {
				toastError('Error', 'Failed to extend timer');
			}
		} catch {
			toastError('Error', 'Network request failed');
		}
	}

	async function moveInQueue(problemId: string, direction: 'up' | 'down') {
		if (!queue) return;

		const currentIndex = queue.findIndex((q: any) => q.problem_id === problemId);
		if (currentIndex === -1) return;

		if (direction === 'up' && currentIndex === 0) return;
		if (direction === 'down' && currentIndex === queue.length - 1) return;

		// Clone array
		let orderedIds = queue.map((q: any) => q.problem_id);
		const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

		// Swap
		const temp = orderedIds[currentIndex];
		orderedIds[currentIndex] = orderedIds[swapIndex];
		orderedIds[swapIndex] = temp;

		try {
			const res = await fetch(`/api/events/${eventId}/queue`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ordered_problem_ids: orderedIds })
			});

			if (res.ok) {
				invalidateAll();
			} else {
				toastError('Reorder Failed', 'Could not update queue order');
			}
		} catch (e) {
			toastError('Error', 'Failed to communicate with server');
		}
	}

	function selectProblem(problemId: string) {
		selectedProblemId = problemId;
	}

	// Initialize audio preferences on mount
	$effect(() => { audioStore.loadPreference(); });

	// Phase transition notification state (Ch.14.5.2, ADR 008)
	let lastSnapshot = $state<LiveContextSnapshot>({
		currentMode: liveContext?.current_mode || 'idle',
		currentProblemTitle: liveContext?.problem_title || null,
		timerEndsAt: liveContext?.timer_ends_at || null
	});

	// Timer audio tracker (Ch.14.5.1) — fires at 60s and 0s thresholds
	const timerTracker = new TimerAudioTracker();

	// Timer update logic + audio cues
	let displayTime = $state('0:00');
	let timerSeconds = $state(0);

	$effect(() => {
		const interval = setInterval(() => {
			if (liveContext?.timer_ends_at) {
				timerSeconds = Math.max(0, Math.floor((new Date(liveContext.timer_ends_at).getTime() - Date.now()) / 1000));
				displayTime = `${Math.floor(timerSeconds / 60)}:${(timerSeconds % 60).toString().padStart(2, '0')}`;

				// Timer audio cues (Ch.14.5.1): warning at 60s, expired at 0s
				const audioAction = timerTracker.check(liveContext.timer_ends_at, timerSeconds);
				if (audioAction === 'timerWarning') {
					audioStore.playTimerWarning();
					toastWarning('1 minute remaining', 'Timer expires soon');
				} else if (audioAction === 'timerExpired') {
					audioStore.playTimerExpired();
					toastInfo('Time is up', 'The timer has expired');
				}
			} else {
				timerSeconds = 0;
				displayTime = '0:00';
			}
		}, 1000);

		return () => clearInterval(interval);
	});

	// Polling with visibility awareness (ADR 008) + phase transition notifications (Ch.14.5.2)
	$effect(() => {
		async function pollLiveContext() {
			try {
				const res = await fetch(`/api/events/${eventId}/live-context`);
				if (!res.ok) return;
				const result = await res.json();
				const d = result.data;
				const newMode = d?.current_mode || 'idle';

				const newSnapshot: LiveContextSnapshot = {
					currentMode: newMode,
					currentProblemTitle: d?.problem_title || null,
					timerEndsAt: d?.timer_ends_at || null
				};

				// Detect phase transitions → fire toast + audio (Ch.14.5.2)
				const notification = detectPhaseTransition(lastSnapshot, newSnapshot);
				if (notification) {
					if (notification.toast.variant === 'success') toastSuccess(notification.toast.title, notification.toast.message);
					else if (notification.toast.variant === 'warning') toastWarning(notification.toast.title, notification.toast.message);
					else toastInfo(notification.toast.title, notification.toast.message);

					if (notification.audio === 'phaseChange') audioStore.playPhaseChange();
				}

				lastSnapshot = newSnapshot;

				if (newMode !== (liveContext?.current_mode || 'idle')) {
					invalidateAll();
				}
			} catch {
				// Silently ignore polling failures
			}
		}

		const cleanup = createVisibilityAwareInterval(pollLiveContext, 5000, pollLiveContext);
		return cleanup;
	});

	// Scroll to template editor when ReminderAlert "Send Now" is clicked
	function scrollToTemplateEditor() {
		const el = document.getElementById('template-editor-section');
		if (el) el.scrollIntoView({ behavior: 'smooth' });
	}

	// ── Backlog State (TICKET-33: "Load More" + filters) ──
	let allBacklogItems = $state<any[]>(initialBacklogItems ?? []);
	let backlogTotal = $state(initialBacklogTotal ?? 0);
	let backlogOffset = $state(0);
	let backlogLoading = $state(false);
	let backlogFilterValues = $state<Record<string, string>>({ type: 'all', age: 'all' });

	const backlogFilters: FilterConfig[] = [
		{
			key: 'type',
			label: 'Problem Type',
			defaultValue: 'all',
			options: [
				{ value: 'all', label: 'All Types' },
				{ value: 'greenfield', label: 'Greenfield' },
				{ value: 'brownfield', label: 'Brownfield' },
				{ value: 'explorative', label: 'Explorative' },
				{ value: 'other', label: 'Other' }
			]
		},
		{
			key: 'age',
			label: 'Age',
			defaultValue: 'all',
			options: [
				{ value: 'all', label: 'All Ages' },
				{ value: 'urgent', label: 'Urgent (>7 days)' },
				{ value: 'recent', label: 'Recent (<3 days)' }
			]
		}
	];

	$effect(() => {
		if (initialBacklogItems) {
			allBacklogItems = initialBacklogItems;
			backlogOffset = 0;
		}
		if (initialBacklogTotal !== undefined) backlogTotal = initialBacklogTotal;
	});

	async function fetchBacklog(reset: boolean) {
		backlogLoading = true;
		const offset = reset ? 0 : backlogOffset + 10;
		const type = backlogFilterValues.type || '';
		const age = backlogFilterValues.age || '';
		try {
			const res = await fetch(`/api/problems/backlog?limit=10&offset=${offset}&type=${type}&age=${age}`);
			const result = await res.json();
			if (result.success) {
				if (reset) {
					allBacklogItems = result.items;
				} else {
					allBacklogItems = [...allBacklogItems, ...result.items];
				}
				backlogTotal = result.totalItems;
				backlogOffset = offset;
			}
		} catch {
			toastError('Error', 'Failed to load backlog');
		} finally {
			backlogLoading = false;
		}
	}

	function onBacklogFilterChange(key: string, value: string) {
		backlogFilterValues = { ...backlogFilterValues, [key]: value };
		fetchBacklog(true);
	}

	function onBacklogClearAll() {
		backlogFilterValues = { type: 'all', age: 'all' };
		fetchBacklog(true);
	}

	// ── Attendance Tracking (TICKET-33: SearchBar + ListFilterBar + "Load More") ──
	let attendees = $state<any[]>(initialAttendeeItems ?? []);
	let attendeeTotal = $state(initialAttendeeTotal ?? 0);
	let attendeeOffset = $state(0);
	let showUpStats = $state(initialShowUpStats ?? { total_registered: 0, in_presence_registered: 0, remote_registered: 0, showed_up: 0, no_show: 0, not_recorded: 0, show_up_rate: 0 });
	let attendanceExpanded = $state(false);
	let attendanceLoading = $state(false);
	let attendanceSearch = $state('');
	let attendanceFilterValues = $state<Record<string, string>>({ mode: 'all', status: 'all' });

	const attendanceFilters: FilterConfig[] = [
		{
			key: 'mode',
			label: 'Mode',
			defaultValue: 'all',
			options: [
				{ value: 'all', label: 'All Modes' },
				{ value: 'in_presence', label: 'In-Presence' },
				{ value: 'remote', label: 'Remote' }
			]
		},
		{
			key: 'status',
			label: 'Status',
			defaultValue: 'all',
			options: [
				{ value: 'all', label: 'All Status' },
				{ value: 'checked_in', label: 'Checked In' },
				{ value: 'not_yet', label: 'Not Yet' }
			]
		}
	];

	$effect(() => {
		if (initialAttendeeItems) {
			attendees = initialAttendeeItems;
			attendeeOffset = 0;
		}
		if (initialAttendeeTotal !== undefined) attendeeTotal = initialAttendeeTotal;
		if (initialShowUpStats) showUpStats = initialShowUpStats;
	});

	async function fetchAttendees(reset: boolean) {
		attendanceLoading = true;
		const offset = reset ? 0 : attendeeOffset + 50;
		const mode = attendanceFilterValues.mode || '';
		const status = attendanceFilterValues.status || '';
		const search = attendanceSearch || '';
		try {
			const params = new URLSearchParams({
				limit: '50',
				offset: String(offset),
				mode,
				status,
				search
			});
			const res = await fetch(`/api/events/${eventId}/attendance?${params}`);
			const result = await res.json();
			if (result.success) {
				if (reset) {
					attendees = result.items;
				} else {
					attendees = [...attendees, ...result.items];
				}
				attendeeTotal = result.totalItems;
				attendeeOffset = offset;
			}
		} catch {
			toastError('Error', 'Failed to load attendees');
		} finally {
			attendanceLoading = false;
		}
	}

	function onAttendanceSearch(query: string) {
		attendanceSearch = query;
		fetchAttendees(true);
	}

	function onAttendanceFilterChange(key: string, value: string) {
		attendanceFilterValues = { ...attendanceFilterValues, [key]: value };
		fetchAttendees(true);
	}

	function onAttendanceClearAll() {
		attendanceFilterValues = { mode: 'all', status: 'all' };
		attendanceSearch = '';
		fetchAttendees(true);
	}

	async function toggleAttendance(userId: string, showedUp: boolean) {
		attendanceLoading = true;
		try {
			const res = await fetch(`/api/events/${eventId}/attendance`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ user_id: userId, showed_up: showedUp })
			});
			const result = await res.json();
			if (result.success) {
				attendees = attendees.map((a: any) =>
					a.user_id === userId ? { ...a, showed_up: showedUp ? 1 : 0 } : a
				);
				showUpStats = result.stats;
			}
		} catch {
			toastError('Error', 'Failed to update attendance');
		} finally {
			attendanceLoading = false;
		}
	}

	async function markAllPresent() {
		attendanceLoading = true;
		try {
			const res = await fetch(`/api/events/${eventId}/attendance/mark-all`, {
				method: 'POST'
			});
			const result = await res.json();
			if (result.success) {
				toastSuccess('Attendance', `Marked ${result.marked} attendees as present`);
				// Reload with current filters
				fetchAttendees(true);
				// Refresh stats from full dataset
				const statsRes = await fetch(`/api/events/${eventId}/attendance`);
				const statsData = await statsRes.json();
				if (statsData.success) {
					showUpStats = statsData.stats;
				}
			}
		} catch {
			toastError('Error', 'Failed to mark all present');
		} finally {
			attendanceLoading = false;
		}
	}

	async function exportAttendanceCsv() {
		try {
			// Fetch ALL attendees (unfiltered) for CSV export
			const res = await fetch(`/api/events/${eventId}/attendance`);
			const result = await res.json();
			if (result.success) {
				const headers = ['Name', 'Email', 'Mode', 'Showed Up'];
				const rows = result.attendees.map((a: any) => [
					a.display_name,
					a.email,
					a.in_presence === 1 ? 'In-Person' : 'Remote',
					a.showed_up === 1 ? 'Yes' : a.showed_up === 0 ? 'No' : 'Not Recorded'
				]);
				const csv = generateCsv(headers, rows);
				downloadCsv(csv, csvFilename('attendance'));
			}
		} catch {
			toastError('Error', 'Failed to export attendance');
		}
	}
</script>

<svelte:head>
	<title>Moderator Dashboard - VibeCoding</title>
</svelte:head>

<!-- Live Banner (sticky) -->
<LiveBanner
	event={liveEvent}
	ratingHref={currentOpenAssessment ? `/assess/${currentOpenAssessment.assessmentId}` : undefined}
/>

<PageContainer>
	<!-- Header -->
	<header class="mb-6">
		<div class="flex items-center justify-between flex-wrap gap-4">
			<div>
				<h1 class="text-2xl md:text-3xl font-bold text-headers">Moderator Dashboard</h1>
				<p class="text-labels">{liveEvent.eventTitle}</p>
			</div>
			<div class="flex gap-2">
				<a href="/dashboard">
					<Button variant="outline" size="sm">
						<Users class="w-4 h-4 mr-1" />
						Participant View
					</Button>
				</a>
				<Button variant="secondary" size="sm">
					<Settings class="w-4 h-4 mr-1" />
					Event Settings
				</Button>
			</div>
		</div>
	</header>

	<div class="space-y-6">
		<!-- Reminder Alert (above Current Activity when due) -->
		{#if reminderStatus}
			<ReminderAlert
				reminderDue={reminderStatus.reminderDue}
				reminderSentAt={reminderStatus.reminderSentAt}
				eventTitle={reminderStatus.eventTitle}
				onSendReminder={scrollToTemplateEditor}
			/>
		{/if}

		<!-- Template Editor (collapsible, expanded when reminder due) -->
		<div id="template-editor-section">
			<TemplateEditor
				{eventId}
				template={currentTemplate}
				recipientCount={registrationCounts.registeredCount + registrationCounts.waitlistCount}
				expanded={!!reminderStatus?.reminderDue && !reminderStatus?.reminderSentAt}
			/>
		</div>

		<!-- Current Activity Section -->
		<section>
			<h2 class="text-lg font-semibold text-headers mb-3">Current Activity</h2>
			{#if currentOpenAssessment}
				<CurrentActivity assessment={currentOpenAssessment} />
			{:else}
				<Card padding="md" class="text-center text-meta py-8">
					<Clock class="w-8 h-8 text-secondary mx-auto mb-2" />
					<p>Event is currently idle.</p>
					<p class="text-sm">Select a problem from the queue to start a pitch or review.</p>
				</Card>
			{/if}
		</section>

		<!-- Main Grid -->
		<div class="grid gap-6 lg:grid-cols-[1fr_320px]">
			<!-- Left Column: Problems & Backlog -->
			<div class="space-y-6">
				<!-- Event Problems (Queue) -->
				<section>
					<div class="flex items-center justify-between mb-3">
						<h2 class="text-lg font-semibold text-headers">
							Event Queue ({(queue || []).length})
						</h2>
						<a href="/dashboard/moderator/queue/{eventId}">
							<Button variant="outline" size="sm">
								<Settings class="w-4 h-4 mr-1" />
								Plan Queue
							</Button>
						</a>
					</div>
					<div class="space-y-3">
						{#if queue?.length === 0}
							<Card padding="md" class="text-center text-meta py-8 border-dashed">
								<p>No problems in the event queue.</p>
								<p class="text-sm mt-2">Approve problems from the backlog to add them to the queue.</p>
							</Card>
						{/if}

						{#each queue || [] as problem, idx (problem.problem_id)}
							<Card
								elevation={selectedProblemId === problem.problem_id ? 'raised' : 'resting'}
								padding="md"
								class={selectedProblemId === problem.problem_id
									? 'border-2 border-primary'
									: 'border border-transparent hover:border-secondary cursor-pointer'}
							>
								<div class="flex items-center gap-3">
									<div class="flex flex-col gap-1">
										<button
											onclick={() => moveInQueue(problem.problem_id, 'up')}
											disabled={idx === 0}
											class="p-1 text-meta hover:text-primary disabled:opacity-30"
										>
											<ChevronUp class="w-4 h-4" />
										</button>
										<div class="text-center text-xs font-bold text-headers bg-canvas rounded px-1">{idx + 1}</div>
										<button
											onclick={() => moveInQueue(problem.problem_id, 'down')}
											disabled={idx === queue.length - 1}
											class="p-1 text-meta hover:text-primary disabled:opacity-30"
										>
											<ChevronDown class="w-4 h-4" />
										</button>
									</div>

									<button
										type="button"
										onclick={() => selectProblem(problem.problem_id)}
										class="flex-1 text-left min-w-0"
									>
										<div class="flex items-start gap-4">
											<div class="p-2 rounded-lg bg-primary/10 flex-shrink-0 mt-1">
												<FileText class="w-5 h-5 text-primary" />
											</div>
											<div class="flex-1 min-w-0">
												<div class="flex items-start justify-between gap-2 flex-wrap">
													<div class="min-w-0">
														<h3 class="font-semibold text-headers truncate">{problem.title}</h3>
														<p class="text-sm text-labels">by {problem.owner_display_name}</p>
													</div>
													<div class="flex gap-2 flex-shrink-0">
														{#if liveContext?.current_problem_id === problem.problem_id}
															<Badge variant={"success" as any} class="animate-pulse">Live: {liveContext.current_mode}</Badge>
														{/if}
														<Badge variant={problem.current_action_state as any}>
															{problem.current_action_state.replace(/_/g, ' ')}
														</Badge>
													</div>
												</div>
											</div>
										</div>
									</button>
								</div>
							</Card>
						{/each}
					</div>
				</section>

				<!-- Pending Review Backlog (TICKET-33: "Load More" + filters) -->
				<section>
					<h2 class="text-lg font-semibold text-headers flex items-center gap-2 mb-3">
						<AlertTriangle class="w-5 h-5 text-warning" />
						Pending Review ({backlogTotal})
					</h2>

					<!-- Filters (component-level state, no URL) -->
					<ListFilterBar
						filters={backlogFilters}
						values={backlogFilterValues}
						onFilterChange={onBacklogFilterChange}
						showClearAll={true}
						onClearAll={onBacklogClearAll}
						class="mb-3"
					/>

					{#if allBacklogItems.length > 0}
						<Card elevation="resting" padding="none">
							<ul class="divide-y divide-secondary">
								{#each allBacklogItems as problem (problem.problem_id)}
									{@const daysAgo = Math.floor((Date.now() - new Date(problem.created_at).getTime()) / 86400000)}
									{@const urgencyClass = daysAgo > 7 ? 'text-alert' : daysAgo >= 3 ? 'text-warning' : 'text-headers'}
									<li class="p-4 hover:bg-canvas/50 transition-colors">
										<div class="flex items-center justify-between gap-4">
											<div class="min-w-0 flex-1">
												<h3 class="font-medium text-headers truncate">{problem.title}</h3>
												<p class="text-sm text-labels">
													{problem.owner_display_name} &middot;
													<span class={urgencyClass}>Submitted {daysAgo === 0 ? 'today' : daysAgo === 1 ? '1 day ago' : `${daysAgo} days ago`}</span>
												</p>
											</div>
											{#if problem.problem_type}
												<Badge variant="outline">{problem.problem_type}</Badge>
											{/if}
											<Badge variant={problem.current_readiness_state}>
												{problem.current_readiness_state.replace('_', ' ')}
											</Badge>
											<a href={`/problem/${problem.slug}`}>
												<Button variant="ghost" size="sm">
													Review
													<ArrowRight class="w-4 h-4 ml-1" />
												</Button>
											</a>
										</div>
									</li>
								{/each}
							</ul>
						</Card>

						<!-- "Load More" button -->
						{#if allBacklogItems.length < backlogTotal}
							<div class="mt-3 text-center">
								<Button
									variant="outline"
									onclick={() => fetchBacklog(false)}
									disabled={backlogLoading}
								>
									{#if backlogLoading}
										Loading...
									{:else}
										Load 10 more (showing {allBacklogItems.length} of {backlogTotal})
									{/if}
								</Button>
							</div>
						{/if}
					{:else if backlogLoading}
						<Card padding="md" class="text-center text-meta">Loading...</Card>
					{:else}
						<Card padding="md" class="text-center text-meta">No problems pending review.</Card>
					{/if}
				</section>

				<!-- Attendance Tracking (TICKET-33: SearchBar + ListFilterBar + "Load More") -->
				<section>
					<button
						type="button"
						class="flex items-center justify-between w-full mb-3"
						onclick={() => (attendanceExpanded = !attendanceExpanded)}
					>
						<h2 class="text-lg font-semibold text-headers flex items-center gap-2">
							<CheckCircle class="w-5 h-5 text-primary" />
							Attendance ({showUpStats.showed_up}/{showUpStats.total_registered} checked in, {attendeeTotal} registered)
						</h2>
						{#if attendanceExpanded}
							<ChevronUp class="w-5 h-5 text-meta" />
						{:else}
							<ChevronDown class="w-5 h-5 text-meta" />
						{/if}
					</button>

					<Card elevation="resting" padding="md">
						<!-- Stats row (always visible, from FULL dataset) -->
						<div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
							<div>
								<p class="text-2xl font-bold text-headers">{showUpStats.showed_up}</p>
								<p class="text-sm text-labels">Showed Up</p>
							</div>
							<div>
								<p class="text-2xl font-bold text-headers">{showUpStats.total_registered}</p>
								<p class="text-sm text-labels">Registered</p>
							</div>
							<div>
								<p class="text-2xl font-bold text-primary">{showUpStats.show_up_rate}%</p>
								<p class="text-sm text-labels">Show-up Rate</p>
							</div>
							<div>
								<p class="text-2xl font-bold text-headers">{showUpStats.not_recorded}</p>
								<p class="text-sm text-labels">Not Recorded</p>
							</div>
						</div>

						{#if attendanceExpanded}
							<!-- Search + Filters + Actions -->
							<div class="mt-4 space-y-3">
								<SearchBar
									bind:value={attendanceSearch}
									placeholder="Search by name or email..."
									onSearch={onAttendanceSearch}
								/>

								<div class="flex flex-wrap items-center gap-2">
									<ListFilterBar
										filters={attendanceFilters}
										values={attendanceFilterValues}
										onFilterChange={onAttendanceFilterChange}
										showClearAll={true}
										onClearAll={onAttendanceClearAll}
										class="flex-1"
									/>
									<div class="flex gap-2 flex-shrink-0">
										<Button variant="outline" size="sm" onclick={markAllPresent} disabled={attendanceLoading}>
											<CheckCircle class="w-4 h-4 mr-1" />
											Mark All Present
										</Button>
										<Button variant="outline" size="sm" onclick={exportAttendanceCsv}>
											<Download class="w-4 h-4 mr-1" />
											CSV
										</Button>
									</div>
								</div>
							</div>

							<!-- Checklist -->
							<ul class="divide-y divide-secondary max-h-96 overflow-y-auto mt-3">
								{#each attendees as attendee (attendee.user_id)}
									<li class="flex items-center gap-3 py-2 px-1">
										<input
											type="checkbox"
											class="w-5 h-5 accent-primary flex-shrink-0"
											checked={attendee.showed_up === 1}
											onchange={(e) => toggleAttendance(attendee.user_id, e.currentTarget.checked)}
											disabled={attendanceLoading}
										/>
										<div class="flex-1 min-w-0">
											<p class="text-sm font-medium text-headers truncate">{attendee.display_name}</p>
											<p class="text-xs text-meta truncate">{attendee.email}</p>
										</div>
										<Badge variant={attendee.in_presence === 1 ? 'outline' : 'draft'}>
											{attendee.in_presence === 1 ? 'In-Person' : 'Remote'}
										</Badge>
									</li>
								{/each}
								{#if attendees.length === 0 && !attendanceLoading}
									<li class="py-4 text-center text-meta text-sm">No attendees match the search or filter.</li>
								{/if}
							</ul>

							<!-- "Load More" button -->
							{#if attendees.length < attendeeTotal}
								<div class="mt-3 text-center">
									<Button
										variant="outline"
										onclick={() => fetchAttendees(false)}
										disabled={attendanceLoading}
									>
										{#if attendanceLoading}
											Loading...
										{:else}
											Load 50 more (showing {attendees.length} of {attendeeTotal})
										{/if}
									</Button>
								</div>
							{/if}
						{/if}
					</Card>
				</section>

				<!-- Pitch Results Summary (Ch.15 Event-Level Pitch Results) -->
				<PitchResultsSummary
					results={pitchResults || []}
					collapsed={pitchResults?.length > 3}
					showCsvExport={isAdmin}
				/>

				<!-- Review Results Summary (Ch.15.4.7) -->
				<ReviewResultsSummary
					results={reviewResults || []}
					collapsed={reviewResults?.length > 3}
					showCsvExport={isAdmin}
				/>

				<!-- Star Awards Panel (Ch.33.6.4, Ch.17.9) -->
				<StarAwardsPanel
					{eventId}
					eventTitle={reminderStatus?.eventTitle ?? 'Current Event'}
					reviewScores={reviewScores || []}
					existingAwards={existingStarAwards || []}
				/>

				<!-- Communications Log -->
				<section>
					<CommunicationsLog entries={communicationsLog} />
				</section>
			</div>

			<!-- Right Column: Decision Panel & Activity -->
			<aside class="space-y-6 lg:sticky lg:top-20 lg:self-start">
				<!-- Decision Accordion -->
				<Card elevation="resting" padding="md">
					<h3 class="font-semibold text-headers mb-3">Moderator Controls</h3>
					<DecisionAccordion
						problemId={selectedProblem?.problem_id}
						problemTitle={selectedProblem?.title}
						onDecision={handleDecision}
						disabled={!selectedProblem}
					/>
				</Card>

				<!-- Activity Feed -->
				<ActivityFeed
					activities={recentActivity}
					totalCount={recentActivity.length}
					title="Recent Decisions"
				/>

				<!-- Timer Controls -->
				<Card elevation="resting" padding="md">
					<h3 class="font-semibold text-headers mb-3 flex items-center gap-2">
						<Clock class="w-4 h-4" />
						Timer Controls
					</h3>
					<div class="space-y-3">
						<div class="flex items-center justify-between">
							<span class="text-sm text-labels">Live Context</span>
							<Badge variant="selected_for_event">{liveContext?.current_mode || 'idle'}</Badge>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-sm text-labels">Time remaining</span>
							<span class="font-mono font-semibold {timerSeconds <= 60 && timerSeconds > 0 ? 'text-alert animate-pulse' : timerSeconds <= 150 ? 'text-warning' : 'text-headers'}">
								{displayTime}
							</span>
						</div>
						{#if liveContext?.current_mode !== 'idle' && liveContext?.timer_ends_at}
							<Button variant="outline" size="sm" fullWidth onclick={extendTimer}>
								+5 minutes
							</Button>
						{/if}
					</div>
				</Card>
			</aside>
		</div>
	</div>
</PageContainer>

<!-- Timer Configuration Modal (Ch.12.5) -->
{#if timerModalOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center">
		<!-- Backdrop -->
		<button
			type="button"
			class="absolute inset-0 bg-black/50"
			onclick={cancelTimerModal}
			aria-label="Close dialog"
		></button>

		<!-- Dialog -->
		<Card elevation="floating" padding="lg" class="relative z-10 w-full max-w-md mx-4">
			<h3 class="text-lg font-semibold text-headers mb-4">
				{timerModalDecisionType === 'opened_for_pitch_assessment' ? 'Open Pitch Assessment' : 'Open Review Assessment'}
			</h3>

			<div class="space-y-4">
				<!-- Problem display -->
				<div>
					<span class="text-sm text-labels">Problem</span>
					<p class="font-medium text-headers">{selectedProblem?.title}</p>
				</div>

				<!-- Duration selector -->
				<div>
					<label for="timer-duration" class="text-sm font-medium text-headers block mb-2">Duration</label>
					<select
						id="timer-duration"
						class="w-full px-4 py-2 rounded-lg border border-secondary bg-card text-headers focus:border-primary focus:ring-2 focus:ring-primary/20"
						bind:value={timerDurationMinutes}
						disabled={timerNoLimit}
					>
						{#each DURATION_OPTIONS as opt (opt.value)}
							<option value={opt.value}>{opt.label}</option>
						{/each}
					</select>
				</div>

				<!-- No time limit checkbox -->
				<label class="flex items-center gap-3 cursor-pointer">
					<input
						type="checkbox"
						class="w-5 h-5 accent-primary"
						bind:checked={timerNoLimit}
					/>
					<span class="text-sm text-headers">No time limit</span>
				</label>
			</div>

			<!-- Actions -->
			<div class="flex gap-3 mt-6 justify-end">
				<Button variant="secondary" onclick={cancelTimerModal} disabled={decisionLoading}>
					Cancel
				</Button>
				<Button variant="default" onclick={confirmTimerModal} disabled={decisionLoading}>
					{#if decisionLoading}
						Opening...
					{:else}
						{timerModalDecisionType === 'opened_for_pitch_assessment' ? 'Open Pitch' : 'Open Review'}
					{/if}
				</Button>
			</div>
		</Card>
	</div>
{/if}
