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
	let displayName = $state(form?.displayName ?? '');
	let email = $state(form?.email ?? '');
	let password = $state('');
	let acceptTerms = $state(false);
	let getInfoletter = $state(form?.getInfoletter ?? true);
</script>

<svelte:head>
	<title>Register - VibeCoding</title>
</svelte:head>

<AuthShell title="VibeCoding Professionals" subtitle="Create your account">
	<!-- OAuth -->
	<OAuthButtons mode="register" />

	<!-- Server error -->
	{#if form?.error}
		<div class="mb-4 p-3 rounded-lg text-sm bg-red-50 border-l-4 border-alert text-red-800" role="alert">
			{form.error}
		</div>
	{/if}

	<!-- Register form -->
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
					placeholder="Max Mustermann"
					class="mt-1 w-full h-12 px-3 border-2 rounded-[var(--radius-card)] text-base text-headers
					       focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
					       transition-colors bg-card
					       {form?.errors?.display_name ? 'border-alert' : 'border-secondary'}"
				/>
				{#if form?.errors?.display_name}
					<p class="mt-1 text-xs text-alert" role="alert">{form.errors.display_name}</p>
				{/if}
			</div>

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
					class="mt-1 w-full h-12 px-3 border-2 rounded-[var(--radius-card)] text-base text-headers
					       focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
					       transition-colors bg-card
					       {form?.errors?.email ? 'border-alert' : 'border-secondary'}"
				/>
				{#if form?.errors?.email}
					<p class="mt-1 text-xs text-alert" role="alert">
						{form.errors.email}
						{#if form.errors.email.includes('already registered')}
							<a href="/login" class="text-primary underline ml-1">Sign in instead</a>
						{/if}
					</p>
				{/if}
			</div>

			<!-- Password -->
			<PasswordInput
				name="password"
				label="Password"
				bind:value={password}
				autocomplete="new-password"
				showRules
			/>
			{#if form?.errors?.password}
				<p class="text-xs text-alert" role="alert">{form.errors.password}</p>
			{/if}

			<!-- T&C -->
			<div>
				<label class="flex items-start gap-3 cursor-pointer">
					<input
						type="checkbox"
						name="accept_terms"
						bind:checked={acceptTerms}
						class="mt-0.5 h-5 w-5 rounded border-2 border-secondary-dark accent-primary"
					/>
					<span class="text-sm text-headers">
						I accept the
						<a href="/terms" target="_blank" class="text-primary underline">Terms & Conditions</a>
					</span>
				</label>
				{#if form?.errors?.terms}
					<p class="mt-1 text-xs text-alert" role="alert">{form.errors.terms}</p>
				{/if}
			</div>

			<!-- Newsletter -->
			<label class="flex items-start gap-3 cursor-pointer">
				<input
					type="checkbox"
					name="get_infoletter"
					bind:checked={getInfoletter}
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
					Create Account
				{/if}
			</Button>
		</div>
	</form>

	<!-- Login link -->
	<p class="mt-6 text-center text-sm text-labels">
		Already have an account?
		<a href="/login" class="text-primary hover:underline font-medium">Sign in</a>
	</p>
</AuthShell>
