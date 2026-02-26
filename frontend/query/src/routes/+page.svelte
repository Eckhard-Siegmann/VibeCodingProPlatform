<script lang="ts">
	import PageContainer from '$lib/components/layout/PageContainer.svelte';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { EventGrid } from '$lib/components/events';
	import { ContributorWall } from '$lib/components/dashboard';
	import { ArrowRight, Zap, BookOpen, Code } from '@lucide/svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>VibeCoding Professionals - AI-Assisted Coding Events</title>
</svelte:head>

<PageContainer>
	<!-- Hero Section -->
	<section class="text-center py-12 md:py-16">
		<h1 class="text-3xl md:text-4xl lg:text-5xl font-bold text-headers mb-4">
			VibeCoding Professionals
		</h1>
		<p class="text-lg md:text-xl text-labels max-w-2xl mx-auto mb-8">
			A community of software professionals exploring AI-assisted coding.
			Bring your problems, build solutions, learn together.
		</p>
		<div class="flex flex-col sm:flex-row gap-4 justify-center">
			<a href="/register">
				<Button variant="default" size="lg">
					Join the Community
					<ArrowRight class="w-5 h-5 ml-2" />
				</Button>
			</a>
			<a href="/login">
				<Button variant="outline" size="lg">Sign In</Button>
			</a>
		</div>
	</section>

	<!-- Value Proposition -->
	<section class="py-8">
		<div class="grid md:grid-cols-3 gap-6">
			<Card elevation="resting" padding="lg" class="text-center">
				<div class="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
					<BookOpen class="w-6 h-6 text-primary" />
				</div>
				<h3 class="text-lg font-semibold text-headers mb-2">Submit Problems</h3>
				<p class="text-sm text-labels">
					Share real coding challenges from your work. Get feedback and structured evaluation.
				</p>
			</Card>

			<Card elevation="resting" padding="lg" class="text-center">
				<div class="w-12 h-12 mx-auto mb-4 rounded-full bg-success/10 flex items-center justify-center">
					<Code class="w-6 h-6 text-success" />
				</div>
				<h3 class="text-lg font-semibold text-headers mb-2">Code Together</h3>
				<p class="text-sm text-labels">
					Join teams, tackle problems with AI assistance, and compare approaches.
				</p>
			</Card>

			<Card elevation="resting" padding="lg" class="text-center">
				<div class="w-12 h-12 mx-auto mb-4 rounded-full bg-purple-bg flex items-center justify-center">
					<Zap class="w-6 h-6 text-purple" />
				</div>
				<h3 class="text-lg font-semibold text-headers mb-2">Learn & Grow</h3>
				<p class="text-sm text-labels">
					Rate solutions, capture lessons learned, and build expertise in AI-assisted development.
				</p>
			</Card>
		</div>
	</section>

	<!-- Upcoming Events -->
	<EventGrid
		events={data.upcomingEvents}
		title="Upcoming Events"
		emptyTitle="No upcoming events"
		emptyMessage="Check back soon for new events in Cologne and Aachen."
		columns={2}
		class="py-8"
	/>

	<!-- Past Events -->
	<EventGrid
		events={data.pastEvents}
		title="Past Events"
		emptyTitle="No past events yet"
		emptyMessage="Event history will appear here."
		variant="compact"
		columns={2}
		class="py-8"
	/>

	<!-- Contributor Wall -->
	{#if data.topContributors.length > 0}
		<div class="py-8">
			<ContributorWall contributors={data.topContributors} />
		</div>
	{/if}

	<!-- Demo Links (for development) -->
	<section class="py-8 border-t border-secondary">
		<h2 class="text-xl font-semibold text-headers mb-4">Demo Pages</h2>
		<div class="grid gap-4 max-w-2xl md:grid-cols-2">
			<Card elevation="resting">
				<h3 class="font-semibold text-headers mb-2">Problem Cards</h3>
				<p class="text-sm text-labels mb-4">View problem card variations</p>
				<div class="flex gap-2">
					<a href="/problem/11" class="flex-1">
						<Button variant="secondary" fullWidth>Public View</Button>
					</a>
					<a href="/problem/111" class="flex-1">
						<Button variant="default" fullWidth>Owner View</Button>
					</a>
				</div>
			</Card>

			<Card elevation="resting">
				<h3 class="font-semibold text-headers mb-2">Assessments</h3>
				<p class="text-sm text-labels mb-4">Try the rating interface</p>
				<div class="flex gap-2">
					<a href="/assess/pitch-11" class="flex-1">
						<Button variant="secondary" fullWidth>Pitch</Button>
					</a>
					<a href="/assess/review-11" class="flex-1">
						<Button variant="default" fullWidth>Review</Button>
					</a>
				</div>
			</Card>

			<Card elevation="resting">
				<h3 class="font-semibold text-headers mb-2">Dashboards</h3>
				<p class="text-sm text-labels mb-4">View dashboard variations</p>
				<div class="flex gap-2">
					<a href="/dashboard" class="flex-1">
						<Button variant="secondary" fullWidth>Participant</Button>
					</a>
					<a href="/dashboard/moderator" class="flex-1">
						<Button variant="default" fullWidth>Moderator</Button>
					</a>
				</div>
			</Card>

			<Card elevation="resting">
				<h3 class="font-semibold text-headers mb-2">Events</h3>
				<p class="text-sm text-labels mb-4">View event detail page</p>
				<a href="/event/cologne-march-2026" class="block">
					<Button variant="default" fullWidth>Event Detail</Button>
				</a>
			</Card>
		</div>
	</section>
</PageContainer>
