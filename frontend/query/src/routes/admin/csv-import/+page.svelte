<script lang="ts">
	import { cn } from '$lib/utils';
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
	import { CSVImportWizard, type CSVRow, type ImportResult, type EventOption } from '$lib/components/admin';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';

	interface Props {
		data: {
			events: EventOption[];
		};
	}

	let { data }: Props = $props();

	let events = $derived(data.events);

	// Handle import — calls real API (POST /api/admin/csv-import)
	async function handleImport(rows: CSVRow[], eventSlug?: string): Promise<ImportResult> {
		// Attach default eventSlug to rows that don't have one
		const enrichedRows = rows.map((r) => ({
			...r,
			event_slug: r.event_slug ?? (eventSlug || undefined)
		}));

		const res = await fetch('/api/admin/csv-import', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ rows: enrichedRows })
		});

		const json = await res.json();

		if (!json.success) {
			throw new Error(json.error ?? 'Import failed.');
		}

		return {
			total: json.total,
			created: json.created,
			existing: json.existing,
			registered: json.registered,
			errors: json.errors ?? []
		};
	}

	// Handle cancel
	function handleCancel() {
		window.location.href = '/admin/users';
	}
</script>

<svelte:head>
	<title>CSV Import | Admin | VibeCoding</title>
</svelte:head>

<div class="min-h-screen bg-viewport">
	<div class="max-w-4xl mx-auto px-4 py-6 md:py-8">
		<!-- Header -->
		<div class="flex items-center gap-4 mb-6">
			<a
				href="/admin/users"
				class="p-2 rounded-[var(--radius-card)] hover:bg-canvas transition-colors"
				title="Back to Users"
			>
				<ArrowLeft class="w-5 h-5 text-meta" />
			</a>
			<div>
				<h1 class="text-2xl md:text-3xl font-bold text-headers">Import Users from CSV</h1>
				<p class="text-meta">Bulk import users from partner-provided lists</p>
			</div>
		</div>

		<!-- Import Wizard -->
		<CSVImportWizard {events} onImport={handleImport} onCancel={handleCancel} />
	</div>
</div>
