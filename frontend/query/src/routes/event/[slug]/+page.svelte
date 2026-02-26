<script lang="ts">
	import PageContainer from '$lib/components/layout/PageContainer.svelte';
	import { Card } from '$lib/components/ui/card';
	import { Badge, type BadgeVariant } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import BackButton from '$lib/components/ui/back-button/back-button.svelte';
	import { EventHeader, type EventHeaderData } from '$lib/components/events';
	import { RegistrationSection, type EventData, type UserRegistration } from '$lib/components/registration';
	import { toastSuccess, toastError } from '$lib/stores/toast';
	import { FileText, ArrowRight } from '@lucide/svelte';

	let { data } = $props();

	// Map server data to EventHeader component interface
	const eventHeaderData: EventHeaderData = $derived({
		id: data.event.event_id,
		slug: data.event.slug,
		title: data.event.title,
		description: data.event.description ?? undefined,
		startsAt: data.event.starts_at,
		plannedEndsAt: data.event.planned_ends_at,
		imageUrl: data.event.image_url ?? undefined,
		location: {
			name: data.event.location.name,
			city: data.event.location.city,
			address: data.event.location.address
		},
		room: {
			name: data.event.room.name
		},
		partner: {
			name: data.event.partner.name,
			logoUrl: data.event.partner.logo_url ?? undefined
		},
		host: data.event.host,
		coHost1: data.event.coHost1,
		coHost2: data.event.coHost2,
		websiteUrl: data.event.website_url,
		linkedinUrl: data.event.linkedin_url,
		xPostUrl: data.event.x_post_url,
		isPast: data.event.isPast,
		isLive: data.event.isLive
	});

	// Registration section data — mutable for optimistic updates after API calls.
	// Initialized from server data; synced on navigation via $effect.
	let registeredCount = $state(0);
	let waitlistCount = $state(0);
	let userRegistration = $state<UserRegistration | null>(null);

	$effect(() => {
		registeredCount = data.counts.registeredCount;
		waitlistCount = data.counts.waitlistCount;
		userRegistration = mapRegistration(data.registration);
	});

	// Per Ch.29.5: Display uses base capacity (not overbooking) to hide overbooking
	const displayCapacity = $derived(data.counts.baseCapacity);

	const registrationEvent: EventData = $derived({
		id: data.event.event_id,
		title: data.event.title,
		capacity: displayCapacity,
		registeredCount,
		waitlistCount
	});

	function mapRegistration(reg: typeof data.registration): UserRegistration | null {
		if (!reg) return null;

		let waitlistStatus: 'waitlisted' | 'invited' | null = null;
		if (reg.waitlist_invited_at) {
			waitlistStatus = 'invited';
		} else if (reg.waitlist_position !== null) {
			waitlistStatus = 'waitlisted';
		}

		return {
			id: reg.registration_id,
			attendanceMode: reg.in_presence ? 'in_presence' : 'remote',
			waitlistStatus,
			waitlistPosition: reg.waitlist_position ?? undefined,
			waitlistExpiresAt: reg.waitlist_expires_at
		};
	}

	let loading = $state(false);

	async function handleRegister(regData: { attendanceMode: 'in_presence' | 'remote'; newsletter: boolean }) {
		if (loading) return;

		if (!data.isAuthenticated) {
			window.location.href = `/login?redirect=/event/${data.event.slug}`;
			return;
		}

		loading = true;
		try {
			const res = await fetch(`/api/events/${data.event.event_id}/registrations`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'register',
					in_presence: regData.attendanceMode === 'in_presence'
				})
			});

			const result = await res.json();

			if (!res.ok || !result.success) {
				toastError('Registration failed', result.error ?? 'Please try again');
				return;
			}

			// Update local state from server response
			if (result.counts) {
				registeredCount = result.counts.registeredCount;
				waitlistCount = result.counts.waitlistCount;
			}
			userRegistration = mapRegistration(result.registration);

			if (result.waitlisted) {
				toastSuccess("You're on the waitlist", `Position #${result.waitlist_position}`);
			} else {
				toastSuccess('Registration successful!', "You're confirmed for the event");
			}
		} catch {
			toastError('Registration failed', 'Network error — please try again');
		} finally {
			loading = false;
		}
	}

	async function handleUnregister() {
		if (loading) return;
		loading = true;
		try {
			const res = await fetch(`/api/events/${data.event.event_id}/registrations`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'cancel' })
			});

			const result = await res.json();

			if (!res.ok || !result.success) {
				toastError('Cancellation failed', result.error ?? 'Please try again');
				return;
			}

			if (result.counts) {
				registeredCount = result.counts.registeredCount;
				waitlistCount = result.counts.waitlistCount;
			}
			userRegistration = null;
			toastSuccess('Registration cancelled', 'You have been unregistered from the event');
		} catch {
			toastError('Cancellation failed', 'Network error — please try again');
		} finally {
			loading = false;
		}
	}

	async function handleConfirmWaitlist() {
		if (loading) return;
		loading = true;
		try {
			const res = await fetch(`/api/events/${data.event.event_id}/registrations`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'waitlist-respond', accept: true })
			});

			const result = await res.json();

			if (!res.ok || !result.success) {
				toastError('Confirmation failed', result.error ?? 'Please try again');
				return;
			}

			if (result.counts) {
				registeredCount = result.counts.registeredCount;
				waitlistCount = result.counts.waitlistCount;
			}
			userRegistration = mapRegistration(result.registration);
			toastSuccess('Spot confirmed!', "You're registered for the event");
		} catch {
			toastError('Confirmation failed', 'Network error — please try again');
		} finally {
			loading = false;
		}
	}

	async function handleDeclineWaitlist() {
		if (loading) return;
		loading = true;
		try {
			const res = await fetch(`/api/events/${data.event.event_id}/registrations`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'waitlist-respond', accept: false })
			});

			const result = await res.json();

			if (!res.ok || !result.success) {
				toastError('Failed to decline', result.error ?? 'Please try again');
				return;
			}

			if (result.counts) {
				registeredCount = result.counts.registeredCount;
				waitlistCount = result.counts.waitlistCount;
			}
			userRegistration = null;
			toastSuccess('Invitation declined', 'The next person on the waitlist has been notified');
		} catch {
			toastError('Failed to decline', 'Network error — please try again');
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>{data.event.title} - VibeCoding</title>
</svelte:head>

<PageContainer>
	<!-- Back navigation -->
	<BackButton label="Back to Events" href="/" class="mb-4" />

	<div class="grid gap-8 lg:grid-cols-[1fr_360px]">
		<!-- Main Content -->
		<div class="space-y-8">
			<EventHeader event={eventHeaderData} />

			<!-- Problems Section -->
			{#if data.problems.length > 0}
				<section>
					<h2 class="text-xl font-semibold text-headers mb-4">
						Problems for This Event ({data.problems.length})
					</h2>
					<div class="space-y-3">
						{#each data.problems as problem (problem.problem_id)}
							<Card elevation="resting" padding="md">
								<div class="flex items-start gap-4">
									<div class="p-2 rounded-lg bg-primary/10 flex-shrink-0">
										<FileText class="w-5 h-5 text-primary" />
									</div>
									<div class="flex-1 min-w-0">
										<div class="flex items-start justify-between gap-2">
											<div class="min-w-0">
												<h3 class="font-semibold text-headers truncate">{problem.title}</h3>
												<p class="text-sm text-labels">by {problem.owner_name}</p>
											</div>
											<div class="flex gap-2 flex-shrink-0">
												<Badge variant={problem.readiness_state as BadgeVariant}>
													{problem.readiness_state.replace('_', ' ')}
												</Badge>
											</div>
										</div>
									</div>
									<a href={`/problem/${problem.public_slug}`} class="flex-shrink-0">
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
			{:else}
				<section>
					<h2 class="text-xl font-semibold text-headers mb-4">
						Problems for This Event
					</h2>
					<Card elevation="flat" padding="lg">
						<p class="text-center text-labels">
							{#if data.event.isPast}
								No problems were selected for this event.
							{:else}
								No problems selected yet. Check back as the event approaches.
							{/if}
						</p>
					</Card>
				</section>
			{/if}
		</div>

		<!-- Sidebar - Registration -->
		{#if !data.event.isPast}
			<aside class="lg:sticky lg:top-4 lg:self-start">
				<RegistrationSection
					event={registrationEvent}
					{userRegistration}
					isAuthenticated={data.isAuthenticated}
					onRegister={handleRegister}
					onUnregister={handleUnregister}
					onConfirmWaitlist={handleConfirmWaitlist}
					onDeclineWaitlist={handleDeclineWaitlist}
				/>
			</aside>
		{:else}
			<aside>
				<Card elevation="resting" padding="lg">
					<h3 class="text-lg font-semibold text-headers mb-3">Event Summary</h3>
					<div class="space-y-2 text-sm text-labels">
						<p>{registeredCount} participants registered</p>
						<p>{data.problems.length} problems tackled</p>
					</div>
				</Card>
			</aside>
		{/if}
	</div>
</PageContainer>
