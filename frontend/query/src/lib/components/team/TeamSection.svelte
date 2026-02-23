<script lang="ts">
	/**
	 * TeamSection - Team display with member list, breakout URL, and action buttons.
	 *
	 * Features per Ch.13.1, Ch.31.7:
	 * - Team members list with avatars
	 * - Breakout room URL (editable by team members)
	 * - Join as Dev button (for non-members when coding is active)
	 * - Retire from Team button (for active members)
	 * - Rejoin Team button (for retired members)
	 */
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import TeamMemberList, { type TeamMember } from './TeamMemberList.svelte';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import Video from '@lucide/svelte/icons/video';
	import UserPlus from '@lucide/svelte/icons/user-plus';
	import UserMinus from '@lucide/svelte/icons/user-minus';
	import UserCheck from '@lucide/svelte/icons/user-check';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		members: TeamMember[];
		breakoutUrl?: string | null;
		currentUserId?: string;
		canJoin?: boolean;         // User can join (authenticated + coding active)
		canEditBreakout?: boolean; // User can edit breakout URL (is team member)
		onJoin?: () => void;
		onRetire?: () => void;
		onRejoin?: () => void;
		onUpdateBreakout?: (url: string) => void;
		class?: string;
	}

	let {
		members,
		breakoutUrl,
		currentUserId,
		canJoin = false,
		canEditBreakout = false,
		onJoin,
		onRetire,
		onRejoin,
		onUpdateBreakout,
		class: className,
		...restProps
	}: Props = $props();

	// Determine user's team status
	const userMembership = $derived.by(() => {
		if (!currentUserId) return null;
		return members.find((m) => m.userId === currentUserId) || null;
	});

	const isActiveMember = $derived(userMembership?.status === 'active');
	const isRetiredMember = $derived(userMembership?.status === 'retired');

	// Breakout URL editing state
	let isEditingBreakout = $state(false);
	let editBreakoutValue = $state('');

	function startEditBreakout() {
		editBreakoutValue = breakoutUrl || '';
		isEditingBreakout = true;
	}

	function cancelEditBreakout() {
		isEditingBreakout = false;
		editBreakoutValue = '';
	}

	function saveBreakoutUrl() {
		if (editBreakoutValue.trim()) {
			onUpdateBreakout?.(editBreakoutValue.trim());
		}
		isEditingBreakout = false;
	}

	function handleJoin() {
		onJoin?.();
	}

	function handleRetire() {
		onRetire?.();
	}

	function handleRejoin() {
		onRejoin?.();
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

<div class={cn('space-y-4', className)} {...restProps}>
	<!-- Team header -->
	<div class="flex items-center justify-between">
		<h3 class="text-sm font-semibold text-headers">
			Team
			{#if members.length > 0}
				<span class="text-meta font-normal">({members.length})</span>
			{/if}
		</h3>
	</div>

	<!-- Team members list -->
	{#if members.length > 0}
		<TeamMemberList {members} />
	{:else}
		<p class="text-sm text-meta italic">No team members yet.</p>
	{/if}

	<!-- Breakout Room URL -->
	<div class="pt-2 border-t border-secondary">
		<div class="flex items-center gap-2 mb-2">
			<Video class="w-4 h-4 text-icon" />
			<span class="text-sm font-medium text-headers">Breakout Room</span>
		</div>

		{#if isEditingBreakout}
			<!-- Edit mode -->
			<div class="flex gap-2">
				<input
					type="url"
					bind:value={editBreakoutValue}
					placeholder="https://meet.google.com/..."
					class={cn(
						'flex-1 px-3 py-2 text-sm rounded-[var(--radius-card)]',
						'border border-secondary bg-card text-headers',
						'focus:outline-none focus:ring-2 focus:ring-primary/50'
					)}
				/>
				<Button variant="default" size="sm" onclick={saveBreakoutUrl}>Save</Button>
				<Button variant="ghost" size="sm" onclick={cancelEditBreakout}>Cancel</Button>
			</div>
		{:else if breakoutUrl}
			<!-- Display mode with URL -->
			<div class="flex items-center gap-2">
				<a
					href={breakoutUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="flex items-center gap-1.5 text-sm text-primary hover:underline"
				>
					<span>{getUrlDomain(breakoutUrl)}</span>
					<ExternalLink class="w-3.5 h-3.5" />
				</a>
				{#if canEditBreakout}
					<Button variant="ghost" size="sm" onclick={startEditBreakout}>
						Edit
					</Button>
				{/if}
			</div>
		{:else if canEditBreakout}
			<!-- No URL, can add -->
			<Button variant="outline" size="sm" onclick={startEditBreakout}>
				Add breakout room URL
			</Button>
		{:else}
			<!-- No URL, can't add -->
			<p class="text-sm text-meta italic">No breakout room set.</p>
		{/if}
	</div>

	<!-- Action buttons -->
	<div class="pt-2 border-t border-secondary">
		{#if !userMembership && canJoin}
			<!-- Not a member, can join -->
			<Button variant="default" fullWidth onclick={handleJoin}>
				<UserPlus class="w-4 h-4 mr-2" />
				Join as Dev
			</Button>
			<p class="mt-1 text-xs text-meta text-center">
				Join the team working on this problem.
			</p>
		{:else if isActiveMember}
			<!-- Active member, can retire -->
			<Button variant="secondary" fullWidth onclick={handleRetire}>
				<UserMinus class="w-4 h-4 mr-2" />
				Retire from Team
			</Button>
		{:else if isRetiredMember}
			<!-- Retired member, can rejoin -->
			<Button variant="outline" fullWidth onclick={handleRejoin}>
				<UserCheck class="w-4 h-4 mr-2" />
				Rejoin Team
			</Button>
		{:else if !currentUserId}
			<!-- Not authenticated -->
			<p class="text-sm text-meta text-center">
				Sign in to join the team.
			</p>
		{:else if !canJoin}
			<!-- Authenticated but can't join (not coding phase) -->
			<p class="text-sm text-meta text-center italic">
				Team formation opens when coding starts.
			</p>
		{/if}
	</div>
</div>
