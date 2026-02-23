<script lang="ts">
	/**
	 * ChatThread - Threaded message display with collapse/expand.
	 *
	 * Features per Ch.26.15.3:
	 * - Collapsed: Shows "3 replies" indicator, tap to expand
	 * - Expanded: Indent 40px, vertical thread line
	 * - Max 3 levels deep (per spec, deeper replies flatten with text indicator)
	 * - Tap parent header or outside to collapse
	 */
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';
	import ChatMessage, { type ChatMessageData } from './ChatMessage.svelte';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		parentMessage: ChatMessageData;
		replies: ChatMessageData[];
		depth?: number;
		maxDepth?: number;
		onReply?: (messageId: string) => void;
		onReact?: (messageId: string, emoji: string) => void;
		class?: string;
	}

	let {
		parentMessage,
		replies,
		depth = 0,
		maxDepth = 3,
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
	const canNest = $derived(depth < maxDepth);
</script>

<div class={cn('w-full', className)} {...restProps}>
	<!-- Parent message -->
	<ChatMessage
		message={parentMessage}
		showHeader={true}
		onReply={handleParentReply}
		onReact={(emoji) => handleReact(parentMessage.messageId, emoji)}
	/>

	<!-- Thread indicator / replies -->
	{#if replyCount > 0}
		{#if !isExpanded}
			<!-- Collapsed indicator -->
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
			<!-- Expanded thread -->
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
						{#if canNest}
							<!-- If the reply itself has nested replies, this would recurse -->
							<ChatMessage
								message={reply}
								showHeader={shouldShowHeader(reply, index, replies)}
								onReply={() => handleChildReply(reply.messageId)}
								onReact={(emoji) => handleReact(reply.messageId, emoji)}
							/>
						{:else}
							<!-- Max depth reached: show flat with indicator -->
							<div class="flex items-start gap-2">
								<span class="text-xs text-meta italic shrink-0">In reply to {parentMessage.authorName}:</span>
							</div>
							<ChatMessage
								message={reply}
								showHeader={shouldShowHeader(reply, index, replies)}
								onReply={() => handleChildReply(reply.messageId)}
								onReact={(emoji) => handleReact(reply.messageId, emoji)}
							/>
						{/if}
					{/each}
				</div>
			</div>
		{/if}
	{/if}
</div>
