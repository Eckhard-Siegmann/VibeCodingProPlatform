<script lang="ts">
	import PageContainer from '$lib/components/layout/PageContainer.svelte';
	import { Card, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import BackButton from '$lib/components/ui/back-button/back-button.svelte';
	import { EventHeader, type EventHeaderData } from '$lib/components/events';
	import { RegistrationSection, type EventData, type UserRegistration } from '$lib/components/registration';
	import { toastSuccess, toastError } from '$lib/stores/toast';
	import { FileText, ArrowRight } from '@lucide/svelte';

	interface Props {
		data: { slug: string };
	}

	let { data }: Props = $props();

	// Derive slug from data
	const eventSlug = $derived(data.slug ?? 'cologne-march-2026');

	// Demo event data - in production this would come from +page.server.ts
	const eventData: EventHeaderData = $derived({
		id: 'evt-1',
		slug: eventSlug,
		title: 'VibeCoding Professionals - Cologne March 2026',
		description: `Join us for another exciting VibeCoding event!

This month we'll explore AI-assisted development with real coding challenges from the community. Whether you're a seasoned developer or just curious about AI tools, there's something for everyone.

**Agenda:**
- 18:00 - Welcome & Introductions
- 18:15 - Problem Pitches (3-4 problems presented)
- 18:45 - Voting & Problem Selection
- 19:00 - Coding Sprint (90 minutes)
- 20:30 - Solution Reviews & Ratings
- 21:00 - Lessons Learned & Wrap-up

**What to bring:**
- Laptop with your favorite IDE
- Curiosity and willingness to experiment
- Optionally: A problem you'd like to submit`,
		startsAt: '2026-03-15T18:00:00',
		plannedEndsAt: '2026-03-15T21:00:00',
		location: {
			name: 'STARTPLATZ Koeln',
			city: 'Cologne',
			address: 'Im Mediapark 5'
		},
		room: {
			name: 'Workshop Room A'
		},
		partner: {
			name: 'STARTPLATZ',
			logoUrl: undefined
		},
		host: {
			id: 'user-host',
			displayName: 'Michael Moderator'
		},
		coHost1: {
			id: 'user-cohost',
			displayName: 'Sandra Support'
		},
		websiteUrl: 'https://www.startplatz.de',
		linkedinUrl: 'https://linkedin.com/events/123',
		isPast: false,
		isLive: false
	});

	// Event data for registration section
	const registrationEvent: EventData = {
		id: eventData.id,
		title: eventData.title,
		capacity: 30,
		registeredCount: 18,
		waitlistCount: 0
	};

	// Demo user registration state - null means not registered
	let userRegistration = $state<UserRegistration | null>(null);
	let isAuthenticated = $state(true); // For demo purposes

	// Demo problems selected for this event
	const eventProblems = [
		{
			id: 'prob-1',
			slug: '11',
			title: 'RAG Retrieval Quality Evaluation',
			ownerName: 'Max Mustermann',
			readinessState: 'ready' as const,
			actionState: 'selected_for_event' as const
		},
		{
			id: 'prob-2',
			slug: '22',
			title: 'Code Evaluation Agent',
			ownerName: 'Eva Schmidt',
			readinessState: 'ready' as const,
			actionState: 'selected_for_event' as const
		},
		{
			id: 'prob-3',
			slug: '33',
			title: 'DSPy Skill Optimization',
			ownerName: 'Lisa Chen',
			readinessState: 'ready' as const,
			actionState: 'selected_for_event' as const
		}
	];

	function handleRegister(data: { attendanceMode: 'in_presence' | 'remote'; newsletter: boolean }) {
		// Simulate registration
		userRegistration = {
			id: 'reg-' + Date.now(),
			attendanceMode: data.attendanceMode,
			waitlistStatus: registrationEvent.registeredCount >= registrationEvent.capacity ? 'waitlisted' : null,
			waitlistPosition: registrationEvent.registeredCount >= registrationEvent.capacity ? 3 : undefined
		};
		toastSuccess(
			'Registration successful!',
			userRegistration.waitlistStatus ? "You're on the waitlist" : "You're confirmed for the event"
		);
	}

	function handleUnregister() {
		userRegistration = null;
		toastSuccess('Registration cancelled', 'You have been unregistered from the event');
	}
</script>

<svelte:head>
	<title>{eventData.title} - VibeCoding</title>
</svelte:head>

<PageContainer>
	<!-- Back navigation -->
	<BackButton label="Back to Events" href="/" class="mb-4" />

	<div class="grid gap-8 lg:grid-cols-[1fr_360px]">
		<!-- Main Content -->
		<div class="space-y-8">
			<EventHeader event={eventData} />

			<!-- Problems Section -->
			{#if eventProblems.length > 0}
				<section>
					<h2 class="text-xl font-semibold text-headers mb-4">
						Problems for This Event ({eventProblems.length})
					</h2>
					<div class="space-y-3">
						{#each eventProblems as problem (problem.id)}
							<Card elevation="resting" padding="md">
								<div class="flex items-start gap-4">
									<div class="p-2 rounded-lg bg-primary/10 flex-shrink-0">
										<FileText class="w-5 h-5 text-primary" />
									</div>
									<div class="flex-1 min-w-0">
										<div class="flex items-start justify-between gap-2">
											<div class="min-w-0">
												<h3 class="font-semibold text-headers truncate">{problem.title}</h3>
												<p class="text-sm text-labels">by {problem.ownerName}</p>
											</div>
											<div class="flex gap-2 flex-shrink-0">
												<Badge variant={problem.readinessState}>
													{problem.readinessState.replace('_', ' ')}
												</Badge>
											</div>
										</div>
									</div>
									<a href={`/problem/${problem.slug}`} class="flex-shrink-0">
										<Button variant="ghost" size="sm">
											View
											<ArrowRight class="w-4 h-4 ml-1" />
										</Button>
									</a>
								</div>
							</Card>
						{/each}
					</div>
				</section>
			{/if}
		</div>

		<!-- Sidebar - Registration -->
		<aside class="lg:sticky lg:top-4 lg:self-start">
			<RegistrationSection
				event={registrationEvent}
				{userRegistration}
				{isAuthenticated}
				onRegister={handleRegister}
				onUnregister={handleUnregister}
			/>
		</aside>
	</div>
</PageContainer>
