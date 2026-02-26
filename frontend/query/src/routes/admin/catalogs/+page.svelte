<script lang="ts">
	import { CatalogEditor } from '$lib/components/admin';
	import type {
		SoftCatalogEntry,
		EmojiEntry,
		ContributionActionEntry,
		ReviewWeightEntry
	} from '$lib/components/admin/CatalogEditor.svelte';
	import { BackButton } from '$lib/components/ui/back-button';

	interface Props {
		data: {
			problemTypes: SoftCatalogEntry[];
			emojis: EmojiEntry[];
			lessonCategories: SoftCatalogEntry[];
			contributionWeights: ContributionActionEntry[];
			reviewWeights: ReviewWeightEntry[];
		};
	}

	let { data }: Props = $props();

	// Demo data fallbacks
	let problemTypes = $state(
		data.problemTypes.length > 0
			? data.problemTypes
			: [
					{ key: 'explorative', display_name: 'Explorative', description: 'Early-stage idea exploration', sort_order: 1, is_active: 1, created_at: '2026-01-15T10:00:00Z' },
					{ key: 'greenfield', display_name: 'Greenfield', description: 'New project from scratch', sort_order: 2, is_active: 1, created_at: '2026-01-15T10:00:00Z' },
					{ key: 'advanced_greenfield', display_name: 'Advanced Greenfield', description: 'Building on existing greenfield work', sort_order: 3, is_active: 1, created_at: '2026-01-15T10:00:00Z' },
					{ key: 'brownfield', display_name: 'Brownfield', description: 'Existing codebase with constraints', sort_order: 4, is_active: 1, created_at: '2026-01-15T10:00:00Z' },
					{ key: 'reverse_engineering', display_name: 'Reverse Engineering', description: 'Understanding existing system', sort_order: 5, is_active: 1, created_at: '2026-01-15T10:00:00Z' },
					{ key: 'other', display_name: 'Other', description: 'Does not fit other categories', sort_order: 6, is_active: 1, created_at: '2026-01-15T10:00:00Z' }
				]
	);

	let emojis = $state(
		data.emojis.length > 0
			? data.emojis
			: [
					{ emoji: '👍', display_name: 'Thumbs Up', sort_order: 1, is_active: 1 },
					{ emoji: '👎', display_name: 'Thumbs Down', sort_order: 2, is_active: 1 },
					{ emoji: '❤️', display_name: 'Heart', sort_order: 3, is_active: 1 },
					{ emoji: '🎉', display_name: 'Celebrate', sort_order: 4, is_active: 1 },
					{ emoji: '🤔', display_name: 'Thinking', sort_order: 5, is_active: 1 },
					{ emoji: '👀', display_name: 'Eyes', sort_order: 6, is_active: 1 },
					{ emoji: '🔥', display_name: 'Fire', sort_order: 7, is_active: 1 },
					{ emoji: '✅', display_name: 'Check', sort_order: 8, is_active: 1 },
					{ emoji: '💡', display_name: 'Idea', sort_order: 9, is_active: 1 },
					{ emoji: '🙏', display_name: 'Thanks', sort_order: 10, is_active: 1 }
				]
	);

	let lessonCategories = $state(
		data.lessonCategories.length > 0
			? data.lessonCategories
			: [
					{ key: 'tooling', display_name: 'Tooling', description: 'Insights about agentic tools, IDEs, configurations', sort_order: 1, is_active: 1, created_at: '2026-01-15T10:00:00Z' },
					{ key: 'architecture', display_name: 'Architecture', description: 'Design patterns, structure, system organization', sort_order: 2, is_active: 1, created_at: '2026-01-15T10:00:00Z' },
					{ key: 'process', display_name: 'Process', description: 'Workflow, collaboration, methodology learnings', sort_order: 3, is_active: 1, created_at: '2026-01-15T10:00:00Z' },
					{ key: 'gotcha', display_name: 'Gotcha', description: 'Pitfalls, surprises, things that caught us off guard', sort_order: 4, is_active: 1, created_at: '2026-01-15T10:00:00Z' },
					{ key: 'performance', display_name: 'Performance', description: 'Speed, efficiency, optimization insights', sort_order: 5, is_active: 1, created_at: '2026-01-15T10:00:00Z' },
					{ key: 'testing', display_name: 'Testing', description: 'Test strategies, coverage, verification approaches', sort_order: 6, is_active: 1, created_at: '2026-01-15T10:00:00Z' }
				]
	);

	let contributionWeights = $state(
		data.contributionWeights.length > 0
			? data.contributionWeights
			: [
					{ action_key: 'review_assessment_completed', display_name: 'Review Assessment', description: 'Completed a review assessment', default_points: 1, current_points: 1, is_active: 1, created_at: '2026-01-15T10:00:00Z' },
					{ action_key: 'valuable_contribution', display_name: 'Valuable Contribution', description: 'Chat message or lesson with 2+ reactions', default_points: 1, current_points: 1, is_active: 1, created_at: '2026-01-15T10:00:00Z' },
					{ action_key: 'problem_submitted', display_name: 'Problem Submitted', description: 'Submitted a problem for review', default_points: 1, current_points: 1, is_active: 1, created_at: '2026-01-15T10:00:00Z' },
					{ action_key: 'problem_elected_pitch', display_name: 'Problem Pitched', description: 'Own problem selected for pitch phase', default_points: 1, current_points: 1, is_active: 1, created_at: '2026-01-15T10:00:00Z' },
					{ action_key: 'problem_elected_coding', display_name: 'Problem Coded', description: 'Own problem selected for coding sprint', default_points: 1, current_points: 1, is_active: 1, created_at: '2026-01-15T10:00:00Z' }
				]
	);

	let reviewWeights = $state(
		data.reviewWeights.length > 0
			? data.reviewWeights
			: [
					{ weight_key: 'live_review', display_name: 'Live Review', weight_multiplier: 1.0, description: 'Review during event (time-constrained)', is_active: 1, created_at: '2026-01-15T10:00:00Z' },
					{ weight_key: 'post_event_review', display_name: 'Post-Event Review', weight_multiplier: 1.5, description: 'Review after event (more time to verify)', is_active: 1, created_at: '2026-01-15T10:00:00Z' },
					{ weight_key: 'agent_review', display_name: 'Agent Review', weight_multiplier: 0.5, description: 'AI agent assessment (supporting, not authoritative)', is_active: 1, created_at: '2026-01-15T10:00:00Z' }
				]
	);
</script>

<svelte:head>
	<title>Catalog Management | VibeCoding Admin</title>
</svelte:head>

<div class="min-h-screen bg-viewport">
	<div class="max-w-4xl mx-auto px-4 py-6 md:py-8">
		<!-- Header -->
		<div class="mb-6">
			<BackButton href="/admin" label="Admin" />
			<h1 class="text-2xl md:text-3xl font-bold text-headers mt-2">Catalog & Weight Management</h1>
			<p class="text-meta mt-1">Manage classification vocabularies and scoring weights</p>
		</div>

		<!-- Catalog Editor -->
		<CatalogEditor
			bind:problemTypes
			bind:emojis
			bind:lessonCategories
			bind:contributionWeights
			bind:reviewWeights
		/>
	</div>
</div>
