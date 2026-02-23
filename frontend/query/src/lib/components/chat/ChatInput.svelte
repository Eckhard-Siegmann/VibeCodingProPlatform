<script lang="ts">
	/**
	 * ChatInput - Text input for chat with @mention support and emoji picker.
	 *
	 * Features per Ch.31.3, Ch.26.15.4, Ch.26.15.5:
	 * - 2000 character limit
	 * - @ trigger for mention autocomplete
	 * - Emoji picker button (curated 10 emojis)
	 * - Send button
	 * - Disabled state for archive view
	 * - Mobile keyboard awareness
	 */
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';
	import { Button } from '$lib/components/ui/button';
	import ChatMentionAutocomplete, { type MentionUser } from './ChatMentionAutocomplete.svelte';
	import Send from '@lucide/svelte/icons/send';
	import Smile from '@lucide/svelte/icons/smile';

	// Curated emoji set per Ch.31.4
	const CURATED_EMOJIS = [
		{ emoji: '\u{1F44D}', name: 'Thumbs Up' },      // 👍
		{ emoji: '\u{1F44E}', name: 'Thumbs Down' },    // 👎
		{ emoji: '\u{2764}\u{FE0F}', name: 'Heart' },   // ❤️
		{ emoji: '\u{1F389}', name: 'Celebrate' },      // 🎉
		{ emoji: '\u{1F914}', name: 'Thinking' },       // 🤔
		{ emoji: '\u{1F440}', name: 'Eyes' },           // 👀
		{ emoji: '\u{1F525}', name: 'Fire' },           // 🔥
		{ emoji: '\u{2705}', name: 'Check' },           // ✅
		{ emoji: '\u{1F4A1}', name: 'Idea' },           // 💡
		{ emoji: '\u{1F64F}', name: 'Thanks' }          // 🙏
	] as const;

	const MAX_LENGTH = 2000;

	interface Props extends HTMLAttributes<HTMLDivElement> {
		teamMembers?: MentionUser[];
		disabled?: boolean;
		placeholder?: string;
		replyingTo?: { messageId: string; authorName: string } | null;
		onSend: (message: string) => void;
		onCancelReply?: () => void;
		class?: string;
	}

	let {
		teamMembers = [],
		disabled = false,
		placeholder = 'Type a message...',
		replyingTo,
		onSend,
		onCancelReply,
		class: className,
		...restProps
	}: Props = $props();

	let value = $state('');
	let textareaRef: HTMLTextAreaElement | undefined = $state();
	let containerRef: HTMLDivElement | undefined = $state();

	// Mention autocomplete state
	let showMentions = $state(false);
	let mentionFilter = $state('');
	let mentionStartPos = $state(0);

	// Emoji picker state
	let showEmojiPicker = $state(false);

	// Character count
	const charCount = $derived(value.length);
	const isOverLimit = $derived(charCount > MAX_LENGTH);
	const canSend = $derived(value.trim().length > 0 && !isOverLimit && !disabled);

	// Detect @ mentions as user types
	function handleInput(event: Event) {
		const target = event.target as HTMLTextAreaElement;
		const cursorPos = target.selectionStart || 0;
		const textBeforeCursor = value.slice(0, cursorPos);

		// Find the last @ before cursor
		const lastAtPos = textBeforeCursor.lastIndexOf('@');

		if (lastAtPos !== -1) {
			const textAfterAt = textBeforeCursor.slice(lastAtPos + 1);
			// Check if there's a space after the @ (completed mention)
			if (!textAfterAt.includes(' ')) {
				showMentions = true;
				mentionFilter = textAfterAt;
				mentionStartPos = lastAtPos;
				return;
			}
		}

		showMentions = false;
		mentionFilter = '';
	}

	function handleMentionSelect(user: MentionUser) {
		// Replace @filter with @username
		const beforeMention = value.slice(0, mentionStartPos);
		const afterMention = value.slice(mentionStartPos + mentionFilter.length + 1);
		const mentionText = `@${user.displayName.replace(/\s+/g, '')} `;

		value = beforeMention + mentionText + afterMention;
		showMentions = false;
		mentionFilter = '';

		// Focus back on textarea
		textareaRef?.focus();
	}

	function handleMentionClose() {
		showMentions = false;
		mentionFilter = '';
	}

	function handleKeyDown(event: KeyboardEvent) {
		// Don't handle if mentions are showing (let autocomplete handle it)
		if (showMentions) return;

		// Submit on Enter (without Shift)
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			handleSend();
		}
	}

	function handleSend() {
		if (!canSend) return;

		onSend(value.trim());
		value = '';
		showMentions = false;
		showEmojiPicker = false;
	}

	function toggleEmojiPicker() {
		showEmojiPicker = !showEmojiPicker;
	}

	function insertEmoji(emoji: string) {
		const cursorPos = textareaRef?.selectionStart || value.length;
		value = value.slice(0, cursorPos) + emoji + value.slice(cursorPos);
		showEmojiPicker = false;
		textareaRef?.focus();
	}

	function handleCancelReply() {
		onCancelReply?.();
	}

	// Close emoji picker when clicking outside
	function handleClickOutside(event: MouseEvent) {
		if (containerRef && !containerRef.contains(event.target as Node)) {
			showEmojiPicker = false;
		}
	}
</script>

<svelte:window onclick={handleClickOutside} />

<div
	bind:this={containerRef}
	class={cn('relative', className)}
	{...restProps}
>
	<!-- Reply indicator -->
	{#if replyingTo}
		<div class="flex items-center justify-between px-3 py-2 bg-canvas rounded-t-[var(--radius-card)] border-b border-secondary">
			<span class="text-xs text-meta">
				Replying to <span class="font-medium text-headers">{replyingTo.authorName}</span>
			</span>
			<button
				type="button"
				class="text-xs text-meta hover:text-headers"
				onclick={handleCancelReply}
			>
				Cancel
			</button>
		</div>
	{/if}

	<!-- Input container -->
	<div
		class={cn(
			'flex items-end gap-2 p-2 bg-card border border-secondary',
			replyingTo ? 'rounded-b-[var(--radius-card)]' : 'rounded-[var(--radius-card)]',
			disabled && 'opacity-50'
		)}
	>
		<!-- Textarea -->
		<div class="relative flex-1">
			<textarea
				bind:this={textareaRef}
				bind:value
				{placeholder}
				{disabled}
				rows={1}
				maxlength={MAX_LENGTH + 100}
				class={cn(
					'w-full resize-none bg-transparent text-sm text-headers',
					'placeholder:text-meta',
					'focus:outline-none',
					'min-h-[40px] max-h-[120px] py-2 px-1',
					isOverLimit && 'text-alert'
				)}
				oninput={handleInput}
				onkeydown={handleKeyDown}
			></textarea>

			<!-- Mention autocomplete dropdown -->
			<div class="absolute bottom-full left-0 right-0 mb-1">
				<ChatMentionAutocomplete
					users={teamMembers}
					filter={mentionFilter}
					visible={showMentions}
					onSelect={handleMentionSelect}
					onClose={handleMentionClose}
				/>
			</div>
		</div>

		<!-- Character count (shows when near limit) -->
		{#if charCount > MAX_LENGTH - 200}
			<span
				class={cn(
					'text-xs tabular-nums',
					isOverLimit ? 'text-alert' : 'text-meta'
				)}
			>
				{charCount}/{MAX_LENGTH}
			</span>
		{/if}

		<!-- Emoji picker toggle -->
		<div class="relative">
			<Button
				variant="ghost"
				size="icon"
				{disabled}
				onclick={toggleEmojiPicker}
				aria-label="Add emoji"
				class="h-9 w-9"
			>
				<Smile class="w-5 h-5 text-meta" />
			</Button>

			<!-- Emoji picker dropdown -->
			{#if showEmojiPicker}
				<div
					class={cn(
						'absolute bottom-full right-0 mb-2',
						'bg-card rounded-[var(--radius-card)] shadow-floating',
						'border border-secondary p-2',
						'grid grid-cols-5 gap-1'
					)}
				>
					{#each CURATED_EMOJIS as { emoji, name }}
						<button
							type="button"
							class={cn(
								'w-10 h-10 flex items-center justify-center',
								'text-xl rounded-lg',
								'hover:bg-canvas transition-colors'
							)}
							title={name}
							onclick={() => insertEmoji(emoji)}
						>
							{emoji}
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Send button -->
		<Button
			variant="default"
			size="icon"
			disabled={!canSend}
			onclick={handleSend}
			aria-label="Send message"
			class="h-9 w-9"
		>
			<Send class="w-4 h-4" />
		</Button>
	</div>
</div>
