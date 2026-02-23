<script lang="ts">
	import { Clock, CheckCircle } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';
	import { formatRelative } from '$lib/utils/date-formatting';

	interface Props {
		status: 'waitlisted' | 'invited';
		position?: number;
		expiresAt?: Date | string | null;
		onConfirm?: () => void;
		onDecline?: () => void;
		class?: string;
	}

	let {
		status,
		position,
		expiresAt,
		onConfirm,
		onDecline,
		class: className
	}: Props = $props();

	// Calculate time remaining for invitation
	const timeRemaining = $derived.by(() => {
		if (!expiresAt || status !== 'invited') return null;
		const expiry = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
		const now = new Date();
		const diffMs = expiry.getTime() - now.getTime();

		if (diffMs <= 0) return 'Expired';

		const hours = Math.floor(diffMs / (1000 * 60 * 60));
		const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

		if (hours > 0) {
			return `${hours}h ${minutes}m remaining`;
		}
		return `${minutes}m remaining`;
	});
</script>

{#if status === 'waitlisted'}
	<div
		class={cn(
			'rounded-lg border border-pending/30 bg-warning-bg p-4',
			className
		)}
		role="alert"
	>
		<div class="flex items-start gap-3">
			<Clock class="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
			<div class="flex-1">
				<p class="font-medium text-headers">
					You're on the waitlist
					{#if position}
						<span class="text-warning">(#{position})</span>
					{/if}
				</p>
				<p class="text-sm text-labels mt-1">
					We'll notify you when a spot opens up. In-presence spots are limited to ensure a great experience.
				</p>
			</div>
		</div>
	</div>
{:else if status === 'invited'}
	<div
		class={cn(
			'rounded-lg border border-success/30 bg-success/10 p-4',
			className
		)}
		role="alert"
	>
		<div class="flex items-start gap-3">
			<CheckCircle class="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
			<div class="flex-1">
				<p class="font-medium text-headers">
					A spot opened up!
				</p>
				<p class="text-sm text-labels mt-1">
					Confirm your attendance to secure your in-presence spot.
					{#if timeRemaining}
						<span class="font-medium text-warning">{timeRemaining}</span>
					{/if}
				</p>
				<div class="flex flex-wrap gap-3 mt-4">
					{#if onConfirm}
						<Button variant="default" onclick={onConfirm}>
							Confirm My Spot
						</Button>
					{/if}
					{#if onDecline}
						<Button variant="ghost" onclick={onDecline}>
							Decline
						</Button>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}
