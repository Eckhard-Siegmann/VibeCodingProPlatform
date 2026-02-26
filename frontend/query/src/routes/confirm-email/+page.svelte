<script lang="ts">
	import { enhance } from '$app/forms';
	import AuthShell from '$lib/components/auth/AuthShell.svelte';
	import { Button } from '$lib/components/ui/button';
	import { CheckCircle, AlertTriangle, Info, ArrowLeft } from '@lucide/svelte';

	let { data, form } = $props();
</script>

<svelte:head>
	<title>Email Confirmation - VibeCoding</title>
</svelte:head>

<AuthShell title="VibeCoding Professionals">
	<div class="text-center space-y-4">
		{#if data.status === 'confirmed'}
			<CheckCircle class="w-12 h-12 text-success mx-auto" />
			<h2 class="text-xl font-bold text-success">Email Confirmed!</h2>
			<p class="text-sm text-labels">
				Your email address has been verified. You'll now receive newsletters and event reminders.
			</p>
			<a href="/">
				<Button variant="default" fullWidth class="h-12 text-base">
					Go to Dashboard
				</Button>
			</a>

		{:else if data.status === 'expired'}
			<AlertTriangle class="w-12 h-12 text-pending mx-auto" />
			<h2 class="text-xl font-bold text-pending">Link Expired</h2>
			<p class="text-sm text-labels">
				This confirmation link has expired (valid for 24 hours).
			</p>
			<form method="POST" action="?/resend" use:enhance>
				<Button type="submit" variant="default" fullWidth class="h-12 text-base">
					Resend Confirmation
				</Button>
			</form>
			{#if form?.resent}
				<p class="text-sm text-success">Confirmation email sent!</p>
			{/if}

		{:else if data.status === 'already_confirmed'}
			<Info class="w-12 h-12 text-primary mx-auto" />
			<h2 class="text-xl font-bold text-primary">Already Confirmed</h2>
			<p class="text-sm text-labels">
				Your email address is already confirmed.
			</p>
			<a href="/">
				<Button variant="default" fullWidth class="h-12 text-base">
					Go to Dashboard
				</Button>
			</a>

		{:else}
			<AlertTriangle class="w-12 h-12 text-alert mx-auto" />
			<h2 class="text-xl font-bold text-alert">Invalid Link</h2>
			<p class="text-sm text-labels">
				This confirmation link is invalid or has already been used.
			</p>
			<a href="/login">
				<Button variant="default" fullWidth class="h-12 text-base">
					Sign In
				</Button>
			</a>
		{/if}

		<p class="text-sm text-labels">
			<a href="/login" class="text-primary hover:underline">
				<ArrowLeft class="w-4 h-4 inline mr-1" />
				Back to sign in
			</a>
		</p>
	</div>
</AuthShell>
