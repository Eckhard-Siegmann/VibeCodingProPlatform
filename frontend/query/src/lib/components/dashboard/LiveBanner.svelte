<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';
	import { audioStore } from '$lib/stores/audio';
	import { Radio, Clock, ArrowRight, Users, Mic, CheckSquare, Volume2, VolumeX } from '@lucide/svelte';

	export type EventPhase = 'pre_event' | 'pitching' | 'voting' | 'coding' | 'review' | 'wrap_up';

	export interface LiveEventData {
		eventId: string;
		eventTitle: string;
		currentPhase: EventPhase;
		currentProblemTitle?: string;
		currentProblemSlug?: string;
		participantsOnline?: number;
		countdownSeconds?: number; // Remaining seconds if timer active
		statusMessage?: string; // Optional short status from moderator
	}

	interface Props {
		event: LiveEventData;
		onGoToRating?: () => void;
		ratingHref?: string;
		class?: string;
	}

	let { event, onGoToRating, ratingHref, class: className }: Props = $props();

	// Phase configurations
	const phaseConfig: Record<
		EventPhase,
		{
			label: string;
			color: string;
			bgColor: string;
			borderColor: string;
			icon: typeof Mic;
		}
	> = {
		pre_event: {
			label: 'Pre-Event',
			color: 'text-labels',
			bgColor: 'bg-canvas',
			borderColor: 'border-secondary',
			icon: Clock
		},
		pitching: {
			label: 'Pitch Phase',
			color: 'text-primary',
			bgColor: 'bg-primary/5',
			borderColor: 'border-primary/30',
			icon: Mic
		},
		voting: {
			label: 'Voting',
			color: 'text-warning',
			bgColor: 'bg-warning-bg',
			borderColor: 'border-warning/30',
			icon: CheckSquare
		},
		coding: {
			label: 'Coding Sprint',
			color: 'text-purple',
			bgColor: 'bg-purple-bg',
			borderColor: 'border-purple/30',
			icon: Radio
		},
		review: {
			label: 'Review Phase',
			color: 'text-success',
			bgColor: 'bg-success/10',
			borderColor: 'border-success/30',
			icon: CheckSquare
		},
		wrap_up: {
			label: 'Wrap Up',
			color: 'text-labels',
			bgColor: 'bg-canvas',
			borderColor: 'border-secondary',
			icon: Users
		}
	};

	const config = $derived(phaseConfig[event.currentPhase] ?? phaseConfig.pre_event);

	// Format countdown timer
	const formattedCountdown = $derived.by(() => {
		if (!event.countdownSeconds || event.countdownSeconds <= 0) return null;
		const minutes = Math.floor(event.countdownSeconds / 60);
		const seconds = event.countdownSeconds % 60;
		return `${minutes}:${seconds.toString().padStart(2, '0')}`;
	});

	// Determine if rating is available
	const showRatingButton = $derived(
		event.currentPhase === 'pitching' || event.currentPhase === 'review'
	);

	// Audio cue toggle state (Ch.14.5.1, U37, M28)
	let audioEnabled = $derived($audioStore.enabled);

	function toggleAudio() {
		audioStore.setEnabled(!audioEnabled);
	}
</script>

<div
	class={cn(
		'sticky top-[var(--height-topbar-mobile)] md:top-[var(--height-topbar-desktop)] z-40 border-b',
		config.bgColor,
		config.borderColor,
		className
	)}
	role="status"
	aria-live="polite"
>
	<div class="max-w-6xl mx-auto px-4 py-3">
		<div class="flex flex-col sm:flex-row sm:items-center gap-3">
			<!-- Live Indicator & Phase -->
			<div class="flex items-center gap-3 flex-1 min-w-0">
				<!-- Pulsing live indicator -->
				<span class="relative flex h-3 w-3 flex-shrink-0">
					<span
						class="animate-ping absolute inline-flex h-full w-full rounded-full bg-alert opacity-75"
					></span>
					<span class="relative inline-flex rounded-full h-3 w-3 bg-alert"></span>
				</span>

				<div class="flex items-center gap-2 min-w-0">
					{#if config.icon}
					{@const PhaseIcon = config.icon}
				<PhaseIcon class={cn('w-4 h-4 flex-shrink-0', config.color)} />
t			{/if}
					<span class={cn('font-semibold', config.color)}>{config.label}</span>

					{#if event.currentProblemTitle}
						<span class="text-labels hidden sm:inline">-</span>
						<span class="text-headers font-medium truncate hidden sm:block max-w-[200px]">
							{event.currentProblemTitle}
						</span>
					{/if}
				</div>
			</div>

			<!-- Timer & Stats & Audio Toggle -->
			<div class="flex items-center gap-4">
				{#if formattedCountdown}
					<div class="flex items-center gap-1.5 text-sm">
						<Clock class="w-4 h-4 text-warning" />
						<span class="font-mono font-semibold text-warning">{formattedCountdown}</span>
					</div>
				{/if}

				<!-- Audio cue toggle (Ch.14.5.1, U37, M28) -->
				<button
					type="button"
					onclick={toggleAudio}
					class="p-1.5 rounded-md transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center
						{audioEnabled ? 'text-primary hover:bg-primary/10' : 'text-labels hover:bg-canvas'}"
					aria-label={audioEnabled ? 'Disable audio cues' : 'Enable audio cues'}
					title={audioEnabled ? 'Audio cues on' : 'Audio cues off'}
				>
					{#if audioEnabled}
						<Volume2 class="w-4 h-4" />
					{:else}
						<VolumeX class="w-4 h-4" />
					{/if}
				</button>

				{#if event.participantsOnline}
					<div class="flex items-center gap-1.5 text-sm text-labels">
						<Users class="w-4 h-4" />
						<span>{event.participantsOnline} online</span>
					</div>
				{/if}

				<!-- Go to Rating Button -->
				{#if showRatingButton}
					{#if ratingHref}
						<a href={ratingHref}>
							<Button variant="default" size="sm">
								Go to Rating
								<ArrowRight class="w-4 h-4 ml-1" />
							</Button>
						</a>
					{:else if onGoToRating}
						<Button variant="default" size="sm" onclick={onGoToRating}>
							Go to Rating
							<ArrowRight class="w-4 h-4 ml-1" />
						</Button>
					{/if}
				{/if}
			</div>
		</div>

		<!-- Status Message (if provided by moderator) -->
		{#if event.statusMessage}
			<p class="text-sm text-labels mt-2 italic">{event.statusMessage}</p>
		{/if}

		<!-- Problem title on mobile (shown below on small screens) -->
		{#if event.currentProblemTitle}
			<p class="text-sm text-headers font-medium mt-2 truncate sm:hidden">
				{event.currentProblemTitle}
			</p>
		{/if}
	</div>
</div>
