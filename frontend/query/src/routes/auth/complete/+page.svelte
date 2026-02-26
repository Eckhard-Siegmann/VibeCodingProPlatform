<script lang="ts">
	import { enhance } from '$app/forms';
	import AuthShell from '$lib/components/auth/AuthShell.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Loader2 } from '@lucide/svelte';

	let { data, form } = $props();

	let submitting = $state(false);
	let displayName = $state(form?.displayName ?? data.displayName);
	let getInfoletter = $state(form?.getInfoletter ?? true);

	const providerLabel = data.provider === 'github' ? 'GitHub' : 'LinkedIn';
</script>

<svelte:head>
	<title>Complete Registration - VibeCoding</title>
</svelte:head>

<AuthShell title="VibeCoding Professionals" subtitle="Almost there!">
	<div class="text-center mb-6">
		<p class="text-sm text-labels">Signed in as:</p>
		<p class="font-medium text-headers">{data.email} ({providerLabel})</p>
	</div>

	{#if form?.error}
		<div class="mb-4 p-3 rounded-lg text-sm bg-red-50 border-l-4 border-alert text-red-800" role="alert">
			{form.error}
			{#if form.error.includes('already registered')}
				<a href="/login" class="block mt-1 text-primary underline">Sign in instead</a>
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
			<!-- Display Name -->
			<div>
				<label for="display_name" class="block text-sm font-medium text-headers">Display Name</label>
				<input
					id="display_name"
					name="display_name"
					type="text"
					autocomplete="name"
					required
					bind:value={displayName}
					class="mt-1 w-full h-12 px-3 border-2 border-secondary rounded-[var(--radius-card)] text-base text-headers
					       focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
					       transition-colors bg-card"
				/>
				{#if form?.errors?.display_name}
					<p class="mt-1 text-sm text-alert">{form.errors.display_name}</p>
				{/if}
			</div>

			<!-- T&C -->
			<div>
				<label class="flex items-start gap-3 cursor-pointer">
					<input
						type="checkbox"
						name="accept_terms"
						class="mt-0.5 h-5 w-5 rounded border-2 border-secondary-dark accent-primary"
					/>
					<span class="text-sm text-headers">
						I accept the <a href="/terms" class="text-primary underline">Terms & Conditions</a>
					</span>
				</label>
				{#if form?.errors?.terms}
					<p class="mt-1 text-sm text-alert">{form.errors.terms}</p>
				{/if}
			</div>

			<!-- Newsletter -->
			<label class="flex items-start gap-3 cursor-pointer">
				<input
					type="checkbox"
					name="get_infoletter"
					checked={getInfoletter}
					class="mt-0.5 h-5 w-5 rounded border-2 border-secondary-dark accent-primary"
				/>
				<span class="text-sm text-headers">Subscribe to community newsletter</span>
			</label>

			<!-- Submit -->
			<Button type="submit" variant="default" fullWidth class="h-12 text-base" disabled={submitting}>
				{#if submitting}
					<Loader2 class="w-5 h-5 mr-2 animate-spin" />
					Creating account...
				{:else}
					Complete Registration
				{/if}
			</Button>
		</div>
	</form>
</AuthShell>
