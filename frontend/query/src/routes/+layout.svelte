<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { Toaster } from '$lib/components/ui/toast';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>VibeCoding Assessment</title>
</svelte:head>

{@render children()}

<!-- Toast notification system - global -->
<Toaster />
