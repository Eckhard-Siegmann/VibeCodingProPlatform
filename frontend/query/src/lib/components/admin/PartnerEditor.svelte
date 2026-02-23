<script lang="ts">
	import { cn } from '$lib/utils';
	import { Button } from '$lib/components/ui/button';
	import { Select, type SelectOption } from '$lib/components/ui/select';
	import { FormDialog } from '$lib/components/ui/form-dialog';
	import AlertCircle from '@lucide/svelte/icons/alert-circle';
	import Building from '@lucide/svelte/icons/building';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import DoorOpen from '@lucide/svelte/icons/door-open';

	export type EditorMode = 'partner' | 'location' | 'room';

	export interface PartnerData {
		partner_id?: string;
		name: string;
		description?: string;
		logo_url?: string;
		website_url?: string;
		contact_name?: string;
		contact_email?: string;
		partner_type: 'co_working' | 'university' | 'company' | 'community';
	}

	export interface LocationData {
		location_id?: string;
		name: string;
		address: string;
		city: string;
	}

	export interface RoomData {
		room_id?: string;
		name: string;
		location_id: string;
		capacity_with_tables: number;
		capacity_without_tables: number;
	}

	interface Props {
		mode: EditorMode;
		partner?: PartnerData | null;
		location?: LocationData | null;
		room?: RoomData | null;
		locations?: LocationData[];
		open: boolean;
		editMode: 'create' | 'edit';
		onSave: (data: PartnerData | LocationData | RoomData) => void | Promise<void>;
		onCancel: () => void;
		class?: string;
	}

	let {
		mode,
		partner = null,
		location = null,
		room = null,
		locations = [],
		open = $bindable(),
		editMode,
		onSave,
		onCancel,
		class: className
	}: Props = $props();

	// Partner form state
	let partnerName = $state('');
	let partnerDescription = $state('');
	let partnerLogoUrl = $state('');
	let partnerWebsiteUrl = $state('');
	let partnerContactName = $state('');
	let partnerContactEmail = $state('');
	let partnerType = $state<PartnerData['partner_type']>('co_working');

	// Location form state
	let locationName = $state('');
	let locationAddress = $state('');
	let locationCity = $state('');

	// Room form state
	let roomName = $state('');
	let roomLocationId = $state('');
	let roomCapacityWithTables = $state('30');
	let roomCapacityWithoutTables = $state('50');

	// Validation state
	let errors: Record<string, string> = $state({});

	// Reset form when dialog opens
	$effect(() => {
		if (open) {
			errors = {};

			if (mode === 'partner') {
				partnerName = partner?.name ?? '';
				partnerDescription = partner?.description ?? '';
				partnerLogoUrl = partner?.logo_url ?? '';
				partnerWebsiteUrl = partner?.website_url ?? '';
				partnerContactName = partner?.contact_name ?? '';
				partnerContactEmail = partner?.contact_email ?? '';
				partnerType = partner?.partner_type ?? 'co_working';
			} else if (mode === 'location') {
				locationName = location?.name ?? '';
				locationAddress = location?.address ?? '';
				locationCity = location?.city ?? '';
			} else if (mode === 'room') {
				roomName = room?.name ?? '';
				roomLocationId = room?.location_id ?? '';
				roomCapacityWithTables = room?.capacity_with_tables?.toString() ?? '30';
				roomCapacityWithoutTables = room?.capacity_without_tables?.toString() ?? '50';
			}
		}
	});

	// Partner type options
	const partnerTypeOptions: SelectOption[] = [
		{ value: 'co_working', label: 'Co-Working Space' },
		{ value: 'university', label: 'University' },
		{ value: 'company', label: 'Company' },
		{ value: 'community', label: 'Community Organization' }
	];

	// Location options for room
	const locationOptions = $derived<SelectOption[]>([
		{ value: '', label: 'Select location...' },
		...locations.map((l) => ({ value: l.location_id!, label: `${l.name} (${l.city})` }))
	]);

	// Validate partner form
	function validatePartner(): boolean {
		const newErrors: Record<string, string> = {};

		if (!partnerName.trim()) {
			newErrors.partnerName = 'Name is required';
		}

		const urlPattern = /^https?:\/\/.+/;
		if (partnerLogoUrl && !urlPattern.test(partnerLogoUrl)) {
			newErrors.partnerLogoUrl = 'Must be a valid URL';
		}
		if (partnerWebsiteUrl && !urlPattern.test(partnerWebsiteUrl)) {
			newErrors.partnerWebsiteUrl = 'Must be a valid URL';
		}

		if (partnerContactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(partnerContactEmail)) {
			newErrors.partnerContactEmail = 'Must be a valid email';
		}

		errors = newErrors;
		return Object.keys(newErrors).length === 0;
	}

	// Validate location form
	function validateLocation(): boolean {
		const newErrors: Record<string, string> = {};

		if (!locationName.trim()) {
			newErrors.locationName = 'Name is required';
		}
		if (!locationAddress.trim()) {
			newErrors.locationAddress = 'Address is required';
		}
		if (!locationCity.trim()) {
			newErrors.locationCity = 'City is required';
		}

		errors = newErrors;
		return Object.keys(newErrors).length === 0;
	}

	// Validate room form
	function validateRoom(): boolean {
		const newErrors: Record<string, string> = {};

		if (!roomName.trim()) {
			newErrors.roomName = 'Name is required';
		}
		if (!roomLocationId) {
			newErrors.roomLocationId = 'Location is required';
		}

		const withTables = parseInt(roomCapacityWithTables);
		const withoutTables = parseInt(roomCapacityWithoutTables);

		if (isNaN(withTables) || withTables < 1) {
			newErrors.roomCapacityWithTables = 'Must be at least 1';
		}
		if (isNaN(withoutTables) || withoutTables < 1) {
			newErrors.roomCapacityWithoutTables = 'Must be at least 1';
		}
		if (!isNaN(withTables) && !isNaN(withoutTables) && withTables > withoutTables) {
			newErrors.roomCapacityWithTables = 'Cannot exceed capacity without tables';
		}

		errors = newErrors;
		return Object.keys(newErrors).length === 0;
	}

	// Handle submit
	async function handleSubmit() {
		if (mode === 'partner') {
			if (!validatePartner()) return;

			const data: PartnerData = {
				partner_id: editMode === 'edit' ? partner?.partner_id : undefined,
				name: partnerName.trim(),
				description: partnerDescription.trim() || undefined,
				logo_url: partnerLogoUrl.trim() || undefined,
				website_url: partnerWebsiteUrl.trim() || undefined,
				contact_name: partnerContactName.trim() || undefined,
				contact_email: partnerContactEmail.trim() || undefined,
				partner_type: partnerType
			};
			await onSave(data);
		} else if (mode === 'location') {
			if (!validateLocation()) return;

			const data: LocationData = {
				location_id: editMode === 'edit' ? location?.location_id : undefined,
				name: locationName.trim(),
				address: locationAddress.trim(),
				city: locationCity.trim()
			};
			await onSave(data);
		} else if (mode === 'room') {
			if (!validateRoom()) return;

			const data: RoomData = {
				room_id: editMode === 'edit' ? room?.room_id : undefined,
				name: roomName.trim(),
				location_id: roomLocationId,
				capacity_with_tables: parseInt(roomCapacityWithTables),
				capacity_without_tables: parseInt(roomCapacityWithoutTables)
			};
			await onSave(data);
		}
	}

	// Dialog title
	const dialogTitle = $derived(() => {
		const action = editMode === 'create' ? 'Create' : 'Edit';
		switch (mode) {
			case 'partner':
				return `${action} Partner`;
			case 'location':
				return `${action} Location`;
			case 'room':
				return `${action} Room`;
		}
	});

	// Dialog description
	const dialogDescription = $derived(() => {
		switch (mode) {
			case 'partner':
				return 'Partner organizations that host events.';
			case 'location':
				return 'Physical venues where events are held.';
			case 'room':
				return 'Specific rooms within a location.';
		}
	});
</script>

<FormDialog
	bind:open
	title={dialogTitle()}
	description={dialogDescription()}
	submitLabel={editMode === 'edit' ? 'Save Changes' : 'Create'}
	onsubmit={handleSubmit}
	oncancel={onCancel}
	class={className}
>
	<div class="space-y-6">
		{#if mode === 'partner'}
			<!-- Partner Form -->
			<div class="flex items-center gap-2 text-sm text-meta">
				<Building class="w-4 h-4" />
				Partner Organization
			</div>

			<div class="space-y-1.5">
				<label for="partner-name" class="block text-sm font-medium text-headers">Name</label>
				<input
					id="partner-name"
					type="text"
					bind:value={partnerName}
					placeholder="e.g., STARTPLATZ"
					class={cn(
						'w-full px-3 py-2 min-h-[44px]',
						'bg-card border-2 rounded-[var(--radius-card)]',
						'text-headers placeholder:text-meta',
						'focus:outline-none focus:border-primary',
						errors.partnerName ? 'border-alert' : 'border-secondary'
					)}
				/>
				{#if errors.partnerName}
					<p class="flex items-center gap-1 text-sm text-alert">
						<AlertCircle class="w-4 h-4" />
						{errors.partnerName}
					</p>
				{/if}
			</div>

			<div class="space-y-1.5">
				<label for="partner-description" class="block text-sm font-medium text-headers">
					Description (optional)
				</label>
				<textarea
					id="partner-description"
					bind:value={partnerDescription}
					rows={2}
					placeholder="Brief description of the partner organization"
					class={cn(
						'w-full px-3 py-2',
						'bg-card border-2 border-secondary rounded-[var(--radius-card)]',
						'text-headers placeholder:text-meta resize-y',
						'focus:outline-none focus:border-primary'
					)}
				></textarea>
			</div>

			<div class="space-y-1.5">
				<Select
					label="Partner Type"
					options={partnerTypeOptions}
					bind:value={partnerType}
				/>
			</div>

			<div class="grid gap-4 md:grid-cols-2">
				<div class="space-y-1.5">
					<label for="partner-logo" class="block text-sm font-medium text-headers">
						Logo URL (optional)
					</label>
					<input
						id="partner-logo"
						type="url"
						bind:value={partnerLogoUrl}
						placeholder="https://..."
						class={cn(
							'w-full px-3 py-2 min-h-[44px]',
							'bg-card border-2 rounded-[var(--radius-card)]',
							'text-headers placeholder:text-meta',
							'focus:outline-none focus:border-primary',
							errors.partnerLogoUrl ? 'border-alert' : 'border-secondary'
						)}
					/>
					{#if errors.partnerLogoUrl}
						<p class="flex items-center gap-1 text-sm text-alert">
							<AlertCircle class="w-4 h-4" />
							{errors.partnerLogoUrl}
						</p>
					{/if}
				</div>

				<div class="space-y-1.5">
					<label for="partner-website" class="block text-sm font-medium text-headers">
						Website URL (optional)
					</label>
					<input
						id="partner-website"
						type="url"
						bind:value={partnerWebsiteUrl}
						placeholder="https://..."
						class={cn(
							'w-full px-3 py-2 min-h-[44px]',
							'bg-card border-2 rounded-[var(--radius-card)]',
							'text-headers placeholder:text-meta',
							'focus:outline-none focus:border-primary',
							errors.partnerWebsiteUrl ? 'border-alert' : 'border-secondary'
						)}
					/>
					{#if errors.partnerWebsiteUrl}
						<p class="flex items-center gap-1 text-sm text-alert">
							<AlertCircle class="w-4 h-4" />
							{errors.partnerWebsiteUrl}
						</p>
					{/if}
				</div>
			</div>

			<div class="grid gap-4 md:grid-cols-2">
				<div class="space-y-1.5">
					<label for="partner-contact-name" class="block text-sm font-medium text-headers">
						Contact Name (optional)
					</label>
					<input
						id="partner-contact-name"
						type="text"
						bind:value={partnerContactName}
						placeholder="Contact person"
						class={cn(
							'w-full px-3 py-2 min-h-[44px]',
							'bg-card border-2 border-secondary rounded-[var(--radius-card)]',
							'text-headers placeholder:text-meta',
							'focus:outline-none focus:border-primary'
						)}
					/>
				</div>

				<div class="space-y-1.5">
					<label for="partner-contact-email" class="block text-sm font-medium text-headers">
						Contact Email (optional)
					</label>
					<input
						id="partner-contact-email"
						type="email"
						bind:value={partnerContactEmail}
						placeholder="contact@example.com"
						class={cn(
							'w-full px-3 py-2 min-h-[44px]',
							'bg-card border-2 rounded-[var(--radius-card)]',
							'text-headers placeholder:text-meta',
							'focus:outline-none focus:border-primary',
							errors.partnerContactEmail ? 'border-alert' : 'border-secondary'
						)}
					/>
					{#if errors.partnerContactEmail}
						<p class="flex items-center gap-1 text-sm text-alert">
							<AlertCircle class="w-4 h-4" />
							{errors.partnerContactEmail}
						</p>
					{/if}
				</div>
			</div>
		{:else if mode === 'location'}
			<!-- Location Form -->
			<div class="flex items-center gap-2 text-sm text-meta">
				<MapPin class="w-4 h-4" />
				Physical Venue
			</div>

			<div class="space-y-1.5">
				<label for="location-name" class="block text-sm font-medium text-headers">Name</label>
				<input
					id="location-name"
					type="text"
					bind:value={locationName}
					placeholder="e.g., STARTPLATZ Koeln"
					class={cn(
						'w-full px-3 py-2 min-h-[44px]',
						'bg-card border-2 rounded-[var(--radius-card)]',
						'text-headers placeholder:text-meta',
						'focus:outline-none focus:border-primary',
						errors.locationName ? 'border-alert' : 'border-secondary'
					)}
				/>
				{#if errors.locationName}
					<p class="flex items-center gap-1 text-sm text-alert">
						<AlertCircle class="w-4 h-4" />
						{errors.locationName}
					</p>
				{/if}
			</div>

			<div class="space-y-1.5">
				<label for="location-address" class="block text-sm font-medium text-headers">
					Street Address
				</label>
				<input
					id="location-address"
					type="text"
					bind:value={locationAddress}
					placeholder="Im Mediapark 5"
					class={cn(
						'w-full px-3 py-2 min-h-[44px]',
						'bg-card border-2 rounded-[var(--radius-card)]',
						'text-headers placeholder:text-meta',
						'focus:outline-none focus:border-primary',
						errors.locationAddress ? 'border-alert' : 'border-secondary'
					)}
				/>
				{#if errors.locationAddress}
					<p class="flex items-center gap-1 text-sm text-alert">
						<AlertCircle class="w-4 h-4" />
						{errors.locationAddress}
					</p>
				{/if}
			</div>

			<div class="space-y-1.5">
				<label for="location-city" class="block text-sm font-medium text-headers">City</label>
				<input
					id="location-city"
					type="text"
					bind:value={locationCity}
					placeholder="Cologne"
					class={cn(
						'w-full px-3 py-2 min-h-[44px]',
						'bg-card border-2 rounded-[var(--radius-card)]',
						'text-headers placeholder:text-meta',
						'focus:outline-none focus:border-primary',
						errors.locationCity ? 'border-alert' : 'border-secondary'
					)}
				/>
				{#if errors.locationCity}
					<p class="flex items-center gap-1 text-sm text-alert">
						<AlertCircle class="w-4 h-4" />
						{errors.locationCity}
					</p>
				{/if}
			</div>
		{:else if mode === 'room'}
			<!-- Room Form -->
			<div class="flex items-center gap-2 text-sm text-meta">
				<DoorOpen class="w-4 h-4" />
				Room within Location
			</div>

			<div class="space-y-1.5">
				<label for="room-name" class="block text-sm font-medium text-headers">Room Name</label>
				<input
					id="room-name"
					type="text"
					bind:value={roomName}
					placeholder="e.g., Workshop Room A"
					class={cn(
						'w-full px-3 py-2 min-h-[44px]',
						'bg-card border-2 rounded-[var(--radius-card)]',
						'text-headers placeholder:text-meta',
						'focus:outline-none focus:border-primary',
						errors.roomName ? 'border-alert' : 'border-secondary'
					)}
				/>
				{#if errors.roomName}
					<p class="flex items-center gap-1 text-sm text-alert">
						<AlertCircle class="w-4 h-4" />
						{errors.roomName}
					</p>
				{/if}
			</div>

			<div class="space-y-1.5">
				<Select
					label="Location"
					options={locationOptions}
					bind:value={roomLocationId}
					class={errors.roomLocationId ? '[&_button]:border-alert' : ''}
				/>
				{#if errors.roomLocationId}
					<p class="flex items-center gap-1 text-sm text-alert">
						<AlertCircle class="w-4 h-4" />
						{errors.roomLocationId}
					</p>
				{/if}
			</div>

			<div class="grid gap-4 md:grid-cols-2">
				<div class="space-y-1.5">
					<label for="room-capacity-tables" class="block text-sm font-medium text-headers">
						Capacity (with tables)
					</label>
					<input
						id="room-capacity-tables"
						type="number"
						bind:value={roomCapacityWithTables}
						min="1"
						class={cn(
							'w-full px-3 py-2 min-h-[44px]',
							'bg-card border-2 rounded-[var(--radius-card)]',
							'text-headers',
							'focus:outline-none focus:border-primary',
							errors.roomCapacityWithTables ? 'border-alert' : 'border-secondary'
						)}
					/>
					{#if errors.roomCapacityWithTables}
						<p class="flex items-center gap-1 text-sm text-alert">
							<AlertCircle class="w-4 h-4" />
							{errors.roomCapacityWithTables}
						</p>
					{/if}
					<p class="text-xs text-meta">Seating capacity for events with tables</p>
				</div>

				<div class="space-y-1.5">
					<label for="room-capacity-no-tables" class="block text-sm font-medium text-headers">
						Capacity (without tables)
					</label>
					<input
						id="room-capacity-no-tables"
						type="number"
						bind:value={roomCapacityWithoutTables}
						min="1"
						class={cn(
							'w-full px-3 py-2 min-h-[44px]',
							'bg-card border-2 rounded-[var(--radius-card)]',
							'text-headers',
							'focus:outline-none focus:border-primary',
							errors.roomCapacityWithoutTables ? 'border-alert' : 'border-secondary'
						)}
					/>
					{#if errors.roomCapacityWithoutTables}
						<p class="flex items-center gap-1 text-sm text-alert">
							<AlertCircle class="w-4 h-4" />
							{errors.roomCapacityWithoutTables}
						</p>
					{/if}
					<p class="text-xs text-meta">Standing/chair-only capacity</p>
				</div>
			</div>
		{/if}
	</div>
</FormDialog>
