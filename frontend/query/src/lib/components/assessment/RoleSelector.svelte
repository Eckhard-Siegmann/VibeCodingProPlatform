<script lang="ts">
	import Card from '$lib/components/ui/Card.svelte';

	type Role = 'problem_owner' | 'developer' | 'observer';

	interface Props {
		value: Role | null;
		disabled?: boolean;
		onchange: (role: Role) => void;
	}

	let { value, disabled = false, onchange }: Props = $props();

	const roles: { key: Role; label: string; description: string }[] = [
		{
			key: 'problem_owner',
			label: 'Problem Owner',
			description: 'I authored or maintain this problem'
		},
		{
			key: 'developer',
			label: 'Developer',
			description: 'I actively coded on this problem'
		},
		{
			key: 'observer',
			label: 'Observer',
			description: 'I watched and can evaluate the result'
		}
	];

	function handleSelect(role: Role) {
		if (!disabled) {
			onchange(role);
		}
	}

	function handleKeyDown(event: KeyboardEvent, role: Role) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleSelect(role);
		}
	}
</script>

<div class="mb-6">
	<h2 class="text-lg font-semibold text-headers mb-2">Your Role</h2>
	<p class="text-sm text-labels mb-4">Select how you participated with this problem</p>

	<div
		role="radiogroup"
		aria-label="Select your role"
		aria-required="true"
		class="grid grid-cols-1 md:grid-cols-3 gap-3"
	>
		{#each roles as role (role.key)}
			<button
				type="button"
				role="radio"
				aria-checked={value === role.key}
				aria-label={role.label}
				{disabled}
				tabindex={value === role.key ? 0 : -1}
				onclick={() => handleSelect(role.key)}
				onkeydown={(e) => handleKeyDown(e, role.key)}
				class="text-left p-4 rounded-[var(--radius-card)] border-2 transition-all cursor-pointer
					min-h-[44px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary
					{value === role.key
					? 'border-primary bg-primary/5'
					: 'border-secondary bg-card hover:border-primary/30'}
					{disabled ? 'opacity-50 cursor-not-allowed' : ''}"
			>
				<div class="flex items-center gap-3">
					<!-- Radio indicator -->
					<span
						class="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center
							{value === role.key ? 'border-primary bg-primary' : 'border-secondary-dark'}"
					>
						{#if value === role.key}
							<span class="w-2 h-2 rounded-full bg-white"></span>
						{/if}
					</span>

					<div>
						<div class="font-medium text-headers">{role.label}</div>
						<div class="text-sm text-labels">{role.description}</div>
					</div>
				</div>
			</button>
		{/each}
	</div>

	{#if value === null}
		<p class="mt-2 text-sm text-alert" role="alert">Please select your role to continue</p>
	{/if}
</div>
