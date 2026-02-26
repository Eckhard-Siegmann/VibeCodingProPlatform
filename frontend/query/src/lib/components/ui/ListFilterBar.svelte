<script lang="ts">
	import { cn } from '$lib/utils';

	export interface FilterOption {
		value: string;
		label: string;
		separator?: boolean;
	}

	export interface FilterConfig {
		key: string;
		label: string;
		options: FilterOption[];
		defaultValue: string;
	}

	interface Props {
		filters: FilterConfig[];
		values: Record<string, string>;
		onFilterChange: (key: string, value: string) => void;
		showClearAll?: boolean;
		onClearAll?: () => void;
		class?: string;
	}

	let {
		filters,
		values,
		onFilterChange,
		showClearAll = false,
		onClearAll,
		class: className
	}: Props = $props();

	const hasActiveFilters = $derived(
		filters.some((f) => values[f.key] !== f.defaultValue)
	);
</script>

<!-- Desktop: inline selects; Mobile: horizontal scrollable pills -->
<div
	class={cn(
		'flex flex-wrap items-center gap-2',
		className
	)}
	role="group"
	aria-label="Filters"
>
	{#each filters as filter (filter.key)}
		<!-- Desktop: native select -->
		<div class="hidden md:block">
			<select
				aria-label={filter.label}
				value={values[filter.key] ?? filter.defaultValue}
				onchange={(e) => onFilterChange(filter.key, (e.target as HTMLSelectElement).value)}
				class={cn(
					'h-9 px-3 rounded-md text-sm',
					'bg-card border border-secondary',
					'focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary',
					'cursor-pointer',
					values[filter.key] && values[filter.key] !== filter.defaultValue
						? 'border-primary text-primary font-medium'
						: 'text-body'
				)}
			>
				{#each filter.options as option}
					{#if option.separator}
						<option disabled>──────────</option>
					{/if}
					<option value={option.value}>{option.label}</option>
				{/each}
			</select>
		</div>

		<!-- Mobile: scrollable pill -->
		<div class="md:hidden flex-shrink-0">
			<select
				aria-label={filter.label}
				value={values[filter.key] ?? filter.defaultValue}
				onchange={(e) => onFilterChange(filter.key, (e.target as HTMLSelectElement).value)}
				class={cn(
					'h-9 px-3 py-1.5 rounded-full text-sm',
					'bg-card border',
					'focus:outline-none focus:ring-1 focus:ring-primary',
					'cursor-pointer appearance-none',
					values[filter.key] && values[filter.key] !== filter.defaultValue
						? 'border-primary text-primary font-medium'
						: 'border-secondary text-body'
				)}
			>
				{#each filter.options as option}
					{#if option.separator}
						<option disabled>──────────</option>
					{/if}
					<option value={option.value}>{option.label}</option>
				{/each}
			</select>
		</div>
	{/each}

	{#if showClearAll && hasActiveFilters && onClearAll}
		<button
			type="button"
			aria-label="Clear all filters"
			onclick={onClearAll}
			class="text-sm text-primary underline hover:text-primary-hover transition-colors ml-auto"
		>
			Clear all
		</button>
	{/if}
</div>
