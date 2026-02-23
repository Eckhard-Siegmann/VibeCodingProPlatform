<script lang="ts">
	import { Card } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { InitialAvatar } from '$lib/components/ui/initial-avatar';
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
		title?: string;
		maxItems?: number;
		showViewAll?: boolean;
		viewAllHref?: string;
		class?: string;
	}

	let {
		activities,
		title = 'Recent Activity',
		maxItems = 10,
		showViewAll = false,
		viewAllHref = '/activity',
		class: className
	}: Props = $props();

	const displayedActivities = $derived(activities.slice(0, maxItems));

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
			<h2 class="text-lg font-semibold text-headers">{title}</h2>
			{#if showViewAll && activities.length > maxItems}
				<a href={viewAllHref} class="text-sm text-primary hover:underline">View all</a>
			{/if}
		</div>
	{/if}

	{#if activities.length === 0}
		<EmptyState
			icon="📊"
			title="No recent activity"
			message="Activity will appear here as the community gets busy."
		/>
	{:else}
		<Card elevation="resting" padding="none">
			<ul class="divide-y divide-secondary">
				{#each displayedActivities as activity (activity.id)}
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
