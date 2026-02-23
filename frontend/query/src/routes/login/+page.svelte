<script lang="ts">
	import PageContainer from '$lib/components/layout/PageContainer.svelte';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft } from '@lucide/svelte';
</script>

<svelte:head>
	<title>Sign In - VibeCoding</title>
</svelte:head>

<PageContainer>
	<Card elevation="resting" padding="lg" class="max-w-2xl mx-auto">
		<div class="text-center">
			<h1 class="text-2xl md:text-3xl font-bold text-headers mb-4">Sign In</h1>
			<p class="text-lg text-labels mb-6">
				Authentication is currently in development.
			</p>
			<div class="bg-canvas/50 rounded-lg p-6 mb-6">
				<p class="text-sm text-meta mb-3">
					For MVP, all users share a demo account. Explore the platform freely - no login required!
				</p>
				<ul class="text-xs text-labels text-left space-y-2 mb-4">
					<li>• View problem cards and assessments</li>
					<li>• Submit ratings during pitches and reviews</li>
					<li>• Browse events and see contributor rankings</li>
					<li>• Explore the admin and moderator interfaces</li>
				</ul>
				<p class="text-xs text-meta">
					Full authentication with OAuth providers will be available in production.
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
