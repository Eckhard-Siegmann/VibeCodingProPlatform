/**
 * Admin Inventories page server loader — paginated, searchable, filterable.
 * Spec: Ch.17.1, Ch.12.10 | Ticket: TICKET-30
 */

import type { PageServerLoad } from './$types';
import {
	getAllInventoriesPaginated,
	getInventoryItems
} from '$lib/server/repositories/inventories';
import { getAllActiveItems } from '$lib/server/repositories/items';

export const load: PageServerLoad = async ({ url }) => {
	const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
	const search = url.searchParams.get('search') || '';
	const status = url.searchParams.get('status') || 'all';
	const sort = url.searchParams.get('sort') || 'default';

	const result = getAllInventoriesPaginated({
		page,
		pageSize: 20,
		search,
		status,
		sort
	});

	// For each inventory, load its item keys
	const inventories = result.items.map((inv) => {
		const items = getInventoryItems(inv.inventory_id);
		return {
			inventory_id: inv.inventory_id,
			inventory_key: inv.inventory_key,
			name: inv.name,
			description: inv.description ?? undefined,
			items: items.map((ii) => ii.item_key),
			is_active: inv.is_active,
			item_count: inv.item_count,
			created_at: inv.created_at,
			retired_at: inv.retired_at
		};
	});

	// Available items for the shuttle editor
	const availableItems = getAllActiveItems().map((item) => ({
		item_key: item.item_key,
		short_label: item.short_label,
		max_rating: item.max_rating
	}));

	return {
		inventories,
		availableItems,
		pagination: result.pagination,
		filters: { search, status, sort }
	};
};
