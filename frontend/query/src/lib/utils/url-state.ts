/**
 * URL State Management utilities for scalable list views.
 * Spec: Ch.12.10.4 (URL state persistence)
 * Ticket: TICKET-30
 *
 * Provides consistent URL search param reading/writing across
 * all paginated pages (admin, public listings, moderator dashboard).
 */

import { goto } from '$app/navigation';

// ── Shared Types ────────────────────────────────────────────────────

export interface PaginatedResult<T> {
	items: T[];
	pagination: {
		page: number;
		pageSize: number;
		totalItems: number;
		totalPages: number;
	};
}

export interface PaginationParams {
	page: number;
	pageSize: number;
	search: string;
	sort: string;
	filters: Record<string, string>;
}

// ── Server-Side Helpers (used in +page.server.ts) ───────────────────

/**
 * Read pagination, search, sort, and filter params from a URL.
 * Used in server loaders to extract query state.
 */
export function readPaginationParams(
	url: URL,
	defaults?: { pageSize?: number; sort?: string },
	filterKeys?: string[]
): PaginationParams {
	const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
	const rawPageSize = parseInt(url.searchParams.get('pageSize') || String(defaults?.pageSize ?? 20));
	const pageSize = Math.min(100, Math.max(1, rawPageSize));
	const search = url.searchParams.get('search') || '';
	const sort = url.searchParams.get('sort') || defaults?.sort || '';

	const filters: Record<string, string> = {};
	if (filterKeys) {
		for (const key of filterKeys) {
			const val = url.searchParams.get(key);
			if (val) filters[key] = val;
		}
	}

	return { page, pageSize, search, sort, filters };
}

// ── Client-Side Helpers (used in +page.svelte) ─────────────────────

/** Default param values that should be stripped from URL for cleanliness */
const DEFAULT_STRIP_VALUES = new Set(['', 'all', '1']);

/**
 * Build updated URL string from current URL + param changes.
 * Strips default/empty values to keep URLs clean.
 */
export function buildUpdatedUrl(
	currentUrl: URL,
	params: Record<string, string>,
	options?: { resetPage?: boolean; stripDefaults?: Set<string> }
): string {
	const url = new URL(currentUrl);
	const strip = options?.stripDefaults ?? DEFAULT_STRIP_VALUES;

	for (const [key, value] of Object.entries(params)) {
		if (strip.has(value)) {
			url.searchParams.delete(key);
		} else {
			url.searchParams.set(key, value);
		}
	}

	// Reset to page 1 when filters/search change
	if (options?.resetPage) {
		url.searchParams.delete('page');
	}

	return url.pathname + url.search;
}

/**
 * Navigate to updated URL with search params.
 * Wraps goto() with common options for filter navigation.
 */
export function navigateWithParams(
	currentUrl: URL,
	params: Record<string, string>,
	options?: { resetPage?: boolean; replaceState?: boolean; pushState?: boolean }
): void {
	const path = buildUpdatedUrl(currentUrl, params, { resetPage: options?.resetPage });
	goto(path, {
		replaceState: options?.replaceState ?? !options?.pushState,
		keepFocus: true,
		noScroll: true
	});
}
