<script lang="ts">
	import { cn } from '$lib/utils';
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
	import { CSVImportWizard, type CSVRow, type ImportResult, type EventOption } from '$lib/components/admin';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';

	interface Props {
		data?: {
			events: EventOption[];
		};
	}

	let { data }: Props = $props();

	// Demo events
	const demoEvents: EventOption[] = [
		{ event_slug: 'cologne-feb-2026', title: 'VibeCoding Professionals Meetup Cologne (Feb 2026)' },
		{ event_slug: 'aachen-feb-2026', title: 'VibeCoding Professionals Meetup Aachen (Feb 2026)' },
		{ event_slug: 'cologne-mar-2026', title: 'VibeCoding Professionals Meetup Cologne (Mar 2026)' }
	];

	let events = data?.events ?? demoEvents;

	// Handle import
	async function handleImport(rows: CSVRow[], eventSlug?: string): Promise<ImportResult> {
		console.log('Importing users:', rows.length, 'event:', eventSlug);

		// Simulate API call delay
		await new Promise((resolve) => setTimeout(resolve, 1500));

		// Demo result
		return {
			total: rows.length,
			created: Math.floor(rows.length * 0.7),
			existing: Math.ceil(rows.length * 0.3),
			registered: eventSlug ? Math.floor(rows.length * 0.9) : 0,
			errors: rows.length > 10 ? [{ row: 11, message: 'Duplicate email address' }] : []
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
