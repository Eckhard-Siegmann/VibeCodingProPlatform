<script lang="ts">
	/**
	 * OwnerBanner — Informational banner showing PO/Deputy elevated rights.
	 *
	 * Replaces the deprecated PrivateWarningBanner. Access is role-based via
	 * authentication (Ch.13.2), not URL-based.
	 *
	 * PO variant: blue-tinted background, primary accent.
	 * Deputy variant: purple-tinted background, purple accent.
	 */

	interface Props {
		role: 'owner' | 'deputy';
		readinessState: string;
	}

	let { role, readinessState }: Props = $props();

	const heading = $derived(
		role === 'owner' ? 'You are the Problem Owner' : 'You are the Deputy Problem Owner'
	);

	const editStatus = $derived(
		readinessState === 'draft' ? 'Editing enabled' : 'Read-only'
	);

	const stateLabel = $derived(
		readinessState.charAt(0).toUpperCase() + readinessState.slice(1).replace(/_/g, ' ')
	);

	const isOwner = $derived(role === 'owner');
</script>

<div
	class="mb-6 p-4 rounded-lg flex items-start gap-3 border-l-[3px] {isOwner
		? 'bg-primary/8 border-l-primary'
		: 'bg-purple-bg border-l-purple'}"
	role="status"
>
	<svg
		class="w-5 h-5 flex-shrink-0 mt-0.5 {isOwner ? 'text-primary' : 'text-purple'}"
		fill="none"
		stroke="currentColor"
		viewBox="0 0 24 24"
	>
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			stroke-width="2"
			d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
		/>
	</svg>
	<div>
		<h3 class="font-semibold {isOwner ? 'text-primary' : 'text-purple'}">{heading}</h3>
		<p class="text-sm text-labels mt-0.5">
			Status: {stateLabel} &bull; {editStatus}
		</p>
	</div>
</div>
