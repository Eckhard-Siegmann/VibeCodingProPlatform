/**
 * Admin Items page server loader — paginated, searchable, filterable.
 * Spec: Ch.17.1, Ch.12.10 | Ticket: TICKET-30
 */

import type { PageServerLoad } from './$types';
import { getAllItemsPaginated } from '$lib/server/repositories/items';

export const load: PageServerLoad = async ({ url }) => {
	const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
	const search = url.searchParams.get('search') || '';
	const status = url.searchParams.get('status') || 'all';
	const sort = url.searchParams.get('sort') || 'default';

	const result = getAllItemsPaginated({
		page,
		pageSize: 20,
		search,
		status,
		sort
	});

	const items = result.items.map((item) => ({
		item_id: item.item_id,
		item_key: item.item_key,
		short_label: item.short_label,
		item_text: item.full_text,
		max_rating: item.max_rating,
		label_min: item.label_min ?? '',
		label_low_mid: item.label_low_mid ?? '',
		label_mid: item.label_mid ?? '',
		label_high_mid: item.label_high_mid ?? '',
		label_max: item.label_max ?? '',
		category: item.category ?? undefined,
		internal_notes: item.internal_notes ?? undefined,
		is_active: item.retired_at === null,
		created_at: item.created_at,
		retired_at: item.retired_at
	}));

	return {
		items,
		pagination: result.pagination,
		filters: { search, status, sort }
	};
};
