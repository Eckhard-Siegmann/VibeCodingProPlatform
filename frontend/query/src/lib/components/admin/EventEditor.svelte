<script lang="ts">
	import { cn } from '$lib/utils';
	import { Button } from '$lib/components/ui/button';
	import { Select, type SelectOption } from '$lib/components/ui/select';
	import { FormDialog } from '$lib/components/ui/form-dialog';
	import AlertCircle from '@lucide/svelte/icons/alert-circle';
	import Calendar from '@lucide/svelte/icons/calendar';
	import Clock from '@lucide/svelte/icons/clock';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import Users from '@lucide/svelte/icons/users';
	import Link from '@lucide/svelte/icons/link';

	export interface Partner {
		partner_id: string;
		name: string;
		logo_url?: string;
	}

	export interface Room {
		room_id: string;
		name: string;
		location_id: string;
		location_name: string;
		capacity_with_tables: number;
		capacity_without_tables: number;
	}

	export interface User {
		user_id: string;
		display_name: string;
		email: string;
	}

	export interface EventData {
		event_id?: string;
		slug?: string;
		title: string;
		description?: string;
		partner_id: string;
		room_id: string;
		host_user_id: string;
		co_host_1_user_id?: string;
		co_host_2_user_id?: string;
		starts_at: string; // ISO datetime
		planned_ends_at?: string;
		website_url?: string;
		linkedin_url?: string;
		x_post_url?: string;
		overbooking_factor: number; // decimal e.g. 1.30
		image_url?: string;
	}

	interface Props {
		event?: EventData | null;
		partners: Partner[];
		rooms: Room[];
		moderators: User[];
		open: boolean;
		mode: 'create' | 'edit';
		onSave: (event: EventData) => void | Promise<void>;
		onCancel: () => void;
		class?: string;
	}

	let {
		event = null,
		partners,
		rooms,
		moderators,
		open = $bindable(),
		mode,
		onSave,
		onCancel,
		class: className
	}: Props = $props();

	// Form state - initialized empty, populated by $effect below
	let title = $state('');
	let description = $state('');
	let partnerId = $state('');
	let roomId = $state('');
	let hostUserId = $state('');
	let cohost1UserId = $state('');
	let cohost2UserId = $state('');
	let startDate = $state('');
	let startTime = $state('');
	let endDate = $state('');
	let endTime = $state('');
	let websiteUrl = $state('');
	let linkedinUrl = $state('');
	let xPostUrl = $state('');
	let overbookingFactor = $state('130');
	let imageUrl = $state('');

	// Validation state
	let errors: Record<string, string> = $state({});

	// Reset form when dialog opens
	$effect(() => {
		if (open) {
			title = event?.title ?? '';
			description = event?.description ?? '';
			partnerId = event?.partner_id ?? '';
			roomId = event?.room_id ?? '';
			hostUserId = event?.host_user_id ?? '';
			cohost1UserId = event?.co_host_1_user_id ?? '';
			cohost2UserId = event?.co_host_2_user_id ?? '';

			// Parse dates and times from ISO string
			if (event?.starts_at) {
				const start = new Date(event.starts_at);
				startDate = start.toISOString().split('T')[0];
				startTime = start.toTimeString().slice(0, 5);
			} else {
				startDate = '';
				startTime = '18:00';
			}

			if (event?.planned_ends_at) {
				const end = new Date(event.planned_ends_at);
				endDate = end.toISOString().split('T')[0];
				endTime = end.toTimeString().slice(0, 5);
			} else {
				endDate = '';
				endTime = '21:00';
			}

			// Convert decimal factor (1.30) to percentage (130) for display
			const factorAsPercent = event?.overbooking_factor
				? Math.round(event.overbooking_factor * 100)
				: 130;

			websiteUrl = event?.website_url ?? '';
			linkedinUrl = event?.linkedin_url ?? '';
			xPostUrl = event?.x_post_url ?? '';
			overbookingFactor = factorAsPercent.toString();
			imageUrl = event?.image_url ?? '';
			errors = {};
		}
	});

	// Build options from props
	const partnerOptions = $derived<SelectOption[]>([
		{ value: '', label: 'Select partner...' },
		...partners.map((p) => ({ value: p.partner_id, label: p.name }))
	]);

	const roomOptions = $derived<SelectOption[]>([
		{ value: '', label: 'Select room...' },
		...rooms.map((r) => ({
			value: r.room_id,
			label: `${r.name} (${r.location_name}) - ${r.capacity_with_tables} seats`
		}))
	]);

	const moderatorOptions = $derived<SelectOption[]>([
		{ value: '', label: 'Select host...' },
		...moderators.map((m) => ({ value: m.user_id, label: `${m.display_name} (${m.email})` }))
	]);

	const cohost1Options = $derived<SelectOption[]>([
		{ value: '', label: 'No co-host' },
		...moderators
			.filter((m) => m.user_id !== hostUserId && m.user_id !== cohost2UserId)
			.map((m) => ({ value: m.user_id, label: `${m.display_name} (${m.email})` }))
	]);

	const cohost2Options = $derived<SelectOption[]>([
		{ value: '', label: 'No co-host' },
		...moderators
			.filter((m) => m.user_id !== hostUserId && m.user_id !== cohost1UserId)
			.map((m) => ({ value: m.user_id, label: `${m.display_name} (${m.email})` }))
	]);

	// Get selected room capacity
	const selectedRoom = $derived(rooms.find((r) => r.room_id === roomId));
	const effectiveCapacity = $derived(
		selectedRoom
			? Math.floor((selectedRoom.capacity_with_tables * parseInt(overbookingFactor)) / 100)
			: null
	);

	// Validation
	function validate(): boolean {
		const newErrors: Record<string, string> = {};

		if (!title.trim()) {
			newErrors.title = 'Title is required';
		}

		if (!partnerId) {
			newErrors.partnerId = 'Partner is required';
		}

		if (!roomId) {
			newErrors.roomId = 'Room is required';
		}

		if (!hostUserId) {
			newErrors.hostUserId = 'Host is required';
		}

		if (!startDate) {
			newErrors.startDate = 'Start date is required';
		}

		if (!startTime) {
			newErrors.startTime = 'Start time is required';
		}

		const overbookingNum = parseInt(overbookingFactor);
		if (isNaN(overbookingNum) || overbookingNum < 100 || overbookingNum > 200) {
			newErrors.overbookingFactor = 'Must be between 100% and 200%';
		}

		// Validate URLs if provided
		const urlPattern = /^https?:\/\/.+/;
		if (websiteUrl && !urlPattern.test(websiteUrl)) {
			newErrors.websiteUrl = 'Must be a valid URL (https://...)';
		}
		if (linkedinUrl && !urlPattern.test(linkedinUrl)) {
			newErrors.linkedinUrl = 'Must be a valid URL (https://...)';
		}
		if (xPostUrl && !urlPattern.test(xPostUrl)) {
			newErrors.xPostUrl = 'Must be a valid URL (https://...)';
		}
		if (imageUrl && !urlPattern.test(imageUrl)) {
			newErrors.imageUrl = 'Must be a valid URL (https://...)';
		}

		errors = newErrors;
		return Object.keys(newErrors).length === 0;
	}

	// Handle save
	async function handleSubmit() {
		if (!validate()) return;

		// Combine date and time into ISO string
		const startDateTime = new Date(`${startDate}T${startTime}`);
		const endDateTime = endDate && endTime ? new Date(`${endDate}T${endTime}`) : undefined;

		const eventData: EventData = {
			event_id: mode === 'edit' ? event?.event_id : undefined,
			slug: mode === 'edit' ? event?.slug : undefined,
			title: title.trim(),
			description: description.trim() || undefined,
			partner_id: partnerId,
			room_id: roomId,
			host_user_id: hostUserId,
			co_host_1_user_id: cohost1UserId || undefined,
			co_host_2_user_id: cohost2UserId || undefined,
			starts_at: startDateTime.toISOString(),
			planned_ends_at: endDateTime?.toISOString(),
			website_url: websiteUrl.trim() || undefined,
			linkedin_url: linkedinUrl.trim() || undefined,
			x_post_url: xPostUrl.trim() || undefined,
			overbooking_factor: parseInt(overbookingFactor) / 100, // Convert percentage to decimal (130 → 1.30)
			image_url: imageUrl.trim() || undefined
		};

		await onSave(eventData);
	}

	const dialogTitle = $derived(mode === 'create' ? 'Create New Event' : 'Edit Event');
</script>

<FormDialog
	bind:open
	title={dialogTitle}
	description="Set up event details including partner, venue, date, and hosts."
	submitLabel={mode === 'edit' ? 'Save Changes' : 'Create Event'}
	onsubmit={handleSubmit}
	oncancel={onCancel}
	class={cn('sm:max-w-2xl', className)}
>
	<div class="space-y-6">
		<!-- Title -->
		<div class="space-y-1.5">
			<label for="event-title" class="block text-sm font-medium text-headers">Event Title</label>
			<input
				id="event-title"
				type="text"
				bind:value={title}
				placeholder="e.g., VibeCoding Professionals Meetup Cologne"
				class={cn(
					'w-full px-3 py-2 min-h-[44px]',
					'bg-card border-2 rounded-[var(--radius-card)]',
					'text-headers placeholder:text-meta',
					'focus:outline-none focus:border-primary',
					errors.title ? 'border-alert' : 'border-secondary'
				)}
			/>
			{#if errors.title}
				<p class="flex items-center gap-1 text-sm text-alert">
					<AlertCircle class="w-4 h-4" />
					{errors.title}
				</p>
			{/if}
		</div>

		<!-- Description -->
		<div class="space-y-1.5">
			<label for="event-description" class="block text-sm font-medium text-headers">
				Description (optional)
			</label>
			<textarea
				id="event-description"
				bind:value={description}
				rows={3}
				placeholder="Event description and agenda"
				class={cn(
					'w-full px-3 py-2',
					'bg-card border-2 border-secondary rounded-[var(--radius-card)]',
					'text-headers placeholder:text-meta resize-y',
					'focus:outline-none focus:border-primary'
				)}
			></textarea>
		</div>

		<!-- Partner & Room -->
		<div class="grid gap-4 md:grid-cols-2">
			<div class="space-y-1.5">
				<Select
					label="Partner Organization"
					options={partnerOptions}
					bind:value={partnerId}
					class={errors.partnerId ? '[&_button]:border-alert' : ''}
				/>
				{#if errors.partnerId}
					<p class="flex items-center gap-1 text-sm text-alert">
						<AlertCircle class="w-4 h-4" />
						{errors.partnerId}
					</p>
				{/if}
			</div>

			<div class="space-y-1.5">
				<Select
					label="Venue / Room"
					options={roomOptions}
					bind:value={roomId}
					class={errors.roomId ? '[&_button]:border-alert' : ''}
				/>
				{#if errors.roomId}
					<p class="flex items-center gap-1 text-sm text-alert">
						<AlertCircle class="w-4 h-4" />
						{errors.roomId}
					</p>
				{/if}
			</div>
		</div>

		<!-- Date & Time Section -->
		<div class="space-y-4 pt-2 border-t border-secondary">
			<h3 class="text-sm font-medium text-headers flex items-center gap-2">
				<Calendar class="w-4 h-4 text-meta" />
				Date & Time
			</h3>

			<div class="grid gap-4 md:grid-cols-2">
				<!-- Start Date -->
				<div class="space-y-1.5">
					<label for="start-date" class="block text-sm font-medium text-headers">Start Date</label>
					<input
						id="start-date"
						type="date"
						bind:value={startDate}
						class={cn(
							'w-full px-3 py-2 min-h-[44px]',
							'bg-card border-2 rounded-[var(--radius-card)]',
							'text-headers',
							'focus:outline-none focus:border-primary',
							errors.startDate ? 'border-alert' : 'border-secondary'
						)}
					/>
					{#if errors.startDate}
						<p class="flex items-center gap-1 text-sm text-alert">
							<AlertCircle class="w-4 h-4" />
							{errors.startDate}
						</p>
					{/if}
				</div>

				<!-- Start Time -->
				<div class="space-y-1.5">
					<label for="start-time" class="block text-sm font-medium text-headers">Start Time</label>
					<input
						id="start-time"
						type="time"
						bind:value={startTime}
						class={cn(
							'w-full px-3 py-2 min-h-[44px]',
							'bg-card border-2 rounded-[var(--radius-card)]',
							'text-headers',
							'focus:outline-none focus:border-primary',
							errors.startTime ? 'border-alert' : 'border-secondary'
						)}
					/>
					{#if errors.startTime}
						<p class="flex items-center gap-1 text-sm text-alert">
							<AlertCircle class="w-4 h-4" />
							{errors.startTime}
						</p>
					{/if}
				</div>

				<!-- End Date -->
				<div class="space-y-1.5">
					<label for="end-date" class="block text-sm font-medium text-headers">
						End Date (optional)
					</label>
					<input
						id="end-date"
						type="date"
						bind:value={endDate}
						class={cn(
							'w-full px-3 py-2 min-h-[44px]',
							'bg-card border-2 border-secondary rounded-[var(--radius-card)]',
							'text-headers',
							'focus:outline-none focus:border-primary'
						)}
					/>
				</div>

				<!-- End Time -->
				<div class="space-y-1.5">
					<label for="end-time" class="block text-sm font-medium text-headers">
						End Time (optional)
					</label>
					<input
						id="end-time"
						type="time"
						bind:value={endTime}
						class={cn(
							'w-full px-3 py-2 min-h-[44px]',
							'bg-card border-2 border-secondary rounded-[var(--radius-card)]',
							'text-headers',
							'focus:outline-none focus:border-primary'
						)}
					/>
				</div>
			</div>
		</div>

		<!-- Hosts Section -->
		<div class="space-y-4 pt-2 border-t border-secondary">
			<h3 class="text-sm font-medium text-headers flex items-center gap-2">
				<Users class="w-4 h-4 text-meta" />
				Event Hosts
			</h3>

			<div class="space-y-4">
				<div class="space-y-1.5">
					<Select
						label="Host (Moderator)"
						options={moderatorOptions}
						bind:value={hostUserId}
						class={errors.hostUserId ? '[&_button]:border-alert' : ''}
					/>
					{#if errors.hostUserId}
						<p class="flex items-center gap-1 text-sm text-alert">
							<AlertCircle class="w-4 h-4" />
							{errors.hostUserId}
						</p>
					{/if}
				</div>

				<div class="grid gap-4 md:grid-cols-2">
					<div class="space-y-1.5">
						<Select label="Co-host 1 (optional)" options={cohost1Options} bind:value={cohost1UserId} />
					</div>

					<div class="space-y-1.5">
						<Select label="Co-host 2 (optional)" options={cohost2Options} bind:value={cohost2UserId} />
					</div>
				</div>
			</div>
		</div>

		<!-- Capacity Section -->
		<div class="space-y-4 pt-2 border-t border-secondary">
			<h3 class="text-sm font-medium text-headers flex items-center gap-2">
				<MapPin class="w-4 h-4 text-meta" />
				Capacity Settings
			</h3>

			<div class="space-y-1.5">
				<label for="overbooking" class="block text-sm font-medium text-headers">
					Overbooking Factor (%)
				</label>
				<input
					id="overbooking"
					type="number"
					bind:value={overbookingFactor}
					min="100"
					max="200"
					step="5"
					class={cn(
						'w-full px-3 py-2 min-h-[44px]',
						'bg-card border-2 rounded-[var(--radius-card)]',
						'text-headers',
						'focus:outline-none focus:border-primary',
						errors.overbookingFactor ? 'border-alert' : 'border-secondary'
					)}
				/>
				{#if errors.overbookingFactor}
					<p class="flex items-center gap-1 text-sm text-alert">
						<AlertCircle class="w-4 h-4" />
						{errors.overbookingFactor}
					</p>
				{/if}
				{#if selectedRoom && effectiveCapacity}
					<p class="text-xs text-meta">
						Room capacity: {selectedRoom.capacity_with_tables} seats.
						With {overbookingFactor}% overbooking: <strong>{effectiveCapacity}</strong> registrations
						allowed.
					</p>
				{/if}
			</div>
		</div>

		<!-- External Links Section -->
		<div class="space-y-4 pt-2 border-t border-secondary">
			<h3 class="text-sm font-medium text-headers flex items-center gap-2">
				<Link class="w-4 h-4 text-meta" />
				External Links (optional)
			</h3>

			<div class="space-y-4">
				<div class="space-y-1.5">
					<label for="website-url" class="block text-sm font-medium text-headers">
						Event Website
					</label>
					<input
						id="website-url"
						type="url"
						bind:value={websiteUrl}
						placeholder="https://..."
						class={cn(
							'w-full px-3 py-2 min-h-[44px]',
							'bg-card border-2 rounded-[var(--radius-card)]',
							'text-headers placeholder:text-meta',
							'focus:outline-none focus:border-primary',
							errors.websiteUrl ? 'border-alert' : 'border-secondary'
						)}
					/>
					{#if errors.websiteUrl}
						<p class="flex items-center gap-1 text-sm text-alert">
							<AlertCircle class="w-4 h-4" />
							{errors.websiteUrl}
						</p>
					{/if}
				</div>

				<div class="grid gap-4 md:grid-cols-2">
					<div class="space-y-1.5">
						<label for="linkedin-url" class="block text-sm font-medium text-headers">
							LinkedIn Event
						</label>
						<input
							id="linkedin-url"
							type="url"
							bind:value={linkedinUrl}
							placeholder="https://linkedin.com/events/..."
							class={cn(
								'w-full px-3 py-2 min-h-[44px]',
								'bg-card border-2 rounded-[var(--radius-card)]',
								'text-headers placeholder:text-meta',
								'focus:outline-none focus:border-primary',
								errors.linkedinUrl ? 'border-alert' : 'border-secondary'
							)}
						/>
						{#if errors.linkedinUrl}
							<p class="flex items-center gap-1 text-sm text-alert">
								<AlertCircle class="w-4 h-4" />
								{errors.linkedinUrl}
							</p>
						{/if}
					</div>

					<div class="space-y-1.5">
						<label for="x-post-url" class="block text-sm font-medium text-headers">X (Twitter)</label>
						<input
							id="x-post-url"
							type="url"
							bind:value={xPostUrl}
							placeholder="https://x.com/..."
							class={cn(
								'w-full px-3 py-2 min-h-[44px]',
								'bg-card border-2 rounded-[var(--radius-card)]',
								'text-headers placeholder:text-meta',
								'focus:outline-none focus:border-primary',
								errors.xPostUrl ? 'border-alert' : 'border-secondary'
							)}
						/>
						{#if errors.xPostUrl}
							<p class="flex items-center gap-1 text-sm text-alert">
								<AlertCircle class="w-4 h-4" />
								{errors.xPostUrl}
							</p>
						{/if}
					</div>
				</div>

				<div class="space-y-1.5">
					<label for="image-url" class="block text-sm font-medium text-headers">
						Custom Event Image URL
					</label>
					<input
						id="image-url"
						type="url"
						bind:value={imageUrl}
						placeholder="https://... (leave empty to auto-generate from partner logo)"
						class={cn(
							'w-full px-3 py-2 min-h-[44px]',
							'bg-card border-2 rounded-[var(--radius-card)]',
							'text-headers placeholder:text-meta',
							'focus:outline-none focus:border-primary',
							errors.imageUrl ? 'border-alert' : 'border-secondary'
						)}
					/>
					{#if errors.imageUrl}
						<p class="flex items-center gap-1 text-sm text-alert">
							<AlertCircle class="w-4 h-4" />
							{errors.imageUrl}
						</p>
					{/if}
				</div>
			</div>
		</div>
	</div>
</FormDialog>
