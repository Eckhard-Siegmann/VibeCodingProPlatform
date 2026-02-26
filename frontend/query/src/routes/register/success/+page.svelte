<script lang="ts">
	import { page } from '$app/stores';
	import AuthShell from '$lib/components/auth/AuthShell.svelte';
	import { Button } from '$lib/components/ui/button';
	import { CheckCircle } from '@lucide/svelte';

	const email = $derived($page.url.searchParams.get('email') ?? '');

	// Resend with 60s cooldown (auth_pages_design.md, TICKET-27)
	let resending = $state(false);
	let resendError = $state('');
	let cooldownSeconds = $state(0);
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

	async function handleResend() {
		resending = true;
		resendError = '';
		try {
			const res = await fetch('/api/auth/resend-confirmation', { method: 'POST' });
			if (res.ok) {
				startCooldown();
			} else {
				resendError = 'Failed to resend. Please try again later.';
			}
		} catch {
			resendError = 'Network error. Please try again.';
		} finally {
			resending = false;
		}
	}
</script>

<svelte:head>
	<title>Account Created - VibeCoding</title>
</svelte:head>

<AuthShell title="VibeCoding Professionals">
	<div class="text-center space-y-4">
		<CheckCircle class="w-12 h-12 text-success mx-auto" />

		<h2 class="text-xl font-bold text-success">Account Created!</h2>

		<p class="text-sm text-labels">
			We've sent a confirmation email to:
		</p>

		{#if email}
			<p class="font-medium text-headers">{email}</p>
		{/if}

		<p class="text-sm text-labels">
			Click the link in the email to confirm your address and receive
			newsletters and event reminders.
		</p>

		<p class="text-sm text-labels">
			You can already browse events and start using the platform.
		</p>

		<a href="/">
			<Button variant="default" fullWidth class="h-12 text-base mt-4">
				Go to Dashboard
			</Button>
		</a>

		<p class="text-xs mt-4">
			Didn't receive it?
			<button
				class="font-medium disabled:cursor-not-allowed {cooldownSeconds > 0 ? 'text-meta' : resending ? 'text-meta' : 'text-primary hover:underline'}"
				disabled={cooldownSeconds > 0 || resending}
				onclick={handleResend}
			>
				{#if resending}
					Sending...
				{:else if cooldownSeconds > 0}
					Resend confirmation (available in {cooldownSeconds}s)
				{:else}
					Resend confirmation
				{/if}
			</button>
		</p>
		{#if resendError}
			<p class="text-xs text-alert">{resendError}</p>
		{/if}
	</div>
</AuthShell>
