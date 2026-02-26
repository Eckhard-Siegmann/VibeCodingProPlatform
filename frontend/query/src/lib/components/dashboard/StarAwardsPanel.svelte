<script lang="ts">
	import { Card, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
	import { toastSuccess, toastError } from '$lib/stores/toast';
	import { Star, Trophy, Info } from '@lucide/svelte';

	// ── Types ────────────────────────────────────────────────────────────────

	export interface ReviewScoreItem {
		problemId: string;
		problemTitle: string;
		problemSlug: string;
		teamMembers: string | null; // comma-separated display_names
		weightedScore: number | null;
		responseCount: number;
	}

	export interface ExistingAward {
		awardId: string;
		problemId: string;
		problemTitle: string;
		userId: string;
		userDisplayName: string;
		place: number;
		starsAwarded: number;
		awardedByDisplayName: string;
		awardedAt: string;
	}

	interface Props {
		eventId: string;
		eventTitle: string;
		reviewScores: ReviewScoreItem[];
		existingAwards: ExistingAward[];
		class?: string;
	}

	let { eventId, eventTitle, reviewScores, existingAwards, class: className }: Props = $props();

	// ── State ────────────────────────────────────────────────────────────────

	// Map from problemId → selected place ('' = no award)
	let selectedPlaces = $state<Record<string, '' | '1' | '2' | '3'>>({});

	// Initialise from suggested ranking (top 3 by score)
	$effect(() => {
		const initial: Record<string, '' | '1' | '2' | '3'> = {};
		reviewScores.forEach((item, index) => {
			initial[item.problemId] = index < 3 ? (String(index + 1) as '1' | '2' | '3') : '';
		});
		selectedPlaces = initial;
	});

	let confirmOpen = $state(false);
	let isSubmitting = $state(false);

	// ── Derived ──────────────────────────────────────────────────────────────

	const alreadyAwarded = $derived(existingAwards.length > 0);

	// Awards that will be submitted (non-empty places)
	const pendingAwards = $derived(
		Object.entries(selectedPlaces)
			.filter(([, place]) => place !== '')
			.map(([problemId, place]) => ({
				problemId,
				place: Number(place) as 1 | 2 | 3
			}))
	);

	// Check for duplicate places
	const hasDuplicates = $derived(() => {
		const places = pendingAwards.map((a) => a.place);
		return new Set(places).size !== places.length;
	});

	const canConfirm = $derived(pendingAwards.length > 0 && !hasDuplicates());

	// Validation message
	const validationMessage = $derived(() => {
		if (hasDuplicates()) return 'Each place can only be assigned to one problem.';
		if (pendingAwards.length === 0) return 'Assign at least one award before confirming.';
		return '';
	});

	// Summary for confirm dialog
	const confirmSummary = $derived(() => {
		return pendingAwards
			.sort((a, b) => a.place - b.place)
			.map((a) => {
				const item = reviewScores.find((r) => r.problemId === a.problemId);
				const stars = a.place === 1 ? '★★★' : a.place === 2 ? '★★' : '★';
				return `${stars} ${placeLabel(a.place)}: ${item?.problemTitle ?? a.problemId}`;
			})
			.join('\n');
	});

	// Group existing awards by problem for display
	const awardedByProblem = $derived(() => {
		const map: Record<string, { place: number; users: string[]; awardedBy: string; at: string }> =
			{};
		for (const award of existingAwards) {
			if (!map[award.problemId]) {
				map[award.problemId] = {
					place: award.place,
					users: [],
					awardedBy: award.awardedByDisplayName,
					at: award.awardedAt
				};
			}
			map[award.problemId].users.push(award.userDisplayName);
		}
		return Object.entries(map)
			.map(([problemId, data]) => ({
				problemId,
				problemTitle:
					existingAwards.find((a) => a.problemId === problemId)?.problemTitle ?? problemId,
				...data
			}))
			.sort((a, b) => a.place - b.place);
	});

	// ── Helpers ──────────────────────────────────────────────────────────────

	function placeLabel(place: number): string {
		return place === 1 ? '1st place' : place === 2 ? '2nd place' : '3rd place';
	}

	function placeIcon(place: number): string {
		return place === 1 ? '🥇' : place === 2 ? '🥈' : '🥉';
	}

	function resetToSuggested() {
		const initial: Record<string, '' | '1' | '2' | '3'> = {};
		reviewScores.forEach((item, index) => {
			initial[item.problemId] = index < 3 ? (String(index + 1) as '1' | '2' | '3') : '';
		});
		selectedPlaces = initial;
	}

	function isPlaceDisabledForProblem(problemId: string, place: string): boolean {
		// A place is disabled if assigned to a different problem
		return Object.entries(selectedPlaces).some(
			([pid, p]) => pid !== problemId && p === place
		);
	}

	// ── Submit ───────────────────────────────────────────────────────────────

	async function handleConfirm() {
		isSubmitting = true;
		confirmOpen = false;

		try {
			const response = await fetch(`/api/events/${eventId}/star-awards`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ awards: pendingAwards })
			});

			const data = await response.json();

			if (!response.ok || !data.success) {
				toastError('Failed to confirm awards', data.error ?? 'Please try again.');
				return;
			}

			toastSuccess('Star awards confirmed!', 'Top contributors have been recognised.');

			// Reload page to show confirmed state
			window.location.reload();
		} catch {
			toastError('Network error', 'Could not reach the server.');
		} finally {
			isSubmitting = false;
		}
	}
</script>

<Card class={className} elevation="raised">
	<CardHeader>
		<CardTitle class="flex items-center gap-2">
			<Star class="text-pending h-5 w-5" />
			Star Awards
		</CardTitle>
		<p class="text-labels text-sm">{eventTitle}</p>
	</CardHeader>

	{#if alreadyAwarded}
		<!-- ── Confirmed State ─────────────────────────────── -->
		<div class="px-4 pb-4">
			<div class="mb-3 flex items-center gap-2">
				<Trophy class="text-pending h-4 w-4" />
				<span class="text-sm font-medium text-headers">Awards Confirmed</span>
			</div>

			<div class="space-y-2">
				{#each awardedByProblem() as award (award.problemId)}
					<div class="flex items-start gap-3 rounded-md bg-canvas p-3">
						<span class="text-xl leading-none">{placeIcon(award.place)}</span>
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-medium text-headers">{award.problemTitle}</p>
							<p class="text-xs text-labels">{award.users.join(', ')}</p>
						</div>
						<span class="text-xs text-labels">{placeLabel(award.place)}</span>
					</div>
				{/each}
			</div>

			<p class="mt-3 text-xs text-labels">
				Awarded by {awardedByProblem()[0]?.awardedBy ?? '—'} ·
				{new Date(awardedByProblem()[0]?.at ?? '').toLocaleDateString('en-GB', {
					day: 'numeric',
					month: 'short',
					year: 'numeric'
				})}
			</p>
		</div>
	{:else if reviewScores.length === 0}
		<!-- ── No review data ─────────────────────────────── -->
		<div class="px-4 pb-4">
			<div class="flex items-start gap-2 rounded-md border border-border bg-canvas p-3">
				<Info class="mt-0.5 h-4 w-4 shrink-0 text-labels" />
				<p class="text-sm text-labels">
					No review scores available yet. Star awards can be confirmed once at least one review
					assessment has been closed for this event.
				</p>
			</div>
		</div>
	{:else}
		<!-- ── Ranking Interface ──────────────────────────── -->
		<div class="px-4 pb-4">
			<p class="mb-3 text-sm italic text-labels">
				Assign 1st, 2nd, and 3rd to the top solutions. Rankings are suggested by weighted review
				scores.
			</p>

			<!-- Desktop: table layout -->
			<div class="hidden sm:block">
				<div class="mb-2 grid grid-cols-[2rem_1fr_5rem_7rem] gap-2 text-xs font-medium text-labels">
					<span>#</span>
					<span>Problem</span>
					<span class="text-right">Score</span>
					<span class="text-center">Award</span>
				</div>
				<div class="space-y-2">
					{#each reviewScores as item, index (item.problemId)}
						<div class="grid grid-cols-[2rem_1fr_5rem_7rem] items-center gap-2">
							<span class="text-sm text-labels">{index + 1}</span>
							<div class="min-w-0">
								<p class="truncate text-sm font-medium text-headers">{item.problemTitle}</p>
								{#if item.teamMembers}
									<p class="truncate text-xs text-labels">Team: {item.teamMembers}</p>
								{/if}
							</div>
							<span class="text-right font-mono text-sm text-headers">
								{item.weightedScore !== null ? item.weightedScore.toFixed(1) : '—'}
							</span>
							<select
								bind:value={selectedPlaces[item.problemId]}
								class="h-9 rounded-md border border-border bg-surface px-2 text-sm text-headers focus:ring-2 focus:ring-primary"
							>
								<option value="">No award</option>
								<option value="1" disabled={isPlaceDisabledForProblem(item.problemId, '1')}
									>1st place</option
								>
								<option value="2" disabled={isPlaceDisabledForProblem(item.problemId, '2')}
									>2nd place</option
								>
								<option value="3" disabled={isPlaceDisabledForProblem(item.problemId, '3')}
									>3rd place</option
								>
							</select>
						</div>
					{/each}
				</div>
			</div>

			<!-- Mobile: card layout -->
			<div class="space-y-3 sm:hidden">
				{#each reviewScores as item, index (item.problemId)}
					<div class="rounded-md border border-border bg-canvas p-3">
						<div class="mb-2 flex items-start justify-between gap-2">
							<div class="min-w-0">
								<p class="text-xs text-labels">#{index + 1}</p>
								<p class="text-sm font-medium text-headers">{item.problemTitle}</p>
								{#if item.teamMembers}
									<p class="text-xs text-labels">Team: {item.teamMembers}</p>
								{/if}
							</div>
							<span class="shrink-0 font-mono text-sm text-headers">
								{item.weightedScore !== null ? item.weightedScore.toFixed(1) : '—'}
							</span>
						</div>
						<select
							bind:value={selectedPlaces[item.problemId]}
							class="h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-headers"
						>
							<option value="">No award</option>
							<option value="1" disabled={isPlaceDisabledForProblem(item.problemId, '1')}
								>1st place</option
							>
							<option value="2" disabled={isPlaceDisabledForProblem(item.problemId, '2')}
								>2nd place</option
							>
							<option value="3" disabled={isPlaceDisabledForProblem(item.problemId, '3')}
								>3rd place</option
							>
						</select>
					</div>
				{/each}
			</div>

			<!-- Validation message -->
			{#if validationMessage()}
				<p class="mt-2 text-xs text-alert">{validationMessage()}</p>
			{/if}

			<!-- Actions -->
			<div class="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-between">
				<Button variant="ghost" size="sm" onclick={resetToSuggested}>Reset to Suggested</Button>
				<Button
					variant="default"
					disabled={!canConfirm || isSubmitting}
					onclick={() => (confirmOpen = true)}
				>
					{isSubmitting ? 'Confirming…' : 'Confirm Awards'}
				</Button>
			</div>
		</div>
	{/if}
</Card>

<!-- Confirmation dialog -->
<ConfirmDialog
	bind:open={confirmOpen}
	title="Confirm Star Awards?"
	message={confirmSummary() + '\n\nThis cannot be undone.'}
	confirmLabel="Confirm"
	cancelLabel="Cancel"
	onConfirm={handleConfirm}
	onCancel={() => (confirmOpen = false)}
/>
