<script lang="ts">
	import PageContainer from '$lib/components/layout/PageContainer.svelte';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft, Eye } from '@lucide/svelte';
</script>

<svelte:head>
	<title>Create Problem - VibeCoding</title>
</svelte:head>

<PageContainer>
	<Card elevation="resting" padding="lg" class="max-w-2xl mx-auto">
		<div class="text-center">
			<h1 class="text-2xl md:text-3xl font-bold text-headers mb-4">Create Problem</h1>
			<p class="text-lg text-labels mb-6">
				Problem creation form is currently in development.
			</p>
			<div class="bg-canvas/50 rounded-lg p-6 mb-6">
				<p class="text-sm text-meta mb-4">
					View the existing demo problems to see the platform in action. The problem creation
					workflow includes:
				</p>
				<ul class="text-xs text-labels text-left space-y-2 mb-4">
					<li>• Draft with auto-save (edit title, description, acceptance criteria)</li>
					<li>• Link repositories and resources</li>
					<li>• Submit for moderator quality gate review</li>
					<li>• Iterate based on feedback</li>
					<li>• Get selected for events and pitched to teams</li>
				</ul>
				<p class="text-xs text-meta">
					Full problem creation workflow per Chapter 4 & 13 will be available soon.
				</p>
			</div>
			<div class="flex flex-col sm:flex-row gap-3 justify-center">
				<a href="/problem/111">
					<Button variant="default" size="lg">
						<Eye class="w-4 h-4 mr-2" />
						View Example Problem
					</Button>
				</a>
				<a href="/dashboard">
					<Button variant="outline" size="lg">
						<ArrowLeft class="w-4 h-4 mr-2" />
						Back to Dashboard
					</Button>
				</a>
			</div>
		</div>
	</Card>
</PageContainer>
