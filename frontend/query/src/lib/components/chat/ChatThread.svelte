<script lang="ts">
	/**
	 * ChatThread - Threaded message display with collapse/expand.
	 *
	 * Features per Ch.26.15.3:
	 * - Collapsed: Shows "▶ 3 replies" indicator, tap to expand
	 * - Expanded: Indent 40px, vertical thread line
	 * - Nested replies show "Replying to {Name}" quote indicator
	 * - Tap collapse header to collapse
	 */
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';
	import ChatMessage, { type ChatMessageData } from './ChatMessage.svelte';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		parentMessage: ChatMessageData;
		replies: ChatMessageData[];
		onReply?: (messageId: string) => void;
		onReact?: (messageId: string, emoji: string) => void;
		class?: string;
	}

	let {
		parentMessage,
		replies,
		onReply,
		onReact,
		class: className,
		...restProps
	}: Props = $props();

	let isExpanded = $state(false);

	// Group consecutive messages from same user within 2 minutes
	function shouldShowHeader(message: ChatMessageData, index: number, messages: ChatMessageData[]): boolean {
		if (index === 0) return true;
		const prevMessage = messages[index - 1];
		if (prevMessage.authorId !== message.authorId) return true;

		// Check if more than 2 minutes apart
		const prevTime = new Date(prevMessage.createdAt).getTime();
		const currTime = new Date(message.createdAt).getTime();
		const twoMinutes = 2 * 60 * 1000;

		return currTime - prevTime > twoMinutes;
	}

	/**
	 * Find the author name for a given message ID within the thread.
	 * Used to show "Replying to {Name}" for nested replies.
	 */
	function getReplyTargetName(replyToId: string | null | undefined): string | null {
		if (!replyToId) return null;
		// Direct reply to parent — no indicator needed (contextually obvious)
		if (replyToId === parentMessage.messageId) return null;
		// Reply to another reply in the thread — show "Replying to {Name}"
		const target = replies.find((r) => r.messageId === replyToId);
		if (target) return target.authorName;
		return null;
	}

	function toggleExpand() {
		isExpanded = !isExpanded;
	}

	function handleParentReply() {
		onReply?.(parentMessage.messageId);
	}

	function handleChildReply(messageId: string) {
		onReply?.(messageId);
	}

	function handleReact(messageId: string, emoji: string) {
		onReact?.(messageId, emoji);
	}

	const replyCount = $derived(replies.length);

	// Suppress replyCount on parent so ChatMessage doesn't show its own
	// thread indicator — ChatThread handles that.
	const parentForDisplay = $derived({ ...parentMessage, replyCount: 0 });
</script>

<div class={cn('w-full', className)} {...restProps}>
	<!-- Parent message -->
	<ChatMessage
		message={parentForDisplay}
		showHeader={true}
		onReply={handleParentReply}
		onReact={(emoji) => handleReact(parentMessage.messageId, emoji)}
	/>

	<!-- Thread indicator / replies -->
	{#if replyCount > 0}
		{#if !isExpanded}
			<!-- Collapsed indicator (Ch.26.15.3) -->
			<button
				type="button"
				class={cn(
					'flex items-center gap-1 mt-1 ml-8 px-2 py-1',
					'text-xs text-primary hover:text-primary-hover hover:underline',
					'transition-colors'
				)}
				onclick={toggleExpand}
			>
				<span class="text-[10px]">&#9654;</span>
				<span>{replyCount} {replyCount === 1 ? 'reply' : 'replies'}</span>
			</button>
		{:else}
			<!-- Expanded thread (Ch.26.15.3) -->
			<div class="relative mt-2">
				<!-- Thread line -->
				<div
					class="absolute left-4 top-0 bottom-0 w-px bg-secondary"
					aria-hidden="true"
				></div>

				<!-- Collapse button header -->
				<button
					type="button"
					class={cn(
						'flex items-center gap-1 mb-2 ml-8 px-2 py-1',
						'text-xs text-meta hover:text-labels',
						'transition-colors'
					)}
					onclick={toggleExpand}
				>
					<span class="rotate-90 text-[10px]">&#9654;</span>
					<span>Hide {replyCount === 1 ? 'reply' : 'replies'}</span>
				</button>

				<!-- Reply messages -->
				<div class="pl-10 space-y-1">
					{#each replies as reply, index}
						{@const replyTargetName = getReplyTargetName(reply.replyToMessageId)}
						{#if replyTargetName}
							<!-- Nested reply: show "Replying to {Name}" indicator -->
							<div class="flex items-center gap-1 px-1 mb-0.5">
								<span class="text-[10px] text-meta italic">Replying to {replyTargetName}</span>
							</div>
						{/if}
						<ChatMessage
							message={reply}
							showHeader={shouldShowHeader(reply, index, replies)}
							onReply={() => handleChildReply(reply.messageId)}
							onReact={(emoji) => handleReact(reply.messageId, emoji)}
						/>
					{/each}
				</div>
			</div>
		{/if}
	{/if}
</div>
