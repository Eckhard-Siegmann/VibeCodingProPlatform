<script lang="ts">
	import { Eye, EyeOff } from '@lucide/svelte';

	interface Props {
		name: string;
		label: string;
		value?: string;
		placeholder?: string;
		autocomplete?: string;
		required?: boolean;
		showRules?: boolean;
		id?: string;
	}

	let {
		name,
		label,
		value = $bindable(''),
		placeholder = '',
		autocomplete = 'current-password',
		required = true,
		showRules = false,
		id
	}: Props = $props();

	let visible = $state(false);
	const inputId = id ?? `pw-${name}`;

	const hasMinLength = $derived(value.length >= 10);
	const hasUppercase = $derived(/[A-Z]/.test(value));
	const hasLowercase = $derived(/[a-z]/.test(value));
	const hasNumber = $derived(/\d/.test(value));
	const rulesMet = $derived([hasMinLength, hasUppercase, hasLowercase, hasNumber].filter(Boolean).length);
</script>

<div class="space-y-1">
	<label for={inputId} class="block text-sm font-medium text-headers">{label}</label>
	<div class="relative">
		<input
			{name}
			id={inputId}
			type={visible ? 'text' : 'password'}
			bind:value
			{placeholder}
			autocomplete={autocomplete as HTMLInputElement['autocomplete']}
			{required}
			class="w-full h-12 px-3 pr-10 border-2 border-secondary rounded-[var(--radius-card)] text-base text-headers
			       focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
			       transition-colors bg-card"
		/>
		<button
			type="button"
			onclick={() => visible = !visible}
			class="absolute right-3 top-1/2 -translate-y-1/2 text-meta hover:text-labels transition-colors"
			aria-label={visible ? 'Hide password' : 'Show password'}
		>
			{#if visible}
				<EyeOff class="w-5 h-5" />
			{:else}
				<Eye class="w-5 h-5" />
			{/if}
		</button>
	</div>

	{#if showRules && value.length > 0}
		<div class="mt-2 space-y-1">
			<!-- Strength bar -->
			<div class="flex gap-1 h-1.5">
				{#each [0, 1, 2, 3] as i}
					<div
						class="flex-1 rounded-full transition-colors {
							i < rulesMet
								? rulesMet <= 2 ? 'bg-alert' : rulesMet === 3 ? 'bg-pending' : 'bg-success'
								: 'bg-secondary'
						}"
					></div>
				{/each}
			</div>

			<ul class="text-xs space-y-0.5 mt-1">
				<li class={hasMinLength ? 'text-success' : 'text-alert'}>
					{hasMinLength ? '\u2713' : '\u2717'} 10+ characters
				</li>
				<li class={hasUppercase ? 'text-success' : 'text-alert'}>
					{hasUppercase ? '\u2713' : '\u2717'} Uppercase letter
				</li>
				<li class={hasLowercase ? 'text-success' : 'text-alert'}>
					{hasLowercase ? '\u2713' : '\u2717'} Lowercase letter
				</li>
				<li class={hasNumber ? 'text-success' : 'text-alert'}>
					{hasNumber ? '\u2713' : '\u2717'} Number
				</li>
			</ul>
		</div>
	{/if}
</div>
