<script lang="ts">
	import { cn } from '$lib/utils';
	import { DropdownMenu, Dialog } from 'bits-ui';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import Settings from '@lucide/svelte/icons/settings';
	import LogOut from '@lucide/svelte/icons/log-out';
	import { InitialAvatar } from '$lib/components/ui/initial-avatar';

	interface Props {
		user: {
			display_name: string;
			user_id: string;
			email: string;
		};
		class?: string;
	}

	let { user, class: className }: Props = $props();

	let isDesktop = $state(true);
	let menuOpen = $state(false);

	$effect(() => {
		if (browser) {
			const mq = window.matchMedia('(min-width: 768px)');
			isDesktop = mq.matches;
			const handler = (e: MediaQueryListEvent) => (isDesktop = e.matches);
			mq.addEventListener('change', handler);
			return () => mq.removeEventListener('change', handler);
		}
	});

	async function handleLogout() {
		menuOpen = false;
		// Submit logout form programmatically
		const form = document.createElement('form');
		form.method = 'POST';
		form.action = '/logout';
		document.body.appendChild(form);
		form.submit();
	}

	function handleSettings() {
		menuOpen = false;
		goto('/account');
	}
</script>

{#if isDesktop}
	<!-- Desktop: Dropdown menu aligned right -->
	<DropdownMenu.Root bind:open={menuOpen}>
		<DropdownMenu.Trigger asChild>
			{#snippet children({ props })}
				<button
					{...props}
					class={cn(
						'rounded-full cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
						className
					)}
					aria-label="Account menu"
				>
					<InitialAvatar
						userName={user.display_name}
						userId={user.user_id}
						size="sm"
					/>
				</button>
			{/snippet}
		</DropdownMenu.Trigger>

		<DropdownMenu.Portal>
			<DropdownMenu.Content
				class="z-50 min-w-[200px] bg-card rounded-[var(--radius-card)] shadow-[var(--shadow-floating)] border border-secondary py-1 animate-in fade-in-0 zoom-in-95"
				align="end"
				sideOffset={8}
			>
				<!-- User info (non-interactive) -->
				<DropdownMenu.Group>
					<div class="px-4 py-2.5 border-b border-secondary">
						<p class="text-sm font-medium text-headers truncate">{user.display_name}</p>
						<p class="text-xs text-labels truncate">{user.email}</p>
					</div>
				</DropdownMenu.Group>

				<!-- Menu items -->
				<DropdownMenu.Group>
					<DropdownMenu.Item
						class="flex items-center gap-3 px-4 py-2 text-sm text-headers cursor-pointer hover:bg-canvas focus:bg-canvas outline-none"
						onSelect={handleSettings}
					>
						<Settings class="w-4 h-4 text-labels" />
						Settings
					</DropdownMenu.Item>
				</DropdownMenu.Group>

				<DropdownMenu.Separator class="h-px bg-secondary my-1" />

				<DropdownMenu.Group>
					<DropdownMenu.Item
						class="flex items-center gap-3 px-4 py-2 text-sm text-headers cursor-pointer hover:bg-canvas hover:text-alert focus:bg-canvas focus:text-alert outline-none"
						onSelect={handleLogout}
					>
						<LogOut class="w-4 h-4" />
						Logout
					</DropdownMenu.Item>
				</DropdownMenu.Group>
			</DropdownMenu.Content>
		</DropdownMenu.Portal>
	</DropdownMenu.Root>
{:else}
	<!-- Mobile: Bottom sheet via Dialog -->
	<button
		class={cn(
			'rounded-full cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
			className
		)}
		aria-label="Account menu"
		aria-haspopup="menu"
		aria-expanded={menuOpen}
		onclick={() => (menuOpen = true)}
	>
		<InitialAvatar
			userName={user.display_name}
			userId={user.user_id}
			size="sm"
		/>
	</button>

	<Dialog.Root bind:open={menuOpen}>
		<Dialog.Portal>
			<Dialog.Overlay
				class="fixed inset-0 z-50 bg-black/40"
				onclick={() => (menuOpen = false)}
			/>
			<Dialog.Content
				class="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-2xl shadow-[var(--shadow-floating)] pb-[env(safe-area-inset-bottom)] animate-in slide-in-from-bottom"
				role="menu"
			>
				<!-- Handle bar -->
				<div class="flex justify-center pt-3 pb-2">
					<div class="w-10 h-1 rounded-full bg-secondary-dark"></div>
				</div>

				<!-- User info -->
				<div class="px-4 py-3 border-b border-secondary">
					<p class="text-base font-medium text-headers">{user.display_name}</p>
					<p class="text-sm text-labels">{user.email}</p>
				</div>

				<!-- Menu items -->
				<div class="py-2">
					<button
						role="menuitem"
						class="flex items-center gap-3 w-full px-4 py-3 text-base text-headers active:bg-canvas"
						onclick={handleSettings}
					>
						<Settings class="w-5 h-5 text-labels" />
						Settings
					</button>

					<div class="h-px bg-secondary mx-4"></div>

					<button
						role="menuitem"
						class="flex items-center gap-3 w-full px-4 py-3 text-base text-headers active:bg-canvas active:text-alert"
						onclick={handleLogout}
					>
						<LogOut class="w-5 h-5" />
						Logout
					</button>
				</div>

				<!-- Extra bottom padding for safe area -->
				<div class="h-4"></div>
			</Dialog.Content>
		</Dialog.Portal>
	</Dialog.Root>
{/if}
