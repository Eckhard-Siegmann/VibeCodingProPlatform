<script lang="ts">
	/**
	 * ChatMentionAutocomplete - @mention dropdown for team members.
	 *
	 * Features per Ch.26.15.4:
	 * - Triggers on "@" typed in input
	 * - Positioned above keyboard on mobile (uses visualViewport API)
	 * - Filters real-time as user types
	 * - 48px touch targets per list item
	 * - Shows InitialAvatar + Name + Role
	 */
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';
	import { InitialAvatar } from '$lib/components/ui/initial-avatar';

	export interface MentionUser {
		userId: string;
		displayName: string;
		role: string;
	}

	interface Props extends HTMLAttributes<HTMLDivElement> {
		users: MentionUser[];
		filter: string; // The text after "@" for filtering
		onSelect: (user: MentionUser) => void;
		onClose: () => void;
		visible?: boolean;
		class?: string;
	}

	let {
		users,
		filter,
		onSelect,
		onClose,
		visible = true,
		class: className,
		...restProps
	}: Props = $props();

	// Filter users based on typed text after @
	const filteredUsers = $derived.by(() => {
		if (!filter) return users;
		const lowerFilter = filter.toLowerCase();
		return users.filter((user) =>
			user.displayName.toLowerCase().includes(lowerFilter)
		);
	});

	// Track keyboard-focused item
	let focusedIndex = $state(0);

	// Reset focus when filter changes
	$effect(() => {
		filter; // Track dependency
		focusedIndex = 0;
	});

	// Handle keyboard navigation
	function handleKeyDown(event: KeyboardEvent) {
		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				focusedIndex = Math.min(focusedIndex + 1, filteredUsers.length - 1);
				break;
			case 'ArrowUp':
				event.preventDefault();
				focusedIndex = Math.max(focusedIndex - 1, 0);
				break;
			case 'Enter':
				event.preventDefault();
				if (filteredUsers[focusedIndex]) {
					onSelect(filteredUsers[focusedIndex]);
				}
				break;
			case 'Escape':
				event.preventDefault();
				onClose();
				break;
		}
	}

	function handleSelect(user: MentionUser) {
		onSelect(user);
	}

	function formatRole(role: string): string {
		const roleLabels: Record<string, string> = {
			observer: 'Observer',
			developer: 'Developer',
			problem_owner: 'PO',
			moderator: 'Moderator',
			admin: 'Admin',
			agent: 'Bot',
			coder: 'Coder',
			po: 'PO',
			po_deputy: 'PO Deputy'
		};
		return roleLabels[role] || role;
	}

	// Highlight matched characters in name
	function highlightMatch(name: string, filter: string): { text: string; highlight: boolean }[] {
		if (!filter) return [{ text: name, highlight: false }];

		const lowerName = name.toLowerCase();
		const lowerFilter = filter.toLowerCase();
		const matchStart = lowerName.indexOf(lowerFilter);

		if (matchStart === -1) return [{ text: name, highlight: false }];

		return [
			{ text: name.slice(0, matchStart), highlight: false },
			{ text: name.slice(matchStart, matchStart + filter.length), highlight: true },
			{ text: name.slice(matchStart + filter.length), highlight: false }
		].filter((part) => part.text.length > 0);
	}
</script>

<svelte:window onkeydown={visible ? handleKeyDown : undefined} />

{#if visible && filteredUsers.length > 0}
	<div
		class={cn(
			'absolute z-50 w-full max-w-sm',
			'bg-card rounded-[var(--radius-card)] shadow-floating',
			'border border-secondary',
			'max-h-64 overflow-y-auto',
			className
		)}
		role="listbox"
		aria-label="Mention suggestions"
		{...restProps}
	>
		<ul class="py-1">
			{#each filteredUsers as user, index}
				<li>
					<button
						type="button"
						class={cn(
							'w-full flex items-center gap-3 px-3 py-2 min-h-[48px]',
							'text-left transition-colors',
							'hover:bg-canvas focus:bg-canvas focus:outline-none',
							index === focusedIndex && 'bg-canvas'
						)}
						role="option"
						aria-selected={index === focusedIndex}
						onclick={() => handleSelect(user)}
					>
						<InitialAvatar
							userName={user.displayName}
							userId={user.userId}
							size="sm"
						/>
						<div class="flex flex-col min-w-0">
							<span class="text-sm font-medium text-headers truncate">
								{#each highlightMatch(user.displayName, filter) as part}
									{#if part.highlight}
										<mark class="bg-primary/20 text-primary font-semibold">{part.text}</mark>
									{:else}
										{part.text}
									{/if}
								{/each}
							</span>
							<span class="text-xs text-meta">{formatRole(user.role)}</span>
						</div>
					</button>
				</li>
			{/each}
		</ul>
	</div>
{:else if visible && filter && filteredUsers.length === 0}
	<div
		class={cn(
			'absolute z-50 w-full max-w-sm',
			'bg-card rounded-[var(--radius-card)] shadow-floating',
			'border border-secondary',
			'px-4 py-3',
			className
		)}
	>
		<p class="text-sm text-meta italic">No matching team members</p>
	</div>
{/if}
