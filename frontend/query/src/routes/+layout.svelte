<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { Toaster } from '$lib/components/ui/toast';
	import EmailConfirmBanner from '$lib/components/layout/EmailConfirmBanner.svelte';
	import TopAppBar from '$lib/components/layout/TopAppBar.svelte';
	import BottomNavBar from '$lib/components/layout/BottomNavBar.svelte';
	import { page } from '$app/stores';
	import { audioStore } from '$lib/stores/audio';
	import { browser } from '$app/environment';

	let { data, children } = $props();

	// Auth pages don't show the banner (they have their own layout)
	const AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/set-password', '/confirm-email', '/auth/'];
	let isAuthPage = $derived(AUTH_ROUTES.some((r) => $page.url.pathname.startsWith(r)));
	let showBanner = $derived(
		data.user && !data.user.email_confirmed && !isAuthPage
	);

	// Navigation chrome visibility (Ch.12.7.5, Ch.26.16.3)
	// Hidden on landing page, auth pages, and when not logged in
	const NO_CHROME_ROUTES = ['/', ...AUTH_ROUTES];
	let showNavChrome = $derived(
		!!data.user &&
		!NO_CHROME_ROUTES.some((r) =>
			r.endsWith('/') ? $page.url.pathname.startsWith(r) : $page.url.pathname === r
		)
	);

	// Hydrate audio store from server-provided user preference (Ch.14.5.1, TICKET-27)
	$effect(() => {
		if (browser && data.user) {
			audioStore.setEnabled(data.user.audio_cues_enabled);
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>VibeCoding Assessment</title>
</svelte:head>

{#if showNavChrome && data.user}
	<TopAppBar user={{ display_name: data.user.display_name, user_id: data.user.user_id, email: data.user.email }} />
{/if}

{#if showBanner && data.user}
	<EmailConfirmBanner userEmail={data.user.email} userId={data.user.user_id} />
{/if}

<div class={showNavChrome ? 'pt-[var(--height-topbar-mobile)] pb-[var(--height-bottomnav-mobile)] md:pt-[var(--height-topbar-desktop)] md:pb-[var(--height-bottomnav-desktop)]' : ''}>
	{@render children()}
</div>

{#if showNavChrome && data.user}
	<BottomNavBar currentPath={$page.url.pathname} userRole={data.user.role} />
{/if}

<!-- Toast notification system - global -->
<Toaster />
