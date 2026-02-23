<script lang="ts">
	import { Upload, X, File as FileIcon, AlertCircle } from '@lucide/svelte';
	import { cn } from '$lib/utils';

	export interface UploadedFile {
		file: File;
		id: string;
		error?: string;
	}

	interface Props {
		accept?: string;
		multiple?: boolean;
		maxSize?: number;
		maxFiles?: number;
		disabled?: boolean;
		label?: string;
		description?: string;
		files?: UploadedFile[];
		onUpload?: (files: UploadedFile[]) => void;
		class?: string;
		id?: string;
	}

	let {
		accept,
		multiple = false,
		maxSize = 10 * 1024 * 1024, // 10MB default
		maxFiles = 10,
		disabled = false,
		label,
		description,
		files = $bindable([]),
		onUpload,
		class: className,
		id
	}: Props = $props();

	// Generate unique ID for accessibility
	const inputId = $derived(id ?? `fileupload-${Math.random().toString(36).slice(2, 9)}`);

	let isDragging = $state(false);
	let inputRef = $state<HTMLInputElement | null>(null);

	// Detect if we're on mobile
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

	// Format file size for display
	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	// Generate unique ID
	function generateId(): string {
		return Math.random().toString(36).substring(2, 9);
	}

	// Validate file
	function validateFile(file: File): string | undefined {
		// Check file size
		if (file.size > maxSize) {
			return `File size exceeds ${formatFileSize(maxSize)} limit`;
		}

		// Check file type if accept is specified
		if (accept) {
			const acceptedTypes = accept.split(',').map((t) => t.trim().toLowerCase());
			const fileType = file.type.toLowerCase();
			const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();

			const isAccepted = acceptedTypes.some((type) => {
				if (type.startsWith('.')) {
					return fileExt === type;
				}
				if (type.endsWith('/*')) {
					return fileType.startsWith(type.slice(0, -1));
				}
				return fileType === type;
			});

			if (!isAccepted) {
				return 'File type not accepted';
			}
		}

		return undefined;
	}

	// Process files
	function processFiles(fileList: FileList | null) {
		if (!fileList || disabled) return;

		const newFiles: UploadedFile[] = [];
		const currentCount = files.length;
		const availableSlots = multiple ? maxFiles - currentCount : 1;

		for (let i = 0; i < Math.min(fileList.length, availableSlots); i++) {
			const file = fileList[i];
			const error = validateFile(file);
			newFiles.push({
				file,
				id: generateId(),
				error
			});
		}

		if (multiple) {
			files = [...files, ...newFiles];
		} else {
			files = newFiles;
		}

		onUpload?.(files);
	}

	// Event handlers
	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		if (!disabled) {
			isDragging = true;
		}
	}

	function handleDragLeave(event: DragEvent) {
		event.preventDefault();
		isDragging = false;
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		isDragging = false;
		processFiles(event.dataTransfer?.files ?? null);
	}

	function handleInputChange(event: Event) {
		const target = event.target as HTMLInputElement;
		processFiles(target.files);
		// Reset input to allow re-selecting same file
		target.value = '';
	}

	function handleClick() {
		if (!disabled) {
			inputRef?.click();
		}
	}

	function handleRemove(id: string) {
		files = files.filter((f) => f.id !== id);
		onUpload?.(files);
	}

	function handleKeyDown(event: KeyboardEvent) {
		if ((event.key === 'Enter' || event.key === ' ') && !disabled) {
			event.preventDefault();
			inputRef?.click();
		}
	}

	const hasFiles = $derived(files.length > 0);
	const canAddMore = $derived(multiple ? files.length < maxFiles : files.length === 0);
</script>

<div class={cn('space-y-3', className)}>
	{#if label}
		<span class="block text-sm font-medium text-headers">
			{label}
		</span>
	{/if}

	{#if canAddMore}
		<!-- Drop zone / Upload area -->
		<div
			role="button"
			tabindex={disabled ? -1 : 0}
			onclick={handleClick}
			onkeydown={handleKeyDown}
			ondragover={!isMobile ? handleDragOver : undefined}
			ondragleave={!isMobile ? handleDragLeave : undefined}
			ondrop={!isMobile ? handleDrop : undefined}
			class={cn(
				'relative flex flex-col items-center justify-center',
				'min-h-[120px] px-4 py-6',
				'border-2 border-dashed rounded-[var(--radius-card)]',
				'transition-colors cursor-pointer',
				'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
				disabled && 'opacity-50 cursor-not-allowed',
				isDragging
					? 'border-primary bg-primary/5'
					: 'border-secondary hover:border-primary/50 hover:bg-canvas/50'
			)}
		>
			<input
				bind:this={inputRef}
				type="file"
				{accept}
				{multiple}
				{disabled}
				onchange={handleInputChange}
				class="sr-only"
			/>

			<Upload
				class={cn(
					'w-8 h-8 mb-2 transition-colors',
					isDragging ? 'text-primary' : 'text-meta'
				)}
			/>

			{#if isMobile}
				<span class="text-sm font-medium text-headers">Tap to browse files</span>
			{:else}
				<span class="text-sm font-medium text-headers">
					{isDragging ? 'Drop files here' : 'Drag & drop files here'}
				</span>
				<span class="text-xs text-meta mt-1">or click to browse</span>
			{/if}

			{#if description}
				<span class="text-xs text-meta mt-2">{description}</span>
			{/if}

			{#if accept || maxSize}
				<span class="text-xs text-meta mt-1">
					{#if accept}
						Accepts: {accept}
					{/if}
					{#if accept && maxSize}
						{' | '}
					{/if}
					{#if maxSize}
						Max: {formatFileSize(maxSize)}
					{/if}
				</span>
			{/if}
		</div>
	{/if}

	<!-- File list / Preview chips -->
	{#if hasFiles}
		<div class="space-y-2">
			{#each files as uploadedFile (uploadedFile.id)}
				<div
					class={cn(
						'flex items-center gap-3 px-3 py-2',
						'bg-canvas rounded-[var(--radius-card)] border',
						uploadedFile.error ? 'border-alert/50' : 'border-secondary'
					)}
				>
					{#if uploadedFile.error}
						<AlertCircle class="w-5 h-5 text-alert flex-shrink-0" />
					{:else}
						<FileIcon class="w-5 h-5 text-meta flex-shrink-0" />
					{/if}

					<div class="flex-1 min-w-0">
						<p class="text-sm font-medium text-headers truncate">
							{uploadedFile.file.name}
						</p>
						{#if uploadedFile.error}
							<p class="text-xs text-alert">{uploadedFile.error}</p>
						{:else}
							<p class="text-xs text-meta">{formatFileSize(uploadedFile.file.size)}</p>
						{/if}
					</div>

					<button
						type="button"
						onclick={() => handleRemove(uploadedFile.id)}
						class={cn(
							'p-1.5 rounded-full hover:bg-secondary/50',
							'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
							'transition-colors'
						)}
						aria-label="Remove file"
					>
						<X class="w-4 h-4 text-meta hover:text-alert" />
					</button>
				</div>
			{/each}
		</div>
	{/if}

	{#if multiple && hasFiles}
		<p class="text-xs text-meta">
			{files.length} of {maxFiles} files selected
		</p>
	{/if}
</div>
