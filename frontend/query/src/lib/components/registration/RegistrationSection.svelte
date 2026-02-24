<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Card } from '$lib/components/ui/card';
	import CapacityIndicator from './CapacityIndicator.svelte';
	import WaitlistNotice from './WaitlistNotice.svelte';
	import { cn } from '$lib/utils';
	import { MapPin, Monitor, CheckCircle2 } from '@lucide/svelte';

	export interface EventData {
		id: string;
		title: string;
		capacity: number;
		registeredCount: number;
		waitlistCount?: number;
	}

	export interface UserRegistration {
		id: string;
		attendanceMode: 'in_presence' | 'remote';
		waitlistStatus?: 'waitlisted' | 'invited' | null;
		waitlistPosition?: number;
		waitlistExpiresAt?: string | Date | null;
	}

	interface Props {
		event: EventData;
		userRegistration?: UserRegistration | null;
		isAuthenticated?: boolean;
		onRegister?: (data: { attendanceMode: 'in_presence' | 'remote'; newsletter: boolean }) => void;
		onConfirmWaitlist?: () => void;
		onDeclineWaitlist?: () => void;
		onUnregister?: () => void;
		class?: string;
	}

	let {
		event,
		userRegistration = null,
		isAuthenticated = false,
		onRegister,
		onConfirmWaitlist,
		onDeclineWaitlist,
		onUnregister,
		class: className
	}: Props = $props();

	// Form state
	let attendanceMode = $state<'in_presence' | 'remote'>('in_presence');
	let termsAccepted = $state(false);
	let newsletter = $state(true); // Default checked per spec

	// Sync attendance mode from registration prop
	$effect(() => {
		attendanceMode = userRegistration?.attendanceMode ?? 'in_presence';
	});

	// Computed states
	const isRegistered = $derived(!!userRegistration && !userRegistration.waitlistStatus);
	const isWaitlisted = $derived(userRegistration?.waitlistStatus === 'waitlisted');
	const isInvited = $derived(userRegistration?.waitlistStatus === 'invited');
	const canRegister = $derived(termsAccepted && isAuthenticated);

	// Check if capacity is reached for in-presence
	const capacityReached = $derived(event.registeredCount >= event.capacity);

	function handleRegister() {
		if (!canRegister) return;
		onRegister?.({ attendanceMode, newsletter });
	}
</script>

<Card elevation="resting" padding="lg" class={cn('space-y-5', className)}>
	<!-- Header -->
	<div>
		<h3 class="text-lg font-semibold text-headers">Event Registration</h3>
		<CapacityIndicator
			registered={event.registeredCount}
			capacity={event.capacity}
			waitlistCount={event.waitlistCount}
			class="mt-2"
		/>
	</div>

	<!-- Waitlist Notice (if applicable) -->
	{#if isWaitlisted || isInvited}
		<WaitlistNotice
			status={userRegistration?.waitlistStatus ?? 'waitlisted'}
			position={userRegistration?.waitlistPosition}
			expiresAt={userRegistration?.waitlistExpiresAt}
			onConfirm={onConfirmWaitlist}
			onDecline={onDeclineWaitlist}
		/>
	{/if}

	<!-- Already Registered -->
	{#if isRegistered}
		<div class="bg-success/10 border border-success/30 rounded-lg p-4">
			<div class="flex items-center gap-3">
				<CheckCircle2 class="w-5 h-5 text-success flex-shrink-0" />
				<div>
					<p class="font-medium text-headers">You're registered!</p>
					<p class="text-sm text-labels">
						Attending {userRegistration?.attendanceMode === 'in_presence' ? 'in-presence' : 'remotely'}
					</p>
				</div>
			</div>
			{#if onUnregister}
				<Button
					variant="ghost"
					size="sm"
					onclick={onUnregister}
					class="mt-3 text-alert hover:text-alert"
				>
					Cancel Registration
				</Button>
			{/if}
		</div>
	{:else if !isWaitlisted && !isInvited}
		<!-- Registration Form -->
		<div class="space-y-4">
			<!-- Attendance Mode Toggle -->
			<div>
				<p class="text-sm font-medium text-headers mb-3">How will you attend?</p>
				<div class="grid grid-cols-2 gap-3">
					<button
						type="button"
						onclick={() => (attendanceMode = 'in_presence')}
						class={cn(
							'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
							attendanceMode === 'in_presence'
								? 'border-primary bg-primary/5'
								: 'border-secondary hover:border-primary/50'
						)}
					>
						<MapPin
							class={cn(
								'w-6 h-6',
								attendanceMode === 'in_presence' ? 'text-primary' : 'text-labels'
							)}
						/>
						<span
							class={cn(
								'text-sm font-medium',
								attendanceMode === 'in_presence' ? 'text-primary' : 'text-labels'
							)}
						>
							In-Presence
						</span>
						{#if capacityReached && attendanceMode === 'in_presence'}
							<span class="text-xs text-warning">Waitlist</span>
						{/if}
					</button>

					<button
						type="button"
						onclick={() => (attendanceMode = 'remote')}
						class={cn(
							'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
							attendanceMode === 'remote'
								? 'border-primary bg-primary/5'
								: 'border-secondary hover:border-primary/50'
						)}
					>
						<Monitor
							class={cn('w-6 h-6', attendanceMode === 'remote' ? 'text-primary' : 'text-labels')}
						/>
						<span
							class={cn(
								'text-sm font-medium',
								attendanceMode === 'remote' ? 'text-primary' : 'text-labels'
							)}
						>
							Remote
						</span>
					</button>
				</div>
			</div>

			<!-- Terms & Conditions -->
			<Checkbox
				bind:checked={termsAccepted}
				label="I accept the Terms & Conditions"
				description="Required to register for events"
			/>

			<!-- Newsletter Opt-in -->
			<Checkbox
				bind:checked={newsletter}
				label="Subscribe to community newsletter"
				description="Receive event announcements and updates"
			/>

			<!-- Register Button -->
			{#if isAuthenticated}
				<Button
					variant="default"
					size="lg"
					fullWidth
					disabled={!canRegister}
					onclick={handleRegister}
				>
					{#if capacityReached && attendanceMode === 'in_presence'}
						Join Waitlist
					{:else}
						Register for Event
					{/if}
				</Button>
			{:else}
				<div class="space-y-3">
					<Button variant="default" size="lg" fullWidth disabled>
						Login to Register
					</Button>
					<p class="text-xs text-center text-labels">
						Please <a href="/login" class="text-primary hover:underline">login</a> or
						<a href="/register" class="text-primary hover:underline">create an account</a> to register
					</p>
				</div>
			{/if}
		</div>
	{/if}
</Card>
