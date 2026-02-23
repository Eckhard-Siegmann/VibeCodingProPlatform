<script lang="ts">
	/**
	 * ResourceList - Direct and helpful resources with add/edit/suggest/approve flows.
	 *
	 * Per Ch.13.2 and problem_card_design.md:
	 * - Two resource types: direct (essential) and helpful (reference)
	 * - PO/Team: Add, edit, delete resources
	 * - Observers: Suggest resources (requires approval)
	 * - Moderators: Add auto-approved
	 * - Shows pending suggestions to PO for approval
	 */
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Component } from 'svelte';
	import { cn } from '$lib/utils';
	import { Button } from '$lib/components/ui/button';
	import { ActionMenu, type ActionMenuItem } from '$lib/components/ui/action-menu';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import Plus from '@lucide/svelte/icons/plus';
	import Link from '@lucide/svelte/icons/link';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash from '@lucide/svelte/icons/trash-2';
	import Check from '@lucide/svelte/icons/check';
	import X from '@lucide/svelte/icons/x';
	import Clock from '@lucide/svelte/icons/clock';

	export type ResourceType = 'direct' | 'helpful';

	export interface Resource {
		resourceId: string;
		label: string;
		url: string;
		description?: string;
		resourceType: ResourceType;
		isPending?: boolean;
		suggestedBy?: string;
	}

	interface Props extends HTMLAttributes<HTMLDivElement> {
		resources: Resource[];
		resourceType: ResourceType;
		canAdd?: boolean;
		canEdit?: boolean;
		canSuggest?: boolean;
		canApprove?: boolean;
		showPendingSuggestions?: boolean;
		onAdd?: () => void;
		onEdit?: (resourceId: string) => void;
		onDelete?: (resourceId: string) => void;
		onSuggest?: () => void;
		onApprove?: (resourceId: string) => void;
		onReject?: (resourceId: string) => void;
		class?: string;
	}

	let {
		resources,
		resourceType,
		canAdd = false,
		canEdit = false,
		canSuggest = false,
		canApprove = false,
		showPendingSuggestions = false,
		onAdd,
		onEdit,
		onDelete,
		onSuggest,
		onApprove,
		onReject,
		class: className,
		...restProps
	}: Props = $props();

	// Title based on resource type
	const title = $derived(
		resourceType === 'direct' ? 'Direct Resources' : 'Helpful Artifacts'
	);

	const description = $derived(
		resourceType === 'direct'
			? 'Essential repositories and documentation for this problem.'
			: 'Reference materials, tools, and learning resources.'
	);

	// Split resources into approved and pending
	const approvedResources = $derived(resources.filter((r) => !r.isPending));
	const pendingSuggestions = $derived(resources.filter((r) => r.isPending));

	// Get action menu items for a resource
	function getResourceActions(resource: Resource): ActionMenuItem[] {
		const actions: ActionMenuItem[] = [];

		if (canEdit) {
			actions.push({
				label: 'Edit',
				icon: Pencil as Component<{ class?: string }>,
				onclick: () => onEdit?.(resource.resourceId)
			});
			actions.push({
				label: 'Delete',
				icon: Trash as Component<{ class?: string }>,
				variant: 'destructive',
				onclick: () => onDelete?.(resource.resourceId)
			});
		}

		return actions;
	}

	// Extract domain from URL for display
	function getUrlDomain(url: string): string {
		try {
			const urlObj = new URL(url);
			return urlObj.hostname.replace('www.', '');
		} catch {
			return url;
		}
	}
</script>

<div class={cn('space-y-3', className)} {...restProps}>
	<!-- Header with title and add button -->
	<div class="flex items-center justify-between">
		<div>
			<h4 class="text-sm font-medium text-headers">{title}</h4>
			<p class="text-xs text-meta">{description}</p>
		</div>
		<div class="flex items-center gap-2">
			{#if canSuggest}
				<Button variant="ghost" size="sm" onclick={onSuggest}>
					<Plus class="w-4 h-4 mr-1" />
					Suggest
				</Button>
			{/if}
			{#if canAdd}
				<Button variant="default" size="sm" onclick={onAdd}>
					<Plus class="w-4 h-4 mr-1" />
					Add
				</Button>
			{/if}
		</div>
	</div>

	<!-- Resource list -->
	{#if approvedResources.length === 0 && pendingSuggestions.length === 0}
		<div class="py-4 text-center text-sm text-meta">
			No resources yet.
		</div>
	{:else}
		<ul class="space-y-2">
			{#each approvedResources as resource (resource.resourceId)}
				<li
					class="flex items-center gap-3 p-2 bg-canvas/50 rounded-[var(--radius-card)] group"
				>
					<Link class="w-4 h-4 text-icon shrink-0" />
					<div class="flex-1 min-w-0">
						<a
							href={resource.url}
							target="_blank"
							rel="noopener noreferrer"
							class="text-sm text-primary hover:underline flex items-center gap-1"
						>
							<span class="truncate">{resource.label}</span>
							<ExternalLink class="w-3 h-3 shrink-0" />
						</a>
						<p class="text-xs text-meta truncate">{getUrlDomain(resource.url)}</p>
						{#if resource.description}
							<p class="text-xs text-labels mt-0.5 line-clamp-2">{resource.description}</p>
						{/if}
					</div>
					{#if canEdit}
						<div class="opacity-0 group-hover:opacity-100 transition-opacity">
							<ActionMenu
								actions={getResourceActions(resource)}
								align="end"
							/>
						</div>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}

	<!-- Pending suggestions (visible to PO/moderators who can approve) -->
	{#if showPendingSuggestions && pendingSuggestions.length > 0}
		<div class="pt-3 border-t border-secondary">
			<p class="text-xs font-medium text-labels mb-2 flex items-center gap-1">
				<Clock class="w-3 h-3" />
				Pending Suggestions ({pendingSuggestions.length})
			</p>
			<ul class="space-y-2">
				{#each pendingSuggestions as suggestion (suggestion.resourceId)}
					<li
						class="flex items-center gap-3 p-2 bg-warning-bg/30 rounded-[var(--radius-card)] border border-warning/20"
					>
						<Link class="w-4 h-4 text-warning shrink-0" />
						<div class="flex-1 min-w-0">
							<a
								href={suggestion.url}
								target="_blank"
								rel="noopener noreferrer"
								class="text-sm text-primary hover:underline flex items-center gap-1"
							>
								<span class="truncate">{suggestion.label}</span>
								<ExternalLink class="w-3 h-3 shrink-0" />
							</a>
							{#if suggestion.suggestedBy}
								<p class="text-xs text-meta">Suggested by {suggestion.suggestedBy}</p>
							{/if}
						</div>
						{#if canApprove}
							<div class="flex items-center gap-1 shrink-0">
								<button
									type="button"
									onclick={() => onApprove?.(suggestion.resourceId)}
									class="p-1.5 rounded-full bg-success/10 text-success hover:bg-success/20 transition-colors"
									title="Approve"
								>
									<Check class="w-4 h-4" />
								</button>
								<button
									type="button"
									onclick={() => onReject?.(suggestion.resourceId)}
									class="p-1.5 rounded-full bg-alert/10 text-alert hover:bg-alert/20 transition-colors"
									title="Reject"
								>
									<X class="w-4 h-4" />
								</button>
							</div>
						{/if}
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>
