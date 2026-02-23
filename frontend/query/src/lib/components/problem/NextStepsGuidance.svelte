<script lang="ts">
	/**
	 * NextStepsGuidance - Role-specific contextual actions panel.
	 *
	 * Per Ch.13.6.3 and problem_card_design.md:
	 * - Based on current state and user role, shows contextual guidance
	 * - Different panels for PO, Participant, and Moderator
	 * - Provides actionable next steps with clear CTAs
	 */
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';
	import { Button } from '$lib/components/ui/button';
	import { Card } from '$lib/components/ui/card';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import Vote from '@lucide/svelte/icons/vote';
	import UserPlus from '@lucide/svelte/icons/user-plus';
	import Edit from '@lucide/svelte/icons/edit';
	import Eye from '@lucide/svelte/icons/eye';
	import MessageSquare from '@lucide/svelte/icons/message-square';
	import CheckCircle from '@lucide/svelte/icons/check-circle';

	type ReadinessState = 'draft' | 'submitted' | 'needs_changes' | 'ready' | 'rejected';
	type ActionState =
		| 'backlog'
		| 'selected_for_event'
		| 'selected_for_coding'
		| 'deferred'
		| 'dropped'
		| 'closed';
	type UserRole =
		| 'observer'
		| 'developer'
		| 'problem_owner'
		| 'coding_partner'
		| 'moderator'
		| 'admin';

	export interface GuidanceAction {
		label: string;
		variant?: 'default' | 'secondary' | 'ghost';
		onclick: () => void;
	}

	interface Props extends HTMLAttributes<HTMLDivElement> {
		readinessState: ReadinessState;
		actionState: ActionState;
		userRole: UserRole;
		isPitchOpen?: boolean;
		isReviewOpen?: boolean;
		isOwner?: boolean;
		isMember?: boolean;
		actions?: GuidanceAction[];
		onSubmit?: () => void;
		onEdit?: () => void;
		onViewFeedback?: () => void;
		onVotePitch?: () => void;
		onVoteReview?: () => void;
		onJoinTeam?: () => void;
		class?: string;
	}

	let {
		readinessState,
		actionState,
		userRole,
		isPitchOpen = false,
		isReviewOpen = false,
		isOwner = false,
		isMember = false,
		actions = [],
		onSubmit,
		onEdit,
		onViewFeedback,
		onVotePitch,
		onVoteReview,
		onJoinTeam,
		class: className,
		...restProps
	}: Props = $props();

	// Derive the role category
	const isModerator = $derived(userRole === 'moderator' || userRole === 'admin');
	const isPO = $derived(isOwner || userRole === 'problem_owner');

	// Determine the guidance message and actions based on state and role
	const guidance = $derived.by(() => {
		// Problem Owner guidance
		if (isPO) {
			switch (readinessState) {
				case 'draft':
					return {
						message: 'Ready to share?',
						icon: ArrowRight,
						primaryAction: onSubmit
							? { label: 'Submit for Review', onclick: onSubmit }
							: null
					};
				case 'submitted':
					return {
						message: 'Waiting for moderator review. Check chat for feedback.',
						icon: Eye,
						primaryAction: null
					};
				case 'needs_changes':
					return {
						message: 'Moderators requested updates.',
						icon: Edit,
						primaryAction: onEdit ? { label: 'Edit Problem', onclick: onEdit } : null,
						secondaryAction: onViewFeedback
							? { label: 'View Feedback', onclick: onViewFeedback }
							: null
					};
				case 'ready':
					if (actionState === 'selected_for_coding') {
						return {
							message: 'Teams are working! Check the chat for progress.',
							icon: MessageSquare,
							primaryAction: null
						};
					}
					return {
						message: 'Your problem can now be selected for an event!',
						icon: CheckCircle,
						primaryAction: null
					};
				case 'rejected':
					return {
						message: 'Did not pass quality review. Consider major revision.',
						icon: Edit,
						primaryAction: onEdit ? { label: 'Revise Problem', onclick: onEdit } : null
					};
			}
		}

		// Moderator guidance
		if (isModerator && !isPO) {
			switch (readinessState) {
				case 'submitted':
					return {
						message: 'Review this problem submission.',
						icon: CheckCircle,
						primaryAction: null, // Actions handled by ModeratorControls
						note: 'Use decision buttons below to accept, request changes, or reject.'
					};
			}
			switch (actionState) {
				case 'backlog':
					if (readinessState === 'ready') {
						return {
							message: 'Ready for event selection.',
							icon: ArrowRight,
							primaryAction: null,
							note: 'Use decision buttons below to select for event.'
						};
					}
					break;
				case 'selected_for_event':
					return {
						message: 'Problem is on the event agenda.',
						icon: Vote,
						primaryAction: null,
						note: 'Open pitch assessment or select for coding.'
					};
				case 'selected_for_coding':
					return {
						message: 'Coding is active.',
						icon: MessageSquare,
						primaryAction: null,
						note: 'Open review assessment when ready.'
					};
			}
		}

		// Participant (Observer/Developer) guidance
		if (isPitchOpen) {
			return {
				message: 'Rate this problem now!',
				icon: Vote,
				primaryAction: onVotePitch ? { label: 'Vote', onclick: onVotePitch } : null
			};
		}

		if (isReviewOpen) {
			return {
				message: 'How did the solutions turn out?',
				icon: Vote,
				primaryAction: onVoteReview ? { label: 'Rate Review', onclick: onVoteReview } : null
			};
		}

		if (actionState === 'selected_for_coding' && !isMember) {
			return {
				message: 'Want to work on this?',
				icon: UserPlus,
				primaryAction: onJoinTeam ? { label: 'Join as Dev', onclick: onJoinTeam } : null
			};
		}

		if (actionState === 'selected_for_coding' && isMember) {
			return {
				message: "You're on the team! Coordinate in the chat below.",
				icon: MessageSquare,
				primaryAction: null
			};
		}

		// Default - no specific guidance
		return null;
	});
</script>

{#if guidance || actions.length > 0}
	<div class={cn('', className)} {...restProps}>
		<Card elevation="flat" padding="sm" class="bg-canvas/50">
			<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
				{#if guidance}
					<div class="flex items-center gap-2">
						{#if guidance.icon}
							{@const Icon = guidance.icon}
							<Icon class="w-5 h-5 text-primary shrink-0" />
						{/if}
						<div>
							<p class="text-sm font-medium text-headers">{guidance.message}</p>
							{#if guidance.note}
								<p class="text-xs text-meta mt-0.5">{guidance.note}</p>
							{/if}
						</div>
					</div>

					<div class="flex items-center gap-2 shrink-0">
						{#if guidance.secondaryAction}
							<Button
								variant="ghost"
								size="sm"
								onclick={guidance.secondaryAction.onclick}
							>
								{guidance.secondaryAction.label}
							</Button>
						{/if}
						{#if guidance.primaryAction}
							<Button
								variant="default"
								size="sm"
								onclick={guidance.primaryAction.onclick}
							>
								{guidance.primaryAction.label}
							</Button>
						{/if}
					</div>
				{/if}

				{#if actions.length > 0}
					<div class="flex items-center gap-2">
						{#each actions as action}
							<Button
								variant={action.variant ?? 'default'}
								size="sm"
								onclick={action.onclick}
							>
								{action.label}
							</Button>
						{/each}
					</div>
				{/if}
			</div>
		</Card>
	</div>
{/if}
