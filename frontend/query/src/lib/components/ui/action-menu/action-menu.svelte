<script lang="ts">
	import type { Snippet, Component } from 'svelte';
	import { Popover } from 'bits-ui';
	import { MoreVertical } from '@lucide/svelte';
	import { cn } from '$lib/utils';

	export interface ActionMenuItem {
		label: string;
		icon?: Component<{ class?: string }>;
		onclick: () => void;
		variant?: 'default' | 'destructive';
		disabled?: boolean;
		group?: string;
	}

	interface Props {
		actions: ActionMenuItem[];
		triggerIcon?: Snippet;
		align?: 'start' | 'center' | 'end';
		disabled?: boolean;
		class?: string;
	}

	let {
		actions,
		triggerIcon,
		align = 'end',
		disabled = false,
		class: className
	}: Props = $props();

	let open = $state(false);

	// Group actions if they have group property
	const groupedActions = $derived(() => {
		const groups = new Map<string | undefined, ActionMenuItem[]>();
		for (const action of actions) {
			const group = action.group;
			if (!groups.has(group)) {
				groups.set(group, []);
			}
			groups.get(group)!.push(action);
		}
		return Array.from(groups.entries());
	});

	function handleAction(action: ActionMenuItem) {
		if (!action.disabled) {
			action.onclick();
			open = false;
		}
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger
		{disabled}
		class={cn(
			'p-2 rounded-[var(--radius-card)]',
			'min-h-[44px] min-w-[44px]',
			'flex items-center justify-center',
			'text-meta hover:bg-canvas hover:text-headers',
			'transition-colors',
			'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
			'disabled:opacity-50 disabled:cursor-not-allowed',
			className
		)}
		aria-label="Open menu"
	>
		{#if triggerIcon}
			{@render triggerIcon()}
		{:else}
			<MoreVertical class="w-5 h-5" />
		{/if}
	</Popover.Trigger>

	<Popover.Portal>
		<Popover.Content
			{align}
			sideOffset={4}
			class={cn(
				'z-50 min-w-[180px] py-1',
				'bg-card rounded-[var(--radius-card)] shadow-[var(--shadow-floating)]',
				'border border-secondary',
				'data-[state=open]:animate-in data-[state=closed]:animate-out',
				'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
				'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
				'data-[side=bottom]:slide-in-from-top-2',
				'data-[side=top]:slide-in-from-bottom-2',
				'data-[side=left]:slide-in-from-right-2',
				'data-[side=right]:slide-in-from-left-2'
			)}
		>
			{#each groupedActions() as [group, groupActions], groupIndex}
				{#if groupIndex > 0}
					<div class="my-1 h-px bg-secondary" role="separator"></div>
				{/if}

				{#each groupActions as action (action.label)}
					<button
						type="button"
						onclick={() => handleAction(action)}
						disabled={action.disabled}
						class={cn(
							'w-full flex items-center gap-3 px-3 py-2',
							'min-h-[48px] md:min-h-[40px]',
							'text-left text-sm transition-colors',
							'focus-visible:outline-none focus-visible:bg-canvas',
							action.disabled && 'opacity-50 cursor-not-allowed',
							!action.disabled && 'hover:bg-canvas',
							action.variant === 'destructive'
								? 'text-alert'
								: 'text-headers'
						)}
					>
						{#if action.icon}
							{@const IconComponent = action.icon}
							<IconComponent class="w-4 h-4 flex-shrink-0" />
						{/if}
						<span class="flex-1">{action.label}</span>
					</button>
				{/each}
			{/each}
		</Popover.Content>
	</Popover.Portal>
</Popover.Root>
