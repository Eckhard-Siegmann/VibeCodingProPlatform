<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Component } from 'svelte';
	import Home from '@lucide/svelte/icons/home';
	import Calendar from '@lucide/svelte/icons/calendar';
	import ClipboardList from '@lucide/svelte/icons/clipboard-list';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import Settings from '@lucide/svelte/icons/settings';

	interface NavItem {
		icon: Component;
		label: string;
		href: string;
		visibleTo?: string[];
	}

	interface Props {
		currentPath: string;
		userRole: string;
		class?: string;
	}

	let { currentPath, userRole, class: className }: Props = $props();

	// Build nav items based on role (Ch.26.16.2)
	const allItems: NavItem[] = [
		{ icon: Home, label: 'Home', href: '/dashboard' },
		{ icon: Calendar, label: 'Events', href: '/events' },
		{ icon: ClipboardList, label: 'Problems', href: '/problems' },
		{ icon: SlidersHorizontal, label: 'Moderate', href: '/dashboard/moderator', visibleTo: ['moderator', 'admin'] },
		{ icon: Settings, label: 'Admin', href: '/admin', visibleTo: ['admin'] }
	];

	const visibleItems = $derived(
		allItems.filter((item) => !item.visibleTo || item.visibleTo.includes(userRole))
	);

	// Active route matching (page design §Active Route Matching)
	function isActive(href: string, path: string): boolean {
		if (href === '/dashboard') {
			// Exact match — don't highlight for /dashboard/moderator
			return path === '/dashboard';
		}
		if (href === '/events') {
			// Match /events and /event/[slug]
			return path.startsWith('/event');
		}
		if (href === '/problems') {
			// Match /problems and /problem/[slug]
			return path.startsWith('/problem');
		}
		// Prefix match for all other routes
		return path.startsWith(href);
	}
</script>

<!-- BottomNavBar: Ch.12.7.3, Ch.26.16.2 -->
<nav
	class={cn(
		'fixed bottom-0 left-0 right-0 z-50',
		'h-[var(--height-bottomnav-mobile)] md:h-[var(--height-bottomnav-desktop)]',
		'bg-card border-t border-secondary',
		'shadow-[0px_-1px_3px_rgba(0,0,0,0.05)]',
		'flex items-center justify-around',
		'pb-[env(safe-area-inset-bottom)]',
		className
	)}
	role="navigation"
	aria-label="Main navigation"
>
	{#each visibleItems as item (item.href)}
		{@const active = isActive(item.href, currentPath)}
		{@const Icon = item.icon}
		<a
			href={item.href}
			class={cn(
				'flex flex-col items-center justify-center gap-0.5',
				'min-w-[48px] min-h-[48px] px-2 py-1',
				'no-underline transition-colors',
				'rounded-md md:hover:bg-canvas',
				active ? 'text-primary' : 'text-labels md:hover:text-headers'
			)}
			aria-current={active ? 'page' : undefined}
		>
			<!-- Active indicator: 3px bar above icon -->
			<span
				class={cn(
					'h-[3px] w-5 rounded-full mb-0.5 transition-colors',
					active ? 'bg-primary' : 'bg-transparent'
				)}
			></span>

			<Icon
				size={24}
				strokeWidth={active ? 2 : 1.5}
			/>

			<span class="text-xs font-medium leading-tight">{item.label}</span>
		</a>
	{/each}
</nav>
