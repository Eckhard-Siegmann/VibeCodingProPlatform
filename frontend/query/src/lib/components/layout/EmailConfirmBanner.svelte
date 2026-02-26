<!--
  Persistent email confirmation banner (Ch. 18.5, auth_pages_design.md).
  Shown when user.email_confirmed === false.
  Dismissal stored in sessionStorage (reappears on next login).
-->
<script lang="ts">
	import { X } from '@lucide/svelte';
	import { browser } from '$app/environment';

	interface Props {
		userEmail: string;
		userId: string;
	}

	let { userEmail, userId }: Props = $props();

	const DISMISS_KEY = 'email_confirm_banner_dismissed';

	let dismissed = $state(false);
	let resending = $state(false);
	let resent = $state(false);

	// Check sessionStorage on mount
	$effect(() => {
		if (browser) {
			dismissed = sessionStorage.getItem(DISMISS_KEY) === 'true';
		}
	});

	function dismiss() {
		dismissed = true;
		if (browser) {
			sessionStorage.setItem(DISMISS_KEY, 'true');
		}
	}

	async function resendConfirmation() {
		resending = true;
		try {
			const res = await fetch('/api/auth/resend-confirmation', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userId })
			});
			if (res.ok) {
				resent = true;
			}
		} catch {
			// Silently fail — user can try again
		} finally {
			resending = false;
		}
	}
</script>

{#if !dismissed}
	<div class="bg-yellow-50 border-b border-pending px-4 py-2.5 flex items-center justify-between gap-3 text-sm">
		<p class="text-labels flex-1">
			Please confirm your email address ({userEmail}) to receive event reminders and newsletters.
			{#if resent}
				<span class="text-success font-medium">Confirmation email sent!</span>
			{:else}
				<button
					onclick={resendConfirmation}
					disabled={resending}
					class="text-primary underline hover:no-underline disabled:text-meta disabled:cursor-wait"
				>
					{resending ? 'Sending...' : 'Resend confirmation email'}
				</button>
			{/if}
		</p>
		<button
			onclick={dismiss}
			class="text-labels hover:text-headers shrink-0 p-1"
			aria-label="Dismiss banner"
		>
			<X class="w-4 h-4" />
		</button>
	</div>
{/if}
