<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface Props extends HTMLButtonAttributes {
		children: Snippet;
		variant?: 'primary' | 'secondary' | 'ghost';
		size?: 'sm' | 'md' | 'lg';
		fullWidth?: boolean;
	}

	let {
		children,
		variant = 'primary',
		size = 'md',
		fullWidth = false,
		class: className = '',
		disabled,
		...restProps
	}: Props = $props();

	const baseClasses =
		'inline-flex items-center justify-center font-medium rounded-[var(--radius-card)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 disabled:cursor-not-allowed';

	const variantClasses = {
		primary: 'bg-primary text-white hover:bg-primary-hover active:bg-primary',
		secondary:
			'bg-secondary text-headers hover:bg-secondary-dark border border-secondary-dark',
		ghost: 'bg-transparent text-headers hover:bg-canvas'
	};

	const sizeClasses = {
		sm: 'text-sm px-3 py-1.5 min-h-[36px]',
		md: 'text-base px-4 py-2 min-h-[44px]',
		lg: 'text-lg px-6 py-3 min-h-[52px]'
	};
</script>

<button
	class="{baseClasses} {variantClasses[variant]} {sizeClasses[size]} {fullWidth
		? 'w-full'
		: ''} {className}"
	{disabled}
	{...restProps}
>
	{@render children()}
</button>
