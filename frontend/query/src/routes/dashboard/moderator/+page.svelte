<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import PageContainer from '$lib/components/layout/PageContainer.svelte';
	import { Card, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import BackButton from '$lib/components/ui/back-button/back-button.svelte';
	import {
		LiveBanner,
		CurrentActivity,
		ActivityFeed,
		DecisionAccordion,
		type LiveEventData,
		type OpenAssessment,
		type ActivityItem
	} from '$lib/components/dashboard';
	import { toastSuccess, toastInfo, toastError } from '$lib/stores/toast';
	import {
		FileText,
		Users,
		ArrowRight,
		Clock,
		CheckCircle,
		AlertTriangle,
		Settings,
		ChevronUp,
		ChevronDown
	} from '@lucide/svelte';

	let { data } = $props();

	// Derived from Server Load
	const { eventId, queue, liveContext, backlogProblems, recentDecisions } = $derived(data);

	// Transform liveContext into LiveEventData format
	const liveEvent = $derived<LiveEventData>({
		eventId: eventId,
		eventTitle: 'Demo Event 2026', // MVP
		currentPhase: (liveContext?.current_mode === 'idle' ? 'upcoming' : liveContext?.current_mode === 'pitch' ? 'pitching' : 'reviewing') as any,
		currentProblemTitle: liveContext?.problem_title || 'No active problem',
		currentProblemSlug: liveContext?.problem_slug || '',
		participantsOnline: 24, // Mock
		countdownSeconds: liveContext?.timer_ends_at ? Math.max(0, Math.floor((new Date(liveContext.timer_ends_at).getTime() - Date.now()) / 1000)) : 0,
		statusMessage: liveContext?.current_mode === 'idle' ? 'Waiting for moderator to start' : 'Live'
	});

	// Transform liveContext into OpenAssessment format if active
	const openAssessment = $derived<OpenAssessment | undefined>(
		liveContext?.current_mode !== 'idle' && liveContext?.current_problem_id
			? {
					assessmentId: liveContext.current_mode === 'pitch' ? 'pitch-dummy' : 'review-dummy',
					type: liveContext.current_mode === 'pitch' ? 'pitch' : 'review',
					problemTitle: liveContext.problem_title || '',
					problemSlug: liveContext.problem_slug || '',
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

	// Registrations (Mocked for MVP)
	const registrationStats = {
		total: 28,
		inPresence: 22,
		remote: 6,
		checkedIn: 18
	};

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

	// Actions
	async function handleDecision(decisionType: string, rationale?: string) {
		if (!selectedProblemId) return;

		try {
			const res = await fetch(`/api/events/${eventId}/decisions`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					problem_id: selectedProblemId,
					decision_type: decisionType,
					rationale,
					timer_duration_minutes: decisionType.includes('opened') ? 5 : undefined
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
	
	// Timer update logic
	let displayTime = $state('0:00');
	
	$effect(() => {
		const interval = setInterval(() => {
			if (liveContext?.timer_ends_at) {
				const seconds = Math.max(0, Math.floor((new Date(liveContext.timer_ends_at).getTime() - Date.now()) / 1000));
				displayTime = `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
			} else {
				displayTime = '0:00';
			}
		}, 1000);
		
		return () => clearInterval(interval);
	});
</script>

<svelte:head>
	<title>Moderator Dashboard - VibeCoding</title>
</svelte:head>

<!-- Live Banner (sticky) -->
<LiveBanner
	event={liveEvent}
	ratingHref={openAssessment ? `/assess/${openAssessment.assessmentId}` : undefined}
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
		<!-- Current Activity Section -->
		<section>
			<h2 class="text-lg font-semibold text-headers mb-3">Current Activity</h2>
			{#if openAssessment}
				<CurrentActivity assessment={openAssessment} />
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
					<h2 class="text-lg font-semibold text-headers mb-3">
						Event Queue ({(queue || []).length})
					</h2>
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

				<!-- Backlog Preview -->
				<section>
					<div class="flex items-center justify-between mb-3">
						<h2 class="text-lg font-semibold text-headers flex items-center gap-2">
							<AlertTriangle class="w-5 h-5 text-warning" />
							Pending Backlog ({backlogProblems?.length || 0})
						</h2>
					</div>
					{#if backlogProblems?.length > 0}
						<Card elevation="resting" padding="none">
							<ul class="divide-y divide-secondary">
								{#each backlogProblems as problem (problem.problem_id)}
									<li class="p-4 hover:bg-canvas/50 transition-colors">
										<div class="flex items-center justify-between gap-4">
											<div class="min-w-0 flex-1">
												<h3 class="font-medium text-headers truncate">{problem.title}</h3>
												<p class="text-sm text-labels">by {problem.owner_display_name}</p>
											</div>
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
					{:else}
						<Card padding="md" class="text-center text-meta">No problems pending review.</Card>
					{/if}
				</section>

				<!-- Attendance Tracking -->
				<section>
					<h2 class="text-lg font-semibold text-headers mb-3">Attendance</h2>
					<Card elevation="resting" padding="md">
						<div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
							<div>
								<p class="text-2xl font-bold text-headers">{registrationStats.total}</p>
								<p class="text-sm text-labels">Registered</p>
							</div>
							<div>
								<p class="text-2xl font-bold text-headers">{registrationStats.inPresence}</p>
								<p class="text-sm text-labels">In-Presence</p>
							</div>
							<div>
								<p class="text-2xl font-bold text-headers">{registrationStats.remote}</p>
								<p class="text-sm text-labels">Remote</p>
							</div>
							<div>
								<p class="text-2xl font-bold text-success">{registrationStats.checkedIn}</p>
								<p class="text-sm text-labels">Checked In</p>
							</div>
						</div>
						<div class="mt-4 flex justify-center">
							<Button variant="outline">
								<CheckCircle class="w-4 h-4 mr-1" />
								Mark Attendance
							</Button>
						</div>
					</Card>
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
					title="Recent Decisions"
					maxItems={5}
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
							<span class="font-mono font-semibold text-warning">
								{displayTime}
							</span>
						</div>
					</div>
				</Card>
			</aside>
		</div>
	</div>
</PageContainer>
