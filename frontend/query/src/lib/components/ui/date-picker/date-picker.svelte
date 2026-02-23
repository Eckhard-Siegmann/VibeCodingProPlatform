<script lang="ts">
	import { DatePicker as DatePickerPrimitive } from 'bits-ui';
	import { CalendarDate, today, getLocalTimeZone } from '@internationalized/date';
	import { ChevronLeft, ChevronRight, Calendar } from '@lucide/svelte';
	import { cn } from '$lib/utils';

	interface Props {
		value?: Date | null;
		min?: Date;
		max?: Date;
		disabled?: boolean;
		label?: string;
		placeholder?: string;
		onchange?: (value: Date | null) => void;
		class?: string;
		id?: string;
	}

	let {
		value = $bindable(null),
		min,
		max,
		disabled = false,
		label,
		placeholder = 'Select date',
		onchange,
		class: className,
		id
	}: Props = $props();

	// Generate unique ID for accessibility
	const inputId = $derived(id ?? `datepicker-${Math.random().toString(36).slice(2, 9)}`);

	// Detect if we're on mobile (< 768px)
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

	// Convert Date to CalendarDate
	function dateToCalendarDate(date: Date | null | undefined): CalendarDate | undefined {
		if (!date) return undefined;
		return new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
	}

	// Convert CalendarDate to Date
	function calendarDateToDate(calDate: CalendarDate | undefined): Date | null {
		if (!calDate) return null;
		return new Date(calDate.year, calDate.month - 1, calDate.day);
	}

	// Format date for display
	function formatDate(date: Date | null): string {
		if (!date) return '';
		return date.toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	// Format date for native input (YYYY-MM-DD)
	function formatDateForInput(date: Date | null): string {
		if (!date) return '';
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	// Parse date from native input (YYYY-MM-DD)
	function parseDateFromInput(dateStr: string): Date | null {
		if (!dateStr) return null;
		const [year, month, day] = dateStr.split('-').map(Number);
		return new Date(year, month - 1, day);
	}

	const calendarValue = $derived(dateToCalendarDate(value));
	const minDate = $derived(dateToCalendarDate(min));
	const maxDate = $derived(dateToCalendarDate(max));

	function handleValueChange(newValue: unknown) {
		// bits-ui can return CalendarDate or CalendarDateTime
		const calDate = newValue as CalendarDate | undefined;
		const newDate = calendarDateToDate(calDate);
		value = newDate;
		onchange?.(newDate);
	}

	function handleNativeChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const newDate = parseDateFromInput(target.value);
		value = newDate;
		onchange?.(newDate);
	}

	function goToToday() {
		const todayDate = today(getLocalTimeZone());
		handleValueChange(todayDate);
	}
</script>

<div class={cn('relative', className)}>
	{#if label}
		<label for={inputId} class="block text-sm font-medium text-headers mb-1.5">
			{label}
		</label>
	{/if}

	{#if isMobile}
		<!-- Native date input for mobile (< 768px) -->
		<div class="relative">
			<input
				{id}
				type="date"
				value={formatDateForInput(value)}
				min={min ? formatDateForInput(min) : undefined}
				max={max ? formatDateForInput(max) : undefined}
				{disabled}
				onchange={handleNativeChange}
				class={cn(
					'w-full min-h-[44px] px-3 py-2',
					'bg-card border-2 border-secondary rounded-[var(--radius-card)]',
					'text-headers transition-colors',
					'hover:border-secondary-dark focus:outline-none focus:border-primary',
					'disabled:opacity-50 disabled:cursor-not-allowed',
					!value && 'text-meta'
				)}
			/>
		</div>
	{:else}
		<!-- bits-ui DatePicker for desktop (>= 768px) -->
		<DatePickerPrimitive.Root
			value={calendarValue}
			onValueChange={handleValueChange}
			{disabled}
			minValue={minDate}
			maxValue={maxDate}
		>
			<DatePickerPrimitive.Input
				class={cn(
					'flex items-center justify-between w-full min-h-[44px] px-3 py-2',
					'bg-card border-2 border-secondary rounded-[var(--radius-card)]',
					'text-headers transition-colors',
					'hover:border-secondary-dark focus-within:border-primary',
					'disabled:opacity-50 disabled:cursor-not-allowed'
				)}
			>
				{#snippet children({ segments })}
					<div class="flex items-center gap-0.5">
						{#each segments as segment}
							{#if segment.part === 'literal'}
								<span class="text-meta">{segment.value}</span>
							{:else}
								<DatePickerPrimitive.Segment
									part={segment.part}
									class={cn(
										'tabular-nums px-0.5 py-0.5 rounded',
										'focus:outline-none focus:bg-primary/10',
										segment.value === null && 'text-meta'
									)}
								>
									{segment.value}
								</DatePickerPrimitive.Segment>
							{/if}
						{/each}
					</div>
					<DatePickerPrimitive.Trigger
						class="p-1 rounded hover:bg-canvas focus:outline-none focus:ring-2 focus:ring-primary"
					>
						<Calendar class="w-4 h-4 text-meta" />
					</DatePickerPrimitive.Trigger>
				{/snippet}
			</DatePickerPrimitive.Input>

			<DatePickerPrimitive.Content
				class={cn(
					'z-50 bg-card rounded-[var(--radius-card-lg)] shadow-[var(--shadow-floating)]',
					'border border-secondary p-3',
					'data-[state=open]:animate-in data-[state=closed]:animate-out',
					'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
					'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95'
				)}
				sideOffset={8}
			>
				<DatePickerPrimitive.Calendar>
					{#snippet children({ months, weekdays })}
						<DatePickerPrimitive.Header class="flex items-center justify-between mb-2">
							<DatePickerPrimitive.PrevButton
								class="p-1.5 rounded hover:bg-canvas focus:outline-none focus:ring-2 focus:ring-primary"
							>
								<ChevronLeft class="w-4 h-4 text-headers" />
							</DatePickerPrimitive.PrevButton>

							<DatePickerPrimitive.Heading class="text-sm font-semibold text-headers" />

							<DatePickerPrimitive.NextButton
								class="p-1.5 rounded hover:bg-canvas focus:outline-none focus:ring-2 focus:ring-primary"
							>
								<ChevronRight class="w-4 h-4 text-headers" />
							</DatePickerPrimitive.NextButton>
						</DatePickerPrimitive.Header>

						{#each months as month}
							<DatePickerPrimitive.Grid class="w-full border-collapse">
								<DatePickerPrimitive.GridHead>
									<DatePickerPrimitive.GridRow class="flex">
										{#each weekdays as weekday}
											<DatePickerPrimitive.HeadCell
												class="flex-1 text-xs font-medium text-meta text-center py-1"
											>
												{weekday.slice(0, 2)}
											</DatePickerPrimitive.HeadCell>
										{/each}
									</DatePickerPrimitive.GridRow>
								</DatePickerPrimitive.GridHead>

								<DatePickerPrimitive.GridBody>
									{#each month.weeks as week}
										<DatePickerPrimitive.GridRow class="flex">
											{#each week as day}
												<DatePickerPrimitive.Cell
													date={day}
													month={month.value}
													class="flex-1 p-0"
												>
													<DatePickerPrimitive.Day
														class={cn(
															'w-8 h-8 flex items-center justify-center rounded-full text-sm',
															'hover:bg-canvas focus:outline-none focus:ring-2 focus:ring-primary',
															'data-[disabled]:opacity-30 data-[disabled]:cursor-not-allowed',
															'data-[unavailable]:opacity-30 data-[unavailable]:line-through',
															'data-[outside-month]:text-meta/50',
															'data-[selected]:bg-primary data-[selected]:text-white',
															'data-[today]:font-bold data-[today]:underline'
														)}
													/>
												</DatePickerPrimitive.Cell>
											{/each}
										</DatePickerPrimitive.GridRow>
									{/each}
								</DatePickerPrimitive.GridBody>
							</DatePickerPrimitive.Grid>
						{/each}

						<div class="mt-3 pt-3 border-t border-secondary flex justify-center">
							<button
								type="button"
								onclick={goToToday}
								class="text-sm text-primary hover:underline focus:outline-none"
							>
								Today
							</button>
						</div>
					{/snippet}
				</DatePickerPrimitive.Calendar>
			</DatePickerPrimitive.Content>
		</DatePickerPrimitive.Root>
	{/if}
</div>
