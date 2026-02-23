<script lang="ts">
	/**
	 * ChatMessage - Full message display with avatar, metadata, and reactions.
	 *
	 * Handles message grouping: consecutive messages from same user within 2 minutes
	 * show avatar+name only on first message (per Ch.26.15.1).
	 *
	 * Features:
	 * - Avatar display for other users (not own messages)
	 * - Name and timestamp display
	 * - Emoji reactions inline below bubble
	 * - Edited indicator
	 * - Reply action trigger
	 */
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';
	import { InitialAvatar } from '$lib/components/ui/initial-avatar';
	import { Tooltip } from '$lib/components/ui/tooltip';
	import { formatRelative, formatDateTime } from '$lib/utils/date-formatting';
	import ChatBubble from './ChatBubble.svelte';

	export interface ChatReaction {
		emoji: string;
		count: number;
		userReacted: boolean;
		users?: string[]; // For tooltip showing who reacted
	}

	export interface ChatMessageData {
		messageId: string;
		content: string;
		authorId: string;
		authorName: string;
		authorRole: 'observer' | 'developer' | 'problem_owner' | 'moderator' | 'admin' | 'agent';
		isBot: boolean;
		isOwn: boolean;
		createdAt: string;
		editedAt?: string | null;
		reactions?: ChatReaction[];
		replyCount?: number;
	}

	interface Props extends HTMLAttributes<HTMLDivElement> {
		message: ChatMessageData;
		showHeader?: boolean; // Whether to show avatar+name (for grouping)
		onReply?: () => void;
		onReact?: (emoji: string) => void;
		class?: string;
	}

	let {
		message,
		showHeader = true,
		onReply,
		onReact,
		class: className,
		...restProps
	}: Props = $props();

	// Determine bubble variant
	const variant = $derived.by(() => {
		if (message.isBot) return 'system';
		if (message.isOwn) return 'own';
		if (message.authorRole === 'moderator' || message.authorRole === 'admin') return 'moderator';
		return 'other';
	});

	// Format role suffix for display
	const roleSuffix = $derived.by(() => {
		if (message.authorRole === 'problem_owner') return ' (PO)';
		if (message.authorRole === 'moderator') return '';  // Badge handles this
		if (message.authorRole === 'admin') return ' (Admin)';
		return '';
	});

	// Container alignment
	const containerAlign = $derived.by(() => {
		if (message.isOwn) return 'justify-end';
		if (message.isBot) return 'justify-center';
		return 'justify-start';
	});
</script>

<div class={cn('flex w-full', containerAlign, className)} {...restProps}>
	{#if variant === 'system'}
		<!-- System message: centered, no avatar -->
		<ChatBubble variant="system">
			{message.content}
		</ChatBubble>
	{:else}
		<div class={cn('flex gap-2 max-w-[85%]', message.isOwn && 'flex-row-reverse')}>
			<!-- Avatar (only for non-own messages) -->
			{#if !message.isOwn && showHeader}
				<div class="flex-shrink-0 self-end">
					<InitialAvatar
						userName={message.authorName}
						userId={message.authorId}
						size="sm"
					/>
				</div>
			{:else if !message.isOwn}
				<!-- Placeholder for grouped messages to maintain alignment -->
				<div class="w-6 flex-shrink-0"></div>
			{/if}

			<div class="flex flex-col">
				<!-- Name and timestamp header (only shown if showHeader=true) -->
				{#if showHeader && !message.isOwn}
					<div class="flex items-baseline gap-2 mb-0.5 px-1">
						<span class="text-xs font-medium text-headers">
							{message.authorName}{roleSuffix}
						</span>
					</div>
				{/if}

				<!-- Message bubble -->
				<ChatBubble {variant}>
					{message.content}
				</ChatBubble>

				<!-- Timestamp and edited indicator -->
				<div class={cn(
					'flex items-center gap-1.5 mt-0.5 px-1',
					message.isOwn ? 'justify-end' : 'justify-start'
				)}>
					<Tooltip content={formatDateTime(message.createdAt)}>
						{#snippet children()}
							<span class="text-[10px] text-meta cursor-default">
								{formatRelative(message.createdAt)}
							</span>
						{/snippet}
					</Tooltip>
					{#if message.editedAt}
						<span class="text-[10px] text-meta italic">(edited)</span>
					{/if}
				</div>

				<!-- Reactions row -->
				{#if message.reactions && message.reactions.length > 0}
					<div class={cn(
						'flex flex-wrap gap-1 mt-1 px-1',
						message.isOwn ? 'justify-end' : 'justify-start'
					)}>
						{#each message.reactions as reaction}
							<Tooltip content={reaction.users?.join(', ') || 'Users who reacted'}>
								{#snippet children()}
									<button
										type="button"
										class={cn(
											'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs',
											'bg-canvas hover:bg-secondary transition-colors',
											reaction.userReacted && 'ring-1 ring-primary'
										)}
										onclick={() => onReact?.(reaction.emoji)}
									>
										<span>{reaction.emoji}</span>
										<span class="text-meta">{reaction.count}</span>
									</button>
								{/snippet}
							</Tooltip>
						{/each}
					</div>
				{/if}

				<!-- Reply indicator (if has replies) -->
				{#if message.replyCount && message.replyCount > 0}
					<button
						type="button"
						class="flex items-center gap-1 mt-1 px-1 text-xs text-primary hover:underline"
						onclick={onReply}
					>
						<span>&#9654;</span>
						<span>{message.replyCount} {message.replyCount === 1 ? 'reply' : 'replies'}</span>
					</button>
				{/if}
			</div>
		</div>
	{/if}
</div>
