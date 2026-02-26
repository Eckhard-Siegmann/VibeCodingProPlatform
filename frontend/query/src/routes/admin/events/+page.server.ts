/**
 * Admin Events page server loader — paginated, searchable, filterable.
 * Spec: Ch.17.3, Ch.12.10 | ADR 002 (SvelteKit) | Ticket: TICKET-30
 * Auth: Moderator or Admin (requireModerator).
 */

import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { requireModerator } from '$lib/server/auth';
import { listEventsForAdminPaginated, getAdminEventLocations, listModerators } from '$lib/server/repositories/admin-events';
import { listPartners, listRooms } from '$lib/server/repositories/admin-infrastructure';

export const load: PageServerLoad = async ({ url, cookies }) => {
	try {
		requireModerator(cookies);
	} catch {
		throw error(403, 'Moderator role required.');
	}

	// Read URL params (Ch.12.10.4)
	const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
	const search = url.searchParams.get('search') || '';
	const status = url.searchParams.get('status') || 'all';
	const location = url.searchParams.get('location') || 'all';
	const sort = url.searchParams.get('sort') || 'date_desc';

	const result = listEventsForAdminPaginated({
		page,
		pageSize: 20,
		search,
		status,
		location,
		sort
	});

	const partners = listPartners();
	const rooms = listRooms();
	const moderators = listModerators();
	const locations = getAdminEventLocations();

	return {
		events: result.items.map((e) => ({
			event_id: e.event_id,
			slug: e.slug,
			title: e.title,
			description: e.description,
			partner_id: e.partner_id,
			partner_name: e.partner_name,
			room_id: e.room_id,
			location_id: e.location_id,
			location_name: e.location_name,
			host_user_id: e.host_user_id,
			co_host_1_user_id: e.co_host_1_user_id,
			co_host_2_user_id: e.co_host_2_user_id,
			starts_at: e.starts_at,
			planned_ends_at: e.planned_ends_at,
			website_url: e.website_url,
			linkedin_url: e.linkedin_url,
			x_post_url: e.x_post_url,
			image_url: e.image_url,
			overbooking_factor: e.overbooking_factor,
			registrations: e.registrations,
			capacity: e.capacity,
			is_past: !!e.is_past
		})),
		pagination: result.pagination,
		filters: { search, status, location, sort },
		partners: partners.map((p) => ({
			partner_id: p.partner_id,
			name: p.name,
			logo_url: p.logo_url ?? ''
		})),
		rooms: rooms.map((r) => ({
			room_id: r.room_id,
			name: r.name,
			location_id: r.location_id,
			location_name: r.location_name,
			capacity_with_tables: r.max_pax_tables,
			capacity_without_tables: r.max_pax_no_tables
		})),
		moderators: moderators.map((m) => ({
			user_id: m.user_id,
			display_name: m.display_name,
			email: m.email
		})),
		locations: locations.map((l) => ({
			value: l.location_id,
			label: l.name
		}))
	};
};
