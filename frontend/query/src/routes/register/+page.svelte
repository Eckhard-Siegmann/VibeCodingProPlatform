<script lang="ts">
	import PageContainer from '$lib/components/layout/PageContainer.svelte';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft } from '@lucide/svelte';
</script>

<svelte:head>
	<title>Register - VibeCoding</title>
</svelte:head>

<PageContainer>
	<Card elevation="resting" padding="lg" class="max-w-2xl mx-auto">
		<div class="text-center">
			<h1 class="text-2xl md:text-3xl font-bold text-headers mb-4">Register</h1>
			<p class="text-lg text-labels mb-6">
				Registration is currently in development.
			</p>
			<div class="bg-canvas/50 rounded-lg p-6 mb-6">
				<p class="text-sm text-meta mb-3">
					For MVP, all users share a demo account. You can explore the full platform without
					registration.
				</p>
				<p class="text-xs text-meta">
					Full authentication (email/password, GitHub OAuth, LinkedIn OAuth) will be available in
					the production release per Chapter 18 specification.
				</p>
			</div>
			<a href="/">
				<Button variant="default" size="lg">
					<ArrowLeft class="w-4 h-4 mr-2" />
					Back to Home
				</Button>
			</a>
		</div>
	</Card>
</PageContainer>
