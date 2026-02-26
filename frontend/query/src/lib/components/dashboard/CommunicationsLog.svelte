<script lang="ts">
	import { Card, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { DataTable } from '$lib/components/ui/data-table';
	import type { TableColumn } from '$lib/components/ui/data-table';
	import { MessageSquare } from '@lucide/svelte';

	export interface CommLogEntry {
		log_id: string;
		type: string;
		recipient_user_id: string | null;
		recipient_count: number | null;
		subject: string | null;
		triggered_by: string;
		created_at: string;
		recipient_display_name: string | null;
		triggered_by_display_name: string | null;
	}

	interface Props {
		entries: CommLogEntry[];
	}

	let { entries }: Props = $props();

	let typeFilter = $state('');

	const filteredEntries = $derived(
		typeFilter ? entries.filter((e) => e.type === typeFilter) : entries
	);

	const uniqueTypes = $derived([...new Set(entries.map((e) => e.type))]);

	function formatTime(iso: string): string {
		return new Date(iso).toLocaleString(undefined, {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatType(type: string): string {
		return type.replace(/_/g, ' ');
	}

	function formatRecipient(entry: CommLogEntry): string {
		if (entry.recipient_display_name) return entry.recipient_display_name;
		if (entry.recipient_count) return `All (${entry.recipient_count})`;
		return '-';
	}

	const columns: TableColumn<CommLogEntry>[] = [
		{
			key: 'created_at',
			header: 'Time',
			primary: true,
			accessor: (row) => formatTime(row.created_at)
		},
		{
			key: 'type',
			header: 'Type',
			accessor: (row) => formatType(row.type)
		},
		{
			key: 'recipient',
			header: 'Recipient',
			accessor: (row) => formatRecipient(row)
		},
		{
			key: 'subject',
			header: 'Subject',
			accessor: (row) => row.subject ?? '-',
			hideInCard: false
		},
		{
			key: 'triggered_by',
			header: 'Trigger',
			accessor: (row) => row.triggered_by
		}
	];
</script>

<Card elevation="resting" padding="md">
	<div class="flex items-center justify-between mb-4 flex-wrap gap-2">
		<h3 class="font-semibold text-headers flex items-center gap-2">
			<MessageSquare class="w-4 h-4" />
			Communications Log
		</h3>
		{#if uniqueTypes.length > 1}
			<select
				bind:value={typeFilter}
				class="text-sm bg-canvas border border-secondary rounded px-2 py-1 text-headers"
			>
				<option value="">All types</option>
				{#each uniqueTypes as t}
					<option value={t}>{formatType(t)}</option>
				{/each}
			</select>
		{/if}
	</div>

	{#if entries.length === 0}
		<div class="py-8 text-center text-meta">
			<MessageSquare class="w-8 h-8 mx-auto mb-2 opacity-40" />
			<p>No communications yet</p>
		</div>
	{:else}
		<DataTable data={filteredEntries} {columns} />
	{/if}
</Card>
