<script lang="ts">
	/**
	 * TeamMemberList - Ordered display of team members with avatars.
	 *
	 * Display order per Ch.13.1:
	 * 1. PO (first, with "(PO)" suffix)
	 * 2. PO Deputy (second, with "(PO deputy)" suffix)
	 * 3. Active Coders (alphabetical, no suffix)
	 * 4. Retired Members (grey, italic, "(retired)" suffix)
	 */
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';
	import { InitialAvatar } from '$lib/components/ui/initial-avatar';

	export type TeamMemberRole = 'po' | 'po_deputy' | 'coder';
	export type TeamMemberStatus = 'active' | 'retired';

	export interface TeamMember {
		userId: string;
		displayName: string;
		memberRole: TeamMemberRole;
		status: TeamMemberStatus;
		online?: boolean;
	}

	interface Props extends HTMLAttributes<HTMLUListElement> {
		members: TeamMember[];
		compact?: boolean;
		class?: string;
	}

	let { members, compact = false, class: className, ...restProps }: Props = $props();

	// Sort members by priority: PO > Deputy > Active Coders (alpha) > Retired (alpha)
	const sortedMembers = $derived.by(() => {
		const roleOrder: Record<TeamMemberRole, number> = {
			po: 0,
			po_deputy: 1,
			coder: 2
		};

		return [...members].sort((a, b) => {
			// Retired members last
			if (a.status !== b.status) {
				return a.status === 'retired' ? 1 : -1;
			}

			// Then by role
			if (a.memberRole !== b.memberRole) {
				return roleOrder[a.memberRole] - roleOrder[b.memberRole];
			}

			// Then alphabetically
			return a.displayName.localeCompare(b.displayName);
		});
	});

	// Get role suffix
	function getRoleSuffix(member: TeamMember): string {
		if (member.status === 'retired') return '(retired)';
		if (member.memberRole === 'po') return '(PO)';
		if (member.memberRole === 'po_deputy') return '(PO deputy)';
		return '';
	}

	// Get styling based on status
	function getMemberStyles(member: TeamMember): string {
		if (member.status === 'retired') {
			return 'text-meta italic';
		}
		return 'text-headers';
	}
</script>

<ul class={cn('space-y-1', className)} {...restProps}>
	{#each sortedMembers as member (member.userId)}
		<li
			class={cn(
				'flex items-center gap-2',
				compact ? 'py-1' : 'py-1.5',
				getMemberStyles(member)
			)}
		>
			<InitialAvatar
				userName={member.displayName}
				userId={member.userId}
				size={compact ? 'sm' : 'md'}
				online={member.online}
			/>
			<span class="text-sm">
				{member.displayName}
				{#if getRoleSuffix(member)}
					<span class="text-meta ml-1">{getRoleSuffix(member)}</span>
				{/if}
			</span>
		</li>
	{/each}
</ul>
