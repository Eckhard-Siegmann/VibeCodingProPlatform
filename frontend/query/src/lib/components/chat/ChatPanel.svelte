<script lang="ts">
	/**
	 * ChatPanel - Full chat UI with filters, message list, and input.
	 *
	 * Features per Ch.31.8, Ch.26.15:
	 * - Version filter dropdown (current, all, specific version)
	 * - Quick filters: All, Moderator, PO, Has URL
	 * - Message list (scrollable, 4000px max-height)
	 * - Default scroll to bottom (newest messages)
	 * - Message grouping for consecutive same-user messages
	 * - Threading: top-level messages rendered flat; replies collapsed under parents (Ch.26.15.3)
	 * - Chat input with mentions and emoji
	 */
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';
	import { Button } from '$lib/components/ui/button';
	import ChatMessage, { type ChatMessageData } from './ChatMessage.svelte';
	import ChatThread from './ChatThread.svelte';
	import ChatInput from './ChatInput.svelte';
	import { type MentionUser } from './ChatMentionAutocomplete.svelte';

	// Filter types
	type QuickFilter = 'all' | 'moderator' | 'po' | 'has_url';

	interface Version {
		majorVersion: number;
		label: string;
	}

	interface Props extends HTMLAttributes<HTMLDivElement> {
		messages: ChatMessageData[];
		teamMembers?: MentionUser[];
		versions?: Version[];
		currentMajorVersion?: number;
		selectedVersion?: number | 'all';
		isArchiveView?: boolean;
		isAuthenticated?: boolean;
		onSend?: (message: string, replyToId?: string) => void;
		onReact?: (messageId: string, emoji: string) => void;
		onVersionChange?: (version: number | 'all') => void;
		onFilterChange?: (filter: QuickFilter) => void;
		class?: string;
	}

	let {
		messages,
		teamMembers = [],
		versions = [],
		currentMajorVersion,
		selectedVersion = 'all',
		isArchiveView = false,
		isAuthenticated = true,
		onSend,
		onReact,
		onVersionChange,
		onFilterChange,
		class: className,
		...restProps
	}: Props = $props();

	// State
	let activeFilter = $state<QuickFilter>('all');
	let replyingTo = $state<{ messageId: string; authorName: string } | null>(null);
	let messageListRef: HTMLDivElement | undefined = $state();

	// Quick filters
	const quickFilters: { key: QuickFilter; label: string }[] = [
		{ key: 'all', label: 'All' },
		{ key: 'moderator', label: 'Moderator' },
		{ key: 'po', label: 'PO' },
		{ key: 'has_url', label: 'Has URL' }
	];

	// ── Thread tree building (Ch.26.15.3) ─────────────────────────────
	// Build a map of parentId → direct replies, and identify top-level messages.
	// A "top-level" message has no replyToMessageId (or replies to a message
	// not present in the current filtered set).

	interface ThreadEntry {
		message: ChatMessageData;
		replies: ChatMessageData[];
	}

	/**
	 * Build thread structure from flat message list.
	 * Returns an array of ThreadEntry objects for rendering.
	 * Top-level messages appear in order; their replies are grouped under them.
	 */
	function buildThreads(msgs: ChatMessageData[]): ThreadEntry[] {
		const messageSet = new Set(msgs.map((m) => m.messageId));
		const replyMap = new Map<string, ChatMessageData[]>();
		const topLevel: ChatMessageData[] = [];

		// First pass: separate top-level from replies
		for (const msg of msgs) {
			if (!msg.replyToMessageId || !messageSet.has(msg.replyToMessageId)) {
				// Top-level message (or reply to a message not in current set)
				topLevel.push(msg);
			} else {
				// Find the root parent of this reply chain
				let rootId = msg.replyToMessageId;
				const visited = new Set<string>();
				visited.add(msg.messageId);

				// Walk up the reply chain to find the top-level ancestor
				let current = msgs.find((m) => m.messageId === rootId);
				while (current?.replyToMessageId && messageSet.has(current.replyToMessageId) && !visited.has(current.replyToMessageId)) {
					visited.add(current.messageId);
					rootId = current.replyToMessageId;
					current = msgs.find((m) => m.messageId === rootId);
				}

				const replies = replyMap.get(rootId) ?? [];
				replies.push(msg);
				replyMap.set(rootId, replies);
			}
		}

		// Build ThreadEntry array
		return topLevel.map((msg) => ({
			message: msg,
			replies: replyMap.get(msg.messageId) ?? []
		}));
	}

	// Filtered messages (apply quick filters first, then build threads)
	const filteredMessages = $derived.by(() => {
		let result = messages;

		// Apply quick filter — for thread-aware filtering, include a message if
		// either it matches OR any of its thread replies match.
		switch (activeFilter) {
			case 'moderator':
				result = result.filter((m) => m.authorRole === 'moderator' || m.authorRole === 'admin');
				break;
			case 'po':
				result = result.filter((m) => m.authorRole === 'problem_owner');
				break;
			case 'has_url':
				result = result.filter((m) => m.content.match(/https?:\/\/[^\s]+/));
				break;
		}

		return result;
	});

	// Thread entries from filtered messages
	const threadEntries = $derived(buildThreads(filteredMessages));

	// Group messages (show header only on first of consecutive same-user messages within 2min)
	// Only applies to top-level (non-threaded) messages rendered sequentially.
	function shouldShowHeader(index: number): boolean {
		if (index === 0) return true;

		const entry = threadEntries[index];
		const prevEntry = threadEntries[index - 1];
		if (!entry || !prevEntry) return true;

		const message = entry.message;
		const prevMessage = prevEntry.message;

		if (message.isBot) return true; // System messages always show
		if (prevMessage.isBot) return true; // After system message
		if (prevMessage.authorId !== message.authorId) return true;
		// Don't group across threaded messages
		if (prevEntry.replies.length > 0) return true;

		// Check time gap
		const prevTime = new Date(prevMessage.createdAt).getTime();
		const currTime = new Date(message.createdAt).getTime();
		const twoMinutes = 2 * 60 * 1000;

		return currTime - prevTime > twoMinutes;
	}

	// Scroll to bottom when messages change
	$effect(() => {
		messages; // Track dependency
		setTimeout(() => {
			if (messageListRef) {
				messageListRef.scrollTop = messageListRef.scrollHeight;
			}
		}, 50);
	});

	function handleFilterClick(filter: QuickFilter) {
		activeFilter = filter;
		onFilterChange?.(filter);
	}

	function handleVersionChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		const value = target.value === 'all' ? 'all' : parseInt(target.value, 10);
		onVersionChange?.(value);
	}

	function handleSend(message: string) {
		onSend?.(message, replyingTo?.messageId);
		replyingTo = null;
	}

	function handleReply(messageId: string) {
		const message = messages.find((m) => m.messageId === messageId);
		if (message) {
			replyingTo = { messageId, authorName: message.authorName };
		}
	}

	function handleCancelReply() {
		replyingTo = null;
	}

	function handleReact(messageId: string, emoji: string) {
		onReact?.(messageId, emoji);
	}
</script>

<div class={cn('flex flex-col h-full', className)} {...restProps}>
	<!-- Filters row -->
	<div class="flex flex-wrap items-center gap-2 p-3 border-b border-secondary bg-canvas">
		<!-- Version filter dropdown -->
		{#if versions.length > 0}
			<select
				class={cn(
					'px-2 py-1 text-xs rounded-[var(--radius-card)]',
					'border border-secondary bg-card text-headers',
					'focus:outline-none focus:ring-2 focus:ring-primary/50'
				)}
				value={selectedVersion}
				onchange={handleVersionChange}
			>
				<option value="all">All versions</option>
				{#each versions as version}
					<option value={version.majorVersion}>
						v{version.majorVersion}.00
						{version.majorVersion === currentMajorVersion ? '(current)' : ''}
					</option>
				{/each}
			</select>
		{/if}

		<!-- Quick filters -->
		<div class="flex gap-1">
			{#each quickFilters as filter}
				<button
					type="button"
					class={cn(
						'px-2 py-1 text-xs rounded-full transition-colors',
						activeFilter === filter.key
							? 'bg-primary text-white'
							: 'bg-card text-labels hover:bg-secondary border border-secondary'
					)}
					onclick={() => handleFilterClick(filter.key)}
				>
					{filter.label}
				</button>
			{/each}
		</div>
	</div>

	<!-- Messages list -->
	<div
		bind:this={messageListRef}
		class="flex-1 overflow-y-auto p-4 space-y-2"
		style="max-height: 4000px;"
	>
		{#if threadEntries.length === 0}
			<div class="flex flex-col items-center justify-center py-12 text-center">
				<span class="text-4xl mb-3">&#x1F4AC;</span>
				<p class="text-sm text-meta">
					{#if activeFilter !== 'all'}
						No messages match the current filter.
					{:else}
						No messages yet. Be the first to post!
					{/if}
				</p>
			</div>
		{:else}
			{#each threadEntries as entry, index (entry.message.messageId)}
				{#if entry.replies.length > 0}
					<!-- Threaded message: use ChatThread for collapse/expand -->
					<ChatThread
						parentMessage={entry.message}
						replies={entry.replies}
						onReply={handleReply}
						onReact={handleReact}
					/>
				{:else}
					<!-- Non-threaded message: render inline -->
					<ChatMessage
						message={entry.message}
						showHeader={shouldShowHeader(index)}
						onReply={() => handleReply(entry.message.messageId)}
						onReact={(emoji) => handleReact(entry.message.messageId, emoji)}
					/>
				{/if}
			{/each}
		{/if}
	</div>

	<!-- Input section -->
	{#if isAuthenticated && !isArchiveView}
		<div class="p-3 border-t border-secondary bg-card">
			<ChatInput
				{teamMembers}
				{replyingTo}
				disabled={isArchiveView}
				onSend={handleSend}
				onCancelReply={handleCancelReply}
			/>
		</div>
	{:else if isArchiveView}
		<div class="p-3 border-t border-secondary bg-warning-bg">
			<p class="text-sm text-warning text-center">
				History View - Chat input is disabled.
			</p>
		</div>
	{:else}
		<div class="p-3 border-t border-secondary bg-canvas">
			<p class="text-sm text-meta text-center">
				Sign in to participate in the chat.
			</p>
		</div>
	{/if}
</div>
