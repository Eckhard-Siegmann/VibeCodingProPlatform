<script lang="ts">
	import { enhance } from '$app/forms';
	import AuthShell from '$lib/components/auth/AuthShell.svelte';
	import OAuthButtons from '$lib/components/auth/OAuthButtons.svelte';
	import PasswordInput from '$lib/components/auth/PasswordInput.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Loader2 } from '@lucide/svelte';

	let { data, form } = $props();

	let submitting = $state(false);
	let email = $state(form?.email ?? '');
	let password = $state('');
</script>

<svelte:head>
	<title>Sign In - VibeCoding</title>
</svelte:head>

<AuthShell title="VibeCoding Professionals" subtitle="Sign in to your account">
	<!-- OAuth -->
	<OAuthButtons mode="login" />

	<!-- OAuth error from redirect -->
	{#if data.oauthError}
		<div class="mb-4 p-3 rounded-lg text-sm bg-red-50 border-l-4 border-alert text-red-800" role="alert">
			{data.oauthError}
		</div>
	{/if}

	<!-- Error alert -->
	{#if form?.error}
		<div
			class="mb-4 p-3 rounded-lg text-sm {form.otpPending ? 'bg-yellow-50 border-l-4 border-pending text-yellow-800' : 'bg-red-50 border-l-4 border-alert text-red-800'}"
			role="alert"
		>
			{form.error}
			{#if form.otpPending}
				<a href="/set-password?email={encodeURIComponent(email)}" class="block mt-1 text-primary underline">
					Set your password
				</a>
			{/if}
		</div>
	{/if}

	<!-- Login form -->
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
		<input type="hidden" name="redirect" value={data.redirect} />

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

			<!-- Password -->
			<PasswordInput
				name="password"
				label="Password"
				bind:value={password}
				autocomplete="current-password"
			/>

			<!-- Remember me + Forgot -->
			<div class="flex items-center justify-between">
				<Checkbox name="remember" label="Remember me" />
				<a href="/forgot-password" class="text-sm text-primary hover:underline">Forgot?</a>
			</div>

			<!-- Submit -->
			<Button type="submit" variant="default" fullWidth class="h-12 text-base" disabled={submitting}>
				{#if submitting}
					<Loader2 class="w-5 h-5 mr-2 animate-spin" />
					Signing in...
				{:else}
					Sign In
				{/if}
			</Button>
		</div>
	</form>

	<!-- Register link -->
	<p class="mt-6 text-center text-sm text-labels">
		Don't have an account?
		<a href="/register" class="text-primary hover:underline font-medium">Create one</a>
	</p>
</AuthShell>
