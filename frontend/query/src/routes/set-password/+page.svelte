<script lang="ts">
	import { enhance } from '$app/forms';
	import AuthShell from '$lib/components/auth/AuthShell.svelte';
	import PasswordInput from '$lib/components/auth/PasswordInput.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Loader2, ArrowLeft } from '@lucide/svelte';

	let { data, form } = $props();

	let submitting = $state(false);
	let email = $state(form?.email ?? data.email ?? '');
	let otp = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
</script>

<svelte:head>
	<title>Set Password - VibeCoding</title>
</svelte:head>

<AuthShell title="VibeCoding Professionals" subtitle="Set your password">
	<p class="text-sm text-labels mb-4">
		Enter the one-time password from your email and choose a new password.
	</p>

	{#if form?.error}
		<div class="mb-4 p-3 rounded-lg text-sm bg-red-50 border-l-4 border-alert text-red-800" role="alert">
			{form.error}
			{#if form.error.includes('already been used')}
				<a href="/forgot-password" class="block mt-1 text-primary underline">Request a new one</a>
			{/if}
		</div>
	{/if}

	<form
		method="POST"
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				submitting = false;
				await update();
			};
		}}
	>
		<div class="space-y-4">
			<!-- Email -->
			<div>
				<label for="email" class="block text-sm font-medium text-headers">Email</label>
				<input
					id="email"
					name="email"
					type="email"
					autocomplete="email"
					required
					bind:value={email}
					placeholder="you@example.com"
					class="mt-1 w-full h-12 px-3 border-2 border-secondary rounded-[var(--radius-card)] text-base text-headers
					       focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
					       transition-colors bg-card"
				/>
			</div>

			<!-- OTP -->
			<div>
				<label for="otp" class="block text-sm font-medium text-headers">One-Time Password</label>
				<input
					id="otp"
					name="otp"
					type="text"
					autocomplete="one-time-code"
					required
					bind:value={otp}
					placeholder="ABC123DEF456"
					maxlength="12"
					class="mt-1 w-full h-12 px-3 border-2 border-secondary rounded-[var(--radius-card)] text-base text-headers
					       focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
					       transition-colors bg-card font-mono uppercase tracking-wider"
				/>
			</div>

			<!-- New Password -->
			<PasswordInput
				name="new_password"
				label="New Password"
				bind:value={newPassword}
				autocomplete="new-password"
				showRules
			/>

			<!-- Confirm Password -->
			<div>
				<label for="confirm_password" class="block text-sm font-medium text-headers">Confirm Password</label>
				<input
					id="confirm_password"
					name="confirm_password"
					type="password"
					autocomplete="new-password"
					required
					bind:value={confirmPassword}
					class="mt-1 w-full h-12 px-3 border-2 rounded-[var(--radius-card)] text-base text-headers
					       focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
					       transition-colors bg-card
					       {confirmPassword && confirmPassword !== newPassword ? 'border-alert' : 'border-secondary'}"
				/>
				{#if confirmPassword && confirmPassword !== newPassword}
					<p class="mt-1 text-xs text-alert">Passwords do not match.</p>
				{/if}
			</div>

			<!-- Submit -->
			<Button type="submit" variant="default" fullWidth class="h-12 text-base" disabled={submitting}>
				{#if submitting}
					<Loader2 class="w-5 h-5 mr-2 animate-spin" />
					Setting password...
				{:else}
					Set Password
				{/if}
			</Button>
		</div>
	</form>

	<p class="mt-6 text-center text-sm text-labels">
		<a href="/login" class="text-primary hover:underline">
			<ArrowLeft class="w-4 h-4 inline mr-1" />
			Back to sign in
		</a>
	</p>
</AuthShell>
