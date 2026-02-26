/**
 * Admin Infrastructure page server loader.
 * Spec: Ch.17.4 (Partner/Location/Room Management) | ADR 002 (SvelteKit)
 * Auth: Admin-only (requireRole).
 */

import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { requireRole } from '$lib/server/auth';
import { listPartners, listLocations, listRooms } from '$lib/server/repositories/admin-infrastructure';

export const load: PageServerLoad = async ({ cookies }) => {
	try {
		requireRole(cookies, ['admin']);
	} catch {
		throw error(403, 'Administrator role required.');
	}

	const partners = listPartners();
	const locations = listLocations();
	const rooms = listRooms();

	return {
		partners: partners.map((p) => ({
			partner_id: p.partner_id,
			name: p.name,
			description: p.description ?? '',
			logo_url: p.logo_url ?? '',
			website_url: p.website_url ?? '',
			contact_name: p.contact_name ?? '',
			contact_email: p.contact_email ?? '',
			partner_type: p.partner_type as 'coworking' | 'university' | 'company' | 'community',
			event_count: p.event_count ?? 0
		})),
		locations: locations.map((l) => ({
			location_id: l.location_id,
			name: l.name,
			address: l.address,
			city: l.city,
			room_count: l.room_count ?? 0
		})),
		rooms: rooms.map((r) => ({
			room_id: r.room_id,
			name: r.name,
			location_id: r.location_id,
			location_name: r.location_name,
			capacity_with_tables: r.max_pax_tables,
			capacity_without_tables: r.max_pax_no_tables
		}))
	};
};
