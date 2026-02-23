<script lang="ts">
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { cn } from '$lib/utils';
	import { Zap, ArrowRight, Clock, CheckCircle } from '@lucide/svelte';

	export interface OpenAssessment {
		assessmentId: string;
		type: 'pitch' | 'review';
		problemTitle: string;
		problemSlug: string;
		description?: string;
		closesAt?: Date | string;
		userCompleted?: boolean;
	}

	interface Props {
		assessment?: OpenAssessment | null;
		class?: string;
	}

	let { assessment, class: className }: Props = $props();

	// Calculate time remaining
	const timeRemaining = $derived.by(() => {
		if (!assessment?.closesAt) return null;
		const closes =
			typeof assessment.closesAt === 'string'
				? new Date(assessment.closesAt)
				: assessment.closesAt;
		const now = new Date();
		const diffMs = closes.getTime() - now.getTime();

		if (diffMs <= 0) return 'Closing soon';

		const minutes = Math.floor(diffMs / (1000 * 60));
		if (minutes < 60) {
			return `${minutes}m remaining`;
		}
		const hours = Math.floor(minutes / 60);
		return `${hours}h ${minutes % 60}m remaining`;
	});

	const assessmentTypeLabel = $derived(
		assessment?.type === 'pitch' ? 'Pitch Assessment' : 'Review Assessment'
	);
</script>

<section class={cn(className)}>
	{#if assessment}
		<Card
			elevation="raised"
			padding="lg"
			class={cn(
				'border-2',
				assessment.userCompleted
					? 'border-success/30 bg-success/5'
					: 'border-primary/30 bg-primary/5'
			)}
		>
			<div class="flex flex-col gap-4">
				<!-- Header with icon and badge -->
				<div class="flex items-start justify-between gap-4">
					<div class="flex items-center gap-3">
						{#if assessment.userCompleted}
							<span class="p-2 rounded-full bg-success/10">
								<CheckCircle class="w-6 h-6 text-success" />
							</span>
						{:else}
							<span class="p-2 rounded-full bg-primary/10 animate-pulse">
								<Zap class="w-6 h-6 text-primary" />
							</span>
						{/if}

						<div>
							<Badge
								variant={assessment.type === 'pitch' ? 'selected_for_event' : 'closed'}
								class="mb-1"
							>
								{assessmentTypeLabel}
							</Badge>
							<h3 class="text-xl font-semibold text-headers">
								{#if assessment.userCompleted}
									Assessment Completed
								{:else}
									Now Open for Rating
								{/if}
							</h3>
						</div>
					</div>

					{#if timeRemaining && !assessment.userCompleted}
						<div class="flex items-center gap-1.5 text-sm text-warning flex-shrink-0">
							<Clock class="w-4 h-4" />
							<span class="font-medium">{timeRemaining}</span>
						</div>
					{/if}
				</div>

				<!-- Problem info -->
				<div>
					<p class="text-lg font-medium text-headers">{assessment.problemTitle}</p>
					{#if assessment.description}
						<p class="text-sm text-labels mt-1 line-clamp-2">{assessment.description}</p>
					{/if}
				</div>

				<!-- Action -->
				{#if assessment.userCompleted}
					<div class="flex items-center gap-3">
						<CheckCircle class="w-5 h-5 text-success" />
						<span class="text-success font-medium">You've completed this assessment</span>
					</div>
					<a href={`/problem/${assessment.problemSlug}`}>
						<Button variant="outline">
							View Problem
							<ArrowRight class="w-4 h-4 ml-2" />
						</Button>
					</a>
				{:else}
					<a href={`/assess/${assessment.assessmentId}`} class="block">
						<Button variant="default" size="lg" fullWidth>
							Go to Rating
							<ArrowRight class="w-4 h-4 ml-2" />
						</Button>
					</a>
				{/if}
			</div>
		</Card>
	{:else}
		<!-- No active assessment -->
		<Card elevation="resting" padding="lg" class="border border-secondary">
			<div class="flex items-center gap-4 text-center justify-center py-4">
				<div class="p-3 rounded-full bg-canvas">
					<Zap class="w-6 h-6 text-labels" />
				</div>
				<div class="text-left">
					<p class="text-lg font-medium text-headers">No Interactive Rating Open</p>
					<p class="text-sm text-labels">
						Assessments will appear here when a moderator opens voting.
					</p>
				</div>
			</div>
		</Card>
	{/if}
</section>
