<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';

	type ButtonVariant = 'default' | 'secondary' | 'ghost' | 'destructive' | 'outline' | 'link';
	type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

	interface Props extends HTMLButtonAttributes {
		children: Snippet;
		variant?: ButtonVariant;
		size?: ButtonSize;
		fullWidth?: boolean;
		class?: string;
	}

	let {
		children,
		variant = 'default',
		size = 'md',
		fullWidth = false,
		class: className,
		disabled,
		...restProps
	}: Props = $props();

	const base =
		'inline-flex items-center justify-center font-medium rounded-[var(--radius-card)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 disabled:cursor-not-allowed';

	const variantMap: Record<ButtonVariant, string> = {
		default: 'bg-primary text-white hover:bg-primary-hover active:bg-primary',
		secondary: 'bg-secondary text-headers hover:bg-secondary-dark border border-secondary-dark',
		ghost: 'bg-transparent text-headers hover:bg-canvas',
		destructive: 'bg-alert text-white hover:bg-alert/90',
		outline: 'border border-secondary-dark bg-transparent text-headers hover:bg-canvas',
		link: 'text-primary underline-offset-4 hover:underline bg-transparent'
	};

	const sizeMap: Record<ButtonSize, string> = {
		sm: 'text-sm px-3 py-1.5 min-h-[36px]',
		md: 'text-base px-4 py-2 min-h-[44px]',
		lg: 'text-lg px-6 py-3 min-h-[52px]',
		icon: 'h-10 w-10'
	};
</script>

<button
	class={cn(base, variantMap[variant], sizeMap[size], fullWidth && 'w-full', className)}
	{disabled}
	{...restProps}
>
	{@render children()}
</button>
