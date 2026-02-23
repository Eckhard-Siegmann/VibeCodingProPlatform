<script lang="ts">
	import PageContainer from '$lib/components/layout/PageContainer.svelte';
	import { Card, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { EventGrid, type EventCardData } from '$lib/components/events';
	import {
		LiveBanner,
		CurrentActivity,
		ActivityFeed,
		type LiveEventData,
		type OpenAssessment,
		type ActivityItem
	} from '$lib/components/dashboard';
	import { FileText, Calendar, Star, ArrowRight, Plus } from '@lucide/svelte';

	// Demo: Check if there's a live event (for demo, toggle this)
	const isLiveEvent = true;

	const liveEvent: LiveEventData | null = isLiveEvent
		? {
				eventId: 'evt-1',
				eventTitle: 'VibeCoding Cologne - March 2026',
				currentPhase: 'pitching',
				currentProblemTitle: 'RAG Retrieval Quality',
				currentProblemSlug: '11',
				participantsOnline: 24,
				countdownSeconds: 185
			}
		: null;

	const openAssessment: OpenAssessment | null = isLiveEvent
		? {
				assessmentId: 'pitch-11',
				type: 'pitch',
				problemTitle: 'RAG Retrieval Quality Evaluation',
				problemSlug: '11',
				description: 'Evaluate retrieval quality in RAG systems',
				closesAt: new Date(Date.now() + 185 * 1000),
				userCompleted: false
			}
		: null;

	// Demo user stats
	const userStats = {
		eventsAttended: 4,
		problemsCreated: 2,
		assessmentsCompleted: 18,
		points: 24,
		stars: 2
	};

	// Demo my events
	const myEvents: EventCardData[] = [
		{
			id: 'evt-1',
			slug: 'cologne-march-2026',
			title: 'VibeCoding Professionals - Cologne',
			startsAt: '2026-03-15T18:00:00',
			location: { name: 'STARTPLATZ', city: 'Cologne' },
			partner: { name: 'STARTPLATZ' },
			capacity: 30,
			registeredCount: 18
		}
	];

	// Demo my problems
	const myProblems = [
		{
			id: 'prob-1',
			slug: '111',
			title: 'RAG Retrieval Quality Evaluation',
			readinessState: 'ready' as const,
			actionState: 'selected_for_event' as const
		},
		{
			id: 'prob-2',
			slug: '222',
			title: 'Code Review Automation',
			readinessState: 'draft' as const,
			actionState: 'backlog' as const
		}
	];

	// Demo activity feed
	const recentActivity: ActivityItem[] = [
		{
			id: 'act-1',
			type: 'problem_accepted',
			title: 'accepted your problem',
			actor: { id: 'mod-1', displayName: 'Michael Moderator' },
			problemTitle: 'RAG Retrieval Quality',
			timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
			href: '/problem/111'
		},
		{
			id: 'act-2',
			type: 'team_joined',
			title: 'joined your team',
			actor: { id: 'user-2', displayName: 'Eva Schmidt' },
			problemTitle: 'RAG Retrieval Quality',
			timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000)
		},
		{
			id: 'act-3',
			type: 'chat_message',
			title: 'commented on your problem',
			description: 'Great idea! Have you considered using a hybrid approach?',
			actor: { id: 'user-3', displayName: 'Lisa Chen' },
			problemTitle: 'Code Review Automation',
			timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000)
		}
	];
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
			Welcome back, Demo User!
		</h1>
		<div class="flex flex-wrap gap-4 text-sm text-labels">
			<span class="inline-flex items-center gap-1.5">
				<Calendar class="w-4 h-4" />
				{userStats.eventsAttended} events attended
			</span>
			<span class="inline-flex items-center gap-1.5">
				<FileText class="w-4 h-4" />
				{userStats.problemsCreated} problems created
			</span>
			<span class="inline-flex items-center gap-1.5">
				<Star class="w-4 h-4 text-amber-500" />
				{userStats.points} points, {userStats.stars} stars
			</span>
		</div>
	</header>

	<!-- Mobile-first priority layout per Ch.12.4 -->
	<div class="space-y-8">
		<!-- Current Activity (most prominent during live event) -->
		{#if openAssessment}
			<section>
				<h2 class="text-lg font-semibold text-headers mb-3">Current Activity</h2>
				<CurrentActivity assessment={openAssessment} />
			</section>
		{/if}

		<!-- Two-column layout on desktop -->
		<div class="grid gap-8 lg:grid-cols-[1fr_360px]">
			<!-- Main Column -->
			<div class="space-y-8">
				<!-- My Problems -->
				<section>
					<div class="flex items-center justify-between mb-4">
						<h2 class="text-lg font-semibold text-headers">My Problems</h2>
						<a href="/problem/new">
							<Button variant="outline" size="sm">
								<Plus class="w-4 h-4 mr-1" />
								New Problem
							</Button>
						</a>
					</div>

					{#if myProblems.length === 0}
						<Card elevation="resting" padding="lg" class="text-center">
							<p class="text-labels mb-4">You haven't created any problems yet.</p>
							<a href="/problem/new">
								<Button variant="default">Create Your First Problem</Button>
							</a>
						</Card>
					{:else}
						<div class="space-y-3">
							{#each myProblems as problem (problem.id)}
								<Card elevation="resting" padding="md">
									<div class="flex items-center justify-between gap-4">
										<div class="min-w-0 flex-1">
											<h3 class="font-semibold text-headers truncate">{problem.title}</h3>
											<div class="flex gap-2 mt-1">
												<Badge variant={problem.readinessState}>
													{problem.readinessState.replace('_', ' ')}
												</Badge>
												<Badge variant={problem.actionState}>
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
					{/if}
				</section>

				<!-- My Events -->
				<section>
					<h2 class="text-lg font-semibold text-headers mb-4">My Upcoming Events</h2>
					{#if myEvents.length === 0}
						<Card elevation="resting" padding="lg" class="text-center">
							<p class="text-labels mb-4">You're not registered for any upcoming events.</p>
							<a href="/">
								<Button variant="default">Browse Events</Button>
							</a>
						</Card>
					{:else}
						<EventGrid events={myEvents} variant="compact" columns={1} />
					{/if}
				</section>

				<!-- Upcoming Events (browse more) -->
				<section>
					<div class="flex items-center justify-between mb-4">
						<h2 class="text-lg font-semibold text-headers">More Events</h2>
						<a href="/" class="text-sm text-primary hover:underline">View all</a>
					</div>
					<EventGrid
						events={[
							{
								id: 'evt-2',
								slug: 'aachen-april-2026',
								title: 'VibeCoding Professionals - Aachen',
								startsAt: '2026-04-10T18:00:00',
								location: { name: 'Digital Hub', city: 'Aachen' },
								partner: { name: 'Digital Hub' },
								capacity: 25,
								registeredCount: 12
							}
						]}
						variant="compact"
						columns={1}
					/>
				</section>
			</div>

			<!-- Sidebar -->
			<aside class="space-y-6 lg:sticky lg:top-4 lg:self-start">
				<!-- Activity Feed -->
				<ActivityFeed
					activities={recentActivity}
					title="Recent Activity"
					maxItems={5}
				/>

				<!-- Quick Stats Card -->
				<Card elevation="resting" padding="md">
					<h3 class="font-semibold text-headers mb-3">Your Progress</h3>
					<div class="space-y-3">
						<div class="flex justify-between text-sm">
							<span class="text-labels">Assessments completed</span>
							<span class="font-medium text-headers">{userStats.assessmentsCompleted}</span>
						</div>
						<div class="flex justify-between text-sm">
							<span class="text-labels">Total points</span>
							<span class="font-medium text-headers">{userStats.points}</span>
						</div>
						<div class="flex justify-between text-sm">
							<span class="text-labels">Stars earned</span>
							<span class="font-medium text-headers">
								{#each Array(userStats.stars) as _}
									<span class="text-amber-500">*</span>
								{/each}
								{#if userStats.stars === 0}
									<span class="text-meta">None yet</span>
								{/if}
							</span>
						</div>
					</div>
				</Card>
			</aside>
		</div>
	</div>
</PageContainer>
