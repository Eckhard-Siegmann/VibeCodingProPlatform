/**
 * Admin Events repository — event CRUD with stats for admin interface.
 * Spec: Ch.17.3 (Event Management), Ch.29 (Events and Locations)
 * User stories: M1 (Create Event), A16 (Edit Event)
 */

import { getDatabase, generateId, nowIso } from '../db';

// ── Types ────────────────────────────────────────────────────────────

export interface AdminEventRow {
	event_id: string;
	slug: string;
	title: string;
	description: string | null;
	partner_id: string;
	partner_name: string;
	room_id: string;
	room_name: string;
	location_id: string;
	location_name: string;
	host_user_id: string;
	host_name: string;
	co_host_1_user_id: string | null;
	co_host_2_user_id: string | null;
	starts_at: string;
	planned_ends_at: string;
	website_url: string | null;
	linkedin_url: string | null;
	x_post_url: string | null;
	image_url: string | null;
	overbooking_factor: number;
	created_at: string;
	registrations: number;
	capacity: number;
	is_past: boolean;
}

export interface EventCreateData {
	title: string;
	description?: string;
	partner_id: string;
	room_id: string;
	host_user_id: string;
	co_host_1_user_id?: string;
	co_host_2_user_id?: string;
	starts_at: string;
	planned_ends_at: string;
	website_url?: string;
	linkedin_url?: string;
	x_post_url?: string;
	image_url?: string;
	overbooking_factor?: number;
}

export interface ModeratorRow {
	user_id: string;
	display_name: string;
	email: string;
}

// ── Slug Generation ──────────────────────────────────────────────────

function generateSlug(title: string, startsAt: string): string {
	const date = new Date(startsAt);
	const month = date.toLocaleString('en-US', { month: 'short' }).toLowerCase();
	const year = date.getFullYear();

	const base = title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '')
		.slice(0, 50);

	return `${base}-${month}-${year}`;
}

function ensureUniqueSlug(slug: string): string {
	const db = getDatabase();
	let candidate = slug;
	let counter = 1;

	while (db.prepare('SELECT 1 FROM events WHERE slug = ?').get(candidate)) {
		candidate = `${slug}-${counter}`;
		counter++;
	}

	return candidate;
}

// ── Types (Pagination) ──────────────────────────────────────────────

export interface EventListParams {
	page: number;
	pageSize: number;
	search: string;
	status: string;
	location: string;
	sort: string;
}

export interface PaginatedEventResult {
	items: AdminEventRow[];
	pagination: {
		page: number;
		pageSize: number;
		totalItems: number;
		totalPages: number;
	};
}

// ── Listing ──────────────────────────────────────────────────────────

export function listEventsForAdmin(): AdminEventRow[] {
	const db = getDatabase();
	const now = nowIso();

	return db.prepare(`
		SELECT
			e.*,
			p.name AS partner_name,
			r.name AS room_name,
			l.location_id,
			l.name AS location_name,
			u.display_name AS host_name,
			(SELECT COUNT(*) FROM event_registrations er
			 WHERE er.event_id = e.event_id AND er.cancelled_at IS NULL) AS registrations,
			CAST(r.max_pax_no_tables * e.overbooking_factor AS INTEGER) AS capacity,
			CASE WHEN e.starts_at < ? THEN 1 ELSE 0 END AS is_past
		FROM events e
		JOIN partners p ON p.partner_id = e.partner_id
		JOIN rooms r ON r.room_id = e.room_id
		JOIN locations l ON l.location_id = r.location_id
		JOIN users u ON u.user_id = e.host_user_id
		ORDER BY e.starts_at DESC
	`).all(now) as AdminEventRow[];
}

/**
 * List events with server-side pagination, search, and filtering.
 * Spec: Ch.17.3, Ch.12.10 | Ticket: TICKET-30
 */
export function listEventsForAdminPaginated(params: EventListParams): PaginatedEventResult {
	const db = getDatabase();
	const now = nowIso();

	const conditions: string[] = [];
	const args: (string | number)[] = [];

	// Search by title, location, or partner name
	if (params.search) {
		conditions.push('(e.title LIKE ? COLLATE NOCASE OR l.name LIKE ? COLLATE NOCASE OR p.name LIKE ? COLLATE NOCASE)');
		const term = `%${params.search}%`;
		args.push(term, term, term);
	}

	// Status filter
	if (params.status === 'upcoming') {
		conditions.push('e.starts_at >= ?');
		args.push(now);
	} else if (params.status === 'past') {
		conditions.push('e.starts_at < ?');
		args.push(now);
	}

	// Location filter
	if (params.location && params.location !== 'all') {
		conditions.push('l.location_id = ?');
		args.push(params.location);
	}

	const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

	// Sort
	let orderBy = 'e.starts_at DESC';
	switch (params.sort) {
		case 'date_asc': orderBy = 'e.starts_at ASC'; break;
		case 'date_desc': orderBy = 'e.starts_at DESC'; break;
		case 'title_asc': orderBy = 'e.title COLLATE NOCASE ASC'; break;
		case 'registrations': orderBy = 'registrations DESC'; break;
	}

	// Count
	const countRow = db.prepare(`
		SELECT COUNT(*) AS cnt
		FROM events e
		JOIN partners p ON p.partner_id = e.partner_id
		JOIN rooms r ON r.room_id = e.room_id
		JOIN locations l ON l.location_id = r.location_id
		${whereClause}
	`).get(...args) as { cnt: number };
	const totalItems = countRow.cnt;

	// Enforce limits
	const pageSize = Math.min(Math.max(params.pageSize, 1), 100);
	const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
	const page = Math.min(Math.max(params.page, 1), totalPages || 1);
	const offset = (page - 1) * pageSize;

	// Fetch rows
	const rows = db.prepare(`
		SELECT
			e.*,
			p.name AS partner_name,
			r.name AS room_name,
			l.location_id,
			l.name AS location_name,
			u.display_name AS host_name,
			(SELECT COUNT(*) FROM event_registrations er
			 WHERE er.event_id = e.event_id AND er.cancelled_at IS NULL) AS registrations,
			CAST(r.max_pax_no_tables * e.overbooking_factor AS INTEGER) AS capacity,
			CASE WHEN e.starts_at < ? THEN 1 ELSE 0 END AS is_past
		FROM events e
		JOIN partners p ON p.partner_id = e.partner_id
		JOIN rooms r ON r.room_id = e.room_id
		JOIN locations l ON l.location_id = r.location_id
		JOIN users u ON u.user_id = e.host_user_id
		${whereClause}
		ORDER BY ${orderBy}
		LIMIT ? OFFSET ?
	`).all(now, ...args, pageSize, offset) as AdminEventRow[];

	return {
		items: rows,
		pagination: { page, pageSize, totalItems, totalPages }
	};
}

/**
 * Get distinct locations for filter dropdown.
 */
export function getAdminEventLocations(): Array<{ location_id: string; name: string }> {
	const db = getDatabase();
	return db.prepare(`
		SELECT DISTINCT l.location_id, l.name
		FROM events e
		JOIN rooms r ON r.room_id = e.room_id
		JOIN locations l ON l.location_id = r.location_id
		ORDER BY l.name
	`).all() as Array<{ location_id: string; name: string }>;
}

export function getEventForAdmin(eventId: string): AdminEventRow | null {
	const db = getDatabase();
	const now = nowIso();

	const row = db.prepare(`
		SELECT
			e.*,
			p.name AS partner_name,
			r.name AS room_name,
			l.location_id,
			l.name AS location_name,
			u.display_name AS host_name,
			(SELECT COUNT(*) FROM event_registrations er
			 WHERE er.event_id = e.event_id AND er.cancelled_at IS NULL) AS registrations,
			CAST(r.max_pax_no_tables * e.overbooking_factor AS INTEGER) AS capacity,
			CASE WHEN e.starts_at < ? THEN 1 ELSE 0 END AS is_past
		FROM events e
		JOIN partners p ON p.partner_id = e.partner_id
		JOIN rooms r ON r.room_id = e.room_id
		JOIN locations l ON l.location_id = r.location_id
		JOIN users u ON u.user_id = e.host_user_id
		WHERE e.event_id = ?
	`).get(now, eventId);

	return (row as AdminEventRow) ?? null;
}

// ── Create / Update ──────────────────────────────────────────────────

export function createEvent(data: EventCreateData): string {
	const db = getDatabase();
	const id = generateId();
	const now = nowIso();
	const slug = ensureUniqueSlug(generateSlug(data.title, data.starts_at));

	db.prepare(`
		INSERT INTO events (
			event_id, slug, title, description, partner_id, room_id,
			host_user_id, co_host_1_user_id, co_host_2_user_id,
			starts_at, planned_ends_at,
			website_url, linkedin_url, x_post_url, image_url,
			overbooking_factor, created_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`).run(
		id,
		slug,
		data.title,
		data.description ?? null,
		data.partner_id,
		data.room_id,
		data.host_user_id,
		data.co_host_1_user_id ?? null,
		data.co_host_2_user_id ?? null,
		data.starts_at,
		data.planned_ends_at,
		data.website_url ?? null,
		data.linkedin_url ?? null,
		data.x_post_url ?? null,
		data.image_url ?? null,
		data.overbooking_factor ?? 1.30,
		now
	);

	return id;
}

export function updateEvent(eventId: string, data: Partial<EventCreateData>): boolean {
	const db = getDatabase();

	const fields: string[] = [];
	const values: any[] = [];

	if (data.title !== undefined) { fields.push('title = ?'); values.push(data.title); }
	if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description || null); }
	if (data.partner_id !== undefined) { fields.push('partner_id = ?'); values.push(data.partner_id); }
	if (data.room_id !== undefined) { fields.push('room_id = ?'); values.push(data.room_id); }
	if (data.host_user_id !== undefined) { fields.push('host_user_id = ?'); values.push(data.host_user_id); }
	if (data.co_host_1_user_id !== undefined) { fields.push('co_host_1_user_id = ?'); values.push(data.co_host_1_user_id || null); }
	if (data.co_host_2_user_id !== undefined) { fields.push('co_host_2_user_id = ?'); values.push(data.co_host_2_user_id || null); }
	if (data.starts_at !== undefined) { fields.push('starts_at = ?'); values.push(data.starts_at); }
	if (data.planned_ends_at !== undefined) { fields.push('planned_ends_at = ?'); values.push(data.planned_ends_at); }
	if (data.website_url !== undefined) { fields.push('website_url = ?'); values.push(data.website_url || null); }
	if (data.linkedin_url !== undefined) { fields.push('linkedin_url = ?'); values.push(data.linkedin_url || null); }
	if (data.x_post_url !== undefined) { fields.push('x_post_url = ?'); values.push(data.x_post_url || null); }
	if (data.image_url !== undefined) { fields.push('image_url = ?'); values.push(data.image_url || null); }
	if (data.overbooking_factor !== undefined) { fields.push('overbooking_factor = ?'); values.push(data.overbooking_factor); }

	if (fields.length === 0) return false;

	values.push(eventId);
	const result = db.prepare(`UPDATE events SET ${fields.join(', ')} WHERE event_id = ?`).run(...values);
	return result.changes > 0;
}

// ── Moderators ───────────────────────────────────────────────────────

/**
 * List users with moderator or admin role — used to populate host/co-host selects.
 */
export function listModerators(): ModeratorRow[] {
	const db = getDatabase();
	return db.prepare(`
		SELECT user_id, display_name, email
		FROM users
		WHERE role IN ('moderator', 'admin') AND login_enabled = 1
		ORDER BY display_name ASC
	`).all() as ModeratorRow[];
}
