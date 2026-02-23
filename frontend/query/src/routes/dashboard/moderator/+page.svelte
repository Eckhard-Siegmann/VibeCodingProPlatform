<script lang="ts">
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
	import { toastSuccess, toastInfo } from '$lib/stores/toast';
	import {
		FileText,
		Users,
		ArrowRight,
		Clock,
		CheckCircle,
		AlertTriangle,
		Settings
	} from '@lucide/svelte';

	// Demo: Live event context
	const liveEvent: LiveEventData = {
		eventId: 'evt-1',
		eventTitle: 'VibeCoding Cologne - March 2026',
		currentPhase: 'pitching',
		currentProblemTitle: 'RAG Retrieval Quality',
		currentProblemSlug: '11',
		participantsOnline: 24,
		countdownSeconds: 185,
		statusMessage: 'Waiting for votes on current problem'
	};

	const openAssessment: OpenAssessment = {
		assessmentId: 'pitch-11',
		type: 'pitch',
		problemTitle: 'RAG Retrieval Quality Evaluation',
		problemSlug: '11',
		description: 'Evaluate retrieval quality in RAG systems',
		closesAt: new Date(Date.now() + 185 * 1000)
	};

	// Demo problems for this event
	let eventProblems = $state([
		{
			id: 'prob-1',
			slug: '11',
			title: 'RAG Retrieval Quality Evaluation',
			ownerName: 'Max Mustermann',
			readinessState: 'ready' as const,
			actionState: 'selected_for_event' as const,
			votesCount: 18,
			teamSize: 0
		},
		{
			id: 'prob-2',
			slug: '22',
			title: 'Code Evaluation Agent',
			ownerName: 'Eva Schmidt',
			readinessState: 'ready' as const,
			actionState: 'selected_for_event' as const,
			votesCount: 12,
			teamSize: 0
		},
		{
			id: 'prob-3',
			slug: '33',
			title: 'DSPy Skill Optimization',
			ownerName: 'Lisa Chen',
			readinessState: 'ready' as const,
			actionState: 'selected_for_event' as const,
			votesCount: 8,
			teamSize: 0
		}
	]);

	// Demo backlog problems (submitted, pending review)
	const backlogProblems = [
		{
			id: 'prob-new-1',
			slug: '44',
			title: 'WebSocket Connection Manager',
			ownerName: 'Tom Weber',
			readinessState: 'submitted' as const,
			submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
		},
		{
			id: 'prob-new-2',
			slug: '55',
			title: 'API Rate Limiter Implementation',
			ownerName: 'Anna Mueller',
			readinessState: 'needs_changes' as const,
			submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
		}
	];

	// Demo activity feed
	const recentActivity: ActivityItem[] = [
		{
			id: 'act-1',
			type: 'decision_made',
			title: 'opened pitch assessment',
			actor: { id: 'mod-1', displayName: 'You' },
			problemTitle: 'RAG Retrieval Quality',
			timestamp: new Date(Date.now() - 5 * 60 * 1000)
		},
		{
			id: 'act-2',
			type: 'problem_submitted',
			title: 'submitted a new problem',
			actor: { id: 'user-4', displayName: 'Tom Weber' },
			problemTitle: 'WebSocket Connection Manager',
			timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
			href: '/problem/44'
		},
		{
			id: 'act-3',
			type: 'team_joined',
			title: 'joined the team',
			actor: { id: 'user-5', displayName: 'Anna Mueller' },
			problemTitle: 'Code Evaluation Agent',
			timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000)
		}
	];

	// Registrations
	const registrationStats = {
		total: 28,
		inPresence: 22,
		remote: 6,
		checkedIn: 18
	};

	// Selected problem for decisions
	let selectedProblemId = $state<string | null>(eventProblems[0]?.id ?? null);

	const selectedProblem = $derived(
		eventProblems.find((p) => p.id === selectedProblemId) ?? null
	);

	function handleDecision(decisionType: string) {
		toastSuccess(
			'Decision recorded',
			`${decisionType.replace(/_/g, ' ')} for ${selectedProblem?.title}`
		);
	}

	function selectProblem(problemId: string) {
		selectedProblemId = problemId;
		toastInfo('Problem selected', 'Use the decision accordion to take action');
	}
</script>

<svelte:head>
	<title>Moderator Dashboard - VibeCoding</title>
</svelte:head>

<!-- Live Banner (sticky) -->
<LiveBanner
	event={liveEvent}
	ratingHref={`/assess/${openAssessment.assessmentId}`}
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

	<!-- Mobile-first priority layout per Ch.12.4 -->
	<div class="space-y-6">
		<!-- Current Activity Section -->
		<section>
			<h2 class="text-lg font-semibold text-headers mb-3">Current Activity</h2>
			<CurrentActivity assessment={openAssessment} />
		</section>

		<!-- Main Grid -->
		<div class="grid gap-6 lg:grid-cols-[1fr_320px]">
			<!-- Left Column: Problems & Backlog -->
			<div class="space-y-6">
				<!-- Event Problems (with selection for decisions) -->
				<section>
					<h2 class="text-lg font-semibold text-headers mb-3">
						Event Problems ({eventProblems.length})
					</h2>
					<div class="space-y-3">
						{#each eventProblems as problem (problem.id)}
							<Card
								elevation={selectedProblemId === problem.id ? 'raised' : 'resting'}
								padding="md"
								class={selectedProblemId === problem.id
									? 'border-2 border-primary'
									: 'border border-transparent hover:border-secondary cursor-pointer'}
							>
								<button
									type="button"
									onclick={() => selectProblem(problem.id)}
									class="w-full text-left"
								>
									<div class="flex items-start gap-4">
										<div class="p-2 rounded-lg bg-primary/10 flex-shrink-0">
											<FileText class="w-5 h-5 text-primary" />
										</div>
										<div class="flex-1 min-w-0">
											<div class="flex items-start justify-between gap-2 flex-wrap">
												<div class="min-w-0">
													<h3 class="font-semibold text-headers truncate">{problem.title}</h3>
													<p class="text-sm text-labels">by {problem.ownerName}</p>
												</div>
												<div class="flex gap-2 flex-shrink-0">
													<Badge variant={problem.actionState}>
														{problem.actionState.replace(/_/g, ' ')}
													</Badge>
												</div>
											</div>
											<div class="flex gap-4 mt-2 text-sm text-labels">
												<span>{problem.votesCount} votes</span>
												<span>{problem.teamSize} team members</span>
											</div>
										</div>
									</div>
								</button>
							</Card>
						{/each}
					</div>
				</section>

				<!-- Backlog Preview -->
				<section>
					<div class="flex items-center justify-between mb-3">
						<h2 class="text-lg font-semibold text-headers flex items-center gap-2">
							<AlertTriangle class="w-5 h-5 text-warning" />
							Pending Review ({backlogProblems.length})
						</h2>
					</div>
					<Card elevation="resting" padding="none">
						<ul class="divide-y divide-secondary">
							{#each backlogProblems as problem (problem.id)}
								<li class="p-4 hover:bg-canvas/50 transition-colors">
									<div class="flex items-center justify-between gap-4">
										<div class="min-w-0 flex-1">
											<h3 class="font-medium text-headers truncate">{problem.title}</h3>
											<p class="text-sm text-labels">by {problem.ownerName}</p>
										</div>
										<Badge variant={problem.readinessState}>
											{problem.readinessState.replace('_', ' ')}
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
				<!-- Decision Accordion (mobile-optimized per Ch.12.5) -->
				<Card elevation="resting" padding="md">
					<h3 class="font-semibold text-headers mb-3">Moderator Controls</h3>
					<DecisionAccordion
						problemId={selectedProblem?.id}
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
							<span class="text-sm text-labels">Current phase</span>
							<Badge variant="selected_for_event">{liveEvent.currentPhase}</Badge>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-sm text-labels">Time remaining</span>
							<span class="font-mono font-semibold text-warning">
								{Math.floor((liveEvent.countdownSeconds ?? 0) / 60)}:{((liveEvent.countdownSeconds ?? 0) % 60).toString().padStart(2, '0')}
							</span>
						</div>
						<div class="flex gap-2">
							<Button variant="secondary" size="sm" fullWidth>
								+1 min
							</Button>
							<Button variant="secondary" size="sm" fullWidth>
								+5 min
							</Button>
						</div>
						<Button variant="destructive" size="sm" fullWidth>
							End Phase Now
						</Button>
					</div>
				</Card>
			</aside>
		</div>
	</div>
</PageContainer>
