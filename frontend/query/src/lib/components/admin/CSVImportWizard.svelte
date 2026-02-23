<script lang="ts">
	import { cn } from '$lib/utils';
	import { Button } from '$lib/components/ui/button';
	import { Select, type SelectOption } from '$lib/components/ui/select';
	import { FileUpload, type UploadedFile } from '$lib/components/ui/file-upload';
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
	import Check from '@lucide/svelte/icons/check';
	import X from '@lucide/svelte/icons/x';
	import AlertCircle from '@lucide/svelte/icons/alert-circle';
	import Upload from '@lucide/svelte/icons/upload';
	import FileText from '@lucide/svelte/icons/file-text';
	import Users from '@lucide/svelte/icons/users';
	import CheckCircle from '@lucide/svelte/icons/check-circle';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';

	export interface CSVRow {
		email: string;
		display_name: string;
		event_slug?: string;
		in_presence?: boolean;
	}

	export interface ImportResult {
		total: number;
		created: number;
		existing: number;
		registered: number;
		errors: Array<{ row: number; message: string }>;
	}

	export interface EventOption {
		event_slug: string;
		title: string;
	}

	interface Props {
		events: EventOption[];
		onImport: (rows: CSVRow[], eventSlug?: string) => Promise<ImportResult>;
		onCancel: () => void;
		class?: string;
	}

	let {
		events,
		onImport,
		onCancel,
		class: className
	}: Props = $props();

	// Wizard state
	type WizardStep = 'upload' | 'preview' | 'confirm' | 'report';
	let currentStep = $state<WizardStep>('upload');

	// Upload state
	let uploadedFiles: UploadedFile[] = $state([]);
	let defaultEventSlug = $state('');

	// Parsed data
	let parsedRows: CSVRow[] = $state([]);
	let parseErrors: string[] = $state([]);
	let headerMapping: Record<string, string> = $state({});

	// Import results
	let importResult: ImportResult | null = $state(null);
	let importing = $state(false);

	// Detect mobile viewport
	let isMobile = $state(false);

	$effect(() => {
		if (typeof window !== 'undefined') {
			const checkMobile = () => {
				isMobile = window.innerWidth < 768;
			};
			checkMobile();
			window.addEventListener('resize', checkMobile);
			return () => window.removeEventListener('resize', checkMobile);
		}
	});

	// Event options for default selection
	const eventOptions = $derived<SelectOption[]>([
		{ value: '', label: 'No default event' },
		...events.map((e) => ({ value: e.event_slug, label: e.title }))
	]);

	// Step indicators
	const steps = [
		{ key: 'upload', label: 'Upload', icon: Upload },
		{ key: 'preview', label: 'Preview', icon: FileText },
		{ key: 'confirm', label: 'Confirm', icon: Users },
		{ key: 'report', label: 'Report', icon: CheckCircle }
	] as const;

	const currentStepIndex = $derived(steps.findIndex((s) => s.key === currentStep));

	// Parse CSV file
	async function parseCSV(file: File): Promise<void> {
		const text = await file.text();
		const lines = text.split(/\r?\n/).filter((line) => line.trim());

		if (lines.length < 2) {
			parseErrors = ['CSV file must have a header row and at least one data row'];
			return;
		}

		// Parse header
		const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

		// Validate required columns
		if (!headers.includes('email')) {
			parseErrors = ['CSV must contain an "email" column'];
			return;
		}

		// Map headers
		headerMapping = {
			email: headers.indexOf('email').toString(),
			display_name: headers.includes('display_name')
				? headers.indexOf('display_name').toString()
				: headers.includes('name')
					? headers.indexOf('name').toString()
					: '-1',
			event_slug: headers.includes('event_slug')
				? headers.indexOf('event_slug').toString()
				: '-1',
			in_presence: headers.includes('in_presence')
				? headers.indexOf('in_presence').toString()
				: '-1'
		};

		// Parse data rows
		const rows: CSVRow[] = [];
		const errors: string[] = [];

		for (let i = 1; i < lines.length; i++) {
			const values = parseCSVLine(lines[i]);

			const email = values[parseInt(headerMapping.email)]?.trim();
			if (!email) {
				errors.push(`Row ${i + 1}: Missing email`);
				continue;
			}

			// Validate email format
			if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
				errors.push(`Row ${i + 1}: Invalid email format "${email}"`);
				continue;
			}

			const displayNameIndex = parseInt(headerMapping.display_name);
			const eventSlugIndex = parseInt(headerMapping.event_slug);
			const inPresenceIndex = parseInt(headerMapping.in_presence);

			rows.push({
				email,
				display_name:
					displayNameIndex >= 0 ? values[displayNameIndex]?.trim() || email.split('@')[0] : email.split('@')[0],
				event_slug:
					eventSlugIndex >= 0 ? values[eventSlugIndex]?.trim() || undefined : undefined,
				in_presence:
					inPresenceIndex >= 0
						? values[inPresenceIndex]?.trim().toLowerCase() === 'true'
						: undefined
			});
		}

		parsedRows = rows;
		parseErrors = errors;
	}

	// Parse a single CSV line (handling quoted values)
	function parseCSVLine(line: string): string[] {
		const result: string[] = [];
		let current = '';
		let inQuotes = false;

		for (let i = 0; i < line.length; i++) {
			const char = line[i];

			if (char === '"') {
				inQuotes = !inQuotes;
			} else if (char === ',' && !inQuotes) {
				result.push(current);
				current = '';
			} else {
				current += char;
			}
		}

		result.push(current);
		return result;
	}

	// Handle file upload
	function handleFileUpload(files: UploadedFile[]) {
		uploadedFiles = files;

		if (files.length > 0 && !files[0].error) {
			parseCSV(files[0].file);
		}
	}

	// Navigation
	function goToStep(step: WizardStep) {
		currentStep = step;
	}

	function nextStep() {
		switch (currentStep) {
			case 'upload':
				if (parsedRows.length > 0) {
					currentStep = 'preview';
				}
				break;
			case 'preview':
				currentStep = 'confirm';
				break;
			case 'confirm':
				doImport();
				break;
		}
	}

	function prevStep() {
		switch (currentStep) {
			case 'preview':
				currentStep = 'upload';
				break;
			case 'confirm':
				currentStep = 'preview';
				break;
		}
	}

	// Perform import
	async function doImport() {
		importing = true;

		try {
			// Apply default event slug if not specified per row
			const rowsWithDefaults = parsedRows.map((row) => ({
				...row,
				event_slug: row.event_slug || defaultEventSlug || undefined
			}));

			importResult = await onImport(rowsWithDefaults, defaultEventSlug || undefined);
			currentStep = 'report';
		} catch (err) {
			console.error('Import failed:', err);
		} finally {
			importing = false;
		}
	}

	// Summary stats for preview
	const previewStats = $derived(() => {
		const withEvent = parsedRows.filter((r) => r.event_slug || defaultEventSlug).length;
		const inPresence = parsedRows.filter((r) => r.in_presence).length;
		return {
			total: parsedRows.length,
			withEvent,
			inPresence,
			remote: parsedRows.length - inPresence
		};
	});

	// Can proceed to next step
	const canProceed = $derived(() => {
		switch (currentStep) {
			case 'upload':
				return parsedRows.length > 0 && parseErrors.length === 0;
			case 'preview':
				return true;
			case 'confirm':
				return !importing;
			default:
				return false;
		}
	});
</script>

<div class={cn('space-y-6', className)}>
	<!-- Step Indicator -->
	<div class="flex items-center justify-center gap-2">
		{#each steps as step, index (step.key)}
			<div class="flex items-center">
				<button
					type="button"
					onclick={() => index < currentStepIndex && goToStep(step.key)}
					disabled={index > currentStepIndex}
					class={cn(
						'flex items-center gap-2 px-3 py-2 rounded-full transition-colors',
						currentStep === step.key
							? 'bg-primary text-white'
							: index < currentStepIndex
								? 'bg-success/10 text-success cursor-pointer hover:bg-success/20'
								: 'bg-canvas text-meta cursor-not-allowed'
					)}
				>
					{#if index < currentStepIndex}
						<Check class="w-4 h-4" />
					{:else}
						<step.icon class="w-4 h-4" />
					{/if}
					{#if !isMobile}
						<span class="text-sm font-medium">{step.label}</span>
					{/if}
				</button>

				{#if index < steps.length - 1}
					<div
						class={cn(
							'w-8 h-0.5 mx-1',
							index < currentStepIndex ? 'bg-success' : 'bg-secondary'
						)}
					></div>
				{/if}
			</div>
		{/each}
	</div>

	<!-- Step Content -->
	<Card elevation="resting">
		<CardContent>
			{#if currentStep === 'upload'}
				<!-- Step 1: Upload -->
				<div class="space-y-6">
					<div>
						<h3 class="text-lg font-semibold text-headers">Upload CSV File</h3>
						<p class="text-sm text-meta mt-1">
							Upload a CSV file with user data. Required column: <code class="bg-canvas px-1 rounded">email</code>.
							Optional: <code class="bg-canvas px-1 rounded">display_name</code>,
							<code class="bg-canvas px-1 rounded">event_slug</code>,
							<code class="bg-canvas px-1 rounded">in_presence</code>.
						</p>
					</div>

					<FileUpload
						accept=".csv"
						maxSize={5 * 1024 * 1024}
						label="CSV File"
						description="Maximum file size: 5MB"
						files={uploadedFiles}
						onUpload={handleFileUpload}
					/>

					{#if parseErrors.length > 0}
						<div class="p-4 bg-alert/10 border border-alert rounded-[var(--radius-card)]">
							<h4 class="font-medium text-alert flex items-center gap-2">
								<AlertCircle class="w-4 h-4" />
								Parse Errors
							</h4>
							<ul class="mt-2 space-y-1 text-sm text-alert">
								{#each parseErrors.slice(0, 10) as error}
									<li>{error}</li>
								{/each}
								{#if parseErrors.length > 10}
									<li>...and {parseErrors.length - 10} more errors</li>
								{/if}
							</ul>
						</div>
					{/if}

					{#if parsedRows.length > 0 && parseErrors.length === 0}
						<div class="p-4 bg-success/10 border border-success rounded-[var(--radius-card)]">
							<p class="text-success flex items-center gap-2">
								<CheckCircle class="w-4 h-4" />
								Successfully parsed {parsedRows.length} rows
							</p>
						</div>
					{/if}

					<!-- Default Event Selection -->
					<div class="space-y-1.5">
						<Select
							label="Default Event (optional)"
							options={eventOptions}
							bind:value={defaultEventSlug}
						/>
						<p class="text-xs text-meta">
							Users without an event_slug in CSV will be registered for this event.
						</p>
					</div>
				</div>
			{:else if currentStep === 'preview'}
				<!-- Step 2: Preview -->
				<div class="space-y-6">
					<div>
						<h3 class="text-lg font-semibold text-headers">Preview Import Data</h3>
						<p class="text-sm text-meta mt-1">
							Review the data before importing. Showing first 20 rows.
						</p>
					</div>

					<!-- Summary Stats -->
					<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
						<div class="p-3 bg-canvas rounded-[var(--radius-card)]">
							<p class="text-2xl font-semibold text-headers">{previewStats().total}</p>
							<p class="text-sm text-meta">Total Users</p>
						</div>
						<div class="p-3 bg-canvas rounded-[var(--radius-card)]">
							<p class="text-2xl font-semibold text-primary">{previewStats().withEvent}</p>
							<p class="text-sm text-meta">With Event</p>
						</div>
						<div class="p-3 bg-canvas rounded-[var(--radius-card)]">
							<p class="text-2xl font-semibold text-success">{previewStats().inPresence}</p>
							<p class="text-sm text-meta">In-Presence</p>
						</div>
						<div class="p-3 bg-canvas rounded-[var(--radius-card)]">
							<p class="text-2xl font-semibold text-meta">{previewStats().remote}</p>
							<p class="text-sm text-meta">Remote</p>
						</div>
					</div>

					<!-- Preview Cards (Mobile-friendly) -->
					<div class="space-y-3 max-h-[400px] overflow-y-auto">
						{#each parsedRows.slice(0, 20) as row, index (index)}
							<div class="p-3 bg-canvas rounded-[var(--radius-card)] border border-secondary">
								<div class="flex items-start justify-between gap-2">
									<div class="min-w-0">
										<p class="font-medium text-headers truncate">{row.display_name}</p>
										<p class="text-sm text-meta truncate">{row.email}</p>
									</div>
									<div class="flex flex-col items-end gap-1 flex-shrink-0">
										{#if row.event_slug || defaultEventSlug}
											<span class="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">
												{row.event_slug || defaultEventSlug}
											</span>
										{/if}
										{#if row.in_presence !== undefined}
											<span class={cn(
												'text-xs px-2 py-0.5 rounded',
												row.in_presence ? 'bg-success/10 text-success' : 'bg-meta/10 text-meta'
											)}>
												{row.in_presence ? 'In-Presence' : 'Remote'}
											</span>
										{/if}
									</div>
								</div>
							</div>
						{/each}
						{#if parsedRows.length > 20}
							<p class="text-center text-sm text-meta py-2">
								...and {parsedRows.length - 20} more rows
							</p>
						{/if}
					</div>
				</div>
			{:else if currentStep === 'confirm'}
				<!-- Step 3: Confirm -->
				<div class="space-y-6">
					<div>
						<h3 class="text-lg font-semibold text-headers">Confirm Import</h3>
						<p class="text-sm text-meta mt-1">
							Ready to import {parsedRows.length} users. This action will:
						</p>
					</div>

					<div class="space-y-3">
						<div class="p-4 bg-canvas rounded-[var(--radius-card)] flex items-start gap-3">
							<Users class="w-5 h-5 text-primary mt-0.5" />
							<div>
								<p class="font-medium text-headers">Create new user accounts</p>
								<p class="text-sm text-meta">
									For emails that don't exist in the system, new accounts will be created
									with OTP authentication.
								</p>
							</div>
						</div>

						<div class="p-4 bg-canvas rounded-[var(--radius-card)] flex items-start gap-3">
							<Check class="w-5 h-5 text-success mt-0.5" />
							<div>
								<p class="font-medium text-headers">Skip existing users</p>
								<p class="text-sm text-meta">
									Emails already in the system will be reused (no duplicate accounts).
								</p>
							</div>
						</div>

						{#if defaultEventSlug || parsedRows.some((r) => r.event_slug)}
							<div class="p-4 bg-canvas rounded-[var(--radius-card)] flex items-start gap-3">
								<FileText class="w-5 h-5 text-primary mt-0.5" />
								<div>
									<p class="font-medium text-headers">Register for events</p>
									<p class="text-sm text-meta">
										Users with event_slug will be registered for the corresponding event.
									</p>
								</div>
							</div>
						{/if}
					</div>

					{#if importing}
						<div class="flex items-center justify-center py-8">
							<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
							<span class="ml-3 text-headers">Importing...</span>
						</div>
					{/if}
				</div>
			{:else if currentStep === 'report'}
				<!-- Step 4: Report -->
				<div class="space-y-6">
					<div>
						<h3 class="text-lg font-semibold text-headers flex items-center gap-2">
							<CheckCircle class="w-6 h-6 text-success" />
							Import Complete
						</h3>
					</div>

					{#if importResult}
						<!-- Summary Stats -->
						<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
							<div class="p-3 bg-canvas rounded-[var(--radius-card)]">
								<p class="text-2xl font-semibold text-headers">{importResult.total}</p>
								<p class="text-sm text-meta">Total Processed</p>
							</div>
							<div class="p-3 bg-success/10 rounded-[var(--radius-card)]">
								<p class="text-2xl font-semibold text-success">{importResult.created}</p>
								<p class="text-sm text-meta">New Users</p>
							</div>
							<div class="p-3 bg-primary/10 rounded-[var(--radius-card)]">
								<p class="text-2xl font-semibold text-primary">{importResult.existing}</p>
								<p class="text-sm text-meta">Existing</p>
							</div>
							<div class="p-3 bg-canvas rounded-[var(--radius-card)]">
								<p class="text-2xl font-semibold text-headers">{importResult.registered}</p>
								<p class="text-sm text-meta">Registrations</p>
							</div>
						</div>

						{#if importResult.errors.length > 0}
							<div class="p-4 bg-alert/10 border border-alert rounded-[var(--radius-card)]">
								<h4 class="font-medium text-alert flex items-center gap-2">
									<AlertCircle class="w-4 h-4" />
									{importResult.errors.length} Errors
								</h4>
								<ul class="mt-2 space-y-1 text-sm text-alert max-h-[200px] overflow-y-auto">
									{#each importResult.errors as error}
										<li>Row {error.row}: {error.message}</li>
									{/each}
								</ul>
							</div>
						{/if}
					{/if}
				</div>
			{/if}
		</CardContent>
	</Card>

	<!-- Navigation Buttons -->
	<div class="flex items-center justify-between">
		<div>
			{#if currentStep !== 'upload' && currentStep !== 'report'}
				<Button variant="secondary" onclick={prevStep}>
					<ArrowLeft class="w-4 h-4 mr-2" />
					Back
				</Button>
			{/if}
		</div>

		<div class="flex gap-2">
			{#if currentStep === 'report'}
				<Button variant="default" onclick={onCancel}>
					Done
				</Button>
			{:else}
				<Button variant="secondary" onclick={onCancel}>
					Cancel
				</Button>
				<Button
					variant="default"
					onclick={nextStep}
					disabled={!canProceed() || importing}
				>
					{currentStep === 'confirm' ? 'Start Import' : 'Next'}
					<ArrowRight class="w-4 h-4 ml-2" />
				</Button>
			{/if}
		</div>
	</div>
</div>
