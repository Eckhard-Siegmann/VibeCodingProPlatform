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
	 * - Threading support
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

	// Filter messages
	const filteredMessages = $derived.by(() => {
		let result = messages;

		// Apply quick filter
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

	// Group messages (show header only on first of consecutive same-user messages within 2min)
	function shouldShowHeader(message: ChatMessageData, index: number): boolean {
		if (index === 0) return true;
		if (message.isBot) return true; // System messages always show

		const prevMessage = filteredMessages[index - 1];
		if (!prevMessage) return true;
		if (prevMessage.isBot) return true; // After system message
		if (prevMessage.authorId !== message.authorId) return true;

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
		{#if filteredMessages.length === 0}
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
			{#each filteredMessages as message, index (message.messageId)}
				<ChatMessage
					{message}
					showHeader={shouldShowHeader(message, index)}
					onReply={() => handleReply(message.messageId)}
					onReact={(emoji) => handleReact(message.messageId, emoji)}
				/>
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
