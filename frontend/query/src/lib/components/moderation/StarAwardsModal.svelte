<script lang="ts">
	import { cn } from '$lib/utils';
	import { Button } from '$lib/components/ui/button';
	import { Dialog } from 'bits-ui';
	import X from '@lucide/svelte/icons/x';
	import Trophy from '@lucide/svelte/icons/trophy';
	import Star from '@lucide/svelte/icons/star';
	import ChevronUp from '@lucide/svelte/icons/chevron-up';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import Check from '@lucide/svelte/icons/check';
	import AlertCircle from '@lucide/svelte/icons/alert-circle';

	export interface TeamScore {
		team_id: string;
		team_name: string;
		members: string[];
		weighted_score: number;
		live_reviews: number;
		post_event_reviews: number;
		agent_reviews: number;
		suggested_rank: 1 | 2 | 3 | null;
	}

	export interface StarAward {
		team_id: string;
		rank: 1 | 2 | 3;
	}

	interface Props {
		open: boolean;
		problemId: string;
		problemTitle: string;
		eventTitle: string;
		teams: TeamScore[];
		onConfirm: (awards: StarAward[]) => void | Promise<void>;
		onCancel: () => void;
		class?: string;
	}

	let {
		open = $bindable(),
		problemId,
		problemTitle,
		eventTitle,
		teams,
		onConfirm,
		onCancel,
		class: className
	}: Props = $props();

	// State for adjusted rankings
	let rankings: Map<string, 1 | 2 | 3 | null> = $state(new Map());
	let confirming = $state(false);

	// Detect mobile viewport
	let isMobile = $state(false);

	$effect(() => {
		if (typeof window !== 'undefined') {
			const checkMobile = () => {
				isMobile = window.innerWidth < 640;
			};
			checkMobile();
			window.addEventListener('resize', checkMobile);
			return () => window.removeEventListener('resize', checkMobile);
		}
	});

	// Initialize rankings from suggested ranks
	$effect(() => {
		if (open) {
			const newRankings = new Map<string, 1 | 2 | 3 | null>();
			teams.forEach((team) => {
				newRankings.set(team.team_id, team.suggested_rank);
			});
			rankings = newRankings;
			confirming = false;
		}
	});

	// Sorted teams by score
	const sortedTeams = $derived(() => {
		return [...teams].sort((a, b) => b.weighted_score - a.weighted_score);
	});

	// Get rank for a team
	function getRank(teamId: string): 1 | 2 | 3 | null {
		return rankings.get(teamId) ?? null;
	}

	// Set rank for a team (and handle conflicts)
	function setRank(teamId: string, rank: 1 | 2 | 3 | null) {
		const newRankings = new Map(rankings);

		// If assigning a rank, remove it from any other team
		if (rank !== null) {
			for (const [id, existingRank] of newRankings) {
				if (existingRank === rank && id !== teamId) {
					newRankings.set(id, null);
				}
			}
		}

		newRankings.set(teamId, rank);
		rankings = newRankings;
	}

	// Move rank up (swap with team above)
	function moveRankUp(teamId: string) {
		const rank = getRank(teamId);
		if (rank === 1 || rank === null) return;

		const targetRank = (rank - 1) as 1 | 2 | 3;
		const otherTeam = Array.from(rankings.entries()).find(([_, r]) => r === targetRank);

		const newRankings = new Map(rankings);
		if (otherTeam) {
			newRankings.set(otherTeam[0], rank);
		}
		newRankings.set(teamId, targetRank);
		rankings = newRankings;
	}

	// Move rank down (swap with team below)
	function moveRankDown(teamId: string) {
		const rank = getRank(teamId);
		if (rank === 3 || rank === null) return;

		const targetRank = (rank + 1) as 1 | 2 | 3;
		const otherTeam = Array.from(rankings.entries()).find(([_, r]) => r === targetRank);

		const newRankings = new Map(rankings);
		if (otherTeam) {
			newRankings.set(otherTeam[0], rank);
		}
		newRankings.set(teamId, targetRank);
		rankings = newRankings;
	}

	// Check if all top 3 ranks are assigned
	const allRanksAssigned = $derived(() => {
		const assignedRanks = new Set(Array.from(rankings.values()).filter((r) => r !== null));
		return assignedRanks.has(1) && assignedRanks.has(2) && assignedRanks.has(3);
	});

	// Handle confirm
	async function handleConfirm() {
		confirming = true;
		try {
			const awards: StarAward[] = [];
			for (const [teamId, rank] of rankings) {
				if (rank !== null) {
					awards.push({ team_id: teamId, rank });
				}
			}
			await onConfirm(awards);
			open = false;
		} finally {
			confirming = false;
		}
	}

	// Handle cancel
	function handleCancel() {
		onCancel();
		open = false;
	}

	// Format score for display
	function formatScore(score: number): string {
		return score.toFixed(2);
	}

	// Get medal emoji for rank
	function getMedal(rank: 1 | 2 | 3 | null): string {
		switch (rank) {
			case 1:
				return '🥇';
			case 2:
				return '🥈';
			case 3:
				return '🥉';
			default:
				return '';
		}
	}

	// Get rank label
	function getRankLabel(rank: 1 | 2 | 3 | null): string {
		switch (rank) {
			case 1:
				return '1st Place';
			case 2:
				return '2nd Place';
			case 3:
				return '3rd Place';
			default:
				return 'Unranked';
		}
	}
</script>

<Dialog.Root bind:open onOpenChange={(isOpen) => !isOpen && onCancel()}>
	<Dialog.Portal>
		<!-- Overlay -->
		<Dialog.Overlay
			class="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
		/>

		<!-- Content -->
		<Dialog.Content
			class={cn(
				// Mobile: Full screen
				'fixed z-50 flex flex-col bg-card',
				isMobile
					? 'inset-0 rounded-none'
					: 'inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-2xl sm:w-full sm:max-h-[90vh] rounded-[var(--radius-card-lg)]',
				'shadow-[var(--shadow-floating)]',
				// Animations
				'data-[state=open]:animate-in data-[state=closed]:animate-out',
				'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
				isMobile ? '' : 'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
				className
			)}
		>
			<!-- Header -->
			<div class="flex items-start justify-between gap-4 p-4 border-b border-secondary">
				<div class="flex items-center gap-3">
					<div class="p-2 bg-pending/10 rounded-[var(--radius-card)]">
						<Trophy class="w-6 h-6 text-pending" />
					</div>
					<div>
						<Dialog.Title class="text-lg font-semibold text-headers">
							Star Awards
						</Dialog.Title>
						<Dialog.Description class="text-sm text-meta">
							{problemTitle} - {eventTitle}
						</Dialog.Description>
					</div>
				</div>
				<Dialog.Close
					class={cn(
						'p-2 -m-2 rounded-[var(--radius-card)] text-meta hover:text-headers hover:bg-canvas',
						'transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center'
					)}
					aria-label="Close dialog"
				>
					<X class="w-5 h-5" aria-hidden="true" />
				</Dialog.Close>
			</div>

			<!-- Scrollable Content -->
			<div class="flex-1 overflow-y-auto p-4 space-y-4">
				<!-- Instructions -->
				<div class="p-3 bg-canvas rounded-[var(--radius-card)]">
					<p class="text-sm text-meta">
						Review scores are weighted: Live (1.0x), Post-event (1.5x), Agent (0.5x).
						Adjust rankings if needed, then confirm to award stars.
					</p>
				</div>

				<!-- Team Scores -->
				<div class="space-y-3">
					{#each sortedTeams() as team, index (team.team_id)}
						{@const rank = getRank(team.team_id)}
						{@const isRanked = rank !== null}

						<div
							class={cn(
								'p-4 rounded-[var(--radius-card)] border transition-all',
								isRanked
									? 'border-pending bg-pending/5'
									: 'border-secondary bg-card'
							)}
						>
							<div class="flex items-start justify-between gap-3">
								<!-- Team Info -->
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-2">
										{#if rank}
											<span class="text-2xl">{getMedal(rank)}</span>
										{:else}
											<span class="text-sm text-meta w-7 text-center">#{index + 1}</span>
										{/if}
										<h4 class="font-medium text-headers truncate">{team.team_name}</h4>
									</div>
									<p class="text-sm text-meta mt-1 truncate">
										{team.members.join(', ')}
									</p>

									<!-- Score Breakdown -->
									<div class="mt-2 flex flex-wrap gap-3 text-xs">
										<span class="px-2 py-1 bg-canvas rounded">
											Score: <strong class="text-headers">{formatScore(team.weighted_score)}</strong>
										</span>
										<span class="text-meta">
											{team.live_reviews} live / {team.post_event_reviews} post / {team.agent_reviews} agent
										</span>
									</div>
								</div>

								<!-- Rank Controls -->
								<div class="flex flex-col items-center gap-1">
									{#if isRanked}
										<!-- Adjust rank up/down -->
										<button
											type="button"
											onclick={() => moveRankUp(team.team_id)}
											disabled={rank === 1}
											class={cn(
												'p-1.5 rounded transition-colors',
												'hover:bg-canvas disabled:opacity-30 disabled:cursor-not-allowed'
											)}
											title="Move up"
										>
											<ChevronUp class="w-4 h-4 text-meta" />
										</button>
										<span class="text-sm font-semibold text-pending">
											{rank}
										</span>
										<button
											type="button"
											onclick={() => moveRankDown(team.team_id)}
											disabled={rank === 3}
											class={cn(
												'p-1.5 rounded transition-colors',
												'hover:bg-canvas disabled:opacity-30 disabled:cursor-not-allowed'
											)}
											title="Move down"
										>
											<ChevronDown class="w-4 h-4 text-meta" />
										</button>
									{:else}
										<!-- Assign rank buttons -->
										<div class="flex gap-1">
											{#each [1, 2, 3] as r (r)}
												{@const isAssigned = Array.from(rankings.values()).includes(r as 1 | 2 | 3)}
												<button
													type="button"
													onclick={() => setRank(team.team_id, r as 1 | 2 | 3)}
													disabled={isAssigned}
													class={cn(
														'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
														'transition-colors',
														isAssigned
															? 'bg-canvas text-meta cursor-not-allowed opacity-50'
															: 'bg-pending/10 text-pending hover:bg-pending/20'
													)}
													title={`Assign ${getRankLabel(r as 1 | 2 | 3)}`}
												>
													{r}
												</button>
											{/each}
										</div>
									{/if}
								</div>
							</div>

							<!-- Remove rank button if ranked -->
							{#if isRanked}
								<div class="mt-2 pt-2 border-t border-secondary/50">
									<button
										type="button"
										onclick={() => setRank(team.team_id, null)}
										class="text-xs text-meta hover:text-alert transition-colors"
									>
										Remove from rankings
									</button>
								</div>
							{/if}
						</div>
					{/each}
				</div>

				<!-- Validation Warning -->
				{#if !allRanksAssigned()}
					<div class="p-3 bg-warning-bg border border-warning rounded-[var(--radius-card)]">
						<p class="text-sm text-warning flex items-start gap-2">
							<AlertCircle class="w-4 h-4 mt-0.5 flex-shrink-0" />
							<span>
								All three ranks (1st, 2nd, 3rd) must be assigned before confirming.
							</span>
						</p>
					</div>
				{/if}
			</div>

			<!-- Footer -->
			<div class="flex items-center justify-end gap-3 p-4 border-t border-secondary">
				<Button variant="secondary" onclick={handleCancel} disabled={confirming}>
					Cancel
				</Button>
				<Button
					variant="default"
					onclick={handleConfirm}
					disabled={!allRanksAssigned() || confirming}
					class="bg-pending hover:bg-pending/90"
				>
					{#if confirming}
						<span class="animate-spin mr-2">
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
						</span>
					{:else}
						<Star class="w-4 h-4 mr-2" />
					{/if}
					Confirm Awards
				</Button>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
