<script lang="ts">
	import { cn } from '$lib/utils';
	import AccountMenu from './AccountMenu.svelte';

	interface Props {
		user: {
			display_name: string;
			user_id: string;
			email: string;
		};
		class?: string;
	}

	let { user, class: className }: Props = $props();
</script>

<!-- TopAppBar: Ch.12.7.2, Ch.26.16.1 -->
<header
	class={cn(
		'fixed top-0 left-0 right-0 z-50',
		'h-[var(--height-topbar-mobile)] md:h-[var(--height-topbar-desktop)]',
		'bg-card border-b border-secondary shadow-[var(--shadow-nav)]',
		'flex items-center justify-between',
		'px-4 md:px-6',
		className
	)}
>
	<!-- Left: Brand -->
	<a
		href="/dashboard"
		class="flex items-center gap-1 no-underline"
	>
		<span class="text-lg font-semibold text-headers">VibeCoding</span>
		<span class="hidden lg:inline text-sm text-labels ml-1">Professionals</span>
	</a>

	<!-- Right: User avatar + AccountMenu -->
	<AccountMenu {user} />
</header>
