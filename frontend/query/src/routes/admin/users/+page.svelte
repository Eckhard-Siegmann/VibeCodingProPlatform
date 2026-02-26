<!--
  Admin User Management — server-side pagination, search, filtering.
  Spec: Ch.17.5, Ch.12.10 | Design: pagedesign/admin_interfaces_design.md | Ticket: TICKET-30
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { cn } from '$lib/utils';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import SearchBar from '$lib/components/ui/SearchBar.svelte';
	import ListFilterBar from '$lib/components/ui/ListFilterBar.svelte';
	import Pagination from '$lib/components/ui/Pagination.svelte';
	import type { FilterConfig } from '$lib/components/ui/ListFilterBar.svelte';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Upload from '@lucide/svelte/icons/upload';
	import Download from '@lucide/svelte/icons/download';
	import Shield from '@lucide/svelte/icons/shield';
	import Mail from '@lucide/svelte/icons/mail';

	interface UserData {
		user_id: string;
		email: string;
		display_name: string;
		role: 'observer' | 'developer' | 'coding_partner' | 'problem_owner' | 'moderator' | 'admin' | 'agent';
		registered_at: string;
		email_confirmed: boolean;
		newsletter_subscribed: boolean;
		events_attended: number;
	}

	let { data } = $props();

	let searchValue = $state(data.filters.search);

	// Promote state
	let promotingUser = $state<UserData | null>(null);
	let promotingToRole = $state<'moderator' | 'admin'>('moderator');
	let promoteError = $state('');
	let promoting = $state(false);

	// Filter configuration per Ch.17.5 and admin_interfaces_design.md
	const filterConfig: FilterConfig[] = [
		{
			key: 'role',
			label: 'Role',
			options: [
				{ value: 'all', label: 'All Roles' },
				{ value: 'observer', label: 'Observer' },
				{ value: 'developer', label: 'Developer' },
				{ value: 'coding_partner', label: 'Coding Partner' },
				{ value: 'problem_owner', label: 'Problem Owner' },
				{ value: 'moderator', label: 'Moderator' },
				{ value: 'admin', label: 'Administrator' }
			],
			defaultValue: 'all'
		},
		{
			key: 'emailStatus',
			label: 'Email Status',
			options: [
				{ value: 'all', label: 'All Status' },
				{ value: 'confirmed', label: 'Confirmed' },
				{ value: 'unconfirmed', label: 'Unconfirmed' }
			],
			defaultValue: 'all'
		},
		{
			key: 'sort',
			label: 'Sort',
			options: [
				{ value: 'newest', label: 'Newest First' },
				{ value: 'oldest', label: 'Oldest First' },
				{ value: 'name_asc', label: 'Name A–Z' },
				{ value: 'name_desc', label: 'Name Z–A' },
				{ value: 'role', label: 'By Role' }
			],
			defaultValue: 'newest'
		}
	];

	// URL state management (Ch.12.10.4)
	function updateUrl(params: Record<string, string>, options?: { resetPage?: boolean; pushState?: boolean }) {
		const url = new URL($page.url);
		for (const [key, value] of Object.entries(params)) {
			if (value && value !== 'all' && value !== 'newest' && value !== '1' && value !== '') {
				url.searchParams.set(key, value);
			} else {
				url.searchParams.delete(key);
			}
		}
		if (options?.resetPage) {
			url.searchParams.delete('page');
		}
		goto(url.pathname + url.search, {
			replaceState: !options?.pushState,
			keepFocus: true,
			noScroll: true
		});
	}

	function handleSearch(query: string) {
		updateUrl({ search: query }, { resetPage: true });
	}

	function handleFilterChange(key: string, value: string) {
		updateUrl({ [key]: value }, { resetPage: true });
	}

	function handleClearAll() {
		searchValue = '';
		goto('/admin/users', { replaceState: true });
	}

	function handlePageChange(newPage: number) {
		updateUrl({ page: String(newPage) }, { pushState: true });
	}

	// Promote logic
	function nextRole(user: UserData): 'moderator' | 'admin' {
		return user.role === 'moderator' ? 'admin' : 'moderator';
	}

	function handlePromote(user: UserData) {
		promotingUser = user;
		promotingToRole = nextRole(user);
		promoteError = '';
	}

	async function confirmPromote() {
		if (!promotingUser) return;
		promoting = true;
		promoteError = '';

		try {
			const res = await fetch(`/api/admin/users/${promotingUser.user_id}/promote`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ role: promotingToRole })
			});
			const json = await res.json();
			if (json.success) {
				promotingUser = null;
				// Reload page with current filters to get fresh data
				goto($page.url.pathname + $page.url.search, { invalidateAll: true });
			} else {
				promoteError = json.error ?? 'Promotion failed.';
			}
		} catch {
			promoteError = 'Network error. Please try again.';
		} finally {
			promoting = false;
		}
	}

	function handleImportCSV() {
		window.location.href = '/admin/csv-import';
	}

	function handleExportNewsletter() {
		const subs = data.users.filter((u: UserData) => u.newsletter_subscribed);
		const csv = ['email,display_name', ...subs.map((u: UserData) => `${u.email},${u.display_name}`)].join('\n');
		const blob = new Blob([csv], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'newsletter_subscribers.csv';
		a.click();
		URL.revokeObjectURL(url);
	}

	// Role badge variant
	function getRoleBadgeVariant(role: string): 'default' | 'secondary' | 'outline' | 'destructive' {
		switch (role) {
			case 'admin': return 'destructive';
			case 'moderator': return 'default';
			case 'problem_owner': case 'coding_partner': return 'secondary';
			default: return 'outline';
		}
	}

	function formatDate(isoString: string): string {
		return new Date(isoString).toLocaleDateString('en-GB', {
			day: '2-digit', month: 'short', year: 'numeric'
		});
	}

	const hasActiveFilters = $derived(
		data.filters.search !== '' ||
		data.filters.role !== 'all' ||
		data.filters.emailStatus !== 'all' ||
		data.filters.sort !== 'newest'
	);
</script>

<svelte:head>
	<title>User Management | Admin | VibeCoding</title>
</svelte:head>

<div class="min-h-screen bg-viewport">
	<div class="max-w-7xl mx-auto px-4 py-6 md:py-8">
		<!-- Header -->
		<div class="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
			<div class="flex items-center gap-4">
				<a
					href="/admin"
					class="p-2 rounded-[var(--radius-card)] hover:bg-canvas transition-colors"
					title="Back to Admin"
				>
					<ArrowLeft class="w-5 h-5 text-meta" />
				</a>
				<div>
					<h1 class="text-2xl md:text-3xl font-bold text-headers">User Management</h1>
					<p class="text-meta">View, import, and manage user accounts</p>
				</div>
			</div>

			<div class="flex flex-wrap gap-2">
				<Button variant="secondary" onclick={handleExportNewsletter}>
					<Download class="w-4 h-4 mr-2" />
					Export Newsletter
				</Button>
				<Button variant="default" onclick={handleImportCSV}>
					<Upload class="w-4 h-4 mr-2" />
					Import CSV
				</Button>
			</div>
		</div>

		<!-- Search + Filters -->
		<div class="space-y-3 mb-6">
			<SearchBar
				bind:value={searchValue}
				placeholder="Search by name or email…"
				onSearch={handleSearch}
				class="w-full md:w-80"
			/>

			<ListFilterBar
				filters={filterConfig}
				values={data.filters}
				onFilterChange={handleFilterChange}
				showClearAll={true}
				onClearAll={handleClearAll}
				class="overflow-x-auto md:overflow-visible flex-nowrap md:flex-wrap"
			/>
		</div>

		<!-- Results count -->
		{#if data.users.length > 0}
			<p class="text-sm text-labels mb-4" aria-live="polite">
				{#if data.filters.search}
					{data.pagination.totalItems} user{data.pagination.totalItems !== 1 ? 's' : ''} matching "{data.filters.search}"
				{:else}
					Showing {(data.pagination.page - 1) * data.pagination.pageSize + 1}–{Math.min(data.pagination.page * data.pagination.pageSize, data.pagination.totalItems)} of {data.pagination.totalItems} user{data.pagination.totalItems !== 1 ? 's' : ''}
				{/if}
			</p>
		{/if}

		<!-- User List -->
		<Card elevation="resting">
			<CardContent>
				{#if data.users.length > 0}
					<!-- Desktop: table -->
					<div class="hidden md:block overflow-x-auto">
						<table class="w-full text-sm">
							<thead>
								<tr class="border-b border-secondary">
									<th class="text-left py-3 px-2 text-labels font-medium">Name</th>
									<th class="text-left py-3 px-2 text-labels font-medium">Email</th>
									<th class="text-left py-3 px-2 text-labels font-medium">Role</th>
									<th class="text-left py-3 px-2 text-labels font-medium">Registered</th>
									<th class="text-left py-3 px-2 text-labels font-medium">Email Status</th>
									<th class="text-left py-3 px-2 text-labels font-medium">Events</th>
									<th class="py-3 px-2"></th>
								</tr>
							</thead>
							<tbody>
								{#each data.users as user (user.user_id)}
									<tr class="border-b border-secondary/50 hover:bg-canvas/50 transition-colors">
										<td class="py-3 px-2 font-medium text-headers">{user.display_name}</td>
										<td class="py-3 px-2 text-body">{user.email}</td>
										<td class="py-3 px-2">
											<Badge variant={getRoleBadgeVariant(user.role)}>
												{user.role.replace(/_/g, ' ')}
											</Badge>
										</td>
										<td class="py-3 px-2 text-labels">{formatDate(user.registered_at)}</td>
										<td class="py-3 px-2">
											<div class="flex items-center gap-2">
												{#if user.email_confirmed}
													<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-success/10 text-success">Confirmed</span>
												{:else}
													<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-pending/10 text-pending">Pending</span>
												{/if}
												{#if user.newsletter_subscribed}
													<Mail class="w-4 h-4 text-primary" />
												{/if}
											</div>
										</td>
										<td class="py-3 px-2 text-labels">{user.events_attended}</td>
										<td class="py-3 px-2">
											{#if user.role !== 'admin'}
												<button
													onclick={() => handlePromote(user)}
													class="p-1.5 rounded hover:bg-canvas text-labels hover:text-headers transition-colors"
													title="Promote to {nextRole(user)}"
													aria-label="Promote {user.display_name} to {nextRole(user)}"
												>
													<Shield class="w-4 h-4" />
												</button>
											{/if}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>

					<!-- Mobile: cards -->
					<div class="md:hidden space-y-3">
						{#each data.users as user (user.user_id)}
							<div class="p-3 rounded-[var(--radius-card)] border border-secondary/50">
								<div class="flex items-start justify-between gap-2">
									<div class="min-w-0">
										<p class="font-medium text-headers truncate">{user.display_name}</p>
										<p class="text-sm text-labels truncate">{user.email}</p>
									</div>
									{#if user.role !== 'admin'}
										<button
											onclick={() => handlePromote(user)}
											class="p-2 rounded hover:bg-canvas text-labels hover:text-headers transition-colors flex-shrink-0"
											title="Promote"
											aria-label="Promote {user.display_name}"
										>
											<Shield class="w-4 h-4" />
										</button>
									{/if}
								</div>
								<div class="flex items-center gap-2 mt-2">
									<Badge variant={getRoleBadgeVariant(user.role)}>
										{user.role.replace(/_/g, ' ')}
									</Badge>
									{#if user.email_confirmed}
										<span class="text-xs text-success">Confirmed</span>
									{:else}
										<span class="text-xs text-pending">Pending</span>
									{/if}
								</div>
								<p class="text-xs text-labels mt-1">
									{formatDate(user.registered_at)} · {user.events_attended} event{user.events_attended !== 1 ? 's' : ''}
								</p>
							</div>
						{/each}
					</div>
				{:else if hasActiveFilters}
					<div class="py-12 text-center">
						<p class="text-meta">No users match your current filters.</p>
						<p class="text-sm text-meta mt-1">
							Try adjusting your search or
							<button
								type="button"
								class="text-primary underline"
								onclick={handleClearAll}
							>clear all filters</button>.
						</p>
					</div>
				{:else}
					<div class="py-12 text-center">
						<p class="text-meta">No users found.</p>
					</div>
				{/if}
			</CardContent>
		</Card>

		<!-- Pagination -->
		<Pagination
			page={data.pagination.page}
			pageSize={data.pagination.pageSize}
			totalItems={data.pagination.totalItems}
			totalPages={data.pagination.totalPages}
			onPageChange={handlePageChange}
		/>
	</div>
</div>

<!-- Promote confirmation dialog -->
{#if promotingUser}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
		<div class="bg-card rounded-[var(--radius-card)] shadow-[var(--shadow-xl)] w-full max-w-md p-6">
			<h2 class="text-lg font-semibold text-headers mb-2">
				Promote to {promotingToRole === 'admin' ? 'Administrator' : 'Moderator'}?
			</h2>
			<p class="text-sm text-labels mb-4">
				<span class="font-medium text-headers">{promotingUser.display_name}</span>
				({promotingUser.email}) will be promoted to <strong>{promotingToRole}</strong>.
				{#if promotingToRole === 'admin'}
					Administrators have full system access including user management and inventory control.
				{:else}
					Moderators can orchestrate events and make binding decisions on problems.
				{/if}
			</p>

			{#if promoteError}
				<div class="mb-4 p-3 rounded-lg text-sm bg-red-50 border-l-4 border-alert text-red-800" role="alert">
					{promoteError}
				</div>
			{/if}

			<div class="flex gap-3 justify-end">
				<button
					onclick={() => { promotingUser = null; promoteError = ''; }}
					class="px-4 py-2 text-sm font-medium text-headers bg-canvas rounded-[var(--radius-card)] hover:bg-secondary transition-colors"
					disabled={promoting}
				>
					Cancel
				</button>
				<button
					onclick={confirmPromote}
					class="px-4 py-2 text-sm font-medium text-white bg-primary rounded-[var(--radius-card)] hover:bg-primary/90 transition-colors disabled:opacity-50"
					disabled={promoting}
				>
					{promoting ? 'Promoting...' : `Promote to ${promotingToRole}`}
				</button>
			</div>
		</div>
	</div>
{/if}
