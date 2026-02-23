<script lang="ts">
	import { Card } from '$lib/components/ui/card';
	import { InitialAvatar } from '$lib/components/ui/initial-avatar';
	import EmptyState from '$lib/components/ui/empty-state/empty-state.svelte';
	import { cn } from '$lib/utils';
	import { Trophy, Star } from '@lucide/svelte';

	export interface Contributor {
		userId: string;
		displayName: string;
		points: number;
		stars: number;
		contributionCount: number;
	}

	interface Props {
		contributors: Contributor[];
		title?: string;
		showRank?: boolean;
		maxItems?: number;
		class?: string;
	}

	let {
		contributors,
		title = 'Top Contributors (Last 6 Weeks)',
		showRank = true,
		maxItems = 10,
		class: className
	}: Props = $props();

	// Sort and limit contributors
	const rankedContributors = $derived(
		[...contributors]
			.sort((a, b) => {
				// Primary: points descending
				if (b.points !== a.points) return b.points - a.points;
				// Tie-breaker: contribution count descending
				return b.contributionCount - a.contributionCount;
			})
			.slice(0, maxItems)
	);

	const topThree = $derived(rankedContributors.slice(0, 3));
	const restContributors = $derived(rankedContributors.slice(3));

	// Medal emojis for top 3
	const medals = ['first', 'second', 'third'] as const;
	const medalEmoji = {
		first: String.fromCodePoint(0x1f947),
		second: String.fromCodePoint(0x1f948),
		third: String.fromCodePoint(0x1f949)
	};
	const medalColors = {
		first: 'from-amber-100 to-amber-50 border-amber-200',
		second: 'from-slate-100 to-slate-50 border-slate-200',
		third: 'from-orange-100 to-orange-50 border-orange-200'
	};

	// Generate star display
	function renderStars(count: number): string {
		if (count === 0) return '';
		return Array(Math.min(count, 5)).fill(String.fromCodePoint(0x2b50)).join('');
	}
</script>

<section class={cn('space-y-4', className)}>
	{#if title}
		<h2 class="text-xl font-semibold text-headers flex items-center gap-2">
			<Trophy class="w-5 h-5 text-primary" />
			{title}
		</h2>
	{/if}

	{#if contributors.length === 0}
		<EmptyState
			icon="👥"
			title="No contributors yet"
			message="Be the first to contribute by rating problems or adding lessons learned."
		/>
	{:else}
		<!-- Top 3 Podium Section -->
		{#if topThree.length > 0}
			<div class="space-y-3">
				<!-- 1st Place (if exists) -->
				{#if topThree[0]}
					{@const c = topThree[0]}
					<Card
						elevation="resting"
						padding="md"
						class={cn(
							'bg-gradient-to-r border-2',
							medalColors.first
						)}
					>
						<div class="flex items-center gap-4">
							<span class="text-3xl" aria-label="1st place">{medalEmoji.first}</span>
							<InitialAvatar userName={c.displayName} userId={c.userId} size="lg" />
							<div class="flex-1 min-w-0">
								<p class="font-semibold text-headers text-lg truncate">{c.displayName}</p>
								<p class="text-sm text-labels">{c.contributionCount} contributions</p>
							</div>
							<div class="text-right flex-shrink-0">
								<p class="text-2xl font-bold text-headers">{c.points} pts</p>
								{#if c.stars > 0}
									<p class="text-sm">{renderStars(c.stars)}</p>
								{/if}
							</div>
						</div>
					</Card>
				{/if}

				<!-- 2nd and 3rd Place side by side -->
				{#if topThree.length > 1}
					<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
						{#each [topThree[1], topThree[2]] as c, index}
							{#if c}
								{@const medal = medals[index + 1]}
								<Card
									elevation="resting"
									padding="sm"
									class={cn(
										'bg-gradient-to-r border',
										medalColors[medal]
									)}
								>
									<div class="flex items-center gap-3">
										<span class="text-2xl" aria-label="{index + 2}nd place">{medalEmoji[medal]}</span>
										<InitialAvatar userName={c.displayName} userId={c.userId} size="md" />
										<div class="flex-1 min-w-0">
											<p class="font-semibold text-headers truncate">{c.displayName}</p>
											<p class="text-xs text-labels">{c.contributionCount} contributions</p>
										</div>
										<div class="text-right flex-shrink-0">
											<p class="text-lg font-bold text-headers">{c.points} pts</p>
											{#if c.stars > 0}
												<p class="text-xs">{renderStars(c.stars)}</p>
											{/if}
										</div>
									</div>
								</Card>
							{/if}
						{/each}
					</div>
				{/if}
			</div>
		{/if}

		<!-- Rest of contributors (4-10) -->
		{#if restContributors.length > 0}
			<Card elevation="resting" padding="none">
				<ul class="divide-y divide-secondary">
					{#each restContributors as c, index (c.userId)}
						{@const rank = index + 4}
						<li class="flex items-center gap-3 px-4 py-3 hover:bg-canvas/50 transition-colors">
							{#if showRank}
								<span class="w-6 text-sm font-medium text-labels text-center">{rank}.</span>
							{/if}
							<InitialAvatar userName={c.displayName} userId={c.userId} size="sm" />
							<div class="flex-1 min-w-0">
								<p class="font-medium text-headers text-sm truncate">{c.displayName}</p>
							</div>
							<div class="flex items-center gap-4 text-sm">
								<span class="font-semibold text-headers">{c.points} pts</span>
								{#if c.stars > 0}
									<span class="inline-flex items-center gap-1">
										<Star class="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
										<span class="text-labels">{c.stars}</span>
									</span>
								{/if}
								<span class="text-labels hidden sm:inline">{c.contributionCount} contrib</span>
							</div>
						</li>
					{/each}
				</ul>
			</Card>
		{/if}
	{/if}
</section>
