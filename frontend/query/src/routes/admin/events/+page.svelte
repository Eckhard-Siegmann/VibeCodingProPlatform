<script lang="ts">
	import { cn } from '$lib/utils';
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { DataTable, type TableColumn, type TableAction } from '$lib/components/ui/data-table';
	import {
		EventEditor,
		type EventData,
		type Partner,
		type Room,
		type User
	} from '$lib/components/admin';
	import Plus from '@lucide/svelte/icons/plus';
	import Edit from '@lucide/svelte/icons/pencil';
	import Users from '@lucide/svelte/icons/users';
	import Calendar from '@lucide/svelte/icons/calendar';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';

	interface EventWithStats extends EventData {
		partner_name: string;
		location_name: string;
		registrations: number;
		capacity: number;
		is_past: boolean;
	}

	interface Props {
		data?: {
			events: EventWithStats[];
			partners: Partner[];
			rooms: Room[];
			moderators: User[];
		};
	}

	let { data }: Props = $props();

	// Demo data
	const demoPartners: Partner[] = [
		{ partner_id: 'p1', name: 'STARTPLATZ', logo_url: '' },
		{ partner_id: 'p2', name: 'Digital Hub Aachen', logo_url: '' }
	];

	const demoRooms: Room[] = [
		{
			room_id: 'r1',
			name: 'Workshop Room A',
			location_id: 'l1',
			location_name: 'STARTPLATZ Koeln',
			capacity_with_tables: 30,
			capacity_without_tables: 50
		},
		{
			room_id: 'r2',
			name: 'Event Space',
			location_id: 'l2',
			location_name: 'Digital Hub Aachen',
			capacity_with_tables: 40,
			capacity_without_tables: 60
		}
	];

	const demoModerators: User[] = [
		{ user_id: 'm1', display_name: 'Max Mustermann', email: 'max@example.com' },
		{ user_id: 'm2', display_name: 'Eva Schmidt', email: 'eva@example.com' }
	];

	const demoEvents: EventWithStats[] = [
		{
			event_id: 'e1',
			title: 'VibeCoding Professionals Meetup Cologne',
			description: 'Monthly meetup for professional developers',
			partner_id: 'p1',
			partner_name: 'STARTPLATZ',
			room_id: 'r1',
			location_name: 'STARTPLATZ Koeln',
			host_user_id: 'm1',
			start_time: '2026-02-15T18:00:00Z',
			end_time: '2026-02-15T21:00:00Z',
			overbooking_factor: 130,
			registrations: 28,
			capacity: 39,
			is_past: false
		},
		{
			event_id: 'e2',
			title: 'VibeCoding Professionals Meetup Aachen',
			description: 'Aachen chapter meetup',
			partner_id: 'p2',
			partner_name: 'Digital Hub Aachen',
			room_id: 'r2',
			location_name: 'Digital Hub Aachen',
			host_user_id: 'm2',
			start_time: '2026-02-20T18:00:00Z',
			end_time: '2026-02-20T21:00:00Z',
			overbooking_factor: 130,
			registrations: 15,
			capacity: 52,
			is_past: false
		},
		{
			event_id: 'e3',
			title: 'VibeCoding Professionals Meetup Cologne (Jan)',
			description: 'January meetup',
			partner_id: 'p1',
			partner_name: 'STARTPLATZ',
			room_id: 'r1',
			location_name: 'STARTPLATZ Koeln',
			host_user_id: 'm1',
			start_time: '2026-01-18T18:00:00Z',
			end_time: '2026-01-18T21:00:00Z',
			overbooking_factor: 130,
			registrations: 32,
			capacity: 39,
			is_past: true
		}
	];

	let events = $state(data?.events ?? demoEvents);
	let partners = $state(data?.partners ?? demoPartners);
	let rooms = $state(data?.rooms ?? demoRooms);
	let moderators = $state(data?.moderators ?? demoModerators);

	// Editor state
	let editorOpen = $state(false);
	let editorMode = $state<'create' | 'edit'>('create');
	let selectedEvent = $state<EventData | null>(null);

	// Filter state
	let showPast = $state(false);

	// Filtered events
	const filteredEvents = $derived(() => {
		let result = events;
		if (!showPast) {
			result = result.filter((e) => !e.is_past);
		}
		return result.sort(
			(a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
		);
	});

	// Format date
	function formatDate(isoString: string): string {
		return new Date(isoString).toLocaleDateString('en-GB', {
			weekday: 'short',
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});
	}

	// Format time
	function formatTime(isoString: string): string {
		return new Date(isoString).toLocaleTimeString('en-GB', {
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	// Table columns
	const columns: TableColumn[] = [
		{
			key: 'title',
			header: 'Event',
			primary: true
		},
		{
			key: 'start_time',
			header: 'Date',
			render: dateSnippet
		},
		{
			key: 'location_name',
			header: 'Location'
		},
		{
			key: 'registrations',
			header: 'Registrations',
			render: registrationsSnippet
		},
		{
			key: 'is_past',
			header: 'Status',
			render: statusSnippet
		}
	];

	// Table actions
	const actions: TableAction[] = [
		{
			label: 'Edit',
			icon: editIconSnippet,
			onclick: (row: EventWithStats) => openEditor('edit', row)
		},
		{
			label: 'View Registrations',
			icon: usersIconSnippet,
			onclick: (row: EventWithStats) => viewRegistrations(row)
		}
	];

	// Open editor
	function openEditor(mode: 'create' | 'edit', event?: EventData) {
		editorMode = mode;
		selectedEvent = event ?? null;
		editorOpen = true;
	}

	// Handle save
	async function handleSave(eventData: EventData) {
		console.log('Saving event:', eventData);
		// In production, this would call the API
		editorOpen = false;
	}

	// View registrations
	function viewRegistrations(event: EventWithStats) {
		console.log('Viewing registrations for:', event.title);
		// In production, navigate to registrations page
	}
</script>

{#snippet dateSnippet({ value, row }: { value: unknown; row: EventWithStats })}
	<div>
		<p class="text-headers">{formatDate(row.start_time)}</p>
		<p class="text-xs text-meta">{formatTime(row.start_time)}</p>
	</div>
{/snippet}

{#snippet registrationsSnippet({ value, row }: { value: unknown; row: EventWithStats })}
	{@const percentage = Math.round((row.registrations / row.capacity) * 100)}
	<div class="flex items-center gap-2">
		<span class="text-headers">{row.registrations}/{row.capacity}</span>
		<Badge variant={percentage >= 90 ? 'destructive' : percentage >= 70 ? 'secondary' : 'outline'}>
			{percentage}%
		</Badge>
	</div>
{/snippet}

{#snippet statusSnippet({ value, row }: { value: unknown; row: EventWithStats })}
	{#if row.is_past}
		<Badge variant="draft">Past</Badge>
	{:else}
		<Badge variant="ready">Upcoming</Badge>
	{/if}
{/snippet}

{#snippet editIconSnippet()}
	<Edit class="w-4 h-4" />
{/snippet}

{#snippet usersIconSnippet()}
	<Users class="w-4 h-4" />
{/snippet}

{#snippet emptyStateSnippet()}
	<div class="py-12 text-center">
		<Calendar class="w-12 h-12 text-meta mx-auto mb-4" />
		<p class="text-meta">No events found.</p>
		<Button variant="default" onclick={() => openEditor('create')} class="mt-4">
			Create your first event
		</Button>
	</div>
{/snippet}

<svelte:head>
	<title>Event Management | Admin | VibeCoding</title>
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
					<h1 class="text-2xl md:text-3xl font-bold text-headers">Event Management</h1>
					<p class="text-meta">Create and manage community events</p>
				</div>
			</div>

			<div class="flex gap-2">
				<Button variant="secondary" onclick={() => (showPast = !showPast)}>
					{showPast ? 'Hide Past' : 'Show Past'}
				</Button>
				<Button variant="default" onclick={() => openEditor('create')}>
					<Plus class="w-4 h-4 mr-2" />
					Create Event
				</Button>
			</div>
		</div>

		<!-- Events Stats -->
		<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
			<Card elevation="resting">
				<CardContent class="py-3 text-center">
					<p class="text-2xl font-bold text-headers">
						{events.filter((e) => !e.is_past).length}
					</p>
					<p class="text-sm text-meta">Upcoming</p>
				</CardContent>
			</Card>
			<Card elevation="resting">
				<CardContent class="py-3 text-center">
					<p class="text-2xl font-bold text-headers">
						{events.filter((e) => e.is_past).length}
					</p>
					<p class="text-sm text-meta">Past</p>
				</CardContent>
			</Card>
			<Card elevation="resting">
				<CardContent class="py-3 text-center">
					<p class="text-2xl font-bold text-primary">
						{events.reduce((sum, e) => sum + e.registrations, 0)}
					</p>
					<p class="text-sm text-meta">Total Registrations</p>
				</CardContent>
			</Card>
			<Card elevation="resting">
				<CardContent class="py-3 text-center">
					<p class="text-2xl font-bold text-headers">{partners.length}</p>
					<p class="text-sm text-meta">Partners</p>
				</CardContent>
			</Card>
		</div>

		<!-- Events Table -->
		<Card elevation="resting">
			<CardContent>
				<DataTable
					data={filteredEvents()}
					{columns}
					{actions}
					sortable
					emptyState={emptyStateSnippet}
				/>
			</CardContent>
		</Card>
	</div>
</div>

<!-- Event Editor Dialog -->
<EventEditor
	bind:open={editorOpen}
	event={selectedEvent}
	{partners}
	{rooms}
	{moderators}
	mode={editorMode}
	onSave={handleSave}
	onCancel={() => (editorOpen = false)}
/>
