<script lang="ts">
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { DataTable, type TableColumn, type TableAction } from '$lib/components/ui/data-table';
	import {
		PartnerEditor,
		type EditorMode,
		type PartnerData,
		type LocationData,
		type RoomData
	} from '$lib/components/admin';
	import Plus from '@lucide/svelte/icons/plus';
	import Edit from '@lucide/svelte/icons/pencil';
	import Building from '@lucide/svelte/icons/building';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import DoorOpen from '@lucide/svelte/icons/door-open';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';

	interface PartnerWithStats extends PartnerData {
		event_count: number;
	}

	interface LocationWithStats extends LocationData {
		room_count: number;
	}

	interface RoomWithLocation extends RoomData {
		location_name: string;
	}

	interface Props {
		data?: {
			partners: PartnerWithStats[];
			locations: LocationWithStats[];
			rooms: RoomWithLocation[];
		};
	}

	let { data }: Props = $props();

	let partners = $state(data?.partners ?? []);
	let locations = $state(data?.locations ?? []);
	let rooms = $state(data?.rooms ?? []);

	$effect(() => {
		if (data?.partners) partners = data.partners;
		if (data?.locations) locations = data.locations;
		if (data?.rooms) rooms = data.rooms;
	});

	// Editor state
	let editorOpen = $state(false);
	let editorMode = $state<EditorMode>('partner');
	let editMode = $state<'create' | 'edit'>('create');
	let selectedPartner = $state<PartnerData | null>(null);
	let selectedLocation = $state<LocationData | null>(null);
	let selectedRoom = $state<RoomData | null>(null);

	// Active tab
	let activeTab = $state<'partners' | 'locations' | 'rooms'>('partners');

	function openEditor(mode: EditorMode, action: 'create' | 'edit', item?: any) {
		editorMode = mode;
		editMode = action;
		selectedPartner = mode === 'partner' ? item ?? null : null;
		selectedLocation = mode === 'location' ? item ?? null : null;
		selectedRoom = mode === 'room' ? item ?? null : null;
		editorOpen = true;
	}

	async function handleSave(itemData: PartnerData | LocationData | RoomData) {
		let url: string;
		let method: string;

		if (editorMode === 'partner') {
			const d = itemData as PartnerData;
			const isEdit = editMode === 'edit' && d.partner_id;
			url = isEdit ? `/api/admin/partners/${d.partner_id}` : '/api/admin/partners';
			method = isEdit ? 'PATCH' : 'POST';
		} else if (editorMode === 'location') {
			const d = itemData as LocationData;
			const isEdit = editMode === 'edit' && d.location_id;
			url = isEdit ? `/api/admin/locations/${d.location_id}` : '/api/admin/locations';
			method = isEdit ? 'PATCH' : 'POST';
		} else {
			const d = itemData as RoomData;
			const isEdit = editMode === 'edit' && d.room_id;
			url = isEdit ? `/api/admin/rooms/${d.room_id}` : '/api/admin/rooms';
			method = isEdit ? 'PATCH' : 'POST';
			// Map component field names to schema field names
			const body = {
				...(isEdit ? {} : {}),
				location_id: d.location_id,
				name: d.name,
				max_pax_tables: d.capacity_with_tables,
				max_pax_no_tables: d.capacity_without_tables,
				...(isEdit ? {} : {})
			};
			try {
				const res = await fetch(url, {
					method,
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(body)
				});
				const result = await res.json();
				if (!result.success) {
					console.error('Save failed:', result.error);
					return;
				}
				editorOpen = false;
				window.location.reload();
			} catch (err) {
				console.error('Save error:', err);
			}
			return;
		}

		try {
			const res = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(itemData)
			});
			const result = await res.json();
			if (!result.success) {
				console.error('Save failed:', result.error);
				return;
			}
			editorOpen = false;
			window.location.reload();
		} catch (err) {
			console.error('Save error:', err);
		}
	}

	// Partner columns
	const partnerColumns: TableColumn<PartnerWithStats>[] = [
		{ key: 'name', header: 'Partner', primary: true },
		{ key: 'partner_type', header: 'Type', render: partnerTypeSnippet },
		{ key: 'contact_name', header: 'Contact' },
		{ key: 'event_count', header: 'Events' }
	];

	const partnerActions: TableAction<PartnerWithStats>[] = [
		{
			label: 'Edit',
			icon: editIconSnippet,
			onclick: (row: PartnerWithStats) => openEditor('partner', 'edit', row)
		}
	];

	// Location columns
	const locationColumns: TableColumn<LocationWithStats>[] = [
		{ key: 'name', header: 'Location', primary: true },
		{ key: 'city', header: 'City' },
		{ key: 'address', header: 'Address' },
		{ key: 'room_count', header: 'Rooms' }
	];

	const locationActions: TableAction<LocationWithStats>[] = [
		{
			label: 'Edit',
			icon: editIconSnippet,
			onclick: (row: LocationWithStats) => openEditor('location', 'edit', row)
		}
	];

	// Room columns
	const roomColumns: TableColumn<RoomWithLocation>[] = [
		{ key: 'name', header: 'Room', primary: true },
		{ key: 'location_name', header: 'Location' },
		{ key: 'capacity_with_tables', header: 'Cap. (tables)', render: capacitySnippet },
		{ key: 'capacity_without_tables', header: 'Cap. (no tables)' }
	];

	const roomActions: TableAction<RoomWithLocation>[] = [
		{
			label: 'Edit',
			icon: editIconSnippet,
			onclick: (row: RoomWithLocation) => openEditor('room', 'edit', row)
		}
	];
</script>

{#snippet partnerTypeSnippet({ value }: { value: unknown })}
	<Badge variant="outline">{value}</Badge>
{/snippet}

{#snippet capacitySnippet({ value, row }: { value: unknown; row: RoomWithLocation })}
	<span class="text-headers">{row.capacity_with_tables}</span>
{/snippet}

{#snippet editIconSnippet()}
	<Edit class="w-4 h-4" />
{/snippet}

{#snippet emptyPartnerSnippet()}
	<div class="py-12 text-center">
		<Building class="w-12 h-12 text-meta mx-auto mb-4" />
		<p class="text-meta">No partners found.</p>
		<Button variant="default" onclick={() => openEditor('partner', 'create')} class="mt-4">
			Add your first partner
		</Button>
	</div>
{/snippet}

{#snippet emptyLocationSnippet()}
	<div class="py-12 text-center">
		<MapPin class="w-12 h-12 text-meta mx-auto mb-4" />
		<p class="text-meta">No locations found.</p>
		<Button variant="default" onclick={() => openEditor('location', 'create')} class="mt-4">
			Add your first location
		</Button>
	</div>
{/snippet}

{#snippet emptyRoomSnippet()}
	<div class="py-12 text-center">
		<DoorOpen class="w-12 h-12 text-meta mx-auto mb-4" />
		<p class="text-meta">No rooms found.</p>
		<Button variant="default" onclick={() => openEditor('room', 'create')} class="mt-4">
			Add your first room
		</Button>
	</div>
{/snippet}

<svelte:head>
	<title>Partners & Locations | Admin | VibeCoding</title>
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
					<h1 class="text-2xl md:text-3xl font-bold text-headers">Partners & Locations</h1>
					<p class="text-meta">Manage partner organizations, locations, and rooms</p>
				</div>
			</div>

			<div class="flex gap-2">
				{#if activeTab === 'partners'}
					<Button variant="default" onclick={() => openEditor('partner', 'create')}>
						<Plus class="w-4 h-4 mr-2" />
						Add Partner
					</Button>
				{:else if activeTab === 'locations'}
					<Button variant="default" onclick={() => openEditor('location', 'create')}>
						<Plus class="w-4 h-4 mr-2" />
						Add Location
					</Button>
				{:else}
					<Button variant="default" onclick={() => openEditor('room', 'create')}>
						<Plus class="w-4 h-4 mr-2" />
						Add Room
					</Button>
				{/if}
			</div>
		</div>

		<!-- Stats -->
		<div class="grid grid-cols-3 gap-4 mb-6">
			<Card elevation="resting">
				<CardContent class="py-3 text-center">
					<p class="text-2xl font-bold text-headers">{partners.length}</p>
					<p class="text-sm text-meta">Partners</p>
				</CardContent>
			</Card>
			<Card elevation="resting">
				<CardContent class="py-3 text-center">
					<p class="text-2xl font-bold text-headers">{locations.length}</p>
					<p class="text-sm text-meta">Locations</p>
				</CardContent>
			</Card>
			<Card elevation="resting">
				<CardContent class="py-3 text-center">
					<p class="text-2xl font-bold text-headers">{rooms.length}</p>
					<p class="text-sm text-meta">Rooms</p>
				</CardContent>
			</Card>
		</div>

		<!-- Tab Navigation -->
		<div class="flex gap-1 mb-4 bg-canvas rounded-[var(--radius-card)] p-1 w-fit">
			<button
				class="px-4 py-2 rounded-[var(--radius-card)] text-sm font-medium transition-colors {activeTab === 'partners' ? 'bg-primary text-white' : 'text-meta hover:text-headers'}"
				onclick={() => (activeTab = 'partners')}
			>
				Partners
			</button>
			<button
				class="px-4 py-2 rounded-[var(--radius-card)] text-sm font-medium transition-colors {activeTab === 'locations' ? 'bg-primary text-white' : 'text-meta hover:text-headers'}"
				onclick={() => (activeTab = 'locations')}
			>
				Locations
			</button>
			<button
				class="px-4 py-2 rounded-[var(--radius-card)] text-sm font-medium transition-colors {activeTab === 'rooms' ? 'bg-primary text-white' : 'text-meta hover:text-headers'}"
				onclick={() => (activeTab = 'rooms')}
			>
				Rooms
			</button>
		</div>

		<!-- Tab Content -->
		<Card elevation="resting">
			<CardContent>
				{#if activeTab === 'partners'}
					<DataTable
						data={partners}
						columns={partnerColumns}
						actions={partnerActions}
						sortable
						emptyState={emptyPartnerSnippet}
					/>
				{:else if activeTab === 'locations'}
					<DataTable
						data={locations}
						columns={locationColumns}
						actions={locationActions}
						sortable
						emptyState={emptyLocationSnippet}
					/>
				{:else}
					<DataTable
						data={rooms}
						columns={roomColumns}
						actions={roomActions}
						sortable
						emptyState={emptyRoomSnippet}
					/>
				{/if}
			</CardContent>
		</Card>
	</div>
</div>

<!-- Editor Dialog -->
<PartnerEditor
	bind:open={editorOpen}
	mode={editorMode}
	{editMode}
	partner={selectedPartner}
	location={selectedLocation}
	room={selectedRoom}
	locations={locations}
	onSave={handleSave}
	onCancel={() => (editorOpen = false)}
/>
