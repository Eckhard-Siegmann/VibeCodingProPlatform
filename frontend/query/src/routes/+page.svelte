<script lang="ts">
	import PageContainer from '$lib/components/layout/PageContainer.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
</script>

<svelte:head>
	<title>VibeCoding Assessment - Demo</title>
</svelte:head>

<PageContainer>
	<div class="text-center py-8">
		<h1 class="text-3xl font-bold text-headers mb-4">VibeCoding Meetup</h1>
		<p class="text-labels mb-8">Assessment Query Frontend Demo</p>

		<div class="grid gap-4 max-w-md mx-auto">
			<Card>
				<h2 class="font-semibold text-headers mb-2">Pitch Assessment</h2>
				<p class="text-sm text-labels mb-4">
					6 items - Rate problem importance, clarity, and alignment during live pitches
				</p>
				<a href="/assess/pitch-001" class="block">
					<Button variant="primary" fullWidth>
						Try Pitch Assessment
					</Button>
				</a>
			</Card>

			<Card>
				<h2 class="font-semibold text-headers mb-2">Review Assessment</h2>
				<p class="text-sm text-labels mb-4">
					10 items - Evaluate solution correctness, code quality, and completeness
				</p>
				<a href="/assess/review-001" class="block">
					<Button variant="secondary" fullWidth>
						Try Review Assessment
					</Button>
				</a>
			</Card>
		</div>
	</div>
</PageContainer>
