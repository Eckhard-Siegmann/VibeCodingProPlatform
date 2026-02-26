<script lang="ts">
	import { enhance } from '$app/forms';
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
	import PasswordInput from '$lib/components/auth/PasswordInput.svelte';
	import { Button } from '$lib/components/ui/button';
	import {
		Loader2,
		ArrowLeft,
		CheckCircle,
		User,
		Lock,
		Bell,
		Link,
		KeyRound,
		Copy,
		Check,
		CircleDot,
		CircleX,
		CircleMinus
	} from '@lucide/svelte';

	let { data, form } = $props();

	// Password change state
	let changingPassword = $state(false);
	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');

	// Notifications & preferences state — initialise from SSR data
	let getInfoletter = $state(data.getInfoletter);
	let audioCuesEnabled = $state(data.audioCuesEnabled);
	let savingNotifications = $state(false);

	// API key state
	let showGenerateForm = $state(false);
	let generatingKey = $state(false);
	let keyLabel = $state('');
	let revokingKeyId = $state<string | null>(null);
	let submittingRevoke = $state(false);

	// One-time key display
	let newKeyShown = $state(false);
	let newKeyText = $state('');
	let keyCopied = $state(false);

	// Password policy check (real-time)
	const passwordRules = $derived([
		{ label: '10+ characters', met: newPassword.length >= 10 },
		{ label: 'Uppercase letter', met: /[A-Z]/.test(newPassword) },
		{ label: 'Lowercase letter', met: /[a-z]/.test(newPassword) },
		{ label: 'Number', met: /\d/.test(newPassword) }
	]);

	// Clear password form on success
	$effect(() => {
		if (form?.passwordSuccess) {
			currentPassword = '';
			newPassword = '';
			confirmPassword = '';
		}
	});

	// Show one-time key dialog after generation
	$effect(() => {
		if (form?.keyCreated && form?.newKey) {
			newKeyText = form.newKey;
			newKeyShown = true;
			showGenerateForm = false;
			keyLabel = '';
		}
	});

	function dismissNewKey() {
		newKeyShown = false;
		newKeyText = '';
		keyCopied = false;
	}

	async function copyKey() {
		if (!newKeyText) return;
		await navigator.clipboard.writeText(newKeyText);
		keyCopied = true;
		setTimeout(() => (keyCopied = false), 2000);
	}

	function formatDate(iso: string) {
		return new Date(iso).toLocaleDateString('en-GB', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Account Settings — VibeCoding</title>
</svelte:head>

<div class="min-h-screen bg-viewport">
	<div class="max-w-2xl mx-auto px-4 py-6 md:py-8">

		<!-- Header -->
		<div class="flex items-center gap-4 mb-6">
			<a
				href="/"
				class="p-2 rounded-[var(--radius-card)] hover:bg-canvas transition-colors"
				title="Back to Dashboard"
			>
				<ArrowLeft class="w-5 h-5 text-meta" />
			</a>
			<div>
				<h1 class="text-2xl font-bold text-headers">Account Settings</h1>
				<p class="text-sm text-meta">Manage your profile and preferences</p>
			</div>
		</div>

		<div class="space-y-4">

			<!-- Profile (read-only) -->
			<Card elevation="resting">
				<CardHeader>
					<CardTitle class="flex items-center gap-2 text-base">
						<User class="w-4 h-4 text-primary" />
						Profile
					</CardTitle>
				</CardHeader>
				<CardContent class="space-y-4">
					<div>
						<p class="text-xs font-medium text-meta uppercase tracking-wide mb-1">Display Name</p>
						<p class="text-headers font-medium">{data.displayName}</p>
					</div>
					<div>
						<p class="text-xs font-medium text-meta uppercase tracking-wide mb-1">Email</p>
						<div class="flex items-center gap-2">
							<p class="text-headers font-medium">{data.email}</p>
							{#if data.emailConfirmed}
								<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-success/10 text-success">
									<CheckCircle class="w-3 h-3" />
									Confirmed
								</span>
							{:else}
								<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-pending/10 text-pending">
									Pending
								</span>
							{/if}
						</div>
						<p class="text-xs text-meta mt-1">Email address cannot be changed.</p>
					</div>
				</CardContent>
			</Card>

			<!-- Change Password (local auth only) -->
			<Card elevation="resting">
				<CardHeader>
					<CardTitle class="flex items-center gap-2 text-base">
						<Lock class="w-4 h-4 text-primary" />
						Change Password
					</CardTitle>
				</CardHeader>
				<CardContent>
					<!-- Success message -->
					{#if form?.passwordSuccess}
						<div class="mb-4 p-3 rounded-lg text-sm bg-green-50 border-l-4 border-success text-green-800" role="alert">
							Password changed successfully. All other sessions have been logged out.
						</div>
					{/if}

					<!-- Error message -->
					{#if form?.passwordError}
						<div class="mb-4 p-3 rounded-lg text-sm bg-red-50 border-l-4 border-alert text-red-800" role="alert">
							{form.passwordError}
						</div>
					{/if}

					{#if data.authProvider === 'local'}
						<form
							method="POST"
							action="?/changePassword"
							use:enhance={() => {
								changingPassword = true;
								return async ({ update }) => {
									changingPassword = false;
									await update();
								};
							}}
						>
							<div class="space-y-4">
								<PasswordInput
									name="current_password"
									label="Current Password"
									bind:value={currentPassword}
									autocomplete="current-password"
								/>

								<div>
									<PasswordInput
										name="new_password"
										label="New Password"
										bind:value={newPassword}
										autocomplete="new-password"
									/>
									<!-- Policy indicators -->
									{#if newPassword.length > 0}
										<div class="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
											{#each passwordRules as rule}
												<p class="text-xs flex items-center gap-1 {rule.met ? 'text-success' : 'text-alert'}">
													{rule.met ? '✓' : '✗'} {rule.label}
												</p>
											{/each}
										</div>
									{/if}
								</div>

								<PasswordInput
									name="confirm_password"
									label="Confirm New Password"
									bind:value={confirmPassword}
									autocomplete="new-password"
								/>

								<Button
									type="submit"
									variant="default"
									fullWidth
									class="h-12 text-base"
									disabled={changingPassword}
								>
									{#if changingPassword}
										<Loader2 class="w-5 h-5 mr-2 animate-spin" />
										Changing...
									{:else}
										Change Password
									{/if}
								</Button>
							</div>
						</form>
					{:else}
						<p class="text-sm text-labels">
							You signed in with {data.authProvider === 'github' ? 'GitHub' : 'LinkedIn'}.
							Password change is not available for OAuth accounts.
						</p>
					{/if}
				</CardContent>
			</Card>

			<!-- Notifications & Preferences (Ch.30.6, Ch.14.5.1, TICKET-27) -->
			<Card elevation="resting">
				<CardHeader>
					<CardTitle class="flex items-center gap-2 text-base">
						<Bell class="w-4 h-4 text-primary" />
						Notifications & Preferences
					</CardTitle>
				</CardHeader>
				<CardContent>
					<!-- Success message -->
					{#if form?.notificationsSuccess}
						<div class="mb-4 p-3 rounded-lg text-sm bg-green-50 border-l-4 border-success text-green-800" role="alert">
							Preferences saved.
						</div>
					{/if}

					<form
						method="POST"
						action="?/saveNotifications"
						use:enhance={() => {
							savingNotifications = true;
							return async ({ update }) => {
								savingNotifications = false;
								await update();
							};
						}}
					>
						<div class="space-y-4">
							<label class="flex items-start gap-3 cursor-pointer">
								<input
									type="checkbox"
									name="get_infoletter"
									bind:checked={getInfoletter}
									class="mt-0.5 h-5 w-5 rounded border-2 border-secondary-dark accent-primary"
								/>
								<div>
									<p class="text-sm font-medium text-headers">Community Newsletter</p>
									<p class="text-xs text-meta mt-0.5">
										Receive event announcements, community updates, and new problem notifications.
									</p>
								</div>
							</label>
							<label class="flex items-start gap-3 cursor-pointer">
								<input
									type="checkbox"
									name="audio_cues_enabled"
									bind:checked={audioCuesEnabled}
									class="mt-0.5 h-5 w-5 rounded border-2 border-secondary-dark accent-primary"
								/>
								<div>
									<p class="text-sm font-medium text-headers">Audio Cues</p>
									<p class="text-xs text-meta mt-0.5">
										Play sound alerts during live events (timer warnings, phase transitions).
									</p>
								</div>
							</label>

							<div class="flex justify-end">
								<Button
									type="submit"
									variant="secondary"
									disabled={savingNotifications}
								>
									{savingNotifications ? 'Saving...' : 'Save'}
								</Button>
							</div>
						</div>
					</form>
				</CardContent>
			</Card>

			<!-- Linked Accounts (read-only view) -->
			<Card elevation="resting">
				<CardHeader>
					<CardTitle class="flex items-center gap-2 text-base">
						<Link class="w-4 h-4 text-primary" />
						Linked Accounts
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="space-y-3">
						<div class="flex items-center justify-between py-2 border-b border-secondary">
							<span class="text-sm font-medium text-headers">GitHub</span>
							<span class="text-sm text-meta">Not linked</span>
						</div>
						<div class="flex items-center justify-between py-2">
							<span class="text-sm font-medium text-headers">LinkedIn</span>
							<span class="text-sm text-meta">Not linked</span>
						</div>
					</div>
					<p class="text-xs text-meta mt-3">Account linking will be available in a future update.</p>
				</CardContent>
			</Card>

			<!-- API Keys (B1–B4, Ch.18.8, Ch.19.3.42) -->
			<Card elevation="resting">
				<CardHeader>
					<div class="flex items-center justify-between">
						<CardTitle class="flex items-center gap-2 text-base">
							<KeyRound class="w-4 h-4 text-primary" />
							API Keys
						</CardTitle>
						{#if !showGenerateForm}
							<Button
								variant="secondary"
								onclick={() => { showGenerateForm = true; }}
							>
								+ Generate New Key
							</Button>
						{/if}
					</div>
				</CardHeader>
				<CardContent class="space-y-4">

					<!-- Description -->
					<p class="text-sm text-meta">
						API keys let your bot authenticate against the platform REST API on your behalf.
					</p>

					<!-- Key error message -->
					{#if form?.keyError}
						<div class="p-3 rounded-lg text-sm bg-red-50 border-l-4 border-alert text-red-800" role="alert">
							{form.keyError}
						</div>
					{/if}

					<!-- One-time key display (shown immediately after generation) -->
					{#if newKeyShown && newKeyText}
						<div class="rounded-lg border-2 border-primary/30 bg-primary/5 p-4 space-y-3">
							<div class="flex items-start gap-2">
								<span class="text-amber-600 text-lg leading-none">⚠</span>
								<div>
									<p class="text-sm font-semibold text-headers">Save this key now.</p>
									<p class="text-xs text-meta">It will not be shown again.</p>
								</div>
							</div>
							<div class="flex items-center gap-2">
								<code class="flex-1 font-mono text-sm bg-canvas rounded px-3 py-2 text-headers break-all">
									{newKeyText}
								</code>
								<button
									type="button"
									onclick={copyKey}
									class="shrink-0 p-2 rounded-lg hover:bg-canvas transition-colors text-meta hover:text-primary"
									title="Copy key"
								>
									{#if keyCopied}
										<Check class="w-5 h-5 text-success" />
									{:else}
										<Copy class="w-5 h-5" />
									{/if}
								</button>
							</div>
							<div class="flex justify-end">
								<Button variant="default" onclick={dismissNewKey}>
									I've saved my key
								</Button>
							</div>
						</div>
					{/if}

					<!-- Generate new key form (inline) -->
					{#if showGenerateForm}
						<div class="rounded-lg border border-secondary bg-canvas/50 p-4">
							<p class="text-sm font-medium text-headers mb-3">Generate New API Key</p>
							<form
								method="POST"
								action="?/generateKey"
								use:enhance={() => {
									generatingKey = true;
									return async ({ update }) => {
										generatingKey = false;
										await update();
									};
								}}
							>
								<div class="space-y-3">
									<div>
										<label for="key-label" class="text-xs font-medium text-meta uppercase tracking-wide block mb-1">
											Label (optional)
										</label>
										<input
											id="key-label"
											type="text"
											name="label"
											bind:value={keyLabel}
											maxlength="100"
											placeholder="e.g. My Claude Bot"
											class="w-full h-10 px-3 rounded-[var(--radius-input)] border border-secondary bg-card text-headers text-sm placeholder:text-meta focus:outline-none focus:ring-2 focus:ring-primary/30"
										/>
									</div>
									<div class="flex gap-2 justify-end">
										<Button
											type="button"
											variant="ghost"
											onclick={() => { showGenerateForm = false; keyLabel = ''; }}
											disabled={generatingKey}
										>
											Cancel
										</Button>
										<Button
											type="submit"
											variant="default"
											disabled={generatingKey}
										>
											{#if generatingKey}
												<Loader2 class="w-4 h-4 mr-2 animate-spin" />
												Generating...
											{:else}
												Generate Key
											{/if}
										</Button>
									</div>
								</div>
							</form>
						</div>
					{/if}

					<!-- Key list -->
					{#if data.apiKeys.length === 0 && !showGenerateForm}
						<p class="text-sm text-meta text-center py-4">
							No API keys yet. Generate your first key to enable bot access.
						</p>
					{:else}
						<div class="space-y-2">
							{#each data.apiKeys as key (key.api_key_id)}
								<div class="rounded-lg border border-secondary p-3">
									<!-- Key header row -->
									<div class="flex items-start justify-between gap-2">
										<div class="min-w-0">
											<div class="flex items-center gap-2 flex-wrap">
												<code class="font-mono text-sm text-headers font-semibold">{key.display_prefix}</code>
												{#if key.label}
													<span class="text-sm text-labels">"{key.label}"</span>
												{/if}
												<!-- Status badge -->
												{#if key.status === 'active'}
													<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-success/10 text-success">
														<CircleDot class="w-3 h-3" />
														Active
													</span>
												{:else if key.status === 'revoked'}
													<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-alert/10 text-alert">
														<CircleX class="w-3 h-3" />
														Revoked
													</span>
												{:else}
													<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-pending/10 text-pending">
														<CircleMinus class="w-3 h-3" />
														Expired
													</span>
												{/if}
											</div>
											{#if key.bot_display_name}
												<p class="text-xs text-meta mt-0.5">{key.bot_display_name}</p>
											{/if}
											<p class="text-xs text-meta mt-0.5">Created {formatDate(key.created_at)}</p>
											{#if key.revoked_at}
												<p class="text-xs text-meta">Revoked {formatDate(key.revoked_at)}</p>
											{/if}
										</div>

										<!-- Revoke button (active keys only) -->
										{#if key.status === 'active'}
											{#if revokingKeyId === key.api_key_id}
												<!-- Inline confirmation -->
												<div class="flex items-center gap-2 shrink-0">
													<span class="text-xs text-alert font-medium">Revoke?</span>
													<form
														method="POST"
														action="?/revokeKey"
														use:enhance={() => {
															submittingRevoke = true;
															return async ({ update }) => {
																submittingRevoke = false;
																revokingKeyId = null;
																await update();
															};
														}}
													>
														<input type="hidden" name="api_key_id" value={key.api_key_id} />
														<Button
															type="submit"
															variant="destructive"
															class="h-7 px-2 text-xs"
															disabled={submittingRevoke}
														>
															{submittingRevoke ? 'Revoking...' : 'Confirm'}
														</Button>
													</form>
													<Button
														type="button"
														variant="ghost"
														class="h-7 px-2 text-xs"
														onclick={() => (revokingKeyId = null)}
													>
														Cancel
													</Button>
												</div>
											{:else}
												<Button
													type="button"
													variant="ghost"
													class="h-7 px-2 text-xs text-alert hover:text-alert hover:bg-alert/10 shrink-0"
													onclick={() => (revokingKeyId = key.api_key_id)}
												>
													Revoke
												</Button>
											{/if}
										{/if}
									</div>
								</div>
							{/each}
						</div>
					{/if}

				</CardContent>
			</Card>

		</div>
	</div>
</div>
