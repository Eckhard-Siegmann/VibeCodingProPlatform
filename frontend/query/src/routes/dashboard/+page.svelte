<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import PageContainer from '$lib/components/layout/PageContainer.svelte';
	import { Card, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge, type BadgeVariant } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { EventGrid, type EventCardData } from '$lib/components/events';
	import {
		LiveBanner,
		CurrentActivity,
		ActivityFeed,
		PersonalContributions,
		type LiveEventData,
		type OpenAssessment,
		type ActivityItem
	} from '$lib/components/dashboard';
	import { FileText, Calendar, Star, ArrowRight, Plus } from '@lucide/svelte';
	import { toastInfo, toastSuccess, toastWarning } from '$lib/stores/toast';
	import { audioStore } from '$lib/stores/audio';
	import { detectPhaseTransition, TimerAudioTracker, type LiveContextSnapshot } from '$lib/utils/event-notifications';
	import { createVisibilityAwareInterval } from '$lib/utils/visibility';

	let { data } = $props();

	// Initialize audio preferences on mount
	$effect(() => { audioStore.loadPreference(); });

	// Phase transition notification state (Ch.14.5.2, ADR 008)
	let lastSnapshot = $state<LiveContextSnapshot>({
		currentMode: data.liveEvent?.currentMode || 'idle',
		currentProblemTitle: data.liveEvent?.currentProblemTitle || null,
		timerEndsAt: data.liveEvent?.timerEndsAt || null
	});

	// Timer audio tracker (Ch.14.5.1) — fires at 60s and 0s thresholds
	const timerTracker = new TimerAudioTracker();

	// Polling with Page Visibility awareness (ADR 008)
	$effect(() => {
		const pollEventId = data.liveEvent?.eventId || (data.myEvents.length > 0 ? data.myEvents[0].id : null);
		if (!pollEventId) return;

		async function pollLiveContext() {
			try {
				const res = await fetch(`/api/events/${pollEventId}/live-context`);
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
					const { toast, info, success, warning } = { toast: notification.toast, info: toastInfo, success: toastSuccess, warning: toastWarning };
					if (toast.variant === 'success') toastSuccess(toast.title, toast.message);
					else if (toast.variant === 'warning') toastWarning(toast.title, toast.message);
					else toastInfo(toast.title, toast.message);

					if (notification.audio === 'phaseChange') audioStore.playPhaseChange();
				}

				lastSnapshot = newSnapshot;

				if (newMode !== (data.liveEvent?.currentMode || 'idle')) {
					invalidateAll();
				}
			} catch {
				// Silently ignore polling failures
			}
		}

		const cleanup = createVisibilityAwareInterval(pollLiveContext, 5000, pollLiveContext);
		return cleanup;
	});

	// Real-time countdown ticker for live banner + timer audio cues
	let countdownTick = $state(0);
	$effect(() => {
		if (!data.liveEvent?.timerEndsAt) return;
		const interval = setInterval(() => {
			countdownTick = Date.now();

			// Timer audio cues (Ch.14.5.1): warning at 60s, expired at 0s
			if (data.liveEvent?.timerEndsAt) {
				const diff = new Date(data.liveEvent.timerEndsAt).getTime() - Date.now();
				const seconds = Math.max(0, Math.floor(diff / 1000));
				const audioAction = timerTracker.check(data.liveEvent.timerEndsAt, seconds);
				if (audioAction === 'timerWarning') {
					audioStore.playTimerWarning();
					toastWarning('1 minute remaining', 'Timer expires soon');
				} else if (audioAction === 'timerExpired') {
					audioStore.playTimerExpired();
					toastInfo('Time is up', 'The timer has expired');
				}
			}
		}, 1000);
		return () => clearInterval(interval);
	});

	// Map server live event to LiveBanner component shape
	const liveEvent: LiveEventData | null = $derived.by(() => {
		if (!data.liveEvent) return null;
		const le = data.liveEvent;
		const phaseMap: Record<string, LiveEventData['currentPhase']> = {
			pitch: 'pitching',
			review: 'review'
		};
		// Calculate countdown seconds from timer_ends_at (reactive via countdownTick)
		let countdownSeconds: number | undefined;
		if (le.timerEndsAt) {
			const _tick = countdownTick; // subscribe to ticks
			const diff = new Date(le.timerEndsAt).getTime() - Date.now();
			countdownSeconds = diff > 0 ? Math.floor(diff / 1000) : undefined;
		}
		return {
			eventId: le.eventId,
			eventTitle: le.eventTitle,
			currentPhase: phaseMap[le.currentMode] ?? 'pre_event',
			currentProblemTitle: le.currentProblemTitle ?? undefined,
			currentProblemSlug: le.currentProblemSlug ?? undefined,
			countdownSeconds
		};
	});

	// Map server open assessment to CurrentActivity component shape
	const openAssessment: OpenAssessment | null = $derived.by(() => {
		if (!data.openAssessment) return null;
		const oa = data.openAssessment;
		return {
			assessmentId: oa.assessmentId,
			type: oa.type,
			problemTitle: oa.problemTitle,
			problemSlug: oa.problemSlug,
			description: oa.description,
			closesAt: oa.closesAt ?? undefined,
			userCompleted: oa.userCompleted
		};
	});

	// Map server events to EventCardData shape
	const myEvents: EventCardData[] = $derived(
		data.myEvents.map((e) => ({
			id: e.id,
			slug: e.slug,
			title: e.title,
			startsAt: e.startsAt,
			plannedEndsAt: e.plannedEndsAt,
			location: { name: e.locationName, city: e.locationCity },
			partner: { name: e.partnerName },
			capacity: e.capacity,
			registeredCount: e.registeredCount
		}))
	);

	// Map decision types to ActivityType for the feed component
	const decisionTypeToActivity: Record<string, ActivityItem['type']> = {
		problem_submitted: 'problem_submitted',
		problem_accepted: 'problem_accepted',
		problem_rejected: 'problem_rejected',
		problem_created: 'problem_submitted',
		problem_updated: 'decision_made',
		selected_for_event: 'decision_made',
		selected_for_coding: 'decision_made',
		opened_for_pitch_assessment: 'decision_made',
		closed_for_pitch_assessment: 'decision_made',
		opened_for_review: 'decision_made',
		closed_for_review: 'decision_made',
		problem_needs_changes: 'decision_made',
		problem_cloned: 'decision_made'
	};

	const recentActivity: ActivityItem[] = $derived(
		data.recentActivity.items.map((a) => ({
			id: a.id,
			type: decisionTypeToActivity[a.type] ?? 'decision_made',
			title: a.title,
			description: a.description ?? undefined,
			actor: { id: a.actorId, displayName: a.actorDisplayName },
			problemTitle: a.problemTitle ?? undefined,
			problemSlug: a.problemSlug ?? undefined,
			href: a.problemSlug ? `/problem/${a.problemSlug}` : undefined,
			timestamp: a.timestamp
		}))
	);

	const recentActivityTotalCount = $derived(data.recentActivity.totalCount);
</script>

<svelte:head>
	<title>Dashboard - VibeCoding</title>
</svelte:head>

<!-- Live Banner (sticky on mobile) -->
{#if liveEvent}
	<LiveBanner event={liveEvent} ratingHref={openAssessment ? `/assess/${openAssessment.assessmentId}` : undefined} />
{/if}

<PageContainer>
	<!-- Welcome Header -->
	<header class="mb-8">
		<h1 class="text-2xl md:text-3xl font-bold text-headers mb-2">
			Welcome back, {data.user.display_name}!
		</h1>
		<div class="flex flex-wrap gap-4 text-sm text-labels">
			<span class="inline-flex items-center gap-1.5">
				<Calendar class="w-4 h-4" />
				{data.stats.eventsAttended} events attended
			</span>
			<span class="inline-flex items-center gap-1.5">
				<FileText class="w-4 h-4" />
				{data.stats.problemsCreated} problems created
			</span>
			<span class="inline-flex items-center gap-1.5">
				<Star class="w-4 h-4 text-amber-500" />
				{data.stats.points} points, {data.stats.stars} stars
			</span>
		</div>
	</header>

	<!-- Mobile-first priority layout per Ch.12.4 -->
	<div class="space-y-8">
		<!-- Current Activity (most prominent during live event) -->
		<section>
			<h2 class="text-lg font-semibold text-headers mb-3">Current Activity</h2>
			<CurrentActivity assessment={openAssessment} />
		</section>

		<!-- Two-column layout on desktop -->
		<div class="grid gap-8 lg:grid-cols-[1fr_360px]">
			<!-- Main Column -->
			<div class="space-y-8">
				<!-- My Problems (bounded: max 5, total count in header) -->
				<section>
					<div class="flex items-center justify-between mb-4">
						<h2 class="text-lg font-semibold text-headers">
							My Problems
							{#if data.myProblemsTotal > 0}
								<span class="text-sm font-normal text-labels">({data.myProblemsTotal} total)</span>
							{/if}
						</h2>
					</div>

					{#if data.myProblems.length === 0}
						<Card elevation="resting" padding="lg" class="text-center">
							<p class="text-labels mb-4">You haven't created any problems yet.</p>
							<a href="/problem/new">
								<Button variant="default">Create Your First Problem</Button>
							</a>
						</Card>
					{:else}
						<div class="space-y-3">
							{#each data.myProblems as problem (problem.id)}
								<Card elevation="resting" padding="md">
									<div class="flex items-center justify-between gap-4">
										<div class="min-w-0 flex-1">
											<h3 class="font-semibold text-headers truncate">{problem.title}</h3>
											<div class="flex gap-2 mt-1">
												<Badge variant={problem.readinessState as BadgeVariant}>
													{problem.readinessState.replace('_', ' ')}
												</Badge>
												<Badge variant={problem.actionState as BadgeVariant}>
													{problem.actionState.replace(/_/g, ' ')}
												</Badge>
											</div>
										</div>
										<a href={`/problem/${problem.slug}`}>
											<Button variant="ghost" size="sm">
												Edit
												<ArrowRight class="w-4 h-4 ml-1" />
											</Button>
										</a>
									</div>
								</Card>
							{/each}
						</div>

						{#if data.myProblemsTotal > 5}
							<a href="/problems?owner=me" class="inline-block mt-3 text-sm text-primary hover:text-primary-hover">
								View All {data.myProblemsTotal} Problems &rarr;
							</a>
						{/if}
					{/if}

					<div class="mt-3">
						<a href="/problem/new">
							<Button variant="outline" size="sm">
								<Plus class="w-4 h-4 mr-1" />
								Create New Problem &rarr;
							</Button>
						</a>
					</div>
				</section>

				<!-- My Events (bounded: max 4, 2 upcoming + 2 recent past) -->
				<section>
					<h2 class="text-lg font-semibold text-headers mb-4">My Events</h2>
					{#if myEvents.length === 0}
						<Card elevation="resting" padding="lg" class="text-center">
							<p class="text-labels mb-4">You're not registered for any events yet.</p>
							<a href="/events">
								<Button variant="default">Browse Events</Button>
							</a>
						</Card>
					{:else}
						<EventGrid events={myEvents} variant="compact" columns={1} />
					{/if}

					<a href="/events" class="inline-block mt-3 text-sm text-primary hover:text-primary-hover">
						Browse All Events &rarr;
					</a>
				</section>
			</div>

			<!-- Sidebar -->
			<aside class="space-y-6 lg:sticky lg:top-4 lg:self-start">
				<!-- Activity Feed (Load More append pagination, Ch.12.10) -->
				<ActivityFeed
					activities={recentActivity}
					totalCount={recentActivityTotalCount}
					loadMoreUrl="/api/dashboard/activity"
					maxTotal={50}
					title="Recent Activity"
				/>

				<!-- Personal Contributions (Ch.33.6.7) -->
				<PersonalContributions data={data.personalContributions} />
			</aside>
		</div>
	</div>
</PageContainer>
