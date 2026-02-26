<script lang="ts">
	import { Card } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import EmptyState from '$lib/components/ui/empty-state/empty-state.svelte';
	import { cn } from '$lib/utils';
	import { formatRelative } from '$lib/utils/date-formatting';
	import {
		MessageSquare,
		FileText,
		Users,
		CheckCircle,
		XCircle,
		RefreshCw,
		Zap
	} from '@lucide/svelte';

	export type ActivityType =
		| 'problem_submitted'
		| 'problem_accepted'
		| 'problem_rejected'
		| 'decision_made'
		| 'team_joined'
		| 'chat_message'
		| 'lesson_learned';

	export interface ActivityItem {
		id: string;
		type: ActivityType;
		title: string;
		description?: string;
		timestamp: Date | string;
		actor?: {
			id: string;
			displayName: string;
		};
		problemTitle?: string;
		problemSlug?: string;
		href?: string;
	}

	interface Props {
		activities: ActivityItem[];
		totalCount?: number;
		loadMoreUrl?: string;
		maxTotal?: number;
		title?: string;
		class?: string;
	}

	let {
		activities,
		totalCount = 0,
		loadMoreUrl,
		maxTotal = 50,
		title = 'Recent Activity',
		class: className
	}: Props = $props();

	// Internal state for "Load More" append pagination
	let allActivities = $state<ActivityItem[]>([]);
	let loading = $state(false);

	// Sync initial activities from prop
	$effect(() => {
		allActivities = [...activities];
	});

	const showLoadMore = $derived(
		loadMoreUrl &&
		allActivities.length < totalCount &&
		allActivities.length < maxTotal
	);

	async function loadMore() {
		if (!loadMoreUrl || loading) return;
		loading = true;
		try {
			const res = await fetch(`${loadMoreUrl}?offset=${allActivities.length}&limit=10`);
			if (!res.ok) throw new Error('Failed to load activity');
			const data = await res.json();
			if (data.items?.length > 0) {
				allActivities = [...allActivities, ...data.items.map((a: any) => ({
					id: a.id,
					type: a.type ?? 'decision_made',
					title: a.title,
					description: a.description ?? undefined,
					actor: a.actorId ? { id: a.actorId, displayName: a.actorDisplayName } : undefined,
					problemTitle: a.problemTitle ?? undefined,
					problemSlug: a.problemSlug ?? undefined,
					href: a.problemSlug ? `/problem/${a.problemSlug}` : undefined,
					timestamp: a.timestamp
				}))];
			}
		} catch {
			// Error handled silently — items unchanged, button re-enabled
		} finally {
			loading = false;
		}
	}

	const activityIcons: Record<ActivityType, typeof FileText> = {
		problem_submitted: FileText,
		problem_accepted: CheckCircle,
		problem_rejected: XCircle,
		decision_made: Zap,
		team_joined: Users,
		chat_message: MessageSquare,
		lesson_learned: RefreshCw
	};

	const activityColors: Record<ActivityType, string> = {
		problem_submitted: 'text-primary bg-primary/10',
		problem_accepted: 'text-success bg-success/10',
		problem_rejected: 'text-alert bg-alert/10',
		decision_made: 'text-purple bg-purple-bg',
		team_joined: 'text-primary bg-primary/10',
		chat_message: 'text-labels bg-canvas',
		lesson_learned: 'text-warning bg-warning-bg'
	};
</script>

<section class={cn('space-y-3', className)}>
	{#if title}
		<div class="flex items-center justify-between">
			<h2 class="text-lg font-semibold text-headers">
				{title}
				{#if totalCount > 0}
					<span class="text-sm font-normal text-labels">({totalCount})</span>
				{/if}
			</h2>
		</div>
	{/if}

	{#if allActivities.length === 0}
		<EmptyState
			icon="📊"
			title="No recent activity"
			message="Activity will appear here as the community gets busy."
		/>
	{:else}
		<Card elevation="resting" padding="none">
			<ul class="divide-y divide-secondary">
				{#each allActivities as activity (activity.id)}
					{@const IconComponent = activityIcons[activity.type]}
					{@const iconColorClass = activityColors[activity.type]}

					<li>
						{#if activity.href}
							<a
								href={activity.href}
								class="flex items-start gap-3 px-4 py-3 hover:bg-canvas/50 transition-colors"
							>
								{@render activityContent(activity, IconComponent, iconColorClass)}
							</a>
						{:else}
							<div class="flex items-start gap-3 px-4 py-3">
								{@render activityContent(activity, IconComponent, iconColorClass)}
							</div>
						{/if}
					</li>
				{/each}
			</ul>
		</Card>

		{#if showLoadMore}
			<div class="pt-1">
				<Button variant="outline" size="sm" onclick={loadMore} disabled={loading}>
					{loading ? 'Loading...' : `Load more activity (showing ${allActivities.length} of ${totalCount})`}
				</Button>
			</div>
		{/if}
	{/if}
</section>

{#snippet activityContent(activity: ActivityItem, IconComponent: typeof FileText, iconColorClass: string)}
	<span class={cn('p-2 rounded-lg flex-shrink-0', iconColorClass)}>
		<IconComponent class="w-4 h-4" />
	</span>

	<div class="flex-1 min-w-0 space-y-0.5">
		<p class="text-sm text-headers">
			{#if activity.actor}
				<span class="font-medium">{activity.actor.displayName}</span>
				{' '}
			{/if}
			{activity.title}
		</p>

		{#if activity.description}
			<p class="text-xs text-labels line-clamp-2">{activity.description}</p>
		{/if}

		{#if activity.problemTitle}
			<p class="text-xs text-primary">
				{activity.problemTitle}
			</p>
		{/if}
	</div>

	<time class="text-xs text-meta flex-shrink-0 whitespace-nowrap">
		{formatRelative(activity.timestamp)}
	</time>
{/snippet}
