import type { Snippet, Component } from 'svelte';

/**
 * Table column definition for DataTable component
 */
export interface TableColumn<T = unknown> {
	key: string;
	header: string;
	accessor?: (row: T) => unknown;
	render?: Snippet<[{ value: unknown; row: T }]>;
	hideInCard?: boolean;
	primary?: boolean;
}

/**
 * Table action definition for DataTable component
 */
export interface TableAction<T = unknown> {
	label: string;
	icon?: Snippet | Component<{ class?: string }>;
	onclick: (row: T) => void;
	variant?: 'default' | 'destructive';
	hidden?: (row: T) => boolean;
}
