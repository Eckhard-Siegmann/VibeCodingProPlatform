<script lang="ts">
	import { enhance } from '$app/forms';
	import AuthShell from '$lib/components/auth/AuthShell.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Loader2, Mail, ArrowLeft } from '@lucide/svelte';

	let { form } = $props();

	let submitting = $state(false);
	let email = $state(form?.email ?? '');

	// Resend cooldown (60 seconds per ADR 004)
	let cooldownSeconds = $state(0);
	let resending = $state(false);
	let cooldownInterval: ReturnType<typeof setInterval> | null = null;

	function startCooldown() {
		cooldownSeconds = 60;
		if (cooldownInterval) clearInterval(cooldownInterval);
		cooldownInterval = setInterval(() => {
			cooldownSeconds--;
			if (cooldownSeconds <= 0) {
				cooldownSeconds = 0;
				if (cooldownInterval) clearInterval(cooldownInterval);
				cooldownInterval = null;
			}
		}, 1000);
	}

	// Start cooldown when success state first appears
	$effect(() => {
		if (form?.success && cooldownSeconds === 0 && !cooldownInterval) {
			startCooldown();
		}
	});
</script>

<svelte:head>
	<title>Reset Password - VibeCoding</title>
</svelte:head>

<AuthShell title="VibeCoding Professionals" subtitle="Reset your password">
	{#if form?.success}
		<!-- Success state -->
		<div class="text-center space-y-4">
			<Mail class="w-12 h-12 text-primary mx-auto" />

			<h2 class="text-xl font-bold text-headers">Check your email</h2>

			<p class="text-sm text-labels">
				We've sent a one-time password to:
			</p>

			<p class="font-medium text-headers">{form.email}</p>

			<p class="text-sm text-labels">
				Use it on the password reset page to set a new password.
			</p>

			<a href="/set-password?email={encodeURIComponent(form.email)}">
				<Button variant="default" fullWidth class="h-12 text-base">
					Set New Password
				</Button>
			</a>

			<!-- Resend with 60s cooldown (ADR 004, auth_pages_design.md) -->
			<div class="pt-2">
				<p class="text-sm text-labels">Didn't receive it?</p>
				<form
					method="POST"
					class="mt-1"
					use:enhance={() => {
						resending = true;
						return async ({ update }) => {
							resending = false;
							startCooldown();
							await update();
						};
					}}
				>
					<input type="hidden" name="email" value={form.email} />
					<button
						type="submit"
						class="text-sm font-medium disabled:text-meta disabled:cursor-not-allowed {cooldownSeconds > 0 ? 'text-meta' : 'text-primary hover:underline'}"
						disabled={cooldownSeconds > 0 || resending}
					>
						{#if resending}
							Sending...
						{:else if cooldownSeconds > 0}
							Send again (available in {cooldownSeconds}s)
						{:else}
							Send again
						{/if}
					</button>
				</form>
			</div>
		</div>
	{:else}
		<!-- Form state -->
		<p class="text-sm text-labels mb-4">
			Enter your email address and we'll send you a one-time password to reset it.
		</p>

		{#if form?.error}
			<div class="mb-4 p-3 rounded-lg text-sm bg-red-50 border-l-4 border-alert text-red-800" role="alert">
				{form.error}
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

				<Button type="submit" variant="default" fullWidth class="h-12 text-base" disabled={submitting}>
					{#if submitting}
						<Loader2 class="w-5 h-5 mr-2 animate-spin" />
						Sending...
					{:else}
						Send Reset Code
					{/if}
				</Button>
			</div>
		</form>
	{/if}

	<p class="mt-6 text-center text-sm text-labels">
		<a href="/login" class="text-primary hover:underline">
			<ArrowLeft class="w-4 h-4 inline mr-1" />
			Back to sign in
		</a>
	</p>
</AuthShell>
