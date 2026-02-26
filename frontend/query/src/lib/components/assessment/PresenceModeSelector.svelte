<script lang="ts">
	import { MapPin, Wifi } from '@lucide/svelte';

	interface Props {
		value: boolean; // true = in-presence, false = remote
		disabled?: boolean;
		onchange: (inPresence: boolean) => void;
	}

	let { value, disabled = false, onchange }: Props = $props();

	const modes = [
		{
			key: true,
			label: 'In-Presence',
			description: 'I am physically at the venue',
			icon: MapPin
		},
		{
			key: false,
			label: 'Remote',
			description: 'I am participating virtually',
			icon: Wifi
		}
	] as const;

	function handleSelect(inPresence: boolean) {
		if (!disabled) {
			onchange(inPresence);
		}
	}

	function handleKeyDown(event: KeyboardEvent, inPresence: boolean) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleSelect(inPresence);
		}
	}
</script>

<div class="mb-6">
	<h2 class="text-lg font-semibold text-headers mb-2">Participation Mode</h2>
	<p class="text-sm text-labels mb-4">How are you joining this session?</p>

	<div
		role="radiogroup"
		aria-label="Select your participation mode"
		class="grid grid-cols-1 md:grid-cols-2 gap-3"
	>
		{#each modes as mode (mode.key)}
			{@const ModeIcon = mode.icon}
			<button
				type="button"
				role="radio"
				aria-checked={value === mode.key}
				aria-label={mode.label}
				{disabled}
				tabindex={value === mode.key ? 0 : -1}
				onclick={() => handleSelect(mode.key)}
				onkeydown={(e) => handleKeyDown(e, mode.key)}
				class="text-left p-4 rounded-[var(--radius-card)] border-2 transition-all cursor-pointer
					min-h-[44px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary
					{value === mode.key
					? 'border-primary bg-primary/5'
					: 'border-secondary bg-card hover:border-primary/30'}
					{disabled ? 'opacity-50 cursor-not-allowed' : ''}"
			>
				<div class="flex items-center gap-3">
					<!-- Radio indicator -->
					<span
						class="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center
							{value === mode.key ? 'border-primary bg-primary' : 'border-secondary-dark'}"
					>
						{#if value === mode.key}
							<span class="w-2 h-2 rounded-full bg-white"></span>
						{/if}
					</span>

					<ModeIcon class="w-5 h-5 flex-shrink-0 {value === mode.key ? 'text-primary' : 'text-labels'}" />

					<div>
						<div class="font-medium text-headers">{mode.label}</div>
						<div class="text-sm text-labels">{mode.description}</div>
					</div>
				</div>
			</button>
		{/each}
	</div>
</div>
