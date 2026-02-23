<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';
	import { DataTable, type TableColumn, type TableAction } from '$lib/components/ui/data-table';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Select, type SelectOption } from '$lib/components/ui/select';
	import Edit from '@lucide/svelte/icons/pencil';
	import Shield from '@lucide/svelte/icons/shield';
	import Mail from '@lucide/svelte/icons/mail';
	import Search from '@lucide/svelte/icons/search';
	import Upload from '@lucide/svelte/icons/upload';
	import Download from '@lucide/svelte/icons/download';

	export interface UserData {
		user_id: string;
		email: string;
		display_name: string;
		role: 'observer' | 'developer' | 'coding_partner' | 'problem_owner' | 'moderator' | 'admin' | 'agent';
		registered_at: string;
		email_confirmed: boolean;
		newsletter_subscribed: boolean;
		events_attended: number;
	}

	interface Props {
		users: UserData[];
		loading?: boolean;
		onEdit: (user: UserData) => void;
		onPromote: (user: UserData) => void;
		onEmailUser: (user: UserData) => void;
		onImportCSV: () => void;
		onExportNewsletter: () => void;
		class?: string;
	}

	let {
		users,
		loading = false,
		onEdit,
		onPromote,
		onEmailUser,
		onImportCSV,
		onExportNewsletter,
		class: className
	}: Props = $props();

	// Filters
	let searchQuery = $state('');
	let roleFilter = $state('');
	let emailFilter = $state('');

	// Role options for filter
	const roleOptions: SelectOption[] = [
		{ value: '', label: 'All Roles' },
		{ value: 'observer', label: 'Observer' },
		{ value: 'developer', label: 'Developer' },
		{ value: 'coding_partner', label: 'Coding Partner' },
		{ value: 'problem_owner', label: 'Problem Owner' },
		{ value: 'moderator', label: 'Moderator' },
		{ value: 'admin', label: 'Administrator' },
		{ value: 'agent', label: 'Agent' }
	];

	// Email status options
	const emailFilterOptions: SelectOption[] = [
		{ value: '', label: 'All Email Status' },
		{ value: 'confirmed', label: 'Email Confirmed' },
		{ value: 'unconfirmed', label: 'Not Confirmed' },
		{ value: 'newsletter', label: 'Newsletter Subscribers' }
	];

	// Filtered users
	const filteredUsers = $derived(() => {
		return users.filter((user) => {
			// Search filter
			if (searchQuery) {
				const query = searchQuery.toLowerCase();
				if (
					!user.email.toLowerCase().includes(query) &&
					!user.display_name.toLowerCase().includes(query)
				) {
					return false;
				}
			}

			// Role filter
			if (roleFilter && user.role !== roleFilter) {
				return false;
			}

			// Email filter
			if (emailFilter === 'confirmed' && !user.email_confirmed) {
				return false;
			}
			if (emailFilter === 'unconfirmed' && user.email_confirmed) {
				return false;
			}
			if (emailFilter === 'newsletter' && !user.newsletter_subscribed) {
				return false;
			}

			return true;
		});
	});

	// Role badge variant mapping
	function getRoleBadgeVariant(
		role: string
	): 'default' | 'secondary' | 'outline' | 'destructive' {
		switch (role) {
			case 'admin':
				return 'destructive';
			case 'moderator':
				return 'default';
			case 'problem_owner':
			case 'coding_partner':
				return 'secondary';
			default:
				return 'outline';
		}
	}

	// Format date for display
	function formatDate(isoString: string): string {
		return new Date(isoString).toLocaleDateString('en-GB', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});
	}

	// Table columns
	const columns: TableColumn<UserData>[] = [
		{
			key: 'display_name',
			header: 'Name',
			primary: true,
			accessor: (row) => row.display_name
		},
		{
			key: 'email',
			header: 'Email',
			accessor: (row) => row.email
		},
		{
			key: 'role',
			header: 'Role',
			render: roleBadgeSnippet
		},
		{
			key: 'registered_at',
			header: 'Registered',
			accessor: (row) => formatDate(row.registered_at),
			hideInCard: true
		},
		{
			key: 'email_confirmed',
			header: 'Email Status',
			render: emailStatusSnippet,
			hideInCard: true
		},
		{
			key: 'events_attended',
			header: 'Events',
			accessor: (row) => `${row.events_attended} events`
		}
	];

	// Table actions
	const actions: TableAction<UserData>[] = [
		{
			label: 'Edit',
			icon: editIconSnippet,
			onclick: (row) => onEdit(row)
		},
		{
			label: 'Promote',
			icon: promoteIconSnippet,
			onclick: (row) => onPromote(row),
			hidden: (row) => row.role === 'admin'
		},
		{
			label: 'Email',
			icon: emailIconSnippet,
			onclick: (row) => onEmailUser(row)
		}
	];
</script>

{#snippet roleBadgeSnippet({ value, row }: { value: unknown; row: UserData })}
	<Badge variant={getRoleBadgeVariant(row.role)}>
		{row.role.replace('_', ' ')}
	</Badge>
{/snippet}

{#snippet emailStatusSnippet({ value, row }: { value: unknown; row: UserData })}
	<div class="flex items-center gap-2">
		{#if row.email_confirmed}
			<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-success/10 text-success">
				Confirmed
			</span>
		{:else}
			<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-pending/10 text-pending">
				Pending
			</span>
		{/if}
		{#if row.newsletter_subscribed}
			<Mail class="w-4 h-4 text-primary" title="Newsletter subscriber" />
		{/if}
	</div>
{/snippet}

{#snippet editIconSnippet()}
	<Edit class="w-4 h-4" />
{/snippet}

{#snippet promoteIconSnippet()}
	<Shield class="w-4 h-4" />
{/snippet}

{#snippet emailIconSnippet()}
	<Mail class="w-4 h-4" />
{/snippet}

{#snippet emptyStateSnippet()}
	<div class="py-12 text-center">
		<p class="text-meta">No users found matching your filters.</p>
		<p class="text-sm text-meta mt-1">Try adjusting your search or filter criteria.</p>
	</div>
{/snippet}

<div class={cn('space-y-4', className)}>
	<!-- Header with actions -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h2 class="text-lg font-semibold text-headers">Users</h2>
			<p class="text-sm text-meta">
				{filteredUsers().length} of {users.length} users
			</p>
		</div>

		<div class="flex flex-wrap gap-2">
			<Button variant="secondary" onclick={onExportNewsletter}>
				<Download class="w-4 h-4 mr-2" />
				Export Newsletter
			</Button>
			<Button variant="default" onclick={onImportCSV}>
				<Upload class="w-4 h-4 mr-2" />
				Import CSV
			</Button>
		</div>
	</div>

	<!-- Filters -->
	<div class="flex flex-col gap-3 p-4 bg-canvas rounded-[var(--radius-card)]">
		<!-- Search -->
		<div class="relative">
			<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-meta" />
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Search by name or email..."
				class={cn(
					'w-full pl-9 pr-3 py-2 min-h-[44px]',
					'bg-card border-2 border-secondary rounded-[var(--radius-card)]',
					'text-headers placeholder:text-meta',
					'focus:outline-none focus:border-primary'
				)}
			/>
		</div>

		<!-- Filter dropdowns -->
		<div class="grid gap-3 sm:grid-cols-2">
			<Select
				options={roleOptions}
				bind:value={roleFilter}
				placeholder="Filter by role..."
			/>
			<Select
				options={emailFilterOptions}
				bind:value={emailFilter}
				placeholder="Filter by email status..."
			/>
		</div>
	</div>

	<!-- Data Table -->
	<DataTable
		data={filteredUsers()}
		{columns}
		{actions}
		{loading}
		sortable
		emptyState={emptyStateSnippet}
	/>
</div>
